import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import PDF from "../models/PDF.js";
import { queryVectorStore, streamAnswer } from "../utils/ragService.js";
import { answerImageQuestion } from "../utils/visionService.js";

// Shared by askQuestion and askImageQuestion: documentIds: [] or omitted =>
// "All Documents" (existing behavior). documentIds: [id, ...] => restrict
// retrieval to those document(s). Every ID is re-validated against this
// user's own PDFs — a user can never scope a query to another user's
// document by sending its ID. Returns null when the caller asked for a
// filter but none of the IDs resolved to an owned document.
const resolveValidDocumentIds = async (documentIds, userId) => {
  if (!Array.isArray(documentIds) || documentIds.length === 0) return [];

  const wellFormedIds = documentIds.filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );

  const ownedPDFs = await PDF.find({
    _id: { $in: wellFormedIds },
    userId,
  }).select("_id");

  const validIds = ownedPDFs.map((pdf) => pdf._id.toString());

  return validIds.length > 0 ? validIds : null;
};

/**

* POST /api/chat/ask
  */
export const askQuestion = async (req, res) => {
  try {
    console.log("💬 Chat request received");
    console.log("Body:", req.body);
    console.log("User:", req.user?._id);

    const { question, documentIds } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Question cannot be empty.",
      });
    }

    const pdfCount = await PDF.countDocuments({
      userId: req.user._id,
    });

    console.log(`Document count: ${pdfCount}`);
    console.log(`❓ Question: "${question}"`);

    const validDocumentIds = await resolveValidDocumentIds(
      documentIds,
      req.user._id,
    );

    if (validDocumentIds === null) {
      return res.status(400).json({
        success: false,
        message:
          "None of the selected document(s) could be found. They may have been deleted — please refresh and reselect.",
      });
    }

    // IMPORTANT:
    // Do NOT block when no PDFs exist.
    // Let ragService decide whether to use:
    // - AI only
    // - Documents only
    // - AI + Documents

    const { answer, sourcePDFs, sources } = await queryVectorStore(
      req.user._id.toString(),
      question.trim(),
      validDocumentIds,
    );

    console.log(`✅ Answer generated (${answer.length} chars)`);

    const chat = await Chat.create({
      userId: req.user._id,
      question: question.trim(),
      answer,
      sourcePDFs,
      sources,
      documentIds: validDocumentIds,
    });

    return res.json({
      success: true,
      chat: {
        id: chat._id,
        question: chat.question,
        answer: chat.answer,
        sourcePDFs: chat.sourcePDFs,
        sources: chat.sources || [],
        documentIds: chat.documentIds,
        createdAt: chat.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process question: " + error.message,
    });
  }
};

// Writes one SSE frame. `event` names the event type the frontend parser
// switches on ("chunk" | "done" | "error"); `data` is JSON-serialized.
const sendSSE = (res, event, data) => {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

/**
 * POST /api/chat/ask-stream
 *
 * Streaming counterpart to askQuestion — identical validation, retrieval,
 * filtering, and persistence semantics, but the answer is delivered as
 * Server-Sent Events so the frontend can render it progressively instead of
 * waiting for the full response. Image chat is intentionally untouched by
 * this endpoint; it keeps using askImageQuestion above.
 */
export const askQuestionStream = async (req, res) => {
  const { question, documentIds } = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Question cannot be empty.",
    });
  }

  let validDocumentIds;
  try {
    validDocumentIds = await resolveValidDocumentIds(documentIds, req.user._id);
  } catch (error) {
    console.error("❌ Stream chat validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process question: " + error.message,
    });
  }

  if (validDocumentIds === null) {
    return res.status(400).json({
      success: false,
      message:
        "None of the selected document(s) could be found. They may have been deleted — please refresh and reselect.",
    });
  }

  const trimmedQuestion = question.trim();

  console.log("💬 Streaming chat request received");
  console.log("User:", req.user?._id);
  console.log(`❓ Question: "${trimmedQuestion}"`);

  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Nginx/proxy hint to disable response buffering — harmless when absent.
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  // If the client navigates away / aborts mid-stream, stop writing and skip
  // persistence — an aborted answer is not a "successful" one.
  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  let fullAnswer = "";

  try {
    for await (const event of streamAnswer(
      req.user._id.toString(),
      trimmedQuestion,
      validDocumentIds,
    )) {
      if (aborted) break;

      if (event.type === "chunk") {
        fullAnswer += event.text;
        sendSSE(res, "chunk", { text: event.text });
        continue;
      }

      if (event.type === "done") {
        if (aborted) break;

        const chat = await Chat.create({
          userId: req.user._id,
          question: trimmedQuestion,
          answer: fullAnswer.trim(),
          sourcePDFs: event.sourcePDFs,
          sources: event.sources,
          documentIds: validDocumentIds,
        });

        console.log(`✅ Streamed answer persisted (${fullAnswer.length} chars)`);

        sendSSE(res, "done", {
          chatId: chat._id,
          sourcePDFs: chat.sourcePDFs,
          sources: chat.sources || [],
          documentIds: chat.documentIds,
          createdAt: chat.createdAt,
        });
      }
    }
  } catch (error) {
    console.error("❌ Stream chat error:", error);
    // Nothing is persisted here — a mid-stream failure never becomes a
    // saved Chat row, so history never shows a truncated/corrupted answer.
    sendSSE(res, "error", {
      message: "Failed to process question: " + error.message,
    });
  } finally {
    if (!res.writableEnded) res.end();
  }
};

/**
 * POST /api/chat/ask-image
 *
 * Image (+ optional text + optional documentIds) chat turn. The image is
 * held in memory only (multer memoryStorage, see chatRoutes.js) and is
 * never written to disk or persisted to MongoDB — it exists only for the
 * duration of this request, then is discarded. Text-only chat continues to
 * use askQuestion/queryVectorStore above, completely unchanged.
 */
export const askImageQuestion = async (req, res) => {
  try {
    console.log("🖼️  Image chat request received");
    console.log("User:", req.user?._id);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded.",
      });
    }

    const question = (req.body.question || "").trim();

    // documentIds arrives as a JSON-encoded string over multipart form-data.
    let documentIds = [];
    if (req.body.documentIds) {
      try {
        const parsed = JSON.parse(req.body.documentIds);
        if (Array.isArray(parsed)) documentIds = parsed;
      } catch {
        // Malformed value — fall back to "All Documents" rather than 500ing.
      }
    }

    const validDocumentIds = await resolveValidDocumentIds(
      documentIds,
      req.user._id,
    );

    if (validDocumentIds === null) {
      return res.status(400).json({
        success: false,
        message:
          "None of the selected document(s) could be found. They may have been deleted — please refresh and reselect.",
      });
    }

    const imageBase64 = req.file.buffer.toString("base64");

    const { answer, sourcePDFs, sources } = await answerImageQuestion(
      req.user._id.toString(),
      question,
      imageBase64,
      req.file.mimetype,
      validDocumentIds,
    );

    console.log(`✅ Image answer generated (${answer.length} chars)`);

    const chat = await Chat.create({
      userId: req.user._id,
      question: question || "(image message)",
      answer,
      sourcePDFs,
      sources,
      documentIds: validDocumentIds,
      hasImage: true,
    });

    return res.json({
      success: true,
      chat: {
        id: chat._id,
        question: chat.question,
        answer: chat.answer,
        sourcePDFs: chat.sourcePDFs,
        sources: chat.sources || [],
        documentIds: chat.documentIds,
        hasImage: true,
        createdAt: chat.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Image chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process image question: " + error.message,
    });
  }
};

/**

* GET /api/chat/history
  */
export const getChatHistory = async (req, res) => {
  try {
    const chats = await Chat.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select(
        "question answer sourcePDFs sources documentIds hasImage createdAt",
      );

    return res.json({
      success: true,
      chats: chats.reverse(),
    });
  } catch (error) {
    console.error("Chat history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve chat history.",
    });
  }
};

/**

* DELETE /api/chat/history
  */
export const clearChatHistory = async (req, res) => {
  try {
    await Chat.deleteMany({
      userId: req.user._id,
    });

    return res.json({
      success: true,
      message: "Chat history cleared.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear chat history.",
    });
  }
};
