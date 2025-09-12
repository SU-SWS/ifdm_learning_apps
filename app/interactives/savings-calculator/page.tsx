"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Button } from "@/app/ui/components/button"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { Select } from "@/app/ui/components/select";
import { ChevronUp, ChevronDown } from "lucide-react"
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";
import { FaPiggyBank,FaRegCalendar, FaDollarSign } from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import ThemeToggle from "@/app/lib/theme-toggle";

type CalculationMode = "monthly-savings" | "time-to-goal" | "future-balance"
type CompoundingFrequency = "monthly" | "quarterly" | "annually"

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

export default function SavingsCalculator() {
  const [mode, setMode] = useState<CalculationMode>("monthly-savings")
  const [savingsGoal, setSavingsGoal] = useState(8000)
  const [currentBalance, setCurrentBalance] = useState(100)
  const [timeYears, setTimeYears] = useState(1)
  const [timeMonths, setTimeMonths] = useState(24)
  const [interestRate, setInterestRate] = useState(5.0)
  const [compounding, setCompounding] = useState<CompoundingFrequency>("monthly")
  const [monthlyContribution, setMonthlyContribution] = useState(203)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const [results, setResults] = useState<CalculationResults>({
    monthlyContribution: 203,
    totalDeposited: 7424,
    interestEarned: 576,
    finalBalance: 8000,
    timeInMonths: 24,
  })

  const [yearlyBreakdown, setYearlyBreakdown] = useState<YearlyBreakdown[]>([])

  const calculateYearlyBreakdown = (monthlyAmount: number, totalMonths: number) => {
    const monthlyRate = interestRate / 100 / 12
    const breakdown: YearlyBreakdown[] = []
    let balance = currentBalance

    const totalYears = Math.ceil(totalMonths / 12)

    for (let year = 1; year <= totalYears; year++) {
      const startingBalance = balance
      const monthsInThisYear = Math.min(12, totalMonths - (year - 1) * 12)
      let yearlyContributions = 0
      let yearlyInterest = 0

      for (let month = 1; month <= monthsInThisYear; month++) {
        const interestThisMonth = balance * monthlyRate
        yearlyInterest += interestThisMonth
        balance += interestThisMonth + monthlyAmount
        yearlyContributions += monthlyAmount
      }

      breakdown.push({
        year,
        startingBalance,
        contributions: yearlyContributions,
        interestEarned: yearlyInterest,
        endingBalance: balance,
      })
    }

    return breakdown
  }

  const calculateResults = () => {
    const totalTimeInMonths = timeYears * 12 + timeMonths
    const monthlyRate = interestRate / 100 / 12
    const compoundingPerYear = compounding === "monthly" ? 12 : compounding === "quarterly" ? 4 : 1
    const periodsPerYear = compoundingPerYear
    const ratePerPeriod = interestRate / 100 / periodsPerYear

    if (mode === "monthly-savings") {
      // Calculate required monthly contribution to reach goal
      const futureValueOfInitial = currentBalance * Math.pow(1 + monthlyRate, totalTimeInMonths)
      const remainingAmount = savingsGoal - futureValueOfInitial

      if (remainingAmount <= 0) {
        const monthlyNeeded = 0
        setResults({
          monthlyContribution: monthlyNeeded,
          totalDeposited: currentBalance,
          interestEarned: savingsGoal - currentBalance,
          finalBalance: savingsGoal,
          timeInMonths: totalTimeInMonths,
        })
        setYearlyBreakdown(calculateYearlyBreakdown(monthlyNeeded, totalTimeInMonths))
      } else {
        const monthlyNeeded = remainingAmount / ((Math.pow(1 + monthlyRate, totalTimeInMonths) - 1) / monthlyRate)
        const totalDeposited = currentBalance + monthlyNeeded * totalTimeInMonths

        setResults({
          monthlyContribution: monthlyNeeded,
          totalDeposited: totalDeposited,
          interestEarned: savingsGoal - totalDeposited,
          finalBalance: savingsGoal,
          timeInMonths: totalTimeInMonths,
        })
        setYearlyBreakdown(calculateYearlyBreakdown(monthlyNeeded, totalTimeInMonths))
      }
    } else if (mode === "future-balance") {
      // Calculate future balance with current monthly contribution
      const futureValueOfInitial = currentBalance * Math.pow(1 + monthlyRate, totalTimeInMonths)
      const futureValueOfAnnuity =
        monthlyContribution * ((Math.pow(1 + monthlyRate, totalTimeInMonths) - 1) / monthlyRate)
      const finalBalance = futureValueOfInitial + futureValueOfAnnuity
      const totalDeposited = currentBalance + monthlyContribution * totalTimeInMonths

      setResults({
        monthlyContribution: monthlyContribution,
        totalDeposited: totalDeposited,
        interestEarned: finalBalance - totalDeposited,
        finalBalance: finalBalance,
        timeInMonths: totalTimeInMonths,
      })
      setYearlyBreakdown(calculateYearlyBreakdown(monthlyContribution, totalTimeInMonths))
    } else {
      // Calculate time to reach goal with current monthly contribution
      if (monthlyContribution <= 0) {
        setResults({
          monthlyContribution: monthlyContribution,
          totalDeposited: currentBalance,
          interestEarned: 0,
          finalBalance: currentBalance,
          timeInMonths: 0,
        })
        setYearlyBreakdown([])
        return
      }

      // Use iterative approach to find time needed
      let months = 1
      let balance = currentBalance

      while (balance < savingsGoal && months < 1200) {
        // Max 100 years
        balance = balance * (1 + monthlyRate) + monthlyContribution
        months++
      }

      const totalDeposited = currentBalance + monthlyContribution * months

      setResults({
        monthlyContribution: monthlyContribution,
        totalDeposited: totalDeposited,
        interestEarned: savingsGoal - totalDeposited,
        finalBalance: savingsGoal,
        timeInMonths: months,
      })
      setYearlyBreakdown(calculateYearlyBreakdown(monthlyContribution, months))
    }
  }

  useEffect(() => {
    calculateResults()
  }, [mode, savingsGoal, currentBalance, timeYears, timeMonths, interestRate, compounding, monthlyContribution])

  const incrementValue = (setter: (value: number) => void, current: number, step = 1) => {
    setter(current + step)
  }

  const decrementValue = (setter: (value: number) => void, current: number, step = 1) => {
    setter(Math.max(0, current - step))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="py-6">
        <ThemeToggle />
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaPiggyBank className="h-8 w-8 text-teal-600" />
            <h1 className="text-4xl font-bold text-teal-800">Savings Calculator</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="ml-4 text-teal-600 hover:text-teal-700 hover:bg-teal-100"
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${showBreakdown ? "rotate-90" : ""}`} />
              Year by Year
            </Button>
          </div>
          <p className="text-gray-600 text-lg">
            Plan your savings goals with compound interest and regular contributions. See how your money grows over
            time.
          </p>
        </div>

        {showBreakdown && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <FaArrowTrendUp className="h-5 w-5" />
                Year-by-Year Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-teal-200">
                      <th className="text-left py-2 px-3 font-medium text-teal-800">Year</th>
                      <th className="text-right py-2 px-3 font-medium text-teal-800">Starting Balance</th>
                      <th className="text-right py-2 px-3 font-medium text-teal-800">Contributions</th>
                      <th className="text-right py-2 px-3 font-medium text-teal-800">Interest Earned</th>
                      <th className="text-right py-2 px-3 font-medium text-teal-800">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyBreakdown.map((year) => (
                      <tr key={year.year} className="border-b border-gray-100 hover:bg-teal-50">
                        <td className="py-2 px-3 font-medium">{year.year}</td>
                        <td className="py-2 px-3 text-right">${Math.round(year.startingBalance).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">${Math.round(year.contributions).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-teal-600">
                          ${Math.round(year.interestEarned).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
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

        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="font-poppins text-lg-title text-[var(--foreground)] font-bold mb-1">Solve for:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={mode === "monthly-savings" ? "default" : "outline"}
              className={`h-16 ${mode === "monthly-savings" ? "bg-lagunita hover:bg-grey-700" : "bg-grey-light"}`}
              onClick={() => setMode("monthly-savings")}
            >
              <FaDollarSign className="h-5 w-5 mr-2" />
              Monthly Savings
            </Button>
            <Button
              variant={mode === "time-to-goal" ? "default" : "outline"}
              className={`h-16 ${mode === "time-to-goal" ? "bg-navy hover:bg-grey-700" : ""}`}
              onClick={() => setMode("time-to-goal")}
            >
              <FaRegCalendar className="h-5 w-5 mr-2" />
              Time to Goal
            </Button>
            <Button
              variant={mode === "future-balance" ? "default" : "outline"}
              className={`h-16 ${mode === "future-balance" ? "bg-palo-verde hover:bg-grey-700" : ""}`}
              onClick={() => setMode("future-balance")}
            >
              <FaArrowTrendUp className="h-5 w-5 mr-2" />
              Future Balance
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="">
            <CardHeader>
              <p className="font-semibold">How much do I need to save each month to reach my goal?</p>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    disabled={mode === "time-to-goal"}
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
                  <Label className="text-sm font-medium">Time to goal:</Label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={timeYears}
                          onChange={(e) => setTimeYears(Number(e.target.value))}
                          className="pr-12"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                          <button
                            onClick={() => incrementValue(setTimeYears, timeYears)}
                            className="h-4 w-4 flex items-center justify-center hover:bg-gray-100 rounded"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => decrementValue(setTimeYears, timeYears)}
                            className="h-4 w-4 flex items-center justify-center hover:bg-gray-100 rounded"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <Label className="text-xs text-gray-500">Years</Label>
                    </div>
                    <div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={timeMonths}
                          onChange={(e) => setTimeMonths(Number(e.target.value))}
                          className="pr-12"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col">
                          <button
                            onClick={() => incrementValue(setTimeMonths, timeMonths)}
                            className="h-4 w-4 flex items-center justify-center hover:bg-gray-100 rounded"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => decrementValue(setTimeMonths, timeMonths)}
                            className="h-4 w-4 flex items-center justify-center hover:bg-gray-100 rounded"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <Label className="text-xs text-gray-500">Months</Label>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="interest-rate" className="font-medium">
                  Annual interest rate (%)
                </Label>
                <div className="relative mt-1">
                  <FaArrowTrendUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="interest-rate"
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="font-medium">Compounding</Label>
                  <Select
                    value={compounding}
                    onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                    options={[
                      { value: "monthly", label: "Monthly" },
                      { value: "quarterly", label: "Quarterly" },
                      { value: "annually", label: "Annually" },
                    ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="mt-6 p-4 rounded-lg bg-[var(--card-background)]">
            <CardContent className="p-6">
              {mode === "monthly-savings" && (
                <div className="text-center mb-6">
                  <h2 className="font-poppins text-lg-title text-[var(--foreground)] font-bold pb-4">Required monthly contribution:</h2>
                  <div className="text-4xl font-bold text-teal-600">
                    ${Math.round(results.monthlyContribution).toLocaleString()}
                  </div>
                </div>
              )}

              {mode === "time-to-goal" && (
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Time to reach goal:</h3>
                  <div className="text-4xl font-bold text-teal-600">
                    {Math.floor(results.timeInMonths / 12)} years {results.timeInMonths % 12} months
                  </div>
                </div>
              )}

              {mode === "future-balance" && (
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Future balance:</h3>
                  <div className="text-4xl font-bold text-teal-600">
                    ${Math.round(results.finalBalance).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Deposited:</span>
                  <span className="font-semibold">${Math.round(results.totalDeposited).toLocaleString()}</span>
                </div>

                <div className="bg-teal-600 text-white p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Interest earned:</span>
                    <span className="font-bold">${Math.round(results.interestEarned).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-teal-800 text-white p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Final Balance:</span>
                    <span className="font-bold">${Math.round(results.finalBalance).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaArrowTrendUp className="h-5 w-5 text-teal-600" />
                  <h4 className="font-medium text-teal-800">Year by Year breakdown</h4>
                </div>
                <p className="text-teal-700">See how your savings grow over time</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
