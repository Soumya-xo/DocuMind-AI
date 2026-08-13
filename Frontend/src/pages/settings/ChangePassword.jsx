import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import DocuMindDashboardLayout from "../../layouts/DocuMindDashboardLayout.jsx";
import { changeUserPassword } from "../../services/userService.js";

const ChangePassword = () => {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const validate = () => {
    if (!currentPassword) return "Current password is required.";
    if (!newPassword || newPassword.length < 6)
      return "New password must be at least 6 characters.";
    if (newPassword !== confirmPassword)
      return "New password and confirm password must match.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    try {
      setLoading(true);
      setFormError("");

      const res = await changeUserPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Failed to change password.");
      }

      alert("Password updated successfully!");
      navigate("/settings");
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          err.message ||
          "Password update failed.",
      );
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
            Update Password
          </motion.h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Change your account password securely.
          </p>
        </div>

        <section className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Password security
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Current password
              </p>
              <div className="mt-1 flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                New password
              </p>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white outline-none"
                required
                minLength={6}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Must be at least 6 characters.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Confirm new password
              </p>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/30 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white outline-none"
                required
              />
            </div>

            {formError && (
              <div className="rounded-2xl border border-red-200/70 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 px-4 py-3 sm:col-span-2 text-sm text-red-700 dark:text-red-200">
                ⚠️ {formError}
              </div>
            )}

            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            User: {user?.email || ""}
          </p>
        </section>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default ChangePassword;
