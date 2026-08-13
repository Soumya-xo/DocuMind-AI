import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import logoPng from "../assets/logo.png";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const LandingNavbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900">
            <img
              src={logoPng}
              alt="DocuMind AI"
              className="h-9 w-9 rounded-2xl object-contain"
            />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white sm:text-base">
              DocuMind AI
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Document intelligence platform
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-primary hover:text-primary md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-950/95"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <div className="flex items-center gap-3 pb-2">
                <ThemeToggle />
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  Sign Up
                </Link>
              </div>
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingNavbar;
