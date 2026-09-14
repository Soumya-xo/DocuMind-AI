import React, { useState, useEffect } from "react";

import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  FileText,
  History,
  Settings,
  Menu,
  X,
} from "lucide-react";
import logoPng from "../assets/logo.png";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Avatar from "../components/Avatar.jsx";
import { useLocalStorageUser } from "../hooks/useLocalStorageUser.js";

const navItems = [
  { to: "/dashboard", label: "Dashboard", Icon: BarChart3 },
  { to: "/chat", label: "AI Chat", Icon: Bot },
  { to: "/documents", label: "Documents", Icon: FileText },
  { to: "/history", label: "History", Icon: History },
  { to: "/settings", label: "Settings", Icon: Settings },
];

// Shared nav content, rendered both in the always-visible desktop sidebar
// and inside the mobile drawer. `onNavigate` lets the drawer close itself
// when a link is clicked. No account/profile block here — that's shown
// once, in the header's top-right (see DocuMindDashboardLayout below), so
// the sidebar doesn't duplicate it. Logout lives on the Settings page.
const SidebarNav = ({ onNavigate }) => (
  <nav className="mt-1 space-y-1">
    {navItems.map(({ to, label, Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors",
            isActive
              ? "bg-primary-light/70 dark:bg-primary/20 text-primary border border-primary/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-900/40 border border-transparent",
          ].join(" ")
        }
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

const DocuMindDashboardLayout = ({ children }) => {
  // Reactive user so Avatar updates immediately after profile changes.
  const user = useLocalStorageUser();

  // Desktop (md+) sidebar is always visible — no toggle, so navigation can
  // never accidentally disappear. This only controls the mobile drawer.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Escape closes the drawer; body scroll is locked while it's open so the
  // page behind it doesn't scroll along with the drawer's own content.
  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky glass header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-100/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex items-center justify-center rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex h-9 w-9 rounded-2xl items-center justify-center">
              <img
                src={logoPng}
                alt="DocuMind AI"
                className="h-9 w-9 rounded-2xl object-contain"
              />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              DocuMind AI
            </p>
          </div>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-2">
            <ThemeToggle />
          </div>

          <div className="hidden md:flex items-center gap-2">
            {/* Global avatar component */}
            <Avatar user={user} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="flex gap-4">
            {/* Desktop sidebar — always visible at md+, never toggled off */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="h-[calc(100vh-5rem)] sticky top-20 rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl p-4 overflow-y-auto">
                <SidebarNav />
              </div>
            </aside>

            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer (below md) */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 z-[70] h-full w-72 max-w-[80vw] bg-white dark:bg-slate-950 border-r border-slate-100/70 dark:border-slate-800/60 p-4 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <img
                    src={logoPng}
                    alt="DocuMind AI"
                    className="h-8 w-8 rounded-xl object-contain"
                  />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    DocuMind AI
                  </p>
                </div>

                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocuMindDashboardLayout;
