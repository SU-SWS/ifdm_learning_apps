"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Label } from "@/app/ui/components/label"
import { Input } from "@/app/ui/components/input"
import { Button } from "@/app/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs"
import ThemeToggle from "@/app/lib/theme-toggle";

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
    let newMonthlyPayment: number
    if (newR === 0) {
      newMonthlyPayment = currentBal / newM
    } else {
      newMonthlyPayment = (currentBal * (newR * Math.pow(1 + newR, newM))) / (Math.pow(1 + newR, newM) - 1)
    }

    const monthlySavings = newMonthlyPayment - currentMonthlyPayment  // Difference: new minus current
    const totalCurrentCost = currentMonthlyPayment * currentM
    const totalNewCost = newMonthlyPayment * newM + closingCosts
    const totalSavings = totalCurrentCost - totalNewCost
    const breakEvenMonths = monthlySavings < 0 ? closingCosts / (-monthlySavings) : 0

    setRefinanceResults({
      currentMonthlyPayment,
      newMonthlyPayment,
      monthlySavings,
      totalCurrentCost,
      totalNewCost,
      totalSavings,
      breakEvenMonths,
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        {/* Header */}
        <h1 className="sr-only">Debt Payoff Calculator</h1>
        {/* Mode Selection */}
        <div className="mb-8">

          <Tabs defaultValue="current-balance" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current-balance">Current Balance</TabsTrigger>
              <TabsTrigger value="refinance">Refinance Analysis</TabsTrigger>
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
                  <div className="mb-5">
                    <Label className="font-semibold" htmlFor="months">Months remaining on loan</Label>
                    <Input
                      id="months"
                      type="number"
                      placeholder="Enter months"
                      value={monthsRemaining}
                      onChange={(e) => setMonthsRemaining(e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="mb-5">
                    <Label className="font-semibold" htmlFor="rate">Annual interest rate (%)</Label>
                    <Input
                      id="rate"
                      type="number"
                      placeholder="Enter annual rate"
                      value={annualRate}
                      onChange={(e) => setAnnualRate(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="mb-5">
                    <Label className="font-semibold" htmlFor="payment">Monthly payment amount ($)</Label>
                    <Input
                      id="payment"
                      type="number"
                      placeholder="Enter monthly payment"
                      value={monthlyPayment}
                      onChange={(e) => setMonthlyPayment(e.target.value)}
                      min="0"
                      step="0.01"
                    />
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
                    className={`h-18 whitespace-normal bg-navy hover:bg-grey-700 text-white w-full md:w-auto`}
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
                  <CardDescription>Compare your current mortgage with refinancing options.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="md:grid md:grid-cols-2 gap-4">
                    <div className="p-4">
                      <h2 className="mb-4 text-lg text-lagunita font-semibold border-b-1 border-lagunita">Current Loan Term</h2>
                  
                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-balance">Remaining balance ($)</Label>
                        <Input
                          id="ref-balance"
                          type="number"
                          placeholder="Enter current balance"
                          value={refCurrentBalance}
                          onChange={(e) => setRefCurrentBalance(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-current-months">Months remaining on loan</Label>
                        <Input
                          id="ref-current-months"
                          type="number"
                          placeholder="Enter months remaining"
                          value={refCurrentMonths}
                          onChange={(e) => setRefCurrentMonths(e.target.value)}
                          min="0"
                          step="1"
                        />
                      </div>

                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-current-rate">Current annual interest rate (%)</Label>
                        <Input
                          id="ref-current-rate"
                          type="number"
                          placeholder="Enter current rate"
                          value={refCurrentRate}  // Fixed: Use refCurrentRate instead of annualRate
                          onChange={(e) => setRefCurrentRate(e.target.value)}  // Fixed: Use setRefCurrentRate
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-current-monthly-payment">Current monthly payment amount</Label>
                        <Input
                          id="ref-current-monthly-payment"
                          type="number"
                          placeholder="Enter payment amount"
                          value={refCurrentMonthlyPayment}
                          onChange={(e) => setRefCurrentMonthlyPayment(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <h2 className="mb-4 text-lg text-lagunita font-semibold border-b-1 border-lagunita">New Loan Terms</h2>

                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-new-loan-amount">New loan amount</Label>
                        <Input
                          id="ref-new-loan-amount"
                          type="number"
                          placeholder="Enter new loan amount"
                          value={refNewLoanAmount}
                          onChange={(e) => setRefNewLoanAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-new-months">New loan term (months)</Label>
                        <Input
                          id="ref-new-months"
                          type="number"
                          placeholder="Enter new term"
                          value={refNewMonths}
                          onChange={(e) => setRefNewMonths(e.target.value)}
                          min="0"
                          step="1"
                        />
                      </div>

                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-new-rate">New annual interest rate (%)</Label>
                        <Input
                          id="ref-new-rate"
                          type="number"
                          placeholder="Enter new rate"
                          value={refNewRate}
                          onChange={(e) => setRefNewRate(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="my-6 border-b-1 border-lagunita"/>

                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-closing">Closing cost and fees</Label>
                        <Input
                          id="ref-closing"
                          type="number"
                          placeholder="Enter closing costs"
                          value={refClosingCosts}
                          onChange={(e) => setRefClosingCosts(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="mb-5">
                        <Label className="font-semibold" htmlFor="ref-years-in-house">Expected years living in house</Label>
                        <Input
                          id="ref-years-in-house"
                          type="number"
                          placeholder="Enter years in house"
                          value={refYearsIn}
                          onChange={(e) => setRefYearsIn(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {refinanceResults && (
                    <div className="bg-[var(--card-background)] rounded-md p-[32px] text-center md:text-left">

                      <div className="">
                        <p className="font-semibold text-lagunita mt-4 mb-2">New monthly payment</p>
                        <p className="text-2xl p-4 bg-lagunita-lighter text-black border-1 border-lagunita rounded-lg font-bold">
                          $
                          {refinanceResults.newMonthlyPayment.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="">
                        <p className="font-semibold text-lagunita mt-4 mb-2">Difference in monthly payment</p>
                          <p className="text-2xl p-4 text-black bg-lagunita-lighter border-1 border-lagunita rounded-lg font-bold">
                          $
                          {refinanceResults.monthlySavings.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="">
                        <p className="text-md font-bold mt-4 mb-2">Refinancing saves you</p>
                           <p className="text-4xl font-bold text-lagunita">
                          $
                          {refinanceResults.totalSavings.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    className={`h-18 whitespace-normal bg-navy hover:bg-grey-700 text-white w-full md:w-auto`}
                    onClick={refinanceResults ? () => { setRefinanceResults(null); setRefCurrentBalance(""); setRefCurrentMonthlyPayment(""); setRefCurrentMonths(""); setRefCurrentRate(""); setRefNewLoanAmount(""); setRefNewRate(""); setRefNewMonths(""); setRefClosingCosts(""); setRefYearsIn(""); } : calculateRefinance}
                  >
                    {refinanceResults ? "Reset" : "Compare Refinance Options"}
                  </Button>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  </div>
  )
}