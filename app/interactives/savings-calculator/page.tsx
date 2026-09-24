"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Button } from "@/app/ui/components/button"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { RotateCcw } from "lucide-react"
import { FaRegCalendar, FaDollarSign, FaAngleDown, FaArrowTrendUp } from "react-icons/fa6";
import ThemeToggle from "@/app/lib/theme-toggle";
import { validateAllFields } from "./lib/validation";
import {
  getPeriodLabel,
  calculateMonthySavings,
  calculateFutureBalance,
  calculateTimeToGoal,
} from "./lib/calculations";

type CalculationMode = "monthly-savings" | "time-to-goal" | "future-balance"
type CompoundingFrequency = "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "semi-annually" | "annually"

interface CalculationResults {
  contributionPerPeriod: number
  totalDeposited: number
  interestEarned: number
  finalBalance: number
  timeInMonths: number
}

function formatDuration(totalMonths: number) {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const parts: string[] = []

  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`)

  return parts.join(" and ")
}

export default function SavingsCalculator() {
  const [mode, setMode] = useState<CalculationMode>("monthly-savings")
  const [savingsGoal, setSavingsGoal] = useState(0)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [timeYears, setTimeYears] = useState(0)
  const [timeMonths, setTimeMonths] = useState(0)
  const [interestRate, setInterestRate] = useState(-1)
  const [compounding, setCompounding] = useState<CompoundingFrequency>("monthly")
  const [contributionPerPeriod, setcontributionPerPeriod] = useState(0)

  const [results, setResults] = useState<CalculationResults>({
    contributionPerPeriod: NaN,
    totalDeposited: NaN,
    interestEarned: NaN,
    finalBalance: NaN,
    timeInMonths: NaN,
  })

  const [overflowWarning, setOverflowWarning] = useState(false)

  // Track which fields have been touched (blurred without value or skipped)
  const [touched, setTouched] = useState<Record<string, boolean>>({
    savingsGoal: false,
    currentBalance: false,
    timeYears: false,
    timeMonths: false,
    interestRate: false,
    contributionPerPeriod: false,
  })

  // Track which fields have been edited (onChange fired)
  const [editedFields, setEditedFields] = useState<Record<string, boolean>>({
    savingsGoal: false,
    currentBalance: false,
    timeYears: false,
    timeMonths: false,
    contributionPerPeriod: false,
  })

  // Track which field currently has focus (for deferring error messages)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Clear all input fields when switching tabs
  useEffect(() => {
    setSavingsGoal(0);
    setCurrentBalance(0);
    setTimeYears(0);
    setTimeMonths(0);
    setInterestRate(-1);
    setcontributionPerPeriod(0);
    setTouched({
      savingsGoal: false,
      currentBalance: false,
      timeYears: false,
      timeMonths: false,
      interestRate: false,
      contributionPerPeriod: false,
    });
    setEditedFields({
      savingsGoal: false,
      currentBalance: false,
      timeYears: false,
      timeMonths: false,
      contributionPerPeriod: false,
    });
    setFocusedField(null);
  }, [mode]);

  // Calculate results based on mode using library functions
  const calculateResults = useCallback(() => {
    if (mode === "monthly-savings") {
      const { results } = calculateMonthySavings(
        savingsGoal,
        currentBalance,
        timeYears,
        timeMonths,
        interestRate,
        compounding
      );
      setResults(results);
    } else if (mode === "future-balance") {
      const { results } = calculateFutureBalance(
        currentBalance,
        contributionPerPeriod,
        timeYears,
        timeMonths,
        interestRate,
        compounding
      );
      setResults(results);
    } else {
      // time-to-goal
      const { results } = calculateTimeToGoal(
        savingsGoal,
        currentBalance,
        contributionPerPeriod,
        interestRate,
        compounding
      );
      setResults(results);
    }
  }, [
    mode,
    savingsGoal,
    currentBalance,
    timeYears,
    timeMonths,
    interestRate,
    compounding,
    contributionPerPeriod,
  ]);

  // Check for invalid inputs
  const isInvalid = (value: number) => isNaN(value) || !isFinite(value);

  // Get validation results
  const validation = validateAllFields(
    {
      savingsGoal,
      currentBalance,
      timeYears,
      timeMonths,
      interestRate,
      contributionPerPeriod,
    },
    touched,
    mode,
    focusedField
  );

  const hasReachedGoal =
    mode !== "future-balance" &&
    savingsGoal > 0 &&
    savingsGoal <= 1000000000 &&
    currentBalance <= 1000000000 &&
    savingsGoal <= currentBalance;

  // Handle field blur - mark field as touched
  const handleFieldBlur = (fieldName: string) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  // Reset all fields to initial state
  const handleReset = () => {
    setSavingsGoal(0);
    setCurrentBalance(0);
    setTimeYears(0);
    setTimeMonths(0);
    setInterestRate(-1);
    setcontributionPerPeriod(0);
    setTouched({
      savingsGoal: false,
      currentBalance: false,
      timeYears: false,
      timeMonths: false,
      interestRate: false,
      contributionPerPeriod: false,
    });
    setEditedFields({
      savingsGoal: false,
      currentBalance: false,
      timeYears: false,
      timeMonths: false,
      contributionPerPeriod: false,
    });
    setFocusedField(null);
    setResults({
      contributionPerPeriod: NaN,
      totalDeposited: NaN,
      interestEarned: NaN,
      finalBalance: NaN,
      timeInMonths: NaN,
    });
  };

  useEffect(() => {
    // Block calculation if there are blocking errors
    if (validation.hasBlockingErrors) {
      setResults({
        contributionPerPeriod: NaN,
        totalDeposited: NaN,
        interestEarned: NaN,
        finalBalance: NaN,
        timeInMonths: NaN,
      });
      setOverflowWarning(false);
      return;
    }

    calculateResults();
  }, [calculateResults, validation.hasBlockingErrors]);

  // Check for overflow after results are calculated
  useEffect(() => {
    const DISPLAY_MAX = 99_999_999;
    const hasOverflow =
      (!isInvalid(results.contributionPerPeriod) && results.contributionPerPeriod > DISPLAY_MAX) ||
      (!isInvalid(results.totalDeposited) && results.totalDeposited > DISPLAY_MAX) ||
      (!isInvalid(results.interestEarned) && results.interestEarned > DISPLAY_MAX) ||
      (!isInvalid(results.finalBalance) && results.finalBalance > DISPLAY_MAX);
    setOverflowWarning(hasOverflow);
  }, [results]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        {/* Header */}
        <h1 className="sr-only">Savings Calculator</h1>
        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="font-poppins text-lg-title text-[var(--foreground)] font-bold mb-1">Solve for:</h2>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={mode === "monthly-savings" ? "default" : "outline"}
              className={`h-18 whitespace-normal cursor-pointer ${mode === "monthly-savings" ? "bg-lagunita text-white hover:bg-navy" : "bg-[var(--results-white-background)] hover:bg-lagunita hover:text-white"}`}
              onClick={() => setMode("monthly-savings")}
            >
              <FaDollarSign className="hidden sm:block h-5 w-5 mr-2" />
              Savings
            </Button>
            <Button
              variant={mode === "time-to-goal" ? "default" : "outline"}
              className={`h-18 whitespace-normal cursor-pointer ${mode === "time-to-goal" ? "bg-lagunita text-white hover:bg-navy" : "bg-[var(--results-white-background)] hover:bg-lagunita hover:text-white"}`}
              onClick={() => setMode("time-to-goal")}
            >
              <FaRegCalendar className="hidden sm:block h-5 w-5 mr-2" />
              Time to Goal
            </Button>
            <Button
              variant={mode === "future-balance" ? "default" : "outline"}
              className={`h-18 whitespace-normal cursor-pointer ${mode === "future-balance" ? "bg-lagunita text-white hover:bg-navy" : "bg-[var(--results-white-background)] hover:bg-lagunita hover:text-white"}`}
              onClick={() => setMode("future-balance")}
            >
              <FaArrowTrendUp className="hidden sm:block h-5 w-5 mr-2" />
              Future Balance
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="">
            <CardHeader>
              {mode === "monthly-savings" && (
                <p className="font-semibold">How much do I need to save each period to reach my goal?</p>
              )}

              {mode === "time-to-goal" && (
                <p className="font-semibold">How long will it take me to reach my goal?</p>
              )}

              {mode === "future-balance" && (
                <p className="font-semibold">What will my savings grow to in the future?</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {overflowWarning && (
                <div className="p-3 rounded-md bg-[var(--color-inline-warning)]/10 border border-[var(--color-inline-warning)]">
                  <p className="text-sm font-semibold text-[var(--color-inline-warning)]">
                    Results exceed display limits. Try a smaller balance, lower rate, or shorter time period.
                  </p>
                </div>
              )}
              {mode !== "future-balance" && (
              <div>
                <Label htmlFor="savings-goal" className="font-medium">
                  Savings goal amount:
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="savings-goal"
                    type="number"
                    min="0"
                    value={savingsGoal === 0 && !editedFields.savingsGoal ? "" : savingsGoal}
                    placeholder=""
                    onChange={(e) => {
                      setSavingsGoal(Number(e.target.value) || 0);
                      setEditedFields(prev => ({ ...prev, savingsGoal: e.target.value !== "" }));
                    }}
                    onFocus={() => setFocusedField("savingsGoal")}
                    onBlur={() => {
                      handleFieldBlur("savingsGoal");
                      setFocusedField(null);
                    }}
                    className={`block w-full rounded-md shadow-sm py-2 border pl-8 pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      validation.errors.savingsGoal
                        ? "border-[var(--color-inline-error)]"
                        : validation.warnings.savingsGoal
                        ? "border-[var(--color-inline-warning)]"
                        : "border-input"
                    }`}

                  />
                  <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">$</span>
                </div>
                {validation.errors.savingsGoal && (
                  <p className="text-sm font-semibold text-[var(--color-inline-error)] mt-1">
                    {validation.errors.savingsGoal}
                  </p>
                )}
                {validation.warnings.savingsGoal && (
                  <p className="text-sm font-semibold text-[var(--color-inline-warning)] mt-1">
                    {validation.warnings.savingsGoal}
                  </p>
                )}
                {validation.info.savingsGoal && !validation.errors.savingsGoal && !validation.warnings.savingsGoal && (
                  <p className="text-xs text-[var(--foreground)]/60 mt-1">
                    {validation.info.savingsGoal}
                  </p>
                )}
              </div>
              )}

              <div>
                <Label htmlFor="current-balance" className="font-medium">
                  Current savings balance:
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="current-balance"
                    type="number"
                    value={currentBalance === 0 && !editedFields.currentBalance ? "" : currentBalance}
                    placeholder=""
                    onChange={(e) => {
                      setCurrentBalance(Number(e.target.value) || 0);
                      setEditedFields(prev => ({ ...prev, currentBalance: e.target.value !== "" }));
                    }}
                    onBlur={() => handleFieldBlur("currentBalance")}

                    className={`block w-full rounded-md shadow-sm py-2 border pl-8 pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      validation.errors.currentBalance
                        ? "border-[var(--color-inline-error)]"
                        : validation.warnings.currentBalance
                        ? "border-[var(--color-inline-warning)]"
                        : "border-input"
                    }`}
                  />
                  <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">
                    $
                  </span>
                </div>
                {validation.errors.currentBalance && (
                  <p className="text-sm font-semibold text-[var(--color-inline-error)] mt-1">
                    {validation.errors.currentBalance}
                  </p>
                )}
                {validation.warnings.currentBalance && !validation.errors.currentBalance && (
                  <p className="text-sm font-semibold text-[var(--color-inline-warning)] mt-1">
                    {validation.warnings.currentBalance}
                  </p>
                )}
              </div>

              {mode !== "monthly-savings" && (
                <div>
                  <Label htmlFor="contribution-period" className="font-medium">Saving per compounding period:</Label>
                  <div className="relative mt-1">
                    <Input
                      id="contribution-period"
                      type="number"
                      value={hasReachedGoal ? "" : contributionPerPeriod === 0 && !editedFields.contributionPerPeriod ? "" : contributionPerPeriod}
                      placeholder={hasReachedGoal ? "-" : ""}
                      disabled={hasReachedGoal}
                      onChange={(e) => {
                        setcontributionPerPeriod(Number(e.target.value) || 0);
                        setEditedFields(prev => ({ ...prev, contributionPerPeriod: e.target.value !== "" }));
                      }}
                      onFocus={() => setFocusedField("contributionPerPeriod")}
                      onBlur={() => {
                        handleFieldBlur("contributionPerPeriod");
                        setFocusedField(null);
                      }}
                      className={`block w-full rounded-md shadow-sm py-2 border pl-8 pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        validation.errors.contributionPerPeriod ? "border-[var(--color-inline-error)]" : "border-input"
                      }`}
                    />
                    {!hasReachedGoal && (
                      <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">$</span>
                    )}
                  </div>
                  {validation.errors.contributionPerPeriod && (
                    <p className="text-sm font-semibold text-[var(--color-inline-error)] mt-1">
                      {validation.errors.contributionPerPeriod}
                    </p>
                  )}
                  {validation.warnings.contributionPerPeriod && (
                    <p className="text-sm font-semibold text-[var(--color-inline-warning)] mt-1">
                      {validation.warnings.contributionPerPeriod}
                    </p>
                  )}
                </div>
              )}

              {mode !== "time-to-goal" && (
                <div>
                  <Label htmlFor="time-years" className="font-medium">
                    {mode === "future-balance" ? "Time period" : "Time to goal"}:
                  </Label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-2 items-center">
                        <div className="relative flex-1">
                          <Input
                            id="time-years"
                            type="number"
                            value={hasReachedGoal ? "" : timeYears === 0 && !editedFields.timeYears ? "" : timeYears}
                            placeholder={hasReachedGoal ? "-" : ""}
                            disabled={hasReachedGoal}
                            onChange={(e) => {
                              setTimeYears(Number(e.target.value) || 0);
                              setEditedFields(prev => ({ ...prev, timeYears: e.target.value !== "" }));
                            }}
                            onBlur={() => handleFieldBlur("timeYears")}
                            className={`block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              validation.errors.timeYears ? "border-[var(--color-inline-error)]" : "border-input"
                            }`}
                          />
                        </div>
                        <Label htmlFor="time-years" className="font-medium">Years</Label>
                      </div>
                      {validation.errors.timeYears && (
                        <p className="text-sm font-semibold text-[var(--color-inline-error)]">
                          {validation.errors.timeYears}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-2 items-center">
                        <div className="relative flex-1">
                          <Input
                            id="time-months"
                            type="number"
                            value={hasReachedGoal ? "" : timeMonths === 0 && !editedFields.timeMonths ? "" : timeMonths}
                            placeholder={hasReachedGoal ? "-" : ""}
                            disabled={hasReachedGoal}
                            onChange={(e) => {
                              setTimeMonths(parseInt(e.target.value) || 0);
                              setEditedFields(prev => ({ ...prev, timeMonths: e.target.value !== "" }));
                            }}
                            onBlur={() => handleFieldBlur("timeMonths")}
                            className={`block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              validation.errors.timeMonths ? "border-[var(--color-inline-error)]" : "border-input"
                            }`}
                          />
                        </div>
                        <Label htmlFor="time-months" className="font-medium">Months</Label>
                      </div>
                      {validation.errors.timeMonths && (
                        <p className="text-sm font-semibold text-[var(--color-inline-error)]">
                          {validation.errors.timeMonths}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <Label htmlFor="interest-rate" className="font-medium">
                  Annual interest rate
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="interest-rate"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={hasReachedGoal ? "" : interestRate === -1 ? "" : interestRate === 0 ? "0" : interestRate}
                    placeholder={hasReachedGoal ? "-" : ""}
                    disabled={hasReachedGoal}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Set to -1 if empty string, otherwise parse as number
                      setInterestRate(val === "" ? -1 : Number(val));
                    }}
                    onFocus={() => setFocusedField("interestRate")}
                    onBlur={() => {
                      handleFieldBlur("interestRate");
                      setFocusedField(null);
                    }}
                    className={`block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      validation.errors.interestRate
                        ? "border-[var(--color-inline-error)]"
                        : validation.warnings.interestRate
                        ? "border-[var(--color-inline-warning)]"
                        : "border-input"
                    }`}
                  />
                  {!hasReachedGoal && (
                    <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                  )}
                </div>
                {validation.errors.interestRate && (
                  <p className="text-sm font-semibold text-[var(--color-inline-error)] mt-1">
                    {validation.errors.interestRate}
                  </p>
                )}
                {validation.warnings.interestRate && (
                  <p className="text-sm font-semibold text-[var(--color-inline-warning)] mt-1">
                    {validation.warnings.interestRate}
                  </p>
                )}
                {validation.info.interestRate && !validation.errors.interestRate && !validation.warnings.interestRate && (
                  <p className="text-xs text-[var(--foreground)]/60 mt-1">
                    {validation.info.interestRate}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="compounding-select" className="block text-md font-medium text-[var(--foreground)] mb-1">Compounding</label>
                  <div className="relative">
                  <select
                  id="compounding-select"
                  value={hasReachedGoal ? "" : compounding}
                  disabled={hasReachedGoal}
                  onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                  className="block w-full rounded-md shadow-sm py-2 px-3 border appearance-none"
                  >
                    {hasReachedGoal && <option value="">-</option>}
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semi-annually">Semi-annually</option>
                    <option value="annually">Annually</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    <FaAngleDown />
                  </div>
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  onClick={handleReset}
                  variant="lagunita"
                  className="whitespace-normal cursor-pointer flex flex-row items-center gap-2 font-medium px-8"
                >
                  Reset <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
            <CardHeader className="pb-2">
              {mode === "monthly-savings" && (
                <>
                  <CardTitle className="text-center text-md font-bold">Save each {getPeriodLabel(compounding)}:</CardTitle>
                  <div className={`text-4xl font-bold text-center ${
                      isInvalid(results.totalDeposited) || overflowWarning
                        ? "text-foreground"
                        : "text-lagunita"
                    }`}>
                      {isInvalid(results.totalDeposited)
                      ? "-"
                      : overflowWarning
                      ? "Too large to display"
                      : `$${results.contributionPerPeriod.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
                  {results.contributionPerPeriod === 0 &&
                    savingsGoal > currentBalance &&
                    results.timeInMonths > 0 &&
                    !overflowWarning && (
                      <p className="mt-2 text-center text-sm text-[var(--foreground)]">
                        No further contributions are needed — due to compounding, you&apos;ll reach your goal in {formatDuration(results.timeInMonths)}.
                      </p>
                    )}
                </>
              )}

              {mode === "time-to-goal" && (
                <>
                <CardTitle className="text-center text-md font-bold">Estimated time to reach goal:</CardTitle>
                  <div className="text-4xl font-bold text-center" style={{ color: isInvalid(results.timeInMonths) || overflowWarning ? "var(--foreground)" : "var(--lagunita)" }}>
                    {isInvalid(results.timeInMonths)
                      ? "-"
                      : overflowWarning
                      ? "Too large to display"
                      : `${Math.floor(Math.round(results.timeInMonths) / 12)} years ${Math.round(results.timeInMonths) % 12} months`
                    }
                  </div>
                </>
              )}

              {mode === "future-balance" && (
                <>
                <CardTitle className="text-center text-md font-bold">Future balance:</CardTitle>
                <div className={`text-4xl font-bold text-center ${
                      isInvalid(results.finalBalance) || overflowWarning
                        ? "text-foreground"
                        : "text-lagunita"
                    }`}>
                      {isInvalid(results.finalBalance)
                      ? "-"
                      : overflowWarning
                      ? "Too large to display"
                      : `$${results.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
                </>
              )}
            </CardHeader>

            <CardContent>
              <div className="pt-6">
                <div className="rounded-lg">
                  <div className="innerwrapper">
                    <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                      <div className="w-full sm:w-[50%] p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                        Total deposited:
                      </div>
                      <div className={`w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] bg-[var(--secondary-background)] overflow-hidden text-ellipsis`}>
                        {isInvalid(results.totalDeposited) || overflowWarning
                        ? "-"
                        : `$${results.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row mb-1 bg-lagunita-lighter rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-lagunita font-bold text-white">
                        Interest earned:
                      </div>
                      <div className={`w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg bg-lagunita-lighter text-lagunita font-bold overflow-hidden text-ellipsis`}
                      >
                        {isInvalid(results.interestEarned) || overflowWarning
                        ? "-"
                        : `$${results.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    {mode === "future-balance" && (
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-blue-background)] rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 font-bold text-white bg-navy rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                        Final balance:
                      </div>
                      <div className={`w-full sm:w-[50%] text-lg-title p-4 flex items-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] bg-[var(--results-blue-background)] overflow-hidden text-ellipsis`}>
                        {isInvalid(results.finalBalance) || overflowWarning
                        ? "-"
                        : `$${results.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    )}


                  </div>
                  {/* Wrapper section ends */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Year by Year section — hidden for current release, to be worked on in next sprint */}
      </div>
    </div>
  )
}
