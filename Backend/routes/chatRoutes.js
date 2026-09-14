import express from "express";
import multer from "multer";
import {
  askQuestion,
  askQuestionStream,
  askImageQuestion,
  getChatHistory,
  clearChatHistory,
} from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Chat images are held in memory only — never written to disk. They're
// used once (converted to base64 for the vision model) and discarded, so
// there's no temp file to clean up and nothing image-related persists
// beyond the request/DB text fields (see chatController.askImageQuestion).
const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, JPEG, and WEBP images are allowed."), false);
    }
  },
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
});

const handleImageUpload = (req, res, next) => {
  imageUpload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image too large. Maximum size is 8MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  });
};

router.post("/ask", protect, askQuestion);
router.post("/ask-stream", protect, askQuestionStream);
router.post("/ask-image", protect, handleImageUpload, askImageQuestion);
router.get("/history", protect, getChatHistory);
router.delete("/history", protect, clearChatHistory);

export default router;
