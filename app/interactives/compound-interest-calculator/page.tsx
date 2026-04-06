"use client"

import { Input } from "@/app/ui/components/input"
import { useState, useMemo } from "react"
import ThemeToggle from "@/app/lib/theme-toggle";


type CompoundingPeriod = "annually" | "semi-annually" | "quarterly" | "monthly" | "biweekly" | "weekly" | "daily"

const compoundingOptions: { value: CompoundingPeriod; label: string; periodsPerYear: number }[] = [
  { value: "annually", label: "Annually", periodsPerYear: 1 },
  { value: "semi-annually", label: "Semi-annually", periodsPerYear: 2 },
  { value: "quarterly", label: "Quarterly", periodsPerYear: 4 },
  { value: "monthly", label: "Monthly", periodsPerYear: 12 },
  { value: "biweekly", label: "Biweekly", periodsPerYear: 26 },
  { value: "weekly", label: "Weekly", periodsPerYear: 52 },
  { value: "daily", label: "Daily", periodsPerYear: 365 },
]

function formatCurrency(value: number): string {
  const formatted = value.toFixed(2)
  const [intPart, decPart] = formatted.split(".")
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `$${withCommas}.${decPart}`
}

function formatNumber(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function calculateCompoundInterest(
  principal: number,
  rate: number,
  years: number,
  periodsPerYear: number
): { finalAmount: number; interestEarned: number; totalPeriods: number } {
  const totalPeriods = years * periodsPerYear
  const ratePerPeriod = rate / periodsPerYear
  const finalAmount = principal * Math.pow(1 + ratePerPeriod, totalPeriods)
  const interestEarned = finalAmount - principal

  return { finalAmount, interestEarned, totalPeriods }
}

export default function CompoundInterestCalculator() {
  const [initialAmount, setInitialAmount] = useState<string>("10000")
  const [annualRate, setAnnualRate] = useState<string>("7")
  const [years, setYears] = useState<string>("5")
  const [selectedCompounding, setSelectedCompounding] = useState<CompoundingPeriod>("monthly")

  const principal = parseFloat(initialAmount) || 0
  const rate = (parseFloat(annualRate) || 0) / 100
  const timeYears = parseFloat(years) || 0

  const selectedResult = useMemo(() => {
    const option = compoundingOptions.find((o) => o.value === selectedCompounding)!
    return calculateCompoundInterest(principal, rate, timeYears, option.periodsPerYear)
  }, [principal, rate, timeYears, selectedCompounding])

  const comparisonResults = useMemo(() => {
    return compoundingOptions.map((option) => ({
      ...option,
      ...calculateCompoundInterest(principal, rate, timeYears, option.periodsPerYear),
    }))
  }, [principal, rate, timeYears])

  const totalPeriods = useMemo(() => {
    const option = compoundingOptions.find((o) => o.value === selectedCompounding)!
    return timeYears * option.periodsPerYear
  }, [timeYears, selectedCompounding])

  return (
    <div className=" p-6 max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="sr-only mb-2">Present Value Calculator</h1>
        <ThemeToggle />
        <div className="flex flex-col md:flex-row gap-8">

          {/* Input Fields */}
          <section className="space-y-6 mb-10">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Initial Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="pl-7 h-12 text-lg bg-card"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Annual Interest Rate</label>
              <div className="relative">
                <Input
                  type="number"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  className="pr-8 h-12 text-lg bg-card"
                  min="0"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Time Period</label>
              <div className="relative">
                <Input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="pr-16 h-12 text-lg bg-card"
                  min="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  years
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatNumber(totalPeriods)} compounding periods
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Compounding Period</label>
              <div className="flex flex-wrap gap-2">
                {compoundingOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedCompounding(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      selectedCompounding === option.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Results Section */}
          <section className="bg-card rounded-xl border border-border p-6 mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Final Amount</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(selectedResult.finalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Interest Earned</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(selectedResult.interestEarned)}
                </p>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Comparison Across All Periods</h2>
            <p className="text-sm text-muted-foreground mb-4">
              See how compounding frequency impacts your returns
            </p>

            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <table className="min-w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="font-semibold text-left px-4 py-3">Compounding</th>
                    <th className="font-semibold text-right px-4 py-3">Periods</th>
                    <th className="font-semibold text-right px-4 py-3">Final Amount</th>
                    <th className="font-semibold text-right px-4 py-3">Interest Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResults.map((result) => (
                    <tr
                      key={result.value}
                      className={selectedCompounding === result.value ? "bg-primary/5" : ""}
                    >
                      <td className="font-medium px-4 py-3">{result.label}</td>
                      <td className="text-right px-4 py-3">{formatNumber(result.totalPeriods)}</td>
                      <td className="text-right px-4 py-3">{formatCurrency(result.finalAmount)}</td>
                      <td className="text-right px-4 py-3">{formatCurrency(result.interestEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          </div>
        </div>
    </div>
  )
}
