import { ChatOllama } from "@langchain/ollama";
import { HumanMessage } from "@langchain/core/messages";
import { getRelevantContext } from "./ragService.js";

// Kept separate from getLLM() in ragService.js — that model (llama3.2) has
// no vision capability, so image questions need a distinct vision-capable
// model. Overridable via env var since which vision models are actually
// pulled locally can vary per machine.
const VISION_MODEL = process.env.VISION_OLLAMA_MODEL || "llava:7b";

const getVisionLLM = () => {
  return new ChatOllama({
    model: VISION_MODEL,
    baseUrl: "http://127.0.0.1:11434",
    temperature: 0.2,
  });
};

/**
 * Answer a question about an uploaded image, optionally grounded in the
 * user's documents.
 *
 * - Image only, or image + question with "All Documents" (no explicit
 *   selection): sent to the vision model with NO RAG. Unlike the text-chat
 *   path, "All Documents" does not mean "search everything unfiltered" here
 *   — it means the user did not ask for document fusion, so we never
 *   inject whatever the vector store happens to return into an otherwise
 *   image-only question.
 * - Image + question + explicitly selected document(s): the question text
 *   is run through the *same* retrieval used by the text chat path
 *   (getRelevantContext, scoped to selectedDocIds), and any relevant
 *   chunks found are included alongside the image. If nothing relevant is
 *   found, we still answer using the image + question alone rather than
 *   failing.
 */
export const answerImageQuestion = async (
  userId,
  question,
  imageBase64,
  mimeType,
  selectedDocIds = [],
) => {
  const trimmedQuestion = (question || "").trim();
  const hasDocFilter = Array.isArray(selectedDocIds) && selectedDocIds.length > 0;

  let context = null;
  let sourcePDFs = [];
  let sources = [];

  // Document RAG fusion only kicks in when the user has explicitly scoped
  // this question to selected document(s) — never for "All Documents".
  if (trimmedQuestion && hasDocFilter) {
    // Smaller topK than the text-only path (5 vs 8) — the image itself
    // already consumes a meaningful share of the model's context window.
    const retrieved = await getRelevantContext(
      userId,
      trimmedQuestion,
      selectedDocIds,
      { topK: 5 },
    );

    if (retrieved.context !== null) {
      context = retrieved.context;
      sourcePDFs = retrieved.sourcePDFs;
      sources = retrieved.sources;
    }
  }

  const instructions = context
    ? `You are a professional AI assistant. Look carefully at the attached image and answer the question.

If the DOCUMENT CONTEXT below is relevant to the question, ground your answer in it and mention which document/page it came from. If it is not relevant, rely on what you observe in the image and your own knowledge instead.

Always use markdown formatting (headings, bullet points, numbered lists where useful).

DOCUMENT CONTEXT:

${context}

QUESTION:

${trimmedQuestion || "Describe what is in this image and note anything noteworthy."}`
    : `You are a professional AI assistant. Look carefully at the attached image and answer the question clearly, using markdown formatting (bullet points/headings where useful).

QUESTION:

${trimmedQuestion || "Describe what is in this image and note anything noteworthy."}`;

  const message = new HumanMessage({
    content: [
      { type: "text", text: instructions },
      {
        type: "image_url",
        image_url: `data:${mimeType};base64,${imageBase64}`,
      },
    ],
  });

  const llm = getVisionLLM();
  const response = await llm.invoke([message]);
  const answer = typeof response === "string" ? response : response.content;

  return {
    answer: (typeof answer === "string" ? answer : String(answer)).trim(),
    sourcePDFs,
    sources,
  };
};

export const getVisionModelName = () => VISION_MODEL;
