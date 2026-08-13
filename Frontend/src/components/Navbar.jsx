import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import logoPng from "../assets/logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">
              <img
                src={logoPng}
                alt="DocuMind AI"
                className="h-9 w-9 rounded-2xl object-contain"
              />
            </span>
            <span className="font-semibold text-slate-800 text-sm sm:text-base">
              DocuMind AI
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/dashboard"
                  ? "bg-primary-light text-primary"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/chat"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/chat"
                  ? "bg-primary-light text-primary"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Chat
            </Link>

            {/* User info + logout */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-100">
              <span className="hidden sm:block text-xs text-slate-500 font-medium">
                {user.name || "User"}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
