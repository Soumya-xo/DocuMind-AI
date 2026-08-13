import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ThemeToggle from "../components/ThemeToggle.jsx";
import PDFUpload from "../components/PDFUpload.jsx";
import { deletePDF, fetchPDFs } from "../services/api.js";
import { FileText, Download, Eye, Search, Trash2, Upload } from "lucide-react";
import DocuMindDashboardLayout from "../layouts/DocuMindDashboardLayout.jsx";

const typeFromName = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "Unknown";
  return ext.toUpperCase();
};

const Documents = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const [pdfs, setPDFs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessages, setWarningMessages] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  const loadPDFs = async () => {
    setLoading(true);
    try {
      const res = await fetchPDFs();
      setPDFs(res.data.pdfs || []);
    } catch (err) {
      console.error("Failed to load PDFs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPDFs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUploadSuccess = (message, errors) => {
    setSuccessMessage(message);
    setWarningMessages(errors || []);
    loadPDFs();
    setTimeout(() => {
      setSuccessMessage("");
      setWarningMessages([]);
    }, 3000);
  };

  const filteredPDFs = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = pdfs;
    if (typeFilter !== "All") {
      list = list.filter((p) => typeFromName(p.originalName) === typeFilter);
    }
    if (!q) return list;
    return list.filter((p) =>
      [p.originalName, p.pageCount, p.fileSize, p.uploadedAt]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [pdfs, query, typeFilter]);

  const supportedTypes = useMemo(() => {
    const set = new Set(pdfs.map((p) => typeFromName(p.originalName)));
    return ["All", ...Array.from(set).sort()];
  }, [pdfs]);

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const handleDeletePDF = async (id, name) => {
    if (
      !window.confirm(
        `Delete "${name}"? This will remove it from the knowledge base.`,
      )
    )
      return;

    setDeletingId(id);
    try {
      await deletePDF(id);
      setPDFs((prev) => prev.filter((pdf) => pdf._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete PDF.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = async (id) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/pdf/view/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        },
      );
      if (!res.ok) {
        const msg = await res.text();
        alert(msg || "Failed to view document.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      alert(e?.message || "Failed to view document.");
    }
  };

  const handleDownload = async (id, originalName) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/pdf/download/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        },
      );

      if (!res.ok) {
        const msg = await res.text();
        alert(msg || "Failed to download document.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      alert(e?.message || "Failed to download document.");
    }
  };

  return (
    <DocuMindDashboardLayout>
      <div className="px-1">
        <div className="mb-4">
          <motion.h1
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white"
          >
            Documents
          </motion.h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Manage your knowledge base files.
          </p>
        </div>

        {(successMessage || warningMessages.length > 0) && (
          <div className="space-y-2 mb-4">
            {successMessage && (
              <div className="rounded-2xl border border-green-200/70 bg-green-50/70 px-4 py-3 text-sm text-green-700 backdrop-blur">
                ✅ {successMessage}
              </div>
            )}
            {warningMessages.map((m, i) => (
              <div
                key={i}
                className="rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-sm text-amber-700 backdrop-blur"
              >
                ⚠️ {m}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.section
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Upload
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  Add documents
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/20 px-3 py-2">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  PDF/DOCX/TXT/CSV/XLSX
                </span>
              </div>
            </div>

            <PDFUpload onUploadSuccess={onUploadSuccess} />
          </motion.section>

          <motion.section
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Library
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  Your files
                </h2>
              </div>
              <button
                onClick={loadPDFs}
                className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
              >
                ↻ Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary/10"
              >
                {supportedTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === "All" ? "All types" : t}
                  </option>
                ))}
              </select>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredPDFs.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-14 w-14 rounded-3xl bg-primary-light/70 dark:bg-primary/20 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                    No documents found
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Try changing filters or upload a new file.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPDFs.map((pdf) => (
                    <motion.div
                      key={pdf._id}
                      initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={reduceMotion ? undefined : { y: -2 }}
                      className="rounded-[1.5rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 p-4 group flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {pdf.originalName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {typeFromName(pdf.originalName)} ·{" "}
                            {formatSize(pdf.fileSize)} ·{" "}
                            {formatDate(pdf.uploadedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleView(pdf._id)}
                          className="hidden sm:inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/60 dark:bg-slate-950/20 border border-slate-100/70 dark:border-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                          aria-label="View"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() =>
                            handleDownload(pdf._id, pdf.originalName)
                          }
                          className="hidden sm:inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/60 dark:bg-slate-950/20 border border-slate-100/70 dark:border-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                          aria-label="Download"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>

                        <button
                          onClick={() =>
                            handleDeletePDF(pdf._id, pdf.originalName)
                          }
                          disabled={deletingId === pdf._id}
                          className="inline-flex items-center justify-center rounded-xl p-2 bg-red-50/70 dark:bg-red-500/10 border border-red-200/70 dark:border-red-500/20 text-red-600 hover:bg-red-100/90 dark:hover:bg-red-500/15 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === pdf._id ? (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.6, ease: "linear" }}
                              className="inline-flex"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.span>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        {/* CTA row */}
        <div className="mt-4 rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-gradient-to-br from-primary/10 via-white/50 to-cyan-500/10 backdrop-blur-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Ready to ask questions?
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Your documents become grounded knowledge for the AI chat.
              </p>
            </div>
            <button
              onClick={() => navigate("/chat")}
              disabled={pdfs.length === 0}
              className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Go to AI Chat
            </button>
          </div>
        </div>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default Documents;
