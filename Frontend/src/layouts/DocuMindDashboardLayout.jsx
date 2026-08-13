import React, { useState } from "react";

import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  FileText,
  History,
  Settings,
  ChevronLeft,
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

const DocuMindDashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  // Reactive user so Avatar updates immediately after profile changes.
  const user = useLocalStorageUser();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky glass header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-100/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="inline-flex items-center justify-center rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors md:hidden"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-0" : "-rotate-180"}`}
            />
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
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="hidden md:block w-72 shrink-0"
                >
                  <div className="h-[calc(100vh-5rem)] sticky top-20 rounded-[1.75rem] border border-slate-100/70 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/50 backdrop-blur-xl p-4 overflow-y-auto">
                    <nav className="mt-1 space-y-1">
                      {navItems.map(({ to, label, Icon }) => (
                        <NavLink
                          key={to}
                          to={to}
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

                    <div className="mt-5 border-t border-slate-100/70 dark:border-slate-800/60 pt-4">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-11 w-11 flex items-center justify-center">
                          <Avatar user={user} size="md" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.email || ""}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 px-2">
                        <button
                          onClick={handleLogout}
                          className="w-full btn-danger"
                        >
                          Logout
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 px-2 text-xs text-slate-500 dark:text-slate-400">
                      Tip: Use the sidebar to switch workspaces.
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocuMindDashboardLayout;
