"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/app/ui/components/card"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { Button } from "@/app/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/components/select"
import { Info, ChevronDown, ChevronUp } from "lucide-react"
import ThemeToggle from "@/app/lib/theme-toggle"
import { FaPlus, FaMinus } from "react-icons/fa6"


type SolveFor = "FV" | "PV" | "PMT" | "RATE" | "NPER"
type PaymentTiming = "end" | "beginning"
type PaymentFrequencyMode = "same" | "different"

const FREQUENCY_OPTIONS = [
  { value: "1", label: "Annually", perYear: 1, singular: "year" },
  { value: "2", label: "Semi-annually", perYear: 2, singular: "semi-annual period" },
  { value: "4", label: "Quarterly", perYear: 4, singular: "quarter" },
  { value: "12", label: "Monthly", perYear: 12, singular: "month" },
  { value: "26", label: "Bi-weekly", perYear: 26, singular: "bi-weekly period" },
  { value: "52", label: "Weekly", perYear: 52, singular: "week" },
  { value: "365", label: "Daily", perYear: 365, singular: "day" },
]

const SOLVE_OPTIONS: { value: SolveFor; label: string; description: string }[] = [
  { value: "FV", label: "Future value", description: "Calculate the value at the end of the time period." },
  { value: "PV", label: "Present value", description: "Calculate the current value needed." },
  { value: "PMT", label: "Payment", description: "Calculate the periodic payment amount." },
  { value: "RATE", label: "Interest rate", description: "Calculate the annual interest rate." },
  { value: "NPER", label: "Periods", description: "Calculate the number of periods required." },
]

const CONSTRAINTS = {
  presentValue: { min: -1_000_000_000, max: 1_000_000_000 },
  futureValue: { min: -1_000_000_000, max: 1_000_000_000 },
  payment: { min: -1_000_000, max: 1_000_000 },
  annualRate: { min: -100, max: 100 },
  periods: { min: 0, max: 12000 },
}

interface FieldError {
  field: string
  message: string
}

export function TVMCalculator() {
  const [presentValue, setPresentValue] = useState<string>("")
  const [futureValue, setFutureValue] = useState<string>("")
  const [payment, setPayment] = useState<string>("")
  const [annualRate, setAnnualRate] = useState<string>("")
  const [periods, setPeriods] = useState<string>("")
  const [compoundingFrequency, setCompoundingFrequency] = useState<string>("12")
  const [paymentFrequencyMode, setPaymentFrequencyMode] = useState<PaymentFrequencyMode>("same")
  const [paymentFrequency, setPaymentFrequency] = useState<string>("12")
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("end")
  const [solveFor, setSolveFor] = useState<SolveFor>("FV")
  const [result, setResult] = useState<number | null>(null)
  const [calcError, setCalcError] = useState<string>("")
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([])
  const [signError, setSignError] = useState<string>("")
  const [showHowToUse, setShowHowToUse] = useState<boolean>(false)
  const [exampleMode, setExampleMode] = useState<"saving" | "borrowing">("saving")

  const loadExample = (example: {
    solveFor: SolveFor
    pv?: string; fv?: string; pmt?: string; rate?: string
    periods?: string; compoundFreq?: string; paymentFreq?: string
    paymentFreqMode?: PaymentFrequencyMode
  }) => {
    setSolveFor(example.solveFor)
    if (example.pv !== undefined) setPresentValue(formatWithCommas(example.pv))
    if (example.fv !== undefined) setFutureValue(formatWithCommas(example.fv))
    if (example.pmt !== undefined) setPayment(formatWithCommas(example.pmt))
    if (example.rate !== undefined) setAnnualRate(example.rate)
    if (example.periods !== undefined) setPeriods(example.periods)
    if (example.compoundFreq !== undefined) setCompoundingFrequency(example.compoundFreq)
    if (example.paymentFreq !== undefined) setPaymentFrequency(example.paymentFreq)
    if (example.paymentFreqMode !== undefined) setPaymentFrequencyMode(example.paymentFreqMode)
  }

  const effectivePaymentFrequency = useMemo(() => {
    return paymentFrequencyMode === "same" ? compoundingFrequency : paymentFrequency
  }, [paymentFrequencyMode, compoundingFrequency, paymentFrequency])

  const getPeriodUnitLabel = useCallback((): string => {
    const freq = effectivePaymentFrequency
    const option = FREQUENCY_OPTIONS.find(o => o.value === freq)
    if (!option) return "periods"
    switch (option.value) {
      case "1": return "years"
      case "2": return "semi-annual periods"
      case "4": return "quarters"
      case "12": return "months"
      case "26": return "bi-weekly periods"
      case "52": return "weeks"
      case "365": return "days"
      default: return "periods"
    }
  }, [effectivePaymentFrequency])

  const getPaymentPeriodLabel = useCallback((): string => {
    const option = FREQUENCY_OPTIONS.find(o => o.value === effectivePaymentFrequency)
    return option ? option.singular : "period"
  }, [effectivePaymentFrequency])

  const validateInputs = useCallback((): FieldError[] => {
    const errors: FieldError[] = []
    const rawPv = presentValue.replace(/,/g, "")
    const rawFv = futureValue.replace(/,/g, "")
    const rawPmt = payment.replace(/,/g, "")
    const rawRate = annualRate.replace(/,/g, "")
    const rawPeriods = periods.replace(/,/g, "")

    if (solveFor !== "PV" && rawPv !== "" && rawPv !== "-") {
      const pv = parseFloat(rawPv)
      if (pv < CONSTRAINTS.presentValue.min || pv > CONSTRAINTS.presentValue.max)
        errors.push({ field: "presentValue", message: `Must be between $${CONSTRAINTS.presentValue.min.toLocaleString()} and $${CONSTRAINTS.presentValue.max.toLocaleString()}` })
    }
    if (solveFor !== "FV" && rawFv !== "" && rawFv !== "-") {
      const fv = parseFloat(rawFv)
      if (fv < CONSTRAINTS.futureValue.min || fv > CONSTRAINTS.futureValue.max)
        errors.push({ field: "futureValue", message: `Must be between $${CONSTRAINTS.futureValue.min.toLocaleString()} and $${CONSTRAINTS.futureValue.max.toLocaleString()}` })
    }
    if (solveFor !== "PMT" && rawPmt !== "" && rawPmt !== "-") {
      const pmt = parseFloat(rawPmt)
      if (pmt < CONSTRAINTS.payment.min || pmt > CONSTRAINTS.payment.max)
        errors.push({ field: "payment", message: `Must be between $${CONSTRAINTS.payment.min.toLocaleString()} and $${CONSTRAINTS.payment.max.toLocaleString()}` })
    }
    if (solveFor !== "RATE" && rawRate !== "" && rawRate !== "-") {
      const rate = parseFloat(rawRate)
      if (rate < CONSTRAINTS.annualRate.min || rate > CONSTRAINTS.annualRate.max)
        errors.push({ field: "annualRate", message: `Must be between ${CONSTRAINTS.annualRate.min}% and ${CONSTRAINTS.annualRate.max}%` })
    }
    if (solveFor !== "NPER" && rawPeriods !== "") {
      const n = parseFloat(rawPeriods)
      if (n < CONSTRAINTS.periods.min || n > CONSTRAINTS.periods.max)
        errors.push({ field: "periods", message: `Must be between ${CONSTRAINTS.periods.min} and ${CONSTRAINTS.periods.max} periods` })
    }
    return errors
  }, [presentValue, futureValue, payment, annualRate, periods, solveFor])

  const getFieldError = (field: string): string | undefined =>
    fieldErrors.find(e => e.field === field)?.message

  const displayError = calcError || signError

  const calculate = useCallback(() => {
    setCalcError("")
    setSignError("")
    
    // ── Don't calculate (or show errors) until all required fields are filled ──
  const requiredFields: Record<SolveFor, string[]> = {
    FV: [presentValue, annualRate, periods],
    PV: [futureValue, annualRate, periods],
    PMT: [presentValue, futureValue, annualRate, periods],
    RATE: [presentValue, futureValue, periods],
    NPER: [presentValue, futureValue, annualRate],
  };
  const allFilled = requiredFields[solveFor].every((f) => f.trim() !== "");
  if (!allFilled) {
    setResult(null);
    setFieldErrors([]);
    return;
  }

    const errors = validateInputs()
    setFieldErrors(errors)
    if (errors.length > 0) { setResult(null); return }

    const pv = parseFloat(presentValue.replace(/,/g, "")) || 0
    const fv = parseFloat(futureValue.replace(/,/g, "")) || 0
    const pmt = parseFloat(payment.replace(/,/g, "")) || 0
    const rate = (parseFloat(annualRate.replace(/,/g, "")) || 0) / 100
    const compFreq = parseFloat(compoundingFrequency) || 1
    const pmtFreq = parseFloat(effectivePaymentFrequency) || 1
    const n = parseFloat(periods) || 0

    let ratePerPeriod: number
    if (paymentFrequencyMode === "different" && compFreq !== pmtFreq) {
      ratePerPeriod = Math.pow(1 + rate / compFreq, compFreq / pmtFreq) - 1
    } else {
      ratePerPeriod = rate / compFreq
    }

    const timingMultiplier = paymentTiming === "beginning" ? (1 + ratePerPeriod) : 1

    try {
      // Require opposite signs for RATE/NPER solves: at least one cash flow must have opposite sign
      if ((solveFor === "RATE" || solveFor === "NPER")) {
        const allPositive = pv > 0 && pmt > 0 && fv > 0
        const allNegative = pv < 0 && pmt < 0 && fv < 0
        if (allPositive || allNegative) {
          const which = solveFor === "RATE" ? "rate" : "number of periods"
          setSignError(
            `These values can't be solved. To find the ${which}, money paid out and money received need opposite signs — for example, enter what you invest as negative and what you receive as positive.`
          )
          setResult(null)
          return
        }
      }
      let calculatedValue: number

      switch (solveFor) {
        case "FV": {
          if (ratePerPeriod === 0) {
            calculatedValue = -(pv + pmt * n)
          } else {
            const compoundFactor = Math.pow(1 + ratePerPeriod, n)
            calculatedValue = -(pv * compoundFactor + pmt * ((compoundFactor - 1) / ratePerPeriod) * timingMultiplier)
          }
          break
        }
        case "PV": {
          if (ratePerPeriod === 0) {
            calculatedValue = -(fv - pmt * n)
          } else {
            const compoundFactor = Math.pow(1 + ratePerPeriod, n)
            calculatedValue = -(fv / compoundFactor + pmt * ((compoundFactor - 1) / (ratePerPeriod * compoundFactor)) * timingMultiplier)
          }
          break
        }
        case "PMT": {
          if (ratePerPeriod === 0) {
            if (n === 0 && periods === "0") throw new Error("Number of periods must be greater than 0")
            calculatedValue = n === 0 ? 0 : -(fv + pv) / n
          } else {
            const compoundFactor = Math.pow(1 + ratePerPeriod, n)
            calculatedValue = -(pv * compoundFactor + fv) / (((compoundFactor - 1) / ratePerPeriod) * timingMultiplier)
          }
          break
        }
        case "RATE": {
          if (n <= 0 && periods === "0") throw new Error("Number of periods must be greater than 0")
          if (n <= 0) { calculatedValue = 0; break }
          if (pmt === 0) {
            if (pv === 0) throw new Error("Present value cannot be 0 when payment is 0")
            const ratio = -fv / pv
            if (ratio <= 0) {
              if (fv === 0 && pv !== 0) { calculatedValue = -100; break }
              throw new Error("Cannot find a valid interest rate for these inputs")
            }
            const ratePerPeriodCalc = Math.pow(ratio, 1 / n) - 1
            calculatedValue = paymentFrequencyMode === "different" && compFreq !== pmtFreq
              ? (Math.pow(1 + ratePerPeriodCalc, pmtFreq) - 1) * 100
              : ratePerPeriodCalc * compFreq * 100
            break
          }
          let guess = 0.1 / compFreq
          let calculatedRate: number | null = null
          for (let i = 0; i < 100; i++) {
            const currentTiming = paymentTiming === "beginning" ? (1 + guess) : 1
            const cf = Math.pow(1 + guess, n)
            const eq = guess === 0 ? pv + pmt * n + fv : pv * cf + pmt * ((cf - 1) / guess) * currentTiming + fv
            if (Math.abs(eq) < 0.0001) {
              calculatedRate = paymentFrequencyMode === "different" && compFreq !== pmtFreq
                ? (Math.pow(1 + guess, pmtFreq) - 1) * 100
                : guess * compFreq * 100
              break
            }
            const delta = 0.0001
            const nextTiming = paymentTiming === "beginning" ? (1 + guess + delta) : 1
            const cfD = Math.pow(1 + guess + delta, n)
            const eqD = (guess + delta) === 0 ? pv + pmt * n + fv : pv * cfD + pmt * ((cfD - 1) / (guess + delta)) * nextTiming + fv
            const derivative = (eqD - eq) / delta
            if (Math.abs(derivative) < 0.0000001) throw new Error("Cannot converge to a solution")
            guess = guess - eq / derivative
            if (i === 99) throw new Error("Could not find a solution for rate")
          }
          if (calculatedRate === null) throw new Error("Could not find a solution for rate")
          calculatedValue = calculatedRate
          break
        }
        case "NPER": {
          if (ratePerPeriod === 0) {
            if (pmt === 0 && payment === "0") throw new Error("Payment cannot be 0 when rate is 0")
            const calculatedNper = pmt === 0 ? 0 : -(pv + fv) / pmt
            if (!isFinite(calculatedNper) || calculatedNper <= 0) {
              throw new Error("These payments are too small to reach this future value. Try a larger payment, a higher rate, or a lower target.")
            }
            calculatedValue = calculatedNper
          } else {
            const pmtAdj = pmt * timingMultiplier
            const numerator = pmtAdj - fv * ratePerPeriod
            const denominator = pmtAdj + pv * ratePerPeriod
            const ratio = numerator / denominator
            if (ratio <= 0) {
              throw new Error("These payments are too small to reach this future value. Try a larger payment, a higher rate, or a lower target.")
            }
            const calculatedNper = Math.log(ratio) / Math.log(1 + ratePerPeriod)
            if (!isFinite(calculatedNper) || calculatedNper <= 0) {
              throw new Error("These payments are too small to reach this future value. Try a larger payment, a higher rate, or a lower target.")
            }
            calculatedValue = calculatedNper
          }
          break
        }
        default:
          throw new Error("Invalid calculation type")
      }

      if (!isFinite(calculatedValue) || isNaN(calculatedValue))
        throw new Error("Invalid result. Please check your inputs.")

      setResult(calculatedValue)
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "Calculation error")
      setResult(null)
    }
  }, [presentValue, futureValue, payment, annualRate, periods, compoundingFrequency, effectivePaymentFrequency, paymentFrequencyMode, paymentTiming, solveFor, validateInputs])

  useEffect(() => { calculate() }, [calculate])

  const clearAll = () => {
    setPresentValue(""); setFutureValue(""); setPayment("")
    setAnnualRate(""); setPeriods("")
    setCompoundingFrequency("12"); setPaymentFrequencyMode("same")
    setPaymentFrequency("12"); setPaymentTiming("end")
    setResult(null); setCalcError(""); setFieldErrors([])
  }

  const formatCurrency = (value: number): string => {
    const isNegative = value < 0
    return (isNegative ? "-" : "") + new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(Math.abs(value))
  }

  const formatNumber = (value: number, decimals = 4): string =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)

  const formatResult = (value: number): string => {
    switch (solveFor) {
      case "RATE": return `${formatNumber(value, 2)}%`
      case "NPER": return `${formatNumber(value, 2)} ${getPeriodUnitLabel()}`
      case "PMT": return `${formatCurrency(value)} per ${getPaymentPeriodLabel()}`
      default: return formatCurrency(value)
    }
  }

  const formatWithCommas = (value: string): string => {
    const rawValue = value.replace(/,/g, "")
    if (rawValue === "" || rawValue === "-" || rawValue === "." || rawValue === "-.") return rawValue
    const parts = rawValue.split(".")
    const isNegative = parts[0].startsWith("-")
    const absInteger = isNegative ? parts[0].slice(1) : parts[0]
    const formatted = absInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    const signed = isNegative ? "-" + formatted : formatted
    return parts.length > 1 ? signed + "." + parts[1] : signed
  }

  const handleInputChange = (value: string, setter: (val: string) => void) => {
    const rawValue = value.replace(/,/g, "")
    if (rawValue === "" || rawValue === "-" || rawValue === "." || rawValue === "-.") { setter(rawValue); return }
    if (/^-?\d*\.?\d*$/.test(rawValue)) setter(formatWithCommas(rawValue))
  }

  const handleInputBlur = (value: string, setter: (val: string) => void) => {
    const rawValue = value.replace(/,/g, "")
    if (rawValue.startsWith(".")) setter(formatWithCommas("0" + rawValue))
    else if (rawValue.startsWith("-.")) setter(formatWithCommas("-0" + rawValue.slice(1)))
  }

  const currentOption = SOLVE_OPTIONS.find(o => o.value === solveFor)

  const getExample = () => {
    if (exampleMode === "saving") {
      switch (solveFor) {
        case "FV":
          return {
            title: "Future Value Example: Solve for a future savings balance",
            bullets: [
              "Present value (initial deposit): negative",
              "Payment per period (ongoing deposits): negative",
              "Future value (account balance at the end): positive",
            ],
            example: {
              solveFor: "FV" as SolveFor,
              pv: "-10000",
              pmt: "-5000",
              rate: "8",
              periods: "40",
              compoundFreq: "1",
              paymentFreq: "1",
            },
          };
        case "PV":
          return {
            title:
              "Present Value Example: Solve for the initial deposit needed to reach a savings goal",
            bullets: [
              "Payment per period (ongoing deposits): negative",
              "Future value (target savings goal): positive",
              "Present value (initial deposit needed): negative",
            ],
            example: {
              solveFor: "PV" as SolveFor,
              pmt: "-250",
              fv: "20000",
              rate: "4",
              periods: "36",
              compoundFreq: "12",
              paymentFreq: "12",
            },
          };
        case "PMT":
          return {
            title:
              "Payment Example: Solve for the required savings contribution to reach a savings goal",
            bullets: [
              "Present value (initial deposit): negative",
              "Future value (target savings goal): positive",
              "Payment per period (required contribution): negative",
            ],
            example: {
              solveFor: "PMT" as SolveFor,
              pv: "-50000",
              fv: "1000000",
              rate: "7",
              periods: "30",
              compoundFreq: "1",
              paymentFreq: "1",
            },
          };
        case "RATE":
          return {
            title: "Interest Rate Example: Solve for the interest rate earned",
            bullets: [
              "Present value (initial deposit): negative",
              "Payment per period (ongoing deposits): negative",
              "Future value (ending balance): positive",
            ],
            example: {
              solveFor: "RATE" as SolveFor,
              pv: "-10000",
              pmt: "-2000",
              fv: "150000",
              periods: "30",
              compoundFreq: "1",
              paymentFreq: "1",
            },
          };
        case "NPER":
          return {
            title:
              "Number of Periods Example: Solve for time to reach savings goal",
            bullets: [
              "Present value (initial deposit): negative",
              "Payment per period (ongoing deposits): negative",
              "Future value (target savings goal): positive",
            ],
            example: {
              solveFor: "NPER" as SolveFor,
              pv: "-5000",
              pmt: "-300",
              fv: "30000",
              rate: "3.5",
              compoundFreq: "12",
              paymentFreqMode: "different" as PaymentFrequencyMode,
              paymentFreq: "26",
            },
          };
      }
    } else {
      switch (solveFor) {
        case "FV":
          return {
            title: "Future Value Example: Solve for remaining loan balance",
            bullets: [
              "Present value (loan amount received): positive",
              "Payment per period (loan payments): negative",
              "Future value (remaining balance): negative or zero",
            ],
            example: {
              solveFor: "FV" as SolveFor,
              pv: "250000",
              pmt: "-1500",
              rate: "6.5",
              periods: "120",
              compoundFreq: "12",
              paymentFreq: "12",
            },
          };
        case "PV":
          return {
            title:
              "Present Value Example: Solve for the loan amount you can afford",
            bullets: [
              "Payment per period (loan payments): negative",
              "Future value (remaining balance): zero",
              "Present value (loan amount): positive",
            ],
            example: {
              solveFor: "PV" as SolveFor,
              pmt: "-400",
              fv: "0",
              rate: "6.5",
              periods: "60",
              compoundFreq: "12",
              paymentFreq: "12",
            },
          };
        case "PMT":
          return {
            title: "Payment Example: Solve for the loan payment amount",
            bullets: [
              "Present value (loan amount): positive",
              "Future value (remaining balance): zero",
              "Payment per period (required payment): negative",
            ],
            example: {
              solveFor: "PMT" as SolveFor,
              pv: "400000",
              fv: "0",
              rate: "6",
              periods: "360",
              compoundFreq: "12",
              paymentFreq: "12",
            },
          };
        case "RATE":
          return {
            title: "Interest Rate Example: Solve for the loan interest rate",
            bullets: [
              "Present value (loan amount): positive",
              "Payment per period (loan payments): negative",
              "Future value (remaining balance): zero",
            ],
            example: {
              solveFor: "RATE" as SolveFor,
              pv: "25000",
              pmt: "-500",
              fv: "0",
              periods: "60",
              compoundFreq: "12",
              paymentFreq: "12",
            },
          };
        case "NPER":
          return {
            title:
              "Number of Periods Example: Solve for time to pay off credit card",
            bullets: [
              "Present value (credit card balance): positive",
              "Payment per period (bi-weekly payments): negative",
              "Future value (remaining balance): zero",
            ],
            example: {
              solveFor: "NPER" as SolveFor,
              pv: "4000",
              pmt: "-250",
              fv: "0",
              rate: "18",
              compoundFreq: "365",
              paymentFreq: "26",
              paymentFreqMode: "different" as PaymentFrequencyMode,
            },
          };
      }
    }
  }

  const HowToUseInfoBox = () => {
    const currentExample = getExample()
    return (
      <div className="mb-6">
        <button
          onClick={() => setShowHowToUse(!showHowToUse)}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors text-left"
        >
          <Info className="w-5 h-5  flex-shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1">How to use this calculator</span>
          {showHowToUse ? <ChevronUp className="w-4 h-4 " /> : <ChevronDown className="w-4 h-4 " />}
        </button>
        {showHowToUse && (
          <div className="mt-2 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm  space-y-4">
            <div className="space-y-2">
              <p className="text-foreground font-bold">Cash Flow Signs</p>
              <p>This calculator uses signs to show the direction of money:</p>
              <div className="flex flex-row gap-2">
                <div className="text-foreground gap-4 flex flex-row justify-items-center items-center rounded-md border border-border px-3 py-2 max-w-1/2"><FaPlus /> <strong >Positive &mdash; money you receive (cash in)</strong></div>
                <div className="text-foreground gap-4 flex flex-row justify-items-center items-center rounded-md border border-border px-3 py-2 max-w-1/2"><FaMinus /> <strong >Negative &mdash; money you pay (cash out)</strong></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center text-sm gap-3">
                  <span className="mr-1">Example — I am:</span>
                  <div className="inline-flex overflow-hidden rounded-md border border-border">
                    {(["saving", "borrowing"] as const).map((mode, index) => (
                      <button
                        key={mode}
                        onClick={(e) => {
                          e.stopPropagation()
                          setExampleMode(mode)
                          setPresentValue(""); setFutureValue(""); setPayment(""); setAnnualRate(""); setPeriods("")
                        }}
                        className={`px-3 py-1 text-sm font-medium transition-colors ${
                          exampleMode === mode
                            ? "hover:text-white hover:bg-[var(--color-lagunita)] bg-[var(--card-background)]"
                            : "hover:text-white hover:bg-[var(--color-lagunita)] text-foreground"
                        } ${index > 0 ? "border-l border-border" : ""}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                {currentExample && (
                    <div className="mt-2 p-4 rounded-lg bg-muted/30 border border-border/50 text-sm ">
                      <p className="text-foreground font-bold">{currentExample.title}</p>
                      <ul className="space-y-1 ml-4 list-disc">
                        {currentExample.bullets.map((bullet, idx) => <li key={idx}>{bullet}</li>)}
                      </ul>
                      <button
                        onClick={(e) => { e.stopPropagation(); loadExample(currentExample.example) }}
                        className="hover:underline text-sm text-[var(--color-teal)] transition-colors mt-2"
                      >
                        See numeric example
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="sr-only">Time Value of Money Calculator</h1>
        <ThemeToggle />

        {/* Solve-for tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {SOLVE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  if (option.value !== solveFor) {
                    setPresentValue(""); setFutureValue(""); setPayment(""); setAnnualRate(""); setPeriods("")
                    setPaymentFrequencyMode("same")
                  }
                  setSolveFor(option.value)
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors border ${
                  solveFor === option.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent  border-border hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* How to use */}
        <HowToUseInfoBox />

        <div className="flex flex-col md:flex-row gap-8">
          {/* Input Fields */}
          <section aria-label="Calculator inputs" className="space-y-5 mb-25 m:mb-0 w-full lg:w-1/2">

            {/* Present Value */}
            {solveFor !== "PV" && (
              <div className="space-y-2">
                <Label htmlFor="pv" className="block font-semibold text-foreground mb-2">Present value</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input id="pv" type="text" inputMode="decimal" value={presentValue}
                    onChange={(e) => handleInputChange(e.target.value, setPresentValue)}
                    onBlur={(e) => handleInputBlur(e.target.value, setPresentValue)}
                    className={`border-border pl-7 bg-card ${getFieldError("presentValue") ? "border-destructive" : ""}`} />
                </div>
                {getFieldError("presentValue") && <p className="text-sm text-[var(--color-inline-error)]">{getFieldError("presentValue")}</p>}
              </div>
            )}

            {/* Payment (early position for RATE/NPER) */}
            {(solveFor === "RATE" || solveFor === "NPER") && (
              <div className="space-y-2">
                <Label htmlFor="pmt" className="block font-semibold text-foreground mb-2">Payment per period</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input id="pmt" type="text" inputMode="decimal" value={payment}
                    onChange={(e) => handleInputChange(e.target.value, setPayment)}
                    onBlur={(e) => handleInputBlur(e.target.value, setPayment)}
                    className={`border-border pl-7 bg-card ${getFieldError("payment") ? "border-destructive" : ""}`} />
                </div>
                {getFieldError("payment") && <p className="text-sm text-[var(--color-inline-error)]">{getFieldError("payment")}</p>}
              </div>
            )}

            {/* Future Value */}
            {solveFor !== "FV" && (
              <div className="space-y-2">
                <Label htmlFor="fv" className="block font-semibold text-foreground mb-2">Future value</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input id="fv" type="text" inputMode="decimal" value={futureValue}
                    onChange={(e) => handleInputChange(e.target.value, setFutureValue)}
                    onBlur={(e) => handleInputBlur(e.target.value, setFutureValue)}
                    className={`border-border pl-7 bg-card ${getFieldError("futureValue") ? "border-destructive" : ""}`} />
                </div>
                {getFieldError("futureValue") && <p className="text-sm text-[var(--color-inline-error)]">{getFieldError("futureValue")}</p>}
              </div>
            )}

            {/* Payment (normal position) */}
            {solveFor !== "PMT" && solveFor !== "RATE" && solveFor !== "NPER" && (
              <div className="space-y-2">
                <Label htmlFor="pmt" className="block font-semibold text-foreground mb-2">Payment per period</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input id="pmt" type="text" inputMode="decimal" value={payment}
                    onChange={(e) => handleInputChange(e.target.value, setPayment)}
                    onBlur={(e) => handleInputBlur(e.target.value, setPayment)}
                    className={`border-border pl-7 bg-card ${getFieldError("payment") ? "border-destructive" : ""}`} />
                </div>
                {getFieldError("payment") && <p className="text-sm text-[var(--color-inline-error)]">{getFieldError("payment")}</p>}
              </div>
            )}

            {/* Annual Rate */}
            {solveFor !== "RATE" && (
              <div className="space-y-2">
                <Label htmlFor="rate" className="block font-semibold text-foreground mb-2">Annual interest rate</Label>
                <div className="relative">
                  <Input id="rate" type="text" inputMode="decimal" value={annualRate}
                    onChange={(e) => handleInputChange(e.target.value, setAnnualRate)}
                    onBlur={(e) => handleInputBlur(e.target.value, setAnnualRate)}
                    className={`border-border pr-8 bg-card ${getFieldError("annualRate") ? "border-destructive" : ""}`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">%</span>
                </div>
                {getFieldError("annualRate") && <p className="text-sm text-[var(--color-inline-error)]">{getFieldError("annualRate")}</p>}
              </div>
            )}

            {/* Number of Periods */}
            {solveFor !== "NPER" && (
              <div className="space-y-2">
                <Label htmlFor="periods" className="block font-semibold text-foreground mb-2">Number of periods</Label>
                <Input id="periods" type="text" inputMode="numeric" value={periods}
                  onChange={(e) => { const val = e.target.value; if (val === "" || /^\d*$/.test(val)) setPeriods(val) }}
                  className={`border-border bg-card ${getFieldError("periods") ? "border-destructive" : ""}`} />
                {getFieldError("periods") && <p className="text-sm text-[var(--color-inline-error)]">{getFieldError("periods")}</p>}
              </div>
            )}

            {/* Compounding Frequency */}
            <div className="space-y-2">
              <Label htmlFor="compounding" className="block font-semibold text-foreground mb-2">Compounding frequency</Label>
              <Select value={compoundingFrequency} onValueChange={setCompoundingFrequency}>
                <SelectTrigger id="compounding" className="border-border bg-card">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Frequency */}
            <div className="space-y-3">
              <Label className="block font-semibold text-foreground mb-2">Payments occur</Label>
              <div className="flex items-center gap-4">
                {(["same", "different"] as const).map(mode => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="paymentFrequencyMode" value={mode}
                      checked={paymentFrequencyMode === mode}
                      onChange={() => setPaymentFrequencyMode(mode)}
                      className="w-4 h-4 text-primary border-border focus:ring-primary" />
                    <span className="text-sm text-foreground">
                      {mode === "same" ? "Same as compounding" : "Different"}
                    </span>
                  </label>
                ))}
              </div>
              {paymentFrequencyMode === "different" && (
                <div className="pt-2">
                  <Label htmlFor="paymentFreq" className="text-sm font-medium text-foreground">Payment frequency</Label>
                  <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                    <SelectTrigger id="paymentFreq" className="border-border bg-card mt-2">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Payment Timing */}
            <div className="space-y-2">
              <Label className="block font-semibold text-foreground mb-2">Payment timing</Label>
              <div className="flex rounded-md border border-border overflow-hidden w-fit">
                {(["end", "beginning"] as const).map((timing, i) => (
                  <button key={timing} type="button" onClick={() => setPaymentTiming(timing)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${i > 0 ? "border-l border-border" : ""} ${
                      paymentTiming === timing
                        ? "bg-primary text-primary-foreground"
                        : "bg-card  hover:text-foreground"
                    }`}
                  >
                    {timing.charAt(0).toUpperCase() + timing.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-sm">
                {paymentTiming === "end" ? "Payment made at the end of the period" : "Payment made at the beginning of the period"}
              </p>
            </div>

            <div className="pt-2">
              <Button onClick={clearAll} variant="lagunita" className="hidden md:block font-medium px-8">Reset</Button>
            </div>
          </section>

          {/* Results Card */}
          <Card className="w-full hidden md:block lg:w-1/2">
            <CardContent className="w-full  bg-[var(--card-background)] rounded-3xl p-[32px]">
              <h2 className="text-[20px] font-bold mb-1">{currentOption?.label}</h2>
              {displayError ? (
                <p className="text-[var(--color-inline-error)]">{displayError}</p>
              ) : result !== null ? (
                <p className="text-3xl/normal font-bold text-[var(--color-teal)] mb-5 overflow-auto">{formatResult(result)}</p>
              ) : (
                <p className="text-2xl sm:text-3xl font-medium /50">—</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile sticky footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-8 shadow-lg">
          <div className="flex flex-col items-center justify-between">
              <div className="text-sm">{currentOption?.label}</div>
              {displayError ? (
                <p className="text-[var(--color-inline-error)] font-medium">{displayError}</p>
              ) : result !== null ? (
                <p className="text-2xl font-bold text-primary">{formatResult(result)}</p>
              ) : (
                <p className="text-xl font-medium mb-2">Enter values above</p>
              )}
            <Button onClick={clearAll} variant="lagunita" size="sm">Reset</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TVMCalculator