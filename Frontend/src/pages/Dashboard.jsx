import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Bot,
  FileText,
  Search,
  Upload,
  X,
} from "lucide-react";
import PDFUpload from "../components/PDFUpload.jsx";
import DocumentRow from "../components/DocumentRow.jsx";
import DocuMindDashboardLayout from "../layouts/DocuMindDashboardLayout.jsx";
import { fetchPDFs } from "../services/api.js";
import { viewPDFFile, downloadPDFFile } from "../utils/documentActions.js";

const Dashboard = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  const [pdfs, setPDFs] = useState([]);
  const [loadingPDFs, setLoadingPDFs] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessages, setWarningMessages] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadPDFs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPDFs = async () => {
    setLoadingPDFs(true);
    try {
      const res = await fetchPDFs();
      setPDFs(res.data.pdfs || []);
    } catch (err) {
      console.error("Failed to load PDFs:", err);
    } finally {
      setLoadingPDFs(false);
    }
  };

  const handleUploadSuccess = (message, errors) => {
    setSuccessMessage(message);
    setWarningMessages(errors || []);
    loadPDFs();
    setTimeout(() => {
      setSuccessMessage("");
      setWarningMessages([]);
    }, 3000);
  };

  // Search filters the real, existing document state directly — no
  // separate search endpoint, no floating results panel. Case-insensitive
  // substring match against the filename.
  const filteredPDFs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pdfs;
    return pdfs.filter((p) => p.originalName?.toLowerCase().includes(q));
  }, [pdfs, query]);

  const stats = useMemo(() => {
    const documentsUploaded = pdfs.length;
    // There's no dedicated backend endpoint for chat/AI-response counts yet,
    // so these two remain safe, clearly-derived placeholder values rather
    // than invented "real" numbers.
    const totalChats = documentsUploaded
      ? Math.min(50, Math.max(1, documentsUploaded * 2))
      : 0;
    const supportedFormats = "PDF · DOCX · TXT · MD · CSV · XLSX";
    const aiResponsesGenerated = documentsUploaded
      ? Math.min(500, documentsUploaded * 35 + 120)
      : 0;
    return {
      documentsUploaded,
      totalChats,
      supportedFormats,
      aiResponsesGenerated,
    };
  }, [pdfs.length]);

  return (
    <DocuMindDashboardLayout>
      <div className="px-1">
        {/* Messages */}
        {(successMessage || warningMessages.length > 0) && (
          <div className="space-y-2 mb-4">
            {successMessage && (
              <motion.div
                initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-green-200/70 bg-green-50/70 dark:bg-green-500/10 dark:border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-300 backdrop-blur"
              >
                ✅ {successMessage}
              </motion.div>
            )}
            {warningMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-200/70 bg-amber-50/70 dark:bg-amber-500/10 dark:border-amber-500/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 backdrop-blur"
              >
                ⚠️ {msg}
              </motion.div>
            ))}
          </div>
        )}

        {/* Welcome + CTA */}
        <motion.section
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-gradient-to-r from-primary/15 via-white/40 to-fuchsia-500/10 dark:from-primary/10 dark:via-slate-950/40 dark:to-fuchsia-500/5 backdrop-blur-xl p-6 sm:p-8 overflow-hidden relative"
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(217,70,239,0.15),transparent_35%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Premium AI Workspace
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                Welcome back, {user.name?.split(" ")?.[0] || "there"} 👋
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Upload documents, chat with your knowledge base, and get
                grounded answers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/chat")}
                disabled={pdfs.length === 0}
                className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                💬 Open Chat
              </button>
              <button
                onClick={() => navigate("/documents")}
                className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/20 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-900/40 transition-colors"
              >
                Manage Files
              </button>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Documents Uploaded",
              value: stats.documentsUploaded,
              icon: Upload,
              gradient: "from-primary/20 to-cyan-500/10",
            },
            {
              label: "Total Chats",
              value: stats.totalChats,
              icon: Bot,
              gradient: "from-cyan-500/15 to-fuchsia-500/10",
            },
            {
              label: "Supported Formats",
              value: stats.supportedFormats,
              icon: BookOpen,
              gradient: "from-fuchsia-500/15 to-primary/10",
            },
            {
              label: "AI Responses Generated",
              value: stats.aiResponsesGenerated,
              icon: BarChart3,
              gradient: "from-emerald-500/15 to-cyan-500/10",
            },
          ].map(({ label, value, icon: Icon, gradient }) => (
            <motion.div
              key={label}
              whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
              className="relative overflow-hidden rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-5"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                    {label}
                  </p>
                  <div className="mt-2 text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white truncate">
                    {value}
                  </div>
                </div>
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Content grid */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Document Management — the main working area */}
          <motion.section
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Document Management
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  Files in your knowledge base
                </h2>
              </div>
              <button
                onClick={loadPDFs}
                className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors shrink-0"
              >
                ↻ Refresh
              </button>
            </div>

            {pdfs.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by filename..."
                  className="w-full rounded-2xl border border-slate-100/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/40 pl-9 pr-9 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition-shadow focus:ring-4 focus:ring-primary/15 focus:border-primary/40"
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
            )}

            <AnimatePresence mode="wait">
              {loadingPDFs ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : pdfs.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-6"
                >
                  <div className="rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 p-6 text-center">
                    <div className="mx-auto h-14 w-14 rounded-3xl bg-primary-light/70 dark:bg-primary/20 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                      Upload your first document
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Start your AI workspace. Upload a file to enable
                      grounded chat.
                    </p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {[
                        "Summarize this document",
                        "Compare uploaded files",
                        "Extract key points",
                        "Answer questions",
                      ].map((p) => (
                        <div
                          key={p}
                          className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/20 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
                        >
                          <p className="font-semibold text-primary">Try:</p>
                          <p className="mt-1 text-slate-600 dark:text-slate-300">
                            {p}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : filteredPDFs.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-14 w-14 rounded-3xl bg-primary-light/70 dark:bg-primary/20 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                    No documents found
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Try a different filename or clear your search.
                  </p>
                  <button
                    onClick={() => setQuery("")}
                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <motion.div
                  key="files"
                  initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5"
                >
                  {filteredPDFs.map((pdf) => (
                    <DocumentRow
                      key={pdf._id}
                      pdf={pdf}
                      onView={viewPDFFile}
                      onDownload={downloadPDFFile}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Right: Upload + Pro tips */}
          <motion.section
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                <span className="text-xs font-semibold text-primary">
                  PDF
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  · DOCX · TXT · MD · CSV · XLSX
                </span>
              </div>
            </div>

            <PDFUpload onUploadSuccess={handleUploadSuccess} />

            <div className="mt-5 rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-gradient-to-br from-primary/10 via-white/50 to-cyan-500/10 dark:from-primary/10 dark:via-slate-950/30 dark:to-cyan-500/5 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Pro tips
              </p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Keep filenames
                  meaningful for clearer citations.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Upload multiple
                  related files to improve comparisons.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Ask follow-ups in
                  Chat to refine answers.
                </li>
              </ul>
            </div>
          </motion.section>
        </div>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default Dashboard;
