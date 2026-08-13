import React from "react";

import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, Bot, FileText, History, Settings } from "lucide-react";
import logoPng from "../../assets/logo.png";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import Avatar from "../../components/Avatar.jsx";
import { useLocalStorageUser } from "../../hooks/useLocalStorageUser.js";

const navItemsLoggedIn = [
  { to: "/dashboard", label: "Dashboard", Icon: BarChart3 },
  { to: "/chat", label: "AI Chat", Icon: Bot },
  { to: "/documents", label: "Documents", Icon: FileText },
  { to: "/history", label: "History", Icon: History },
  { to: "/settings", label: "Settings", Icon: Settings },
];

const navItemsLoggedOut = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Pricing", href: "#pricing" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const user = useLocalStorageUser();
  const isAuthed = Boolean(localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100/70 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <NavLink
            to={isAuthed ? "/dashboard" : "/"}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg shadow-slate-900/20 dark:bg-white">
              <img
                src={logoPng}
                alt="DocuMind AI"
                className="h-10 w-10 rounded-2xl object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                DocuMind AI
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Document intelligence platform
              </p>
            </div>
          </NavLink>

          <div className="flex items-center gap-3">
            {!isAuthed ? (
              <nav className="hidden lg:flex items-center gap-6">
                {navItemsLoggedOut.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            ) : (
              <nav className="hidden lg:flex items-center gap-1.5">
                {navItemsLoggedIn.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      [
                        "px-3 py-2 rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2",
                        isActive
                          ? "bg-primary-light/70 dark:bg-primary/20 text-primary border border-primary/20"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-900/40 border border-transparent",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </nav>
            )}

            <ThemeToggle />

            {!isAuthed ? (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Get Started
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-2">
                  <div className="h-9 w-9 rounded-2xl bg-transparent flex items-center justify-center">
                    <Avatar user={user} size="sm" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {user?.name || "User"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
