"use client"

import { Input } from "@/app/ui/components/input"
import { Card, CardContent } from "@/app/ui/components/card"
import { useState, useMemo } from "react"
import ThemeToggle from "@/app/lib/theme-toggle";
import { FaAngleDown } from "react-icons/fa";
import InfoPopover from "@/app/ui/components/popover";

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
  if (!isFinite(value)) return "$∞"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function calculateCompoundInterest(
  principal: number,
  rate: number,
  totalPeriods: number,
  periodsPerYear: number
): { finalAmount: number; interestEarned: number; totalPeriods: number } {
  const ratePerPeriod = rate / periodsPerYear
  const finalAmount = principal * Math.pow(1 + ratePerPeriod, totalPeriods)
  const interestEarned = finalAmount - principal

  return { finalAmount, interestEarned, totalPeriods }
}

function formatTimePeriod(totalPeriods: number, periodsPerYear: number): string {
  const totalYears = totalPeriods / periodsPerYear
  const years = Math.floor(totalYears)
  const remainingPeriods = totalPeriods - (years * periodsPerYear)
  const months = Math.round((remainingPeriods / periodsPerYear) * 12)

  if (years === 0 && months === 0) return "0 months"
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`
  
  return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`
}

export default function CompoundInterestCalculator() {
  const [initialAmount, setInitialAmount] = useState<string>("")
  const [annualRate, setAnnualRate] = useState<string>("")
  const [periods, setPeriods] = useState<string>("")
  const [selectedCompounding, setSelectedCompounding] = useState<CompoundingPeriod>("monthly")

  const principal = parseFloat(initialAmount.replace('$', '')) || 0
  const rate = (parseFloat(annualRate.replace('%', '')) || 0) / 100
  const totalPeriods = parseFloat(periods) || 0

  const selectedOption = useMemo(() => 
    compoundingOptions.find((o) => o.value === selectedCompounding)!,
    [selectedCompounding]
  )

  const selectedResult = useMemo(() => {
    return calculateCompoundInterest(principal, rate, totalPeriods, selectedOption.periodsPerYear)
  }, [principal, rate, totalPeriods, selectedOption.periodsPerYear])

  const formattedTimePeriod = useMemo(() => 
    formatTimePeriod(totalPeriods, selectedOption.periodsPerYear),
    [totalPeriods, selectedOption.periodsPerYear]
  )

  const comparisonResults = useMemo(() => {
    const timeInYears = totalPeriods / selectedOption.periodsPerYear
    return compoundingOptions.map((option) => {
      const periodsForThisFrequency = timeInYears * option.periodsPerYear
      return {
        ...option,
        ...calculateCompoundInterest(principal, rate, periodsForThisFrequency, option.periodsPerYear),
      }
    })
  }, [principal, rate, totalPeriods, selectedOption.periodsPerYear])

  return (
    <div className=" p-6 max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="sr-only mb-2">Compounding Frequency Calculator</h1>
        <ThemeToggle />
        <div className="flex flex-col md:flex-row gap-8">

          {/* Input Fields */}
          <section className="space-y-6 mb-10 w-full lg:w-1/2">
            <div>
              <label className="block font-semibold text-foreground mb-2">Initial amount</label>
              <div className="relative">
                <Input
                  type="text"
                  value={initialAmount}
                  onChange={(e) => {
                    const input = e.target.value;
                    const numericPart = input.replace(/^\$/, '').replace(/[^0-9.]/g, '');
                    setInitialAmount('$' + numericPart);
                  }}
                  className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-2">Annual interest rate</label>
              <div className="relative">
                <Input
                  type="text"
                  value={annualRate}
                  onChange={(e) => {
                    const input = e.target.value;
                    const numericPart = input.replace(/^%/, '').replace(/[^0-9.]/g, '');
                    setAnnualRate(numericPart + '%');
                  }}
                  className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <div className="flex items-start gap-2">
                <label className="block font-semibold text-foreground mb-2">Number of compounding periods</label>
                <InfoPopover title="Compounding frequency">Periods are counted based on the selected compounding frequency. For monthly compounding, 60 periods equals 60 months.</InfoPopover>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={periods}
                  onChange={(e) => setPeriods(e.target.value)}
                  className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                />
                <p className="text-sm text-foreground mt-2">
                  {totalPeriods > 0 && `${formatNumber(totalPeriods)} ${selectedOption.label.toLowerCase()} periods = ${formattedTimePeriod}`}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-2">
                <label className="block font-semibold text-foreground mb-3">Compounding frequency</label>
                <InfoPopover title="Compounding frequency">Compounding frequency is how often interest is calculated and added to the balance. For example, monthly compounding applies interest once each month.</InfoPopover>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCompounding}
                  onChange={(e) => setSelectedCompounding(e.target.value as CompoundingPeriod)}
                  className="border-1 w-full rounded-md shadow-sm py-2 px-3 appearance-none"
                >
                  {compoundingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none  ml-[-40px] text-gray-400 text-lg">
                  <FaAngleDown />
                </div>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <Card className="w-full lg:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
            <CardContent className="p-0">
              <p className="text-[20px] font-bold mb-1">Balance after {formattedTimePeriod}</p>
              <p className="text-3xl font-bold text-lagunita mb-5">{formatCurrency(selectedResult.finalAmount)}</p>
              <p className="text-sm  font-bold mb-1">Interest Earned over {formattedTimePeriod}</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(selectedResult.interestEarned)}
              </p>
              <p className="font-bold text-foreground">
                With <span className="text-lagunita">{selectedCompounding}</span> compounding
              </p>
            </CardContent>
          </Card>
        </div>
          {/* Comparison Table */}
        <section className="rounded-3xl bg-[var(--grey-background)] p-6 mt-10">
          <h2 className="text-xl font-semibold mb-2">Comparison Across Compounding Frequencies</h2>
          <p className="text-sm mb-4">
            See how compounding frequency affects returns over the same time period.
          </p>

          <div className="overflow-hidden bg-card">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="font-semibold text-left px-4 py-3">Compounding Frequency</th>
                  <th className="font-semibold text-right px-4 py-3">Number of <br/>Compounding Periods</th>
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
                    <td className="text-right px-4 py-3 border-b text-foreground">{formatNumber(result.totalPeriods)}</td>
                    <td className="text-right px-4 py-3 border-b text-foreground">{formatCurrency(result.finalAmount)}</td>
                    <td className="text-right px-4 py-3 border-b">{formatCurrency(result.interestEarned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pt-3 font-bold text-sm">Over the same time period, more frequent compounding generally results in more interest earned, assuming the annual interest rate stays the same.</p>
          </div>
        </section>
        
      </div>
    </div>
  )
}