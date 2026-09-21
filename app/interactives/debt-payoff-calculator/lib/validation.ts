// Validation rules for the Debt Payoff Calculator (IFDM-168).
//
// This module is pure: it takes the raw input strings plus the compounding
// frequency and returns the parsed numbers, the messages to render, and the
// flags that gate the output. Keeping it separate from the component means
// the calc and the render read from one source of truth and can never
// disagree.

import { getCompoundingPeriodsPerYear, type CompoundingFrequency } from "./debt-payoff"

// Spec constraints and copy, verbatim from IFDM-168.
export const CONSTRAINTS = {
  debtAmount: { min: 1, max: 1_000_000_000 },
  annualRate: { min: 0, max: 50 },
  payment: { min: 1, max: 100_000_000 },
  additionalPayment: { min: 0, max: 100_000_000 },
  targetYears: { min: 0, max: 100 },
  targetMonths: { min: 0, max: 11 },
} as const

const MSG_DEBT_AMOUNT_EMPTY = "Please enter a debt amount"
const MSG_DEBT_AMOUNT_RANGE = `Enter an amount between $${CONSTRAINTS.debtAmount.min.toLocaleString()} and $${CONSTRAINTS.debtAmount.max.toLocaleString()}`
const MSG_RATE_EMPTY = "Please enter an annual interest rate"
const MSG_RATE_RANGE = `Enter a rate between ${CONSTRAINTS.annualRate.min}% and ${CONSTRAINTS.annualRate.max}%.`
const MSG_PAYMENT_EMPTY = "Please enter a payment amount"
const MSG_PAYMENT_RANGE = `Enter a payment amount between $${CONSTRAINTS.payment.min.toLocaleString()} and $${CONSTRAINTS.payment.max.toLocaleString()}`
const MSG_ADDITIONAL_PAYMENT_RANGE = `Enter an amount between $${CONSTRAINTS.additionalPayment.min.toLocaleString()} and $${CONSTRAINTS.additionalPayment.max.toLocaleString()}`
const MSG_YEARS_RANGE = `Enter a number of years between ${CONSTRAINTS.targetYears.min} and ${CONSTRAINTS.targetYears.max}.`
const MSG_MONTHS_RANGE = `Enter a number of months between ${CONSTRAINTS.targetMonths.min} and ${CONSTRAINTS.targetMonths.max}.`
const MSG_TARGET_TIME_EMPTY = "Please enter a target payoff time of at least 1 month."
export const MSG_PAYMENT_TOO_LOW =
  "This payment is too low to cover the interest accrued each period. The balance will not decrease over time. Try increasing the payment amount."

export function sanitizeDecimal(raw: string): string {
  const negative = raw.trimStart().startsWith("-")
  const stripped = raw.replace(/[^\d.]/g, "")
  const firstDot = stripped.indexOf(".")
  const digits =
    firstDot === -1
      ? stripped
      : stripped.slice(0, firstDot + 1) + stripped.slice(firstDot + 1).replace(/\./g, "")
  return negative ? `-${digits}` : digits
}

// Same as sanitizeDecimal, but also inserts thousands separators for
// currency-style fields (debt amount, payment, additional payment).
export function formatThousands(raw: string): string {
  const cleaned = sanitizeDecimal(raw)
  if (isBlankEntry(cleaned)) return cleaned
  const negative = cleaned.startsWith("-")
  const [intPart, decPart] = (negative ? cleaned.slice(1) : cleaned).split(".")
  const intFormatted = intPart ? Number(intPart).toLocaleString("en-US") : ""
  const formatted = decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted
  return negative ? `-${formatted}` : formatted
}

export function sanitizeInteger(raw: string): string {
  const negative = raw.trimStart().startsWith("-")
  const digits = raw.replace(/\D/g, "")
  return negative ? `-${digits}` : digits
}

export function isBlankEntry(raw: string): boolean {
  return !/\d/.test(raw)
}

function normalizeRaw(raw: string): string {
  const trimmed = raw.replace(/,/g, "").trim()
  return isBlankEntry(trimmed) ? "" : trimmed
}

function isOutOfRange(
  raw: string,
  num: number,
  range: { min: number; max: number },
): boolean {
  return raw.startsWith("-") || num < range.min || num > range.max
}

export function parseNum(raw: string): number {
  const n = Number.parseFloat(raw.replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

export interface ValidationInput {
  debtAmount: string
  interestRate: string
  payment: string
  additionalPayment: string
  targetYears: string
  targetMonths: string
  compoundingFrequency: CompoundingFrequency
}

export interface DebtPayoffValidation {
  // Parsed values, reused by the component for both calculation and display.
  debtAmountNum: number
  interestRateNum: number
  paymentNum: number
  additionalPaymentNum: number
  targetYearsNum: number
  targetMonthsNum: number
  totalTargetMonths: number
  periodicRate: number
  periodsPerYear: number
  totalPaymentNum: number

  // Messages to render under each field ("" when there is nothing to show).
  debtAmountError: string
  interestRateError: string
  paymentError: string
  additionalPaymentError: string
  targetYearsError: string
  targetMonthsError: string
  targetTimeError: string
  paymentWarning: string

  // Aggregate gates for the results panel.
  paymentTooLow: boolean
  payoffBlocked: boolean
  requiredPaymentBlocked: boolean
}

export function validateDebtPayoffInputs(input: ValidationInput): DebtPayoffValidation {
  const debtAmountRaw = normalizeRaw(input.debtAmount)
  const debtAmountNum = parseNum(input.debtAmount)
  const debtAmountError =
    debtAmountRaw === ""
      ? MSG_DEBT_AMOUNT_EMPTY
      : isOutOfRange(debtAmountRaw, debtAmountNum, CONSTRAINTS.debtAmount)
        ? MSG_DEBT_AMOUNT_RANGE
        : ""

  const interestRateRaw = normalizeRaw(input.interestRate)
  const interestRateNum = parseNum(input.interestRate)
  const interestRateError =
    interestRateRaw === ""
      ? MSG_RATE_EMPTY
      : isOutOfRange(interestRateRaw, interestRateNum, CONSTRAINTS.annualRate)
        ? MSG_RATE_RANGE
        : ""

  const paymentRaw = normalizeRaw(input.payment)
  const paymentNum = parseNum(input.payment)
  const paymentError =
    paymentRaw === ""
      ? MSG_PAYMENT_EMPTY
      : isOutOfRange(paymentRaw, paymentNum, CONSTRAINTS.payment)
        ? MSG_PAYMENT_RANGE
        : ""

  // Additional payment is optional — blank is never an error, only an
  // out-of-range value (when present) is.
  const additionalPaymentRaw = normalizeRaw(input.additionalPayment)
  const additionalPaymentNum = parseNum(input.additionalPayment)
  const additionalPaymentError =
    additionalPaymentRaw !== "" &&
    isOutOfRange(additionalPaymentRaw, additionalPaymentNum, CONSTRAINTS.additionalPayment)
      ? MSG_ADDITIONAL_PAYMENT_RANGE
      : ""

  const targetYearsRaw = normalizeRaw(input.targetYears)
  const targetYearsNum = targetYearsRaw === "" ? 0 : parseNum(input.targetYears)
  const targetYearsError =
    targetYearsRaw !== "" && isOutOfRange(targetYearsRaw, targetYearsNum, CONSTRAINTS.targetYears)
      ? MSG_YEARS_RANGE
      : ""

  const targetMonthsRaw = normalizeRaw(input.targetMonths)
  const targetMonthsNum = targetMonthsRaw === "" ? 0 : parseNum(input.targetMonths)
  const targetMonthsError =
    targetMonthsRaw !== "" &&
    isOutOfRange(targetMonthsRaw, targetMonthsNum, CONSTRAINTS.targetMonths)
      ? MSG_MONTHS_RANGE
      : ""

  const totalTargetMonths = targetYearsNum * 12 + targetMonthsNum
  const targetTimeError =
    !targetYearsError && !targetMonthsError && totalTargetMonths <= 0 ? MSG_TARGET_TIME_EMPTY : ""

  // Payment-too-low warning (Tab 1 only): only evaluated once the fields it
  // depends on are individually valid, so it never fires alongside an
  // unrelated field's own error message.
  const periodsPerYear = getCompoundingPeriodsPerYear(input.compoundingFrequency)
  const periodicRate = interestRateNum / 100 / periodsPerYear
  const totalPaymentNum = paymentNum + additionalPaymentNum
  const paymentInputsValid = !debtAmountError && !interestRateError && !paymentError && !additionalPaymentError
  const paymentTooLow = paymentInputsValid && totalPaymentNum <= debtAmountNum * periodicRate
  const paymentWarning = paymentTooLow ? MSG_PAYMENT_TOO_LOW : ""

  const payoffBlocked =
    !!debtAmountError || !!interestRateError || !!paymentError || !!additionalPaymentError || paymentTooLow
  const requiredPaymentBlocked =
    !!debtAmountError || !!interestRateError || !!targetYearsError || !!targetMonthsError || !!targetTimeError

  return {
    debtAmountNum,
    interestRateNum,
    paymentNum,
    additionalPaymentNum,
    targetYearsNum,
    targetMonthsNum,
    totalTargetMonths,
    periodicRate,
    periodsPerYear,
    totalPaymentNum,

    debtAmountError,
    interestRateError,
    paymentError,
    additionalPaymentError,
    targetYearsError,
    targetMonthsError,
    targetTimeError,
    paymentWarning,

    paymentTooLow,
    payoffBlocked,
    requiredPaymentBlocked,
  }
}
