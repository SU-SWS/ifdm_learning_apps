"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomSlider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { BiSolidUpArrow } from "react-icons/bi";
import { BiSolidDownArrow } from "react-icons/bi";


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
    if (rate <= 2) return "Low"
    if (rate <= 3.5) return "Moderate"
    if (rate <= 6) return "High"
    return "Very High"
  }

  const getInflationColor = (rate: number) => {
    if (rate <= 2) return "bg-badge-green" // Green
    if (rate <= 3.5) return "bg-badge-yellow" // Yellow
    if (rate <= 6) return "bg-badge-orange" // Orange
    return "bg-badge-red" // Red
  }

  return (
    <div className="bg-white p-6 max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <h1 className="font-poppins text-[20px] lg:text-[50px] font-bold text-black mb-2">Inflation Impact Calculator</h1>
          </div>
          <p>Use the sliders below to see how different inflation rates and time periods affect your money</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Parameters Panel */}
          <Card>
            <CardContent className="space-y-6">
              {/* Future Value Input */}
              <div className="space-y-2 relative">
                <Label htmlFor="initial-price" className="text-sm font-medium">
                  Initial amount ($):
                </Label>

                <Input
                  id="initial-amount"
                  type="number"
                  value={initialPrice === 0 ? "" : initialPrice}
                  
                  onChange={(e) => setInitialPrice(Number(e.target.value) || 0)}
                  className="text-charcoal font-bold block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  max="1000000"
                />
                <div className="absolute right-2 top-[45%] flex flex-col">
                  {/* Increment/Decrement buttons for Future Value */}
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Increase amount"
                    onClick={() => setInitialPrice((prev) => prev + 1)}
                    className="hover:text-grey-med-dark focus:outline-none"
                  >
                    <BiSolidUpArrow />
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Decrease amount"
                    onClick={() => setInitialPrice((prev) => Math.max(1, prev - 1))}
                    className="hover:text-grey-med-dark focus:outline-none"
                  >
                    <BiSolidDownArrow />
                  </button>
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-3 relative">
                  <div className="flex items-center space-between gap-2">
                    <Label className="text-sm font-bold">Annual inflation rate (%):</Label>
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
                <div className="absolute top-15 text-lagunita text-sm font-bold text-foreground font-poppins"
                  style={{
                    left: `${(inflationRate / 15) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {inflationRate.toFixed(1)}%
                </div>
                <div className="flex justify-between text-sm text-black font-medium font-poppins">
                  <span>0%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Time Period Slider */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Label className="text-sm font-bold">Time period: </Label>
                  <span className="text-sm font-semibold flex items-center gap-1 text-lagunita">
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
                <div className="flex justify-between text-sm text-black font-medium font-poppins">
                  <span>1 year</span>
                  <span>50 years</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Present Value Calculation Panel */}
          <Card className="bg-grey-med rounded-3xl p-[32px]">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-poppins">Results:</CardTitle>
            </CardHeader>
            <CardContent className="">
              {/* Main Result */}
             <span className="text-sm font-bold font-poppins text-lagunita">
                After {timePeriod} year{timePeriod !== 1 ? "s" : ""}
              </span>
              {/* Calculation Breakdown */}
              <div className="pt-4">
                {/* Results section */}
                <div className="bg-grey-med rounded-lg border border-grey-med">
                    <div className="innerwrapper">
                      <div className="flex flex-col mb-1">
                        <div className="flex align-center flex-row">
                          <div className="w-[50%] text-md  p-4 font-bold text-black rounded-l-lg bg-grey-med-dark">
                            Future price:
                          </div>
                          <div className="w-[50%] text-xl p-4 self-center rounded-r-lg bg-grey-light font-bold text-black overflow-hidden text-ellipsis">
                            ${futureValue.toFixed(2)}
                          </div>
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
