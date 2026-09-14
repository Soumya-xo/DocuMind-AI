import { OllamaEmbeddings } from "@langchain/ollama";
import { GoogleGenAI } from "@google/genai";
import { Embeddings } from "@langchain/core/embeddings";

// ─────────────────────────────────────────────────────────────────────────
// Embedding provider abstraction: decides which embedding model turns text
// into vectors for FAISS indexing/retrieval. Mirrors the shape of
// aiProvider.js (text generation), but intentionally does NOT fall back
// between providers — Nomic and Gemini vectors are not interchangeable, so
// silently switching mid-operation would poison a FAISS index. Ollama and
// Gemini embeddings are always stored in separate FAISS stores (see
// ragService.js); this module only decides which embeddings CLIENT is
// active, not where its vectors are stored.
//
// AI_EMBEDDING_PROVIDER=ollama (default) | gemini
// ─────────────────────────────────────────────────────────────────────────

export const OLLAMA_EMBEDDING_PROVIDER = "ollama";
export const GEMINI_EMBEDDING_PROVIDER = "gemini";

// Unchanged from the previous single-provider setup — same model, same
// baseUrl as before this abstraction existed.
const OLLAMA_EMBEDDING_MODEL = "nomic-embed-text";
const OLLAMA_BASE_URL = "http://127.0.0.1:11434";

// Gemini's current general-availability text embedding model on the Gemini
// Developer API (verified against the installed @google/genai package,
// which special-cases this exact model id in its request-shaping logic).
// Overridable without a code change in case a newer embedding model
// becomes the better default — same pattern as GEMINI_MODEL in
// aiProvider.js.
const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

// The Gemini Developer API's embedContent endpoint accepts a batch of
// strings per call but caps how many it will accept at once. Kept
// conservative and applied client-side so indexing a large document never
// depends on guessing the server's exact limit.
const GEMINI_EMBED_BATCH_SIZE = 100;

/**
 * Resolve the active embedding provider name from the environment.
 * Defaults to "ollama" (preserves existing local behavior) whenever
 * AI_EMBEDDING_PROVIDER is unset or unrecognized.
 */
export const getActiveEmbeddingProviderName = () => {
  const raw = (process.env.AI_EMBEDDING_PROVIDER || "").trim().toLowerCase();

  if (raw === GEMINI_EMBEDDING_PROVIDER) return GEMINI_EMBEDDING_PROVIDER;

  if (raw && raw !== OLLAMA_EMBEDDING_PROVIDER) {
    console.warn(
      `⚠️ [embeddingProvider] Unknown AI_EMBEDDING_PROVIDER="${raw}" — defaulting to "${OLLAMA_EMBEDDING_PROVIDER}".`,
    );
  }

  return OLLAMA_EMBEDDING_PROVIDER;
};

/** The embedding model name for a given (or the active) provider. Used for
 * per-store metadata — never logs or returns anything secret. */
export const getEmbeddingModelName = (
  providerName = getActiveEmbeddingProviderName(),
) =>
  providerName === GEMINI_EMBEDDING_PROVIDER
    ? GEMINI_EMBEDDING_MODEL
    : OLLAMA_EMBEDDING_MODEL;

let geminiClient = null;

// Constructed lazily, and only when the Gemini embedding provider is
// actually selected, so a missing GEMINI_API_KEY never matters on the
// default Ollama path. Deliberately does NOT fall back to Ollama on a
// missing key — mixing embedding providers within one FAISS index silently
// corrupts retrieval, so this must fail loudly instead.
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const err = new Error(
      "Gemini embeddings are not configured (GEMINI_API_KEY is not set). " +
        "Set AI_EMBEDDING_PROVIDER=ollama for local development, or configure " +
        "GEMINI_API_KEY to use Gemini embeddings.",
    );
    err.name = "GeminiEmbeddingNotConfiguredError";
    throw err;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
};

/**
 * LangChain-compatible Embeddings implementation backed by @google/genai's
 * models.embedContent — the same package already used for Gemini text
 * generation in aiProvider.js, reused here rather than adding a second
 * Google SDK. Batches requests client-side (GEMINI_EMBED_BATCH_SIZE) and
 * tags each call with the appropriate taskType, since Gemini's embedding
 * models are trained to expect document- vs query-shaped inputs to differ
 * (Ollama/Nomic has no equivalent distinction, so embedQuery/embedDocuments
 * are otherwise symmetric there).
 */
class GeminiEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  async _embedBatch(texts, taskType) {
    const ai = getGeminiClient();
    const vectors = [];

    for (let i = 0; i < texts.length; i += GEMINI_EMBED_BATCH_SIZE) {
      const batch = texts.slice(i, i + GEMINI_EMBED_BATCH_SIZE);

      const response = await ai.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: batch,
        config: { taskType },
      });

      if (!response.embeddings || response.embeddings.length !== batch.length) {
        throw new Error(
          "Gemini embedding response did not match the number of inputs.",
        );
      }

      for (const embedding of response.embeddings) {
        if (!Array.isArray(embedding.values)) {
          throw new Error("Gemini embedding response is missing vector values.");
        }
        vectors.push(embedding.values);
      }
    }

    return vectors;
  }

  async embedDocuments(documents) {
    return this._embedBatch(documents, "RETRIEVAL_DOCUMENT");
  }

  async embedQuery(document) {
    const [vector] = await this._embedBatch([document], "RETRIEVAL_QUERY");
    return vector;
  }
}

/**
 * Build the embeddings client for a given (or the active) provider. This is
 * the ONLY place that constructs an embeddings object — callers must never
 * instantiate OllamaEmbeddings/GeminiEmbeddings directly, so provider
 * selection stays centralized here.
 */
export const getEmbeddings = (
  providerName = getActiveEmbeddingProviderName(),
) => {
  if (providerName === GEMINI_EMBEDDING_PROVIDER) {
    // Validate eagerly (not just on first embed call) so a misconfigured
    // Gemini provider fails immediately with a clear error instead of
    // deep inside a FAISS operation.
    getGeminiClient();
    return new GeminiEmbeddings();
  }

  return new OllamaEmbeddings({
    model: OLLAMA_EMBEDDING_MODEL,
    baseUrl: OLLAMA_BASE_URL,
  });
};

export const getEmbeddingProviderConfig = () => {
  const provider = getActiveEmbeddingProviderName();
  return { provider, model: getEmbeddingModelName(provider) };
};
