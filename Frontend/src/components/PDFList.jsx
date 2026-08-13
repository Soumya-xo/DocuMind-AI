import React, { useState } from "react";
import { deletePDF } from "../services/api.js";

const PDFList = ({ pdfs, loading, onDelete }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will remove it from the knowledge base.`)) return;

    setDeletingId(id);
    try {
      await deletePDF(id);
      onDelete(id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete PDF.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">📭</p>
        <p className="text-sm text-slate-400 font-medium">No PDFs uploaded yet</p>
        <p className="text-xs text-slate-300 mt-1">Upload PDFs above to start chatting</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pdfs.map((pdf) => (
        <div
          key={pdf._id}
          className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 hover:bg-blue-50 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg shrink-0">📄</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {pdf.originalName}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {pdf.pageCount > 0 && `${pdf.pageCount} pages · `}
                {formatSize(pdf.fileSize)}
                {" · "}
                {formatDate(pdf.uploadedAt)}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleDelete(pdf._id, pdf.originalName)}
            disabled={deletingId === pdf._id}
            className="shrink-0 ml-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
            title="Delete PDF"
          >
            {deletingId === pdf._id ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default PDFList;
