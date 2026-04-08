"use client"

import { useState, useMemo } from "react"

import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/components/select"

type CompoundingFrequency = "annually" | "semi-annually" | "quarterly" | "monthly" | "daily"

const frequencyMap: Record<CompoundingFrequency, { periods: number; label: string }> = {
  annually: { periods: 1, label: "Annually" },
  "semi-annually": { periods: 2, label: "Semi-annually" },
  quarterly: { periods: 4, label: "Quarterly" },
  monthly: { periods: 12, label: "Monthly" },
  daily: { periods: 365, label: "Daily" },
}

export default function PresentValueCalculator() {
  const [activeTab, setActiveTab] = useState("single")
  
  // Single Amount State
  const [futureValue, setFutureValue] = useState(10000)
  const [interestRate, setInterestRate] = useState(5)
  const [timePeriod, setTimePeriod] = useState(10)
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>("annually")

  // Payment Series State
  const [paymentAmount, setPaymentAmount] = useState(1000)
  const [paymentInterestRate, setPaymentInterestRate] = useState(5)
  const [numberOfPayments, setNumberOfPayments] = useState(10)
  const [paymentFrequency, setPaymentFrequency] = useState<CompoundingFrequency>("annually")

  const singleCalculations = useMemo(() => {
    const rate = interestRate / 100
    const n = frequencyMap[compoundingFrequency].periods
    const totalPeriods = n * timePeriod
    const periodRate = rate / n
    const presentValue = futureValue / Math.pow(1 + periodRate, totalPeriods)
    const discountAmount = presentValue - futureValue

    return {
      presentValue,
      discountAmount,
      totalPeriods,
    }
  }, [futureValue, interestRate, timePeriod, compoundingFrequency])

  const paymentCalculations = useMemo(() => {
    const rate = paymentInterestRate / 100
    const n = frequencyMap[paymentFrequency].periods
    const periodRate = rate / n
    
    // Present value of an annuity formula: PV = PMT * [(1 - (1 + r)^-n) / r]
    let presentValue: number
    if (periodRate === 0) {
      presentValue = paymentAmount * numberOfPayments
    } else {
      presentValue = paymentAmount * ((1 - Math.pow(1 + periodRate, -numberOfPayments)) / periodRate)
    }
    
    const totalPayments = paymentAmount * numberOfPayments
    const discountAmount = presentValue - totalPayments

    return {
      presentValue,
      totalPayments,
      discountAmount,
    }
  }, [paymentAmount, paymentInterestRate, numberOfPayments, paymentFrequency])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-8 text-center">
          Present Value Calculator
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="single">Single Amount</TabsTrigger>
            <TabsTrigger value="series">Payment Series</TabsTrigger>
          </TabsList>

          {/* Single Amount Tab */}
          <TabsContent value="single" className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-medium text-slate-800">Input Values</h2>
              
              {/* Future Value Input */}
              <div className="space-y-2">
                <Label htmlFor="future-value" className="text-slate-700">
                  Future Value ($)
                </Label>
                <Input
                  id="future-value"
                  type="number"
                  value={futureValue}
                  onChange={(e) => setFutureValue(Number(e.target.value) || 0)}
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Interest Rate Input */}
              <div className="space-y-2">
                <Label htmlFor="interest-rate" className="text-slate-700">
                  Annual Interest Rate (%)
                </Label>
                <Input
                  id="interest-rate"
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                  min={0}
                  max={100}
                  step={0.1}
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Time Period Input */}
              <div className="space-y-2">
                <Label htmlFor="time-period" className="text-slate-700">
                  Time Period (years)
                </Label>
                <Input
                  id="time-period"
                  type="number"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value) || 1)}
                  min={1}
                  max={100}
                  step={1}
                  className="bg-white border-slate-300"
                />
                <p className="text-sm text-slate-500">
                  {singleCalculations.totalPeriods} compounding periods
                </p>
              </div>

              {/* Compounding Frequency */}
              <div className="space-y-2">
                <Label className="text-slate-700">Compounding Frequency</Label>
                <Select
                  value={compoundingFrequency}
                  onValueChange={(value) => setCompoundingFrequency(value as CompoundingFrequency)}
                >
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyMap).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-medium text-slate-800 mb-6">Results</h2>
              
              {/* Main Present Value Display */}
              <div className="bg-emerald-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-emerald-600 mb-1">Present Value</p>
                <p className="text-3xl md:text-4xl font-bold text-emerald-700">
                  {formatCurrency(singleCalculations.presentValue)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Future Value</span>
                  <span className="text-slate-800 font-medium">{formatCurrency(futureValue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Present Value</span>
                  <span className="text-slate-800 font-medium">{formatCurrency(singleCalculations.presentValue)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Discount Amount</span>
                  <span className="text-red-600 font-medium">{formatCurrency(singleCalculations.discountAmount)}</span>
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-4 text-center">
                Compounded {frequencyMap[compoundingFrequency].label.toLowerCase()} over {timePeriod} years
              </p>
            </div>
          </TabsContent>

          {/* Payment Series Tab */}
          <TabsContent value="series" className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-medium text-slate-800">Input Values</h2>
              
              {/* Payment Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="payment-amount" className="text-slate-700">
                  Payment Amount ($)
                </Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Interest Rate Input */}
              <div className="space-y-2">
                <Label htmlFor="payment-interest-rate" className="text-slate-700">
                  Annual Interest Rate (%)
                </Label>
                <Input
                  id="payment-interest-rate"
                  type="number"
                  value={paymentInterestRate}
                  onChange={(e) => setPaymentInterestRate(Number(e.target.value) || 0)}
                  min={0}
                  max={100}
                  step={0.1}
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Number of Payments Input */}
              <div className="space-y-2">
                <Label htmlFor="number-of-payments" className="text-slate-700">
                  Number of Payments
                </Label>
                <Input
                  id="number-of-payments"
                  type="number"
                  value={numberOfPayments}
                  onChange={(e) => setNumberOfPayments(Number(e.target.value) || 1)}
                  min={1}
                  max={1000}
                  step={1}
                  className="bg-white border-slate-300"
                />
              </div>

              {/* Payment Frequency */}
              <div className="space-y-2">
                <Label className="text-slate-700">Payment Frequency</Label>
                <Select
                  value={paymentFrequency}
                  onValueChange={(value) => setPaymentFrequency(value as CompoundingFrequency)}
                >
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyMap).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-medium text-slate-800 mb-6">Results</h2>
              
              {/* Main Present Value Display */}
              <div className="bg-emerald-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-emerald-600 mb-1">Present Value</p>
                <p className="text-3xl md:text-4xl font-bold text-emerald-700">
                  {formatCurrency(paymentCalculations.presentValue)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Total Payments</span>
                  <span className="text-slate-800 font-medium">{formatCurrency(paymentCalculations.totalPayments)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Present Value</span>
                  <span className="text-slate-800 font-medium">{formatCurrency(paymentCalculations.presentValue)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Discount Amount</span>
                  <span className="text-red-600 font-medium">{formatCurrency(paymentCalculations.discountAmount)}</span>
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-4 text-center">
                {numberOfPayments} payments made {frequencyMap[paymentFrequency].label.toLowerCase()}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-slate-500 text-sm mt-8">
          Present Value Calculator
        </footer>
      </div>
    </main>
  )
}
