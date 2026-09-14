import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    sourcePDFs: [
      {
        type: String, // PDF file names that contributed to the answer
      },
    ],
    // Structured citations, built server-side only from chunks actually
    // used as context (see ragService.queryVectorStore). Optional/absent
    // on chats created before this field existed — old chat documents keep
    // working and simply have no `sources` to render (frontend falls back
    // to sourcePDFs for those).
    sources: {
      type: [
        {
          fileName: { type: String, required: true },
          pageNumber: { type: Number, default: null },
          documentId: { type: String },
          chunkIndex: { type: Number },
        },
      ],
      default: undefined,
    },
    documentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PDF",
        // Documents the user explicitly selected for this question.
        // Empty array = "All Documents" (existing unfiltered behavior).
      },
    ],
    // True when this question was asked with an image attachment. The image
    // bytes themselves are never persisted (see visionService/chatController)
    // — this flag only lets reloaded history show "🖼 Image attached"
    // instead of silently pretending the question was text-only.
    hasImage: {
      type: Boolean,
      default: undefined,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
