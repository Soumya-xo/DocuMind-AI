import React, { useState, useRef } from "react";
import { uploadPDFs } from "../services/api.js";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";

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
        className={`rounded-2xl border-2 border-dashed px-6 py-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary-light/60 dark:bg-primary/10"
            : "border-slate-200/80 dark:border-slate-700/70 hover:border-primary/60 hover:bg-slate-50/60 dark:hover:bg-slate-900/30"
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-10 w-10 rounded-2xl bg-primary-light/70 dark:bg-primary/15 flex items-center justify-center text-primary">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {dragOver
              ? "Drop files here"
              : "Drop files here or click to browse"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            PDF · DOCX · TXT · MD · CSV · XLSX · Max 10MB per file · Up to 10 files
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
        <div className="mt-2.5 space-y-1.5">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-primary-light/50 dark:bg-primary/10 px-3 py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />

                <span
                  className="text-xs text-slate-700 dark:text-slate-200 truncate font-medium"
                  title={file.name}
                >
                  {file.name}
                </span>

                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                  {formatSize(file.size)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="btn-primary w-full mt-3 py-2.5 flex items-center justify-center gap-2 text-sm"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            {files.length > 0
              ? `Upload ${files.length} Document${files.length > 1 ? "s" : ""}`
              : "Upload Documents"}
          </>
        )}
      </button>
    </div>
  );
};

export default PDFUpload;
