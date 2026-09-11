"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import { FaAngleDown } from "react-icons/fa";
import ThemeToggle from "@/app/lib/theme-toggle";
import InfoPopover from "@/app/ui/components/popover";
import {
  calculatePayoffTime,
  calculateRequiredPayment,
  formatCurrency,
  formatDate,
  formatTime,
  getPeriodLabel,
  type CompoundingFrequency,
} from "../lib/debt-payoff"
import {
  formatThousands,
  sanitizeDecimal,
  sanitizeInteger,
  validateDebtPayoffInputs,
} from "../lib/validation"

// Fields whose "please enter…" message defers while the user is still
// actively editing them — see the focusedField comment below.
type FocusableField = "debtAmount" | "interestRate" | "payment" | "targetYears" | "targetMonths"

const NO_FIELDS_TOUCHED: Record<FocusableField, boolean> = {
  debtAmount: false,
  interestRate: false,
  payment: false,
  targetYears: false,
  targetMonths: false,
}

export default function DebtPayoffCalculator() {
  // All fields start blank so the user enters their own numbers rather than
  // editing a pre-filled example (IFDM-241).
  const [debtAmount, setDebtAmount] = useState<string>("")
  const [interestRate, setInterestRate] = useState<string>("")
  const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>("monthly")
  const [payment, setPayment] = useState<string>("")
  const [additionalPayment, setAdditionalPayment] = useState<string>("")
  const [targetYears, setTargetYears] = useState<string>("")
  const [targetMonths, setTargetMonths] = useState<string>("")

  // The field currently being edited, or null. A required field's "Please
  // enter…" message waits until the user leaves the field, so clearing it
  // to retype a value doesn't flash an error mid-edit. Out-of-range messages
  // are never deferred this way — the user needs to know right away why the
  // result stopped updating.
  const [focusedField, setFocusedField] = useState<FocusableField | null>(null)
  // Fields the user has entered and left at least once. A required field's
  // "Please enter…" message additionally waits for this, so the page doesn't
  // shout at the user the moment it loads with every field blank.
  const [touched, setTouched] = useState<Record<FocusableField, boolean>>(NO_FIELDS_TOUCHED)
  const clearFocus = (field: FocusableField) => {
    setFocusedField((current) => (current === field ? null : current))
    setTouched((current) => ({ ...current, [field]: true }))
  }

  const v = validateDebtPayoffInputs({
    debtAmount,
    interestRate,
    payment,
    additionalPayment,
    targetYears,
    targetMonths,
    compoundingFrequency,
  })

  const showDebtAmountError =
    !!v.debtAmountError &&
    touched.debtAmount &&
    !(debtAmount.trim() === "" && focusedField === "debtAmount")
  const showInterestRateError =
    !!v.interestRateError &&
    touched.interestRate &&
    !(interestRate.trim() === "" && focusedField === "interestRate")
  const showPaymentError =
    !!v.paymentError && touched.payment && !(payment.trim() === "" && focusedField === "payment")
  const showTargetTimeError =
    !!v.targetTimeError &&
    (touched.targetYears || touched.targetMonths) &&
    focusedField !== "targetYears" &&
    focusedField !== "targetMonths"

  const payoffResult = calculatePayoffTime({
    principal: v.debtAmountNum,
    periodicRate: v.periodicRate,
    periodsPerYear: v.periodsPerYear,
    payment: v.paymentNum,
    additionalPayment: v.additionalPaymentNum,
    totalPayment: v.totalPaymentNum,
    paymentTooLow: v.paymentTooLow,
  })

  const requiredPaymentResult = calculateRequiredPayment({
    principal: v.debtAmountNum,
    periodicRate: v.periodicRate,
    periodsPerYear: v.periodsPerYear,
    totalTargetMonths: v.totalTargetMonths,
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        {/* Header */}
        <h1 className="sr-only">Debt Payoff Calculator</h1>
        {/* Mode Selection */}
        <div className="mb-8">
          <Tabs defaultValue="time" className="w-full">
            <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-2 mb-6">
              <TabsTrigger value="time">
                Calculate Time to Pay Off Debt
              </TabsTrigger>
              <TabsTrigger value="payment">
                Calculate Required Payment
              </TabsTrigger>
            </TabsList>

            {/* Time to pay off tab. */}
            <TabsContent value="time">
              <>
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="mb-6">
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="debt-amount" className="font-medium">
                            Debt amount
                          </Label>
                          <InfoPopover title="Debt amount">
                            This is your total balance owed or what you would
                            like to pay off.
                          </InfoPopover>
                        </div>
                        <div className="relative">
                          <Input
                            id="debt-amount"
                            type="text"
                            inputMode="numeric"
                            value={debtAmount}
                            onChange={(e) => setDebtAmount(formatThousands(e.target.value))}
                            onFocus={() => setFocusedField("debtAmount")}
                            onBlur={() => clearFocus("debtAmount")}
                            className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showDebtAmountError ? "border-2 border-[var(--color-inline-error)]" : ""}`}
                          />
                        </div>
                        {showDebtAmountError && (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.debtAmountError}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="interest-rate"
                            className="font-medium"
                          >
                            Annual interest rate
                          </Label>
                          <InfoPopover title="Annual interest rate (%)">
                            This is the annual percentage rate (APR) charged by
                            your lender.
                          </InfoPopover>
                        </div>
                        <div className="relative">
                          <Input
                            id="interest-rate"
                            type="text"
                            inputMode="decimal"
                            value={interestRate}
                            onChange={(e) => setInterestRate(sanitizeDecimal(e.target.value))}
                            onFocus={() => setFocusedField("interestRate")}
                            onBlur={() => clearFocus("interestRate")}
                            className={`relative font-bold block w-full text-[var(--color-teal)] rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showInterestRateError ? "border-2 border-[var(--color-inline-error)]" : ""}`}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">
                            %
                          </span>
                        </div>
                        {showInterestRateError && (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.interestRateError}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 relative">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="compounding-select"
                            className="font-medium"
                          >
                            Compounding frequency
                          </Label>
                          <InfoPopover title="Compounding frequency">
                            {" "}
                            How often interest is applied and payments are made.
                            Most loans compound monthly.
                          </InfoPopover>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={compoundingFrequency}
                            onChange={(e) =>
                              setCompoundingFrequency(
                                e.target.value as CompoundingFrequency,
                              )
                            }
                            id="compounding-select"
                            aria-describedby="compounding-desc"
                            className="border-1 w-full rounded-md shadow-sm py-2 px-3 appearance-none"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="semi-annually">Semi-Annually</option>
                            <option value="annually">Annually</option>
                          </select>
                          <div className="pointer-events-none  ml-[-40px] text-gray-400 text-lg">
                            <FaAngleDown />
                          </div>
                        </div>
                        <div id="compounding-desc" className="sr-only">
                          Current selection: {compoundingFrequency}
                        </div>
                        <p className="text-sm">
                          The compounding frequency is equal to your payment
                          frequency. For example, in the monthly case, you make
                          12 debt payments per year.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="payment" className="font-medium">
                            Payment per compounding period
                          </Label>
                          <InfoPopover title="Payment per compounding period">
                            This is the amount you pay each period at the
                            selected frequency (e.g. $100 per month)
                          </InfoPopover>
                        </div>
                        <div className="relative">
                          <Input
                            id="payment"
                            type="text"
                            inputMode="numeric"
                            value={payment}
                            onChange={(e) => setPayment(formatThousands(e.target.value))}
                            onFocus={() => setFocusedField("payment")}
                            onBlur={() => clearFocus("payment")}
                            className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              showPaymentError
                                ? "border-2 border-[var(--color-inline-error)]"
                                : v.paymentWarning
                                  ? "border-2 border-[var(--color-inline-warning)]"
                                  : ""
                            }`}
                          />
                        </div>
                        {showPaymentError && (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.paymentError}
                          </p>
                        )}
                        {!showPaymentError && v.paymentWarning && (
                          <p className="text-sm text-[var(--color-inline-warning)] font-semibold">
                            {v.paymentWarning}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4 p-4 bg-[var(--results-year-background)] border-1 border-grey-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor="addtlpayment"
                              className="text-medium font-bold"
                            >
                              Additional payment per period (optional)
                            </Label>
                            <InfoPopover title="Additional payment per period (optional)">
                              Enter a fixed extra amount you plan to pay each
                              month.
                            </InfoPopover>
                          </div>
                        </div>
                        <div className="relative">
                          <Input
                            id="addtlpayment"
                            type="text"
                            inputMode="numeric"
                            value={additionalPayment}
                            onChange={(e) => setAdditionalPayment(formatThousands(e.target.value))}
                            className={`font-bold text-[var(--color-teal)] block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.additionalPaymentError ? "border-2 border-[var(--color-inline-error)]" : ""}`}
                          />
                        </div>
                        {v.additionalPaymentError ? (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.additionalPaymentError}
                          </p>
                        ) : (
                          <p className="text-sm">
                            Each steady extra payment reduces your total interest.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    aria-live="polite"
                    className="bg-[var(--card-background)] rounded-3xl p-[32px]"
                  >
                    <CardHeader>
                      <CardTitle className="text-[var(--text-navy)] text-[22px] text-center font-bold">
                        Your payoff summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-lg mb-6 text-center">
                        <p className="text-medium font-semibold text-[var(--text-navy)] tracking-wide">
                          Time to pay off
                        </p>
                        <p className="text-3xl font-bold text-[var(--color-teal)] mb-2">
                          {v.payoffBlocked ? "—" : formatTime(payoffResult.timeInMonths)}
                        </p>
                        {!v.payoffBlocked && (
                          <p className="text-medium font-semibold text-[var(--color-teal)]">
                            Debt-free by {formatDate(payoffResult.payoffDate)}
                          </p>
                        )}
                      </div>

                      <div className="innerwrapper">
                        <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                          <div className="w-full sm:w-[50%] p-4 font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none text-white bg-navy">
                            Total interest:
                          </div>
                          <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                            {v.payoffBlocked ? "—" : formatCurrency(payoffResult.totalInterest)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                          <div className="w-full sm:w-[50%] p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                            Total amount paid:
                          </div>
                          <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                            {v.payoffBlocked ? "—" : formatCurrency(payoffResult.totalAmountPaid)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-lagunita-lighter">
                          <div className="w-full sm:w-[50%] p-4 bg-lagunita font-bold text-white rounded-lg sm:rounded-l-lg sm:rounded-r-none">
                            Interest saved:
                          </div>
                          <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis bg-lagunita-lighter text-[var(--color-teal)]">
                            {v.payoffBlocked ? "—" : formatCurrency(payoffResult.interestSaved)}
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-medium font-semibold pt-6 text-[var(--text-navy)]">
                        You&#39;re turning your loan into a plan. A little extra
                        now means freedom sooner.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            </TabsContent>

            {/* Calculate required payment tab. */}
            <TabsContent value="payment">
              <>
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="mb-6">
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="debt-amount-2"
                            className="font-medium"
                          >
                            Debt amount
                          </Label>
                          <InfoPopover title="Debt amount">
                            This is your total balance owed or what you would
                            like to pay off.
                          </InfoPopover>
                        </div>
                        <div className="relative">
                          <Input
                            id="debt-amount-2"
                            type="text"
                            inputMode="numeric"
                            value={debtAmount}
                            onChange={(e) => setDebtAmount(formatThousands(e.target.value))}
                            onFocus={() => setFocusedField("debtAmount")}
                            onBlur={() => clearFocus("debtAmount")}
                            className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showDebtAmountError ? "border-2 border-[var(--color-inline-error)]" : ""}`}
                          />
                        </div>
                        {showDebtAmountError && (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.debtAmountError}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 relative">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="interest-rate-2"
                            className="font-medium"
                          >
                            Annual interest rate
                          </Label>
                          <InfoPopover title="Annual interest rate (%)">
                            This is the annual percentage rate (APR) charged by
                            your lender.
                          </InfoPopover>
                        </div>
                        <div className="relative">
                          <Input
                            id="interest-rate-2"
                            type="text"
                            inputMode="decimal"
                            value={interestRate}
                            onChange={(e) => setInterestRate(sanitizeDecimal(e.target.value))}
                            onFocus={() => setFocusedField("interestRate")}
                            onBlur={() => clearFocus("interestRate")}
                            className={`font-bold text-[var(--color-teal)] block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showInterestRateError ? "border-2 border-[var(--color-inline-error)]" : ""}`}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">
                            %
                          </span>
                        </div>
                        {showInterestRateError && (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.interestRateError}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="compounding-select-2"
                            className="font-medium"
                          >
                            Compounding frequency
                          </Label>
                          <InfoPopover title="Compounding frequency">
                            How often interest is applied and payments are made.
                            Most loans compound monthly.
                          </InfoPopover>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={compoundingFrequency}
                            onChange={(e) =>
                              setCompoundingFrequency(
                                e.target.value as CompoundingFrequency,
                              )
                            }
                            id="compounding-select-2"
                            className="w-full border-1 rounded-md shadow-sm py-2 px-3 appearance-none"
                            aria-describedby="compounding-desc-2"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="semi-annually">Semi-Annually</option>
                            <option value="annually">Annually</option>
                          </select>
                          <div className="pointer-events-none  ml-[-40px] text-gray-400 text-lg">
                            <FaAngleDown />
                          </div>
                        </div>
                        <div id="compounding-desc-2" className="sr-only">
                          Current selection: {compoundingFrequency}
                        </div>
                        <p className="text-sm">
                          The compounding frequency is equal to your payment
                          frequency. For example, in the monthly case, you make
                          12 debt payments per year.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">
                            Target time to payoff
                          </Label>
                          <InfoPopover title="Target time to payoff">
                            How long do you want to take to pay off this debt?
                          </InfoPopover>
                        </div>
                        <div className="flex flex-row gap-4 w-full">
                          <div className="flex flex-row-reverse w-1/2 gap-2 items-center">
                            <Label
                              htmlFor="target-years"
                              className="text-sm text-muted-foreground flex-none"
                            >
                              Years
                            </Label>
                            <div className="relative grow">
                              <Input
                                id="target-years"
                                type="text"
                                inputMode="numeric"
                                value={targetYears}
                                onChange={(e) => setTargetYears(sanitizeInteger(e.target.value))}
                                onFocus={() => setFocusedField("targetYears")}
                                onBlur={() => clearFocus("targetYears")}
                                className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.targetYearsError ? "border-2 border-[var(--color-inline-error)]" : ""}`}
                              />
                            </div>
                          </div>
                          <div className="flex flex-row w-1/2 gap-2 items-center">
                            <div className="relative grow">
                              <Input
                                id="target-months"
                                type="text"
                                inputMode="numeric"
                                value={targetMonths}
                                onChange={(e) => setTargetMonths(sanitizeInteger(e.target.value))}
                                onFocus={() => setFocusedField("targetMonths")}
                                onBlur={() => clearFocus("targetMonths")}
                                className={`font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.targetMonthsError ? "border-2 border-[var(--color-inline-error)]" : ""}`}
                              />
                            </div>
                            <Label
                              htmlFor="target-months"
                              className="text-sm text-muted-foreground flex-none"
                            >
                              Months
                            </Label>
                          </div>
                        </div>
                        {v.targetYearsError && (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.targetYearsError}
                          </p>
                        )}
                        {v.targetMonthsError && (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.targetMonthsError}
                          </p>
                        )}
                        {showTargetTimeError ? (
                          <p role="alert" className="text-sm text-[var(--color-inline-error)] font-semibold">
                            {v.targetTimeError}
                          </p>
                        ) : (
                          <div className="text-md font-semibold text-[var(--color-teal)]">
                            Total: {v.targetYearsNum} year
                            {v.targetYearsNum !== 1 ? "s" : ""} {v.targetMonthsNum} month
                            {v.targetMonthsNum !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    aria-live="polite"
                    className="bg-[var(--card-background)] rounded-3xl p-[32px]"
                  >
                    <CardHeader className="">
                      <CardTitle className="text-[var(--text-navy)] text-[22px] text-center font-bold">
                        Required payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="">
                      <div className="rounded-lg mb-6 text-center">
                        <p className="text-lg text-[var(--text-navy)] tracking-wide mb-2">
                          Payment per {getPeriodLabel(compoundingFrequency)}
                        </p>
                        <p className="text-4xl font-bold text-[var(--color-teal)] mb-2">
                          {v.requiredPaymentBlocked
                            ? "—"
                            : formatCurrency(requiredPaymentResult.requiredPayment)}
                        </p>
                        {!v.requiredPaymentBlocked && (
                          <p className="text-[var(--color-teal)] text-lg font-semibold">
                            To pay off in{" "}
                            {formatTime(v.targetYearsNum * 12 + v.targetMonthsNum)}
                          </p>
                        )}
                      </div>

                      <div className="innerwrapper">
                        <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                          <div className="w-full sm:w-[50%] p-4 font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none text-white bg-navy">
                            Total interest:
                          </div>
                          <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                            {v.requiredPaymentBlocked
                              ? "—"
                              : formatCurrency(requiredPaymentResult.totalInterest)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                          <div className="w-full sm:w-[50%] p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                            Total amount paid:
                          </div>
                          <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                            {v.requiredPaymentBlocked
                              ? "—"
                              : formatCurrency(requiredPaymentResult.totalAmountPaid)}
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-medium font-semibold pt-6 text-[var(--text-navy)]">
                        You&#39;re turning your loan into a plan.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
