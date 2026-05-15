"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/app/ui/components/card"
import { Label } from "@/app/ui/components/label"
import { Input } from "@/app/ui/components/input"
import { Button } from "@/app/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import ThemeToggle from "@/app/lib/theme-toggle"
import { FaRotateLeft, FaArrowRight, FaArrowLeft, FaCircleCheck, FaCircleXmark, FaCircleInfo } from "react-icons/fa6"

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default function MortgageCalculator() {
  const [activeTab, setActiveTab] = useState("current-balance")

  const [monthsRemaining, setMonthsRemaining] = useState("")
  const [annualRate, setAnnualRate] = useState("")
  const [monthlyPayment, setMonthlyPayment] = useState("")
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)

  const [refCurrentBalance, setRefCurrentBalance] = useState("")
  const [refCurrentMonthlyPayment, setRefCurrentMonthlyPayment] = useState("")
  const [refCurrentMonths, setRefCurrentMonths] = useState("")
  const [refCurrentRate, setRefCurrentRate] = useState("")
  const [refNewLoanAmount, setRefNewLoanAmount] = useState("")
  const [refNewRate, setRefNewRate] = useState("")
  const [refNewMonths, setRefNewMonths] = useState("")
  const [refClosingCosts, setRefClosingCosts] = useState("")
  const [refYearsIn, setRefYearsIn] = useState("")
  const [refinanceResults, setRefinanceResults] = useState<{
    currentMonthlyPayment: number
    newMonthlyPayment: number
    monthlySavings: number
    totalCurrentCost: number
    totalNewCost: number
    totalSavings: number
    breakEvenMonths: number
    breakEvenMessage: string
  } | null>(null)

  const [refErrors, setRefErrors] = useState<{
    newLoanAmount?: string
    newRate?: string
    newMonths?: string
  }>({})

  // ── Live balance calculation ──────────────────────────────────────────────
  useEffect(() => {
    const months = Number.parseFloat(monthsRemaining)
    const rate = Number.parseFloat(annualRate) / 100 / 12
    const payment = Number.parseFloat(monthlyPayment)

    if (
      !monthsRemaining || !annualRate || !monthlyPayment ||
      isNaN(months) || isNaN(rate) || isNaN(payment) ||
      months <= 0 || rate < 0 || payment <= 0
    ) {
      setCurrentBalance(null)
      return
    }

    const balance = rate === 0
      ? payment * months
      : payment * ((1 - Math.pow(1 + rate, -months)) / rate)

    setCurrentBalance(balance)
    // Keep refinance tab pre-filled in sync
    setRefCurrentBalance(balance.toFixed(2))
    setRefCurrentMonths(monthsRemaining)
    setRefCurrentRate(annualRate)
    setRefCurrentMonthlyPayment(monthlyPayment)
  }, [monthsRemaining, annualRate, monthlyPayment])

  const handleReset = () => {
    setCurrentBalance(null)
    setMonthsRemaining("")
    setAnnualRate("")
    setMonthlyPayment("")
    setRefCurrentBalance("")
    setRefCurrentMonths("")
    setRefCurrentRate("")
    setRefCurrentMonthlyPayment("")
  }

  const calculateRefinance = () => {
    const errors: {
      newLoanAmount?: string;
      newRate?: string;
      newMonths?: string;
    } = {};

    const currentBal = Number.parseFloat(refCurrentBalance);
    const currentR = Number.parseFloat(refCurrentRate) / 100 / 12;
    const currentM = Number.parseFloat(refCurrentMonths);
    const newR = Number.parseFloat(refNewRate) / 100 / 12;
    const newM = Number.parseFloat(refNewMonths);
    const closingCosts = Number.parseFloat(refClosingCosts) || 0;
    const newLoanAmount = Number.parseFloat(refNewLoanAmount);

    if (!refNewLoanAmount || isNaN(newLoanAmount) || newLoanAmount <= 0)
      errors.newLoanAmount = "Please enter a valid loan amount greater than 0.";
    if (!refNewRate || isNaN(newR) || newR < 0)
      errors.newRate = "Please enter a valid interest rate.";
    if (!refNewMonths || isNaN(newM) || newM <= 0)
      errors.newMonths = "Please enter a valid loan term greater than 0.";

    setRefErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const currentMonthlyPayment =
      currentR === 0
        ? currentBal / currentM
        : (currentBal * (currentR * Math.pow(1 + currentR, currentM))) /
          (Math.pow(1 + currentR, currentM) - 1);

    const newMonthlyPayment =
      newR === 0
        ? newLoanAmount / newM
        : (newLoanAmount * (newR * Math.pow(1 + newR, newM))) /
          (Math.pow(1 + newR, newM) - 1);

    const monthlySavings = currentMonthlyPayment - newMonthlyPayment;
    const totalCurrentCost = currentMonthlyPayment * currentM;
    const totalNewCost = newMonthlyPayment * newM + closingCosts;
    const totalSavings = totalCurrentCost - totalNewCost;

    let breakEvenMonths: number;
    let breakEvenMessage: string;

    if (monthlySavings > 0) {
      breakEvenMonths = closingCosts > 0 ? closingCosts / monthlySavings : 0;
      breakEvenMessage =
        closingCosts > 0
          ? `You'll recover closing costs in ${breakEvenMonths.toFixed(1)} months`
          : "No closing costs to recover - immediate savings!";
    } else if (monthlySavings < 0) {
      if (totalSavings > 0) {
        breakEvenMonths = closingCosts > 0 ? closingCosts / -monthlySavings : 0;
        breakEvenMessage =
          closingCosts > 0
            ? `Despite higher monthly payments, you'll save overall if you stay ${breakEvenMonths.toFixed(1)}+ months`
            : "Despite higher monthly payments, you save overall on total interest";
      } else {
        breakEvenMonths = Infinity;
        breakEvenMessage =
          "This refinance costs more overall - not recommended";
      }
    } else {
      breakEvenMonths = totalSavings > 0 ? 0 : Infinity;
      breakEvenMessage =
        totalSavings > 0
          ? "Same monthly payment, but you save on total interest"
          : "No financial benefit";
    }

    setRefinanceResults({
      currentMonthlyPayment,
      newMonthlyPayment,
      monthlySavings,
      totalCurrentCost,
      totalNewCost,
      totalSavings,
      breakEvenMonths,
      breakEvenMessage,
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        <h1 className="sr-only">Mortgage Calculator Suite</h1>
        <div className="mb-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-rows-1 sm:grid-cols-2 p-0 gap-4">
              <TabsTrigger value="current-balance" className="cursor-pointer">
                Current Balance
              </TabsTrigger>
              <TabsTrigger value="refinance" className="cursor-pointer">
                Refinance Analysis
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Current Balance ─────────────────────────────────── */}
            <TabsContent value="current-balance">
              <Card>
                <CardHeader>
                  <CardDescription>
                    Calculate your remaining mortgage balance (the present value
                    of your remaining monthly mortgage payments).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-12 lg:grid-cols-2">
                    {/* Left — inputs */}
                    <div>
                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="months">
                          Months remaining on loan
                        </Label>
                        <div className="relative">
                          <Input
                            id="months"
                            type="number"
                            placeholder=""
                            value={monthsRemaining}
                            onChange={(e) => setMonthsRemaining(e.target.value)}
                            min="0"
                            step="1"
                            className="font-bold pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {monthsRemaining && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none">
                              months
                            </span>
                          )}
                        </div>
                        {monthsRemaining && (
                          <p className="mt-3 text-[14px]">
                            {monthsRemaining} months ={" "}
                            {(Number.parseFloat(monthsRemaining) / 12).toFixed(
                              1,
                            )}{" "}
                            years
                          </p>
                        )}
                      </div>

                      <div className="mb-5 relative">
                        <div className="flex items-center gap-1 mb-1">
                          <Label className="font-semibold" htmlFor="rate">
                            Current interest rate
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
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-md bg-[var(--info-popup-background)] text-navy border-1 border-grey-border text-xs p-4 
                 invisible group-hover:visible group-focus-within:visible
                 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
                 transition-opacity pointer-events-none z-10"
                            >
                              Enter the current interest rate on your mortgage.
                              Check your latest statement.
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <Input
                            id="rate"
                            type="number"
                            placeholder=""
                            value={annualRate}
                            onChange={(e) => setAnnualRate(e.target.value)}
                            min="0"
                            step="0.1"
                            className="text-lagunita font-bold pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          {annualRate && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lagunita font-bold pointer-events-none">
                              %
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="payment">
                          Monthly payment amount ($)
                        </Label>
                        <div className="relative">
                          {monthlyPayment && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold pointer-events-none">
                              $
                            </span>
                          )}
                          <Input
                            id="payment"
                            type="number"
                            placeholder=""
                            value={monthlyPayment}
                            onChange={(e) => setMonthlyPayment(e.target.value)}
                            min="0"
                            step="0.01"
                            className={`font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${monthlyPayment ? "pl-6" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Reset — only visible once there's a result */}
                      {currentBalance !== null && (
                        <button
                          onClick={handleReset}
                          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-lagunita text-navy bg-transparent hover:border-navy hover:text-navy hover:underline cursor-pointer transition-colors w-full md:w-auto justify-center md:justify-start"
                        >
                          <FaRotateLeft size={14} />
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Right — live result or empty state */}
                    <div
                      className="bg-[var(--card-background)] rounded-3xl p-[32px]"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {currentBalance !== null ? (
                        <>
                          <p className="text-md font-bold mb-1">
                            Estimated current balance
                          </p>
                          <p className="text-4xl font-bold text-lagunita">
                            ${formatCurrency(currentBalance)}
                          </p>
                          <p className="mt-2 text-sm text-[var(--results-card-empty)]">
                            Based on the remaining monthly payments
                          </p>
                          <Button
                            className="mt-4 px-6 py-6 whitespace-normal bg-navy border-2 border-lagunita cursor-pointer hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white w-full md:w-auto"
                            onClick={() => setActiveTab("refinance")}
                          >
                            Continue to refinance
                          </Button>
                        </>
                      ) : (
                        <>
                          <h2 className="mb-1 text-md text-center font-bold text-[var(--results-card-empty)]">
                            Your current mortgage balance will appear here.
                          </h2>
                          <p className="text-center">
                            Enter your loan details to see your estimated
                            remaining balance.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab 2: Refinance Analysis ──────────────────────────────── */}
            <TabsContent value="refinance">
              <Card>
                <CardHeader>
                  <CardDescription>
                    Analyze if refinancing makes financial sense for your
                    situation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!currentBalance ? (
                    <div className="rounded-xl border-2 border-lagunita bg-lagunita-lighter p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <p className="text-sm text-navy">
                        Start by calculating your current mortgage balance
                        first. Enter your details in the Current Balance tab,
                        then come back here to explore refinance options.
                      </p>
                      <button
                        onClick={() => setActiveTab("current-balance")}
                        className="flex items-center gap-2 whitespace-nowrap text-lagunita font-semibold hover:underline cursor-pointer"
                      >
                        Calculate current balance <FaArrowRight size={12} />
                      </button>
                    </div>
                  ) : null}

                  <div className="md:grid md:grid-cols-2 gap-8">
                    {/* ── Left column ─────────────────────────────────────────── */}
                    <div className="flex flex-col gap-8">
                      {/* Current Loan Terms — read-only */}
                      <div>
                        <h2 className="mb-4 text-lg text-lagunita font-semibold border-b border-lagunita pb-2">
                          Current Loan Terms
                        </h2>
                        {currentBalance ? (
                          <div className="rounded-lg border border-[var(--border)] bg-[var(--results-card-grey-background)] p-4">
                            <dl className="space-y-4">
                              <div>
                                <dt className="pr-1 inline-block text-[var(--results-card-empty)]">
                                  Current balance:
                                </dt>
                                <dd className="inline-block font-bold">
                                  ${formatCurrency(currentBalance)}
                                </dd>
                              </div>
                              <div>
                                <dt className="pr-1 inline-block text-[var(--results-card-empty)]">
                                  Time remaining:
                                </dt>
                                <dd className="font-bold inline-block">
                                  {refCurrentMonths} months
                                  {refCurrentMonths &&
                                    ` (${(Number.parseFloat(refCurrentMonths) / 12).toFixed(1)} years)`}
                                </dd>
                              </div>
                              <div>
                                <dt className="pr-1 inline-block text-[var(--results-card-empty)]">
                                  Interest rate:
                                </dt>
                                <dd className="font-bold inline-block text-lagunita">
                                  {refCurrentRate}%
                                </dd>
                              </div>
                              <div>
                                <dt className="pr-1 inline-block text-[var(--results-card-empty)]">
                                  Monthly payment:
                                </dt>
                                <dd className="font-bold inline-block">
                                  ${refCurrentMonthlyPayment}
                                </dd>
                              </div>
                              <div>
                                <button
                                  onClick={() =>
                                    setActiveTab("current-balance")
                                  }
                                  className="mt-2 flex items-center gap-2 text-sm text-lagunita font-semibold hover:underline cursor-pointer"
                                >
                                  <FaArrowLeft size={12} aria-hidden="true" />{" "}
                                  Edit current balance
                                </button>
                              </div>
                            </dl>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-[var(--border)] bg-[var(--card-background)] p-4">
                            <p className="text-sm text-[var(--results-card-empty)]">
                              No balance calculated yet.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* New Loan Terms — inputs */}
                      <div>
                        <h2 className="mb-4 text-lg text-lagunita font-semibold border-b border-lagunita pb-2">
                          New Loan Terms
                        </h2>

                        <div className="mb-5 relative">
                          <Label
                            className="font-semibold"
                            htmlFor="ref-new-loan-amount"
                          >
                            New loan amount
                          </Label>
                          <div className="relative">
                            {refNewLoanAmount && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold pointer-events-none">
                                $
                              </span>
                            )}
                            <Input
                              id="ref-new-loan-amount"
                              type="number"
                              placeholder=""
                              value={refNewLoanAmount}
                              onChange={(e) =>
                                setRefNewLoanAmount(e.target.value)
                              }
                              min="0"
                              step="0.01"
                              className={`font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${refNewLoanAmount ? "pl-6" : ""} ${refErrors.newLoanAmount ? "border-error" : ""}`}
                            />
                          </div>
                          {refErrors.newLoanAmount && (
                            <p role="alert" className="mt-1 text-sm text-error">
                              {refErrors.newLoanAmount}
                            </p>
                          )}
                        </div>

                        <div className="mb-5 relative">
                          <Label
                            className="font-semibold"
                            htmlFor="ref-new-months"
                          >
                            New loan term (months)
                          </Label>
                          <div className="relative">
                            <Input
                              id="ref-new-months"
                              type="number"
                              placeholder=""
                              value={refNewMonths}
                              onChange={(e) => setRefNewMonths(e.target.value)}
                              min="0"
                              step="1"
                              className={`font-bold pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${refErrors.newMonths ? "border-error" : ""}`}
                            />
                            {refNewMonths && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none">
                                months
                              </span>
                            )}
                          </div>
                          {refNewMonths && (
                            <p className="mt-3 text-[14px]">
                              {refNewMonths} months ={" "}
                              {(Number.parseFloat(refNewMonths) / 12).toFixed(
                                1,
                              )}{" "}
                              years
                            </p>
                          )}
                          {refErrors.newMonths && (
                            <p role="alert" className="mt-1 text-sm text-error">
                              {refErrors.newMonths}
                            </p>
                          )}
                        </div>

                        <div className="mb-5 relative">
                          <Label
                            className="font-semibold"
                            htmlFor="ref-new-rate"
                          >
                            New interest rate
                          </Label>
                          <div className="relative">
                            <Input
                              id="ref-new-rate"
                              type="number"
                              placeholder=""
                              value={refNewRate}
                              onChange={(e) => setRefNewRate(e.target.value)}
                              min="0"
                              step="0.1"
                              className={`text-lagunita font-bold pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${refErrors.newRate ? "border-error" : ""}`}
                            />
                            {refNewRate && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lagunita font-bold pointer-events-none">
                                %
                              </span>
                            )}
                          </div>
                          {refErrors.newRate && (
                            <p role="alert" className="mt-1 text-sm text-error">
                              {refErrors.newRate}
                            </p>
                          )}
                        </div>

                        <div className="my-6 border-b border-lagunita" />

                        <div className="mb-5 relative">
                          <Label
                            className="font-semibold"
                            htmlFor="ref-closing"
                          >
                            Closing costs & fees
                          </Label>
                          <div className="relative">
                            {refClosingCosts && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold pointer-events-none">
                                $
                              </span>
                            )}
                            <Input
                              id="ref-closing"
                              type="number"
                              placeholder=""
                              value={refClosingCosts}
                              onChange={(e) =>
                                setRefClosingCosts(e.target.value)
                              }
                              min="0"
                              step="0.01"
                              className={`font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${refClosingCosts ? "pl-6" : ""}`}
                            />
                          </div>
                        </div>

                        <div className="mb-5 relative">
                          <Label
                            className="font-semibold"
                            htmlFor="ref-years-in-house"
                          >
                            Expected years living in house
                          </Label>
                          <div className="relative">
                            <Input
                              id="ref-years-in-house"
                              type="number"
                              placeholder=""
                              value={refYearsIn}
                              onChange={(e) => setRefYearsIn(e.target.value)}
                              min="0"
                              step="1"
                              className="font-bold pr-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            {refYearsIn && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none">
                                years
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        {refinanceResults ? (
                          <div className="flex gap-4">
                            <Button
                              className="h-18 whitespace-normal cursor-pointer bg-lagunita border-2 border-lagunita hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white flex-1"
                              onClick={calculateRefinance}
                            >
                              Recalculate
                            </Button>
                            <button
                              onClick={() => {
                                setRefinanceResults(null);
                                setRefNewLoanAmount("");
                                setRefNewRate("");
                                setRefNewMonths("");
                                setRefClosingCosts("");
                                setRefYearsIn("");
                                setRefErrors({});
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-lagunita text-navy bg-transparent hover:border-navy hover:text-navy hover:underline cursor-pointer transition-colors flex-1 justify-center"
                            >
                              <FaRotateLeft size={14} aria-hidden="true" />
                              Reset new loan terms
                            </button>
                          </div>
                        ) : (
                          <Button
                            className="h-18 whitespace-normal bg-navy cursor-pointer hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white w-full"
                            onClick={calculateRefinance}
                          >
                            Compare Refinance Options
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* ── Right column — results or empty state ───────────────── */}
                    <div>
                      {refinanceResults ? (
                        <div className="bg-[var(--card-background)] rounded-xl p-8">
                          <div className="mb-6">
                            {refinanceResults.totalSavings >= 0 ? (
                              <>
                                <h3 className="text-lg font-bold text-lagunita flex items-center gap-2">
                                  <FaCircleCheck size={18} aria-hidden="true" />{" "}
                                  Refinancing may be worth it
                                </h3>
                                <p className="text-sm mt-1 text-[var(--results-card-empty)]">
                                  You could save money over the time you plan to
                                  stay in the home.
                                </p>
                              </>
                            ) : (
                              <>
                                <h3 className="text-lg font-bold text-berry flex items-center gap-2">
                                  <FaCircleXmark size={18} aria-hidden="true" />{" "}
                                  Refinancing may not be worth it
                                </h3>
                                <p className="text-sm mt-1 text-[var(--results-card-empty)]">
                                  Based on the planned time in the home, this
                                  refinance may cost more than staying with the
                                  current loan.
                                </p>
                              </>
                            )}
                          </div>

                          <div className="rounded-lg mt-4">
                            <div className="innerwrapper">
                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark items-center">
                                  New monthly payment:
                                </div>
                                <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                                  $
                                  {formatCurrency(
                                    refinanceResults.newMonthlyPayment,
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark items-center">
                                  {refinanceResults.monthlySavings >= 0
                                    ? "Monthly savings:"
                                    : "Monthly increase:"}
                                </div>
                                <div
                                  className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis bg-[var(--secondary-background)]"
                                >
                                  {refinanceResults.monthlySavings >= 0
                                    ? "−"
                                    : "+"}
                                  $
                                  {formatCurrency(
                                    Math.abs(refinanceResults.monthlySavings),
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark items-center">
                                  Closing costs & fees:
                                </div>
                                <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                                  $
                                  {formatCurrency(
                                    Number.parseFloat(refClosingCosts) || 0,
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                                  {refinanceResults.totalSavings >= 0
                                    ? "Estimated savings over planned stay:"
                                    : "Estimated total cost difference:"}
                                </div>
                                <div
                                  className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold bg-[var(--secondary-background)] overflow-hidden text-ellipsis flex items-center"
                                >
                                  {refinanceResults.totalSavings >= 0
                                    ? "−"
                                    : "+"}
                                  $
                                  {formatCurrency(
                                    Math.abs(refinanceResults.totalSavings),
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                          <h2 className="mb-1 text-md font-bold text-[var(--results-card-empty)]">
                            Your refinance analysis will appear here.
                          </h2>
                          <p>Enter your new loan details to compare options.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}