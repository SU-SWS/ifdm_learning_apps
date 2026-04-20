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
import ThemeToggle from "@/app/lib/theme-toggle"

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
    const discountAmount =  futureValue - presentValue

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
    const discountAmount = totalPayments -presentValue

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
    <div className="p-6 max-w-5xl mx-auto">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <h1 className="sr-only mb-2">Present Value Calculator</h1>
            <ThemeToggle />
            <div className="flex flex-col md:flex-row gap-8">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 p-0">
            <TabsTrigger value="single">Single Amount</TabsTrigger>
            <TabsTrigger value="series">Payment Series</TabsTrigger>
          </TabsList>

          {/* Single Amount Tab */}
          <TabsContent value="single" className="space-y-8">
            <div className="flex flex-col md:flex-row flex-grow space-between gap-5">
              <div className="w-full md:w-1/2 space-y-6 bg-transparent">
                {/* Future Value Input */}
                <div className="space-y-2">
                  <Label htmlFor="future-value" className="text-sm font-medium text-foreground">
                    Future value
                  </Label>
                  <Input
                    id="future-value"
                    type="number"
                    value={futureValue === 0 ? "" : futureValue}
                    onChange={(e) => setFutureValue(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="bg-white border-1 w-full rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                {/* Interest Rate Input */}
                <div className="space-y-2">
                  <Label htmlFor="interest-rate" className="text-sm font-medium text-foreground">
                    Annual interest rate (%)
                  </Label>
                  <Input
                    id="interest-rate"
                    type="number"
                    value={interestRate === 0 ? "" : interestRate}
                    onChange={(e) => setInterestRate(e.target.value === "" ? 0 : Number(e.target.value))}
                    min={0}
                    max={100}
                    step={0.1}
                    className="bg-white border-1 w-full rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                {/* Time Period Input */}
                <div className="space-y-2">
                  <Label htmlFor="time-period" className="text-sm font-medium text-foreground">
                    Number of payments (10 years)
                  </Label>
                  <Input
                    id="time-period"
                    type="number"
                    value={timePeriod === 0 ? "" : timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value === "" ? 0 : Number(e.target.value))}
                    min={1}
                    max={100}
                    step={1}
                    className="bg-white border-1 w-full rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                {/* Compounding Frequency */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Compounding frequency</Label>
                  <Select
                    value={compoundingFrequency}
                    onValueChange={(value) => setCompoundingFrequency(value as CompoundingFrequency)}
                  >
                    <SelectTrigger className="bg-white border-1 w-full rounded-md shadow-sm py-2 px-3">
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
              <div className="w-full md:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
                <h2 className="text-[var(--text-navy)] text-[22px] font-bold">Results</h2>

                {/* Main Present Value Display */}
                <p className="text-sm  my-2">Present Value</p>
                <p className="text-3xl font-bold text-lagunita mb-5">
                  {formatCurrency(singleCalculations.presentValue)}
                </p>

                {/* Breakdown */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                    <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                      Future value:
                    </div>
                    <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                      {formatCurrency(futureValue)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                    <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                      Present value:
                    </div>
                    <div className="w-full sm:w-[50%] text-lg-title text-lagunita p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                      {formatCurrency(singleCalculations.presentValue)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                    <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                      Discount amount:
                    </div>
                    <div className={`w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)] ${singleCalculations.discountAmount < 0 ? "text-berry" : ""}`}>
                      {formatCurrency(singleCalculations.discountAmount)}
                    </div>
                  </div>
                </div>

                <p className="text-sm mt-4 text-center md:text-left">
                  Compounded {frequencyMap[compoundingFrequency].label.toLowerCase()} over {timePeriod} years
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Payment Series Tab */}
          <TabsContent value="series" className="space-y-8">
            <div className="flex flex-col md:flex-row flex-grow space-between gap-5">

              <div className="bg-transparent w-full md:w-1/2 space-y-6">                
                {/* Payment Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="payment-amount" className="text-sm font-medium text-foreground">
                    Payment amount ($)
                  </Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    value={paymentAmount === 0 ? "" : paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="bg-white border-1 w-full rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                {/* Interest Rate Input */}
                <div className="space-y-2">
                  <Label htmlFor="payment-interest-rate" className="text-sm font-medium text-foreground">
                    Annual interest rate 
                  </Label>
                  <Input
                    id="payment-interest-rate"
                    type="number"
                    value={paymentInterestRate === 0 ? "" : paymentInterestRate}
                    onChange={(e) => setPaymentInterestRate(e.target.value === "" ? 0 : Number(e.target.value))}
                    min={0}
                    max={100}
                    step={0.1}
                    className="bg-white border-1 w-full rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                {/* Number of Payments Input */}
                <div className="space-y-2">
                  <Label htmlFor="number-of-payments" className="text-sm font-medium text-foreground">
                    Number of payments
                  </Label>
                  <Input
                    id="number-of-payments"
                    type="number"
                    value={numberOfPayments === 0 ? "" : numberOfPayments}
                    onChange={(e) => setNumberOfPayments(e.target.value === "" ? 0 : Number(e.target.value))}
                    min={1}
                    max={1000}
                    step={1}
                    className="bg-white border-1 w-full rounded-md shadow-sm py-2 px-3"
                  />
                </div>

                {/* Payment Frequency */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Payment frequency</Label>
                  <Select
                    value={paymentFrequency}
                    onValueChange={(value) => setPaymentFrequency(value as CompoundingFrequency)}
                  >
                    <SelectTrigger className="bg-white border-1 w-full rounded-md shadow-sm py-2 px-3">
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
              <div className="w-full md:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
                <h2 className="text-[var(--text-navy)] text-[22px] font-bold">Results</h2>
                
                {/* Main Present Value Display */}
                <p className="text-sm  my-2">Present Value</p>
                <p className="text-3xl font-bold text-lagunita mb-5">
                  {formatCurrency(paymentCalculations.presentValue)}
                </p>

                {/* Breakdown */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                    <div
                        className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                      Total Payments:
                    </div>
                    <div
                        className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                      {formatCurrency(paymentCalculations.totalPayments)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                    <div
                        className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                      Present Value:
                    </div>
                    <div
                        className="w-full sm:w-[50%] text-lg-title p-4 text-lagunita rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                      {formatCurrency(paymentCalculations.presentValue)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                    <div
                        className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                      Discount Amount:
                    </div>
                    <div
                        className={`w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)] ${paymentCalculations.discountAmount < 0 ? "text-berry" : ""}`}>
                      {formatCurrency(paymentCalculations.discountAmount)}
                    </div>
                  </div>
                </div>
                <p className="text-sm mt-4 text-center md:text-left">
                  {numberOfPayments} payments made {frequencyMap[paymentFrequency].label.toLowerCase()}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </div>
  )
}
