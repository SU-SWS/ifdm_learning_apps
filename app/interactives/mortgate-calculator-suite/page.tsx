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
  const [refCurrentRate, setRefCurrentRate] = useState("")
  const [refCurrentMonths, setRefCurrentMonths] = useState("")
  const [refNewRate, setRefNewRate] = useState("")
  const [refNewMonths, setRefNewMonths] = useState("")
  const [refClosingCosts, setRefClosingCosts] = useState("")
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
    const currentR = Number.parseFloat(refCurrentRate) / 100 / 12
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

    const monthlySavings = currentMonthlyPayment - newMonthlyPayment
    const totalCurrentCost = currentMonthlyPayment * currentM
    const totalNewCost = newMonthlyPayment * newM + closingCosts
    const totalSavings = totalCurrentCost - totalNewCost
    const breakEvenMonths = monthlySavings > 0 ? closingCosts / monthlySavings : 0

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
                  <div className="space-y-2">
                    <Label htmlFor="months">Months Remaining on Loan</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="rate">Annual Interest Rate (%)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="payment">Monthly Payment Amount ($)</Label>
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

                  <Button onClick={calculateBalance} className="w-full">
                    Calculate Current Balance
                  </Button>

                  {currentBalance !== null && (
                    <div className="mt-6 p-6 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Current Mortgage Balance</p>
                      <p className="text-3xl font-bold">
                        ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="refinance">
              <Card>
                <CardHeader>
                  <CardTitle>Refinance Analysis</CardTitle>
                  <CardDescription>Compare your current mortgage with refinancing options.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="ref-balance">Current Mortgage Balance ($)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="ref-current-rate">Current Annual Interest Rate (%)</Label>
                    <Input
                      id="ref-current-rate"
                      type="number"
                      placeholder="Enter current rate"
                      value={refCurrentRate}
                      onChange={(e) => setRefCurrentRate(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ref-current-months">Months Remaining on Current Loan</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="ref-new-rate">New Annual Interest Rate (%)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="ref-new-months">New Loan Term (Months)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="ref-closing">Closing Costs ($)</Label>
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

                  <Button onClick={calculateRefinance} className="w-full">
                    Compare Refinance Options
                  </Button>

                  {refinanceResults && (
                    <div className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Current Monthly Payment</p>
                          <p className="text-2xl font-bold">
                            $
                            {refinanceResults.currentMonthlyPayment.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>

                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">New Monthly Payment</p>
                          <p className="text-2xl font-bold">
                            $
                            {refinanceResults.newMonthlyPayment.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                        <p className="text-sm text-muted-foreground mb-1">Monthly Savings</p>
                        <p className="text-3xl font-bold text-primary">
                          $
                          {refinanceResults.monthlySavings.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Total Current Cost</p>
                          <p className="text-lg font-semibold">
                            $
                            {refinanceResults.totalCurrentCost.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>

                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Total New Cost</p>
                          <p className="text-lg font-semibold">
                            $
                            {refinanceResults.totalNewCost.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Lifetime Savings</p>
                        <p className="text-2xl font-bold">
                          $
                          {refinanceResults.totalSavings.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Break-Even Point</p>
                        <p className="text-xl font-semibold">{refinanceResults.breakEvenMonths.toFixed(1)} months</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Time needed to recover closing costs through monthly savings
                        </p>
                      </div>
                    </div>
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
