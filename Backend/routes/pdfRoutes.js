import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import protect from "../middleware/authMiddleware.js";
import {
  uploadPDFs,
  getUserPDFs,
  deletePDF,
  viewDocument,
  downloadDocument,
} from "../controllers/pdfController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${req.user._id}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

// Allow multiple document types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const allowedExtensions = [".pdf", ".docx", ".txt", ".md", ".csv", ".xlsx"];

  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF, DOCX, TXT, MD, CSV and XLSX files are allowed."),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

const handleMulterUpload = (req, res, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 10MB per file.",
        });
      }

      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Too many files. Maximum 10 files at once.",
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

router.post("/upload", protect, handleMulterUpload, uploadPDFs);

router.get("/list", protect, getUserPDFs);

router.get("/view/:id", protect, viewDocument);
router.get("/download/:id", protect, downloadDocument);

router.delete("/:id", protect, deletePDF);

export default router;
