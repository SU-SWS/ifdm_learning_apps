"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { CustomSlider } from "@/app/ui/components/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import { InfoIcon, TrendingDownIcon, DollarSignIcon, SparklesIcon } from "lucide-react"

type CompoundingFrequency = "monthly" | "quarterly" | "semi-annually" | "annually"

interface PayoffResult {
  timeInMonths: number
  totalInterest: number
  totalAmountPaid: number
  interestSaved: number
  payoffDate: Date
}

interface RequiredPaymentResult {
  requiredPayment: number
  totalInterest: number
  totalAmountPaid: number
}

export default function DebtPayoffCalculator() {
  const [debtAmount, setDebtAmount] = useState(30000)
  const [interestRate, setInterestRate] = useState(4)
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>("monthly")
  const [payment, setPayment] = useState(303.74)
  const [additionalPayment, setAdditionalPayment] = useState(0)
  const [targetYears, setTargetYears] = useState(10)
  const [targetMonths, setTargetMonths] = useState(0)

  const getCompoundingPeriodsPerYear = (frequency: CompoundingFrequency): number => {
    switch (frequency) {
      case "monthly":
        return 12
      case "quarterly":
        return 4
      case "semi-annually":
        return 2
      case "annually":
        return 1
    }
  }

  const calculatePayoffTime = (): PayoffResult => {
    const principal = debtAmount
    const annualRate = interestRate / 100
    const periodsPerYear = getCompoundingPeriodsPerYear(compoundingFrequency)
    const periodicRate = annualRate / periodsPerYear
    const totalPayment = payment + additionalPayment

    if (totalPayment <= principal * periodicRate) {
      // Payment doesn't cover interest
      return {
        timeInMonths: Number.POSITIVE_INFINITY,
        totalInterest: Number.POSITIVE_INFINITY,
        totalAmountPaid: Number.POSITIVE_INFINITY,
        interestSaved: 0,
        payoffDate: new Date(9999, 11, 31),
      }
    }

    // Calculate number of periods using amortization formula
    const numPeriods = -Math.log(1 - (principal * periodicRate) / totalPayment) / Math.log(1 + periodicRate)
    const timeInMonths = (numPeriods / periodsPerYear) * 12
    const totalAmountPaid = totalPayment * numPeriods
    const totalInterest = totalAmountPaid - principal

    // Calculate interest saved with additional payment
    let interestSaved = 0
    if (additionalPayment > 0) {
      const basePayment = payment
      const baseNumPeriods = -Math.log(1 - (principal * periodicRate) / basePayment) / Math.log(1 + periodicRate)
      const baseTotalPaid = basePayment * baseNumPeriods
      const baseInterest = baseTotalPaid - principal
      interestSaved = baseInterest - totalInterest
    }

    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(timeInMonths))

    return {
      timeInMonths: Math.ceil(timeInMonths),
      totalInterest,
      totalAmountPaid,
      interestSaved,
      payoffDate,
    }
  }

  const calculateRequiredPayment = (): RequiredPaymentResult => {
    const principal = debtAmount
    const annualRate = interestRate / 100
    const periodsPerYear = getCompoundingPeriodsPerYear(compoundingFrequency)
    const periodicRate = annualRate / periodsPerYear
    const totalMonths = targetYears * 12 + targetMonths
    const numPeriods = (totalMonths / 12) * periodsPerYear

    // Calculate required payment using amortization formula
    const requiredPayment =
      (principal * periodicRate * Math.pow(1 + periodicRate, numPeriods)) / (Math.pow(1 + periodicRate, numPeriods) - 1)

    const totalAmountPaid = requiredPayment * numPeriods
    const totalInterest = totalAmountPaid - principal

    return {
      requiredPayment,
      totalInterest,
      totalAmountPaid,
    }
  }

  const payoffResult = calculatePayoffTime()
  const requiredPaymentResult = calculateRequiredPayment()

  const formatCurrency = (amount: number): string => {
    if (!isFinite(amount)) return "$∞"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const formatTime = (months: number): string => {
    if (!isFinite(months)) return "∞"
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
    if (remainingMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`
    return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-slate-900">Debt Payoff Calculator</h1>

        <Tabs defaultValue="time" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="time">Calculate Time to Pay Off Debt</TabsTrigger>
            <TabsTrigger value="payment">Calculate Required Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="time">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Debt Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="debt-amount">Debt Amount</Label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="debt-amount"
                      type="number"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(Number(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="interest-rate">Annual Interest Rate (%)</Label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="interest-rate"
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="compounding">Compounding Frequency</Label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <select
                    value={compoundingFrequency}
                    onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
                  >
                    <button id="compounding">
                      {compoundingFrequency}
                    </button>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi-annually">Semi-Annually</option>
                      <option value="annually">Annually</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    The compounding frequency is equal to your payment frequency. For example, in the monthly case, you
                    make 12 debt payments per year.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="payment">Payment per Compounding Period</Label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="payment"
                      type="number"
                      step="0.01"
                      value={payment}
                      onChange={(e) => setPayment(Number(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>Additional Payment Per Period (optional): {formatCurrency(additionalPayment)}</Label>
                      <InfoIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <CustomSlider
                    value={[additionalPayment]}
                    onValueChange={(value) => setAdditionalPayment(value[0])}
                    max={10000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$0</span>
                    <span>$10,000</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Each steady extra payment reduces your total interest.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader className="bg-emerald-100 border-b border-emerald-200">
                <CardTitle className="text-emerald-900">Your Payoff Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-emerald-100 rounded-lg p-6 mb-6 text-center">
                  <p className="text-sm text-emerald-700 uppercase tracking-wide mb-2">Time to Pay Off</p>
                  <p className="text-4xl font-bold text-emerald-900 mb-2">{formatTime(payoffResult.timeInMonths)}</p>
                  <p className="text-emerald-700">Debt-free by {formatDate(payoffResult.payoffDate)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-emerald-700">
                      <TrendingDownIcon className="w-4 h-4" />
                      <p className="text-sm font-medium">Total Interest</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(payoffResult.totalInterest)}</p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-emerald-700">
                      <DollarSignIcon className="w-4 h-4" />
                      <p className="text-sm font-medium">Total Amount Paid</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(payoffResult.totalAmountPaid)}</p>
                  </div>

                  <div className="bg-emerald-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-emerald-700">
                      <SparklesIcon className="w-4 h-4" />
                      <p className="text-sm font-medium">Interest Saved</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{formatCurrency(payoffResult.interestSaved)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6">
              You&#39;re turning your loan into a plan. A little extra now means freedom sooner.
            </p>
          </TabsContent>

          <TabsContent value="payment">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Debt Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="debt-amount-2">Debt Amount</Label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="debt-amount-2"
                      type="number"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(Number(e.target.value))}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="interest-rate-2">Annual Interest Rate (%)</Label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="interest-rate-2"
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="compounding-2">Compounding Frequency</Label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <select
                    value={compoundingFrequency}
                    onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
                  >
                    <div id="compounding-2">
                      {compoundingFrequency}
                    </div>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="semi-annually">Semi-Annually</option>
                      <option value="annually">Annually</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    The compounding frequency is equal to your payment frequency. For example, in the monthly case, you
                    make 12 debt payments per year.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Target Payoff Time</Label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target-years" className="text-sm text-muted-foreground">
                        Years
                      </Label>
                      <Input
                        id="target-years"
                        type="number"
                        min="0"
                        value={targetYears}
                        onChange={(e) => setTargetYears(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target-months" className="text-sm text-muted-foreground">
                        Months
                      </Label>
                      <Input
                        id="target-months"
                        type="number"
                        min="0"
                        max="11"
                        value={targetMonths}
                        onChange={(e) => setTargetMonths(Math.min(11, Math.max(0, Number(e.target.value))))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader className="bg-emerald-100 border-b border-emerald-200">
                <CardTitle className="text-emerald-900">Required Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-emerald-100 rounded-lg p-6 mb-6 text-center">
                  <p className="text-sm text-emerald-700 uppercase tracking-wide mb-2">Required Payment Per Period</p>
                  <p className="text-4xl font-bold text-emerald-900 mb-2">
                    {formatCurrency(requiredPaymentResult.requiredPayment)}
                  </p>
                  <p className="text-emerald-700">To pay off in {formatTime(targetYears * 12 + targetMonths)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-emerald-700">
                      <TrendingDownIcon className="w-4 h-4" />
                      <p className="text-sm font-medium">Total Interest</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(requiredPaymentResult.totalInterest)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-emerald-700">
                      <DollarSignIcon className="w-4 h-4" />
                      <p className="text-sm font-medium">Total Amount Paid</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(requiredPaymentResult.totalAmountPaid)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6">
              You&#39;re turning your loan into a plan. A little extra now means freedom sooner.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
