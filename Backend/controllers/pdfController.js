import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDF from "../models/PDF.js";
import {
  addPDFToVectorStore,
  removePDFFromVectorStore,
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
          fileSize: file.size,
          pageCount: fileData.pages,
        });

        console.log(`Saved to MongoDB: ${pdf._id}`);

        await addPDFToVectorStore(
          req.user._id.toString(),
          extractedText,
          pdf._id.toString(),
          file.originalname,
          extractedText,
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

    if (!pdf.filePath || !fs.existsSync(pdf.filePath)) {
      return res.status(404).json({
        success: false,
        message: "File missing on server.",
      });
    }

    const ext = getFileExtension(pdf.originalName);

    if (ext === "pdf") {
      return streamFile(res, pdf.filePath, "application/pdf");
    }

    if (["txt", "md", "csv"].includes(ext)) {
      const contentType = "text/plain; charset=utf-8";
      return streamFile(res, pdf.filePath, contentType);
    }

    if (ext === "docx") {
      // For DOCX we return the raw DOCX for the browser to handle.
      // (Rendering DOCX as HTML requires additional conversion; keep production-safe.)
      return streamFile(
        res,
        pdf.filePath,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    }

    // Fallback: download-ish type
    return streamFile(res, pdf.filePath, "application/octet-stream");
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

    if (!pdf.filePath || !fs.existsSync(pdf.filePath)) {
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

    const readStream = fs.createReadStream(pdf.filePath);
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

    if (fs.existsSync(pdf.filePath)) {
      fs.unlinkSync(pdf.filePath);
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
