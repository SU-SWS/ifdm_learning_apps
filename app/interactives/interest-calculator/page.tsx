"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FaPiggyBank } from "react-icons/fa";
import { FaArrowTrendDown, FaAngleDown } from "react-icons/fa6";
import { BiSolidUpArrow, BiSolidDownArrow } from "react-icons/bi";
import ThemeToggle from "@/app/lib/theme-toggle";

type CompoundingFrequency =
  | "daily"
  | "weekly"
  | "bi-weekly"
  | "monthly"
  | "quarterly"
  | "semi-annually"
  | "annually";

const frequencyMap: Record<
  CompoundingFrequency,
  { periods: number; label: string; periodLabel: string }
> = {
  daily: { periods: 365, label: "Daily", periodLabel: "days" },
  weekly: { periods: 52, label: "Weekly", periodLabel: "weeks" },
  "bi-weekly": {
    periods: 26,
    label: "Bi-weekly",
    periodLabel: "bi-weekly periods",
  },
  monthly: { periods: 12, label: "Monthly", periodLabel: "months" },
  quarterly: { periods: 4, label: "Quarterly", periodLabel: "quarters" },
  "semi-annually": {
    periods: 2,
    label: "Semi-annually",
    periodLabel: "semi-annual periods",
  },
  annually: { periods: 1, label: "Annually", periodLabel: "years" },
};

const freqAdjective: Record<CompoundingFrequency, string> = {
  daily: "daily",
  weekly: "weekly",
  "bi-weekly": "biweekly",
  monthly: "monthly",
  quarterly: "quarterly",
  "semi-annually": "semiannual",
  annually: "annual",
};

function buildPeriodsRangeError(
  freq: CompoundingFrequency,
  max: number,
): string {
  const { periodLabel } = frequencyMap[freq];
  const maxFormatted = max.toLocaleString("en-US");
  if (freq === "annually") {
    return `Enter a number of years between 0 and ${maxFormatted}.`;
  }
  return `Enter a number of ${periodLabel} between 0 and ${maxFormatted}. (${maxFormatted} ${periodLabel} = 100 years with ${freqAdjective[freq]} compounding).`;
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

const AMOUNT_MAX = 100_000_000;
const RATE_MAX = 1000;

export default function InterestRateVisual() {
  const [mode, setMode] = useState<"saving" | "borrowing">("saving");

  // Amount
  const [amountRaw, setAmountRaw] = useState("100");
  const [amountDisplay, setAmountDisplay] = useState("100");
  const [amountError, setAmountError] = useState("");

  // Rate
  const [rateRaw, setRateRaw] = useState("5");
  const [rateError, setRateError] = useState("");
  const [rateWarning, setRateWarning] = useState("");

  // Periods
  const [periodsRaw, setPeriodsRaw] = useState("10");
  const [periodsError, setPeriodsError] = useState("");
  const [periodsWarning, setPeriodsWarning] = useState("");
  const [periodsInfo, setPeriodsInfo] = useState("");

  // Compounding
  const [compounding, setCompounding] =
    useState<CompoundingFrequency>("annually");

  // Debounced values for calculation
  const [debounced, setDebounced] = useState({
    amount: "100",
    rate: "5",
    periods: "10",
    compounding: "annually" as CompoundingFrequency,
  });

  useEffect(() => {
    const t = setTimeout(
      () =>
        setDebounced({
          amount: amountRaw,
          rate: rateRaw,
          periods: periodsRaw,
          compounding,
        }),
      300,
    );
    return () => clearTimeout(t);
  }, [amountRaw, rateRaw, periodsRaw, compounding]);

  const maxPeriods = frequencyMap[compounding].periods * 100;

  // Derived error state
  const hasError =
    amountRaw === "" ||
    rateRaw === "" ||
    periodsRaw === "" ||
    !!amountError ||
    !!rateError ||
    !!periodsError;

  // Calculations
  const { interestAmount, totalAmount } = useMemo(() => {
    if (hasError) return { interestAmount: 0, totalAmount: 0 };

    const amount = parseFloat(debounced.amount) || 0;
    const rate = (parseFloat(debounced.rate) || 0) / 100;
    const periodsPerYear = frequencyMap[debounced.compounding].periods;
    const periodicRate = rate / periodsPerYear;
    // Round periods to nearest whole number per spec
    const periods = Math.round(parseFloat(debounced.periods) || 0);

    const calculatedTotal = amount * Math.pow(1 + periodicRate, periods);
    const calculatedInterest = calculatedTotal - amount;

    return {
      interestAmount:
        mode === "saving" ? calculatedInterest : -calculatedInterest,
      totalAmount:
        mode === "saving" ? calculatedTotal : amount + calculatedInterest,
    };
  }, [debounced, hasError, mode]);

  // Amount handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stripped = e.target.value.replace(/,/g, "");
    if (stripped !== "" && !/^\d*\.?\d*$/.test(stripped)) return;
    setAmountRaw(stripped);
    const num = parseFloat(stripped);
    if (!isNaN(num)) {
      setAmountDisplay(
        num.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      );
      if (num < 0 || num > AMOUNT_MAX) {
        setAmountError("Enter an amount between $0 and $100,000,000.");
      } else {
        setAmountError("");
      }
    } else {
      setAmountDisplay(stripped);
      setAmountError("");
    }
  };

  const handleAmountBlur = () => {
    const num = parseFloat(amountRaw);
    if (amountRaw === "" || isNaN(num)) {
      setAmountRaw("");
      setAmountDisplay("");
      setTimeout(() => setAmountError("Please enter an initial amount."), 150);
    } else {
      setAmountDisplay(formatWithCommas(num));
      if (num < 0 || num > AMOUNT_MAX) {
        setAmountError("Enter an amount between $0 and $100,000,000.");
      } else {
        setAmountError("");
      }
    }
  };

  // Rate handlers
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setRateRaw("");
      setRateError("");
      setRateWarning("");
      return;
    }
    const val = parseFloat(raw);
    setRateRaw(raw);
    if (val < 0 || val > RATE_MAX) {
      setRateError("Enter a rate between 0% and 1,000%.");
      setRateWarning("");
    } else {
      setRateError("");
      setRateWarning(
        val === 0
          ? "At 0%, no interest is earned or charged — final amount equals initial amount."
          : "",
      );
    }
  };

  const handleRateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || isNaN(parseFloat(raw))) {
      setRateRaw("");
      setRateWarning("");
      setTimeout(() => setRateError("Please enter an interest rate."), 150);
    }
  };

  // Periods handlers
  const handlePeriodsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setPeriodsRaw("");
      setPeriodsError("");
      setPeriodsWarning("");
      setPeriodsInfo("");
      return;
    }
    const val = parseFloat(raw);
    setPeriodsRaw(raw);
    if (val < 0 || val > maxPeriods) {
      setPeriodsError(buildPeriodsRangeError(compounding, maxPeriods));
      setPeriodsWarning("");
      setPeriodsInfo("");
    } else {
      setPeriodsError("");
      setPeriodsWarning(
        val === 0
          ? "0 periods means no time passes — final amount will equal the initial amount."
          : "",
      );
      setPeriodsInfo(
        val > 0 && !Number.isInteger(val)
          ? "Rounded to the nearest whole period for calculation."
          : "",
      );
    }
  };

  const handlePeriodsBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || isNaN(parseFloat(raw))) {
      setPeriodsRaw("");
      setTimeout(
        () =>
          setPeriodsError("Please enter the number of compounding periods."),
        150,
      );
    }
  };

  // Revalidate periods when compounding frequency changes
  const handleCompoundingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const freq = e.target.value as CompoundingFrequency;
    setCompounding(freq);
    if (periodsRaw !== "") {
      const newMax = frequencyMap[freq].periods * 100;
      const val = parseFloat(periodsRaw);
      if (val > newMax) {
        setPeriodsError(buildPeriodsRangeError(freq, newMax));
      } else {
        setPeriodsError("");
      }
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ThemeToggle />
      <h1 className="sr-only">Interest Calculator</h1>

      <div className="mb-8">
        {/* Mode toggle */}
        <div className="flex flex-col mb-6">
          <h2 className="font-poppins text-lg-title text-[var(--foreground)] font-bold mb-1">
            I am:
          </h2>
          <div className="flex-1 flex gap-4">
            <button
              className={`group min-w-[150px] flex-1 py-2 px-3 text-md font-bold rounded-lg border-1 border-palo-verde hover:bg-[var(--button-green)] ${mode === "saving" ? "bg-palo-verde" : ""}`}
              onClick={() => setMode("saving")}
              aria-pressed={mode === "saving"}
            >
              <div className="flex-1 flex gap-3 align-center justify-center">
                <div
                  className={`text-3xl self-center ${mode === "saving" ? "text-white" : "text-palo-verde group-hover:text-white"}`}
                >
                  <FaPiggyBank />
                </div>
                <div
                  className={`self-center ${mode === "saving" ? "text-white" : "text-[var(--foreground)] group-hover:text-white"}`}
                >
                  Saving
                </div>
              </div>
            </button>
            <button
              className={`group min-w-[150px] flex-1 py-2 px-3 text-md font-bold rounded-lg border-1 border-berry hover:bg-[var(--button-berry)] ${mode === "borrowing" ? "bg-berry" : ""}`}
              onClick={() => setMode("borrowing")}
              aria-pressed={mode === "borrowing"}
            >
              <div className="flex-1 flex gap-3 align-center justify-center">
                <div
                  className={`text-3xl self-center ${mode === "borrowing" ? "text-white" : "text-berry group-hover:text-white"}`}
                >
                  <FaArrowTrendDown />
                </div>
                <div
                  className={`self-center ${mode === "borrowing" ? "text-white" : "text-[var(--foreground)] group-hover:text-white"}`}
                >
                  Borrowing
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Row 1: Amount + Rate */}
        <div className="flex flex-wrap gap-4 mb-6 flex-col md:flex-row">
          {/* Initial Amount */}
          <div className="flex-1 min-w-[150px] space-y-1">
            <label
              htmlFor="initial-amount"
              className="block text-md font-medium text-[var(--foreground)]"
            >
              Initial amount:
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
              >
                $
              </span>
              <input
                id="initial-amount"
                type="text"
                inputMode="numeric"
                placeholder="Enter amount"
                value={amountDisplay}
                onChange={handleAmountChange}
                onFocus={() => setAmountDisplay(amountRaw)}
                onBlur={handleAmountBlur}
                aria-invalid={!!amountError}
                aria-describedby="amount-msg"
                className={`block w-full rounded-md shadow-sm py-2 pl-7 pr-10 border ${amountError ? "border-2 border-[var(--color-inline-error)]" : ""}`}
              />
            </div>
            <p
              id="amount-msg"
              role="alert"
              className={`text-sm font-semibold mt-1 ${amountError ? "text-[var(--color-inline-error)]" : "sr-only"}`}
            >
              {amountError || ""}
            </p>
          </div>

          {/* Interest Rate */}
          <div className="flex-1 min-w-[150px] space-y-1">
            <label
              htmlFor="interest-rate"
              className="block text-md font-medium text-[var(--foreground)]"
            >
              Interest rate:
            </label>
            <div className="relative">
              <input
                id="interest-rate"
                type="number"
                inputMode="numeric"
                min={0}
                max={RATE_MAX}
                step={0.1}
                placeholder="Enter rate"
                value={rateRaw}
                onChange={handleRateChange}
                onBlur={handleRateBlur}
                aria-invalid={!!rateError}
                aria-describedby="rate-msg"
                className={`block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  mode === "borrowing" ? "text-berry" : "text-lagunita"
                } ${
                  rateError
                    ? "border-2 border-[var(--color-inline-error)]"
                    : rateWarning
                      ? "border-2 border-[var(--color-inline-warning)]"
                      : ""
                }`}
              />
            </div>
            <p
              id="rate-msg"
              role={rateError ? "alert" : undefined}
              className={`text-sm font-semibold mt-1 ${
                rateError
                  ? "text-[var(--color-inline-error)]"
                  : rateWarning
                    ? "text-[var(--color-inline-warning)]"
                    : "sr-only"
              }`}
            >
              {rateError || rateWarning || ""}
            </p>
          </div>
        </div>

        {/* Row 2: Periods + Compounding */}
        <div className="flex flex-wrap gap-4 mb-6 flex-col md:flex-row">
          {/* Periods */}
          <div className="flex-1 min-w-[150px] space-y-1">
            <label
              htmlFor="periods"
              className="block text-md font-medium text-[var(--foreground)]"
            >
              Number of compounding periods:
            </label>
            <div className="relative">
              <input
                id="periods"
                type="number"
                inputMode="numeric"
                min={0}
                max={maxPeriods}
                step={1}
                placeholder="Enter periods"
                value={periodsRaw}
                onChange={handlePeriodsChange}
                onBlur={handlePeriodsBlur}
                aria-invalid={!!periodsError}
                aria-describedby="periods-msg"
                className={`block w-full rounded-md shadow-sm py-2 px-3 border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  periodsError
                    ? "border-2 border-[var(--color-inline-error)]"
                    : periodsWarning
                      ? "border-2 border-[var(--color-inline-warning)]"
                      : ""
                }`}
              />
            </div>
            <p
              id="periods-msg"
              role={periodsError ? "alert" : undefined}
              className={`text-sm font-semibold mt-1 ${
                periodsError
                  ? "text-[var(--color-inline-error)]"
                  : periodsWarning
                    ? "text-[var(--color-inline-warning)]"
                    : periodsInfo
                      ? "text-[var(--foreground)]"
                      : "sr-only"
              }`}
            >
              {periodsError || periodsWarning || periodsInfo || ""}
            </p>
          </div>

          {/* Compounding */}
          <div className="flex-1 min-w-[150px] space-y-1">
            <label
              htmlFor="compounding"
              className="block text-md font-medium text-[var(--foreground)]"
            >
              Compounding:
            </label>
            <div className="relative">
              <select
                id="compounding"
                value={compounding}
                onChange={handleCompoundingChange}
                className="block w-full rounded-md shadow-sm py-2 px-3 border appearance-none"
              >
                {Object.entries(frequencyMap).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                <FaAngleDown />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6 p-4 rounded-lg bg-[var(--card-background)]">
          <h2 className="font-poppins text-lg-title text-[var(--foreground)] font-bold pb-4">
            Results:
          </h2>
          <div
            aria-live="polite"
            aria-atomic="true"
            className="lg:grid lg:grid-cols-2 lg:gap-15"
          >
            <div className="innerwrapper">
              {hasError && (
                <p className="text-sm text-[var(--foreground)] mb-3">
                  Fix the highlighted field to see results.
                </p>
              )}

              {/* Initial amount row */}
              <div className="flex flex-col sm:flex-row mb-1 rounded-lg sm:bg-[var(--results-white-background)]">
                <div className="w-full sm:w-[50%] p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                  Initial amount:
                </div>
                <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg bg-[var(--secondary-background)] font-bold text-[var(--foreground)] overflow-hidden text-ellipsis">
                  {hasError ? "-" : formatCurrency(parseFloat(amountRaw) || 0)}
                </div>
              </div>

              {/* Interest row */}
              <div
                className={`flex flex-col sm:flex-row rounded-lg mb-1 ${mode === "saving" ? "bg-palo-verde-light" : "bg-berry-light"}`}
              >
                <div
                  className={`w-full sm:w-[50%] p-4 font-bold text-white rounded-lg sm:rounded-l-lg sm:rounded-r-none ${mode === "saving" ? "bg-palo-verde" : "bg-berry"}`}
                >
                  {mode === "saving" ? "Interest earned" : "Interest paid"}:
                </div>
                <div
                  className={`w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis ${mode === "saving" ? "bg-palo-verde-light text-palo-verde" : "bg-berry-light text-berry"}`}
                >
                  {hasError ? "-" : formatCurrency(Math.abs(interestAmount))}
                </div>
              </div>

              {/* Final amount row */}
              <div className="flex flex-col sm:flex-row mb-1 bg-[var(--results-blue-background)] rounded-lg">
                <div className="w-full sm:w-[50%] p-4 font-bold text-white bg-navy rounded-lg sm:rounded-l-lg sm:rounded-r-none">
                  Final amount:
                </div>
                <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] bg-[var(--results-blue-background)] overflow-hidden text-ellipsis">
                  {hasError ? "-" : formatCurrency(totalAmount)}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-6 py-4 align-self-top lg:mt-0 lg:py-0">
              {mode === "saving" ? (
                <h2 className="text-md font-bold text-palo-verde mb-2">
                  <FaPiggyBank className="w-[1.7em] h-[1.7em]" /> When you save:
                </h2>
              ) : (
                <h2 className="text-md font-bold text-berry mb-2">
                  <FaArrowTrendDown className="w-[1.7em] h-[1.7em]" /> When you
                  borrow:
                </h2>
              )}
              <p className="text-[var(--foreground)] mb-2 text-md">
                {mode === "saving"
                  ? "You are essentially a lender, and you get interest from those using your money."
                  : "You are paying interest for the privilege of using someone else's money."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
