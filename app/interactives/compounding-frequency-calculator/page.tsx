"use client"

import { Input } from "@/app/ui/components/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
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
          <section className="space-y-6 mb-10 w-full lg:w-1/2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Initial Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium">
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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-medium">
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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-medium">
                  years
                </span>
              </div>
              <p className="mt-2 text-sm ">
                {formatNumber(totalPeriods)} compounding periods
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Compounding Period</label>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedCompounding}
                  onChange={(e) => setSelectedCompounding(e.target.value as CompoundingPeriod)}
                  className="w-full h-12 px-4 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {compoundingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <Card className="w-full lg:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
            <CardHeader>
              <CardTitle className="text-[var(--text-navy)] text-[22px] font-bold">Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm font-bold mb-1">Final Amount</p>
              <p className="text-3xl font-bold text-lagunita mb-5">{formatCurrency(selectedResult.finalAmount)}</p>
              <p className="text-sm  font-bold mb-1">Total Interest Earned</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(selectedResult.interestEarned)}
              </p>
            </CardContent>
          </Card>
        </div>
          {/* Comparison Table */}
        <section className="rounded-3xl bg-[var(--grey-background)] p-6 mt-10">
          <h2 className="text-xl font-semibold mb-2">Comparison Across All Periods</h2>
          <p className="text-sm mb-4">
            See how compounding frequency impacts your returns
          </p>

          <div className="overflow-hidden bg-card">
            <table className="min-w-full">
              <thead>
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
                    className={selectedCompounding === result.value ? "bg-lagunita-lighter text-lagunita font-bold" : ""}
                  >
                    <td className="px-4 py-3 border-b">{result.label}</td>
                    <td className="text-right px-4 py-3 border-b text-black">{formatNumber(result.totalPeriods)}</td>
                    <td className="text-right px-4 py-3 border-b text-black">{formatCurrency(result.finalAmount)}</td>
                    <td className="text-right px-4 py-3 border-b">{formatCurrency(result.interestEarned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        
      </div>
    </div>
  )
}
