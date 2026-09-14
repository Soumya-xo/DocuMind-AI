import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import PDF from "../models/PDF.js";
import fs from "fs";
import { fileURLToPath } from "url";
import { generateText, streamText } from "../services/aiProvider.js";
import {
  getActiveEmbeddingProviderName,
  getEmbeddings,
  getEmbeddingModelName,
  OLLAMA_EMBEDDING_PROVIDER,
} from "../services/embeddingProvider.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VECTORSTORE_DIR = path.join(__dirname, "../vectorstore");

if (!fs.existsSync(VECTORSTORE_DIR)) {
  fs.mkdirSync(VECTORSTORE_DIR, { recursive: true });
}

// Provider-specific FAISS storage. Nomic and Gemini vectors are different
// dimensionality/semantics and must never share an index (see
// embeddingProvider.js), so each provider gets its own store directory.
//
// LEGACY COMPATIBILITY: every vector store that existed before this
// abstraction lived flat at vectorstore/user_<id>/ and was always built
// with Ollama/Nomic. Rather than migrating those files (risking data loss
// for a working index), the flat path is simply recognized AS the Ollama
// store going forward. Any other provider (currently just Gemini) gets its
// own nested subdirectory instead, so it can never collide with the legacy
// path. No existing file is moved, renamed, or deleted by this change.
const getUserVectorStorePath = (userId, providerName) => {
  const userDir = path.join(VECTORSTORE_DIR, `user_${userId}`);

  return providerName === OLLAMA_EMBEDDING_PROVIDER
    ? userDir
    : path.join(userDir, providerName);
};

// Per-store metadata sidecar recording which embedding provider/model built
// it — written after every successful save, and checked before every load.
// Legacy Ollama stores predate this file, so a missing meta.json is treated
// as "assumed Ollama" rather than an error (see assertStoreProviderMatches),
// and gets a meta.json of its own the next time it's saved.
const METADATA_FILENAME = "embedding-meta.json";

const readStoreMetadata = (storePath) => {
  const metaPath = path.join(storePath, METADATA_FILENAME);

  if (!fs.existsSync(metaPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return null;
  }
};

const writeStoreMetadata = (storePath, providerName) => {
  const metaPath = path.join(storePath, METADATA_FILENAME);

  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        embeddingProvider: providerName,
        embeddingModel: getEmbeddingModelName(providerName),
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
};

// Refuses to load a store whose recorded provider doesn't match the one
// about to query/rebuild it. This is the hard safety net against ever
// loading a Gemini index with Nomic embeddings (or vice versa) — mismatched
// dimensionality would throw deep inside FAISS at best, or silently return
// garbage nearest-neighbors at worst.
const assertStoreProviderMatches = (storePath, providerName) => {
  const meta = readStoreMetadata(storePath);

  if (meta?.embeddingProvider && meta.embeddingProvider !== providerName) {
    throw new Error(
      `Vector store at "${storePath}" was built with embedding provider ` +
        `"${meta.embeddingProvider}" but the active provider is ` +
        `"${providerName}". Refusing to load it to avoid mixing incompatible ` +
        `embeddings. Set AI_EMBEDDING_PROVIDER back to "${meta.embeddingProvider}", ` +
        `or re-index this user's documents under the new provider.`,
    );
  }
};

const FAISS_INDEX_FILENAME = "faiss.index";
const FAISS_DOCSTORE_FILENAME = "docstore.json";

// A directory "existing" is not the same as a FAISS store existing at that
// path: the legacy Ollama path IS the shared user_<id> directory, which may
// exist purely because a Gemini store lives in a nested subfolder beneath
// it. Always check for the index file itself, never just the directory.
const hasVectorStore = (storePath) =>
  fs.existsSync(path.join(storePath, FAISS_INDEX_FILENAME));

// Deletes a provider's vector store without disturbing a sibling provider's
// data. The legacy Ollama store's path is the shared user_<id> directory
// (see getUserVectorStorePath) which may also hold another provider's
// nested subdirectory — so clearing it must remove only the Ollama store's
// own known files, never the whole directory. Any other provider's store
// lives in its own dedicated subdirectory, so removing that whole directory
// is safe and leaves the legacy Ollama files (one level up) untouched.
const removeVectorStore = (storePath, providerName) => {
  if (providerName === OLLAMA_EMBEDDING_PROVIDER) {
    for (const filename of [
      FAISS_INDEX_FILENAME,
      FAISS_DOCSTORE_FILENAME,
      METADATA_FILENAME,
    ]) {
      const filePath = path.join(storePath, filename);
      if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
    }
    return;
  }

  fs.rmSync(storePath, { recursive: true, force: true });
};

/**

* Add a document's pages to the vector store.
* pageTexts: [{ pageNumber: number|null, text: string }]
  (pageNumber is null for formats without real page boundaries.)
  */
export const addPDFToVectorStore = async (userId, pageTexts, pdfId, fileName) => {
  try {
    console.log(`🔧 addPDFToVectorStore: userId=${userId}, file=${fileName}`);

    if (!Array.isArray(pageTexts) || pageTexts.length === 0) {
      throw new Error("PDF text is empty");
    }

    const providerName = getActiveEmbeddingProviderName();
    const embeddings = getEmbeddings(providerName);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Chunk each page independently so a single chunk never straddles a
    // page boundary — this is what makes pageNumber reliable per chunk,
    // and as a side effect keeps each chunk topically coherent.
    let docs = [];
    let runningChunkIndex = 0;

    for (const page of pageTexts) {
      if (!page.text || page.text.trim().length === 0) continue;

      const pageDocs = await splitter.createDocuments(
        [page.text],
        [
          {
            pdfId: pdfId.toString(),
            // documentId is an explicit alias for pdfId — this is the stable
            // Mongo _id used everywhere for per-document filtering.
            documentId: pdfId.toString(),
            fileName,
            userId: userId.toString(),
            pageNumber: page.pageNumber ?? null,
          },
        ],
      );

      pageDocs.forEach((doc) => {
        doc.metadata.chunkIndex = runningChunkIndex;
        runningChunkIndex += 1;
      });

      docs = docs.concat(pageDocs);
    }

    if (docs.length === 0) {
      throw new Error("PDF text is empty");
    }

    console.log(`Created ${docs.length} chunks across ${pageTexts.length} page(s)`);
    console.log(`🔧 Embedding provider: ${providerName}`);

    const storePath = getUserVectorStorePath(userId, providerName);

    let vectorStore;

    if (hasVectorStore(storePath)) {
      console.log("Loading existing vector store");

      assertStoreProviderMatches(storePath, providerName);

      vectorStore = await FaissStore.load(storePath, embeddings);

      await vectorStore.addDocuments(docs);
    } else {
      console.log("Creating new vector store");

      vectorStore = await FaissStore.fromDocuments(docs, embeddings);
    }

    await vectorStore.save(storePath);

    writeStoreMetadata(storePath, providerName);

    console.log(`Saved vector store to ${storePath}`);

    return {
      success: true,
      chunks: docs.length,
    };
  } catch (error) {
    console.error("❌ addPDFToVectorStore error:", error.message);
    throw error;
  }
};

/**
 * Retrieve and assemble relevant document context for a question, without
 * invoking any LLM. Factored out of queryVectorStore so other callers (e.g.
 * the vision/image chat path) can reuse the exact same retrieval, filtering,
 * dedup, and ordering logic instead of re-implementing or bypassing it.
 *
 * Returns { context: null, ... } when there's no vector store yet, or when
 * nothing relevant survives filtering — callers decide what to do in that
 * case (queryVectorStore falls back to AI-only / a "no match" message; the
 * vision path simply proceeds without document context).
 */
export const getRelevantContext = async (
  userId,
  question,
  selectedDocIds = [],
  { topK: topKOverride } = {},
) => {
  const hasDocFilter =
    Array.isArray(selectedDocIds) && selectedDocIds.length > 0;

  if (hasDocFilter) {
    console.log(`📌 Document filter active: ${selectedDocIds.join(", ")}`);
  }

  const providerName = getActiveEmbeddingProviderName();
  const storePath = getUserVectorStorePath(userId, providerName);

  if (!hasVectorStore(storePath)) {
    return { context: null, sourcePDFs: [], sources: [], hasDocFilter };
  }

  assertStoreProviderMatches(storePath, providerName);

  const isAnalysisQuery =
    question.toLowerCase().includes("compare") ||
    question.toLowerCase().includes("difference") ||
    question.toLowerCase().includes("diff") ||
    question.toLowerCase().includes("similar") ||
    question.toLowerCase().includes("common") ||
    question.toLowerCase().includes("analyze") ||
    question.toLowerCase().includes("summary");

  const embeddings = getEmbeddings(providerName);

  const vectorStore = await FaissStore.load(storePath, embeddings);

  const topK = topKOverride ?? (isAnalysisQuery ? 20 : 8);

  // NOTE: @langchain/community's FaissStore does not support native
  // metadata filtering in similaritySearch(). To restrict results to
  // specific document(s), we over-fetch a larger candidate pool and then
  // filter by doc.metadata.pdfId in application code before trimming back
  // down to the normal topK. When no filter is selected ("All Documents"),
  // the over-fetch pool is smaller since nothing needs to be discarded by
  // document.
  const overFetchK = hasDocFilter
    ? Math.max(topK * 15, 150)
    : Math.max(topK * 4, 40);

  // similaritySearchWithScore returns [Document, score][] where `score` is
  // the raw FAISS L2 distance (this store uses the default IndexFlatL2
  // index) — LOWER = MORE similar. It is NOT a 0–1 cosine similarity or
  // confidence value, so it must never be compared against a "> 0.7"-style
  // threshold. Results come back pre-sorted ascending by distance.
  const scoredCandidates = await vectorStore.similaritySearchWithScore(
    question,
    overFetchK,
  );

  // Log real scores so a relevance threshold can be tuned from actual data
  // instead of guessed. This is intentionally always-on (not a debug flag)
  // since there's no way to pick a good RAG_MAX_L2_DISTANCE value below
  // without first seeing what real distances look like for this corpus and
  // embedding model (nomic-embed-text).
  console.log(
    `📊 Top candidate L2 distances for "${question}" (lower = more relevant):`,
    scoredCandidates.slice(0, 10).map(([doc, score]) => ({
      file: doc.metadata.fileName,
      page: doc.metadata.pageNumber,
      distance: Number(score.toFixed(4)),
    })),
  );

  let candidates = scoredCandidates;

  if (hasDocFilter) {
    candidates = candidates.filter(([doc]) =>
      selectedDocIds.includes(doc.metadata.pdfId),
    );
  }

  // Optional relevance floor. OFF by default — we deliberately do not
  // invent a "confident" cutoff here. Once you've reviewed the logged
  // distances above for your real corpus, set RAG_MAX_L2_DISTANCE (an
  // env var, no code change needed) to start dropping candidates whose
  // distance exceeds it, e.g. RAG_MAX_L2_DISTANCE=1.8.
  const maxDistance = process.env.RAG_MAX_L2_DISTANCE
    ? parseFloat(process.env.RAG_MAX_L2_DISTANCE)
    : null;

  if (maxDistance !== null && !Number.isNaN(maxDistance)) {
    candidates = candidates.filter(([, score]) => score <= maxDistance);
  }

  // Relative relevance floor. A retrieved candidate must NOT automatically
  // become context/a citation just because topK slots exist — otherwise a
  // simple question against a small document (fewer genuinely relevant
  // chunks than topK) gets padded out with whatever the next-nearest, but
  // meaningfully worse, candidates happen to be, even from unrelated
  // documents. Anchoring the margin to THIS query's own best match (rather
  // than a fixed absolute distance) keeps it self-calibrating per query and
  // per embedding provider — nothing here is tuned to a specific document,
  // question, or embedding model, so it needs no retuning across
  // Ollama/Gemini. Analysis-style questions get a looser margin since they
  // legitimately need broader multi-document/multi-page coverage; ordinary
  // factual questions get a tight margin so one clearly-best page isn't
  // diluted by a padded-out topK.
  const RELEVANCE_MARGIN = isAnalysisQuery ? 0.5 : 0.15;

  if (candidates.length > 0) {
    const bestDistance = candidates[0][1];
    const relevanceCutoff = bestDistance * (1 + RELEVANCE_MARGIN);

    candidates = candidates.filter(([, score]) => score <= relevanceCutoff);
  }

  // Candidates are still ordered nearest-first here — select the final
  // top-K by relevance BEFORE any display reordering below, so relevance
  // (not filename/page order) is what decides which chunks make the cut.
  let selected = candidates.slice(0, topK);

  if (selected.length === 0) {
    console.log(
      hasDocFilter
        ? "No chunks matched the selected document(s) (or none passed the relevance floor)."
        : "No sufficiently relevant chunks found for this question.",
    );

    return { context: null, sourcePDFs: [], sources: [], hasDocFilter };
  }

  // Reduce redundant/near-duplicate chunks. With chunkOverlap: 200 on
  // 1000-char chunks, adjacent chunks legitimately repeat content, and
  // repeats cluster on the same page. Capping chunks-per-page keeps one
  // dense page from crowding out everything else, without needing an
  // embedding-similarity dedup pass.
  const MAX_CHUNKS_PER_PAGE = 3;
  const perPageCount = new Map();
  const deduped = [];

  for (const candidate of selected) {
    const [doc] = candidate;
    const pageKey = `${doc.metadata.fileName}::${doc.metadata.pageNumber}`;
    const count = perPageCount.get(pageKey) || 0;

    if (count >= MAX_CHUNKS_PER_PAGE) continue;

    perPageCount.set(pageKey, count + 1);
    deduped.push(candidate);
  }

  selected = deduped;

  // Order the final context naturally (fileName, then pageNumber, then
  // chunkIndex) so multi-page answers read in a coherent order for the
  // LLM. This happens strictly AFTER relevance-based selection above, so
  // it only changes presentation order, never which chunks were chosen.
  const ordered = [...selected].sort(([a], [b]) => {
    if (a.metadata.fileName !== b.metadata.fileName) {
      return a.metadata.fileName.localeCompare(b.metadata.fileName);
    }

    const pageA = a.metadata.pageNumber ?? -1;
    const pageB = b.metadata.pageNumber ?? -1;

    if (pageA !== pageB) return pageA - pageB;

    return (a.metadata.chunkIndex ?? 0) - (b.metadata.chunkIndex ?? 0);
  });

  const relevantDocs = ordered.map(([doc]) => doc);

  console.log(
    `Found ${relevantDocs.length} relevant chunks (after filtering + relevance + dedup)`,
  );

  const context = relevantDocs
    .map((doc, index) => {
      const pageLabel =
        doc.metadata.pageNumber != null
          ? ` (Page ${doc.metadata.pageNumber})`
          : "";

      return `

Document: ${doc.metadata.fileName}${pageLabel}

Chunk ${index + 1}:
${doc.pageContent}
`;
    })
    .join("\n\n----------------\n\n");

  const sourcePDFs = [
    ...new Set(relevantDocs.map((doc) => doc.metadata.fileName)),
  ];

  // Structured citations — built ONLY from the chunks that actually made
  // it into `context` above, never from anything the LLM itself claims.
  // Deduplicated by documentId + pageNumber, per spec.
  const sources = [];
  const seenSourceKeys = new Set();

  for (const doc of relevantDocs) {
    const sourceKey = `${doc.metadata.pdfId}::${doc.metadata.pageNumber}`;

    if (seenSourceKeys.has(sourceKey)) continue;
    seenSourceKeys.add(sourceKey);

    sources.push({
      fileName: doc.metadata.fileName,
      pageNumber: doc.metadata.pageNumber ?? null,
      documentId: doc.metadata.pdfId,
      chunkIndex: doc.metadata.chunkIndex,
    });
  }

  // One entry per numbered chunk that actually made it into `context`
  // (chunkNumber matches the "Chunk N" label used above), for callers that
  // want to narrow sources down to only the chunks the LLM's answer itself
  // references — see narrowSourcesByAnswer below. Purely additive; existing
  // callers that only destructure {context, sourcePDFs, sources, hasDocFilter}
  // are unaffected.
  const chunkMap = relevantDocs.map((doc, index) => ({
    chunkNumber: index + 1,
    fileName: doc.metadata.fileName,
    pageNumber: doc.metadata.pageNumber ?? null,
    documentId: doc.metadata.pdfId,
    chunkIndex: doc.metadata.chunkIndex,
  }));

  return { context, sourcePDFs, sources, hasDocFilter, chunkMap };
};

// A retrieved-and-relevance-passing candidate can still end up in `context`
// without the LLM actually relying on it to answer (it may have been
// included only for the model's own disambiguation). To guarantee sources
// reflect actual use — not just retrieval — buildGroundedPrompt requires
// the model to end every answer with a mandatory, machine-parseable marker
// line naming exactly which chunk numbers it relied on. An earlier version
// of this only asked the model to OPTIONALLY mention a chunk number in
// prose ("see Chunk 2") — that turned out unreliable in practice (the same
// question, asked twice, answered with and without a chunk mention), so
// the marker is now a required, fixed-format last line instead of a
// narrative aside.
// Lenient on purpose: small local models don't always reproduce the exact
// literal string (observed in testing: "CHUNKSUSED:" with the underscore
// dropped). Tolerates an optional underscore/space between the two words
// and optional markdown bold markers around the label — but keeps the
// colon mandatory, so an ordinary English sentence that happens to start
// with "chunks used" is never mistaken for the marker. A miss here means
// the marker leaks into the visible answer AND narrowing silently falls
// back to the unfiltered set, so it's worth recognizing more variants.
const CHUNKS_USED_MARKER_RE = /^\**CHUNKS[_\s]*USED\**\s*:\s*(.*)$/i;

// Parses a single line as the marker, returning the referenced chunk
// numbers (empty Set for "none"), or null if the line isn't the marker at
// all (so the caller knows to treat it as ordinary answer text).
const parseChunksUsedLine = (line) => {
  const match = line.trim().match(CHUNKS_USED_MARKER_RE);

  if (!match) return null;

  const value = match[1].trim();

  if (!value || /^none$/i.test(value)) return new Set();

  return new Set(
    value
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n)),
  );
};

// Strips the trailing CHUNKS_USED marker line out of a complete (non
// -streamed) answer and returns the chunk numbers it named. Tolerates
// trailing blank lines after the marker. If the model didn't include a
// (parseable) marker at all, returns the answer unchanged with an empty
// set — narrowSources then falls back to the full relevance-filtered set,
// so a non-compliant response never behaves worse than before this fix.
const extractChunksUsedMarker = (rawAnswer) => {
  const lines = rawAnswer.split("\n");

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine === "") continue;

    const usedChunkNumbers = parseChunksUsedLine(trimmedLine);

    if (usedChunkNumbers) {
      return {
        cleanedAnswer: lines.slice(0, i).join("\n").trim(),
        usedChunkNumbers,
      };
    }

    break;
  }

  return { cleanedAnswer: rawAnswer.trim(), usedChunkNumbers: new Set() };
};

// Builds the final sources/sourcePDFs from the chunk numbers the model
// actually claimed to use, falling back to the full relevance-filtered set
// when none were named (no marker, "none", or an empty/garbled value).
const narrowSources = (usedChunkNumbers, chunkMap, fallbackSourcePDFs, fallbackSources) => {
  if (!usedChunkNumbers || usedChunkNumbers.size === 0) {
    return { sourcePDFs: fallbackSourcePDFs, sources: fallbackSources };
  }

  const usedChunks = chunkMap.filter((c) => usedChunkNumbers.has(c.chunkNumber));

  if (usedChunks.length === 0) {
    return { sourcePDFs: fallbackSourcePDFs, sources: fallbackSources };
  }

  const sources = [];
  const seenSourceKeys = new Set();

  for (const c of usedChunks) {
    const sourceKey = `${c.documentId}::${c.pageNumber}`;

    if (seenSourceKeys.has(sourceKey)) continue;
    seenSourceKeys.add(sourceKey);

    sources.push({
      fileName: c.fileName,
      pageNumber: c.pageNumber,
      documentId: c.documentId,
      chunkIndex: c.chunkIndex,
    });
  }

  const sourcePDFs = [...new Set(sources.map((s) => s.fileName))];

  return { sourcePDFs, sources };
};

// Extracted verbatim from the inline template literals that used to live in
// queryVectorStore, so the streaming path (streamAnswer, below) can build the
// exact same prompts without duplicating/drifting from the non-streaming
// answer's wording, tone, or formatting rules.
const buildAIOnlyPrompt = (question) => `

You are a professional AI assistant.

Formatting Rules:

* Use markdown.
* Use headings when useful.
* Use bullet points.
* Use numbered lists.
* Use code blocks for code.
* Be clear and professional.

Question:
${question}
`;

const buildGroundedPrompt = (context, question) => `

You are a professional AI assistant with access to uploaded documents.

Rules:

1. Answer strictly and only from the information given in the DOCUMENT CONTEXT below.

2. If the specific answer is not present in the DOCUMENT CONTEXT, clearly say the documents don't contain that information. Do not guess, speculate, or fall back to your own outside knowledge.

3. If the user asks to compare documents, analyze ALL provided documents.

4. If the user asks for similarities, differences, summaries, strengths, weaknesses, or common points, perform a detailed analysis using only the given context.

5. Always use markdown formatting:

   * # Headings
   * ## Subheadings
   * Bullet points
   * Numbered lists
   * Tables when useful
   * Code blocks for code

6. Mention document names when comparing files.

7. Do not mention chunk numbers anywhere in your main answer text. Instead, after your complete answer, add one final new line, by itself, with nothing else on it, in exactly this format:
CHUNKS_USED: <comma-separated chunk numbers you actually relied on to answer, for example 1,3>
If you did not rely on any specific chunk to answer, write instead:
CHUNKS_USED: none
This final line is required in every response, even short ones.

DOCUMENT CONTEXT:

${context}

QUESTION:

${question}
`;

/**

* Query vector store
  */
export const queryVectorStore = async (userId, question, selectedDocIds = []) => {
  try {
    console.log(`🔍 queryVectorStore: userId=${userId}`);

    const { context, sourcePDFs, sources, hasDocFilter, chunkMap } =
      await getRelevantContext(userId, question, selectedDocIds);

    // NO DOCUMENTS UPLOADED
    if (
      context === null &&
      !hasVectorStore(getUserVectorStorePath(userId, getActiveEmbeddingProviderName()))
    ) {
      console.log("No vector store found. Using AI only.");

      const { text: answer, provider } = await generateText(buildAIOnlyPrompt(question));

      if (provider !== "ollama") console.log(`ℹ️ Answered via ${provider} fallback`);

      return {
        answer: answer.trim(),
        sourcePDFs: [],
        sources: [],
      };
    }

    if (context === null) {
      return {
        answer: hasDocFilter
          ? "I couldn't find relevant content in the document(s) you selected for this question. Try switching to **All Documents**, rephrasing your question, or selecting a different document."
          : "I couldn't find relevant content in your documents for this question. Try rephrasing it, or ask a general question instead.",
        sourcePDFs: [],
        sources: [],
      };
    }

    const { text: rawAnswer, provider } = await generateText(
      buildGroundedPrompt(context, question),
    );

    console.log(
      `✅ Answer generated successfully${provider !== "ollama" ? ` (via ${provider} fallback)` : ""}`,
    );

    const { cleanedAnswer, usedChunkNumbers } = extractChunksUsedMarker(rawAnswer);
    const narrowed = narrowSources(usedChunkNumbers, chunkMap, sourcePDFs, sources);

    return {
      answer: cleanedAnswer,
      sourcePDFs: narrowed.sourcePDFs,
      sources: narrowed.sources,
    };
  } catch (error) {
    console.error("❌ queryVectorStore error:", error.message);
    throw error;
  }
};

/**
 * Streaming counterpart to queryVectorStore, used by the SSE chat endpoint.
 * Same retrieval, same prompts, same grounding rules — the only difference
 * is that the LLM's response is yielded token-by-token as it's generated
 * instead of being awaited in full. An async generator so the controller
 * can `for await` it and write each piece straight to the response.
 *
 * Yields:
 *   { type: "chunk", text }                      — zero or more
 *   { type: "done", sourcePDFs, sources }         — exactly one, always last
 *
 * Throws on error (retrieval failure, Ollama failure, etc.) — the caller is
 * responsible for turning that into an SSE "error" event and for never
 * persisting a Chat row when a throw happens mid-stream.
 */
export async function* streamAnswer(userId, question, selectedDocIds = []) {
  console.log(`🔍 streamAnswer: userId=${userId}`);

  const { context, sourcePDFs, sources, hasDocFilter, chunkMap } =
    await getRelevantContext(userId, question, selectedDocIds);

  // NO DOCUMENTS UPLOADED — AI-only, but still streamed for a consistent
  // progressive-rendering experience regardless of which branch is taken.
  if (
    context === null &&
    !hasVectorStore(getUserVectorStorePath(userId, getActiveEmbeddingProviderName()))
  ) {
    console.log("No vector store found. Using AI only (streamed).");

    for await (const text of streamText(buildAIOnlyPrompt(question))) {
      yield { type: "chunk", text };
    }

    yield { type: "done", sourcePDFs: [], sources: [] };
    return;
  }

  // No relevant chunks found. This message is a fixed string, not
  // LLM-generated, so there's nothing to actually stream — it's sent as a
  // single chunk purely so the frontend can use one uniform code path.
  if (context === null) {
    const message = hasDocFilter
      ? "I couldn't find relevant content in the document(s) you selected for this question. Try switching to **All Documents**, rephrasing your question, or selecting a different document."
      : "I couldn't find relevant content in your documents for this question. Try rephrasing it, or ask a general question instead.";

    yield { type: "chunk", text: message };
    yield { type: "done", sourcePDFs: [], sources: [] };
    return;
  }

  // The model's mandatory trailing "CHUNKS_USED: ..." marker (see
  // buildGroundedPrompt) must never reach the visible stream. Since tokens
  // don't arrive on line boundaries, buffer only up to the last completed
  // line: a line is safe to yield the moment its own newline arrives
  // (nothing before the true final line can be the marker, since the
  // prompt requires it to be the very last line), while anything still
  // pending when the stream ends is the candidate marker line itself.
  let pending = "";
  let usedChunkNumbers = new Set();
  let markerFound = false;

  for await (const text of streamText(buildGroundedPrompt(context, question))) {
    pending += text;

    let newlineIndex;
    while ((newlineIndex = pending.indexOf("\n")) !== -1) {
      const line = pending.slice(0, newlineIndex + 1);
      pending = pending.slice(newlineIndex + 1);

      if (!markerFound) {
        const parsed = parseChunksUsedLine(line.trim());

        if (parsed) {
          usedChunkNumbers = parsed;
          markerFound = true;
          continue; // swallow the marker line — never yielded
        }
      }

      yield { type: "chunk", text: line };
    }
  }

  // Whatever's left has no trailing newline — normally the marker itself
  // (the model's last line, with the stream ending right after it).
  if (pending) {
    if (!markerFound) {
      const parsed = parseChunksUsedLine(pending.trim());

      if (parsed) {
        usedChunkNumbers = parsed;
        markerFound = true;
      }
    }

    if (!markerFound) {
      yield { type: "chunk", text: pending };
    }
  }

  console.log("✅ Streamed answer completed successfully");

  const narrowed = narrowSources(usedChunkNumbers, chunkMap, sourcePDFs, sources);

  yield { type: "done", sourcePDFs: narrowed.sourcePDFs, sources: narrowed.sources };
}

// Builds a brand-new FAISS store at a throwaway temp location, verifies it
// looks structurally sound, and only THEN swaps it into `storePath` — one
// atomic rename() per known file. The existing store at `storePath` (if any)
// is never touched until the swap, so a crash/restart/kill at any point
// before that leaves it fully intact and queryable; the only leftover is a
// harmless temp directory.
//
// The temp dir is created INSIDE storePath itself, which is what makes this
// work identically for both store layouts: for the flat legacy Ollama path
// (storePath IS the shared user_<id>/ directory, which may also hold a
// nested "gemini/" subdirectory as a sibling) the temp dir is just another
// sibling of "gemini/" and never touches it; for the nested Gemini path
// (storePath is its own dedicated user_<id>/gemini/ directory) the temp dir
// is simply nested one level deeper, with nothing else around it.
const saveVectorStoreAtomically = async (newStore, storePath, providerName) => {
  fs.mkdirSync(storePath, { recursive: true });

  const tmpDir = path.join(
    storePath,
    `.rebuild-tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    await newStore.save(tmpDir);
    writeStoreMetadata(tmpDir, providerName);

    // Verify before touching anything live.
    const indexPath = path.join(tmpDir, FAISS_INDEX_FILENAME);
    const docstorePath = path.join(tmpDir, FAISS_DOCSTORE_FILENAME);

    if (!fs.existsSync(indexPath) || fs.statSync(indexPath).size === 0) {
      throw new Error("Rebuilt FAISS index file is missing or empty.");
    }

    let parsedDocstore;
    try {
      parsedDocstore = JSON.parse(fs.readFileSync(docstorePath, "utf-8"));
    } catch {
      throw new Error("Rebuilt FAISS docstore.json is missing or not valid JSON.");
    }

    if (!Array.isArray(parsedDocstore) || parsedDocstore.length !== 2) {
      throw new Error("Rebuilt FAISS docstore.json has an unexpected shape.");
    }

    // Verified — swap. Each rename() is a single atomic syscall on the same
    // filesystem, so storePath only ever shows either the fully-old or
    // fully-new version of each file, never a partially-written one.
    for (const filename of [
      FAISS_INDEX_FILENAME,
      FAISS_DOCSTORE_FILENAME,
      METADATA_FILENAME,
    ]) {
      fs.renameSync(path.join(tmpDir, filename), path.join(storePath, filename));
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};

// Rebuilds `providerName`'s complete FAISS index for a user directly from
// MongoDB — the source of truth for document text/pages/metadata — without
// requiring re-upload. Shared by removePDFFromVectorStore (excludePdfId, so
// a deleted document's chunks never reappear) and reindexActiveProvider (no
// exclusion — a full rebuild for a provider switch). Always rebuilds
// exactly one provider's store from scratch; never reads another provider's
// vectors and never touches another provider's directory.
const rebuildProviderIndexFromMongo = async (
  userId,
  providerName,
  { excludePdfId } = {},
) => {
  const storePath = getUserVectorStorePath(userId, providerName);

  const query = excludePdfId
    ? { userId, _id: { $ne: excludePdfId } }
    : { userId };

  const pdfs = await PDF.find(query);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  let allDocs = [];

  for (const pdf of pdfs) {
    try {
      // Skip old records that don't contain extracted text
      if (!pdf.extractedText?.trim()) {
        console.warn(`Skipping ${pdf.originalName} (no extracted text found)`);
        continue;
      }

      // Prefer the stored per-page text (page-aware). Documents indexed
      // before this upgrade won't have `pages`, so they fall back to the
      // old flat-text behavior with pageNumber: null — this is a safe,
      // non-destructive fallback, not a fabricated page number.
      const pages =
        Array.isArray(pdf.pages) && pdf.pages.length > 0
          ? pdf.pages
          : [{ pageNumber: null, text: pdf.extractedText }];

      let runningChunkIndex = 0;

      for (const page of pages) {
        if (!page.text || page.text.trim().length === 0) continue;

        const pageDocs = await splitter.createDocuments(
          [page.text],
          [
            {
              pdfId: pdf._id.toString(),
              documentId: pdf._id.toString(),
              fileName: pdf.originalName,
              userId: userId.toString(),
              pageNumber: page.pageNumber ?? null,
            },
          ],
        );

        pageDocs.forEach((doc) => {
          doc.metadata.chunkIndex = runningChunkIndex;
          runningChunkIndex += 1;
        });

        allDocs = allDocs.concat(pageDocs);
      }
    } catch (err) {
      console.error(`Failed to process ${pdf.originalName}:`, err.message);
    }
  }

  if (allDocs.length === 0) {
    // Nothing to index — this IS the correct final state, so clearing the
    // store directly (rather than through the atomic swap) is intentional,
    // not a hazard: there is no "new store" to protect against losing.
    removeVectorStore(storePath, providerName);

    console.log(
      pdfs.length === 0
        ? `No documents remain. ${providerName} vector store removed completely.`
        : `No valid document chunks remain. ${providerName} vector store removed.`,
    );

    return { success: true, chunks: 0 };
  }

  console.log(`Rebuilding ${providerName} FAISS index with ${allDocs.length} chunks...`);

  const embeddings = getEmbeddings(providerName);
  const newStore = await FaissStore.fromDocuments(allDocs, embeddings);

  await saveVectorStoreAtomically(newStore, storePath, providerName);

  console.log(`FAISS rebuilt successfully. Total chunks: ${allDocs.length}`);

  return { success: true, chunks: allDocs.length };
};

/**

* Remove PDF from vector store
  */
export const removePDFFromVectorStore = async (userId, deletedPdfId) => {
  try {
    const providerName = getActiveEmbeddingProviderName();
    const storePath = getUserVectorStorePath(userId, providerName);

    // No vector store exists for the currently active provider. This
    // deliberately does NOT touch any other provider's store for this user
    // (e.g. rebuilding while AI_EMBEDDING_PROVIDER=gemini never rebuilds or
    // deletes the legacy Ollama store, and vice versa) — each provider's
    // index is only ever rebuilt while it is the active one, and only if it
    // already existed (deleting a document never creates a brand-new index
    // for a provider that was never indexed in the first place).
    if (!hasVectorStore(storePath)) {
      console.log(`No ${providerName} vector store found.`);
      return;
    }

    assertStoreProviderMatches(storePath, providerName);

    await rebuildProviderIndexFromMongo(userId, providerName, {
      excludePdfId: deletedPdfId,
    });
  } catch (error) {
    console.error("removePDFFromVectorStore error:", error.message);
  }
};

/**
 * Rebuilds the ACTIVE embedding provider's complete FAISS index for a user,
 * directly from MongoDB — the explicit re-index path for provider
 * switching. MongoDB stays the sole source of truth for document text; this
 * never reads from, mixes with, or deletes any OTHER provider's store, and
 * never mixes Nomic/Gemini vectors in one index (it's always a from-scratch
 * rebuild for a single provider).
 *
 * Deliberately NOT called automatically anywhere (not on server startup,
 * not when AI_EMBEDDING_PROVIDER changes) — re-embedding a user's entire
 * document set is a real, potentially slow and costly operation (real
 * Ollama/Gemini API calls), so it only ever runs when a caller explicitly
 * requests it (see POST /api/pdf/reindex).
 */
export const reindexActiveProvider = async (userId) => {
  const providerName = getActiveEmbeddingProviderName();
  return rebuildProviderIndexFromMongo(userId, providerName);
};