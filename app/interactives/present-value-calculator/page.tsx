"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomSlider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { BiSolidUpArrow } from "react-icons/bi";
import { BiSolidDownArrow } from "react-icons/bi";

export default function PresentValueCalculator() {
  const [futureValue, setFutureValue] = useState(10000)
  const [interestRate, setInterestRate] = useState([5.0])
  const [timePeriod, setTimePeriod] = useState([10])
  const [animatedYear, setAnimatedYear] = useState(timePeriod[0])
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate present value using the formula: PV = FV / (1 + r)^n
  const calculatePresentValue = (years: number) => {
    const rate = interestRate[0] / 100
    const pv = futureValue / Math.pow(1 + rate, years)
    return pv
  }

  // Animate years from 0 to selected
  const handleWatchClick = () => {
    setIsAnimating(true)
    setAnimatedYear(0)
    let current = 0
    const target = timePeriod[0]
    const step = target > 30 ? 2 : 1 // speed up for large numbers
    const interval = setInterval(() => {
      current += step
      if (current >= target) {
        setAnimatedYear(target)
        setIsAnimating(false)
        clearInterval(interval)
      } else {
        setAnimatedYear(current)
      }
    }, 60)
  }

  // Use animatedYear for display if animating, else use selected
  const displayYear = isAnimating ? animatedYear : timePeriod[0]
  const presentValue = calculatePresentValue(displayYear)
  const discountAmount = futureValue - presentValue
  const valueRetained = (presentValue / futureValue) * 100

  return (
    <div className="bg-white p-6 max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            <h1 className="font-poppins text-[20px] lg:text-[50px] font-bold text-black mb-2">Present Value Calculator</h1>
          </div>
          <p className="text-gray-600">Discover how to discount a sum of money due into the future.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Parameters Panel */}
          <Card>
             <CardContent className="space-y-6">
              {/* Future Value Input */}
              <div className="space-y-2 relative">
                <Label htmlFor="future-value" className="text-sm mb-1 block font-bold">
                  Future value ($):
                </Label>
                <Input
                  id="future-value"
                  type="number"
                  value={futureValue}
                  onChange={(e) => setFutureValue(Number(e.target.value))}
                  className="text-charcoal font-bold block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-2 top-[45%] flex flex-col">
                  {/* Increment/Decrement buttons for Future Value */}
                  <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Increase amount"
                  onClick={() => setFutureValue((prev) => prev + 1)}
                  className="hover:text-[#D7D7D7] focus:outline-none"
                  >
                  <BiSolidUpArrow />
                  </button>
                  <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Decrease amount"
                  onClick={() => setFutureValue((prev) => Math.max(0, prev - 1))}
                  className="hover:text-[#D7D7D7] focus:outline-none"
                  >
                  <BiSolidDownArrow />
                  </button>
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-3">
                <Label className="text-sm mb-1 block font-bold">Interest rate (%): <span className="text-lagunita">{interestRate[0].toFixed(1)}% </span></Label>
                <CustomSlider
                  value={interestRate}
                  onValueChange={setInterestRate}
                  max={12}
                  min={0.1}
                  step={0.1}
                  className="w-full border-color-lagunita"
                />
                <div className="flex justify-between text-sm font-bold">
                  <span>0.1%</span>
                  <span>12%</span>
                </div>
              </div>

              {/* Time Period Slider */}
              <div className="space-y-3">
                <Label className="text-sm mb-1 block font-bold">Time period: <span className="text-lagunita">{timePeriod[0]} years</span></Label>
                <CustomSlider 
                  value={timePeriod} 
                  onValueChange={setTimePeriod} 
                  max={50} 
                  min={1} 
                  step={1} 
                  className="w-full" />
                  <div className="flex justify-between text-sm font-bold">
                  <span>1 year</span>
                  <span>50 years</span>
                </div>
              </div>

              {/* Watch Time Impact Button */}
              <Button
                className="w-full py-[35px] px-[30px] text-md font-bold bg-berry hover:bg-gray-800 text-white"
                onClick={handleWatchClick}
                disabled={isAnimating}
              >
                Watch Time Impact
              </Button>
            </CardContent>
          </Card>

          {/* Present Value Calculation Panel */}
          <Card className="bg-grey-med rounded-3xl p-[32px]">
            <CardHeader>
              <CardTitle className="text-center text-md font-normal">Present value calculation</CardTitle>
            </CardHeader>
            <CardContent className="">
              {/* Main Result */}
              <div className="text-center">
                <p className="text-md font-bold mb-2">
                  After {displayYear} {displayYear === 1 ? "year" : "years"}
                </p>
                <p className="text-[40px] font-bold text-palo-verde mb-1">
                  ${presentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-md font-bold">Present value</p>
              </div>

              {/* Calculation Breakdown */}
              <div className="pt-4">
                {/* Results section */}
                <div className="bg-grey-med rounded-lg border border-grey-med">
                    <div className="innerwrapper">
                      <div className="flex flex-col mb-1">
                        <div className="flex align-center flex-row">
                          <div className="w-[50%] text-md  p-4 font-medium text-black rounded-l-lg bg-[#D7D7D7]">
                            Future value:
                          </div>
                          <div className="w-[50%] text-xl p-4 self-center rounded-r-lg bg-grey-med font-bold text-black overflow-hidden text-ellipsis">
                            ${futureValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col  mb-1">
                        <div className={`flex align-center flex-row`}>
                          <div
                            className="w-[50%] text-md p-4 font-medium  rounded-l-lg bg-[#D7D7D7]">
                            Present value:
                          </div>
                          <div
                            className="w-[50%] text-xl p-4 self-center rounded-r-lg text-palo-verde font-bold overflow-hidden bg-grey-med text-ellipsis"
                          >
                            ${presentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col my-3"><hr/></div>
                      <div className="flex flex-col mb-1">
                        <div className={`flex align-center flex-row`}>
                          <div className="w-[50%] text-md p-4 font-medium text-black bg-[#D7D7D7] rounded-l-lg whitespace-nowrap">
                            Discount amount:
                          </div>
                          <div className="w-[50%] text-xl p-4 self-center rounded-r-lg font-bold text-berry bg-[#
                          ]  overflow-hidden text-ellipsis">
                            -${discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col mb-1">
                        <div className={`flex align-center flex-row`}>
                          <div className="w-[50%] text-md p-4 font-medium text-black bg-[#D7D7D7] rounded-l-lg">
                            Value retained:
                          </div>
                          <div className="w-[50%] text-xl p-4 self-center rounded-r-lg font-bold text-black bg-grey-med  overflow-hidden text-ellipsis">
                            {valueRetained.toFixed(1)}%
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
