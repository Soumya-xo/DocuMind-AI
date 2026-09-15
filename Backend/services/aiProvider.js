import { ChatOllama } from "@langchain/ollama";
import { GoogleGenAI } from "@google/genai";

// ─────────────────────────────────────────────────────────────────────────
// Provider abstraction: text generation and streaming, with Ollama always
// tried first and Gemini used ONLY as a fallback for provider-level
// failures (Ollama unreachable, timed out, or returning a server error).
//
// This module is the single place that decides "which LLM answers this
// prompt" for text chat. ragService.js builds prompts/RAG context and calls
// generateText()/streamText() here instead of constructing a ChatOllama
// client itself. visionService.js (image chat) is intentionally NOT routed
// through this module — see the note at the bottom of this file.
// ─────────────────────────────────────────────────────────────────────────

// Unchanged from the previous single-provider setup — same model, same
// baseUrl, same temperature. This is still the only Ollama configuration
// in the codebase; nothing here changes existing Ollama behavior.
const OLLAMA_MODEL = "llama3.2";
const OLLAMA_BASE_URL = "http://127.0.0.1:11434";

// How long we wait for Ollama to start responding before treating it as
// unavailable and falling back to Gemini. Covers the "hangs forever"
// timeout case that a plain try/catch around invoke()/stream() wouldn't
// catch on its own (a dead/overloaded Ollama can simply never respond
// rather than erroring). Advanced/rarely-needed override, so — like
// RAG_MAX_L2_DISTANCE elsewhere in this codebase — it's an env var rather
// than a constant, but isn't part of the normal .env.example setup.
const OLLAMA_TIMEOUT_MS = process.env.OLLAMA_TIMEOUT_MS
  ? parseInt(process.env.OLLAMA_TIMEOUT_MS, 10)
  : 20000;

// Gemini Flash-class model, free-tier friendly. Overridable without a code
// change in case a newer/renamed Flash model becomes the better default.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Backup Gemini model used only when GEMINI_MODEL itself is temporarily
// unavailable (503/UNAVAILABLE) after retries — see streamWithGemini below.
const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-3.6-flash";

// Total attempts against the PRIMARY Gemini model before giving up on it and
// trying the fallback model once. 3 attempts = 1 initial try + 2 retries.
const GEMINI_MAX_ATTEMPTS = 3;

// Base delay for the exponential backoff between primary-model retries:
// attempt 1 -> ~1s, attempt 2 -> ~2s (base * 2^(attempt-1)), each with a
// little random jitter added so concurrent requests don't retry in lockstep.
const GEMINI_RETRY_BASE_DELAY_MS = 1000;

const getOllamaLLM = () =>
  new ChatOllama({
    model: OLLAMA_MODEL,
    baseUrl: OLLAMA_BASE_URL,
    temperature: 0.2,
  });

let geminiClient = null;

// Constructed lazily (only when actually needed, i.e. Ollama has already
// failed) so a missing GEMINI_API_KEY never matters on the normal,
// Ollama-available path.
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const err = new Error(
      "Gemini fallback is not configured (GEMINI_API_KEY is not set).",
    );
    err.name = "GeminiNotConfiguredError";
    throw err;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
};

// Raised when neither provider could answer. Message is always a generic,
// user-safe string — never provider internals (status codes, connection
// details, or anything that could hint at API key state).
class AIProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "AIProviderError";
  }
}

// Ollama's own client (the `ollama` npm package, used under the hood by
// @langchain/ollama) throws:
//   - a plain TypeError("fetch failed") with `.cause.code` set to a
//     network error code (ECONNREFUSED when nothing is listening,
//     ENOTFOUND/EHOSTUNREACH/ETIMEDOUT/ECONNRESET for other connectivity
//     failures) when the server can't be reached at all, or
//   - a `ResponseError` (name/constructor "ResponseError", `.status_code`
//     set) when Ollama responds but with a non-2xx status.
// Both are verified empirically against the installed package version,
// not guessed from docs. Either case means the PROVIDER had a problem —
// never something our own code did — so both are fallback-eligible.
// Anything else (a bug in our prompt-building, a message-shape error from
// langchain, etc.) is deliberately NOT matched here and propagates
// normally instead of triggering a silent fallback.
const NETWORK_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "EAI_AGAIN",
]);

const isOllamaProviderError = (err) => {
  if (!err) return false;

  // Our own explicit "Ollama took too long to respond" guard, below.
  if (err.name === "OllamaTimeoutError") return true;

  // ollama npm client's structured HTTP error — any non-2xx status from
  // Ollama itself is a provider problem, regardless of the specific code.
  if (err.name === "ResponseError" || err.constructor?.name === "ResponseError") {
    return true;
  }

  const causeCode = err.cause?.code || err.code;
  if (causeCode && NETWORK_ERROR_CODES.has(causeCode)) return true;

  if (err.name === "TypeError" && /fetch failed/i.test(err.message || "")) {
    return true;
  }

  return false;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Adds up to ~30% random jitter on top of a backoff delay so that many
// concurrent requests retrying at once don't all hit Gemini again at the
// exact same instant.
const withJitter = (ms) => Math.round(ms + Math.random() * ms * 0.3);

// True only for errors indicating a TEMPORARY problem with the Gemini
// service itself (503/UNAVAILABLE/other 5xx) — never for client-side
// errors (bad API key, bad/unknown model name, malformed request), which
// must fail immediately instead of being retried or falling back. The
// @google/genai SDK throws an `ApiError` with a numeric `.status` (the HTTP
// status code) and a `.message` that is the JSON-stringified error body
// from the API, which for 5xx responses typically includes a `status` field
// such as "UNAVAILABLE" — both are checked since either can be present.
const isRetryableGeminiError = (err) => {
  if (!err) return false;

  if (typeof err.status === "number") {
    return err.status >= 500 && err.status < 600;
  }

  const message = err.message || "";
  if (/\bUNAVAILABLE\b/i.test(message)) return true;
  if (/temporarily unavailable|service unavailable/i.test(message)) return true;
  if (/"code"\s*:\s*5\d{2}\b/.test(message)) return true;

  return false;
};

const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} did not respond within ${ms}ms`);
      err.name = "OllamaTimeoutError";
      reject(err);
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const extractText = (response) => {
  const content = typeof response === "string" ? response : response?.content;
  return typeof content === "string" ? content : String(content ?? "");
};

// Calls Gemini's non-streaming generateContent for `model` and returns the
// text. Kept separate from generateWithGemini so both the primary model
// (with retries) and the fallback model (tried once) can use the exact same
// call logic below.
async function callGeminiModel(model, prompt) {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

/**
 * Generate a complete response from the primary Gemini model (GEMINI_MODEL),
 * with the same resilience to temporary 503/UNAVAILABLE errors as
 * streamWithGemini:
 *
 *   - Retry the primary model with bounded exponential backoff + jitter, up
 *     to GEMINI_MAX_ATTEMPTS attempts total, but only for retryable errors.
 *   - If the primary model is still failing with a retryable error after
 *     those attempts, try GEMINI_FALLBACK_MODEL once.
 *   - A non-retryable error (bad API key, bad model, 4xx, ...) is thrown
 *     immediately with no retry and no fallback.
 */
async function generateWithGemini(prompt) {
  let lastErr;

  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    try {
      return await callGeminiModel(GEMINI_MODEL, prompt);
    } catch (err) {
      lastErr = err;

      if (!isRetryableGeminiError(err) || attempt === GEMINI_MAX_ATTEMPTS) {
        break;
      }

      const delay = withJitter(GEMINI_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      console.warn(
        `[aiProvider] Gemini primary attempt ${attempt} failed with ${err.status || err.name}, retrying in ~${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  if (!isRetryableGeminiError(lastErr)) {
    throw lastErr;
  }

  console.warn(
    `[aiProvider] Gemini primary exhausted retries, using fallback model ${GEMINI_FALLBACK_MODEL}`,
  );

  const text = await callGeminiModel(GEMINI_FALLBACK_MODEL, prompt);

  console.warn("[aiProvider] Gemini fallback succeeded");

  return text;
}

// Opens a Gemini stream for `model` and yields non-empty text chunks. Kept
// separate from streamWithGemini so both the primary model (with retries)
// and the fallback model (tried once) can use the exact same streaming
// logic below.
async function* streamGeminiModel(model, prompt) {
  const ai = getGeminiClient();

  const stream = await ai.models.generateContentStream({
    model,
    contents: prompt,
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

/**
 * Stream from the primary Gemini model (GEMINI_MODEL), with resilience to
 * temporary 503/UNAVAILABLE errors:
 *
 *   - If opening the stream / getting its first chunk fails with a
 *     retryable error, retry the primary model with bounded exponential
 *     backoff + jitter, up to GEMINI_MAX_ATTEMPTS attempts total.
 *   - If the primary model is still failing with a retryable error after
 *     those attempts, try GEMINI_FALLBACK_MODEL once.
 *   - A non-retryable error (bad API key, bad model, 4xx, ...) is thrown
 *     immediately with no retry and no fallback.
 *
 * Critically, this retry/fallback logic only ever applies BEFORE any output
 * has been produced. As soon as a model successfully yields its first
 * chunk, this function commits to that stream for the rest of the
 * response — a failure partway through is surfaced as a normal stream
 * error, never a trigger to restart with another model (which could
 * duplicate or corrupt what's already been streamed to the client).
 */
async function* streamWithGemini(prompt) {
  let lastErr;

  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    const iterator = streamGeminiModel(GEMINI_MODEL, prompt)[Symbol.asyncIterator]();
    let first;

    try {
      first = await iterator.next();
    } catch (err) {
      lastErr = err;

      if (!isRetryableGeminiError(err) || attempt === GEMINI_MAX_ATTEMPTS) {
        break;
      }

      const delay = withJitter(GEMINI_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      console.warn(
        `[aiProvider] Gemini primary attempt ${attempt} failed with ${err.status || err.name}, retrying in ~${delay}ms...`,
      );
      await sleep(delay);
      continue;
    }

    // Primary model produced (or ended with) a result without erroring —
    // committed to it. No retry/fallback can happen past this point.
    if (!first.done) yield first.value;
    for await (const text of { [Symbol.asyncIterator]: () => iterator }) {
      yield text;
    }
    return;
  }

  if (!isRetryableGeminiError(lastErr)) {
    throw lastErr;
  }

  console.warn(
    `[aiProvider] Gemini primary exhausted retries, using fallback model ${GEMINI_FALLBACK_MODEL}`,
  );

  const fallbackIterator = streamGeminiModel(GEMINI_FALLBACK_MODEL, prompt)[Symbol.asyncIterator]();
  const first = await fallbackIterator.next();

  console.warn("[aiProvider] Gemini fallback succeeded");

  if (!first.done) yield first.value;
  for await (const text of { [Symbol.asyncIterator]: () => fallbackIterator }) {
    yield text;
  }
}

/**
 * Generate a complete text response for `prompt`. Tries Ollama first;
 * falls back to Gemini only on a provider-level Ollama failure (see
 * isOllamaProviderError). Any other error (e.g. a bug upstream in prompt
 * construction) propagates unchanged — it is never silently retried on a
 * different provider.
 *
 * Returns { text, provider: "ollama" | "gemini" }.
 */
export async function generateText(prompt) {
  try {
    const llm = getOllamaLLM();
    const response = await withTimeout(
      llm.invoke(prompt),
      OLLAMA_TIMEOUT_MS,
      "Ollama",
    );

    return { text: extractText(response).trim(), provider: "ollama" };
  } catch (err) {
    if (!isOllamaProviderError(err)) throw err;

    console.warn(
      `⚠️ [aiProvider] Ollama unavailable (${err.name}: ${err.message}) — falling back to Gemini.`,
    );

    try {
      const text = await generateWithGemini(prompt);
      return { text: text.trim(), provider: "gemini" };
    } catch (geminiErr) {
      console.error(
        `❌ [aiProvider] Gemini fallback also failed: ${geminiErr.name}: ${geminiErr.message}`,
      );
      throw new AIProviderError(
        "The AI service is temporarily unavailable. Please try again in a moment.",
      );
    }
  }
}

/**
 * Stream a text response for `prompt` as an async generator of string
 * chunks. Tries Ollama first. If Ollama fails before producing even its
 * first chunk (provider-level failure only), falls back to streaming from
 * Gemini instead — the caller sees one continuous stream either way.
 *
 * Once Ollama has successfully produced its first chunk, this commits to
 * Ollama for the rest of the response: a failure partway through a
 * response that already started is surfaced as a normal stream error, not
 * a fallback trigger — restarting with a different provider mid-answer
 * would duplicate or corrupt what the user has already seen.
 */
export async function* streamText(prompt) {
  let iterator = null;
  let firstChunkText = "";

  try {
    const llm = getOllamaLLM();
    const stream = await withTimeout(
      llm.stream(prompt),
      OLLAMA_TIMEOUT_MS,
      "Ollama",
    );

    iterator = stream[Symbol.asyncIterator]();

    const first = await withTimeout(
      iterator.next(),
      OLLAMA_TIMEOUT_MS,
      "Ollama",
    );

    if (first.done) {
      iterator = null;
    } else {
      firstChunkText = extractText(first.value);
    }
  } catch (err) {
    if (!isOllamaProviderError(err)) throw err;

    console.warn(
      `⚠️ [aiProvider] Ollama unavailable before producing any output (${err.name}: ${err.message}) — falling back to Gemini streaming.`,
    );

    try {
      for await (const text of streamWithGemini(prompt)) {
        if (text) yield text;
      }
    } catch (geminiErr) {
      console.error(
        `❌ [aiProvider] Gemini streaming fallback also failed: ${geminiErr.name}: ${geminiErr.message}`,
      );
      throw new AIProviderError(
        "The AI service is temporarily unavailable. Please try again in a moment.",
      );
    }
    return;
  }

  // Ollama produced at least one chunk (or ended immediately with none) —
  // committed. Nothing below this point can trigger a Gemini fallback.
  if (firstChunkText) yield firstChunkText;

  if (iterator) {
    for await (const chunk of { [Symbol.asyncIterator]: () => iterator }) {
      const text = extractText(chunk);
      if (text) yield text;
    }
  }
}

export const getTextProviderConfig = () => ({
  ollamaModel: OLLAMA_MODEL,
  geminiModel: GEMINI_MODEL,
});

// ─────────────────────────────────────────────────────────────────────────
// Image/vision chat: NOT routed through this module.
//
// visionService.js keeps its own direct ChatOllama (llava:7b) integration,
// unchanged. Reasoning:
//   - Gemini's vision input shape (inline image bytes in the `contents`
//     array) is different enough from LangChain's HumanMessage image_url
//     content part that reusing generateText/streamText cleanly would mean
//     either bending this module's text-only API around image bytes, or
//     duplicating provider-selection logic in a second, image-aware form —
//     both riskier than the value it adds here.
//   - The task this module was added for explicitly allows deferring vision
//     fallback when the existing image pipeline is tightly coupled to
//     Ollama, rather than forcing a rewrite of the working LLaVA path.
//
// LIMITATION: if Ollama is unavailable, image chat currently has no
// fallback and will fail outright (same as before this change). Text chat
// (this module) does fall back correctly. Adding Gemini vision support
// would mean a small, separate addition to visionService.js — deliberately
// left out of this change to avoid touching the working image pipeline.
