import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  UserRound,
  LogOut,
  Settings as SettingsIcon,
  RefreshCw,
  Loader2,
} from "lucide-react";
import DocuMindDashboardLayout from "../layouts/DocuMindDashboardLayout.jsx";
import { reindexDocuments } from "../services/api.js";

const Settings = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  // Relocated from the sidebar (DocuMindDashboardLayout) — same logic,
  // same clear-then-redirect behavior, just moved to live here instead.
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [reindexing, setReindexing] = useState(false);
  const [reindexMessage, setReindexMessage] = useState(null); // { type: "success" | "error", text }

  const handleReindex = async () => {
    setReindexing(true);
    setReindexMessage(null);

    try {
      const res = await reindexDocuments();
      setReindexMessage({
        type: "success",
        text: `Re-indexed ${res.data.chunks} chunk(s) successfully.`,
      });
    } catch (err) {
      setReindexMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to re-index documents.",
      });
    } finally {
      setReindexing(false);
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
            Settings
          </motion.h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Profile, security, and account options.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Profile
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Full name
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {user.name || "User"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {user.email || ""}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => (window.location.href = "/settings/profile")}
                className="w-full rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
              >
                Update profile
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Security
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Change password
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Update your password securely.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => (window.location.href = "/settings/password")}
                className="w-full rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
              >
                Update password
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden lg:col-span-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Document Index
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Re-index documents
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Rebuilds your document search index from your existing
                uploads for the currently active AI provider — no re-upload
                needed. Useful after an embedding provider change.
              </p>

              {reindexMessage && (
                <div
                  className={
                    reindexMessage.type === "success"
                      ? "mt-3 rounded-xl border border-green-200/70 bg-green-50/70 px-3 py-2 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                      : "mt-3 rounded-xl border border-red-200/70 bg-red-50/70 px-3 py-2 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  }
                >
                  {reindexMessage.type === "success" ? "✅ " : "⚠️ "}
                  {reindexMessage.text}
                </div>
              )}

              <button
                onClick={handleReindex}
                disabled={reindexing}
                className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reindexing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Re-indexing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Re-index Documents
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden lg:col-span-2">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Account Actions
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Delete account
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Delete your account permanently.
                </p>

                <button
                  onClick={() =>
                    (window.location.href = "/settings/delete-account")
                  }
                  className="mt-3 w-full rounded-2xl bg-red-50/70 dark:bg-red-500/10 border border-red-200/70 dark:border-red-500/20 text-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-100/90 dark:hover:bg-red-500/15 transition-colors"
                >
                  Delete account
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Logout
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Sign out of your account.
                </p>

                <button
                  onClick={handleLogout}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default Settings;
