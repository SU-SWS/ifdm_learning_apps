"use client"

import { Input } from "@/app/ui/components/input"
import { Card, CardContent } from "@/app/ui/components/card"
import { useState, useMemo } from "react"
import ThemeToggle from "@/app/lib/theme-toggle";
import { FaAngleDown } from "react-icons/fa";
import InfoPopover from "@/app/ui/components/popover";
import { Button } from "@/app/ui/components/button"

type CompoundingPeriod = "annually" | "semi-annually" | "quarterly" | "monthly" | "biweekly" | "weekly" | "daily"

// All supported compounding frequencies with their periods-per-year multipliers.
const compoundingOptions: { value: CompoundingPeriod; label: string; periodsPerYear: number }[] = [
  { value: "annually", label: "Annually", periodsPerYear: 1 },
  { value: "semi-annually", label: "Semi-annually", periodsPerYear: 2 },
  { value: "quarterly", label: "Quarterly", periodsPerYear: 4 },
  { value: "monthly", label: "Monthly", periodsPerYear: 12 },
  { value: "biweekly", label: "Biweekly", periodsPerYear: 26 },
  { value: "weekly", label: "Weekly", periodsPerYear: 52 },
  { value: "daily", label: "Daily", periodsPerYear: 365 },
]

// Formats a number as USD. Abbreviates large values (M/B/T) and returns "-" for non-finite inputs.
function formatCurrency(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return "-"
  if (value >= 1e15) return "Too large to display"
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(decimals)}T`
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(decimals)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(decimals)}M`
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Formats two related currency values (e.g. balance + interest) together so their
// decimal precision stays in sync when abbreviated. Flags pairs that exceed display limits.
function formatPair(a: number, b: number): { aStr: string; bStr: string; tooLarge: boolean } {
  const tooLarge = a >= 1e15 || b >= 1e15
  if (tooLarge) {
    return {
      aStr: a >= 1e15 ? "Too large to display" : formatCurrency(a),
      bStr: b >= 1e15 ? "Too large to display" : formatCurrency(b),
      tooLarge: true,
    }
  }

  const isAbbreviated = a >= 1_000_000 || b >= 1_000_000
  if (!isAbbreviated) {
    return { aStr: formatCurrency(a), bStr: formatCurrency(b), tooLarge: false }
  }

  let decimals = 2
  while (decimals <= 4) {
    const aStr = formatCurrency(a, decimals)
    const bStr = formatCurrency(b, decimals)
    if (aStr !== bStr || decimals === 4) {
      return { aStr, bStr, tooLarge: false }
    }
    decimals++
  }

  return { aStr: formatCurrency(a), bStr: formatCurrency(b), tooLarge: false }
}

// Core compound interest formula: A = P(1 + r/n)^t
// rate is the annual rate as a decimal; totalPeriods is the number of compounding periods.
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

// Input ceilings used in onChange validation.
const MAX_INITIAL_AMOUNT = 100_000_000 // $100,000,000
const MAX_ANNUAL_RATE = 1000            // 1,000%

// Plural period labels used in range error messages (e.g. "Enter a number of months between...").
const periodPluralLabels: Record<CompoundingPeriod, string> = {
  annually: "years",
  "semi-annually": "semi-annual periods",
  quarterly: "quarters",
  monthly: "months",
  biweekly: "bi-weekly periods",
  weekly: "weeks",
  daily: "days",
}

// Adjective form of each frequency, used in the parenthetical part of range error messages.
const freqLabels: Record<CompoundingPeriod, string> = {
  annually: "annual",
  "semi-annually": "semiannual",
  quarterly: "quarterly",
  monthly: "monthly",
  biweekly: "biweekly",
  weekly: "weekly",
  daily: "daily",
}

// Builds the out-of-range error message for the periods field. Non-annual frequencies
// get an extra note showing how many periods equal 100 years at that frequency.
function buildPeriodsRangeError(compounding: CompoundingPeriod, max: number): string {
  const label = periodPluralLabels[compounding]
  const maxFormatted = max.toLocaleString("en-US")
  const base = `Enter a number of ${label} between 0 and ${maxFormatted}.`
  if (compounding === "annually") return base
  return `${base} (${maxFormatted} ${label} = 100 years with ${freqLabels[compounding]} compounding).`
}

export default function CompoundInterestCalculator() {
  const [initialAmount, setInitialAmount] = useState<string>("")
  const [annualRate, setAnnualRate] = useState<string>("")
  const [periods, setPeriods] = useState<string>("")
  const [selectedCompounding, setSelectedCompounding] = useState<CompoundingPeriod>("monthly")

  // Error state is declared early so setters are available to flagSkippedFields.
  const [initialAmountError, setInitialAmountError] = useState<string>("")
  const [annualRateError, setAnnualRateError] = useState<string>("")
  const [periodsError, setPeriodsError] = useState<string>("")

  // Field order defines the natural top-to-bottom flow. A field is considered
  // "skipped" when a field that comes after it in this order has been touched
  // while the earlier field is still empty.
  const FIELD_ORDER = ["initialAmount", "annualRate", "periods"] as const
  type FieldName = typeof FIELD_ORDER[number]

  // Current string values for each required field, keyed by field name.
  const fieldValues: Record<FieldName, string> = {
    initialAmount,
    annualRate,
    periods,
  }

  // Maps each field name to its error setter so flagSkippedFields can fire them generically.
  const fieldSetErrors: Record<FieldName, (msg: string) => void> = {
    initialAmount: setInitialAmountError,
    annualRate: setAnnualRateError,
    periods: setPeriodsError,
  }

  // The required-field error message for each field.
  const requiredMessages: Record<FieldName, string> = {
    initialAmount: "Please enter an initial amount.",
    annualRate: "Please enter an interest rate.",
    periods: "Please enter a number of compounding periods.",
  }

  // After any interaction, flag any empty fields that come before the active
  // field in the natural order. Fields that come after are left alone since the
  // user hasn't skipped them yet.
  const flagSkippedFields = (activeField: FieldName) => {
    const activeIndex = FIELD_ORDER.indexOf(activeField)
    FIELD_ORDER.forEach((field, index) => {
      if (index < activeIndex && fieldValues[field] === "") {
        fieldSetErrors[field](requiredMessages[field])
      }
    })
  }

  const principal = parseFloat(initialAmount) || 0
  const rate = (parseFloat(annualRate) || 0) / 100
  const totalPeriods = parseFloat(periods) || 0

  // The full option object for the currently selected compounding frequency.
  const selectedOption = useMemo(() =>
    compoundingOptions.find((o) => o.value === selectedCompounding)!,
    [selectedCompounding]
  )

  // Upper bound for the periods input: 100 years worth of periods at the selected frequency.
  const maxPeriods = selectedOption.periodsPerYear * 100

  // Result for the currently selected compounding frequency, shown in the primary output card.
  const selectedResult = useMemo(() => {
    return calculateCompoundInterest(principal, rate, totalPeriods, selectedOption.periodsPerYear)
  }, [principal, rate, totalPeriods, selectedOption.periodsPerYear])

  // Results for all frequencies over the same elapsed time, used in the comparison table.
  // Time is normalized to years first so each frequency uses the right period count.
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

  // Suppress results whenever any required field is blank or has a validation error.
  // anyFieldEmpty ensures "—" shows from the first keystroke, before error messages appear.
  const anyFieldEmpty = initialAmount === "" || annualRate === "" || periods === ""
  const hasError = anyFieldEmpty || !!initialAmountError || !!annualRateError || !!periodsError

  const { aStr: balanceStr, bStr: interestStr, tooLarge: mainTooLarge } = formatPair(
    selectedResult.finalAmount,
    selectedResult.interestEarned
  )

  // Clears all inputs, errors, and resets compounding frequency to the default.
  const reset = () => {
    setInitialAmount("")
    setAnnualRate("")
    setPeriods("")
    setSelectedCompounding("monthly")
    setInitialAmountError("")
    setAnnualRateError("")
    setPeriodsError("")
  }

  // Returns the singular or plural period label for the result card headings.
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
                    const raw = e.target.value;
                    const numericValue = parseFloat(raw);
                    if (raw === "") {
                      setInitialAmountError("");
                      setInitialAmount("");
                      return;
                    }
                    if (
                      !isNaN(numericValue) &&
                      (numericValue < 0 || numericValue > MAX_INITIAL_AMOUNT)
                    ) {
                      setInitialAmountError(
                        "Enter an amount between $0 and $100,000,000.",
                      );
                      setInitialAmount(raw);
                    } else {
                      setInitialAmountError("");
                      setInitialAmount(raw);
                    }
                    flagSkippedFields("initialAmount");
                  }}
                  onBlur={() => {
                    flagSkippedFields("initialAmount");
                    if (initialAmount.startsWith("."))
                      setInitialAmount("0" + initialAmount);
                    if (!initialAmount)
                      setTimeout(
                        () =>
                          setInitialAmountError(
                            "Please enter an initial amount.",
                          ),
                        150,
                      );
                  }}
                  min="0"
                  className={`block w-full pl-8 rounded-md shadow-sm border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${initialAmountError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)]">
                  $
                </span>
              </div>
              {initialAmountError && (
                <p
                  role="alert"
                  className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
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
                  type="number"
                  value={annualRate}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const numericValue = parseFloat(raw);
                    if (raw === "") {
                      setAnnualRateError("");
                      setAnnualRate("");
                      return;
                    }
                    if (
                      !isNaN(numericValue) &&
                      (numericValue < 0 || numericValue > MAX_ANNUAL_RATE)
                    ) {
                      setAnnualRateError("Enter a rate between 0% and 1,000%.");
                      setAnnualRate(raw);
                    } else {
                      setAnnualRateError("");
                      setAnnualRate(raw);
                    }
                    flagSkippedFields("annualRate");
                  }}
                  onBlur={() => {
                    flagSkippedFields("annualRate");
                    if (annualRate.startsWith("."))
                      setAnnualRate("0" + annualRate);
                    if (!annualRate)
                      setTimeout(
                        () =>
                          setAnnualRateError("Please enter an interest rate."),
                        150,
                      );
                  }}
                  className={`block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${annualRateError ? "border-[var(--color-inline-error)] border-2" : ""}`}
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
                  className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
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
                    const stripped = val.replace(/^0+(?=\d)/, "");
                    const cleaned = stripped.replace(/(\.\d{2})\d+/, "$1");

                    setPeriods(cleaned);

                    if (
                      cleaned !== "" &&
                      (Number(cleaned) < 0 || Number(cleaned) > maxPeriods)
                    ) {
                      setPeriodsError(
                        buildPeriodsRangeError(selectedCompounding, maxPeriods),
                      );
                    } else {
                      setPeriodsError("");
                    }
                    flagSkippedFields("periods");
                  }}
                  onBlur={() => {
                    flagSkippedFields("periods");
                    if (periods.startsWith(".")) setPeriods("0" + periods);
                    if (!periods)
                      setTimeout(
                        () =>
                          setPeriodsError(
                            "Please enter a number of compounding periods.",
                          ),
                        150,
                      );
                  }}
                  className={`block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${periodsError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                  min="0"
                />
              </div>
              {periodsError && (
                <p
                  role="alert"
                  className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
                >
                  {periodsError}
                </p>
              )}
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
                  onChange={(e) => {
                    const newFreq = e.target.value as CompoundingPeriod;
                    setSelectedCompounding(newFreq);
                    if (periods !== "") {
                      const newOption = compoundingOptions.find(
                        (o) => o.value === newFreq,
                      )!;
                      const newMax = newOption.periodsPerYear * 100;
                      if (Number(periods) > newMax) {
                        setPeriodsError(
                          buildPeriodsRangeError(newFreq, newMax),
                        );
                      } else {
                        setPeriodsError("");
                      }
                    }
                  }}
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
              <Button
                type="button"
                variant="lagunita"
                size="sm"
                className="mt-4"
                onClick={reset}
              >
                Reset
              </Button>
            </div>
          </section>

          {/* Results Section */}
          <Card className="w-full lg:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
            <CardContent className="p-0">
              <h2 className="text-[20px] font-bold mb-1">
                Balance after{" "}
                {hasError
                  ? "-"
                  : `${periods} ${getPeriodText(selectedCompounding, Number(periods))}`}
              </h2>
              <p className="text-3xl/normal font-bold text-[var(--color-teal)] mb-5 overflow-auto">
                {hasError ? "-" : balanceStr}
              </p>
              <p className="text-[20px] font-bold mb-1">
                Interest accrued over{" "}
                {hasError
                  ? "-"
                  : `${periods} ${getPeriodText(selectedCompounding, Number(periods))}`}
              </p>
              <p className="text-3xl/normal font-bold text-foreground overflow-auto">
                {hasError ? "-" : interestStr}
              </p>
              {!hasError && mainTooLarge && (
                <p className="font-bold text-[var(--color-inline-error)] mt-2">
                  Try a lower rate or fewer periods.
                </p>
              )}
              <p className="text-[16px] font-semibold text-foreground">
                With{" "}
                <span className="text-[var(--color-teal)]">
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

          <div className="hidden md:block overflow-x-auto bg-card">
            <table className="w-full">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="w-1/4 font-semibold text-left px-4 py-3"
                  >
                    Compounding Frequency
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 font-semibold text-right px-4 py-3"
                  >
                    Number of <br />
                    Compounding Periods
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 font-semibold text-right px-4 py-3"
                  >
                    Final Amount
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 font-semibold text-right px-4 py-3"
                  >
                    Interest Accrued
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonResults.map((result) => {
                  const { aStr: rowBalance, bStr: rowInterest } = formatPair(
                    result.finalAmount,
                    result.interestEarned,
                  );
                  const isSelected = selectedCompounding === result.value;
                  return (
                    <tr
                      key={result.value}
                      aria-current={isSelected ? "true" : undefined}
                      className={
                        isSelected
                          ? "bg-[var(--grey-background)] text-[var(--color-teal)] font-bold"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 border-b">{result.label}</td>
                      <td className="text-right px-4 py-3 border-b">
                        {hasError
                          ? "-"
                          : result.totalPeriods % 1 === 0
                            ? result.totalPeriods.toFixed(0)
                            : result.totalPeriods.toFixed(2)}
                      </td>
                      <td className="text-right px-4 py-3 border-b">
                        {hasError ? "-" : rowBalance}
                      </td>
                      <td className="text-right px-4 py-3 border-b">
                        {hasError ? "-" : rowInterest}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Card layout - visible on small screens only */}
          <div className="md:hidden space-y-3">
            {comparisonResults.map((result) => {
              const { aStr: rowBalance, bStr: rowInterest } = formatPair(
                result.finalAmount,
                result.interestEarned,
              );
              return (
                <div
                  key={result.value}
                  className={`rounded-xl p-4 border ${
                    selectedCompounding === result.value
                      ? "bg-[var(--grey-background)] text-[var(--color-teal)] font-bold"
                      : "bg-card"
                  }`}
                >
                  <p className="font-bold mb-2">{result.label}</p>
                  <div>
                    <span className="block font-semibold">Periods</span>
                    <span className="block">
                      {hasError
                        ? "-"
                        : result.totalPeriods % 1 === 0
                          ? result.totalPeriods.toFixed(0)
                          : result.totalPeriods.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="block font-semibold">Final Amount</span>
                    <span className="block overflow-auto break-words">
                      {hasError ? "-" : rowBalance}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="block font-semibold">
                      Interest Accrued
                    </span>
                    <span className="block overflow-auto break-words">
                      {hasError ? "-" : rowInterest}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="pt-3 font-bold text-sm">
            Over the same time period, more frequent compounding results in more
            interest accrued, assuming the annual interest rate stays the same.
          </p>
        </section>
      </div>
    </div>
  );
}
