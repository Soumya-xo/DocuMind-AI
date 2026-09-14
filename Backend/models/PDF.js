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
    // Per-page (or per-section, for non-paged formats) text, used so
    // FAISS rebuilds (on delete of a sibling document) can stay page-aware
    // without re-parsing the original file. Optional/absent on documents
    // uploaded before this field existed — those simply fall back to
    // extractedText with a null pageNumber on rebuild (see
    // removePDFFromVectorStore), so old records remain fully compatible.
    pages: {
      type: [
        {
          pageNumber: { type: Number, default: null },
          text: { type: String, default: "" },
        },
      ],
      default: undefined,
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
