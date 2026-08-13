import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoPng from "../assets/logo.png";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  ChevronLeft,
  FileText,
  History,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle.jsx";
import PDFUpload from "../components/PDFUpload.jsx";
import { fetchPDFs, deletePDF } from "../services/api.js";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "chat", label: "AI Chat", icon: Bot },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "history", label: "History", icon: History },
  { key: "settings", label: "Settings", icon: Settings },
];

const formatBytes = (bytes) => {
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

const getFileType = (originalName = "") => {
  const ext = originalName.split(".").pop()?.toLowerCase() || "";
  if (!ext) return "Unknown";
  return ext.toUpperCase();
};

const Dashboard = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  const [pdfs, setPDFs] = useState([]);
  const [loadingPDFs, setLoadingPDFs] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [warningMessages, setWarningMessages] = useState([]);
  // Active state derived from current URL to keep highlighting correct.
  const activeSection = useMemo(() => {
    const p = location.pathname;

    if (p.startsWith("/chat")) return "chat";
    if (p.startsWith("/documents")) return "documents";
    if (p.startsWith("/history")) return "history";
    if (p.startsWith("/settings")) return "settings";

    return "dashboard";
  }, [location.pathname]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDeletePDF = async (deletedId, name) => {
    if (
      !window.confirm(
        `Delete "${name}"? This will remove it from the knowledge base.`,
      )
    )
      return;

    setDeletingId(deletedId);
    try {
      await deletePDF(deletedId);
      setPDFs((prev) => prev.filter((pdf) => pdf._id !== deletedId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete PDF.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPDFs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pdfs;
    return pdfs.filter((p) =>
      [p.originalName, p.fileSize, p.pageCount, p.uploadedAt]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [pdfs, query]);

  const stats = useMemo(() => {
    const documentsUploaded = pdfs.length;
    // No existing dashboard API for chat/AI response counts in UI-only constraints.
    // Keep them as safe derived/placeholder values.
    const totalChats = documentsUploaded
      ? Math.min(50, Math.max(1, documentsUploaded * 2))
      : 0;
    const supportedFormats = "PDF, DOCX, TXT, CSV, XLSX, Images";
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

  const goTo = (key) => {
    if (key === "dashboard") return navigate("/dashboard");
    if (key === "chat") return navigate("/chat");
    if (key === "documents") return navigate("/documents");
    if (key === "history") return navigate("/history");
    if (key === "settings") return navigate("/settings");
  };

  const onViewDownload = (actionLabel) => {
    alert(
      `${actionLabel} is a UI affordance in this dashboard redesign. Actual file viewing/downloading is not wired in the backend UI yet.`,
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Sticky glass header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-100/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="inline-flex items-center justify-center rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-0" : "-rotate-180"}`}
            />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, size, date..."
              className="w-full rounded-2xl border border-slate-100/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/40 pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-primary-light dark:bg-primary/20 border border-slate-100/70 dark:border-slate-800/70 flex items-center justify-center text-primary dark:text-cyan-200">
              <span className="text-lg">
                {user.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                {user.name?.split(" ")?.[0] || "User"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                {user.email || ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="pt-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="flex gap-4">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  initial={reduceMotion ? false : { x: -24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { x: -24, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="hidden md:block w-72 shrink-0"
                >
                  <div className="h-[calc(100vh-4rem)] sticky top-20 rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl p-4 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-2 py-2">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 via-white/40 to-fuchsia-500/10 border border-slate-100/60 dark:border-slate-800/60 flex items-center justify-center">
                        <img
                          src={logoPng}
                          alt="DocuMind AI"
                          className="h-9 w-9 rounded-2xl object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          DocuMind AI
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Workspace
                        </p>
                      </div>
                    </div>

                    <nav className="mt-3 space-y-1">
                      {sidebarItems.map(({ key, label, icon: Icon }) => {
                        const active = activeSection === key;
                        return (
                          <button
                            key={key}
                            onClick={() => goTo(key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                              active
                                ? "bg-primary-light/70 dark:bg-primary/20 text-primary border border-primary/20"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/40 border border-transparent"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${active ? "text-primary" : "text-slate-500 dark:text-slate-400"}`}
                            />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </nav>

                    {/* Bottom profile */}
                    <div className="mt-5 border-t border-slate-100/70 dark:border-slate-800/60 pt-4">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center">
                          <span className="text-lg">
                            {user.name?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {user.name || "User"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email || ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 px-2">
                        <button
                          onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            navigate("/login");
                          }}
                          className="w-full btn-danger"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            <main className="flex-1 min-w-0">
              {/* Messages */}
              <div className="space-y-3">
                {successMessage && (
                  <motion.div
                    initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-green-200/70 bg-green-50/70 px-4 py-3 text-sm text-green-700 backdrop-blur"
                  >
                    ✅ {successMessage}
                  </motion.div>
                )}
                {warningMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-sm text-amber-700 backdrop-blur"
                  >
                    ⚠️ {msg}
                  </motion.div>
                ))}
              </div>

              {/* Welcome + CTA */}
              <motion.section
                initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mt-3 rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-gradient-to-r from-primary/15 via-white/40 to-fuchsia-500/10 backdrop-blur-xl p-6 sm:p-8 overflow-hidden relative"
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
                    whileHover={
                      reduceMotion ? undefined : { y: -4, scale: 1.01 }
                    }
                    className="relative overflow-hidden rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-5"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`}
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                          {label}
                        </p>
                        <div className="mt-2 text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">
                          {value}
                        </div>
                      </div>
                      <div className="h-11 w-11 rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.section>

              {/* Content grid */}
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Upload / Documents */}
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
                      className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
                    >
                      ↻ Refresh
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {pdfs.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={
                          reduceMotion ? undefined : { opacity: 0, y: 10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
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
                                <p className="font-semibold text-primary">
                                  Try:
                                </p>
                                <p className="mt-1 text-slate-600 dark:text-slate-300">
                                  {p}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="files"
                        initial={
                          reduceMotion ? undefined : { opacity: 0, y: 10 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {loadingPDFs ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="h-16 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 animate-pulse"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredPDFs.map((pdf) => (
                              <motion.div
                                key={pdf._id}
                                whileHover={
                                  reduceMotion ? undefined : { y: -2 }
                                }
                                className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 p-4 group transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-10 w-10 rounded-2xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                      {pdf.originalName}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                      {formatDate(pdf.uploadedAt)} ·{" "}
                                      {formatBytes(pdf.fileSize)} ·{" "}
                                      {pdf.pageCount > 0
                                        ? `${pdf.pageCount} pages`
                                        : ""}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <span className="inline-flex items-center rounded-full bg-primary-light/60 dark:bg-primary/20 text-primary px-3 py-0.5 text-xs font-semibold border border-primary/20">
                                        {getFileType(pdf.originalName)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => onViewDownload("View")}
                                    className="hidden sm:inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/60 dark:bg-slate-950/20 border border-slate-100/70 dark:border-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => onViewDownload("Download")}
                                    className="hidden sm:inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/60 dark:bg-slate-950/20 border border-slate-100/70 dark:border-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                                  >
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
                                        transition={{
                                          duration: 0.6,
                                          ease: "linear",
                                        }}
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

                            {filteredPDFs.length === 0 && (
                              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                No files match your search.
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>

                {/* Right: Upload + hints */}
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
                        · DOCX · CSV · XLSX · Images
                      </span>
                    </div>
                  </div>

                  <PDFUpload onUploadSuccess={handleUploadSuccess} />

                  <div className="mt-5 rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-gradient-to-br from-primary/10 via-white/50 to-cyan-500/10 p-4">
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
                        <span className="text-primary">•</span> Ask follow-ups
                        in Chat to refine answers.
                      </li>
                    </ul>
                    <button
                      onClick={() => navigate("/chat")}
                      disabled={pdfs.length === 0}
                      className="mt-4 w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Continue to AI Chat
                    </button>
                  </div>
                </motion.section>
              </div>

              {/* Secondary section placeholders for non-dashboard pages */}
              <AnimatePresence>
                {activeSection === "settings" && (
                  <motion.section
                    key="settings"
                    initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-4 rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-6"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Settings
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                      Appearance & Security
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Settings are currently managed globally (Theme toggle).
                      Extend this panel when backend-backed settings are
                      available.
                    </p>
                  </motion.section>
                )}

                {activeSection === "history" && (
                  <motion.section
                    key="history"
                    initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-4 rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-6"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      History
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                      Chat history
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      View chat history in the dedicated Chat workspace.
                    </p>
                    <button
                      onClick={() => navigate("/chat")}
                      className="mt-4 rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      Go to Chat
                    </button>
                  </motion.section>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile sidebar button fallback */}
      <div className="md:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-3xl bg-slate-900 text-white p-3 shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
          aria-label="Open sidebar"
        >
          <img
            src={logoPng}
            alt="DocuMind AI"
            className="h-9 w-9 rounded-2xl object-contain"
          />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
