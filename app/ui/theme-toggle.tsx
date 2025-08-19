"use client"

import { useEffect, useState } from "react";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

const themes = [
  { label: "Light", value: "light", icon: <FiSun size={20} /> },
  { label: "Dark", value: "dark", icon: <FiMoon size={20} /> },
  { label: "System", value: "system", icon: <FiMonitor size={20} /> },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage immediately since we're client-only
    if (typeof window !== 'undefined') {
      return localStorage.getItem("theme") || "system";
    }
    return "system";
  });

  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(isDark ? "dark" : "light");
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(theme === "dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="flex gap-2 items-center justify-end mb-4">
      {themes.map((t) => (
        <button
          key={t.value}
          className={`px-3 py-1 rounded border flex items-center justify-center ${theme === t.value ? "bg-lagunita text-white" : "bg-grey-light text-black"}`}
          onClick={() => setTheme(t.value)}
          aria-label={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}