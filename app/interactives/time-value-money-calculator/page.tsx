"use client"
  import ThemeToggle from "@/app/lib/theme-toggle"
  import { TVMCalculator } from "./app"
    
  export default function Page() {
    return (
      <div className="p-6 max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="sr-only">Time Value of Money Calculator</h1>
          <TVMCalculator />
        </div>
    </div>
  )