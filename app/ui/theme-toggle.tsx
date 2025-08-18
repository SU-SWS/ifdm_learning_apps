import { useEffect, useState } from "react";

const themes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
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
    <div className="flex gap-2 items-center">
      {themes.map((t) => (
        <button
          key={t.value}
          className={`px-3 py-1 rounded border ${theme === t.value ? "bg-lagunita text-white" : "bg-grey-light text-black"}`}
          onClick={() => setTheme(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}