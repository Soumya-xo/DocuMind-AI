import express from "express";
import {
  askQuestion,
  getChatHistory,
  clearChatHistory,
} from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/ask", protect, askQuestion);
router.get("/history", protect, getChatHistory);
router.delete("/history", protect, clearChatHistory);

export default router;
