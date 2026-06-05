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
import { FaCircleInfo } from "react-icons/fa6"


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
  const [futureValue, setFutureValue] = useState<string>("")
  const [interestRate, setInterestRate] = useState<string>("")
  const [timePeriod, setTimePeriod] = useState<string>("")
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>("annually")

  // Payment Series State
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentInterestRate, setPaymentInterestRate] = useState<string>("")
  const [numberOfPayments, setNumberOfPayments] = useState<string>("")
  const [paymentFrequency, setPaymentFrequency] = useState<CompoundingFrequency>("annually")
  const [finalAmount, setFinalAmount] = useState<string>("")

  // Error states
  const [futureValueError, setFutureValueError] = useState<string>("");
  const [interestRateError, setInterestRateError] = useState<string>("");
  const [timePeriodError, setTimePeriodError] = useState<string>("");
  const [paymentAmountError, setPaymentAmountError] = useState<string>("");
  const [finalAmountError, setFinalAmountError] = useState<string>("");
  const [paymentInterestRateError, setPaymentInterestRateError] = useState<string>("");
  const [numberOfPaymentsError, setNumberOfPaymentsError] = useState<string>("");

  const singleCalculations = useMemo(() => {
    const fv = parseFloat(futureValue) || 0
    const rate = (parseFloat(interestRate) || 0) / 100
    const n = frequencyMap[compoundingFrequency].periods
    const totalPeriods = parseFloat(timePeriod) || 0
    const periodRate = rate / n
    const presentValue = fv / Math.pow(1 + periodRate, totalPeriods)
    const discountAmount = fv - presentValue

    return {
      presentValue,
      discountAmount,
      totalPeriods,
    }
  }, [futureValue, interestRate, timePeriod, compoundingFrequency])

  const paymentCalculations = useMemo(() => {
    const rate = (parseFloat(paymentInterestRate) || 0) / 100;
    const n = frequencyMap[paymentFrequency].periods;
    const periods = parseFloat(numberOfPayments) || 0;
    const pa = parseFloat(paymentAmount) || 0;
    const fa = parseFloat(finalAmount) || 0;
    const periodRate = rate / n;

    let pvPayments: number;
    if (periodRate === 0) {
      pvPayments = pa * periods;
    } else {
      pvPayments = pa * ((1 - Math.pow(1 + periodRate, -periods)) / periodRate);
    }

    const pvFinalAmount = fa / Math.pow(1 + periodRate, periods);
    const presentValue = pvPayments + pvFinalAmount;
    const totalPayments = pa * periods + fa;
    const discountAmount = totalPayments - presentValue;

    return {
      presentValue,
      totalPayments,
      discountAmount,
    };
  }, [paymentAmount, finalAmount, paymentInterestRate, numberOfPayments, paymentFrequency]);

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
                  <p>
                    Enter a future value to calculate what it is worth today.
                  </p>

                  {/* Future Value */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="future-value"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Future value
                    </Label>
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)]"
                      >
                        $
                      </span>
                      <Input
                        id="future-value"
                        type="number"
                        inputMode="numeric"
                        value={futureValue}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = Number(raw);
                          if (val < 0) {
                            setFutureValueError(
                              "Future value must be greater than 0.",
                            );
                            return;
                          }
                          setFutureValueError("");
                          setFutureValue(raw);
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setFutureValue(String(val));
                          else setFutureValue("");
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${parseFloat(futureValue) > 0 ? "pl-7" : "pl-8"} ${futureValueError ? "border-[var(--color-inline-error)] border-2" : ""}`}
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

                  {/* Interest Rate */}
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
                        value={interestRate}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = Number(raw);
                          if (val > 100) {
                            setInterestRateError(
                              "Annual interest rate cannot exceed 100%.",
                            );
                          } else {
                            setInterestRateError("");
                            setInterestRate(raw);
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setInterestRate(String(val));
                          else setInterestRate("");
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${interestRateError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                        min={0}
                        max={100}
                        step={0.1}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute right-4 top-[3.3em] -translate-y-1/2 pointer-events-none text-[var(--color-symbols)]"
                      >
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

                  {/* Time Period */}
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
                      value={timePeriod}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = Number(raw);
                        if (val < 0) {
                          setTimePeriodError(
                            "Number of compounding periods must be greater than 0.",
                          );
                          return;
                        }
                        setTimePeriodError("");
                        setTimePeriod(raw);
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setTimePeriod(String(val));
                        else setTimePeriod("");
                      }}
                      className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${timePeriodError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      min={0}
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
                    <Label id="single-compounding-frequency-label"  className="block font-semibold text-foreground mb-2">
                      Compounding frequency
                    </Label>
                    <Select
                      value={compoundingFrequency}
                      onValueChange={(value) =>
                        setCompoundingFrequency(value as CompoundingFrequency)
                      }
                    >
                      <SelectTrigger className="border-1 w-full rounded-md shadow-sm py-2 px-3 !h-auto !text-base"
                      aria-labelledby="single-compounding-frequency-label">
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
                    <p className="text-sm mt-1">
                      The compounding frequency is equal to the payment
                      frequency.
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div className="w-full md:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <h2 className="text-[var(--text-navy)] text-[22px] font-bold">
                    Present value
                  </h2>
                  <p className="text-3xl font-bold text-lagunita mb-5">
                    {formatCurrency(singleCalculations.presentValue)}
                  </p>
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
                        {formatCurrency(parseFloat(futureValue) || 0)}
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
                  <p>
                    Find what a series of payments is worth today. Enter the
                    payment per period and number of periods (payments) to
                    calculate the present value.
                  </p>

                  {/* Payment Amount */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="payment-amount"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Payment per period
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
                        value={paymentAmount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = Number(raw);
                          if (val < 0) {
                            setPaymentAmountError(
                              "Payment amount must be greater than 0.",
                            );
                            return;
                          }
                          setPaymentAmountError("");
                          setPaymentAmount(raw);
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setPaymentAmount(String(val));
                          else setPaymentAmount("");
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${parseFloat(paymentAmount) > 0 ? "pl-7" : "pl-8"} ${paymentAmountError ? "border-[var(--color-inline-error)] border-2" : ""}`}
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

                  {/* Final Amount */}
                  <div className="space-y-2">
                    <div className="space-y-2 flex items-center gap-1 mb-1">
                      <Label
                        htmlFor="final-amount"
                        className="block font-semibold text-foreground mb-2"
                      >
                        Final amount (optional)
                      </Label>
                      <div className="relative group">
                        <button
                          type="button"
                          aria-describedby="rate-tooltip"
                          className="cursor-help text-[#A7C1CC] text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-lagunita"
                        >
                          <FaCircleInfo size={16} aria-hidden="true" />
                        </button>
                        <div
                          id="rate-tooltip"
                          role="tooltip"
                          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-md bg-[var(--info-popup-background)] border-1 border-grey-border text-xs p-4 invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10"
                        >
                          A lump sum recieved or paid at the end of the payment
                          series (also called final value or future value).
                        </div>
                      </div>
                    </div>
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
                        value={finalAmount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = Number(raw);
                          if (val < 0) {
                            setFinalAmountError(
                              "Final amount cannot be negative.",
                            );
                            return;
                          }
                          setFinalAmountError("");
                          setFinalAmount(raw);
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setFinalAmount("");
                            return;
                          }
                          const val = parseFloat(raw);
                          if (!isNaN(val)) setFinalAmount(String(val));
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${parseFloat(finalAmount) > 0 ? "pl-7" : "pl-8"} ${finalAmountError ? "border-[var(--color-inline-error)] border-2" : ""}`}
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

                  {/* Payment Interest Rate */}
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
                        value={paymentInterestRate}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = Number(raw);
                          if (val > 100) {
                            setPaymentInterestRateError(
                              "Annual interest rate cannot exceed 100%.",
                            );
                          } else {
                            setPaymentInterestRateError("");
                            setPaymentInterestRate(raw);
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setPaymentInterestRate(String(val));
                          else setPaymentInterestRate("");
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

                  {/* Number of Payments */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="number-of-payments"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Number of compounding periods (payments)
                    </Label>
                    <Input
                      id="number-of-payments"
                      type="number"
                      inputMode="numeric"
                      value={numberOfPayments}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = Number(raw);
                        if (val < 0) {
                          setNumberOfPaymentsError(
                            "Number of payments must be greater than 0.",
                          );
                          return;
                        }
                        setNumberOfPaymentsError("");
                        setNumberOfPayments(raw);
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setNumberOfPayments(String(val));
                        else setNumberOfPayments("");
                      }}
                      className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${numberOfPaymentsError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      min={0}
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
                    <Label id="compounding-frequency-label" className="block font-semibold text-foreground mb-2">
                      Compounding frequency
                    </Label>
                    <Select
                      value={paymentFrequency}
                      onValueChange={(value) =>
                        setPaymentFrequency(value as CompoundingFrequency)
                      }
                    >
                      <SelectTrigger className="border-1 w-full rounded-md shadow-sm py-2 px-3 !h-auto !text-base"
                      aria-labelledby="compounding-frequency-label">
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
                    <p className="text-sm mt-1">
                      The compounding frequency is equal to the payment
                      frequency.
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div className="w-full md:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <h2 className="text-[var(--text-navy)] text-[22px] font-bold">
                    Present value
                  </h2>
                  <p className="text-3xl font-bold text-lagunita mb-5">
                    {formatCurrency(paymentCalculations.presentValue)}
                  </p>
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