"use client"

import { useState, useMemo, useEffect } from "react"

import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { Button } from "@/app/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/components/select"
import ThemeToggle from "@/app/lib/theme-toggle"
import InfoPopover from "@/app/ui/components/popover";

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

const periodPluralLabels: Record<CompoundingFrequency, string> = {
  annually: "years",
  "semi-annually": "semi-annual periods",
  quarterly: "quarters",
  monthly: "months",
  biweekly: "bi-weekly periods",
  weekly: "weeks",
  daily: "days",
}

const freqLabels: Record<CompoundingFrequency, string> = {
  annually: "annual",
  "semi-annually": "semiannual",
  quarterly: "quarterly",
  monthly: "monthly",
  biweekly: "biweekly",
  weekly: "weekly",
  daily: "daily",
}

function buildPeriodsRangeError(compounding: CompoundingFrequency, max: number): string {
  const label = periodPluralLabels[compounding]
  const maxFormatted = max.toLocaleString("en-US")
  const base = `Enter a number of ${label} between 0 and ${maxFormatted}.`
  if (compounding === "annually") return base
  return `${base} (${maxFormatted} periods = 100 years with ${freqLabels[compounding]} compounding).`
}

function suppressNegativeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value
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
  const [futureValueError, setFutureValueError] = useState<string>("")
  const [interestRateError, setInterestRateError] = useState<string>("")
  const [timePeriodError, setTimePeriodError] = useState<string>("")
  const [paymentAmountError, setPaymentAmountError] = useState<string>("")
  const [finalAmountError, setFinalAmountError] = useState<string>("")
  const [paymentInterestRateError, setPaymentInterestRateError] = useState<string>("")
  const [numberOfPaymentsError, setNumberOfPaymentsError] = useState<string>("")

  // Warning states (amber — calc still runs)
  const [interestRateWarning, setInterestRateWarning] = useState<string>("")
  const [paymentInterestRateWarning, setPaymentInterestRateWarning] = useState<string>("")
  const [futureValueWarning, setFutureValueWarning] = useState<string>("")

  // Derived max periods for each tab
  const singleMaxPeriods = frequencyMap[compoundingFrequency].periods * 100
  const seriesMaxPeriods = frequencyMap[paymentFrequency].periods * 100

  // Whether each tab has a blocking error
  const singleHasError = !!futureValueError || !!interestRateError || !!timePeriodError
  const seriesHasError = !!paymentAmountError || !!finalAmountError || !!paymentInterestRateError || !!numberOfPaymentsError

  // Debounced inputs for calculations — updates after 300ms pause in typing
  const [debouncedSingle, setDebouncedSingle] = useState({
    futureValue: "",
    interestRate: "",
    timePeriod: "",
    compoundingFrequency: "annually" as CompoundingFrequency,
  })
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSingle({ futureValue, interestRate, timePeriod, compoundingFrequency }),
      300,
    )
    return () => clearTimeout(t)
  }, [futureValue, interestRate, timePeriod, compoundingFrequency])

  const [debouncedSeries, setDebouncedSeries] = useState({
    paymentAmount: "",
    paymentInterestRate: "",
    numberOfPayments: "",
    paymentFrequency: "annually" as CompoundingFrequency,
    finalAmount: "",
  })
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSeries({ paymentAmount, paymentInterestRate, numberOfPayments, paymentFrequency, finalAmount }),
      300,
    )
    return () => clearTimeout(t)
  }, [paymentAmount, paymentInterestRate, numberOfPayments, paymentFrequency, finalAmount])

  const resetSingle = () => {
    setFutureValue("")
    setInterestRate("")
    setTimePeriod("")
    setCompoundingFrequency("annually")
    setFutureValueError("")
    setFutureValueWarning("")
    setInterestRateError("")
    setTimePeriodError("")
    setInterestRateWarning("")
  }

  const resetSeries = () => {
    setPaymentAmount("")
    setPaymentInterestRate("")
    setNumberOfPayments("")
    setPaymentFrequency("annually")
    setFinalAmount("")
    setPaymentAmountError("")
    setPaymentInterestRateError("")
    setNumberOfPaymentsError("")
    setFinalAmountError("")
    setPaymentInterestRateWarning("")
  }

  const singleCalculations = useMemo(() => {
    const fv = parseFloat(debouncedSingle.futureValue) || 0
    const rate = (parseFloat(debouncedSingle.interestRate) || 0) / 100
    const n = frequencyMap[debouncedSingle.compoundingFrequency].periods
    const totalPeriods = parseFloat(debouncedSingle.timePeriod) || 0
    const periodRate = rate / n
    const presentValue = fv / Math.pow(1 + periodRate, totalPeriods)
    const discountAmount = fv - presentValue

    return {
      presentValue,
      discountAmount,
      totalPeriods,
    }
  }, [debouncedSingle])

  const paymentCalculations = useMemo(() => {
    const rate = (parseFloat(debouncedSeries.paymentInterestRate) || 0) / 100
    const n = frequencyMap[debouncedSeries.paymentFrequency].periods
    const periods = parseFloat(debouncedSeries.numberOfPayments) || 0
    const pa = parseFloat(debouncedSeries.paymentAmount) || 0
    const fa = parseFloat(debouncedSeries.finalAmount) || 0
    const periodRate = rate / n

    let pvPayments: number
    if (periodRate === 0) {
      pvPayments = pa * periods
    } else {
      pvPayments = pa * ((1 - Math.pow(1 + periodRate, -periods)) / periodRate)
    }

    const pvFinalAmount = fa / Math.pow(1 + periodRate, periods)
    const presentValue = pvPayments + pvFinalAmount
    const totalPayments = pa * periods + fa
    const discountAmount = totalPayments - presentValue

    return {
      presentValue,
      totalPayments,
      discountAmount,
    }
  }, [debouncedSeries])

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
                          if (raw === "") {
                            setFutureValueError("");
                            setFutureValueWarning("");
                            setFutureValue("");
                            return;
                          }
                          const val = Number(raw);
                          if (val < 0 || val > 1_000_000_000) {
                            setFutureValueError(
                              "Enter an amount between 0 and 1,000,000,000.",
                            );
                            setFutureValueWarning("");
                            setFutureValue(raw);
                            return;
                          }
                          setFutureValueError("");
                          setFutureValueWarning(
                            val === 0
                              ? "A future value of $0 has no present value to calculate."
                              : "",
                          );
                          setFutureValue(raw);
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          const val = parseFloat(raw);
                          if (raw === "" || isNaN(val)) {
                            setFutureValue("");
                            setFutureValueWarning("");
                            setTimeout(
                              () =>
                                setFutureValueError(
                                  "Please enter a future value to calculate.",
                                ),
                              150,
                            );
                          } else if (val < 0 || val > 1_000_000_000) {
                            setFutureValue(String(val));
                          } else {
                            setFutureValueError("");
                            setFutureValueWarning(
                              val === 0
                                ? "A future value of $0 has no present value to calculate."
                                : "",
                            );
                            setFutureValue(String(val));
                          }
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${parseFloat(futureValue) > 0 ? "pl-7" : "pl-8"} ${futureValueError ? "border-[var(--color-inline-error)] border-2" : futureValueWarning ? "border-amber-500 border-2" : ""}`}
                        min={0}
                        max={1000000000}
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
                    {futureValueWarning && (
                      <p className="mt-1 text-sm text-[var(--color-inline-warning)] font-semibold">
                        {futureValueWarning}
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
                          if (raw === "") {
                            setInterestRateError("");
                            setInterestRateWarning("");
                            setInterestRate("");
                            return;
                          }
                          const val = Number(raw);
                          if (val < 0 || val > 1000) {
                            setInterestRateError(
                              "Enter a rate between 0% and 1,000%.",
                            );
                            setInterestRateWarning("");
                            setInterestRate(raw);
                          } else {
                            setInterestRateError("");
                            if (val === 0) {
                              setInterestRateWarning(
                                "At 0%, present value equals future value, no discounting occurs.",
                              );
                            } else if (val > 50) {
                              setInterestRateWarning(
                                "Rates above 50% are unusual.",
                              );
                            } else {
                              setInterestRateWarning("");
                            }
                            setInterestRate(raw);
                          }
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          const val = parseFloat(raw);
                          if (raw === "" || isNaN(val)) {
                            setInterestRate("");
                            setInterestRateWarning("");
                            setTimeout(
                              () =>
                                setInterestRateError(
                                  "Please enter an interest rate.",
                                ),
                              150,
                            );
                          } else if (val < 0 || val > 1000) {
                            setInterestRate(String(val));
                          } else {
                            setInterestRateError("");
                            setInterestRate(String(val));
                          }
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${interestRateError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                        min={0}
                        max={1000}
                        step={0.01}
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
                    {interestRateWarning && !interestRateError && (
                      <p className="mt-1 text-sm text-[var(--color-inline-warning)] font-semibold">
                        {interestRateWarning}
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
                        if (raw === "") {
                          setTimePeriod("");
                          setTimePeriodError("");
                          return;
                        }
                        const val = Number(raw);
                        if (val < 0 || val > singleMaxPeriods) {
                          setTimePeriod("");
                          setTimePeriodError(
                            buildPeriodsRangeError(
                              compoundingFrequency,
                              singleMaxPeriods,
                            ),
                          );
                          return;
                        }
                        setTimePeriodError("");
                        setTimePeriod(raw);
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          if (!timePeriodError) {
                            setTimeout(
                              () =>
                                setTimePeriodError(
                                  "Please enter the number of periods.",
                                ),
                              150,
                            );
                          }
                        } else {
                          const val = parseFloat(raw);
                          if (!isNaN(val)) setTimePeriod(String(val));
                        }
                      }}
                      className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${timePeriodError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      min={0}
                      max={singleMaxPeriods}
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
                    <Label
                      id="single-compounding-frequency-label"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Compounding frequency
                    </Label>
                    <Select
                      value={compoundingFrequency}
                      onValueChange={(value) => {
                        const freq = value as CompoundingFrequency;
                        setCompoundingFrequency(freq);
                        if (timePeriod !== "") {
                          const newMax = frequencyMap[freq].periods * 100;
                          if (Number(timePeriod) > newMax) {
                            setTimePeriodError(
                              buildPeriodsRangeError(freq, newMax),
                            );
                          } else {
                            setTimePeriodError("");
                          }
                        }
                      }}
                    >
                      <SelectTrigger
                        className="border-1 w-full rounded-md shadow-sm py-2 px-3 !h-auto !text-base"
                        aria-labelledby="single-compounding-frequency-label"
                      >
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
                    <Button
                      type="button"
                      variant="lagunita"
                      size="sm"
                      className="font-medium px-8 mt-4"
                      onClick={resetSingle}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Results */}
                <div className="w-full md:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <h2 className="text-[var(--text-navy)] text-[22px] font-bold">
                    Present value
                  </h2>
                  <p className="text-3xl font-bold text-lagunita mb-5">
                    {singleHasError
                      ? "—"
                      : formatCurrency(singleCalculations.presentValue)}
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
                        {singleHasError
                          ? "—"
                          : formatCurrency(parseFloat(futureValue) || 0)}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                        Discount amount:
                      </div>
                      <div
                        className={`w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)] ${!singleHasError && singleCalculations.discountAmount < 0 ? "text-berry" : ""}`}
                      >
                        {singleHasError
                          ? "—"
                          : formatCurrency(
                              suppressNegativeZero(
                                singleCalculations.discountAmount,
                              ),
                            )}
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
                          if (raw === "") {
                            setPaymentAmountError("");
                            setPaymentAmount("");
                            return;
                          }
                          const val = Number(raw);
                          if (val < 0 || val > 100_000_000) {
                            setPaymentAmountError(
                              "Enter an amount between $0 and $100,000,000.",
                            );
                            setPaymentAmount(raw);
                            return;
                          }
                          setPaymentAmountError("");
                          setPaymentAmount(raw);
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          const val = parseFloat(raw);
                          if (raw === "" || isNaN(val)) {
                            setPaymentAmount("");
                          } else if (val < 0 || val > 100_000_000) {
                            setPaymentAmount(String(val));
                          } else {
                            setPaymentAmountError("");
                            setPaymentAmount(String(val));
                          }
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
                        <InfoPopover title="Final amount">
                          A lump sum received or paid at the end of the payment
                          series (also called final value or future value).
                        </InfoPopover>
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
                          if (raw === "") {
                            setFinalAmountError("");
                            setFinalAmount("");
                            return;
                          }
                          const val = Number(raw);
                          if (val < 0 || val > 1_000_000_000) {
                            setFinalAmountError(
                              "Enter an amount between $0 and $1,000,000,000.",
                            );
                            setFinalAmount(raw);
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
                          if (isNaN(val)) {
                            setFinalAmount("");
                          } else if (val < 0 || val > 1_000_000_000) {
                            setFinalAmount(String(val));
                          } else {
                            setFinalAmountError("");
                            setFinalAmount(String(val));
                          }
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
                          if (raw === "") {
                            setPaymentInterestRateError("");
                            setPaymentInterestRateWarning("");
                            setPaymentInterestRate("");
                            return;
                          }
                          const val = Number(raw);
                          if (val < 0 || val > 1000) {
                            setPaymentInterestRateError(
                              "Enter a rate between 0% and 1,000%.",
                            );
                            setPaymentInterestRateWarning("");
                            setPaymentInterestRate(raw);
                          } else {
                            setPaymentInterestRateError("");
                            if (val === 0) {
                              setPaymentInterestRateWarning(
                                "At 0%, present value equals the total of all payments and any final amount, without discounting.",
                              );
                            } else if (val > 50) {
                              setPaymentInterestRateWarning(
                                "Rates above 50% are very unusual.",
                              );
                            } else {
                              setPaymentInterestRateWarning("");
                            }
                            setPaymentInterestRate(raw);
                          }
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          const val = parseFloat(raw);
                          if (raw === "" || isNaN(val)) {
                            setPaymentInterestRate("");
                            setPaymentInterestRateWarning("");
                            setTimeout(
                              () =>
                                setPaymentInterestRateError(
                                  "Please enter an interest rate.",
                                ),
                              150,
                            );
                          } else if (val < 0 || val > 1000) {
                            setPaymentInterestRate(String(val));
                          } else {
                            setPaymentInterestRateError("");
                            setPaymentInterestRate(String(val));
                          }
                        }}
                        className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${paymentInterestRateError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                        min={0}
                        max={1000}
                        step={0.01}
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
                    {paymentInterestRateWarning &&
                      !paymentInterestRateError && (
                        <p className="mt-1 text-sm text-[var(--color-inline-warning)] font-semibold">
                          {paymentInterestRateWarning}
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
                        if (raw === "") {
                          setNumberOfPayments("");
                          setNumberOfPaymentsError("");
                          return;
                        }
                        const val = Number(raw);
                        if (val < 0 || val > seriesMaxPeriods) {
                          setNumberOfPayments("");
                          setNumberOfPaymentsError(
                            buildPeriodsRangeError(
                              paymentFrequency,
                              seriesMaxPeriods,
                            ),
                          );
                          return;
                        }
                        setNumberOfPaymentsError("");
                        setNumberOfPayments(raw);
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          if (!numberOfPaymentsError) {
                            setTimeout(
                              () =>
                                setNumberOfPaymentsError(
                                  "Please enter the number of payments.",
                                ),
                              150,
                            );
                          }
                        } else {
                          const val = parseFloat(raw);
                          if (!isNaN(val)) setNumberOfPayments(String(val));
                        }
                      }}
                      className={`border-1 w-full rounded-md shadow-sm py-2 px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${numberOfPaymentsError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      min={0}
                      max={seriesMaxPeriods}
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
                    <Label
                      id="compounding-frequency-label"
                      className="block font-semibold text-foreground mb-2"
                    >
                      Compounding frequency
                    </Label>
                    <Select
                      value={paymentFrequency}
                      onValueChange={(value) => {
                        const freq = value as CompoundingFrequency;
                        setPaymentFrequency(freq);
                        if (numberOfPayments !== "") {
                          const newMax = frequencyMap[freq].periods * 100;
                          if (Number(numberOfPayments) > newMax) {
                            setNumberOfPaymentsError(
                              buildPeriodsRangeError(freq, newMax),
                            );
                          } else {
                            setNumberOfPaymentsError("");
                          }
                        }
                      }}
                    >
                      <SelectTrigger
                        className="border-1 w-full rounded-md shadow-sm py-2 px-3 !h-auto !text-base"
                        aria-labelledby="compounding-frequency-label"
                      >
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
                    <Button
                      type="button"
                      variant="lagunita"
                      size="sm"
                      className="mt-4 font-medium px-8"
                      onClick={resetSeries}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Results */}
                <div className="w-full md:w-1/2 bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <h2 className="text-[var(--text-navy)] text-[22px] font-bold">
                    Present value
                  </h2>
                  <p className="text-3xl font-bold text-lagunita mb-5">
                    {seriesHasError
                      ? "—"
                      : formatCurrency(paymentCalculations.presentValue)}
                  </p>
                  {seriesHasError && (
                    <p className="text-sm text-muted-foreground mb-3">
                      Fix the fields on the left to see results.
                    </p>
                  )}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                        Total payments:
                      </div>
                      <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                        {seriesHasError
                          ? "—"
                          : formatCurrency(paymentCalculations.totalPayments)}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                      <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                        Discount amount:
                      </div>
                      <div
                        className={`w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)] ${!seriesHasError && paymentCalculations.discountAmount < 0 ? "text-berry" : ""}`}
                      >
                        {seriesHasError
                          ? "—"
                          : formatCurrency(
                              suppressNegativeZero(
                                paymentCalculations.discountAmount,
                              ),
                            )}
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
