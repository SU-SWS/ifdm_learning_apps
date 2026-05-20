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

const MAX_INITIAL_AMOUNT = 50_000_000_000_000 // 50 trillion
const MAX_ANNUAL_RATE = 1000 // 1,000%

export default function CompoundInterestCalculator() {
  const [initialAmount, setInitialAmount] = useState<string>("")
  const [annualRate, setAnnualRate] = useState<string>("")
  const [periods, setPeriods] = useState<string>("")
  const [selectedCompounding, setSelectedCompounding] = useState<CompoundingPeriod>("monthly")

  const principal = parseFloat(initialAmount) || 0
  const rate = (parseFloat(annualRate) || 0) / 100
  const totalPeriods = parseFloat(periods) || 0

  const selectedOption = useMemo(() =>
    compoundingOptions.find((o) => o.value === selectedCompounding)!,
    [selectedCompounding]
  )

  const selectedResult = useMemo(() => {
    return calculateCompoundInterest(principal, rate, totalPeriods, selectedOption.periodsPerYear)
  }, [principal, rate, totalPeriods, selectedOption.periodsPerYear])

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

  const [initialAmountError, setInitialAmountError] = useState<string>("")
  const [annualRateError, setAnnualRateError] = useState<string>("")

  type CompoundingPeriod = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually';

  const getPeriodText = (compounding: CompoundingPeriod, periods: number): string => {
    const periodMap: Record<CompoundingPeriod, [string, string]> = {
      daily: ['day', 'days'],
      weekly: ['week', 'weeks'],
      biweekly: ['bi-weekly period', 'bi-weekly periods'],
      monthly: ['month', 'months'],
      quarterly: ['quarter', 'quarters'],
      'semi-annually': ['semi-annual period', 'semi-annual periods'],
      annually: ['year', 'years']
    };

    const [singular, plural] = periodMap[compounding];
    return periods === 1 ? singular : plural;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="sr-only">Compounding Frequency Calculator</h1>
        <ThemeToggle />
        <div className="flex flex-col md:flex-row gap-8">
          {/* Input Fields */}
          <section
            aria-label="Calculator inputs"
            className="space-y-6 mb-10 w-full lg:w-1/2"
          >
            <div>
              <label
                htmlFor="initial-amount"
                className="block font-semibold text-foreground mb-2"
              >
                Initial amount
              </label>
              <div className="relative">
                <Input
                  id="initial-amount"
                  type="text"
                  value={initialAmount}
                  onChange={(e) => {
                    const input = e.target.value;
                    const numericPart = input.replace(/[^0-9.]/g, "");
                    const numericValue = parseFloat(numericPart);
                    if (
                      !isNaN(numericValue) &&
                      numericValue > MAX_INITIAL_AMOUNT
                    ) {
                      setInitialAmountError(
                        "Initial amount cannot exceed $50,000,000,000,000.",
                      );
                      return;
                    }
                    setInitialAmountError("");
                    setInitialAmount(numericPart);
                  }}
                  min="0"
                  className={`block w-full pl-8 rounded-md shadow-sm border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${initialAmountError ? "border-error border-2" : ""}`}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)]">
                  $
                </span>
              </div>
              {initialAmountError && (
                <p
                  role="alert"
                  className="mt-1 text-sm text-error font-semibold"
                >
                  {initialAmountError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="annual-rate"
                className="block font-semibold text-foreground mb-2"
              >
                Annual interest rate
              </label>
              <div className="relative">
                <Input
                  id="annual-rate"
                  type="text"
                  value={annualRate}
                  onChange={(e) => {
                    const input = e.target.value;
                    const numericPart = input.replace(/[^0-9.]/g, "");
                    const numericValue = parseFloat(numericPart);
                    if (
                      !isNaN(numericValue) &&
                      numericValue > MAX_ANNUAL_RATE
                    ) {
                      setAnnualRateError(
                        "Annual interest rate cannot exceed 1,000%.",
                      );
                      return;
                    }
                    setAnnualRateError("");
                    setAnnualRate(numericPart);
                  }}
                  className={`block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${annualRateError ? "border-error border-2" : ""}`}
                  min="0"
                  step="0.1"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-medium text-[var(--color-symbols)]"
                >
                  %
                </span>
              </div>
              {annualRateError && (
                <p
                  role="alert"
                  className="mt-1 text-sm text-error font-semibold"
                >
                  {annualRateError}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-start gap-2">
                <label
                  htmlFor="periods"
                  className="block font-semibold text-foreground mb-2"
                >
                  Number of compounding periods
                </label>
                <InfoPopover title="Number of compounding periods">
                  Periods are counted based on the selected compounding
                  frequency. For monthly compounding, 60 periods equals 60
                  months.
                </InfoPopover>
              </div>
              <div className="relative">
                <Input
                  id="periods"
                  type="number"
                  value={periods}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || Number(val) >= 0) setPeriods(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault();
                  }}
                  onBlur={() => {
                    if (periods.startsWith(".")) {
                      setPeriods("0" + periods);
                    }
                  }}
                  aria-describedby="periods-info"
                  className="block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                />
              </div>
            </div>

            <div>
              <div className="flex items-start gap-2">
                <label
                  htmlFor="compounding-frequency"
                  className="block font-semibold text-foreground mb-3"
                >
                  Compounding frequency
                </label>
                <InfoPopover title="Compounding frequency">
                  Compounding frequency is how often interest is calculated and
                  added to the balance. For example, monthly compounding applies
                  interest once each month.
                </InfoPopover>
              </div>
              <div className="flex items-center gap-2">
                <select
                  id="compounding-frequency"
                  value={selectedCompounding}
                  onChange={(e) =>
                    setSelectedCompounding(e.target.value as CompoundingPeriod)
                  }
                  aria-describedby="compounding-frequency-info"
                  className="border-1 w-full rounded-md shadow-sm py-2 px-3 appearance-none"
                >
                  {compoundingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div
                  className="pointer-events-none ml-[-40px] text-gray-400 text-lg"
                  aria-hidden="true"
                >
                  <FaAngleDown />
                </div>
              </div>
            </div>
          </section>

          {/* Results Section */}
          <Card className="w-full lg:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
            <CardContent className="p-0">
              <h2 className="text-[20px] font-bold mb-1">
                Balance after {periods}{" "}
                {getPeriodText(selectedCompounding, Number(periods))}
              </h2>
              <p className="text-3xl font-bold text-lagunita mb-5">
                {formatCurrency(selectedResult.finalAmount)}
              </p>
              <p className="text-[16px] font-semibold mb-1">
                Interest accrued over {periods}{" "}
                {getPeriodText(selectedCompounding, Number(periods))}
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(selectedResult.interestEarned)}
              </p>
              <p className="text-[16px] font-semibold text-foreground">
                With{" "}
                <span className="text-lagunita">
                  {selectedCompounding === "semi-annually"
                    ? "semi-annual"
                    : selectedCompounding === "annually"
                      ? "annual"
                      : selectedCompounding}
                </span>{" "}
                compounding
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <section
          aria-label="Comparison across compounding frequencies"
          className="rounded-3xl bg-[var(--grey-background)] p-6 mt-10"
        >
          <h2 className="text-xl font-semibold mb-2">
            Comparison Across Compounding Frequencies
          </h2>
          <p className="text-sm mb-4">
            See how compounding frequency affects returns over the same time
            period.
          </p>

          <div className="overflow-hidden bg-card">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th scope="col" className="font-semibold text-left px-4 py-3">
                    Compounding Frequency
                  </th>
                  <th
                    scope="col"
                    className="font-semibold text-right px-4 py-3"
                  >
                    Number of <br />
                    Compounding Periods
                  </th>
                  <th
                    scope="col"
                    className="font-semibold text-right px-4 py-3"
                  >
                    Final Amount
                  </th>
                  <th
                    scope="col"
                    className="font-semibold text-right px-4 py-3"
                  >
                    Interest Accrued
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonResults.map((result) => (
                  <tr
                    key={result.value}
                    aria-current={
                      selectedCompounding === result.value ? "true" : undefined
                    }
                    className={
                      selectedCompounding === result.value
                        ? "bg-[var(--grey-background)] text-[var(--color-teal)] font-bold"
                        : ""
                    }
                  >
                    <td className="px-4 py-3 border-b">{result.label}</td>
                    <td className="text-right px-4 py-3 border-b">
                      {result.totalPeriods % 1 === 0
                        ? result.totalPeriods.toFixed(0)
                        : result.totalPeriods.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-3 border-b">
                      {formatCurrency(result.finalAmount)}
                    </td>
                    <td className="text-right px-4 py-3 border-b">
                      {formatCurrency(result.interestEarned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pt-3 font-bold text-sm">
              Over the same time period, more frequent compounding results in
              more interest accrued, assuming the annual interest rate stays the
              same.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}