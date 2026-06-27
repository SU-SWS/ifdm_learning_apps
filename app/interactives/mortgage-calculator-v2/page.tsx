"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ThemeToggle from "@/app/lib/theme-toggle";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/ui/components/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/ui/components/card";
import InfoPopover from "@/app/ui/components/popover";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHLY_PAYMENT_MIN = 1;
const MONTHLY_PAYMENT_MAX = 1_000_000;
const HOME_PRICE_MIN = 1;
const HOME_PRICE_MAX = 1_000_000_000;
const DOWN_PAYMENT_DOLLAR_MAX = 1_000_000_000;
const INTEREST_RATE_MAX = 20;
const PROPERTY_TAX_RATE_MAX = 10;
const INSURANCE_RATE_MAX = 10;
const HOA_MAX = 20_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) => {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const clampNonNeg = (value: number) => Math.max(0, Number(value) || 0);
const clampDownPayment = (amount: number, price: number) =>
  Math.max(0, Math.min(amount, price));

// ─── Types ────────────────────────────────────────────────────────────────────

interface Results {
  homePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyMortgage: number;
  monthlyTax: number;
  monthlyInsurance: number;
  hoaDues: number;
  totalMonthlyHousingCost: number;
}

const EMPTY_RESULTS: Results = {
  homePrice: 0,
  downPayment: 0,
  loanAmount: 0,
  monthlyMortgage: 0,
  monthlyTax: 0,
  monthlyInsurance: 0,
  hoaDues: 0,
  totalMonthlyHousingCost: 0,
};

// ─── FieldMessage ─────────────────────────────────────────────────────────────

interface FieldMessageProps {
  id: string;
  error?: string;
  warning?: string;
  info?: string;
}

const FieldMessage = ({ id, error, warning, info }: FieldMessageProps) => {
  const message = error || warning || info || "";
  const colorClass = error
    ? "text-[var(--color-inline-error)]"
    : warning
      ? "text-[var(--color-inline-warning)]"
      : "text-[var(--foreground)] opacity-70";
  return (
    <p
      id={id}
      role={error ? "alert" : undefined}
      className={`text-sm font-semibold mt-1 ${message ? colorClass : "sr-only"}`}
    >
      {message || ""}
    </p>
  );
};

// ─── ResultRow ────────────────────────────────────────────────────────────────

interface ResultRowProps {
  label: string;
  value: number;
  highlight?: boolean;
}

const ResultRow = ({ label, value, highlight }: ResultRowProps) => (
  <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
    <div
      className={`w-full sm:w-[50%] text-md p-4 font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center ${
        highlight ? "text-white bg-navy" : "text-black bg-grey-med-dark"
      }`}
    >
      {label}
    </div>
    <div
      className={`w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center ${
        highlight
          ? "bg-lagunita-lighter text-black"
          : "bg-[var(--secondary-background)]"
      }`}
    >
      {formatCurrency(value)}
    </div>
  </div>
);

// ─── ResultsPanel ─────────────────────────────────────────────────────────────

interface ResultsPanelProps {
  tab: "afford" | "payment";
  hasError: boolean;
  results: Results;
}

const ResultsPanel = ({ tab, hasError, results }: ResultsPanelProps) => {
  const headline =
    tab === "afford"
      ? { label: "Estimated home price", value: results.homePrice }
      : {
          label: "Estimated monthly mortgage payment",
          value: results.monthlyMortgage,
        };

  return (
    <Card
      aria-live="polite"
      aria-atomic="true"
      className="bg-[var(--card-background)] rounded-3xl p-[32px]"
    >
      {!hasError ? (
        <>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-bold">
              {headline.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--color-teal)] mb-6">
              {formatCurrency(headline.value)}
            </p>
            <div className="rounded-lg">
              <ResultRow label="Down payment:" value={results.downPayment} />
              <ResultRow label="Loan amount:" value={results.loanAmount} />
              <div className="flex flex-col my-3">
                <h3 className="text-lg font-bold mb-4">Monthly breakdown</h3>
                <hr />
              </div>
              <ResultRow
                label="Mortgage payment:"
                value={results.monthlyMortgage}
              />
              <ResultRow label="Property taxes:" value={results.monthlyTax} />
              <ResultRow label="Insurance:" value={results.monthlyInsurance} />
              <ResultRow label="HOA:" value={results.hoaDues} />
              <ResultRow
                label="Total monthly housing cost:"
                value={results.totalMonthlyHousingCost}
                highlight
              />
              <div className="py-5">
                <p className="text-sm">
                  {tab === "afford"
                    ? "This estimate is based on the portion of your monthly budget allocated to principal and interest. Taxes, insurance, and HOA are shown separately."
                    : "This estimate shows your monthly mortgage payment based on the loan amount, interest rate, and term. Taxes, insurance, and HOA are shown separately."}
                </p>
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <div className="min-h-[28rem]" />
      )}
    </Card>
  );
};

// ─── InterestRateField ────────────────────────────────────────────────────────

interface InterestRateFieldProps {
  idSuffix: string;
  value: string;
  error: string;
  onChange: (raw: string) => void;
  onBlur: () => void;
}

const InterestRateField = ({
  idSuffix,
  value,
  error,
  onChange,
  onBlur,
}: InterestRateFieldProps) => (
  <div className="pb-5">
    <label
      htmlFor={`interest-rate-${idSuffix}`}
      className="block text-sm font-semibold mb-1"
    >
      Interest rate
    </label>
    <div className="relative">
      <input
        id={`interest-rate-${idSuffix}`}
        type="number"
        step="0.1"
        min="0"
        max={INTEREST_RATE_MAX}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={`interest-rate-${idSuffix}-msg`}
        className={`w-full pr-8 pl-4 py-3 border-2 rounded-lg outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          error
            ? "border-[var(--color-inline-error)]"
            : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        }`}
      />
      <span
        aria-hidden="true"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
      >
        %
      </span>
    </div>
    <FieldMessage id={`interest-rate-${idSuffix}-msg`} error={error} />
  </div>
);

// ─── LoanTermField ────────────────────────────────────────────────────────────

interface LoanTermFieldProps {
  idSuffix: string;
  value: number;
  onChange: (term: number) => void;
}

const LoanTermField = ({ idSuffix, value, onChange }: LoanTermFieldProps) => (
  <div className="pb-5">
    <fieldset className="border-0 p-0 m-0">
      <legend className="block text-sm font-semibold mb-2">Loan term</legend>
      <div className="flex flex-col sm:flex-row gap-2">
        {[15, 30].map((term) => (
          <label key={term} className="flex-1 cursor-pointer flex flex-row">
            <input
              type="radio"
              name={`loanTerm-${idSuffix}`}
              value={term}
              checked={value === term}
              onChange={() => onChange(term)}
              className="mr-3 w-4 accent-lagunita"
            />
            <span
              className={`self-center ${value === term ? "font-semibold" : "font-normal"}`}
            >
              {term} years
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  </div>
);

// ─── DownPaymentField ─────────────────────────────────────────────────────────

interface DownPaymentFieldProps {
  idSuffix: string;
  mode: string;
  percentInput: string;
  amountInput: string;
  percentError: string;
  amountError: string;
  priceForDollarCap: number;
  onModeChange: (mode: string) => void;
  onPercentChange: (raw: string) => void;
  onAmountChange: (raw: string) => void;
}

const DownPaymentField = ({
  idSuffix,
  mode,
  percentInput,
  amountInput,
  percentError,
  amountError,
  onModeChange,
  onPercentChange,
  onAmountChange,
}: DownPaymentFieldProps) => (
  <div className="pb-5">
    <div className="flex flex-row pb-2 justify-between items-center">
      <span className="block text-sm font-semibold">Down payment</span>
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Down payment type</legend>
        <div className="flex flex-row gap-4">
          {(["percentage", "dollar"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`downPaymentMode-${idSuffix}`}
                checked={mode === opt}
                onChange={() => onModeChange(opt)}
                className="w-4 h-4 accent-lagunita cursor-pointer"
              />
              <span
                className={`text-xs transition ${mode === opt ? "font-semibold" : ""}`}
              >
                {opt === "percentage" ? "Percent" : "Dollars"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>

    {mode === "percentage" ? (
      <div className="relative">
        <input
          id={`down-payment-percent-${idSuffix}`}
          type="number"
          min="0"
          max="99.9"
          step="0.01"
          value={percentInput}
          onChange={(e) => onPercentChange(e.target.value)}
          aria-invalid={!!percentError}
          aria-describedby={`down-payment-${idSuffix}-msg`}
          aria-label="Down payment percentage"
          className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            percentError
              ? "border-[var(--color-inline-error)]"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
        />
        <span
          aria-hidden="true"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
        >
          %
        </span>
      </div>
    ) : (
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
        >
          $
        </span>
        <input
          id={`down-payment-amount-${idSuffix}`}
          type="text"
          inputMode="numeric"
          value={
            amountInput
              ? Number(amountInput.replace(/,/g, "")).toLocaleString("en-US")
              : ""
          }
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "");
            if (raw !== "" && !/^\d*$/.test(raw)) return;
            onAmountChange(raw);
          }}
          aria-invalid={!!amountError}
          aria-describedby={`down-payment-${idSuffix}-msg`}
          aria-label="Down payment amount in dollars"
          className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg outline-none transition ${
            amountError
              ? "border-[var(--color-inline-error)]"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
        />
      </div>
    )}
    <FieldMessage
      id={`down-payment-${idSuffix}-msg`}
      error={percentError || amountError}
    />
    <p className="text-xs mt-1">Enter 0 if no down payment is planned.</p>
  </div>
);

// ─── PropertyTaxField ─────────────────────────────────────────────────────────

interface PropertyTaxFieldProps {
  idSuffix: string;
  mode: string;
  percent: string;
  amount: number;
  error: string;
  onModeChange: (mode: string) => void;
  onPercentChange: (raw: string) => void;
  onAmountChange: (val: number) => void;
}

const PropertyTaxField = ({
  idSuffix,
  mode,
  percent,
  amount,
  error,
  onModeChange,
  onPercentChange,
  onAmountChange,
}: PropertyTaxFieldProps) => (
  <div className="pb-5">
    <div className="flex flex-row pb-2 justify-between items-center">
      <span className="block text-sm font-semibold">
        Property taxes (annual)
      </span>
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Property tax input type</legend>
        <div className="flex flex-row gap-4">
          {(["percentage", "dollar"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`propertyTaxMode-${idSuffix}`}
                checked={mode === opt}
                onChange={() => onModeChange(opt)}
                className="w-4 h-4 accent-lagunita cursor-pointer"
              />
              <span
                className={`text-xs ${mode === opt ? "font-semibold" : ""}`}
              >
                {opt === "percentage" ? "Percent" : "Dollars"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
    {mode === "percentage" ? (
      <div className="relative">
        <input
          id={`property-tax-percent-${idSuffix}`}
          type="number"
          step="0.01"
          min="0"
          max={PROPERTY_TAX_RATE_MAX}
          value={percent}
          onChange={(e) => onPercentChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={`property-tax-${idSuffix}-msg`}
          aria-label="Property tax percentage"
          className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            error
              ? "border-[var(--color-inline-error)]"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
        />
        <span
          aria-hidden="true"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
        >
          %
        </span>
      </div>
    ) : (
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
        >
          $
        </span>
        <input
          id={`property-tax-amount-${idSuffix}`}
          type="text"
          inputMode="numeric"
          value={amount ? Math.round(amount).toLocaleString("en-US") : ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "");
            if (raw !== "" && !/^\d*$/.test(raw)) return;
            onAmountChange(raw === "" ? 0 : clampNonNeg(Number(raw)));
          }}
          aria-invalid={!!error}
          aria-describedby={`property-tax-${idSuffix}-msg`}
          aria-label="Property tax annual dollar amount"
          className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg outline-none transition ${
            error
              ? "border-[var(--color-inline-error)]"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
        />
      </div>
    )}
    <FieldMessage id={`property-tax-${idSuffix}-msg`} error={error} />
  </div>
);

// ─── HomeInsuranceField ───────────────────────────────────────────────────────

interface HomeInsuranceFieldProps {
  idSuffix: string;
  mode: string;
  percent: string;
  amount: number;
  error: string;
  onModeChange: (mode: string) => void;
  onPercentChange: (raw: string) => void;
  onAmountChange: (val: number) => void;
}

const HomeInsuranceField = ({
  idSuffix,
  mode,
  percent,
  amount,
  error,
  onModeChange,
  onPercentChange,
  onAmountChange,
}: HomeInsuranceFieldProps) => (
  <div className="pb-5">
    <div className="flex flex-row pb-2 justify-between items-center">
      <span className="block text-sm font-semibold">
        Homeowners insurance (annual)
      </span>
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Home insurance input type</legend>
        <div className="flex flex-row gap-4">
          {(["percentage", "dollar"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`homeInsuranceMode-${idSuffix}`}
                checked={mode === opt}
                onChange={() => onModeChange(opt)}
                className="w-4 h-4 accent-lagunita cursor-pointer"
              />
              <span
                className={`text-xs ${mode === opt ? "font-semibold" : ""}`}
              >
                {opt === "percentage" ? "Percent" : "Dollars"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
    {mode === "percentage" ? (
      <div className="relative">
        <input
          id={`home-insurance-percent-${idSuffix}`}
          type="number"
          step="0.01"
          min="0"
          max={INSURANCE_RATE_MAX}
          value={percent}
          onChange={(e) => onPercentChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={`home-insurance-${idSuffix}-msg`}
          aria-label="Home insurance percentage"
          className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            error
              ? "border-[var(--color-inline-error)]"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
        />
        <span
          aria-hidden="true"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
        >
          %
        </span>
      </div>
    ) : (
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
        >
          $
        </span>
        <input
          id={`home-insurance-amount-${idSuffix}`}
          type="text"
          inputMode="numeric"
          value={amount ? Math.round(amount).toLocaleString("en-US") : ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/,/g, "");
            if (raw !== "" && !/^\d*$/.test(raw)) return;
            onAmountChange(raw === "" ? 0 : clampNonNeg(Number(raw)));
          }}
          aria-invalid={!!error}
          aria-describedby={`home-insurance-${idSuffix}-msg`}
          aria-label="Home insurance annual dollar amount"
          className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg outline-none transition ${
            error
              ? "border-[var(--color-inline-error)]"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
        />
      </div>
    )}
    <FieldMessage id={`home-insurance-${idSuffix}-msg`} error={error} />
  </div>
);

// ─── HoaField ─────────────────────────────────────────────────────────────────

interface HoaFieldProps {
  idSuffix: string;
  value: string;
  error: string;
  onChange: (raw: string) => void;
}

const HoaField = ({ idSuffix, value, error, onChange }: HoaFieldProps) => (
  <div className="pb-5">
    <label
      htmlFor={`hoa-dues-${idSuffix}`}
      className="block text-sm font-semibold mb-1"
    >
      HOA dues (monthly)
    </label>
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] font-medium"
      >
        $
      </span>
      <input
        id={`hoa-dues-${idSuffix}`}
        type="text"
        inputMode="numeric"
        value={value ? Number(value).toLocaleString("en-US") : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/,/g, "");
          if (raw !== "" && !/^\d*$/.test(raw)) return;
          onChange(raw);
        }}
        aria-invalid={!!error}
        aria-describedby={`hoa-dues-${idSuffix}-msg`}
        className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg outline-none transition ${
          error
            ? "border-[var(--color-inline-error)]"
            : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        }`}
      />
    </div>
    <FieldMessage id={`hoa-dues-${idSuffix}-msg`} error={error} />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function MortgageCalculator() {
  const [mode, setMode] = useState("afford");

  // Shared inputs
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState(30);

  // Down payment -- single source of truth is the numeric values.
  // The display inputs are kept in sync by the handlers, never by
  // the calculation function.
  const [downPaymentMode, setDownPaymentMode] = useState("percentage");
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [downPaymentPercentInput, setDownPaymentPercentInput] = useState("20");
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);
  const [downPaymentAmountInput, setDownPaymentAmountInput] = useState("");

  const [propertyTaxMode, setPropertyTaxMode] = useState("percentage");
  const [propertyTaxPercentInput, setPropertyTaxPercentInput] =
    useState("1.25");
  const [propertyTaxAmount, setPropertyTaxAmount] = useState(0);
  const [homeInsuranceMode, setHomeInsuranceMode] = useState("percentage");
  const [homeInsurancePercentInput, setHomeInsurancePercentInput] =
    useState("0.35");
  const [homeInsuranceAmount, setHomeInsuranceAmount] = useState(0);
  const [hoaDues, setHoaDues] = useState("");

  // Tab 1 inputs
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [monthlyPaymentDisplay, setMonthlyPaymentDisplay] = useState("");

  // Tab 1 output -- used for the dollar→percent conversion display in Tab 1
  const [calculatedHomePrice, setCalculatedHomePrice] = useState(0);

  // Tab 2 inputs
  const [homePrice, setHomePrice] = useState("");
  const [homePriceDisplay, setHomePriceDisplay] = useState("");

  // Errors
  const [interestRateError, setInterestRateError] = useState("");
  const [downPaymentPercentError, setDownPaymentPercentError] = useState("");
  const [downPaymentAmountError, setDownPaymentAmountError] = useState("");
  const [propertyTaxError, setPropertyTaxError] = useState("");
  const [homeInsuranceError, setHomeInsuranceError] = useState("");
  const [hoaDuesError, setHoaDuesError] = useState("");
  const [monthlyPaymentError, setMonthlyPaymentError] = useState("");
  const [homePriceError, setHomePriceError] = useState("");

  const [results, setResults] = useState<Results>(EMPTY_RESULTS);

  // Parsed numeric values -- derived from string inputs, never stored separately
  const propertyTaxPercent = parseFloat(propertyTaxPercentInput) || 0;
  const homeInsurancePercent = parseFloat(homeInsurancePercentInput) || 0;

  // The reference price for relative validations:
  // Tab 1: use the back-calculated home price from the last successful calc
  // Tab 2: use the home price input directly
  const referencePrice =
    mode === "afford" ? calculatedHomePrice : Number(homePrice);

  // In Tab 1 dollar mode, the percent display is derived from the calculation
  // output -- it is NOT fed back into the calculation.
  // We compute it here purely for display.
  const affordDollarModePercentDisplay =
    downPaymentMode === "dollar" && calculatedHomePrice > 0
      ? ((downPaymentAmount / calculatedHomePrice) * 100).toFixed(2)
      : "";

  // ─── Validators ─────────────────────────────────────────────────────────

  const validateInterestRate = useCallback((raw: string): string => {
    if (raw === "") return "Please enter an interest rate.";
    const val = Number(raw);
    if (val < 0 || val > INTEREST_RATE_MAX)
      return "Please enter an interest rate between 0 and 20%.";
    return "";
  }, []);

  const validatePropertyTax = useCallback(
    (
      taxMode: string,
      percent: number,
      amount: number,
      price: number,
    ): string => {
      if (taxMode === "percentage") {
        if (percent < 0 || percent > PROPERTY_TAX_RATE_MAX)
          return "Enter a property tax rate between 0 and 10%. Rates beyond this are unusual.";
      } else {
        if (price > 0 && amount > price * (PROPERTY_TAX_RATE_MAX / 100))
          return "Enter a property tax amount that is between 0 and 10% of the home price. Amounts beyond this are unusual.";
      }
      return "";
    },
    [],
  );

  const validateHomeInsurance = useCallback(
    (
      insMode: string,
      percent: number,
      amount: number,
      price: number,
    ): string => {
      if (insMode === "percentage") {
        if (percent < 0 || percent > INSURANCE_RATE_MAX)
          return "Enter a homeowners insurance rate between 0 and 10%. Rates beyond this are unusual.";
      } else {
        if (price > 0 && amount > price * (INSURANCE_RATE_MAX / 100))
          return "Enter an amount for homeowners insurance between 0 and 10% of the home price. Amounts beyond this are unusual.";
      }
      return "";
    },
    [],
  );

  const validateHoa = useCallback((raw: string): string => {
    if (raw === "") return "";
    const val = Number(raw);
    if (val < 0 || val > HOA_MAX)
      return "Enter an amount between $0 and $20,000.";
    return "";
  }, []);

  // ─── Re-validate relative fields when reference price changes ────────────

  useEffect(() => {
    if (referencePrice > 0) {
      setPropertyTaxError(
        validatePropertyTax(
          propertyTaxMode,
          propertyTaxPercent,
          propertyTaxAmount,
          referencePrice,
        ),
      );
      setHomeInsuranceError(
        validateHomeInsurance(
          homeInsuranceMode,
          homeInsurancePercent,
          homeInsuranceAmount,
          referencePrice,
        ),
      );
      if (mode === "payment" && downPaymentMode === "dollar") {
        const amt = Number(downPaymentAmountInput.replace(/,/g, ""));
        if (amt < 0) {
          setDownPaymentAmountError(
            "Down payment cannot be negative. Enter 0 if no down payment is planned.",
          );
        } else if (amt >= referencePrice) {
          setDownPaymentAmountError(
            "Your down payment can't exceed the home price. Try lowering it.",
          );
        } else {
          setDownPaymentAmountError("");
        }
      }
    }
  }, [
    referencePrice,
    propertyTaxMode,
    propertyTaxPercent,
    propertyTaxAmount,
    homeInsuranceMode,
    homeInsurancePercent,
    homeInsuranceAmount,
    mode,
    downPaymentMode,
    downPaymentAmountInput,
    validatePropertyTax,
    validateHomeInsurance,
  ]);

  // ─── Blocking error checks ───────────────────────────────────────────────

  const affordHasError = useMemo(
    () =>
      monthlyPayment === "" ||
      interestRate === "" ||
      !!monthlyPaymentError ||
      !!interestRateError ||
      !!downPaymentPercentError ||
      !!downPaymentAmountError ||
      !!propertyTaxError ||
      !!homeInsuranceError ||
      !!hoaDuesError,
    [
      monthlyPayment,
      interestRate,
      monthlyPaymentError,
      interestRateError,
      downPaymentPercentError,
      downPaymentAmountError,
      propertyTaxError,
      homeInsuranceError,
      hoaDuesError,
    ],
  );

  const paymentHasError = useMemo(
    () =>
      homePrice === "" ||
      interestRate === "" ||
      !!homePriceError ||
      !!interestRateError ||
      !!downPaymentPercentError ||
      !!downPaymentAmountError ||
      !!propertyTaxError ||
      !!homeInsuranceError ||
      !!hoaDuesError,
    [
      homePrice,
      interestRate,
      homePriceError,
      interestRateError,
      downPaymentPercentError,
      downPaymentAmountError,
      propertyTaxError,
      homeInsuranceError,
      hoaDuesError,
    ],
  );

  const activeHasError = mode === "afford" ? affordHasError : paymentHasError;

  // ─── Calculation ─────────────────────────────────────────────────────────
  // This function is pure calculation -- it never sets display state or
  // converts between dollar/percent. Those conversions belong in handlers.

  const calculateMortgage = useCallback(() => {
    if (activeHasError) {
      setResults(EMPTY_RESULTS);
      if (mode === "afford") setCalculatedHomePrice(0);
      return;
    }

    const r = Number(interestRate) / 100 / 12;
    const n = loanTerm * 12;
    const hoaNum = Number(hoaDues) || 0;

    if (mode === "afford") {
      const payment = Number(monthlyPayment);

      // Loan amount from payment using present value of annuity formula.
      // P = pmt * ((1+r)^n - 1) / (r * (1+r)^n)
      const loanAmount =
        r === 0
          ? payment * n
          : payment * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));

      let computedPrice: number;
      let downPayment: number;

      if (downPaymentMode === "dollar") {
        // Dollar mode: price is loan + down payment dollar amount.
        // The percent display is derived in affordDollarModePercentDisplay,
        // NOT fed back into this calculation.
        downPayment = downPaymentAmount;
        computedPrice = loanAmount + downPayment;
      } else {
        // Percent mode: price is loan / (1 - downPct).
        const safePct = clampPercent(downPaymentPercent);
        computedPrice = loanAmount / (1 - safePct / 100);
        downPayment = computedPrice * (safePct / 100);
      }

      // Output backstop guard
      if (!isFinite(computedPrice) || computedPrice > 1e12) {
        setResults(EMPTY_RESULTS);
        setCalculatedHomePrice(0);
        setMonthlyPaymentError(
          "That payment is too high to calculate. Try a lower amount to see your estimate.",
        );
        return;
      }

      setCalculatedHomePrice(computedPrice);

      const monthlyTax =
        propertyTaxMode === "percentage"
          ? (computedPrice * (propertyTaxPercent / 100)) / 12
          : propertyTaxAmount / 12;

      const monthlyInsurance =
        homeInsuranceMode === "percentage"
          ? (computedPrice * (homeInsurancePercent / 100)) / 12
          : homeInsuranceAmount / 12;

      const total = payment + monthlyTax + monthlyInsurance + hoaNum;

      setResults({
        homePrice: Math.round(computedPrice),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(payment),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        hoaDues: Math.round(hoaNum),
        totalMonthlyHousingCost: Math.round(total),
      });
    } else {
      const price = Number(homePrice);

      const downPayment =
        downPaymentMode === "dollar"
          ? clampDownPayment(downPaymentAmount, price)
          : price * (clampPercent(downPaymentPercent) / 100);

      const loanAmount = clampNonNeg(price - downPayment);

      // Guard: if loanAmount is zero (down payment equals price) blank results.
      if (loanAmount <= 0) {
        setResults(EMPTY_RESULTS);
        return;
      }

      // Monthly payment from loan amount using standard amortization formula.
      // pmt = P * (r * (1+r)^n) / ((1+r)^n - 1)
      const monthlyMortgage =
        r === 0
          ? loanAmount / n
          : (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);

      if (!isFinite(monthlyMortgage)) {
        setResults(EMPTY_RESULTS);
        return;
      }

      const monthlyTax =
        propertyTaxMode === "percentage"
          ? (price * (propertyTaxPercent / 100)) / 12
          : propertyTaxAmount / 12;

      const monthlyInsurance =
        homeInsuranceMode === "percentage"
          ? (price * (homeInsurancePercent / 100)) / 12
          : homeInsuranceAmount / 12;

      const total = monthlyMortgage + monthlyTax + monthlyInsurance + hoaNum;

      setResults({
        homePrice: Math.round(price),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyMortgage),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        hoaDues: Math.round(hoaNum),
        totalMonthlyHousingCost: Math.round(total),
      });
    }
  }, [
    activeHasError,
    mode,
    interestRate,
    loanTerm,
    monthlyPayment,
    homePrice,
    downPaymentMode,
    downPaymentPercent,
    downPaymentAmount,
    propertyTaxMode,
    propertyTaxPercent,
    propertyTaxAmount,
    homeInsuranceMode,
    homeInsurancePercent,
    homeInsuranceAmount,
    hoaDues,
  ]);

  useEffect(() => {
    calculateMortgage();
  }, [calculateMortgage]);

  // ─── Reset ───────────────────────────────────────────────────────────────

  const handleReset = () => {
    setMonthlyPayment("");
    setMonthlyPaymentDisplay("");
    setHomePrice("");
    setHomePriceDisplay("");
    setDownPaymentPercent(20);
    setDownPaymentPercentInput("20");
    setDownPaymentAmount(0);
    setDownPaymentAmountInput("");
    setDownPaymentMode("percentage");
    setInterestRate("");
    setLoanTerm(30);
    setPropertyTaxPercentInput("1.25");
    setPropertyTaxMode("percentage");
    setPropertyTaxAmount(0);
    setHomeInsurancePercentInput("0.35");
    setHomeInsuranceMode("percentage");
    setHomeInsuranceAmount(0);
    setHoaDues("");
    setCalculatedHomePrice(0);
    setResults(EMPTY_RESULTS);
    setInterestRateError("");
    setMonthlyPaymentError("");
    setHomePriceError("");
    setDownPaymentPercentError("");
    setDownPaymentAmountError("");
    setPropertyTaxError("");
    setHomeInsuranceError("");
    setHoaDuesError("");
  };

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleInterestRateChange = (raw: string) => {
    setInterestRate(raw);
    if (raw === "") {
      setInterestRateError("");
      return;
    }
    setInterestRateError(validateInterestRate(raw));
  };

  const handleInterestRateBlur = () => {
    setInterestRateError(validateInterestRate(interestRate));
  };

  // Down payment percent change.
  // Updates the numeric percent and syncs the dollar amount from price.
  const handleDownPaymentPercentChange = (raw: string, price: number) => {
    setDownPaymentPercentInput(raw);
    if (raw === "") {
      setDownPaymentPercent(0);
      setDownPaymentPercentError("");
      setDownPaymentAmount(0);
      setDownPaymentAmountInput("");
      return;
    }
    const val = parseFloat(raw);
    const safeVal = isNaN(val) ? 0 : val;
    setDownPaymentPercent(safeVal);
    setDownPaymentPercentError(
      safeVal < 0 || safeVal >= 100
        ? "Enter a percentage between 0 - 99.9%."
        : "",
    );
    // Sync dollar amount from percent * price (only when price is known)
    if (price > 0) {
      const amt = (clampPercent(safeVal) / 100) * price;
      setDownPaymentAmount(amt);
      setDownPaymentAmountInput(Math.round(amt).toString());
    }
  };

  // Down payment dollar change.
  // Updates the numeric amount and syncs the percent from price.
  const handleDownPaymentAmountChange = (
    raw: string,
    idSuffix: string,
    price: number,
  ) => {
    setDownPaymentAmountInput(raw);
    if (raw === "") {
      setDownPaymentAmount(0);
      setDownPaymentAmountError("");
      setDownPaymentPercent(0);
      setDownPaymentPercentInput("0");
      return;
    }
    const val = Number(raw);
    // Validate
    if (val < 0) {
      setDownPaymentAmountError(
        "Down payment cannot be negative. Enter 0 if no down payment is planned.",
      );
    } else if (idSuffix === "payment" && price > 0 && val >= price) {
      setDownPaymentAmountError(
        "Your down payment can't exceed the home price. Try lowering it.",
      );
    } else if (idSuffix === "afford" && val > DOWN_PAYMENT_DOLLAR_MAX) {
      setDownPaymentAmountError("Enter an amount between 0 - 1,000,000,000.");
    } else {
      setDownPaymentAmountError("");
    }
    setDownPaymentAmount(val);
    // Sync percent from dollar / price.
    // Tab 2: price is known immediately from homePrice input.
    // Tab 1: price is not yet known (it's the output), so we leave
    //        percentInput alone -- the derived affordDollarModePercentDisplay
    //        will show the correct value after calculation runs.
    if (idSuffix === "payment" && price > 0) {
      const clamped = clampDownPayment(val, price);
      const pct = (clamped / price) * 100;
      setDownPaymentPercent(pct);
      setDownPaymentPercentInput(pct.toFixed(2));
    }
  };

  // Mode switch: percent → dollar or dollar → percent.
  // Converts the existing value to the new unit using the known price.
  const handleDownPaymentModeChange = (newMode: string, price: number) => {
    setDownPaymentMode(newMode);
    setDownPaymentAmountError("");
    setDownPaymentPercentError("");

    if (newMode === "dollar") {
      // Convert current percent to dollar amount using price
      if (price > 0) {
        const amt = (downPaymentPercent / 100) * price;
        setDownPaymentAmount(amt);
        setDownPaymentAmountInput(Math.round(amt).toString());
      } else {
        // Price not yet known (Tab 1 before calculation) -- show blank
        setDownPaymentAmount(0);
        setDownPaymentAmountInput("");
      }
    } else {
      // Convert current dollar amount to percent using price
      if (price > 0 && downPaymentAmount > 0) {
        const pct = (downPaymentAmount / price) * 100;
        setDownPaymentPercent(pct);
        setDownPaymentPercentInput(pct.toFixed(2));
      } else {
        // Fall back to current percent input unchanged
      }
    }
  };

  const handlePropertyTaxModeChange = (newMode: string, price: number) => {
    setPropertyTaxMode(newMode);
    setPropertyTaxError("");
    if (newMode === "percentage" && propertyTaxAmount > 0 && price > 0) {
      // Convert dollar amount back to percent
      const pct = (propertyTaxAmount / price) * 100;
      setPropertyTaxPercentInput(pct.toFixed(4));
    } else if (newMode === "dollar" && price > 0) {
      // Convert percent to annual dollar amount
      setPropertyTaxAmount((propertyTaxPercent / 100) * price);
    }
  };

  const handlePropertyTaxPercentChange = (raw: string, price: number) => {
    setPropertyTaxPercentInput(raw);
    const val = raw === "" ? 0 : parseFloat(raw);
    const safeVal = isNaN(val) ? 0 : val;
    // Sync annual dollar amount from percent * price
    if (price > 0) setPropertyTaxAmount((safeVal / 100) * price);
    setPropertyTaxError(validatePropertyTax("percentage", safeVal, 0, price));
  };

  const handlePropertyTaxAmountChange = (val: number, price: number) => {
    setPropertyTaxAmount(val);
    // Sync percent from dollar / price
    if (price > 0) {
      const pct = (val / price) * 100;
      setPropertyTaxPercentInput(pct.toFixed(4));
    }
    setPropertyTaxError(validatePropertyTax("dollar", 0, val, price));
  };

  const handleHomeInsuranceModeChange = (newMode: string, price: number) => {
    setHomeInsuranceMode(newMode);
    setHomeInsuranceError("");
    if (newMode === "percentage" && homeInsuranceAmount > 0 && price > 0) {
      const pct = (homeInsuranceAmount / price) * 100;
      setHomeInsurancePercentInput(pct.toFixed(4));
    } else if (newMode === "dollar" && price > 0) {
      setHomeInsuranceAmount((homeInsurancePercent / 100) * price);
    }
  };

  const handleHomeInsurancePercentChange = (raw: string, price: number) => {
    setHomeInsurancePercentInput(raw);
    const val = raw === "" ? 0 : parseFloat(raw);
    const safeVal = isNaN(val) ? 0 : val;
    if (price > 0) setHomeInsuranceAmount((safeVal / 100) * price);
    setHomeInsuranceError(
      validateHomeInsurance("percentage", safeVal, 0, price),
    );
  };

  const handleHomeInsuranceAmountChange = (val: number, price: number) => {
    setHomeInsuranceAmount(val);
    if (price > 0) {
      const pct = (val / price) * 100;
      setHomeInsurancePercentInput(pct.toFixed(4));
    }
    setHomeInsuranceError(validateHomeInsurance("dollar", 0, val, price));
  };

  const handleHoaChange = (raw: string) => {
    setHoaDues(raw);
    setHoaDuesError(validateHoa(raw));
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ThemeToggle />
      <h1 className="sr-only">Mortgage Calculator Suite</h1>
      <div className="mb-8">
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v);
            // Re-validate down payment dollar amount against the new tab's price
            if (v === "payment" && downPaymentMode === "dollar") {
              const price = Number(homePrice);
              const amt = Number(downPaymentAmountInput.replace(/,/g, ""));
              if (price > 0 && amt >= price) {
                setDownPaymentAmountError(
                  "Your down payment can't exceed the home price. Try lowering it.",
                );
              } else {
                setDownPaymentAmountError("");
              }
            } else {
              setDownPaymentAmountError("");
            }
          }}
          className="w-full"
        >
          <TabsList className="grid w-full sm:grid-cols-2 p-0 gap-4">
            <TabsTrigger value="afford" className="cursor-pointer">
              Home you can afford
            </TabsTrigger>
            <TabsTrigger value="payment" className="cursor-pointer">
              Monthly payment
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Afford ───────────────────────────────────────── */}
          <TabsContent value="afford">
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Estimate home price based on a monthly payment you can allocate
              toward a mortgage.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                {/* Monthly Payment */}
                <div className="pb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <label
                      htmlFor="monthly-payment"
                      className="block text-sm font-semibold"
                    >
                      Monthly mortgage payment (principal + interest)
                    </label>
                    <InfoPopover title="Monthly mortgage payment">
                      Enter the amount you can afford for your loan payment
                      (principal + interest only). Taxes, insurance, and HOA
                      fees are added separately below.
                    </InfoPopover>
                  </div>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] font-medium"
                    >
                      $
                    </span>
                    <input
                      id="monthly-payment"
                      type="text"
                      inputMode="numeric"
                      value={monthlyPaymentDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
                        setMonthlyPayment(raw);
                        const num = parseFloat(raw);
                        setMonthlyPaymentDisplay(
                          isNaN(num) ? raw : num.toLocaleString("en-US"),
                        );
                        if (raw === "") {
                          setMonthlyPaymentError("");
                          return;
                        }
                        if (
                          num < MONTHLY_PAYMENT_MIN ||
                          num > MONTHLY_PAYMENT_MAX
                        ) {
                          setMonthlyPaymentError(
                            "Enter an amount between $1 and $1,000,000. Amounts beyond this are unusual.",
                          );
                        } else {
                          setMonthlyPaymentError("");
                        }
                      }}
                      onFocus={() => setMonthlyPaymentDisplay(monthlyPayment)}
                      onBlur={() => {
                        if (monthlyPayment === "") {
                          setTimeout(
                            () =>
                              setMonthlyPaymentError(
                                "Please enter your monthly mortgage payment.",
                              ),
                            150,
                          );
                          return;
                        }
                        const num = parseFloat(monthlyPayment);
                        setMonthlyPaymentDisplay(
                          isNaN(num)
                            ? monthlyPayment
                            : num.toLocaleString("en-US"),
                        );
                      }}
                      aria-invalid={!!monthlyPaymentError}
                      aria-describedby="monthly-payment-msg"
                      className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg outline-none transition ${
                        monthlyPaymentError
                          ? "border-[var(--color-inline-error)]"
                          : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      }`}
                    />
                  </div>
                  <FieldMessage
                    id="monthly-payment-msg"
                    error={monthlyPaymentError}
                  />
                  <p className="text-xs mt-1">
                    This is the amount allocated to the loan payment (principal
                    + interest). Taxes, insurance, and HOA are added separately
                    below.
                  </p>
                </div>

                {/*
                  Tab 1 down payment:
                  - Percent mode: user types percent, dollar syncs from (pct/100)*calculatedHomePrice
                  - Dollar mode: user types dollars, percent is shown as a read-only
                    derived display (affordDollarModePercentDisplay) -- it is NOT
                    fed back into the calculation
                */}
                <DownPaymentField
                  idSuffix="afford"
                  mode={downPaymentMode}
                  percentInput={
                    downPaymentMode === "dollar"
                      ? affordDollarModePercentDisplay
                      : downPaymentPercentInput
                  }
                  amountInput={downPaymentAmountInput}
                  percentError={downPaymentPercentError}
                  amountError={downPaymentAmountError}
                  priceForDollarCap={calculatedHomePrice}
                  onModeChange={(m) =>
                    handleDownPaymentModeChange(m, calculatedHomePrice)
                  }
                  onPercentChange={(raw) =>
                    handleDownPaymentPercentChange(raw, calculatedHomePrice)
                  }
                  onAmountChange={(raw) =>
                    handleDownPaymentAmountChange(
                      raw,
                      "afford",
                      calculatedHomePrice,
                    )
                  }
                />

                <InterestRateField
                  idSuffix="afford"
                  value={interestRate}
                  error={interestRateError}
                  onChange={handleInterestRateChange}
                  onBlur={handleInterestRateBlur}
                />
                <LoanTermField
                  idSuffix="afford"
                  value={loanTerm}
                  onChange={setLoanTerm}
                />

                <div className="pt-4 border-t border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">
                    Additional housing costs
                  </h2>
                  <PropertyTaxField
                    idSuffix="afford"
                    mode={propertyTaxMode}
                    percent={propertyTaxPercentInput}
                    amount={propertyTaxAmount}
                    error={propertyTaxError}
                    onModeChange={(m) =>
                      handlePropertyTaxModeChange(m, calculatedHomePrice)
                    }
                    onPercentChange={(raw) =>
                      handlePropertyTaxPercentChange(raw, calculatedHomePrice)
                    }
                    onAmountChange={(val) =>
                      handlePropertyTaxAmountChange(val, calculatedHomePrice)
                    }
                  />
                  <HomeInsuranceField
                    idSuffix="afford"
                    mode={homeInsuranceMode}
                    percent={homeInsurancePercentInput}
                    amount={homeInsuranceAmount}
                    error={homeInsuranceError}
                    onModeChange={(m) =>
                      handleHomeInsuranceModeChange(m, calculatedHomePrice)
                    }
                    onPercentChange={(raw) =>
                      handleHomeInsurancePercentChange(raw, calculatedHomePrice)
                    }
                    onAmountChange={(val) =>
                      handleHomeInsuranceAmountChange(val, calculatedHomePrice)
                    }
                  />
                  <HoaField
                    idSuffix="afford"
                    value={hoaDues}
                    error={hoaDuesError}
                    onChange={handleHoaChange}
                  />
                </div>
              </div>
              <div>
                <ResultsPanel
                  tab="afford"
                  hasError={affordHasError}
                  results={results}
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 2: Payment ──────────────────────────────────────── */}
          <TabsContent value="payment">
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Estimate a monthly mortgage payment based on your target home
              price.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                {/* Home Price */}
                <div className="pb-5">
                  <label
                    htmlFor="home-price"
                    className="block text-sm font-semibold mb-1"
                  >
                    Home price
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                    >
                      $
                    </span>
                    <input
                      id="home-price"
                      type="text"
                      inputMode="numeric"
                      value={homePriceDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        if (raw !== "" && !/^\d*$/.test(raw)) return;
                        setHomePrice(raw);
                        const num = Number(raw);
                        setHomePriceDisplay(
                          raw === "" ? "" : num.toLocaleString("en-US"),
                        );
                        if (raw === "") {
                          setHomePriceError("");
                          return;
                        }
                        if (num < HOME_PRICE_MIN || num > HOME_PRICE_MAX) {
                          setHomePriceError(
                            "Enter an amount between $1 and $1,000,000,000.",
                          );
                        } else {
                          setHomePriceError("");
                        }
                        // Sync down payment display when home price changes
                        if (downPaymentMode === "dollar") {
                          // Keep dollar amount, update percent from new price
                          if (num > 0) {
                            const clamped = clampDownPayment(
                              downPaymentAmount,
                              num,
                            );
                            setDownPaymentAmount(clamped);
                            setDownPaymentAmountInput(
                              Math.round(clamped).toString(),
                            );
                            const pct = (clamped / num) * 100;
                            setDownPaymentPercent(pct);
                            setDownPaymentPercentInput(pct.toFixed(2));
                          }
                        } else {
                          // Keep percent, update dollar amount from new price
                          const amt = (downPaymentPercent / 100) * num;
                          setDownPaymentAmount(amt);
                          setDownPaymentAmountInput(Math.round(amt).toString());
                        }
                      }}
                      onFocus={() => setHomePriceDisplay(homePrice)}
                      onBlur={() => {
                        if (homePrice === "") {
                          setTimeout(
                            () =>
                              setHomePriceError(
                                "Please enter the purchase price of the home.",
                              ),
                            150,
                          );
                          return;
                        }
                        setHomePriceDisplay(
                          Number(homePrice).toLocaleString("en-US"),
                        );
                      }}
                      aria-invalid={!!homePriceError}
                      aria-describedby="home-price-msg"
                      className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg outline-none transition ${
                        homePriceError
                          ? "border-[var(--color-inline-error)]"
                          : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      }`}
                    />
                  </div>
                  <FieldMessage id="home-price-msg" error={homePriceError} />
                  <p className="text-xs mt-1">
                    Enter the purchase price of the home.
                  </p>
                </div>

                <DownPaymentField
                  idSuffix="payment"
                  mode={downPaymentMode}
                  percentInput={downPaymentPercentInput}
                  amountInput={downPaymentAmountInput}
                  percentError={downPaymentPercentError}
                  amountError={downPaymentAmountError}
                  priceForDollarCap={Number(homePrice)}
                  onModeChange={(m) =>
                    handleDownPaymentModeChange(m, Number(homePrice))
                  }
                  onPercentChange={(raw) =>
                    handleDownPaymentPercentChange(raw, Number(homePrice))
                  }
                  onAmountChange={(raw) =>
                    handleDownPaymentAmountChange(
                      raw,
                      "payment",
                      Number(homePrice),
                    )
                  }
                />
                <InterestRateField
                  idSuffix="payment"
                  value={interestRate}
                  error={interestRateError}
                  onChange={handleInterestRateChange}
                  onBlur={handleInterestRateBlur}
                />
                <LoanTermField
                  idSuffix="payment"
                  value={loanTerm}
                  onChange={setLoanTerm}
                />

                <div className="pt-4 border-t border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">
                    Additional housing costs
                  </h2>
                  <PropertyTaxField
                    idSuffix="payment"
                    mode={propertyTaxMode}
                    percent={propertyTaxPercentInput}
                    amount={propertyTaxAmount}
                    error={propertyTaxError}
                    onModeChange={(m) =>
                      handlePropertyTaxModeChange(m, Number(homePrice))
                    }
                    onPercentChange={(raw) =>
                      handlePropertyTaxPercentChange(raw, Number(homePrice))
                    }
                    onAmountChange={(val) =>
                      handlePropertyTaxAmountChange(val, Number(homePrice))
                    }
                  />
                  <HomeInsuranceField
                    idSuffix="payment"
                    mode={homeInsuranceMode}
                    percent={homeInsurancePercentInput}
                    amount={homeInsuranceAmount}
                    error={homeInsuranceError}
                    onModeChange={(m) =>
                      handleHomeInsuranceModeChange(m, Number(homePrice))
                    }
                    onPercentChange={(raw) =>
                      handleHomeInsurancePercentChange(raw, Number(homePrice))
                    }
                    onAmountChange={(val) =>
                      handleHomeInsuranceAmountChange(val, Number(homePrice))
                    }
                  />
                  <HoaField
                    idSuffix="payment"
                    value={hoaDues}
                    error={hoaDuesError}
                    onChange={handleHoaChange}
                  />
                </div>
              </div>
              <div>
                <ResultsPanel
                  tab="payment"
                  hasError={paymentHasError}
                  results={results}
                />
              </div>
            </div>
          </TabsContent>

          <div className="flex mt-6">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-md font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4 py-2 whitespace-normal bg-navy border-2 border-navy cursor-pointer hover:bg-white hover:border-lagunita hover:text-[var(--color-teal)] text-white w-full md:w-auto"
            >
              Reset
            </button>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
