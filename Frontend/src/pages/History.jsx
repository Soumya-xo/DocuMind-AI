import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { fetchChatHistory, clearHistory } from "../services/api.js";
import { Bot, Trash2, Clock3, Search } from "lucide-react";
import DocuMindDashboardLayout from "../layouts/DocuMindDashboardLayout.jsx";

const History = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchChatHistory();
      setChats(res.data.chats || []);
    } catch (err) {
      setError("Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      [c.question, c.answer]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [chats, query]);

  const handleDeleteAll = async () => {
    if (!window.confirm("Clear all chat history?")) return;
    setDeleting(true);
    try {
      await clearHistory();
      setChats([]);
    } catch {
      alert("Failed to clear history.");
    } finally {
      setDeleting(false);
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
            History
          </motion.h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Your saved AI conversations.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200/70 bg-red-50/70 px-4 py-3 text-sm text-red-700 backdrop-blur">
            ⚠️ {error}
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Conversations
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400 rounded-full border border-slate-100/70 dark:border-slate-800/60 px-3 py-1 bg-white/40 dark:bg-slate-900/20">
                {chats.length} saved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-64 max-w-full rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <button
                onClick={handleDeleteAll}
                disabled={deleting || chats.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200/70 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100/90 dark:hover:bg-red-500/15 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Clearing..." : "Clear"}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-[1.5rem] bg-slate-100/70 dark:bg-slate-800/50 animate-pulse"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto h-14 w-14 rounded-3xl bg-primary-light/70 dark:bg-primary/20 border border-slate-100/70 dark:border-slate-800/60 flex items-center justify-center text-primary">
                  <Clock3 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  No conversations yet
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Start a chat to see it saved here.
                </p>
                <button
                  onClick={() => navigate("/chat")}
                  className="mt-5 rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
                >
                  Go to AI Chat
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((c) => (
                  <motion.button
                    key={c._id}
                    initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    onClick={() => navigate("/chat")}
                    className="w-full text-left rounded-[1.5rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 p-4 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {c.question}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {c.answer}
                        </p>
                      </div>
                      <div className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default History;
