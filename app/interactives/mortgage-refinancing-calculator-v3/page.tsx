"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { RefinanceCalculator } from "./components/refinance-calculator";
import "@/app/ui/theme.css";

// Same fonts the original standalone app used, so typography is unchanged.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function Page() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} mortgage-refi-v3 min-h-screen`}>
      {/* Markup ported verbatim from the standalone app's app/page.tsx */}
      <main className="min-h-screen px-4 py-10 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 w-full max-w-5xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Mortgage Refinancing Calculator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimate your current balance, then see whether refinancing is worth it.
          </p>
        </div>
        <RefinanceCalculator />
      </main>
    </div>
  );
}
