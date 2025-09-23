"use client";

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { CustomSlider } from "@/app/ui/components/slider"
import { Badge } from "@/app/ui/components/badge"
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";
import ThemeToggle from "@/app/lib/theme-toggle";

export default function InflationCalculator() {
  const [initialPrice, setInitialPrice] = useState(100)
  const [inflationRate, setInflationRate] = useState(3.5)
  const [timePeriod, setTimePeriod] = useState(10)
  const [futureValue, setFutureValue] = useState(0)

  // Calculate future value based on compound inflation
  useEffect(() => {
    const future = initialPrice * Math.pow(1 + inflationRate / 100, timePeriod)
    setFutureValue(future)
  }, [initialPrice, inflationRate, timePeriod])

  const getInflationLabel = (rate: number) => {
    if (rate <= 2.9) return "Low"
    if (rate <= 6) return "Moderate"
    if (rate <= 10) return "High"
    return "Very High"
  }

  const getInflationColor = (rate: number) => {
    if (rate <= 2.9) return "bg-badge-green" // Green
    if (rate <= 6) return "bg-badge-yellow" // Yellow
    if (rate <= 10) return "bg-badge-orange" // Orange
    return "bg-badge-red" // Red
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ThemeToggle />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <h1 className="sr-only mb-2">Inflation Impact Calculator</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Parameters Panel */}
          <Card>
            <CardContent className="space-y-6">
              {/* Future Value Input */}
              <div className="space-y-2 relative">
                <Label htmlFor="initial-price" className="text-md font-medium">
                  Initial price ($):
                </Label>

                <Input
                  id="initial-price"
                  type="number"
                  value={initialPrice === 0 ? "" : initialPrice}
                  
                  onChange={(e) => setInitialPrice(Number(e.target.value) || 0)}
                  className="bg-[var(--input-background)] text-[var(--input-text)] bg-[var(--input-border)] text-md font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  max="1000000"
                />
                <div className="absolute right-2 top-[38%] flex flex-col">
                  {/* Increment/Decrement buttons for Future Value */}
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Increase amount"
                    onClick={() => setInitialPrice((prev) => prev + 1)}
                    className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                  >
                    <BiSolidUpArrow size={24} />
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Decrease amount"
                    onClick={() => setInitialPrice((prev) => Math.max(1, prev - 1))}
                    className="hover:text-grey-med-dark focus:outline-none"
                  >
                    <BiSolidDownArrow size={24} />
                  </button>
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-3 relative">
                  <div className="flex sm:items-center space-between gap-2 flex-col sm:flex-row">
                    <Label className="text-md font-bold">Annual inflation rate (%):</Label>
                    <Badge className={`${getInflationColor(inflationRate)} text-black font-bold`}>
                      {inflationRate.toFixed(1)}% - {getInflationLabel(inflationRate)}
                    </Badge>
                  </div>
                 <CustomSlider
                  value={[inflationRate]}
                  onValueChange={(value) => setInflationRate(value[0])}
                  max={15}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-md text-black font-medium font-poppins">
                  <span>0%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Time Period Slider */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Label className="text-md font-bold">Time period:&nbsp;</Label>
                  <span className="text-md font-semibold flex items-center gap-1 text-lagunita">
                    {timePeriod} year{timePeriod !== 1 ? "s" : ""}
                  </span>
                </div>
                <CustomSlider
                  value={[timePeriod]}
                  onValueChange={(value) => setTimePeriod(value[0])}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                  rangeClassName="time-period-range bg-lagunita-light"
                />
                <div className="flex justify-between text-md text-black font-medium font-poppins">
                  <span>1 year</span>
                  <span>50 years</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Present Value Calculation Panel */}
          <Card className="rounded-3xl p-[32px] bg-[var(--card-background)]">
            <CardHeader className="py-1">
              <CardTitle className="py-1 font-bold font-poppins">Results:</CardTitle>
            </CardHeader>
            <CardContent className="">
              {/* Main Result */}
             <span className="text-md font-bold font-poppins text-lagunita">
                After {timePeriod} year{timePeriod !== 1 ? "s" : ""}
              </span>
              {/* Calculation Breakdown */}
              <div className="pt-4">
                {/* Results section */}
                <div className="rounded-lg">
                    <div className="innerwrapper">
                      <div className="flex flex-row mb-1 bg-[var(--results-white-background)] rounded-lg">
                        <div className="w-[50%] text-md nowrap p-4 font-bold text-black rounded-l-lg bg-grey-med-dark flex items-center">
                          Future price:
                        </div>
                        <div className="w-[50%] bg-[var(--secondary-background)] text-lg-title p-4 rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center">
                          ${futureValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  {/* Wrapper section ends */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
