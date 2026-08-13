import Chat from "../models/Chat.js";
import PDF from "../models/PDF.js";
import { queryVectorStore } from "../utils/ragService.js";

/**

* POST /api/chat/ask
  */
export const askQuestion = async (req, res) => {
  try {
    console.log("💬 Chat request received");
    console.log("Body:", req.body);
    console.log("User:", req.user?._id);

    const { question } = req.body;

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

    // IMPORTANT:
    // Do NOT block when no PDFs exist.
    // Let ragService decide whether to use:
    // - AI only
    // - Documents only
    // - AI + Documents

    const { answer, sourcePDFs } = await queryVectorStore(
      req.user._id.toString(),
      question.trim(),
    );

    console.log(`✅ Answer generated (${answer.length} chars)`);

    const chat = await Chat.create({
      userId: req.user._id,
      question: question.trim(),
      answer,
      sourcePDFs,
    });

    return res.json({
      success: true,
      chat: {
        id: chat._id,
        question: chat.question,
        answer: chat.answer,
        sourcePDFs: chat.sourcePDFs,
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
      .select("question answer sourcePDFs createdAt");

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
