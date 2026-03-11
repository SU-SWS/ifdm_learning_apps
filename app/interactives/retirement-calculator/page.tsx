"use client"

import { useState, useMemo } from "react"
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card";

interface CalculatorInputs {
  annualSpending: number
  retirementLength: number
  expectedReturn: number
  inflationRate: number
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
  annualSpending: 50000,
  retirementLength: 25,
  expectedReturn: 7,
  inflationRate: 3,
}

export default function RetirementCalculator() {
  const [activeTab, setActiveTab] = useState<"balance" | "savings">("balance")
  const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs)
  const [isCalculated, setIsCalculated] = useState(false)

  const results = useMemo(() => {
    const realReturn = (inputs.expectedReturn - inputs.inflationRate) / 100

    if (realReturn <= 0) {
      const requiredBalance = inputs.annualSpending * inputs.retirementLength
      return {
        requiredBalance,
        annualSavings: requiredBalance / 30,
        monthlySavings: requiredBalance / 30 / 12,
      }
    }

    const requiredBalance =
      inputs.annualSpending *
      ((1 - Math.pow(1 + realReturn, -inputs.retirementLength)) / realReturn)

    const yearsToRetirement = 30
    const annualSavings =
      requiredBalance *
      (realReturn / (Math.pow(1 + realReturn, yearsToRetirement) - 1))

    return {
      requiredBalance: Math.round(requiredBalance),
      annualSavings: Math.round(annualSavings),
      monthlySavings: Math.round(annualSavings / 12),
    }
  }, [inputs])

  const updateInput = (key: keyof CalculatorInputs, value: string) => {
    const numValue = parseFloat(value) || 0
    setInputs((prev) => ({ ...prev, [key]: numValue }))
    setIsCalculated(false)
  }

  const handleCalculate = () => {
    setIsCalculated(true)
  }

  const handleReset = () => {
    setInputs(defaultInputs)
    setIsCalculated(false)
    setActiveTab("balance")
  }

  const realReturn = inputs.expectedReturn - inputs.inflationRate

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

        {!isCalculated && (
          <div className="mb-6 p-4 bg-[#FFF3CC] rounded-lg">
            <p className="text-[#8C5A15] font-bold">
              First calculate your required retirement balance before viewing the Annual savings tab.
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column - Inputs */}
          <div className="space-y-8">
            <h2 className="text-2xl font-medium text-foreground">
              {activeTab === "balance" ? "Required retirement balance" : "Annual savings needed"}
            </h2>

            {/* Annual Spending Input */}
            <div className="space-y-2">
              <label className="block text-sm text-foreground">
                Annual spending in retirement
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg ">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputs.annualSpending.toLocaleString()}
                  onChange={(e) => updateInput("annualSpending", e.target.value.replace(/,/g, ""))}
                  className="w-full border-b border-border bg-transparent py-2 text-lg font-medium text-foreground outline-none transition-colors focus:border-primary"
                />
              </div>
              <p className="text-xs">
                How much you expect to spend each year during retirement
              </p>
            </div>

            {/* Retirement Length Input */}
            <div className="space-y-2">
              <label className="block text-sm text-foreground">
                Expected length of retirement
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputs.retirementLength}
                  onChange={(e) => updateInput("retirementLength", e.target.value)}
                  className="w-24 border-b border-border bg-transparent py-2 text-lg font-medium text-foreground outline-none transition-colors focus:border-primary"
                />
                <span className="text-lg">years</span>
              </div>
            </div>

            {/* Expected Return Input */}
            <div className="space-y-2">
              <label className="block text-sm text-foreground">
                Expected annual return
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={inputs.expectedReturn}
                  onChange={(e) => updateInput("expectedReturn", e.target.value)}
                  className="w-20 border-b border-border bg-transparent py-2 text-lg font-medium text-foreground outline-none transition-colors focus:border-primary"
                />
                <span className="text-lg">%</span>
              </div>
              <p className="text-xs">
                The nominal annual return you expect on your investments
              </p>
            </div>

            {/* Inflation Rate Input */}
            <div className="space-y-2">
              <label className="block text-sm text-foreground">
                Expected inflation rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={inputs.inflationRate}
                  onChange={(e) => updateInput("inflationRate", e.target.value)}
                  className="w-20 border-b border-border bg-transparent py-2 text-lg font-medium text-foreground outline-none transition-colors focus:border-primary"
                />
                <span className="text-lg">%</span>
              </div>
              <p className="text-xs">
                The average annual inflation rate to account for rising costs
              </p>
            </div>

            {/* Calculate and Reset Buttons - only show on balance tab */}
            {activeTab === "balance" && (
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
            )}
          </div>

          {/* Right Column - Results */}
          <div className="bg-[var(--card-background)] rounded-3xl p-[32px]">
            <h3 className="mb-6 text-lg font-medium text-foreground">Results</h3>

            {activeTab === "balance" ? (
              <>
                {/* Required Balance Result */}
                <div className="mb-8">
                  <p className="mb-1 text-sm ">
                    Required retirement balance
                  </p>
                  <p className="text-4xl font-medium text-foreground">
                    {isCalculated ? formatCurrency(results.requiredBalance) : "—"}
                  </p>
                </div>

                {/* Breakdown */}
                {isCalculated && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Breakdown</h4>
                    <div className="h-px bg-border" />

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm ">Annual spending:</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(inputs.annualSpending)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm ">Retirement length:</span>
                      <span className="text-sm font-medium text-foreground">
                        {inputs.retirementLength} years
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm ">Real return rate:</span>
                      <span className="text-sm font-medium text-foreground">
                        {realReturn}%
                      </span>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm font-medium text-foreground">Required balance:</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(results.requiredBalance)}
                      </span>
                    </div>
                  </div>
                )}

                {!isCalculated && (
                  <p className="text-sm ">
                    Enter your details and click Calculate to see results.
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Annual Savings Result */}
                <div className="mb-8">
                  <p className="mb-1 text-sm ">
                    Annual savings needed
                  </p>
                  <p className="text-4xl font-medium text-foreground">
                    {formatCurrency(results.annualSavings)}
                  </p>
                </div>

                {/* Monthly Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Monthly breakdown</h4>
                  <div className="h-px bg-border" />

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm ">Monthly savings:</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(results.monthlySavings)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm ">Savings period:</span>
                    <span className="text-sm font-medium text-foreground">30 years</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm ">Target balance:</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(results.requiredBalance)}
                    </span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-foreground">
                      Total annual savings:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(results.annualSavings)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Note */}
            <p className="mt-8 text-xs ">
              Calculations assume a 30-year savings period before retirement, with investments growing at the real return rate (nominal return minus inflation).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
