import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number, // size in bytes
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    vectorStoreId: {
      type: String, // unique key for this PDF's vector store
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const PDF = mongoose.model("PDF", pdfSchema);
export default PDF;
