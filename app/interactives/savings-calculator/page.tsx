"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Button } from "@/app/ui/components/button"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { ChevronDown } from "lucide-react"
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";
import { FaRegCalendar, FaDollarSign, FaAngleDown, FaArrowTrendUp } from "react-icons/fa6";
import ThemeToggle from "@/app/lib/theme-toggle";
import { validateAllFields } from "./lib/validation";

type CalculationMode = "monthly-savings" | "time-to-goal" | "future-balance"
type CompoundingFrequency = "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "semi-annually" | "annually"

interface CalculationResults {
  contributionPerPeriod: number
  totalDeposited: number
  interestEarned: number
  finalBalance: number
  timeInMonths: number
}

interface YearlyBreakdown {
  year: number
  startingBalance: number
  contributions: number
  interestEarned: number
  endingBalance: number
}

// Helper to get periods per year and rate per period
function getCompoundingParams(frequency: CompoundingFrequency, annualRate: number) {
  let periodsPerYear = 12;
  if (frequency === "daily") periodsPerYear = 365;
  else if (frequency === "weekly") periodsPerYear = 52;
  else if (frequency === "bi-weekly") periodsPerYear = 26;
  else if (frequency === "quarterly") periodsPerYear = 4;
  else if (frequency === "annually") periodsPerYear = 1;
  else if (frequency === "semi-annually") periodsPerYear = 2;
  const ratePerPeriod = annualRate / 100 / periodsPerYear;
  return { periodsPerYear, ratePerPeriod };
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
  const [showBreakdown, setShowBreakdown] = useState(false)
  const MAX_MONTHS = 11;

  const [results, setResults] = useState<CalculationResults>({
    contributionPerPeriod: NaN,
    totalDeposited: NaN,
    interestEarned: NaN,
    finalBalance: NaN,
    timeInMonths: NaN,
  })

  const [yearlyBreakdown, setYearlyBreakdown] = useState<YearlyBreakdown[]>([])

  // Track which fields have been touched (blurred without value or skipped)
  const [touched, setTouched] = useState<Record<string, boolean>>({
    savingsGoal: false,
    currentBalance: false,
    timeYears: false,
    timeMonths: false,
    interestRate: false,
    contributionPerPeriod: false,
  })

  // Updated breakdown to use compounding frequency
  const calculateYearlyBreakdown = useCallback(
    (contribution: number, totalPeriods: number) => {
      const { periodsPerYear, ratePerPeriod } = getCompoundingParams(compounding, interestRate);
      const breakdown: YearlyBreakdown[] = [];
      let balance = currentBalance;
      const totalYears = Math.ceil(totalPeriods / periodsPerYear);

      for (let year = 1; year <= totalYears; year++) {
        const startingBalance = balance;
        const periodsInThisYear = Math.min(periodsPerYear, totalPeriods - (year - 1) * periodsPerYear);
        let yearlyContributions = 0;
        let yearlyInterest = 0;

        const futureValueOfInitial = startingBalance * Math.pow(1 + ratePerPeriod, periodsInThisYear);
        const futureValueOfAnnuity =
          contribution * ((Math.pow(1 + ratePerPeriod, periodsInThisYear) - 1) / ratePerPeriod);
        balance = futureValueOfInitial + futureValueOfAnnuity;
        yearlyContributions = contribution * periodsInThisYear;
        yearlyInterest = balance - (startingBalance + yearlyContributions);

        breakdown.push({
          year,
          startingBalance,
          contributions: yearlyContributions,
          interestEarned: yearlyInterest,
          endingBalance: balance,
        });
      }

      return breakdown;
    },
    [compounding, interestRate, currentBalance]
  );

  // Updated calculation logic to use compounding frequency
  const calculateResults = useCallback(() => {
    const { periodsPerYear, ratePerPeriod } = getCompoundingParams(compounding, interestRate);
    const totalTimeInMonths = timeYears * 12 + timeMonths;
    const totalPeriods = timeYears * periodsPerYear + timeMonths * (periodsPerYear / 12);

    if (mode === "monthly-savings") {
      // Calculate required monthly contribution to reach goal
      const futureValueOfInitial = currentBalance * Math.pow(1 + ratePerPeriod, totalPeriods);
      const remainingAmount = savingsGoal - futureValueOfInitial;

        if (remainingAmount <= 0) {
          const contributionNeeded = 0;
          setResults({
            contributionPerPeriod: contributionNeeded,
            totalDeposited: currentBalance,
            interestEarned: savingsGoal - currentBalance,
            finalBalance: savingsGoal,
            timeInMonths: totalTimeInMonths,
          });
          setYearlyBreakdown(calculateYearlyBreakdown(contributionNeeded, totalPeriods));
        } else if (totalPeriods < 1) {
          // If time to goal is less than one compounding period, ignore interest
          const requiredContributionPerPeriod = savingsGoal - currentBalance;
          const totalDeposited = currentBalance + requiredContributionPerPeriod;
          setResults({
            contributionPerPeriod: requiredContributionPerPeriod,
            totalDeposited: totalDeposited,
            interestEarned: 0,
            finalBalance: savingsGoal,
            timeInMonths: totalTimeInMonths,
          });
          setYearlyBreakdown(calculateYearlyBreakdown(requiredContributionPerPeriod, totalPeriods));
        } else {
          const requiredContributionPerPeriod =
            remainingAmount / ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
          const totalDeposited = currentBalance + requiredContributionPerPeriod * totalPeriods;

          setResults({
            contributionPerPeriod: requiredContributionPerPeriod,
            totalDeposited: totalDeposited,
            interestEarned: savingsGoal - totalDeposited,
            finalBalance: savingsGoal,
            timeInMonths: totalTimeInMonths,
          });
          setYearlyBreakdown(calculateYearlyBreakdown(requiredContributionPerPeriod, totalPeriods));
        }
    } else if (mode === "future-balance") {
      // Calculate future balance with current contribution
      const futureValueOfInitial = currentBalance * Math.pow(1 + ratePerPeriod, totalPeriods);
      const futureValueOfAnnuity =
        contributionPerPeriod * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
      const finalBalance = futureValueOfInitial + futureValueOfAnnuity;
      const totalDeposited = currentBalance + contributionPerPeriod * totalPeriods;

      setResults({
        contributionPerPeriod: contributionPerPeriod,
        totalDeposited: totalDeposited,
        interestEarned: finalBalance - totalDeposited,
        finalBalance: finalBalance,
        timeInMonths: totalTimeInMonths,
      });
      setYearlyBreakdown(calculateYearlyBreakdown(contributionPerPeriod, totalPeriods));
    } else {
      // Calculate time to reach goal with current contribution
      if (contributionPerPeriod <= 0) {
        setResults({
          contributionPerPeriod: contributionPerPeriod,
          totalDeposited: currentBalance,
          interestEarned: 0,
          finalBalance: currentBalance,
          timeInMonths: 0,
        });
        setYearlyBreakdown([]);
        return;
      }

      const numerator = savingsGoal + (contributionPerPeriod / ratePerPeriod);
      const denominator = currentBalance + (contributionPerPeriod / ratePerPeriod);
      const periodsToGoal = Math.log(numerator / denominator) / Math.log(1 + ratePerPeriod);
      const months = Math.round(periodsToGoal * (12 / periodsPerYear))

      // Calculate final balance now with calculated period data.
      const futureValueOfInitial = currentBalance * Math.pow(1 + ratePerPeriod, periodsToGoal);
      const futureValueOfAnnuity =
        contributionPerPeriod * ((Math.pow(1 + ratePerPeriod, periodsToGoal) - 1) / ratePerPeriod);
      const finalBalance = futureValueOfInitial + futureValueOfAnnuity;
      const totalDeposited = currentBalance + contributionPerPeriod * periodsToGoal;

      setResults({
        contributionPerPeriod: contributionPerPeriod,
        totalDeposited: totalDeposited,
        interestEarned: finalBalance - totalDeposited,
        finalBalance: finalBalance,
        timeInMonths: months,
      });
      setYearlyBreakdown(calculateYearlyBreakdown(contributionPerPeriod, periodsToGoal));
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
    calculateYearlyBreakdown,
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
    mode
  );

  // Handle field blur - mark field as touched
  const handleFieldBlur = (fieldName: string) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
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
      setYearlyBreakdown([]);
      return;
    }

    calculateResults();
  }, [calculateResults, validation.hasBlockingErrors]);

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
              className={`h-18 whitespace-normal cursor-pointer ${mode === "time-to-goal" ? "bg-navy text-white hover:bg-lagunita" : "bg-[var(--results-white-background)] hover:bg-lagunita hover:text-white"}`}
              onClick={() => setMode("time-to-goal")}
            >
              <FaRegCalendar className="hidden sm:block h-5 w-5 mr-2" />
              Time to Goal
            </Button>
            <Button
              variant={mode === "future-balance" ? "default" : "outline"}
              className={`h-18 whitespace-normal cursor-pointer ${mode === "future-balance" ? "bg-palo-verde text-white hover:bg-[var(--button-green)]" : "bg-[var(--results-white-background)] hover:bg-[var(--button-green)] hover:text-white"}`}
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
                    value={savingsGoal === 0 ? "" : savingsGoal}
                    placeholder=""
                    onChange={(e) => setSavingsGoal(Number(e.target.value))}
                    onBlur={() => handleFieldBlur("savingsGoal")}
                    className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      validation.errors.savingsGoal ? "border-[var(--color-inline-error)]" : "border-input"
                    }`}

                  />
                </div>
                {validation.errors.savingsGoal && (
                  <p className="text-sm font-semibold text-[var(--color-inline-error)] mt-1">
                    {validation.errors.savingsGoal}
                  </p>
                )}
                {validation.info.savingsGoal && !validation.errors.savingsGoal && (
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
                    value={currentBalance === 0 ? "" : currentBalance}
                    placeholder=""
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                    onBlur={() => handleFieldBlur("currentBalance")}

                    className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      validation.errors.currentBalance ? "border-[var(--color-inline-error)]" : "border-input"
                    }`}
                  />
                </div>
                {validation.errors.currentBalance && (
                  <p className="text-sm font-semibold text-[var(--color-inline-error)] mt-1">
                    {validation.errors.currentBalance}
                  </p>
                )}
              </div>

              {mode !== "monthly-savings" && (
                <div>
                  <Label className="font-medium">Saving per compounding period:</Label>
                  <div className="relative mt-1">
                    <Input
                      type="number"
                      value={contributionPerPeriod === 0 ? "" : contributionPerPeriod}
                      placeholder=""
                      onChange={(e) => setcontributionPerPeriod(Number(e.target.value))}
                      onBlur={() => handleFieldBlur("contributionPerPeriod")}
                      className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        validation.errors.contributionPerPeriod ? "border-[var(--color-inline-error)]" : "border-input"
                      }`}
                    />
                  </div>
                  {validation.errors.contributionPerPeriod && (
                    <p className="text-sm font-semibold text-[var(--color-inline-error)] mt-1">
                      {validation.errors.contributionPerPeriod}
                    </p>
                  )}
                </div>
              )}

              {mode !== "time-to-goal" && (
                <div>
                  <Label className="font-medium">
                    {mode === "future-balance" ? "Time period" : "Time to goal"}:
                  </Label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-2 items-center">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={timeYears === 0 ? "" : timeYears}
                            placeholder=""
                            onChange={(e) => setTimeYears(Number(e.target.value))}
                            onBlur={() => handleFieldBlur("timeYears")}
                            className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              validation.errors.timeYears ? "border-[var(--color-inline-error)]" : "border-input"
                            }`}
                          />
                        </div>
                        <Label className="font-medium">Years</Label>
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
                            type="number"
                            value={timeMonths === 0 ? "" : timeMonths}
                            placeholder=""
                            onChange={(e) => setTimeMonths(parseInt(e.target.value) || 0)}
                            onBlur={() => handleFieldBlur("timeMonths")}
                            className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              validation.errors.timeMonths ? "border-[var(--color-inline-error)]" : "border-input"
                            }`}
                          />
                        </div>
                        <Label className="font-medium">Months</Label>
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
                  Annual interest rate (%)
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="interest-rate"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={interestRate === -1 ? "" : interestRate === 0 ? "0" : interestRate}
                    placeholder=""
                    onChange={(e) => {
                      const val = e.target.value;
                      // Set to -1 if empty string, otherwise parse as number
                      setInterestRate(val === "" ? -1 : Number(val));
                    }}
                    onBlur={() => handleFieldBlur("interestRate")}
                    className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-lagunita ${
                      validation.errors.interestRate ? "border-[var(--color-inline-error)]" : interestRate === 0
                        ? "placeholder:text-berry bg-berry-light"
                        : "placeholder:text-lagunita border-input"
                    }`}
                  />
                </div>
                {validation.errors.interestRate && (
                  <p className="text-sm font-semibold text-[var(--color-inline-error)] mt-1">
                    {validation.errors.interestRate}
                  </p>
                )}
                {validation.info.interestRate && !validation.errors.interestRate && (
                  <p className="text-xs text-[var(--foreground)]/60 mt-1">
                    {validation.info.interestRate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-md font-medium text-[var(--foreground)] mb-1">Compounding</label>
                  <div className="relative">
                  <select
                  value={compounding}
                  onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                  className="block w-full rounded-md shadow-sm py-2 px-3 border appearance-none"
                  >
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
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
            <CardHeader className="pb-2">
              {mode === "monthly-savings" && (
                <>
                  <CardTitle className="text-center text-md font-bold">Saving per compounding period:</CardTitle>
                  <div className={`text-4xl font-bold text-center ${
                      isInvalid(results.totalDeposited)
                        ? "text-foreground"
                        : "text-lagunita"
                    }`}>
                      {isInvalid(results.totalDeposited)
                      ? "-"
                      : `$${results.contributionPerPeriod.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </div>
                </>
              )}

              {mode === "time-to-goal" && (
                <>
                <CardTitle className="text-center text-md font-bold">Time to reach goal:</CardTitle>
                  <div className="text-4xl font-bold text-center" style={{ color: isInvalid(results.timeInMonths) ? "var(--foreground)" : "var(--lagunita)" }}>
                    {isInvalid(results.timeInMonths)
                      ? "-"
                      : `${Math.floor(results.timeInMonths / 12)} years ${results.timeInMonths % 12} months`
                    }
                  </div>
                </>
              )}

              {mode === "future-balance" && (
                <>
                <CardTitle className="text-center text-md font-bold">Future balance:</CardTitle>
                <div className={`text-4xl font-bold text-center ${
                      isInvalid(results.finalBalance)
                        ? "text-foreground"
                        : "text-lagunita"
                    }`}>
                      {isInvalid(results.finalBalance)
                      ? "-"
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
                      <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                        {isInvalid(results.totalDeposited)
                        ? "-"
                        : `$${results.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row mb-1 bg-lagunita-lighter rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-lagunita font-bold text-white">
                        Interest earned:
                      </div>
                      <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg bg-lagunita-lighter text-lagunita font-bold overflow-hidden text-ellipsis"
                      >
                        {isInvalid(results.interestEarned)
                        ? "-"
                        : `$${results.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    {mode !== "future-balance" && (
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-blue-background)] rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 font-bold text-white bg-navy rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                        Final balance:
                      </div>
                      <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center text-[var(--foreground)] bg-[var(--results-blue-background)]">
                        {isInvalid(results.finalBalance)
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
        {/* Year by Year section */}
        <div className="hidden min-[600px]:block flex-1 mt-6 flex-row mb-1 bg-[var(--year-by-year-table)] rounded-lg border border-grey-border">
          <div className="p-4">
              <div
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex flex-row justify-between items-center gap-2 text-[var(--foreground)] whitespace-normal cursor-pointer select-none"
              >
                <div>
                  <p className="font-bold">Year by year breakdown</p>
                </div>
                <ChevronDown className={`h-8 w-8 transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
              </div>

              {showBreakdown && (
                <Card className="mb-8">
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full mt-5">
                        <thead>
                          <tr className="border-b border-[var(--year-by-year-table-line)]">
                            <th className="text-left py-2 px-1 font-bold">Year</th>
                            <th className="text-right py-2 px-3 font-bold">Starting Balance</th>
                            <th className="text-right py-2 px-3 font-bold">Contributions</th>
                            <th className="text-right py-2 px-3 font-bold text-lagunita">Interest Earned</th>
                            <th className="text-right py-2 px-1 font-bold">Ending Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearlyBreakdown.map((year) => (
                            <tr key={year.year} className="border-b border-[var(--year-by-year-table-line)] hover:bg-[var(--muted)]">
                              <td className="py-2 px-1 font-bold">
                                {year.year}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {isInvalid(year.startingBalance)
                                ? "-"
                                : `$${year.startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {isInvalid(year.contributions)
                                ? "-"
                                : `$${year.contributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-lagunita">
                                {isInvalid(year.interestEarned)
                                ? "-"
                                : `$${year.interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </td>
                              <td className="py-2 px-1 text-right font-bold">
                                {isInvalid(year.endingBalance)
                                ? "-"
                                : `$${year.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}
                