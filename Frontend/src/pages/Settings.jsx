import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck,
  UserRound,
  MoonStar,
  Sun,
  Trash2,
  Settings as SettingsIcon,
} from "lucide-react";
import DocuMindDashboardLayout from "../layouts/DocuMindDashboardLayout.jsx";

const Settings = () => {
  const reduceMotion = useReducedMotion();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    [],
  );

  const [localTheme, setLocalTheme] = useState(() => {
    // uses existing theme system via ThemeContext in toggle; UI-only here
    return typeof document !== "undefined"
      ? document.documentElement?.dataset?.theme || "light"
      : "light";
  });

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
            Profile, security, appearance and account options.
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
              <MoonStar className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Appearance
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Theme
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {localTheme}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Use the theme toggle in the header to switch between light and
                  dark.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() =>
                  alert(
                    "System theme persistence is handled by the global ThemeContext.",
                  )
                }
                className="w-full rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-900/40 transition-colors"
              >
                Theme options
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/45 backdrop-blur-xl p-4 sm:p-6 overflow-hidden lg:col-span-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Security
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Change password
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Update your password securely.
                </p>

                <button
                  onClick={() => (window.location.href = "/settings/password")}
                  className="mt-3 w-full rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
                >
                  Update password
                </button>
              </div>
              <div className="rounded-2xl border border-slate-100/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Account actions
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
            </div>

            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Note: Theme switching uses the existing ThemeContext toggle in the
              app header.
            </div>
          </section>
        </div>
      </div>
    </DocuMindDashboardLayout>
  );
};

export default Settings;
