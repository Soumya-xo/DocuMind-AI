import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";

import DocuMindDashboardLayout from "../../layouts/DocuMindDashboardLayout.jsx";
import { deleteUserAccount } from "../../services/userService.js";

const DeleteAccount = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onDelete = async (e) => {
    e.preventDefault();
    if (!passwordConfirmation) {
      setError("Password confirmation is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await deleteUserAccount({ passwordConfirmation });
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Failed to delete account.");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("Account deleted successfully.");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Delete failed.");
    } finally {
      setLoading(false);
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
            Delete Account
          </motion.h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This action is permanent and cannot be undone.
          </p>
        </div>

        <section className="rounded-[2rem] border border-red-200/70 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 backdrop-blur-xl p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-200" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-200">
              Delete Account
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-red-200/70 dark:border-red-500/20 bg-white/60 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                User name
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name || ""}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200/70 dark:border-red-500/20 bg-white/60 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                User email
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <form onSubmit={onDelete} className="mt-5">
            <div className="rounded-2xl border border-red-200/70 dark:border-red-500/20 bg-white/60 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Confirm password
              </p>
              <input
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-xl border border-red-200/70 dark:border-red-500/20 bg-white/60 dark:bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white outline-none"
                required
              />

              {error && (
                <p className="mt-3 text-sm text-red-700 dark:text-red-200">
                  ⚠️ {error}
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="rounded-2xl border border-red-200/70 dark:border-red-500/20 bg-white/60 dark:bg-slate-900/40 px-5 py-2.5 text-sm font-semibold text-red-700 dark:text-red-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-red-600 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Permanently Delete Account
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default DeleteAccount;
