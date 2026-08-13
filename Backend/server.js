import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
// app.use(cors({ origin: "*", credentials: true }));
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5001",
      "http://127.0.0.1:5001",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "MultiPDF RAG API is running 🚀" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
