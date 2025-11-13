"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { CustomSlider } from "@/app/ui/components/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import { InfoIcon } from "lucide-react"
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";
import ThemeToggle from "@/app/lib/theme-toggle";

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
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        {/* Header */}
        <h1 className="sr-only">Debt Payoff Calculator</h1>
        {/* Mode Selection */}
        <div className="mb-8">

        <Tabs defaultValue="time" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
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
                        <Label htmlFor="debt-amount">Debt Amount</Label>
                        <InfoIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="relative">
                        <Input
                          id="debt-amount"
                          type="number"
                          value={debtAmount}
                          onChange={(e) => setDebtAmount(Number(e.target.value))}
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

                    <div className="relative">
                      <div className="relative flex items-center gap-2">
                        <Label htmlFor="interest-rate">Annual Interest Rate (%)</Label>
                        <InfoIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="interest-rate"
                        type="number"
                        step="0.1"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Increase amount"
                          onClick={() => setInterestRate((prev) => Math.max(0, prev + 1))}
                          className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                        >
                          <BiSolidUpArrow size={24} />
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Decrease amount"
                          onClick={() => setInterestRate((prev) => Math.max(0, prev - 1))}
                          className="hover:text-grey-med-dark focus:outline-none"
                        >
                          <BiSolidDownArrow size={24} />
                        </button>
                      </div>
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

                    <div className="space-y-4 p-4 bg-[var(--additional-background)] border-1 border-grey-border rounded-lg">
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
                      <div className="flex justify-between text-sm">
                        <span>$0</span>
                        <span>$10,000</span>
                      </div>
                      <p className="text-lg">
                        Each steady extra payment reduces your total interest.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <CardHeader>
                    <CardTitle className="text-navy text-2xl text-center font-bold">Your Payoff Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-lg mb-6 text-center">
                      <p className="text-lg font-semibold text-navy tracking-wide">Time to Pay Off</p>
                      <p className="text-4xl font-bold text-lagunita mb-2">{formatTime(payoffResult.timeInMonths)}</p>
                      <p className="text-lg font-semibold text-lagunita">Debt-free by {formatDate(payoffResult.payoffDate)}</p>
                    </div>

                    <div className="innerwrapper">
                      <div className="flex flex-row mb-1 rounded-lg bg-[var(--results-white-background)]">
                        <div className="w-[50%] p-4 font-bold rounded-l-lg text-white bg-navy">
                          Total interest:
                        </div>
                        <div className="w-[50%] text-lg-title p-4 self-center rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                          {formatCurrency(payoffResult.totalInterest)}
                        </div>
                      </div>

                      <div className="flex flex-row mb-1 rounded-lg bg-[var(--results-white-background)]">
                        <div className="w-[50%] p-4 text-black font-bold rounded-l-lg bg-grey-med-dark">
                          Total amount paid:
                        </div>
                        <div className="w-[50%] text-lg-title p-4 self-center rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                          {formatCurrency(payoffResult.totalAmountPaid)}
                        </div>
                      </div>

                      <div className="flex flex-row mb-1 rounded-lg bg-[var(--results-white-background)]">
                        <div className="w-[50%] p-4 bg-lagunita font-bold text-white rounded-l-lg">
                          Interest saved:
                        </div>
                        <div className="w-[50%] text-lg-title p-4 self-center rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-lagunita-lighter text-lagunita">
                          {formatCurrency(payoffResult.interestSaved)}
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-lg font-semibold pt-6 text-navy">
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
                        <Label htmlFor="debt-amount-2">Debt Amount</Label>
                        <InfoIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="relative">
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

                <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <CardHeader className="">
                    <CardTitle className="text-navy text-2xl text-center font-bold">Required Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="">
                    <div className="rounded-lg mb-6 text-center">
                      <p className="text-lg text-navy tracking-wide mb-2">Payment Per Period</p>
                      <p className="text-4xl font-bold text-lagunita mb-2">
                        {formatCurrency(requiredPaymentResult.requiredPayment)}
                      </p>
                      <p className="text-lagunita text-lg font-semibold">To pay off in {formatTime(targetYears * 12 + targetMonths)}</p>
                    </div>

                    <div className="innerwrapper">
                      <div className="flex flex-row mb-1 rounded-lg bg-[var(--results-white-background)]">
                        <div className="w-[50%] p-4 font-bold rounded-l-lg text-white bg-navy">
                          Total interest:
                        </div>
                        <div className="w-[50%] text-lg-title p-4 self-center rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                          {formatCurrency(requiredPaymentResult.totalInterest)}
                        </div>
                      </div>

                      <div className="flex flex-row mb-1 rounded-lg bg-[var(--results-white-background)]">
                        <div className="w-[50%] p-4 text-black font-bold rounded-l-lg bg-grey-med-dark">
                          Total amount paid:
                        </div>
                        <div className="w-[50%] text-lg-title p-4 self-center rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                          {formatCurrency(requiredPaymentResult.totalAmountPaid)}
                        </div>
                      </div>
                      </div>
                      <p className="text-center text-lg font-semibold pt-6 text-navy">
                        You&#39;re turning your loan into a plan. A little extra now means freedom sooner.
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
