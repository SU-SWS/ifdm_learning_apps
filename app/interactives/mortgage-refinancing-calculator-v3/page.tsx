"use client";

import { RefinanceCalculator } from "./components/refinance-calculator";
import ThemeToggle from "@/app/lib/theme-toggle"



export default function Page() {
  return (
    <div className={`mortgage-refi-v3 min-h-screen p-6 max-w-5xl mx-auto`}>
      <ThemeToggle />
      {/* Markup ported verbatim from the standalone app's app/page.tsx */}
      <main className="min-h-screen px-4 py-10 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 w-full max-w-5xl">
          <h1 className="sr-only">
            Mortgage Refinancing Calculator
          </h1>
          <p className="mt-1">
            Estimate your current balance, then see whether refinancing is worth it.
          </p>
        </div>
        <RefinanceCalculator />
      </main>
    </div>
  );
}
