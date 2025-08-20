import { useEffect, useState } from "react";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

const themes = [
  { label: "Light", value: "light", icon: <FiSun size={20} /> },
  { label: "Dark", value: "dark", icon: <FiMoon size={20} /> },
  { label: "System", value: "system", icon: <FiMonitor size={20} /> },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.classList.toggle("light", theme === "light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "system";
    setTheme(saved);
    if (saved === "system") {
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches);
      };
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handler);
      return () => window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", handler);
    }
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