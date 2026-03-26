"use client";

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card"
import { Input } from "@/app/ui/components/input"
import { Label } from "@/app/ui/components/label"
import { CustomSlider } from "@/app/ui/components/slider"
import { Button } from "@/app/ui/components/button"
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";
import ThemeToggle from "@/app/lib/theme-toggle";

export default function PresentValueCalculator() {
  const [futureValue, setFutureValue] = useState(1000)
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

  return (
    <div className=" p-6 max-w-5xl mx-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="sr-only mb-2">Present Value Calculator</h1>
        <ThemeToggle />
        <div className="flex flex-col md:flex-row gap-8">
          {/* Parameters Panel */}
          <Card className="flex-1">
             <CardContent className="space-y-6">
              {/* Future Value Input */}
              <div className="space-y-2 relative">
                <Label htmlFor="future-value" className="text-md mb-1 block font-bold">
                  Future value ($):
                </Label>
                <Input
                  id="future-value"
                  type="number"
                  value={futureValue === 0 ? "" : futureValue}
                  onChange={(e) => setFutureValue(Number(e.target.value))}
                  className="text-md font-bold block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-2 top-[41%] flex flex-col">
                  {/* Increment/Decrement buttons for Future Value */}
                  <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Increase amount"
                  onClick={() => setFutureValue((prev) => prev + 1)}
                  className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                  >
                  <BiSolidUpArrow size={24} />
                  </button>
                  <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Decrease amount"
                  onClick={() => setFutureValue((prev) => Math.max(0, prev - 1))}
                  className="hover:text-grey-med-dark focus:outline-none"
                  >
                  <BiSolidDownArrow size={24} />
                  </button>
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-3">
                <Label className="text-md mb-1 block font-bold">Interest rate (%): <span className="text-lagunita">{interestRate[0].toFixed(1)} </span></Label>
                <CustomSlider
                  value={interestRate}
                  onValueChange={setInterestRate}
                  max={12}
                  min={0.1}
                  step={0.1}
                  className="w-full border-color-lagunita"
                />
                <div className="flex justify-between text-black font-medium font-poppins">
                  <span>0.1%</span>
                  <span>12%</span>
                </div>
              </div>

              {/* Time Period Slider */}
              <div className="space-y-3">
                <Label className="text-md mb-1 block font-bold">Time period: <span className="text-lagunita">{timePeriod[0]} years</span></Label>
                <CustomSlider
                  value={timePeriod}
                  onValueChange={setTimePeriod}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                  rangeClassName="time-period-range bg-lagunita-light"/>
                  <div className="flex justify-between text-black font-medium font-poppins">
                  <span>1 year</span>
                  <span>50 years</span>
                </div>
              </div>

              {/* Watch the impact of time Button */}
              <Button
                className="w-full py-[35px] px-[30px] font-bold bg-berry hover:bg-[var(--button-berry)] text-white"
                onClick={handleWatchClick}
                disabled={isAnimating}
                size="watch"
              >
                Watch the Impact of Time
              </Button>
            </CardContent>
          </Card>

          {/* Present Value Calculation Panel */}
          <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
            <CardHeader className="pb-2">
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
              <div className="pt-6">
                {/* Results section */}
                <div className="rounded-lg">
                  <div className="innerwrapper">
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                      <div
                          className="w-full sm:w-[50%] text-md  p-4 font-bold text-black rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark items-center">
                        Future value:
                      </div>
                      <div
                          className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                        ${futureValue.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                      <div
                          className="w-full sm:w-[50%] text-md p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                        Present value:
                      </div>
                      <div
                          className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg text-palo-verde font-bold overflow-hidden text-ellipsis bg-[var(--secondary-background)]"
                      >
                        ${presentValue.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}

                      </div>
                    </div>
                    <div className="flex flex-col my-3">
                      <hr/>
                    </div>
                    <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                      <div
                          className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                        Discount amount:
                      </div>
                      <div
                          className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold text-berry overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                        -${discountAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
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
