'use client';

import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

const themes = [
  { label: "Light", value: "light", icon: <FiSun size={20} /> },
  { label: "Dark", value: "dark", icon: <FiMoon size={20} /> },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
  }, []);

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