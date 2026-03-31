"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";
import { FaAngleDown } from "react-icons/fa";
import ThemeToggle from "@/app/lib/theme-toggle";
import InfoPopover from "@/app/ui/components/popover";

type CompoundingFrequency = "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "semi-annually" | "annually"

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
  const [additionalPayment, setAdditionalPayment] = useState<number | "">(0)
  const [targetYears, setTargetYears] = useState(10)
  const [targetMonths, setTargetMonths] = useState(11)

  const getCompoundingPeriodsPerYear = (frequency: CompoundingFrequency): number => {
    switch (frequency) {
      case "daily":
        return 365
      case "weekly":
        return 52
      case "bi-weekly":
        return 26
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
    const addlPayment = typeof additionalPayment === "number" ? additionalPayment : 0
    const totalPayment = payment + addlPayment

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
    if (addlPayment > 0) {
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
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        {/* Header */}
        <h1 className="sr-only">Debt Payoff Calculator</h1>
        {/* Mode Selection */}
        <div className="mb-8">

        <Tabs defaultValue="time" className="w-full">
          <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-2 mb-6">
            <TabsTrigger value="time">Calculate Time to Pay Off Debt</TabsTrigger>
            <TabsTrigger value="payment">Calculate Required Payment</TabsTrigger>
          </TabsList>

          {/* Time to pay off tab. */}
          <TabsContent value="time">
            <>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="mb-6">
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="debt-amount" className="font-medium">Debt amount</Label>
                        <InfoPopover title="Debt amount">This is your total balance owed or what you would like to pay off.</InfoPopover>
                      </div>
                      <div className="relative">
                        <Input
                          id="debt-amount"
                          type="number"
                          min="1"
                          value={debtAmount === 0 ? "" : debtAmount}
                          onChange={(e) => setDebtAmount(Number(e.target.value) || 0)}
                          className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setDebtAmount((prev) => Math.max(0, prev + 1))}
                            className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setDebtAmount((prev) => Math.max(0, prev - 1))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="interest-rate" className="font-medium">Annual interest rate (%)</Label>
                        <InfoPopover title="Annual interest rate (%)">This is the annual percentage rate (APR) charged by your lender.</InfoPopover>
                      </div>
                      <div className="relative">
                        <Input
                          id="interest-rate"
                          type="number"
                          step="0.1"
                          value={interestRate === 0 ? "" : interestRate}
                          onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                          min="0.1"
                          className="relative font-bold block w-full text-lagunita rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setInterestRate((prev) => Math.max(0, parseFloat((prev + 0.1).toFixed(1))))}
                            className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setInterestRate((prev) => Math.max(0, parseFloat((prev - 0.1).toFixed(1))))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="compounding" className="font-medium">Compounding frequency</Label>
                        <InfoPopover title="Compounding frequency"> How often interest is applied and payments are made. Most loans compound monthly.</InfoPopover>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={compoundingFrequency}
                          onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
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
                        The compounding frequency is equal to your payment frequency. For example, in the monthly case, you
                        make 12 debt payments per year.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="payment" className="font-medium">Payment per compounding period</Label>
                        <InfoPopover title="Payment per compounding period">This is your frequency of payment and how often the interest is applied. For example, each month or each year.</InfoPopover>
                      </div>
                      <div className="relative">
                        <Input
                          id="payment"
                          type="number"
                          step="0.01"
                          value={payment === 0 ? "" : payment}
                          onChange={(e) => setPayment(Number(e.target.value) || 0)}
                          className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setPayment((prev) => Math.max(0, prev + 1))}
                            className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setPayment((prev) => Math.max(0, prev - 1))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-[var(--results-year-background)] border-1 border-grey-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-medium font-bold">Additional payment per period (optional)</Label>
                          <InfoPopover title="Additional payment per period (optional)">Enter a fixed extra amount you plan to pay each month.</InfoPopover>
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          id="addtlpayment"
                          type="number"
                          step="0.01"
                          min="0"
                          value={additionalPayment}
                          onChange={(e) => setAdditionalPayment(e.target.value === "" ? "" : Number(e.target.value))}
                          onBlur={(e) => setAdditionalPayment(e.target.value === "" ? 0 : Number(e.target.value))}
                          className="font-bold text-lagunita block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setAdditionalPayment((prev) => Math.max(0, (typeof prev === "number" ? prev : 0) + 1))}
                            className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setAdditionalPayment((prev) => Math.max(0, (typeof prev === "number" ? prev : 0) - 1))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm">
                        Each steady extra payment reduces your total interest.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <CardHeader>
                    <CardTitle className="text-[var(--text-navy)] text-[22px] text-center font-bold">Your payoff summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-lg mb-6 text-center">
                      <p className="text-medium font-semibold text-[var(--text-navy)] tracking-wide">Time to pay off</p>
                      <p className="text-3xl font-bold text-lagunita mb-2">{formatTime(payoffResult.timeInMonths)}</p>
                      <p className="text-medium font-semibold text-lagunita">Debt-free by {formatDate(payoffResult.payoffDate)}</p>
                    </div>

                    <div className="innerwrapper">
                      <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                        <div className="w-full sm:w-[50%] p-4 font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none text-white bg-navy">
                          Total interest:
                        </div>
                        <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                          {formatCurrency(payoffResult.totalInterest)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                        <div className="w-full sm:w-[50%] p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                          Total amount paid:
                        </div>
                        <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                          {formatCurrency(payoffResult.totalAmountPaid)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-lagunita-lighter">
                        <div className="w-full sm:w-[50%] p-4 bg-lagunita font-bold text-white rounded-lg sm:rounded-l-lg sm:rounded-r-none">
                          Interest saved:
                        </div>
                        <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-lagunita-lighter text-lagunita">
                          {formatCurrency(payoffResult.interestSaved)}
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-medium font-semibold pt-6 text-[var(--text-navy)]">
                      You&#39;re turning your loan into a plan. A little extra now means freedom sooner.
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
                        <Label htmlFor="debt-amount-2" className="font-medium">Debt amount</Label>
                        <InfoPopover title="Debt amount">This is your total balance owed or what you would like to pay off.</InfoPopover>
                      </div>
                      <div className="relative">
                        <Input
                          id="debt-amount-2"
                          type="number"
                          value={debtAmount === 0 ? "" : debtAmount}
                          onChange={(e) => setDebtAmount(Number(e.target.value) || 0)}
                          min="1"
                          className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setDebtAmount((prev) => Math.max(0, prev + 1))}
                            className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setDebtAmount((prev) => Math.max(0, prev - 1))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="interest-rate-2" className="font-medium">Annual interest rate (%)</Label>
                        <InfoPopover title="Annual interest rate (%)">This is the annual percentage rate (APR) charged by your lender.</InfoPopover>
                      </div>
                      <div className="relative">
                        <Input
                          id="interest-rate-2"
                          type="number"
                          step="0.1"
                          value={interestRate === 0 ? "" : interestRate}
                          onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                          min="0.1"
                          className="font-bold text-lagunita block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setInterestRate((prev) => Math.max(0, parseFloat((prev + 0.1).toFixed(1))))}
                            className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setInterestRate((prev) => Math.max(0, parseFloat((prev - 0.1).toFixed(1))))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="compounding-2" className="font-medium">Compounding frequency</Label>
                        <InfoPopover title="Compounding frequency">How often interest is applied and payments are made. Most loans compound monthly.</InfoPopover>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                        value={compoundingFrequency}
                        onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
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
                        The compounding frequency is equal to your payment frequency. For example, in the monthly case, you
                        make 12 debt payments per year.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">Target time to payoff</Label>
                        <InfoPopover title="Target time to payoff">How long do you want to take to pay off this debt?</InfoPopover>
                      </div>
                      <div className="flex flex-row gap-4 w-full">
                        <div className="flex flex-row w-1/2 gap-2 items-center">
                          <div className="relative grow">
                            <Input
                              id="target-years"
                              type="number"
                              min="0"
                              value={targetYears === 0 ? "" : targetYears}
                              onChange={(e) => setTargetYears(Number(e.target.value) || 0)}
                              className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                              <button
                                type="button"
                                tabIndex={-1}
                                aria-label="Increase amount"
                                onClick={() => setTargetYears((prev) => Math.max(0, prev + 1))}
                                className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                              >
                                <BiSolidUpArrow size={24} />
                              </button>
                              <button
                                type="button"
                                tabIndex={-1}
                                aria-label="Decrease amount"
                                onClick={() => setTargetYears((prev) => Math.max(0, prev - 1))}
                                className="hover:text-grey-med-dark focus:outline-none"
                              >
                                <BiSolidDownArrow size={24} />
                              </button>
                            </div>
                          </div>
                          <Label htmlFor="target-years" className="text-sm text-muted-foreground flex-none">
                            Years
                          </Label>
                        </div>
                        <div className="flex flex-row w-1/2 gap-2 items-center">
                          <div className="relative grow">
                            <Input
                              id="target-months"
                              type="number"
                              min="0"
                              max="11"
                              value={targetMonths === 0 ? "" : targetMonths}
                              onChange={(e) => setTargetMonths(Math.min(11, Math.max(0, Number(e.target.value)) || 0))}
                              className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                              <button
                                type="button"
                                tabIndex={-1}
                                aria-label="Increase amount"
                                onClick={() => setTargetMonths((prev) => Math.min(11, prev + 1))}
                                className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                              >
                                <BiSolidUpArrow size={24} />
                              </button>
                              <button
                                type="button"
                                tabIndex={-1}
                                aria-label="Decrease amount"
                                onClick={() => setTargetMonths((prev) => Math.max(0, prev - 1))}
                                className="hover:text-grey-med-dark focus:outline-none"
                              >
                                <BiSolidDownArrow size={24} />
                              </button>
                            </div>
                          </div>
                          <Label htmlFor="target-months" className="text-sm text-muted-foreground flex-none">
                            Months
                          </Label>
                        </div>
                      </div>
                      <div className="text-md font-semibold text-lagunita">
                        Total: {targetYears} year{targetYears !== 1 ? "s" : ""} {targetMonths} month{targetMonths !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <CardHeader className="">
                    <CardTitle className="text-[var(--text-navy)] text-[22px] text-center font-bold">Required payment</CardTitle>
                  </CardHeader>
                  <CardContent className="">
                    <div className="rounded-lg mb-6 text-center">
                      <p className="text-lg text-[var(--text-navy)] tracking-wide mb-2">Payment per period</p>
                      <p className="text-4xl font-bold text-lagunita mb-2">
                        {formatCurrency(requiredPaymentResult.requiredPayment)}
                      </p>
                      <p className="text-lagunita text-lg font-semibold">To pay off in {formatTime(targetYears * 12 + targetMonths)}</p>
                    </div>

                    <div className="innerwrapper">
                      <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                        <div className="w-full sm:w-[50%] p-4 font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none text-white bg-navy">
                          Total interest:
                        </div>
                        <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                          {formatCurrency(requiredPaymentResult.totalInterest)}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                        <div className="w-full sm:w-[50%] p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                          Total amount paid:
                        </div>
                        <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                          {formatCurrency(requiredPaymentResult.totalAmountPaid)}
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
  )
}