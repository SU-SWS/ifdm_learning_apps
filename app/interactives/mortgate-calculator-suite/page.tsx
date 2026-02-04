"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Label } from "@/app/ui/components/label"
import { Input } from "@/app/ui/components/input"
import { Button } from "@/app/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import ThemeToggle from "@/app/lib/theme-toggle";
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";

const formatCurrency = (amount: number) => 
  amount.toLocaleString("en-US", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })

export default function MortgageCalculator() {
  const [monthsRemaining, setMonthsRemaining] = useState("")
  const [annualRate, setAnnualRate] = useState("")
  const [monthlyPayment, setMonthlyPayment] = useState("")
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)

  const [refCurrentBalance, setRefCurrentBalance] = useState("")
  const [refCurrentMonthlyPayment, setRefCurrentMonthlyPayment] = useState("")
  const [refCurrentMonths, setRefCurrentMonths] = useState("")
  const [refCurrentRate, setRefCurrentRate] = useState("")  // Added missing state for refinance current rate
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

  const calculateBalance = () => {
    const months = Number.parseFloat(monthsRemaining)
    const rate = Number.parseFloat(annualRate) / 100 / 12
    const payment = Number.parseFloat(monthlyPayment)

    if (isNaN(months) || isNaN(rate) || isNaN(payment) || months <= 0 || rate < 0 || payment <= 0) {
      alert("Please enter valid positive numbers")
      return
    }

    let balance: number

    if (rate === 0) {
      balance = payment * months
    } else {
      balance = payment * ((1 - Math.pow(1 + rate, -months)) / rate)
    }

    setCurrentBalance(balance)
  }

  const calculateRefinance = () => {
    const currentBal = Number.parseFloat(refCurrentBalance)
    const currentR = Number.parseFloat(refCurrentRate) / 100 / 12  // Fixed: Use refCurrentRate instead of refCurrentMonthlyPayment
    const currentM = Number.parseFloat(refCurrentMonths)
    const newR = Number.parseFloat(refNewRate) / 100 / 12
    const newM = Number.parseFloat(refNewMonths)
    const closingCosts = Number.parseFloat(refClosingCosts)

    if (
      isNaN(currentBal) ||
      isNaN(currentR) ||
      isNaN(currentM) ||
      isNaN(newR) ||
      isNaN(newM) ||
      isNaN(closingCosts) ||
      currentBal <= 0 ||
      currentR < 0 ||
      currentM <= 0 ||
      newR < 0 ||
      newM <= 0 ||
      closingCosts < 0
    ) {
      alert("Please enter valid numbers")
      return
    }

    // Calculate current monthly payment: PMT = P × [r(1 + r)^n] / [(1 + r)^n - 1]
    let currentMonthlyPayment: number
    if (currentR === 0) {
      currentMonthlyPayment = currentBal / currentM
    } else {
      currentMonthlyPayment =
        (currentBal * (currentR * Math.pow(1 + currentR, currentM))) / (Math.pow(1 + currentR, currentM) - 1)
    }

    // Calculate new monthly payment
    const newLoanAmount = Number.parseFloat(refNewLoanAmount)

    // Validate newLoanAmount in your validation section
    if (
      isNaN(currentBal) ||
      isNaN(currentR) ||
      isNaN(currentM) ||
      isNaN(newLoanAmount) ||  // ✅ Add this
      isNaN(newR) ||
      isNaN(newM) ||
      isNaN(closingCosts) ||
      currentBal <= 0 ||
      currentR < 0 ||
      currentM <= 0 ||
      newLoanAmount <= 0 ||  // ✅ Add this
      newR < 0 ||
      newM <= 0 ||
      closingCosts < 0
    ) {
      alert("Please enter valid numbers")
      return
    }

    // Calculate new monthly payment
    let newMonthlyPayment: number
    if (newR === 0) {
      newMonthlyPayment = newLoanAmount / newM  // ✅ Use newLoanAmount
    } else {
      newMonthlyPayment = (newLoanAmount * (newR * Math.pow(1 + newR, newM))) / (Math.pow(1 + newR, newM) - 1)  // ✅ Use newLoanAmount
    }

    const monthlySavings = currentMonthlyPayment - newMonthlyPayment
    const totalCurrentCost = currentMonthlyPayment * currentM
    const totalNewCost = newMonthlyPayment * newM + closingCosts
    const totalSavings = totalCurrentCost - totalNewCost

    let breakEvenMonths: number
    let breakEvenMessage: string

    if (monthlySavings > 0) {
      // Case 1: Lower monthly payment
      breakEvenMonths = closingCosts / monthlySavings
      breakEvenMessage = `You'll recover closing costs in ${breakEvenMonths.toFixed(1)} months`
    } else if (monthlySavings < 0) {
      // Case 2: Higher monthly payment
      // Only makes sense if total savings over loan term is positive
      if (totalSavings > 0) {
        breakEvenMonths = closingCosts / (-monthlySavings)
        breakEvenMessage = `Despite higher monthly payments, you'll save overall if you stay ${breakEvenMonths.toFixed(1)}+ months`
      } else {
        breakEvenMonths = Infinity
        breakEvenMessage = "This refinance costs more overall - not recommended"
      }
    } else {
      // Case 3: Same monthly payment
      breakEvenMonths = totalSavings > 0 ? 0 : Infinity
      breakEvenMessage = totalSavings > 0 
        ? "Same monthly payment, but you save on total interest" 
        : "No financial benefit"
    }

    setRefinanceResults({
      currentMonthlyPayment,
      newMonthlyPayment,
      monthlySavings,
      totalCurrentCost,
      totalNewCost,
      totalSavings,
      breakEvenMonths,
      breakEvenMessage, // Add this to state type
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        {/* Header */}
        <h1 className="sr-only">Mortgage Calculator Suite</h1>
        {/* Mode Selection */}
        <div className="mb-8">

          <Tabs defaultValue="current-balance" className="w-full">
            <TabsList className="grid w-full grid-rows-1 sm:grid-cols-2 p-0 gap-4">
              <TabsTrigger value="current-balance" className="cursor-pointer">Current Balance</TabsTrigger>
              <TabsTrigger value="refinance" className="cursor-pointer">Refinance Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="current-balance">
              <Card>
                <CardHeader>
                  <CardTitle>Current Mortgage Balance Calculator</CardTitle>
                  <CardDescription>
                    Calculate the present value of your remaining monthly mortgage payments (your mortgage balance).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative">
                    <Label className="font-semibold" htmlFor="months">Months remaining on loan</Label>
                    <Input
                      id="months"
                      type="number"
                      placeholder="-"
                      value={monthsRemaining}
                      onChange={(e) => setMonthsRemaining(e.target.value)}
                      min="0"
                      step="1"
                      className="text-black font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Increase amount"
                        onClick={() => {
                          const current = Number.parseFloat(monthsRemaining || "0");
                          setMonthsRemaining((current + 1).toString());
                        }}
                        className="mb-[-5px] mt-[-5px] hover:text-grey-med-dark focus:outline-none"
                      >
                        <BiSolidUpArrow size={24} />
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Decrease amount"
                        onClick={() => {
                          const current = Number.parseFloat(monthsRemaining || "0");
                          if (current > 0) {
                            setMonthsRemaining((current - 1).toString());
                          }
                        }}
                        className="hover:text-grey-med-dark focus:outline-none"
                      >
                        <BiSolidDownArrow size={24} />
                      </button>
                    </div>
                    <p className="mt-3 text-[14px]">{monthsRemaining || "0"} months = {(Number.parseFloat(monthsRemaining || "0") / 12).toFixed(1)} years</p>
                  </div>

                  <div className="relative">
                    <Label className="font-semibold" htmlFor="rate">Annual interest rate (%)</Label>
                    <Input
                      id="rate"
                      type="number"
                      placeholder="-"
                      value={annualRate}
                      onChange={(e) => setAnnualRate(e.target.value)}
                      min="0"
                      step="0.1"
                      className="text-lagunita font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Increase amount"
                        onClick={() => {
                          const current = Number.parseFloat(annualRate || "0");
                          setAnnualRate((current + 0.1).toFixed(1));
                        }}
                        className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                      >
                        <BiSolidUpArrow size={24} />
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Decrease amount"
                        onClick={() => {
                          const current = Number.parseFloat(annualRate || "0");
                          setAnnualRate(Math.max(0, current - 0.1).toFixed(1));
                        }}
                        className="hover:text-grey-med-dark focus:outline-none"
                      >
                        <BiSolidDownArrow size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Label className="font-semibold" htmlFor="payment">Monthly payment amount ($)</Label>
                    <Input
                      id="payment"
                      type="number"
                      placeholder="-"
                      value={monthlyPayment}
                      onChange={(e) => setMonthlyPayment(e.target.value)}
                      min="0"
                      step="0.01"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Increase amount"
                        onClick={() => {
                          const current = Number.parseFloat(monthlyPayment || "0");
                          setMonthlyPayment((current + 1).toFixed(2));
                        }}
                        className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                      >
                        <BiSolidUpArrow size={24} />
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Decrease amount"
                        onClick={() => {
                          const current = Number.parseFloat(monthlyPayment || "0");
                          if (current > 0) {
                            setMonthlyPayment((current - 1).toFixed(2));
                          }
                        }}
                        className="hover:text-grey-med-dark focus:outline-none"
                      >
                        <BiSolidDownArrow size={24} />
                      </button>
                    </div>
                  </div>
                  {currentBalance !== null && (
                    <div className="bg-[var(--card-background)] rounded-md p-[32px] text-center md:text-left"> 
                      <p className="text-md font-bold mb-1">Current Mortgage Balance</p>
                      <p className="text-4xl font-bold text-lagunita">
                        ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  <Button
                    className={`h-18 whitespace-normal bg-navy border-2 border-navy cursor-pointer hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white w-full md:w-auto`}
                    onClick={currentBalance !== null ? () => { setCurrentBalance(null); setMonthsRemaining(""); setAnnualRate(""); setMonthlyPayment(""); } : calculateBalance}
                  >
                    {currentBalance !== null ? "Reset" : "Calculate Current Balance"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="refinance">
              <Card>
                <CardHeader>
                  <CardTitle>Refinance Analysis</CardTitle>
                  <CardDescription>Analyze if refinancing makes financial sense for your situation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="md:grid md:grid-cols-2 gap-4">
                    <div className="pr-4">
                      <h2 className="mb-4 text-lg text-lagunita font-semibold border-b-1 border-lagunita">Current Loan Term</h2>
                  
                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-balance">Remaining balance ($)</Label>
                        <Input
                          id="ref-balance"
                          type="number"
                          placeholder="-"
                          value={refCurrentBalance}
                          onChange={(e) => setRefCurrentBalance(e.target.value)}
                          min="0"
                          step="0.01"
                          className="text-black font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => {
                              const current = Number.parseFloat(refCurrentBalance || "0");
                              setRefCurrentBalance((current + 1).toFixed(2));
                            }}
                            className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => {
                              const current = Number.parseFloat(refCurrentBalance || "0");
                              setRefCurrentBalance(Math.max(0,current - 1).toFixed(2));
                            }}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-current-months">Months remaining on loan</Label>
                        <Input
                          id="ref-current-months"
                          type="number"
                          placeholder="-"
                          value={refCurrentMonths}
                          onChange={(e) => setRefCurrentMonths(e.target.value)}
                          min="0"
                          step="1"
                          className="text-black font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => {
                              const current = Number.parseInt(refCurrentMonths || "0");
                              setRefCurrentMonths((current + 1).toString());
                            }}
                            className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => {
                              const current = Number.parseInt(refCurrentMonths || "0");
                              setRefCurrentMonths(Math.max(0, current - 1).toString());
                            }}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-current-rate">Current interest rate (%)</Label>
                        <Input
                          id="ref-current-rate"
                          type="number"
                          placeholder="-"
                          value={refCurrentRate}
                          onChange={(e) => setRefCurrentRate(e.target.value)}
                          min="0"
                          step="0.01"
                          className="text-lagunita font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={(() => setRefCurrentRate((prev) => {
                              const current = Number.parseFloat(prev || "0");
                              return (current + 0.1).toFixed(1);
                            }))}
                            className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={(() => setRefCurrentRate((prev) => {
                              const current = Number.parseFloat(prev || "0");
                              return Math.max(0, current - 0.1).toFixed(1);
                            }))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-current-monthly-payment">Current monthly payment amount</Label>
                        <Input
                          id="ref-current-monthly-payment"
                          type="number"
                          placeholder="-"
                          value={refCurrentMonthlyPayment}
                          onChange={(e) => setRefCurrentMonthlyPayment(e.target.value)}
                          min="0"
                          step="0.01"
                          className="text-black font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={(() => setRefCurrentMonthlyPayment((prev) => {
                              const current = Number.parseFloat(prev || "0");
                              return (current + 1).toFixed(2);
                            }))}
                            className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={(() => setRefCurrentMonthlyPayment((prev) => {
                              const current = Number.parseFloat(prev || "0");
                              return Math.max(0, current - 0.1).toFixed(1);
                            }))}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="pl-0">
                      <h2 className="mb-4 text-lg text-lagunita font-semibold border-b-1 border-lagunita">New Loan Terms</h2>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-new-loan-amount">New loan amount</Label>
                        <Input
                          id="ref-new-loan-amount"
                          type="number"
                          placeholder="-"
                          value={refNewLoanAmount}
                          onChange={(e) => setRefNewLoanAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          className="text-black font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setRefNewLoanAmount((prev) => {
                              const current = Number.parseFloat(prev || "0");
                              return (current + 1).toFixed(2);
                            })}
                            className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setRefNewLoanAmount((prev) => {
                              const current = Number.parseFloat(prev || "0");
                              return Math.max(0, current - 1).toFixed(2);
                            })}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-new-months">New loan term (months)</Label>
                        <Input
                          id="ref-new-months"
                          type="number"
                          placeholder="-"
                          value={refNewMonths}
                          onChange={(e) => setRefNewMonths(e.target.value)}
                          min="0"
                          step="1"
                          className="text-black font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => {
                              const current = Number.parseInt(refNewMonths || "0");
                              setRefNewMonths((current + 1).toString());
                            }}
                            className="mt-[-6px] mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => {
                              const current = Number.parseInt(refNewMonths || "0");
                              setRefNewMonths(Math.max(0, current - 1).toString());
                            }}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                        <p className="mt-3 text-[14px]">{refNewMonths || "0"} months = {(Number.parseFloat(refNewMonths || "0") / 12).toFixed(1)} years</p>
                      </div>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-new-rate">New annual interest rate (%)</Label>
                        <Input
                          id="ref-new-rate"
                          type="number"
                          placeholder="-"
                          value={refNewRate}
                          onChange={(e) => setRefNewRate(e.target.value)}
                          min="0"
                          step="0.1"
                          className="text-lagunita font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => setRefNewRate((prev) => {
                              const current = Number.parseFloat(prev || "0");
                              return (current + 0.1).toFixed(1);
                            })} 
                            className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => setRefNewRate((prev) => {
                              const current = Number.parseFloat(prev || "0");
                              return Math.max(0, current - 0.1).toFixed(1);
                            })}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>

                      <div className="my-6 border-b-1 border-lagunita"/>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-closing">Closing cost & fees</Label>
                        <Input
                          id="ref-closing"
                          type="number"
                          placeholder="-"
                          value={refClosingCosts}
                          onChange={(e) => setRefClosingCosts(e.target.value)}
                          min="0"
                          step="0.01"
                          className="text-black font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => {
                              const current = Number.parseInt(refClosingCosts || "0");
                              setRefClosingCosts((current + 1).toString());
                            }} 
                            className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => {
                              const current = Number.parseInt(refClosingCosts || "0");
                              setRefClosingCosts(Math.max(0, current - 1).toString());
                            }}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-5 relative">
                        <Label className="font-semibold" htmlFor="ref-years-in-house">Expected years living in house</Label>
                        <Input
                          id="ref-years-in-house"
                          type="number"
                          placeholder="-"
                          value={refYearsIn}
                          onChange={(e) => setRefYearsIn(e.target.value)}
                          min="0"
                          step="1"
                          className="text-black font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => {
                              const current = Number.parseInt(refYearsIn || "0");
                              setRefYearsIn((current + 1).toString());
                            }} 
                            className="mb-[-5px] mt-6 hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => {
                              const current = Number.parseInt(refYearsIn || "0");
                              setRefYearsIn(Math.max(0, current - 1).toString());
                            }}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {refinanceResults && (
                    <div className="bg-[var(--card-background)] rounded-md p-[32px] text-center md:text-left">
                      
                      <div className="text-left">
                        <p className="font-semibold text-lagunita mt-4 mb-2">New monthly payment</p>
                        <p className="text-2xl p-4 bg-lagunita-lighter text-black border-1 border-lagunita rounded-lg font-bold">
                          ${formatCurrency(refinanceResults.newMonthlyPayment)}
                        </p>
                      </div>

                      <div className="text-left">
                        <p className="font-semibold text-lagunita mt-4 mb-2">
                          {refinanceResults.monthlySavings >= 0 ? "Monthly savings" : "Monthly increase"}
                        </p>
                        <p className={`text-2xl p-4 border-1 rounded-lg font-bold ${
                          refinanceResults.monthlySavings >= 0 
                            ? "bg-lagunita-lighter text-black border-1 border-lagunita" 
                            : "bg-berry-light border-berry text-black"
                        }`}>
                          {refinanceResults.monthlySavings >= 0 ? "+" : "-"}$
                          {formatCurrency(Math.abs(refinanceResults.monthlySavings))}
                        </p>
                      </div>

                      <div className="">
                        <p className="text-md font-bold mt-4 mb-2">
                          {refinanceResults.totalSavings >= 0 ? "Refinancing saves you" : "Refinancing costs you"}
                        </p>
                        <p className={`text-4xl font-bold ${
                          refinanceResults.totalSavings >= 0 ? "text-lagunita" : "text-berry"
                        }`}>
                          {refinanceResults.totalSavings >= 0 ? "" : "-"}$
                          {formatCurrency(Math.abs(refinanceResults.totalSavings))}
                        </p>
                      </div>
                    </div>
                  )}

                  {refinanceResults ? (
                    <div className="flex gap-4 w-full md:w-auto">
                      <Button
                        className={`h-18 whitespace-normal cursor-pointer bg-lagunita border-2-lagunita hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white flex-1 md:flex-none`}
                        onClick={calculateRefinance}
                      >
                        Recalculate
                      </Button>
                      <Button
                        className={`h-18 whitespace-normal bg-navy cursor-pointer border-2-navy hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white flex-1 md:flex-none`}
                        onClick={() => { setRefinanceResults(null); setRefCurrentBalance(""); setRefCurrentMonthlyPayment(""); setRefCurrentMonths(""); setRefCurrentRate(""); setRefNewLoanAmount(""); setRefNewRate(""); setRefNewMonths(""); setRefClosingCosts(""); setRefYearsIn(""); }}
                      >
                        Reset
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className={`h-18 whitespace-normal bg-navy cursor-pointer hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white w-full md:w-auto`}
                      onClick={calculateRefinance}
                    >
                      Compare Refinance Options
                    </Button>
                  )}

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  </div>
  )
}