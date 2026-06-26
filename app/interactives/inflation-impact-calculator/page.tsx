"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/ui/components/card";
import { Input } from "@/app/ui/components/input";
import { Label } from "@/app/ui/components/label";
import { CustomSlider } from "@/app/ui/components/slider";
import { Badge } from "@/app/ui/components/badge";
import ThemeToggle from "@/app/lib/theme-toggle";

const INITIAL_PRICE_MIN = 0.01;
const INITIAL_PRICE_MAX = 1_000_000_000;

type PriceError = "empty" | "range" | null;

function getPriceError(raw: string, numeric: number): PriceError {
  if (raw === "") return "empty";
  if (numeric < INITIAL_PRICE_MIN || numeric > INITIAL_PRICE_MAX)
    return "range";
  return null;
}

function formatWithCommas(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function InflationCalculator() {
  const [initialPriceRaw, setInitialPriceRaw] = useState("100");
  const [initialPriceDisplay, setInitialPriceDisplay] = useState("100");
  const [inflationRate, setInflationRate] = useState(3.5);
  const [timePeriod, setTimePeriod] = useState(10);
  const [futureValue, setFutureValue] = useState<number | null>(0);

  const numericPrice = parseFloat(initialPriceRaw);
  const priceError: PriceError = getPriceError(initialPriceRaw, numericPrice);
  const isValid = priceError === null && !isNaN(numericPrice);

  useEffect(() => {
    if (!isValid) {
      setFutureValue(null);
      return;
    }
    const future = numericPrice * Math.pow(1 + inflationRate / 100, timePeriod);
    setFutureValue(future);
  }, [initialPriceRaw, inflationRate, timePeriod, isValid, numericPrice]);

  const getInflationLabel = (rate: number) => {
    if (rate <= 2.9) return "Low";
    if (rate <= 6) return "Moderate";
    if (rate <= 10) return "High";
    return "Very high";
  };

  const getInflationColor = (rate: number) => {
    if (rate <= 2.9) return "bg-badge-green";
    if (rate <= 6) return "bg-badge-yellow";
    if (rate <= 10) return "bg-badge-orange";
    return "bg-badge-red";
  };

  const priceErrorMessage =
    priceError === "empty"
      ? "Enter an initial amount to see the impact of inflation over time."
      : priceError === "range"
        ? "Enter an amount between $0.01 and $1,000,000,000."
        : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ThemeToggle />
      <div className="max-w-6xl mx-auto">
        <h1 className="sr-only mb-2">Inflation Impact Calculator</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Parameters Panel */}
          <Card>
            <CardContent className="space-y-6">
              <div className="relative">
                <Label htmlFor="initial-price" className="text-md font-medium">
                  Initial price:
                </Label>
                <span
                  className="absolute left-3 top-8.5 text-[var(--color-symbols)] pointer-events-none"
                  aria-hidden="true"
                >
                  $
                </span>
                <Input
                  id="initial-price"
                  type="text"
                  inputMode="numeric"
                  value={initialPriceDisplay}
                  onChange={(e) => {
                    const stripped = e.target.value.replace(/,/g, "");
                    // Allow only digits and a single decimal point
                    if (stripped !== "" && !/^\d*\.?\d*$/.test(stripped))
                      return;
                    setInitialPriceRaw(stripped);
                    const num = parseFloat(stripped);
                    if (!isNaN(num)) {
                      setInitialPriceDisplay(
                        num.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        }),
                      );
                    } else {
                      setInitialPriceDisplay(stripped);
                    }
                  }}
                  onFocus={() => {
                    // Strip commas so the user can edit cleanly
                    setInitialPriceDisplay(initialPriceRaw);
                  }}
                  onBlur={() => {
                    const num = parseFloat(initialPriceRaw);
                    if (!isNaN(num)) {
                      setInitialPriceDisplay(formatWithCommas(num));
                    } else {
                      setInitialPriceDisplay(initialPriceRaw);
                    }
                  }}
                  aria-invalid={priceError !== null}
                  aria-describedby={
                    priceError ? "initial-price-error" : undefined
                  }
                  className={`bg-[var(--input-background)] text-[var(--input-text)] text-md  w-full rounded-md shadow-sm pl-8 border pr-10 ${
                    priceError
                      ? "border-2 border-[var(--color-inline-error)] focus:ring-red-500"
                      : "bg-[var(--input-border)]"
                  }`}
                />
                {priceErrorMessage && (
                  <p
                    id="initial-price-error"
                    role="alert"
                    className="text-sm text-[var(--color-inline-error)] mt-1"
                  >
                    {priceErrorMessage}
                  </p>
                )}
              </div>

              {/* Inflation Rate Slider */}
              <div className="space-y-3 relative">
                <div className="flex sm:items-center space-between gap-2 flex-col sm:flex-row">
                  <Label className="text-md font-bold">
                    Annual inflation rate (%):
                  </Label>
                  <Badge
                    className={`${getInflationColor(inflationRate)} text-black font-bold`}
                  >
                    {inflationRate.toFixed(1)}% -{" "}
                    {getInflationLabel(inflationRate)}
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
                <div className="flex justify-between text-md font-medium font-poppins">
                  <span>0%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Time Period Slider */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Label className="text-md font-bold">
                    Time period:&nbsp;
                  </Label>
                  <span className="text-md font-semibold flex items-center gap-1">
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
                <div className="flex justify-between text-md font-medium font-poppins">
                  <span>1 year</span>
                  <span>50 years</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="rounded-3xl p-[32px] bg-[var(--card-background)]">
            <CardHeader className="py-1">
              <CardTitle className="py-1 font-bold font-poppins">
                Results:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-md font-bold font-poppins text-[var(--color-teal)]">
                After {timePeriod} year{timePeriod !== 1 ? "s" : ""}
              </span>
              <div className="pt-4">
                <div className="rounded-lg">
                  <div className="innerwrapper">
                    <div className="flex flex-row mb-1 bg-[var(--results-white-background)] rounded-lg">
                      <div className="w-[50%] text-md nowrap p-4 font-bold text-black rounded-l-lg bg-grey-med-dark flex items-center">
                        Future price:
                      </div>
                      <div className="w-[50%] bg-[var(--secondary-background)] text-lg-title p-4 rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center">
                        {futureValue !== null
                          ? formatCurrency(futureValue)
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
