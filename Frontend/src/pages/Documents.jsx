import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ThemeToggle from "../components/ThemeToggle.jsx";
import PDFUpload from "../components/PDFUpload.jsx";
import DocumentRow from "../components/DocumentRow.jsx";
import { deletePDF, fetchPDFs } from "../services/api.js";
import { viewPDFFile, downloadPDFFile } from "../utils/documentActions.js";
import { FileText, Search, Upload, X } from "lucide-react";
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

  const handleView = (id) => viewPDFFile(id);
  const handleDownload = (id, originalName) => downloadPDFFile(id, originalName);

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

        <div className="space-y-4">
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
                  placeholder="Search by filename..."
                  className="w-full rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 pl-9 pr-9 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-shadow focus:ring-4 focus:ring-primary/15 focus:border-primary/40"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
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
                    {query || typeFilter !== "All"
                      ? "Try a different filename or clear your search."
                      : "Upload a file to get started."}
                  </p>
                  {(query || typeFilter !== "All") && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setTypeFilter("All");
                      }}
                      className="mt-3 text-sm font-semibold text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredPDFs.map((pdf) => (
                    <DocumentRow
                      key={pdf._id}
                      pdf={pdf}
                      onView={handleView}
                      onDownload={handleDownload}
                      onDelete={handleDeletePDF}
                      deletingId={deletingId}
                    />
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
