'use client';

import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

const themes = [
  { label: "Light", value: "light", icon: <FiSun size={20} aria-hidden="true" /> },
  { label: "Dark", value: "dark", icon: <FiMoon size={20} aria-hidden="true" /> },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.classList.toggle("light", theme === "light");
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  // Don't render until component is mounted on client
  if (!mounted) {
    return (
      <div role="group" aria-label="Theme" className="flex gap-2 items-center justify-end mb-4">
        <div className="px-3 py-1 rounded border bg-grey-light w-11 h-8" aria-hidden="true"></div>
        <div className="px-3 py-1 rounded border bg-grey-light w-11 h-8" aria-hidden="true"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center justify-end mb-4">
      {themes.map((t) => (
        <button
          key={t.value}
          className={`px-3 py-1 rounded border flex items-center justify-center ${
            theme === t.value ? "bg-lagunita text-white" : "bg-grey-light text-black"
          }`}
          onClick={() => setTheme(t.value)}
          aria-label={t.label}
          aria-pressed={theme === t.value}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}