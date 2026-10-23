"use client";

import { RefinanceCalculator } from "./components/refinance-calculator";
import ThemeToggle from "@/app/lib/theme-toggle"



export default function Page() {
  return (
    <div className={`mortgage-refi-v3 min-h-screen p-6 max-w-5xl mx-auto`}>
      <ThemeToggle />
      {/* Markup ported verbatim from the standalone app's app/page.tsx */}
      <main className="min-h-screen pb-10 font-sans">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="sr-only">
            Mortgage Refinancing Calculator
          </h1>
        </div>
        <RefinanceCalculator />
      </main>
    </div>
  );
}
