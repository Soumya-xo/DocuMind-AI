import React, { createContext, useContext, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "documind-theme";

const ThemeContext = createContext(null);

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  } catch {
    // Ignore storage errors and fall back to system preference.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
