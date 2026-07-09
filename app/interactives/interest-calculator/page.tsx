"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FaAngleDown } from "react-icons/fa6";
import ThemeToggle from "@/app/lib/theme-toggle";
import { Button } from "@/app/ui/components/button"

type CompoundingFrequency =
  | "daily"
  | "weekly"
  | "bi-weekly"
  | "monthly"
  | "quarterly"
  | "semi-annually"
  | "annually";

const frequencyMap: Record<
  CompoundingFrequency, { periods: number; label: string; periodLabel: string }
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

// Maximum span the periods field allows, expressed in years.
const MAX_YEARS = 300;

// Any result at or beyond this magnitude is treated as too large to display.
const DISPLAY_CEILING = 1e15;

// Catches Infinity, -Infinity, NaN, or anything past the display ceiling.
const isTooLarge = (value: number) =>
  !Number.isFinite(value) || Math.abs(value) > DISPLAY_CEILING;

function buildPeriodsRangeError(
  freq: CompoundingFrequency,
  max: number,
): string {
  const { periodLabel } = frequencyMap[freq];
  const maxFormatted = max.toLocaleString("en-US");
  if (freq === "annually") {
    return `Enter a number of years between 0 and ${maxFormatted}.`;
  }
  return `Enter a number of ${periodLabel} between 0 and ${maxFormatted}. (${maxFormatted} ${periodLabel} = ${MAX_YEARS} years with ${freqAdjective[freq]} compounding).`;
}

// Adds thousands separators while preserving a leading minus sign and a decimal
// point the user is still typing (e.g. "-" stays "-", "1000." stays "1,000.",
// ".5" stays ".5", "-1000" stays "-1,000").
const formatWithCommas = (raw: string): string => {
  if (raw === "" || raw === "-") return raw;
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const sign = negative ? "-" : "";
  const [intPart, decPart] = unsigned.split(".");
  const intFormatted =
    intPart === "" ? "" : parseInt(intPart, 10).toLocaleString("en-US");
  if (unsigned.includes(".")) {
    return `${sign}${intFormatted}.${decPart ?? ""}`;
  }
  return `${sign}${intFormatted}`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const AMOUNT_MAX = 100_000_000;
const AMOUNT_MIN = 1;
const RATE_MAX = 1000;

// Whole dollars (8) + decimal point + 2 cents = 12 characters of headroom.
// The optional minus sign is not counted against this budget.
const AMOUNT_MAX_CHARS = 12;

export default function InterestRateVisual() {
  const [mode, setMode] = useState<"saving" | "borrowing">("saving");

  // Amount
  const [amountRaw, setAmountRaw] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [amountError, setAmountError] = useState("");

  // Rate
  const [rateRaw, setRateRaw] = useState("");
  const [rateError, setRateError] = useState("");
  const [rateWarning, setRateWarning] = useState("");

  // Periods
  const [periodsRaw, setPeriodsRaw] = useState("");
  const [periodsError, setPeriodsError] = useState("");
  const [periodsWarning, setPeriodsWarning] = useState("");
  const [periodsInfo, setPeriodsInfo] = useState("");

  // Compounding
  const [compounding, setCompounding] =
    useState<CompoundingFrequency>("annually");

  // Debounced values for calculation
  const [debounced, setDebounced] = useState({
    amount: "",
    rate: "",
    periods: "",
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

  const maxPeriods = frequencyMap[compounding].periods * MAX_YEARS;

  // Derived error state
  const anyFieldEmpty =
    amountRaw === "" || rateRaw === "" || periodsRaw === "";
  const hasValidationError =
    !!amountError || !!rateError || !!periodsError;
  const hasError = anyFieldEmpty || hasValidationError;

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

  // A finite, valid calculation whose magnitude is beyond what we can render.
  const resultTooLarge =
    !hasError && (isTooLarge(interestAmount) || isTooLarge(totalAmount));

  // Reset everything back to the empty default state.
  const handleReset = () => {
    setMode("saving");
    setAmountRaw("");
    setAmountDisplay("");
    setAmountError("");
    setRateRaw("");
    setRateError("");
    setRateWarning("");
    setPeriodsRaw("");
    setPeriodsError("");
    setPeriodsWarning("");
    setPeriodsInfo("");
    setCompounding("annually");
    setDebounced({
      amount: "",
      rate: "",
      periods: "",
      compounding: "annually",
    });
  };

  // Amount handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stripped = e.target.value.replace(/,/g, "");
    // Allow empty, an optional leading minus, digits, an optional single decimal
    // point, and up to 2 decimals. The minus is kept so an invalid negative
    // entry stays visible and can be flagged rather than silently cleared.
    if (stripped !== "" && !/^-?\d*\.?\d{0,2}$/.test(stripped)) return;
    // Count value digits only; the sign does not eat into the character budget.
    if (stripped.replace("-", "").length > AMOUNT_MAX_CHARS) return;
    setAmountRaw(stripped);
    setAmountDisplay(formatWithCommas(stripped));
    const num = parseFloat(stripped);
    if (!isNaN(num)) {
      if (num < AMOUNT_MIN || num > AMOUNT_MAX) {
        setAmountError(
          `Enter an amount between $${AMOUNT_MIN} and $${AMOUNT_MAX.toLocaleString("en-US")}.`,
        );
      } else {
        setAmountError("");
      }
    } else {
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
      setAmountDisplay(num.toLocaleString("en-US", { maximumFractionDigits: 2 }));
      if (num < AMOUNT_MIN || num > AMOUNT_MAX) {
        setAmountError(
          `Enter an amount between $${AMOUNT_MIN} and $${AMOUNT_MAX.toLocaleString("en-US")}.`,
        );
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
          ? "At 0%, no interest is earned or charged. Final amount equals initial amount."
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
          ? "0 periods means no time passes. Final amount will equal the initial amount."
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
      const newMax = frequencyMap[freq].periods * MAX_YEARS;
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
        {/* Mode toggle (spans the full width above the two columns) */}
        <div className="flex flex-col mb-6">
          <h2 className="font-poppins text-lg-title text-[var(--foreground)] font-bold mb-1">I am:</h2>
          <div className="flex-1 flex gap-4">
            <button
              className={`group min-w-[150px] flex-1 px-4 py-2 h-18 text-md font-bold rounded-lg border-1 border-lagunita hover:bg-lagunita ${mode === "saving" ? "bg-lagunita" : ""}`}
              onClick={() => setMode("saving")}
              aria-pressed={mode === "saving"}
            >
              <div className="flex-1 flex gap-3 align-center justify-center">
                <div
                  className={`self-center ${mode === "saving" ? "text-white" : "text-[var(--foreground)] group-hover:text-white"}`}
                >
                  Saving
                </div>
              </div>
            </button>
            <button
              className={`group min-w-[150px] flex-1 px-4 py-2 h-18 text-md font-bold rounded-lg border-1 border-berry hover:bg-[var(--button-berry)] ${mode === "borrowing" ? "bg-berry" : ""}`}
              onClick={() => setMode("borrowing")}
              aria-pressed={mode === "borrowing"}
            >
              <div className="flex-1 flex gap-3 align-center justify-center">
                <div
                  className={`self-center ${mode === "borrowing" ? "text-white" : "text-[var(--foreground)] group-hover:text-white"}`}
                >
                  Borrowing
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Two-column layout: inputs on the left, results card on the right */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 items-start">
          {/* LEFT: inputs */}
          <div>
            {/* Amount + Rate */}
            <div className="flex flex-col gap-6 mb-6">
              {/* Initial Amount */}
              <div className="flex-1 min-w-[150px] space-y-1">
                <label
                  htmlFor="initial-amount"
                  className="block text-md font-medium text-[var(--foreground)]"
                >
                  Initial amount
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
                    inputMode="decimal"
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
                  Annual interest rate
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
                      rateError
                        ? "border-2 border-[var(--color-inline-error)]"
                        : rateWarning
                          ? "border-2 border-[var(--color-inline-warning)]"
                          : ""
                    }`}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                  >
                    %
                  </span>
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

            {/* Periods + Compounding */}
            <div className="flex flex-col gap-6 mb-6">
              {/* Periods */}
              <div className="flex-1 min-w-[150px] space-y-1">
                <label
                  htmlFor="periods"
                  className="block text-md font-medium text-[var(--foreground)]"
                >
                  Number of compounding periods
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
                  Compounding frequency
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

            {/* Reset */}
            <div className="flex justify-start">
              <Button
                type="button"
                variant="lagunita"
                size="sm"
                className="mt-4"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* RIGHT: results */}
          <div className="p-4 rounded-lg bg-[var(--card-background)]">
            <h2 className="font-poppins text-lg-title text-[var(--foreground)] font-bold pb-4">
              {mode === "saving" ? "What you'll have" : "What you'd owe"}
            </h2>
            <div aria-live="polite" aria-atomic="true">
              <div className="innerwrapper">
                {/* Too-large remedial line, shown once under the results */}
                {resultTooLarge && (
                  <p className="font-bold m-2 text-[var(--color-inline-error)]">
                    Try a lower rate or fewer periods.
                  </p>
                )}

                {/* Second helper: borrowing context, shown under the results */}
                {mode === "borrowing" && !hasError && (
                  <p className="font-bold m-2 text-[var(--foreground)]">
                    This shows how the balance grows if left unpaid.
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
                  className="flex flex-col sm:flex-row rounded-lg mb-1 sm:bg-[var(--results-white-background)]"
                >
                  <div
                    className={`w-full sm:w-[50%] p-4 font-bold text-white rounded-lg sm:rounded-l-lg sm:rounded-r-none ${mode === "saving" ? "bg-palo-verde" : "bg-berry"}`}
                  >
                    {mode === "saving" ? "Interest earned" : "Interest paid"}:
                  </div>
                  <div
                    className={`w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis ${mode === "saving" ? "text-[var(--color-palo-verde-var)]" : "text-[var(--color-berry)]"}`}
                  >
                    {hasError
                      ? "-"
                      : resultTooLarge
                        ? "Too large to display"
                        : formatCurrency(Math.abs(interestAmount))}
                  </div>
                </div>

                {/* Final amount row */}
                <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                  <div className="w-full sm:w-[50%] p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none">
                    Final amount:
                  </div>
                  <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis">
                    {hasError
                      ? "-"
                      : resultTooLarge
                        ? "Too large to display"
                        : formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="mt-6">
                {mode === "saving" ? (
                  <h2 className="text-md font-bold text-[var(--color-palo-verde-var)] mb-2">
                    When you save:
                  </h2>
                ) : (
                  <h2 className="text-md font-bold text-[var(--color-berry)] mb-2">
                    When you borrow:
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
    </div>
  );
}
