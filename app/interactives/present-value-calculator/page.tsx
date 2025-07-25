"use client"

import { useState } from "react"
import { FaArrowTrendDown, FaAngleDown } from "react-icons/fa6";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"


export default function PresentValueCalculator() {
  const [futureValue, setFutureValue] = useState(10000)
  const [interestRate, setInterestRate] = useState([5.0])
  const [timePeriod, setTimePeriod] = useState([10])

  // Calculate present value using the formula: PV = FV / (1 + r)^n
  const calculatePresentValue = () => {
    const rate = interestRate[0] / 100
    const years = timePeriod[0]
    const pv = futureValue / Math.pow(1 + rate, years)
    return pv
  }

  const presentValue = calculatePresentValue()
  const discountAmount = futureValue - presentValue
  const valueRetained = (presentValue / futureValue) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaArrowTrendDown className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Present Value Calculator</h1>
          </div>
          <p className="text-gray-600">Discover how to discount a sum of money due into the future</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Parameters Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Future Value Input */}
              <div className="space-y-2">
                <Label htmlFor="future-value" className="text-sm font-medium">
                  $ Future Value
                </Label>
                <Input
                  id="future-value"
                  type="number"
                  value={futureValue}
                  onChange={(e) => setFutureValue(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">% Interest Rate: {interestRate[0].toFixed(1)}%</Label>
                <Slider
                  value={interestRate}
                  onValueChange={setInterestRate}
                  max={20}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Time Period Slider */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">⏱ Time Period: {timePeriod[0]} years</Label>
                <Slider value={timePeriod} onValueChange={setTimePeriod} max={50} min={1} step={1} className="w-full" />
              </div>

              {/* Watch Time Impact Button */}
              <Button className="w-full bg-black hover:bg-gray-800 text-white">Watch Time Impact</Button>
            </CardContent>
          </Card>

          {/* Present Value Calculation Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Present Value Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Result */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">After {timePeriod[0]} years</p>
                <p className="text-4xl font-bold text-green-600 mb-1">
                  ${presentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">Present Value</p>
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Future Value:</span>
                  <span className="font-medium">
                    ${futureValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Present Value:</span>
                  <span className="font-medium text-green-600">
                    ${presentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Discount Amount:</span>
                  <span className="font-medium text-red-600">
                    -${discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Value Retained:</span>
                  <span className="font-medium">{valueRetained.toFixed(1)}%</span>
                </div>
              </div>

              {/* Formula Display */}
              <div className="bg-blue-50 p-4 rounded-lg border-t">
                <p className="text-sm text-gray-600 mb-2">Formula Used:</p>
                <p className="text-sm font-mono text-blue-800 mb-1">PV = FV ÷ (1 + r)^n</p>
                <p className="text-xs font-mono text-blue-600">
                  PV = ${futureValue.toLocaleString()} ÷ (1 + {(interestRate[0] / 100).toFixed(3)})^{timePeriod[0]}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Educational Content */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3">Understanding Present Value</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Present Value (PV) is a financial concept that determines the current worth of a future sum of money,
              given a specified rate of return. The calculation accounts for the time value of money - the principle
              that money available today is worth more than the same amount in the future due to its potential earning
              capacity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
