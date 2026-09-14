import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDF from "../models/PDF.js";
import {
  addPDFToVectorStore,
  removePDFFromVectorStore,
  reindexActiveProvider,
} from "../utils/ragService.js";
import { extractTextFromFile } from "../utils/fileExtractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../uploads");

const vectorstoreDir = path.join(__dirname, "../vectorstore");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, {
    recursive: true,
  });
}

if (!fs.existsSync(vectorstoreDir)) {
  fs.mkdirSync(vectorstoreDir, {
    recursive: true,
  });
}

// pdf.filePath is an ABSOLUTE path captured at upload time. If this project
// folder is ever moved, renamed, or copied (as it evidently has been at
// least twice — old records point at "DocuMind-AI-main" and "documind 2"),
// every previously-uploaded document's stored filePath silently stops
// resolving even though the file itself is sitting right there under the
// current uploads/ dir with the same basename (pdf.fileName is always that
// basename — see uploadPDFs below, where both are set from the same multer
// `file` object). Re-deriving the path from the CURRENT uploadsDir makes
// View/Download/Delete resilient to that, without needing to touch any
// stored data. Falls back to the stored filePath verbatim for the (in
// practice, non-existent) case where fileName isn't just filePath's
// basename.
const resolveActualFilePath = (pdf) => {
  if (pdf.fileName) {
    const currentPath = path.join(uploadsDir, pdf.fileName);
    if (fs.existsSync(currentPath)) return currentPath;
  }
  return pdf.filePath;
};

/**

* POST /api/pdf/upload
  */
export const uploadPDFs = async (req, res) => {
  try {
    console.log("📥 Upload request received");

    console.log("Files:", req.files?.length ?? 0);

    console.log("User:", req.user?._id);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded. Please select at least one file.",
      });
    }

    const uploadedPDFs = [];
    const errors = [];

    for (const file of req.files) {
      try {
        console.log(`📄 Processing: ${file.originalname}`);

        console.log(`Size: ${file.size} bytes`);

        if (!fs.existsSync(file.path)) {
          errors.push(`${file.originalname}: File not found after upload.`);

          continue;
        }

        let fileData;

        try {
          fileData = await extractTextFromFile(file);

          console.log(`Pages: ${fileData.pages}`);

          console.log(`Text Length: ${fileData.text?.length}`);
        } catch (parseErr) {
          console.error(`Parse Error:`, parseErr.message);

          errors.push(`${file.originalname}: ${parseErr.message}`);

          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          continue;
        }

        const extractedText = fileData.text;

        if (!extractedText || extractedText.trim().length < 10) {
          errors.push(
            `${file.originalname}: File contains little or no readable text.`,
          );

          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          continue;
        }
        const pdf = await PDF.create({
          userId: req.user._id,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          extractedText,
          // Per-page text for page-aware retrieval/citations and for
          // page-aware rebuilds later (see removePDFFromVectorStore).
          // Present for every format; pageNumber is null where a format
          // has no real page boundaries (see fileExtractor.js).
          pages: fileData.pageTexts,
          fileSize: file.size,
          pageCount: fileData.pages,
        });

        console.log(`Saved to MongoDB: ${pdf._id}`);

        await addPDFToVectorStore(
          req.user._id.toString(),
          fileData.pageTexts,
          pdf._id.toString(),
          file.originalname,
        );

        console.log("✅ Indexed in FAISS");

        uploadedPDFs.push({
          id: pdf._id,
          originalName: pdf.originalName,
          fileSize: pdf.fileSize,
          pageCount: pdf.pageCount,
          uploadedAt: pdf.uploadedAt,
        });
      } catch (fileError) {
        console.error(`❌ Error processing ${file.originalname}:`, fileError);

        errors.push(`${file.originalname}: ${fileError.message}`);

        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    if (uploadedPDFs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files were processed successfully.",
        errors,
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedPDFs.length} file(s) uploaded and indexed successfully.`,
      files: uploadedPDFs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);

    res.status(500).json({
      success: false,
      message: `Upload failed: ${error.message}`,
    });
  }
};

/**

* GET /api/pdf/list
  */
export const getUserPDFs = async (req, res) => {
  try {
    const pdfs = await PDF.find({
      userId: req.user._id,
    })
      .sort({
        uploadedAt: -1,
      })
      .select("originalName fileSize pageCount uploadedAt");

    res.json({
      success: true,
      count: pdfs.length,
      pdfs,
    });
  } catch (error) {
    console.error("List Files Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve file list.",
    });
  }
};

/**

* DELETE /api/pdf/:id
  */
const getFileExtension = (filename = "") => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ext;
};

const streamFile = (res, filePath, contentType) => {
  if (!filePath) {
    return res.status(404).json({
      success: false,
      message: "File not found.",
    });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "File missing on server.",
    });
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");

  // For PDFs and text-like docs this will render inline.
  // For other types, the browser may still download.
  const stat = fs.statSync(filePath);
  if (Number.isFinite(stat.size)) res.setHeader("Content-Length", stat.size);

  const readStream = fs.createReadStream(filePath);
  readStream.on("error", () => {
    res.status(500).json({
      success: false,
      message: "Failed to read file.",
    });
  });
  readStream.pipe(res);
};

/**
 * GET /api/pdf/view/:id
 */
export const viewDocument = async (req, res) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: "File not found or permission denied.",
      });
    }

    const filePath = resolveActualFilePath(pdf);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File missing on server.",
      });
    }

    const ext = getFileExtension(pdf.originalName);

    if (ext === "pdf") {
      return streamFile(res, filePath, "application/pdf");
    }

    if (["txt", "md", "csv"].includes(ext)) {
      const contentType = "text/plain; charset=utf-8";
      return streamFile(res, filePath, contentType);
    }

    if (ext === "docx") {
      // For DOCX we return the raw DOCX for the browser to handle.
      // (Rendering DOCX as HTML requires additional conversion; keep production-safe.)
      return streamFile(
        res,
        filePath,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    }

    // Fallback: download-ish type
    return streamFile(res, filePath, "application/octet-stream");
  } catch (error) {
    console.error("View File Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to view file.",
    });
  }
};

/**
 * GET /api/pdf/download/:id
 */
export const downloadDocument = async (req, res) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: "File not found or permission denied.",
      });
    }

    const filePath = resolveActualFilePath(pdf);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File missing on server.",
      });
    }

    // Use original filename.
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdf.originalName}"`,
    );

    const ext = getFileExtension(pdf.originalName);
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : ext === "csv" || ext === "txt" || ext === "md"
            ? "text/plain; charset=utf-8"
            : "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");

    const readStream = fs.createReadStream(filePath);
    readStream.on("error", () => {
      res.status(500).json({
        success: false,
        message: "Failed to read file.",
      });
    });
    readStream.pipe(res);
  } catch (error) {
    console.error("Download File Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download file.",
    });
  }
};

export const deletePDF = async (req, res) => {
  try {
    const pdf = await PDF.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: "File not found or permission denied.",
      });
    }

    const filePath = resolveActualFilePath(pdf);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await removePDFFromVectorStore(req.user._id.toString(), pdf._id.toString());

    await PDF.findByIdAndDelete(pdf._id);

    res.json({
      success: true,
      message: `"${pdf.originalName}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete File Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete file.",
    });
  }
};

/**
 * POST /api/pdf/reindex
 *
 * Rebuilds the caller's FAISS index for the CURRENTLY ACTIVE embedding
 * provider directly from their documents already stored in MongoDB — no
 * re-upload required. This is the explicit, user-triggered counterpart to
 * switching AI_EMBEDDING_PROVIDER: after changing that env var and
 * restarting the server, calling this endpoint backfills the new
 * provider's index from existing data. It is never called automatically
 * (not on startup, not on a provider change) since re-embedding a user's
 * entire document set is a real, potentially slow operation.
 */
export const reindexDocuments = async (req, res) => {
  try {
    const result = await reindexActiveProvider(req.user._id.toString());

    res.json({
      success: true,
      message: `Re-indexed ${result.chunks} chunk(s) for the active embedding provider.`,
      chunks: result.chunks,
    });
  } catch (error) {
    console.error("Reindex Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to re-index documents: " + error.message,
    });
  }
};
