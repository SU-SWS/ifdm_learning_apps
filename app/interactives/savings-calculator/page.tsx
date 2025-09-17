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

type CalculationMode = "monthly-savings" | "time-to-goal" | "future-balance"
type CompoundingFrequency = "monthly" | "quarterly" | "annually" | "semi-annually"

interface CalculationResults {
  monthlyContribution: number
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
  if (frequency === "quarterly") periodsPerYear = 4;
  else if (frequency === "annually") periodsPerYear = 1;
  else if (frequency === "semi-annually") periodsPerYear = 2;
  const ratePerPeriod = annualRate / 100 / periodsPerYear;
  return { periodsPerYear, ratePerPeriod };
}

export default function SavingsCalculator() {
  const [mode, setMode] = useState<CalculationMode>("monthly-savings")
  const [savingsGoal, setSavingsGoal] = useState(8000)
  const [currentBalance, setCurrentBalance] = useState(100)
  const [timeYears, setTimeYears] = useState(1)
  const [timeMonths, setTimeMonths] = useState(3)
  const [interestRate, setInterestRate] = useState(5.0)
  const [compounding, setCompounding] = useState<CompoundingFrequency>("monthly")
  const [monthlyContribution, setMonthlyContribution] = useState(203)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const MAX_MONTHS = 11;

  const [results, setResults] = useState<CalculationResults>({
    monthlyContribution: 203,
    totalDeposited: 7424,
    interestEarned: 576,
    finalBalance: 8000,
    timeInMonths: 24,
  })

  const [yearlyBreakdown, setYearlyBreakdown] = useState<YearlyBreakdown[]>([])

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

        for (let period = 1; period <= periodsInThisYear; period++) {
          const interestThisPeriod = balance * ratePerPeriod;
          yearlyInterest += interestThisPeriod;
          balance += interestThisPeriod + contribution;
          yearlyContributions += contribution;
        }

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
        const monthlyNeeded = 0;
        setResults({
          monthlyContribution: monthlyNeeded,
          totalDeposited: currentBalance,
          interestEarned: savingsGoal - currentBalance,
          finalBalance: savingsGoal,
          timeInMonths: totalTimeInMonths,
        });
        setYearlyBreakdown(calculateYearlyBreakdown(monthlyNeeded, totalPeriods));
      } else {
        const monthlyNeeded =
          remainingAmount / ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
        const totalDeposited = currentBalance + monthlyNeeded * totalPeriods;

        setResults({
          monthlyContribution: monthlyNeeded,
          totalDeposited: totalDeposited,
          interestEarned: savingsGoal - totalDeposited,
          finalBalance: savingsGoal,
          timeInMonths: totalTimeInMonths,
        });
        setYearlyBreakdown(calculateYearlyBreakdown(monthlyNeeded, totalPeriods));
      }
    } else if (mode === "future-balance") {
      // Calculate future balance with current monthly contribution
      const futureValueOfInitial = currentBalance * Math.pow(1 + ratePerPeriod, totalPeriods);
      const futureValueOfAnnuity =
        monthlyContribution * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
      const finalBalance = futureValueOfInitial + futureValueOfAnnuity;
      const totalDeposited = currentBalance + monthlyContribution * totalPeriods;

      setResults({
        monthlyContribution: monthlyContribution,
        totalDeposited: totalDeposited,
        interestEarned: finalBalance - totalDeposited,
        finalBalance: finalBalance,
        timeInMonths: totalTimeInMonths,
      });
      setYearlyBreakdown(calculateYearlyBreakdown(monthlyContribution, totalPeriods));
    } else {
      // Calculate time to reach goal with current monthly contribution
      if (monthlyContribution <= 0) {
        setResults({
          monthlyContribution: monthlyContribution,
          totalDeposited: currentBalance,
          interestEarned: 0,
          finalBalance: currentBalance,
          timeInMonths: 0,
        });
        setYearlyBreakdown([]);
        return;
      }

      // Use iterative approach to find time needed
      let periods = 1;
      let balance = currentBalance;

      while (balance < savingsGoal && periods < 1200) {
        balance = balance * (1 + ratePerPeriod) + monthlyContribution;
        periods++;
      }

      const totalDeposited = currentBalance + monthlyContribution * periods;
      const timeInMonths = Math.round(periods * (12 / periodsPerYear));

      setResults({
        monthlyContribution: monthlyContribution,
        totalDeposited: totalDeposited,
        interestEarned: savingsGoal - totalDeposited,
        finalBalance: savingsGoal,
        timeInMonths: timeInMonths,
      });
      setYearlyBreakdown(calculateYearlyBreakdown(monthlyContribution, periods));
    }
  }, [
    mode,
    savingsGoal,
    currentBalance,
    timeYears,
    timeMonths,
    interestRate,
    compounding,
    monthlyContribution,
    calculateYearlyBreakdown,
  ]);

  useEffect(() => {
    calculateResults();
  }, [calculateResults]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="py-6">
        <ThemeToggle />
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="sr-only">Savings Calculator</h1>
          </div>
          <p className="text-[var(--foreground)] text-lg">
            Plan your savings goals with compound interest and regular contributions. See how your money grows over
            time.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="font-poppins text-lg-title text-[var(--foreground)] font-bold mb-1">Solve for:</h2>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={mode === "monthly-savings" ? "default" : "outline"}
              className={`h-16 whitespace-normal ${mode === "monthly-savings" ? "bg-lagunita hover:bg-grey-700" : "bg-[var(--results-white-background)]"}`}
              onClick={() => setMode("monthly-savings")}
            >
              <FaDollarSign className="hidden sm:block h-5 w-5 mr-2" />
              Monthly Savings
            </Button>
            <Button
              variant={mode === "time-to-goal" ? "default" : "outline"}
              className={`h-16 whitespace-normal ${mode === "time-to-goal" ? "bg-navy hover:bg-grey-700 text-white" : "bg-[var(--results-white-background)]"}`}
              onClick={() => setMode("time-to-goal")}
            >
              <FaRegCalendar className="hidden sm:block h-5 w-5 mr-2" />
              Time to Goal
            </Button>
            <Button
              variant={mode === "future-balance" ? "default" : "outline"}
              className={`h-16 whitespace-normal ${mode === "future-balance" ? "bg-palo-verde hover:bg-grey-700" : "bg-[var(--results-white-background)]"}`}
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
                  <p className="font-semibold">How much do I need to save each month to reach my goal?</p>
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
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(Number(e.target.value))}
                    className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Increase amount"
                      onClick={() => setSavingsGoal((prev) => Math.max(0, prev + 1))}
                      className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                    >
                      <BiSolidUpArrow size={24} />
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Decrease amount"
                      onClick={() => setSavingsGoal((prev) => Math.max(0, prev - 1))}
                      className="hover:text-grey-med-dark focus:outline-none"
                    >
                      <BiSolidDownArrow size={24} />
                    </button>
                  </div>
                </div>
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
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                    className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Increase amount"
                      onClick={() => setCurrentBalance((prev) => Math.max(0, prev + 1))}
                      className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                    >
                      <BiSolidUpArrow size={24} />
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Decrease amount"
                      onClick={() => setCurrentBalance((prev) => Math.max(0, prev - 1))}
                      className="hover:text-grey-med-dark focus:outline-none"
                    >
                      <BiSolidDownArrow size={24} />
                    </button>
                  </div>
                </div>
              </div>

              {mode !== "monthly-savings" && (
                <div>
                  <Label className="font-medium">Monthly contribution:</Label>
                  <div className="relative mt-1">
                    <Input
                      type="number"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                      className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Increase amount"
                        onClick={() => setMonthlyContribution((prev) => Math.max(0, prev + 1))}
                        className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                      >
                        <BiSolidUpArrow size={24} />
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Decrease amount"
                        onClick={() => setMonthlyContribution((prev) => Math.max(0, prev - 1))}
                        className="hover:text-grey-med-dark focus:outline-none"
                      >
                        <BiSolidDownArrow size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mode !== "time-to-goal" && (
                <div>
                  <Label className="font-medium">
                    {mode === "future-balance" ? "Time period" : "Time to goal"}:
                    </Label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="flex flex-row gap-2 items-center">
                      <div className="relative">
                        <Input
                          type="number"
                          value={timeYears}
                          onChange={(e) => setTimeYears(Number(e.target.value))}
                          className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setTimeYears((prev) => Math.max(0, prev + 1))}
                            className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setTimeYears((prev) => Math.max(0, prev - 1))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                      <Label className="font-medium">Years</Label>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                      <div className="relative">
                        <Input
                          type="number"
                          value={timeMonths}
                          onChange={(e) =>
                            setTimeMonths(
                              Math.min(MAX_MONTHS, Math.max(0, parseInt(e.target.value) || 0))
                            )
                          }
                          max={MAX_MONTHS.toString()}
                          className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase months"
                            onClick={() => setTimeMonths((prev) => Math.min(MAX_MONTHS, prev + 1))}
                            disabled={timeMonths >= MAX_MONTHS}
                            className={`mb-[-5px] hover:text-grey-med-dark focus:outline-none ${
                              timeMonths >= MAX_MONTHS ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease months"
                            onClick={() => setTimeMonths((prev) => Math.max(0, prev - 1))}
                            disabled={timeMonths > MAX_MONTHS}
                            className={`mb-[-5px] hover:text-grey-med-dark focus:outline-none ${
                              timeMonths <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                      <Label className="font-medium">Months</Label>
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
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-lagunita"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Increase amount"
                      onClick={() => setInterestRate((prev) => Math.max(0, prev + 1))}
                      className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                    >
                      <BiSolidUpArrow size={24} />
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Decrease amount"
                      onClick={() => setInterestRate((prev) => Math.max(0, prev - 1))}
                      className="hover:text-grey-med-dark focus:outline-none"
                    >
                      <BiSolidDownArrow size={24} />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-md font-medium text-[var(--foreground)] mb-1">Compounding</label>
                  <div className="relative">
                  <select
                  value={compounding}
                  onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                  className="block w-full rounded-md shadow-sm py-2 px-3 border appearance-none"
                  >
                    <option value="annually">Annually</option>
                    <option value="semi-annually">Semi-annually</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="monthly">Monthly</option>
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
                  <CardTitle className="text-center text-md font-bold">Required monthly contribution:</CardTitle>
                  <div className="text-4xl font-bold text-lagunita text-center">
                    ${results.monthlyContribution.toFixed(2).toLocaleString()}
                  </div>
                </>
              )}

              {mode === "time-to-goal" && (
                <>
                <CardTitle className="text-center text-md font-bold">Time to reach goal:</CardTitle>
                  <div className="text-4xl font-bold text-lagunita text-center">
                    {Math.floor(results.timeInMonths / 12)} years {results.timeInMonths % 12} months
                  </div>
                </>
              )}

              {mode === "future-balance" && (
                <>
                <CardTitle className="text-center text-md font-bold">Future balance:</CardTitle>
                <div className="text-4xl font-bold text-lagunita text-center">
                  ${results.finalBalance.toFixed(2).toLocaleString()}
                </div>
                </>
              )}
            </CardHeader>

            <CardContent>
              <div className="pt-6">
                <div className="rounded-lg">
                  <div className="innerwrapper">
                    <div className="flex flex-row mb-1 rounded-lg bg-[var(--results-white-background)]">
                      <div className="w-[50%] p-4 text-black font-bold rounded-l-lg bg-grey-med-dark">
                        Total deposited:
                      </div>
                      <div className="w-[50%] text-lg-title p-4 self-center rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                        ${results.totalDeposited.toFixed(2).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-row mb-1 bg-lagunita-lighter rounded-lg">
                      <div className="w-[50%] text-md p-4 rounded-l-lg bg-lagunita font-bold text-white">
                        Interest earned:
                      </div>
                      <div className="w-[50%] text-lg-title p-4 self-center rounded-r-lg bg-lagunita-lighter text-lagunita font-bold overflow-hidden text-ellipsis"
                      >
                        ${results.interestEarned.toFixed(2).toLocaleString()}
                      </div>
                    </div>
                    {mode !== "future-balance" && (
                    <div className="flex flex-row mb-1 bg-[var(--results-blue-background)] rounded-lg">
                      <div className="w-[50%] text-md p-4 font-bold text-white bg-navy rounded-l-lg flex items-center">
                        Final balance:
                      </div>
                      <div className="w-[50%] text-lg-title p-4 rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center text-[var(--foreground)] bg-[var(--results-blue-background)]">
                        ${results.finalBalance.toFixed(2).toLocaleString()}
                      </div>
                    </div>
                    )}

                    {/* Year by Year section */}
                    <div className="hidden lg:block flex-1 mt-6 flex-row mb-1 bg-[var(--results-year-background)] rounded-lg border border-grey-border">
                      <div className="p-4">
                          <div
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="flex flex-row justify-between items-center gap-2 text-[var(--foreground)] whitespace-normal cursor-pointer select-none"
                          >
                            <div>
                              <p className="font-bold">Year by year breakdown</p>
                              <p className="font-regular text-[15px]">See how your savings grow over time</p>
                            </div>
                            <ChevronDown className={`h-8 w-8 transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
                          </div>
                          
                          {showBreakdown && (
                            <Card className="mb-8">
                              <CardHeader>
                                {mode === "monthly-savings" && (
                                  <CardTitle className="md:text-center py-2">Monthly Savings</CardTitle>
                                )}
                                {mode === "time-to-goal" && (
                                  <CardTitle className="md:text-center py-2">Time to Goal</CardTitle>
                                )}
                                {mode === "future-balance" && (
                                  <CardTitle className="md:text-center py-2">Future Balance</CardTitle>
                                )}
                              </CardHeader>
                              <CardContent>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-teal-200 hidden md:table-row">
                                        <th className="text-left py-2 px-1 font-medium">Year</th>
                                        <th className="text-right py-2 px-3 font-medium">Starting Balance</th>
                                        <th className="text-right py-2 px-3 font-medium">Contributions</th>
                                        <th className="text-right py-2 px-3 font-medium">Interest Earned</th>
                                        <th className="text-right py-2 px-1 font-medium">Ending Balance</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {yearlyBreakdown.map((year) => (
                                        <tr key={year.year} className="border-b border-gray-100 hover:bg-[var(--muted)]">
                                          <td className="py-2 px-1 md:text-right flex md:table-cell">
                                            <span className="md:hidden font-bold pr-1">Year: </span>
                                            {year.year}
                                          </td>
                                          <td className="py-2 px-3 md:text-right flex md:table-cell">
                                            <span className="md:hidden font-bold pr-1">Starting Balance:</span>
                                            ${Math.round(year.startingBalance).toLocaleString()}
                                          </td>
                                          <td className="py-2 px-3 md:text-right flex md:table-cell">
                                            <span className="md:hidden font-bold pr-1">Contributions:</span>
                                            ${Math.round(year.contributions).toLocaleString()}
                                          </td>
                                          <td className="py-2 px-3 md:text-right flex md:table-cell">
                                            <span className="md:hidden font-bold pr-1">Interest Earned:</span>
                                            ${Math.round(year.interestEarned).toLocaleString()}
                                          </td>
                                          <td className="py-2 px-1 md:text-right flex md:table-cell mb-6">
                                            <span className="md:hidden font-bold pr-1">Ending Balance:</span>
                                            ${Math.round(year.endingBalance).toLocaleString()}
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
                  {/* Wrapper section ends */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}