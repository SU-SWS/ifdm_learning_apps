"use client"

import { useState, useMemo } from "react"
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsList, TabsTrigger } from "@/app/ui/components/tabs";
import InfoPopover from "@/app/ui/components/popover";

interface CalculatorInputs {
  annualSpending: number
  retirementLength: number
  expectedReturnDuringRetirement: number  // Used for Required Balance calculation
  expectedReturnBeforeRetirement: number  // Used ONLY for Annual Savings calculation
  currentSavings: number
  yearsToRetirement: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumberWithCommas(value: string): string {
  const num = value.replace(/,/g, "")
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const defaultInputs: CalculatorInputs = {
  annualSpending: 0,
  retirementLength: 0,
  expectedReturnDuringRetirement: 0,
  expectedReturnBeforeRetirement: 0,
  currentSavings: 0,
  yearsToRetirement: 0,
}

export default function RetirementCalculator() {
  const [activeTab, setActiveTab] = useState<"balance" | "savings">("balance")
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs)
  const [frozenRequiredBalance, setFrozenRequiredBalance] = useState<number>(0)

  const results = useMemo(() => {
    const realReturnDuringRetirement = inputs.expectedReturnDuringRetirement / 100  // ← CHANGED
    const realReturnBeforeRetirement = inputs.expectedReturnBeforeRetirement / 100  // ← ADDED

    // Calculate Required Balance based on retirement spending needs
    let calculatedRequiredBalance: number
    
    if (realReturnDuringRetirement <= 0) {  // ← CHANGED
      calculatedRequiredBalance = inputs.annualSpending * inputs.retirementLength
    } else {
      calculatedRequiredBalance =
        inputs.annualSpending *
        ((1 - Math.pow(1 + realReturnDuringRetirement, -inputs.retirementLength)) / realReturnDuringRetirement)  // ← CHANGED
    }

    // Use frozen value for Annual Savings tab, fresh calculation for Required Balance tab
    const requiredBalance = activeTab === "savings" ? frozenRequiredBalance : calculatedRequiredBalance

    // Now calculate target balance and annual savings based on the appropriate required balance
    const FV_currentSavings = inputs.currentSavings * Math.pow(1 + realReturnBeforeRetirement, inputs.yearsToRetirement)  // ← CHANGED
    const targetBalance = Math.max(0, requiredBalance - FV_currentSavings)
    
    let annualSavings: number
    
    if (realReturnBeforeRetirement <= 0 || inputs.yearsToRetirement <= 0) {  // ← CHANGED
      annualSavings = inputs.yearsToRetirement > 0 ? targetBalance / inputs.yearsToRetirement : 0
    } else {
      annualSavings =
        targetBalance *
        (realReturnBeforeRetirement / (Math.pow(1 + realReturnBeforeRetirement, inputs.yearsToRetirement) - 1))  // ← CHANGED
    }

    // Calculate savings at different frequencies
    const calculateFrequencySavings = (frequency: number) => {
      if (realReturnBeforeRetirement <= 0 || inputs.yearsToRetirement <= 0) {
        return inputs.yearsToRetirement > 0 ? targetBalance / (inputs.yearsToRetirement * frequency) : 0
      }
      
      const periodRate = Math.pow(1 + realReturnBeforeRetirement, 1 / frequency) - 1
      const totalPeriods = inputs.yearsToRetirement * frequency
      
      return targetBalance *
        (periodRate / (Math.pow(1 + periodRate, totalPeriods) - 1))
    }

    const monthlySavings = calculateFrequencySavings(12)
    const biWeeklySavings = calculateFrequencySavings(26)
    const weeklySavings = calculateFrequencySavings(52)

    return {
      requiredBalance: Math.round(requiredBalance),
      targetBalance: Math.round(targetBalance),
      annualSavings: Math.round(annualSavings),
      monthlySavings: Math.round(monthlySavings),
      biWeeklySavings: Math.round(biWeeklySavings),
      weeklySavings: Math.round(weeklySavings),
      fvCurrentSavings: Math.round(FV_currentSavings),
    }
  }, [inputs, activeTab, frozenRequiredBalance])

  const updateInput = (key: keyof CalculatorInputs, value: string) => {
    const numValue = parseFloat(value) || 0
    setInputs((prev) => ({ ...prev, [key]: numValue }))
    
    // Update frozen balance whenever balance inputs change
    const balanceInputs: Array<keyof CalculatorInputs> = [
      "annualSpending", 
      "retirementLength", 
      "expectedReturnDuringRetirement"
    ]
    
    if (balanceInputs.includes(key)) {
      let calculatedRequiredBalance: number
      
      if (key === "expectedReturnDuringRetirement") {
        const rate = numValue / 100
        if (rate <= 0) {
          calculatedRequiredBalance = inputs.annualSpending * inputs.retirementLength
        } else {
          calculatedRequiredBalance =
            inputs.annualSpending *
            ((1 - Math.pow(1 + rate, -inputs.retirementLength)) / rate)
        }
      } else if (key === "annualSpending" || key === "retirementLength") {
        const rate = inputs.expectedReturnDuringRetirement / 100
        if (rate <= 0) {
          calculatedRequiredBalance = numValue * inputs.retirementLength
        } else {
          const spendingVal = key === "annualSpending" ? numValue : inputs.annualSpending
          const lengthVal = key === "retirementLength" ? numValue : inputs.retirementLength
          calculatedRequiredBalance =
            spendingVal *
            ((1 - Math.pow(1 + rate, -lengthVal)) / rate)
        }
      } else {
        return
      }
      
      setFrozenRequiredBalance(Math.round(calculatedRequiredBalance))
    }
  }



  const handleReset = () => {
    setInputs(defaultInputs)
    setActiveTab("balance")
    setFrozenRequiredBalance(0)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <ThemeToggle />
        {/* Header */}
        <h1 className="sr-only">Understanding retirement planning</h1>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "balance" | "savings");
            if (v === "balance") {
              setFrozenRequiredBalance(0); // Clear frozen value when returning to balance tab
            }
          }}
          className="mb-10"
        >
          <TabsList className="grid w-full grid-rows-1 sm:grid-cols-2 p-0 gap-4">
            <TabsTrigger value="balance" className="cursor-pointer">
              Required balance
            </TabsTrigger>
            <TabsTrigger value="savings" className="cursor-pointer">
              Annual savings
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column - Inputs */}
          <div className="space-y-8">
            {activeTab === "balance" ? (
              <>
                {/* Required Balance Result */}
                <div className="mb-4">
                  <p className="font-semibold">
                    Step 1: Estimate the required retirement balance
                  </p>
                </div>
                {/* Annual Spending Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm text-foreground">
                      Annual spending in retirement
                    </label>
                    <InfoPopover title="Enter annual spending in today's dollars">
                      Enter annual spending in today&apos;s dollars. To account
                      for inflation, adjust the rate entered in the
                      &quot;expected annual return during retirement&quot;
                      field. For example, if expecting a 6% nominal return and
                      3% inflation, use a 3% real return.
                    </InfoPopover>
                  </div>
                  <div className="relative">
                    <span className="absolute text-[var(--color-symbols)] left-3 top-1/2 -translate-y-1/2 font-medium">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      min="1"
                      aria-label="Annual spending in retirement in dollars"
                      value={
                        inputs.annualSpending
                          ? formatNumberWithCommas(
                              inputs.annualSpending.toString(),
                            )
                          : ""
                      }
                      onChange={(e) =>
                        updateInput(
                          "annualSpending",
                          e.target.value.replace(/,/g, ""),
                        )
                      }
                      className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <p className="text-xs">
                    How much you plan to withdraw each year.
                  </p>
                </div>
              </>
            ) : (
              <>
                {frozenRequiredBalance === 0 && (
                  <div className="mb-6 p-5 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-900 font-semibold text-sm">
                      Start by calculating the required retirement balance, then
                      return here to see how much to save to reach the goal.
                    </p>
                  </div>
                )}
                <div className="mb-4">
                  <p className="font-semibold">
                    Step 2: Calculate savings needed to reach the required
                    balance
                  </p>
                </div>
                {/* Annual Savings Input */}
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Current retirement savings
                  </label>
                  <div className="relative">
                    <span className="absolute text-[var(--color-symbols)] left-3 top-1/2 -translate-y-1/2 font-medium">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      min="0"
                      placeholder=""
                      aria-label="Current retirement savings in dollars"
                      value={
                        inputs.currentSavings
                          ? formatNumberWithCommas(
                              inputs.currentSavings.toString(),
                            )
                          : ""
                      }
                      onChange={(e) =>
                        updateInput(
                          "currentSavings",
                          e.target.value.replace(/,/g, ""),
                        )
                      }
                      className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <p className="text-xs">
                    How much you have already saved for retirement.
                  </p>
                </div>

                {/* Years to Retirement Input */}
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Years until retirement
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={inputs.yearsToRetirement || ""}
                      onChange={(e) =>
                        updateInput("yearsToRetirement", e.target.value)
                      }
                      className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">
                      years
                    </span>
                  </div>
                  <p className="text-xs">
                    How many years until you plan to retire.
                  </p>
                </div>
              </>
            )}

            {/* Retirement Length Input */}
            {activeTab === "balance" && (
              <div className="space-y-2">
                <label className="block text-sm text-foreground">
                  Expected length of retirement
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={inputs.retirementLength || ""}
                    onChange={(e) =>
                      updateInput("retirementLength", e.target.value)
                    }
                    className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">
                    years
                  </span>
                </div>
                <p className="text-xs">
                  How many years your retirement will last.
                </p>
              </div>
            )}

            {/* Expected Return Input - BALANCE TAB */}
            {activeTab === "balance" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="block text-sm text-foreground">
                    Expected annual return during retirement
                  </label>
                  <InfoPopover title="Expected annual return during retirement">
                    Enter the expected rate of return on investments during
                    retirement. To account for inflation, use a real return
                    rate. For example, if expecting a 6% nominal return, and 3%
                    inflation, use a 3% real return.
                  </InfoPopover>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={inputs.expectedReturnDuringRetirement || ""}
                    onChange={(e) =>
                      updateInput(
                        "expectedReturnDuringRetirement",
                        e.target.value,
                      )
                    }
                    className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">
                    %
                  </span>
                </div>
                <p className="text-xs">
                  Annual investment return rate during retirement.
                </p>
              </div>
            )}

            {/* Expected Return Input - SAVINGS TAB */}
            {activeTab === "savings" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="block text-sm text-foreground">
                    Expected annual return before retirement
                  </label>
                  <InfoPopover title="Expected annual return before retirement">
                    Enter the expected annual return on investments before
                    retirement. To account for inflation, use a real return. For
                    example, if expecting a 8% nominal return, and 3% inflation,
                    use a 5% real return.
                  </InfoPopover>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={inputs.expectedReturnBeforeRetirement || ""}
                    onChange={(e) =>
                      updateInput(
                        "expectedReturnBeforeRetirement",
                        e.target.value,
                      )
                    }
                    className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">
                    %
                  </span>
                </div>
                <p className="text-xs">
                  Annual investment return rate before retirement.
                </p>
              </div>
            )}

            {/* Reset Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-md font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-18 whitespace-normal bg-navy border-2 border-navy cursor-pointer hover:bg-white hover:border-2 hover:border-lagunita hover:text-[var(--color-teal)] text-white w-full md:w-auto"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="bg-[var(--card-background)] rounded-3xl p-[32px]">
            {activeTab === "balance" ? (
              <>
                {/* Required Balance Result */}
                <div className="mb-8" role="status" aria-live="polite" aria-atomic="true">
                  <p className="mb-1 text-xl font-bold">
                    Required Retirement Balance
                  </p>
                  {frozenRequiredBalance > 0 ? (
                    <>
                      {results.fvCurrentSavings >= results.requiredBalance ? (
                        <>
                          <p className="text-sm">
                            With an expected{" "}
                            {inputs.expectedReturnBeforeRetirement}% annual
                            return, the current retirement savings of{" "}
                            {formatCurrency(inputs.currentSavings)} are
                            projected to{" "}
                            {results.fvCurrentSavings > results.requiredBalance
                              ? "exceed"
                              : "reach"}{" "}
                            the target retirement balance with no additional
                            contributions.
                          </p>
                          {results.fvCurrentSavings >
                            results.requiredBalance && (
                            <p className="mt-3 text-sm">
                              Estimated balance at retirement:{" "}
                              {formatCurrency(results.fvCurrentSavings)}
                            </p>
                          )}
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => {
                                setFrozenRequiredBalance(
                                  results.requiredBalance,
                                );
                                setActiveTab("savings");
                              }}
                              className="inline-flex items-center justify-center rounded-md font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-12 whitespace-normal bg-lagunita border-2 border-lagunita hover:bg-white hover:text-[var(--color-teal)] text-white"
                            >
                              Continue to annual savings
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-4xl font-bold text-[var(--color-teal)]">
                            {formatCurrency(results.requiredBalance)}
                          </p>
                          <p className="mt-3 mb-6 text-sm">
                            This estimates the lump sum needed at retirement to
                            fund {formatCurrency(inputs.annualSpending)} per
                            year for {inputs.retirementLength} years, assuming a{" "}
                            {inputs.expectedReturnDuringRetirement}% annual
                            return during retirement.
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setFrozenRequiredBalance(
                                  results.requiredBalance,
                                );
                                setActiveTab("savings");
                              }}
                              className="inline-flex items-center justify-center rounded-md font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-12 whitespace-normal bg-lagunita border-2 border-lagunita hover:bg-white hover:text-[var(--color-teal)] text-white"
                            >
                              Continue to annual savings
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-sm text-gray-700">
                        The required retirement balance will appear here. Enter
                        annual retirement spending, expected retirement length
                        (years), and expected annual return during retirement,
                        then select Calculate.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Annual Savings Result */}
                <div className="mb-8" role="status" aria-live="polite" aria-atomic="true">
                  <p className="font-bold text-xl mb-1">
                    Required Retirement Balance
                  </p>
                  <p className="text-4xl font-bold text-[var(--color-teal)]">
                    {frozenRequiredBalance > 0
                      ? formatCurrency(results.requiredBalance)
                      : "—"}
                  </p>
                  <p className="mt-3 mb-6 text-sm">
                    This estimates the lump sum needed at retirement to fund{" "}
                    {formatCurrency(inputs.annualSpending)} per year for{" "}
                    {inputs.retirementLength} years, assuming a{" "}
                    {inputs.expectedReturnDuringRetirement}% annual return
                    during retirement.
                  </p>
                  {frozenRequiredBalance > 0 && results.fvCurrentSavings >= results.requiredBalance ? (
                    <>
                      <div>
                        {/* good news card */}
                        <div className="border px-4 py-3 rounded-xl">
                          <h2 className="text-xl font-bold mb-4">Good news!</h2>
                          <p className="mt-3 mb-6 text-sm">
                            With an expected{" "}
                            {inputs.expectedReturnBeforeRetirement}% annual
                            return, the current retirement savings of{" "}
                            {formatCurrency(inputs.currentSavings)} are
                            projected to{" "}
                            {results.fvCurrentSavings > results.requiredBalance
                              ? "exceed"
                              : "reach"}{" "}
                            the target retirement balance with no additional
                            contributions.
                            {results.fvCurrentSavings >
                              results.requiredBalance && (
                              <>
                                <br />
                                Estimated balance at retirement:{" "}
                                {formatCurrency(results.fvCurrentSavings)}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-1 font-bold">Required Annual Savings</p>
                      <p className="text-4xl font-bold text-[var(--color-teal)]">
                        {formatCurrency(results.annualSavings)}
                      </p>
                      <p className="mt-3 mb-6 text-sm">
                        Amount to save each year over {inputs.yearsToRetirement}{" "}
                        years to reach your target balance, assuming a{" "}
                        {inputs.expectedReturnBeforeRetirement}% annual return
                        before retirement.
                      </p>

                      {/* Savings at Different Frequencies */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="font-bold text-lg mb-4">
                          Savings at Different Frequencies
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Monthly</span>
                            <span className="font-semibold text-[var(--color-teal)]">
                              {formatCurrency(results.monthlySavings)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Bi-weekly</span>
                            <span className="font-semibold text-[var(--color-teal)]">
                              {formatCurrency(results.biWeeklySavings)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Weekly</span>
                            <span className="font-semibold text-[var(--color-teal)]">
                              {formatCurrency(results.weeklySavings)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
