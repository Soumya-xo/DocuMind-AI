import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="
        h-11 w-11
        rounded-2xl
        border border-slate-700
        bg-slate-900
        flex items-center justify-center
        transition-all duration-300
        hover:scale-105
      "
    >
      {isDark ? (
        <div className="relative">
          <Sun className="h-5 w-5 text-amber-400" />
          <div className="absolute inset-0 blur-md bg-amber-400 opacity-30 rounded-full" />
        </div>
      ) : (
        <Moon className="h-5 w-5 text-blue-400" />
      )}
    </button>
  );
};

export default ThemeToggle;