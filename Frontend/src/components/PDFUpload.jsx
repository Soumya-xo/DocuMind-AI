import React, { useState, useRef } from "react";
import { uploadPDFs } from "../services/api.js";

const PDFUpload = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    validateAndSetFiles(selected);
  };

  const validateAndSetFiles = (selected) => {
    setError("");

    const validFiles = [];
    const errors = [];

    const allowedExtensions = [".pdf", ".docx", ".txt", ".md", ".csv", ".xlsx"];

    for (const file of selected) {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        errors.push(`"${file.name}" is not a supported file type.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        errors.push(`"${file.name}" exceeds 10MB limit.`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
    }

    setFiles(validFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const dropped = Array.from(e.dataTransfer.files);

    validateAndSetFiles(dropped);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one document.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();

      files.forEach((file) => formData.append("files", file));

      const res = await uploadPDFs(formData);

      if (res.data.success) {
        setFiles([]);

        if (inputRef.current) {
          inputRef.current.value = "";
        }

        onUploadSuccess(res.data.message, res.data.errors);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Upload failed. Please try again.";

      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-primary bg-primary-light"
            : "border-slate-200 hover:border-primary hover:bg-slate-50"
        }`}
      >
        {" "}
        <div className="flex flex-col items-center gap-2">
          {" "}
          <span className="text-3xl">{dragOver ? "📂" : "📁"} </span>
          <p className="text-sm font-medium text-slate-700">
            {dragOver
              ? "Drop documents here"
              : "Click or drag & drop documents"}
          </p>
          <p className="text-xs text-slate-400">
            PDF, DOCX, TXT, MD, CSV, XLSX
            <br />
            Max 10MB per file · Up to 10 files
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">📄</span>

                <span className="text-xs text-slate-700 truncate font-medium">
                  {file.name}
                </span>

                <span className="text-xs text-slate-400 shrink-0">
                  {formatSize(file.size)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />

              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Processing documents...
          </>
        ) : (
          <>
            ⬆️ Upload{" "}
            {files.length > 0
              ? `${files.length} Document${files.length > 1 ? "s" : ""}`
              : "Documents"}
          </>
        )}
      </button>
    </div>
  );
};

export default PDFUpload;
