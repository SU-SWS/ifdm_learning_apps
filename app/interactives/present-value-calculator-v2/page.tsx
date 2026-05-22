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

type CompoundingFrequency = "annually" | "semi-annually" | "quarterly" | "monthly" | "biweekly" | "weekly" | "daily"

const frequencyMap: Record<CompoundingFrequency, { periods: number; label: string }> = {
  annually: { periods: 1, label: "Annually" },
  "semi-annually": { periods: 2, label: "Semi-annually" },
  quarterly: { periods: 4, label: "Quarterly" },
  monthly: { periods: 12, label: "Monthly" },
  biweekly: { periods: 26, label: "Biweekly" },
  weekly: { periods: 52, label: "Weekly" },
  daily: { periods: 365, label: "Daily" },
}

export default function PresentValueCalculator() {
  const [activeTab, setActiveTab] = useState("single")
  
  // Single Amount State
  const [futureValue, setFutureValue] = useState(0)
  const [interestRate, setInterestRate] = useState(0)
  const [timePeriod, setTimePeriod] = useState(0)
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>("annually")

  // Payment Series State
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentInterestRate, setPaymentInterestRate] = useState(0)
  const [numberOfPayments, setNumberOfPayments] = useState(0)
  const [paymentFrequency, setPaymentFrequency] = useState<CompoundingFrequency>("annually")
  const [finalAmount, setFinalAmount] = useState(0)

  // Error states
  const [futureValueError, setFutureValueError] = useState<string>("");
  const [interestRateError, setInterestRateError] = useState<string>("");
  const [timePeriodError, setTimePeriodError] = useState<string>("");
  const [paymentAmountError, setPaymentAmountError] = useState<string>("");
  const [finalAmountError, setFinalAmountError] = useState<string>("");
  const [paymentInterestRateError, setPaymentInterestRateError] =
    useState<string>("");
  const [numberOfPaymentsError, setNumberOfPaymentsError] = useState<string>("");

  const singleCalculations = useMemo(() => {
    const rate = interestRate / 100
    const n = frequencyMap[compoundingFrequency].periods
    const totalPeriods = timePeriod // CHANGED: use input directly as total periods
    const periodRate = rate / n
    const presentValue = futureValue / Math.pow(1 + periodRate, totalPeriods)
    const discountAmount = futureValue - presentValue

    return {
      presentValue,
      discountAmount,
      totalPeriods,
    }
  }, [futureValue, interestRate, timePeriod, compoundingFrequency])

  const paymentCalculations = useMemo(() => {
    const rate = paymentInterestRate / 100;
    const n = frequencyMap[paymentFrequency].periods;
    const periodRate = rate / n;

    let pvPayments: number;
    if (periodRate === 0) {
      pvPayments = paymentAmount * numberOfPayments;
    } else {
      pvPayments =
        paymentAmount *
        ((1 - Math.pow(1 + periodRate, -numberOfPayments)) / periodRate);
    }

    // PV of the lump sum final amount discounted over all periods
    const pvFinalAmount =
      finalAmount / Math.pow(1 + periodRate, numberOfPayments);

    const presentValue = pvPayments + pvFinalAmount;
    const totalPayments = paymentAmount * numberOfPayments + finalAmount;
    const discountAmount = totalPayments - presentValue;

    return {
      presentValue,
      totalPayments,
      discountAmount,
    };
  }, [
    paymentAmount,
    finalAmount,
    paymentInterestRate,
    numberOfPayments,
    paymentFrequency,
  ]);

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
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8 p-0">
              <TabsTrigger value="single">Single amount</TabsTrigger>
              <TabsTrigger value="series">Payment series</TabsTrigger>
            </TabsList>

            {/* Single Amount Tab */}
            <TabsContent value="single" className="space-y-8">
              <div className="flex flex-col md:flex-row flex-grow space-between gap-5">
                <div className="w-full md:w-1/2 space-y-6 bg-transparent">
                  {/* Future Value Input */}
                  <p>
                    Enter a future value to calculate what it is worth today.
                  </p>
                  <div className="space-y-2">
                    <Label
                      htmlFor="future-value"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Future value
                    </Label>
                    <div className="relative">
                      <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)]">
                        $
                      </span>
                      <Input
                        id="future-value"
                        type="number"
                        inputMode="numeric"
                        value={futureValue === 0 ? "" : futureValue}
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? 0 : Number(e.target.value);
                          if (val < 0) {
                            setFutureValueError(
                              "Future value must be greater than 0.",
                            );
                            return;
                          }
                          setFutureValueError("");
                          setFutureValue(val);
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${futureValue > 0 ? "pl-7" : "pl-8"} ${futureValueError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      />
                    </div>
                    {futureValueError && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
                      >
                        {futureValueError}
                      </p>
                    )}
                  </div>

                  {/* Interest Rate Input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Label
                        htmlFor="interest-rate"
                        className="block font-semibold text-foreground mb-2"
                      >
                        Annual interest rate
                      </Label>
                      <Input
                        id="interest-rate"
                        aria-label="Annual interest rate, percent"
                        type="number"
                        inputMode="numeric"
                        value={interestRate === 0 ? "" : interestRate}
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? 0 : Number(e.target.value);
                          if (val > 100) {
                            setInterestRateError(
                              "Annual interest rate cannot exceed 100%.",
                            );
                          } else {
                            setInterestRateError("");
                            setInterestRate(val);
                          }
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${interestRateError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                      <span aria-hidden="true" className="absolute right-4 top-[3.3em] -translate-y-1/2 pointer-events-none text-[var(--color-symbols)]">
                        %
                      </span>
                    </div>
                    {interestRateError && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
                      >
                        {interestRateError}
                      </p>
                    )}
                  </div>

                  {/* Time Period Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="time-period"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Number of compounding periods
                    </Label>
                    <Input
                      id="time-period"
                      type="number"
                      inputMode="numeric"
                      value={timePeriod === 0 ? "" : timePeriod}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? 0 : Number(e.target.value);
                        if (val < 1) {
                          setTimePeriodError(
                            "Number of compounding periods must be greater than 0.",
                          );
                          return;
                        }
                        setTimePeriodError("");
                        setTimePeriod(val);
                      }}
                      className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${timePeriodError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      min={1}
                      max={1000}
                      step={1}
                    />
                    {timePeriodError && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
                      >
                        {timePeriodError}
                      </p>
                    )}
                  </div>

                  {/* Compounding Frequency */}
                  <div className="space-y-2">
                    <Label className="block font-semibold text-foreground mb-2">
                      Compounding frequency
                    </Label>
                    <Select
                      value={compoundingFrequency}
                      onValueChange={(value) =>
                        setCompoundingFrequency(value as CompoundingFrequency)
                      }
                    >
                      <SelectTrigger className="border-1 w-full rounded-md shadow-sm py-2 px-3 !h-auto !text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(frequencyMap).map(
                          ([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Results Section */}
                <div className="w-full md:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
                  {/* Main Present Value Display */}
                  <h2 className="text-[var(--text-navy)] text-[22px] font-bold">
                    Present value
                  </h2>
                  <p className="text-3xl font-bold text-lagunita mb-5">
                    {formatCurrency(singleCalculations.presentValue)}
                  </p>

                  {/* Breakdown */}
                  <div
                    aria-live="polite"
                    aria-atomic="true"
                    className="space-y-3"
                  >
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
                        Discount amount:
                      </div>
                      <div
                        className={`w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)] ${singleCalculations.discountAmount < 0 ? "text-berry" : ""}`}
                      >
                        {formatCurrency(singleCalculations.discountAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Payment Series Tab */}
            <TabsContent value="series" className="space-y-8">
              <div className="flex flex-col md:flex-row flex-grow space-between gap-5">
                <div className="bg-transparent w-full md:w-1/2 space-y-6">
                  {/* Payment Amount Input */}
                  <p>
                    Find what a series of payments is worth today. Enter a
                    payment amount and number of payments to calculate the
                    present value.
                  </p>
                  <div className="space-y-2">
                    <Label
                      htmlFor="payment-amount"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Payment amount
                    </Label>
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-symbols)]"
                      >
                        $
                      </span>
                      <Input
                        id="payment-amount"
                        type="number"
                        inputMode="numeric"
                        value={paymentAmount === 0 ? "" : paymentAmount}
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? 0 : Number(e.target.value);
                          if (val < 0) {
                            setPaymentAmountError(
                              "Payment amount must be greater than 0.",
                            );
                            return;
                          }
                          setPaymentAmountError("");
                          setPaymentAmount(val);
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${paymentAmount > 0 ? "pl-7" : "pl-8"} ${paymentAmountError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      />
                    </div>
                    {paymentAmountError && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
                      >
                        {paymentAmountError}
                      </p>
                    )}
                  </div>

                  {/* Final Amount Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="final-amount"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Final amount (optional)
                    </Label>
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-symbols)]"
                      >
                        $
                      </span>
                      <Input
                        id="final-amount"
                        type="number"
                        inputMode="numeric"
                        value={finalAmount === 0 ? "" : finalAmount}
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? 0 : Number(e.target.value);
                          if (val < 0) {
                            setFinalAmountError(
                              "Final amount cannot be negative.",
                            );
                            return;
                          }
                          setFinalAmountError("");
                          setFinalAmount(val);
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${finalAmount > 0 ? "pl-7" : "pl-8"} ${finalAmountError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      />
                    </div>
                    {finalAmountError && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
                      >
                        {finalAmountError}
                      </p>
                    )}
                  </div>

                  {/* Interest Rate Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="payment-interest-rate"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Annual interest rate
                    </Label>
                    <div className="relative">
                      <Input
                        id="payment-interest-rate"
                        aria-label="Annual interest rate, percent"
                        type="number"
                        inputMode="numeric"
                        value={
                          paymentInterestRate === 0 ? "" : paymentInterestRate
                        }
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? 0 : Number(e.target.value);
                          if (val > 100) {
                            setPaymentInterestRateError(
                              "Annual interest rate cannot exceed 100%.",
                            );
                          } else {
                            setPaymentInterestRateError("");
                            setPaymentInterestRate(val);
                          }
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${paymentInterestRateError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                      >
                        %
                      </span>
                    </div>
                    {paymentInterestRateError && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
                      >
                        {paymentInterestRateError}
                      </p>
                    )}
                  </div>

                  {/* Number of Payments Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="number-of-payments"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Number of payments
                    </Label>
                    <Input
                      id="number-of-payments"
                      type="number"
                      inputMode="numeric"
                      value={numberOfPayments === 0 ? "" : numberOfPayments}
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? 0 : Number(e.target.value);
                        if (val < 1) {
                          setNumberOfPaymentsError(
                            "Number of payments must be greater than 0.",
                          );
                          return;
                        }
                        setNumberOfPaymentsError("");
                        setNumberOfPayments(val);
                      }}
                      className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${numberOfPaymentsError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      min={1}
                      max={1000}
                      step={1}
                    />
                    {numberOfPaymentsError && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-[var(--color-inline-error)] font-semibold"
                      >
                        {numberOfPaymentsError}
                      </p>
                    )}
                  </div>

                  {/* Payment Frequency */}
                  <div className="space-y-2">
                    <Label className="block font-semibold text-foreground mb-2">
                      Compounding frequency
                    </Label>
                    <Select
                      value={paymentFrequency}
                      onValueChange={(value) =>
                        setPaymentFrequency(value as CompoundingFrequency)
                      }
                    >
                      <SelectTrigger className="border-1 w-full rounded-md shadow-sm py-2 px-3 !h-auto !text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(frequencyMap).map(
                          ([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Results Section */}
                <div className="w-full md:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <h2 className="text-[var(--text-navy)] text-[22px] font-bold">
                    Present value
                  </h2>
                  <p className="text-3xl font-bold text-lagunita mb-5">
                    {formatCurrency(paymentCalculations.presentValue)}
                  </p>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                        Total payments:
                      </div>
                      <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                        {formatCurrency(paymentCalculations.totalPayments)}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                        Discount amount:
                      </div>
                      <div
                        className={`w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)] ${paymentCalculations.discountAmount < 0 ? "text-berry" : ""}`}
                      >
                        {formatCurrency(paymentCalculations.discountAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}