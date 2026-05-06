"use client"

import { useState, useMemo } from "react"
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsList, TabsTrigger } from "@/app/ui/components/tabs";
import { BiSolidError } from "react-icons/bi";

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

const defaultInputs: CalculatorInputs = {
  annualSpending: 60000,
  retirementLength: 25,
  expectedReturnDuringRetirement: 5,
  expectedReturnBeforeRetirement: 0,
  currentSavings: 0,
  yearsToRetirement: 0,
}

export default function RetirementCalculator() {
  const [activeTab, setActiveTab] = useState<"balance" | "savings">("balance")
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs)
  const [isCalculated, setIsCalculated] = useState(false)
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

    return {
      requiredBalance: Math.round(requiredBalance),
      targetBalance: Math.round(targetBalance),
      annualSavings: Math.round(annualSavings),
      monthlySavings: Math.round(annualSavings / 12),
    }
  }, [inputs, activeTab, frozenRequiredBalance])

  const updateInput = (key: keyof CalculatorInputs, value: string) => {
    const numValue = parseFloat(value) || 0
    setInputs((prev) => ({ ...prev, [key]: numValue }))
    
    // Inputs that ONLY affect the savings calculation (don't reset isCalculated)
    const savingsOnlyInputs: Array<keyof CalculatorInputs> = [
      "currentSavings", 
      "yearsToRetirement", 
      "expectedReturnBeforeRetirement"  // ← ADDED
    ]
    
    // Inputs that affect the Required Balance calculation
    const balanceInputs: Array<keyof CalculatorInputs> = [
      "annualSpending", 
      "retirementLength", 
      "expectedReturnDuringRetirement"  // ← ADDED
    ]
    
    // Don't reset if changing savings-only inputs
    if (savingsOnlyInputs.includes(key)) return
    
    // Don't reset if on savings tab and changing balance inputs
    if (activeTab === "savings" && balanceInputs.includes(key)) return
    
    setIsCalculated(false)
  }

  const handleCalculate = () => {
    setIsCalculated(true)
    // FREEZE the required balance when Calculate is clicked
    const realReturn = inputs.expectedReturnDuringRetirement / 100  // ← CHANGED
    let calculatedRequiredBalance: number
    
    if (realReturn <= 0) {
      calculatedRequiredBalance = inputs.annualSpending * inputs.retirementLength
    } else {
      calculatedRequiredBalance =
        inputs.annualSpending *
        ((1 - Math.pow(1 + realReturn, -inputs.retirementLength)) / realReturn)
    }
    
    setFrozenRequiredBalance(Math.round(calculatedRequiredBalance))
  }

  const handleReset = () => {
    setInputs(defaultInputs)
    setIsCalculated(false)
    setActiveTab("balance")
    setFrozenRequiredBalance(0)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <ThemeToggle />
        {/* Header */}
        <h1 className="sr-only">
          Understanding retirement planning
        </h1>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          if (v === "savings" && !isCalculated) return
          setActiveTab(v as "balance" | "savings")
          if (v === "balance") {
            setIsCalculated(false) // This allows recalculation on the balance tab
            setFrozenRequiredBalance(0) // Clear frozen value when returning to balance tab
          }
        }} className="mb-10">
          <TabsList className="grid w-full grid-rows-1 sm:grid-cols-2 p-0 gap-4">
            <TabsTrigger
              value="balance"
              className="cursor-pointer"
            >
              Required balance
            </TabsTrigger>
            <TabsTrigger
              value="savings"
              disabled={!isCalculated}
              className="cursor-pointer"
            >
              Annual savings
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column - Inputs */}
          <div className="space-y-8">
            {!isCalculated && (
              <div className="mb-6 p-5 bg-[#FFF3CC] rounded-lg flex flex-row gap-3">
                <BiSolidError className="mb-2 text-[#8C5A15]" size={80} />
                <p className="text-[#8C5A15] font-bold">
                  First calculate your required retirement balance before viewing the Annual savings tab.
                </p>
              </div>
            )}

            {activeTab === "balance" ? (
              <>
                {/* Required Balance Result */}
                {/* Annual Spending Input */}
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Annual spending in retirement
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={inputs.annualSpending || ""}
                      onChange={(e) => updateInput("annualSpending", e.target.value)}
                      className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <p className="text-xs">
                    How much you plan to withdraw each year.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Annual Savings Input */}
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Current retirement savings
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="-"
                      value={inputs.currentSavings || ""}
                      onChange={(e) => updateInput("currentSavings", e.target.value)}
                      className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      onChange={(e) => updateInput("yearsToRetirement", e.target.value)}
                      className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <p className="text-xs">
                    How many years until you plan to retire.
                  </p>
                </div>
              </>
            )}

            {/* Retirement Length Input */}
            {activeTab === "balance" && <div className="space-y-2">
              <label className="block text-sm text-foreground">
                Expected length of retirement (years)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={inputs.retirementLength || ""}
                  onChange={(e) => updateInput("retirementLength", e.target.value)}
                  className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                </div>
              <p className="text-xs">
                How many years your retirement will last.
              </p>
            </div>}

            {/* Expected Return Input - BALANCE TAB */}
            {activeTab === "balance" && (
              <div className="space-y-2">
                <label className="block text-sm text-foreground">
                  Expected annual return during retirement (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={inputs.expectedReturnDuringRetirement || ""}
                    onChange={(e) => updateInput("expectedReturnDuringRetirement", e.target.value)}
                    className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <p className="text-xs">
                  Annual investment return rate during retirement.
                </p>
              </div>
            )}

{/* Expected Return Input - SAVINGS TAB */}
{activeTab === "savings" && (
  <div className="space-y-2">
    <label className="block text-sm text-foreground">
      Expected annual return before retirement (%)
    </label>
    <div className="relative">
      <input
        type="number"
        min="0"
        step="0.1"
        value={inputs.expectedReturnBeforeRetirement || ""}
        onChange={(e) => updateInput("expectedReturnBeforeRetirement", e.target.value)}
        className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
    <p className="text-xs">
      Annual investment return rate before retirement.
    </p>
  </div>
)}

            {/* Calculate and Reset Buttons */}

            {activeTab === "balance" && (
              <>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCalculate}
                    className="inline-flex items-center justify-center rounded-md font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-18 whitespace-normal bg-navy border-2 border-navy cursor-pointer hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white w-full md:w-auto"
                  >
                    Calculate
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center rounded-md font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-18 whitespace-normal bg-navy border-2 border-navy cursor-pointer hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white w-full md:w-auto"
                  >
                    Reset
                  </button>
                </div>
              </>
            )}

          </div>

          {/* Right Column - Results */}
          <div className="bg-[var(--card-background)] rounded-3xl p-[32px]">
            {activeTab === "balance" ? (
              <>
                {/* Required Balance Result */}
                <div className="mb-8">
                  <p className="mb-1 text-xl font-bold">
                    Required Retirement Balance
                  </p>
                  <p className="text-4xl font-bold text-lagunita">
                    {isCalculated ? formatCurrency(results.requiredBalance) : "—"}
                  </p>
                  <p className="mt-3 mb-6 text-sm">
                    This estimates the lump sum needed at retirement to fund your annual spending for {inputs.retirementLength} years, assuming a {inputs.expectedReturnDuringRetirement}% annual return during retirement.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Annual Savings Result */}
                <div className="mb-8">
                  <p className="font-bold text-xl mb-1">Required Retirement Balance</p>
                  <p className="text-4xl font-bold text-lagunita">
                    {isCalculated ? formatCurrency(results.requiredBalance) : "—"}
                  </p>
                  <p className="mt-3 mb-6 text-sm">
                    This estimates the lump sum needed at retirement to fund your annual spending 
                    for {inputs.retirementLength} years, assuming a {inputs.expectedReturnDuringRetirement}% 
                    annual return during retirement.
                  </p>
                  <p className="mb-1 font-bold">
                    Required Annual Savings
                  </p>
                  <p className="text-4xl font-bold text-lagunita">
                    {formatCurrency(results.annualSavings)}
                  </p>
                  <p className="mt-3 mb-6 text-sm">
                    Amount to save each year over {inputs.yearsToRetirement} years to reach your 
                    target balance, assuming a {inputs.expectedReturnBeforeRetirement}% annual 
                    return before retirement.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
