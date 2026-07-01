"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card";
import InfoPopover from "@/app/ui/components/popover";

/* ── Limits & ranges (see feedback doc, June 2026) ───────────────────────── */
const MONTHLY_PAYMENT_MIN = 1;
const MONTHLY_PAYMENT_MAX = 1_000_000;
const HOME_PRICE_MIN = 1;
const HOME_PRICE_MAX = 1_000_000_000;
const DP_DOLLAR_MAX_AFFORD = 1_000_000_000;
const RATE_MIN = 0;
const RATE_MAX = 20;
const DP_PERCENT_MIN = 0;
const DP_PERCENT_MAX = 99.9;
const TAX_RATE_MAX = 10;
const INS_RATE_MAX = 10;
const RELATIVE_CAP = 0.10; // property tax / insurance $ cap = 10% of home price
const HOA_MIN = 0;
const HOA_MAX = 20_000;
const HOME_PRICE_DISPLAY_CEILING = 1_000_000_000_000; // #19 backstop guard

type Mode = 'afford' | 'payment';
type Toggle = 'percentage' | 'dollar';

const EMPTY_RESULTS: Results = {
  homePrice: 0, downPayment: 0, loanAmount: 0, monthlyMortgage: 0,
  monthlyTax: 0, monthlyInsurance: 0, totalMonthly: 0, hoaDues: 0,
  totalMonthlyHousingCost: 0,
};

interface Results {
  homePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyMortgage: number;
  monthlyTax: number;
  monthlyInsurance: number;
  totalMonthly: number;
  hoaDues: number;
  totalMonthlyHousingCost: number;
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 text-sm font-semibold text-[var(--color-inline-error)]"
    >
      {children}
    </p>
  );
}

export default function MortgageCalculator() {
  const [mode, setMode] = useState<Mode>('afford');
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [homePrice, setHomePrice] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState(30);
  const [propertyTaxPercent, setPropertyTaxPercent] = useState(1.25);
  const [homeInsurancePercent, setHomeInsurancePercent] = useState(0.35);
  const [hoaDues, setHoaDues] = useState("");
  const [downPaymentMode, setDownPaymentMode] = useState<Toggle>('percentage');
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);
  const [downPaymentPercentInput, setDownPaymentPercentInput] = useState('20');
  const [downPaymentAmountInput, setDownPaymentAmountInput] = useState('0');
  const [propertyTaxMode, setPropertyTaxMode] = useState<Toggle>('percentage');
  const [propertyTaxAmount, setPropertyTaxAmount] = useState(0);
  const [homeInsuranceMode, setHomeInsuranceMode] = useState<Toggle>('percentage');
  const [homeInsuranceAmount, setHomeInsuranceAmount] = useState(0);
  const [calculatedHomePrice, setCalculatedHomePrice] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  // Required-field "please enter…" messages only surface after the field is
  // touched-then-left, per Rachel's note. Range errors surface immediately.
  const [touched, setTouched] = useState({
    monthlyPayment: false,
    homePrice: false,
    interestRate: false,
  });

  const [results, setResults] = useState<Results>(EMPTY_RESULTS);

  const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
  const clampNonNegativeNumber = (value: number) => Math.max(0, Number(value) || 0);

  /* ── Validation ────────────────────────────────────────────────────────
     One source of truth for messages + blocking flags, used by both the calc
     and the render so the output can never show stale numbers next to an error. */
  const v = useMemo(() => {
    const rateNum = Number(interestRate);
    const paymentNum = Number(monthlyPayment);
    const priceNum = Number(homePrice);
    const hoaNum = Number(hoaDues);
    const activePrice = mode === 'afford' ? calculatedHomePrice : priceNum;

    // Interest rate (shared) — 0–20 inclusive
    const rateEmpty = interestRate === "";
    const rateRangeBad = !rateEmpty && (rateNum < RATE_MIN || rateNum > RATE_MAX);
    let rateMsg = "";
    if (rateEmpty && touched.interestRate) rateMsg = "Please enter an interest rate.";
    else if (rateRangeBad) rateMsg = "Please enter an interest rate between 0 and 20%.";

    // Monthly payment (Tab 1) — 1–1,000,000 inclusive, 0 below min
    const paymentEmpty = monthlyPayment === "";
    const paymentRangeBad = !paymentEmpty && (paymentNum < MONTHLY_PAYMENT_MIN || paymentNum > MONTHLY_PAYMENT_MAX);
    let paymentMsg = "";
    if (paymentEmpty && touched.monthlyPayment) paymentMsg = "Please enter your monthly mortgage payment.";
    else if (paymentRangeBad) paymentMsg = "Enter an amount between $1 and $1,000,000. Amounts beyond this are unusual.";

    // Home price (Tab 2) — 1–1,000,000,000 inclusive
    const priceEmpty = homePrice === "";
    const priceRangeBad = !priceEmpty && (priceNum < HOME_PRICE_MIN || priceNum > HOME_PRICE_MAX);
    let priceMsg = "";
    if (priceEmpty && touched.homePrice) priceMsg = "Please enter the purchase price of the home.";
    else if (priceRangeBad) priceMsg = "Enter an amount between $1 and $1,000,000,000.";

    // Down payment
    let dpMsg = "";
    let dpBad = false;
    if (downPaymentMode === 'percentage') {
      dpBad = downPaymentPercent < DP_PERCENT_MIN || downPaymentPercent > DP_PERCENT_MAX;
      if (dpBad) dpMsg = "Enter a percentage between 0 - 99.9%.";
    } else if (mode === 'afford') {
      // Tab 1: absolute ceiling (no home-price input to clamp against)
      dpBad = downPaymentAmount < 0 || downPaymentAmount > DP_DOLLAR_MAX_AFFORD;
      if (dpBad) dpMsg = "Enter an amount between 0 - 1,000,000,000.";
    } else {
      // Tab 2: relational against home price
      if (downPaymentAmount < 0) {
        dpBad = true;
        dpMsg = "Down payment cannot be negative. Enter 0 if no down payment is planned.";
      } else if (!priceEmpty && priceNum > 0 && downPaymentAmount >= priceNum) {
        dpBad = true;
        dpMsg = "Your down payment can't exceed the home price. Try lowering it.";
      }
    }

    // Property taxes
    let taxMsg = "";
    let taxBad = false;
    if (propertyTaxMode === 'percentage') {
      taxBad = propertyTaxPercent < 0 || propertyTaxPercent > TAX_RATE_MAX;
      if (taxBad) taxMsg = "Enter a property tax rate between 0 and 10%. Rates beyond this are unusual.";
    } else if (activePrice > 0 && propertyTaxAmount > RELATIVE_CAP * activePrice) {
      taxBad = true;
      taxMsg = "Enter a property tax amount between 0 and 10% of the home price. Amounts beyond this are unusual.";
    }

    // Homeowners insurance
    let insMsg = "";
    let insBad = false;
    if (homeInsuranceMode === 'percentage') {
      insBad = homeInsurancePercent < 0 || homeInsurancePercent > INS_RATE_MAX;
      if (insBad) insMsg = "Enter a homeowners insurance rate between 0 and 10%. Rates beyond this are unusual.";
    } else if (activePrice > 0 && homeInsuranceAmount > RELATIVE_CAP * activePrice) {
      insBad = true;
      insMsg = "Enter a homeowners insurance amount between 0 and 10% of the home price. Amounts beyond this are unusual.";
    }

    // HOA dues — 0–20,000 inclusive
    const hoaBad = hoaDues !== "" && (hoaNum < HOA_MIN || hoaNum > HOA_MAX);
    const hoaMsg = hoaBad ? "Enter an amount between $0 and $20,000." : "";

    // Blocking = anything that must stop the calc (includes empties)
    const rateBlock = rateEmpty || rateRangeBad;
    const paymentBlock = paymentEmpty || paymentRangeBad;
    const priceBlock = priceEmpty || priceRangeBad;

    const affordBlocking = paymentBlock || rateBlock || dpBad || taxBad || insBad || hoaBad;
    const paymentBlocking = priceBlock || rateBlock || dpBad || taxBad || insBad || hoaBad;

    // Wrong-value = a real bad value is present (drives the coral card).
    // Empties alone leave the panel blank instead.
    const affordWrongValue = paymentRangeBad || rateRangeBad || dpBad || taxBad || insBad || hoaBad;
    const paymentWrongValue = priceRangeBad || rateRangeBad || dpBad || taxBad || insBad || hoaBad;

    return {
      rateMsg, paymentMsg, priceMsg, dpMsg, taxMsg, insMsg, hoaMsg,
      affordBlocking, paymentBlocking, affordWrongValue, paymentWrongValue,
    };
  }, [
    mode, monthlyPayment, homePrice, interestRate, downPaymentMode,
    downPaymentPercent, downPaymentAmount, propertyTaxMode, propertyTaxPercent,
    propertyTaxAmount, homeInsuranceMode, homeInsurancePercent,
    homeInsuranceAmount, hoaDues, calculatedHomePrice, touched,
  ]);

  const calculateMortgage = useCallback(() => {
    const rateNum = Number(interestRate);
    const r = rateNum / 100 / 12;
    const n = loanTerm * 12;
    const hoaDuesNum = Number(hoaDues) || 0;

    const blank = () => {
      setResults(EMPTY_RESULTS);
      setCalculatedHomePrice(0);
    };

    if (mode === 'afford') {
      if (v.affordBlocking) { setLimitReached(false); blank(); return; }

      const paymentAmount = Number(monthlyPayment);

      // 0% interest is now valid (inclusive), so guard the divide-by-zero.
      const loanAmount = r === 0
        ? paymentAmount * n
        : paymentAmount * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));

      let computedHomePrice: number;
      let downPayment: number;

      if (downPaymentMode === 'dollar') {
        downPayment = downPaymentAmount;
        computedHomePrice = loanAmount + downPayment;
        if (computedHomePrice > 0) {
          const calculatedPercent = (downPayment / computedHomePrice) * 100;
          setDownPaymentPercent(calculatedPercent);
          setDownPaymentPercentInput(calculatedPercent.toFixed(2));
        }
      } else {
        const safeDownPaymentPercent = clampPercent(downPaymentPercent);
        computedHomePrice = loanAmount / (1 - safeDownPaymentPercent / 100);
        downPayment = computedHomePrice * (safeDownPaymentPercent / 100);
      }

      // #19 backstop: if the result runs away, show the limit message.
      if (!isFinite(computedHomePrice) || computedHomePrice > HOME_PRICE_DISPLAY_CEILING) {
        setLimitReached(true);
        blank();
        return;
      }
      setLimitReached(false);
      setCalculatedHomePrice(computedHomePrice);

      const monthlyTax = propertyTaxMode === 'percentage'
        ? (computedHomePrice * (propertyTaxPercent / 100)) / 12
        : propertyTaxAmount / 12;

      const monthlyInsurance = homeInsuranceMode === 'percentage'
        ? (computedHomePrice * (homeInsurancePercent / 100)) / 12
        : homeInsuranceAmount / 12;

      const totalMonthly = paymentAmount + monthlyTax + monthlyInsurance + hoaDuesNum;

      setResults({
        homePrice: Math.round(computedHomePrice),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(paymentAmount),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(totalMonthly),
        hoaDues: Math.round(hoaDuesNum),
        totalMonthlyHousingCost: Math.round(totalMonthly),
      });
    } else {
      setLimitReached(false);
      if (v.paymentBlocking) { blank(); return; }

      const homePriceAmount = Number(homePrice);
      const downPayment = downPaymentMode === 'dollar'
        ? downPaymentAmount
        : homePriceAmount * (clampPercent(downPaymentPercent) / 100);
      const loanAmount = Math.max(0, homePriceAmount - downPayment);

      const monthlyMortgage = r === 0
        ? loanAmount / n
        : loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

      if (!isFinite(monthlyMortgage)) { blank(); return; }

      const monthlyTax = propertyTaxMode === 'percentage'
        ? (homePriceAmount * (propertyTaxPercent / 100)) / 12
        : propertyTaxAmount / 12;

      const monthlyInsurance = homeInsuranceMode === 'percentage'
        ? (homePriceAmount * (homeInsurancePercent / 100)) / 12
        : homeInsuranceAmount / 12;

      const totalMonthly = monthlyMortgage + monthlyTax + monthlyInsurance + hoaDuesNum;

      setResults({
        homePrice: Math.round(homePriceAmount),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyMortgage),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(totalMonthly),
        hoaDues: Math.round(hoaDuesNum),
        totalMonthlyHousingCost: Math.round(totalMonthly),
      });
    }
  }, [
    mode, monthlyPayment, homePrice, downPaymentPercent, downPaymentAmount,
    downPaymentMode, interestRate, loanTerm, propertyTaxPercent, propertyTaxMode,
    propertyTaxAmount, homeInsurancePercent, homeInsuranceMode,
    homeInsuranceAmount, hoaDues, v,
  ]);

  useEffect(() => {
    calculateMortgage();
  }, [calculateMortgage]);

  const formatCurrency = (value: number) => {
    if (!isFinite(value)) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const showAffordResults = mode === 'afford' && !v.affordBlocking && !limitReached;
  const showPaymentResults = mode === 'payment' && !v.paymentBlocking;
  const affordCoral = mode === 'afford' && (v.affordWrongValue || limitReached);
  const paymentCoral = mode === 'payment' && v.paymentWrongValue;
  const emptyResultsString = "Enter values to see your estimate";
  const fixFieldsString = "Please fix the highlighted fields to see your estimate.";
  const limitString = "That payment is too high to calculate. Try a lower amount to see your estimate.";

  const handleReset = () => {
    setMonthlyPayment('');
    setHomePrice('');
    setDownPaymentPercent(20);
    setDownPaymentPercentInput('20');
    setDownPaymentAmount(0);
    setDownPaymentAmountInput('0');
    setInterestRate('');
    setLoanTerm(30);
    setPropertyTaxPercent(1.25);
    setPropertyTaxMode('percentage');
    setPropertyTaxAmount(0);
    setHomeInsurancePercent(0.35);
    setHomeInsuranceMode('percentage');
    setHomeInsuranceAmount(0);
    setHoaDues('');
    setDownPaymentMode('percentage');
    setCalculatedHomePrice(0);
    setLimitReached(false);
    setTouched({ monthlyPayment: false, homePrice: false, interestRate: false });
    setResults(EMPTY_RESULTS);
  };

  const CoralCard = ({ message }: { message: string }) => (
    <div
      role="alert"
      className="min-h-[28rem] flex items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-900"
    >
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );

  const EmptyPanel = () => (
    <div className="min-h-[28rem] flex items-center justify-center">
      <p className="text-lg font-bold text-gray-500 italic">{emptyResultsString}</p>
    </div>
  );

  const ResultsBody = ({ headline }: { headline: string }) => (
    <div className="rounded-lg">
      <div className="innerwrapper">
        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
          <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark items-center">
            Down payment:
          </div>
          <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
            {formatCurrency(results.downPayment || 0)}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
          <div className="w-full sm:w-[50%] text-md p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
            Loan amount:
          </div>
          <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg text-palo-verde font-bold overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
            {formatCurrency(results.loanAmount || 0)}
          </div>
        </div>
        <div className="flex flex-col my-3">
          <h3 className="text-lg font-bold mb-4">Monthly breakdown</h3>
          <hr />
        </div>
        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
          <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
            Mortgage payment:
          </div>
          <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
            {formatCurrency(results.monthlyMortgage || 0)}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
          <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
            Property taxes:
          </div>
          <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
            {formatCurrency(results.monthlyTax || 0)}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
          <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
            Insurance:
          </div>
          <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
            {formatCurrency(results.monthlyInsurance || 0)}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
          <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
            HOA:
          </div>
          <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
            {formatCurrency(results.hoaDues || 0)}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
          <div className="w-full sm:w-[50%] text-md p-4 font-bold text-white bg-navy rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
            Total monthly housing cost:
          </div>
          <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold bg-lagunita-lighter text-black overflow-hidden text-ellipsis flex items-center">
            {formatCurrency(results.totalMonthlyHousingCost || 0)}
          </div>
        </div>
        <div className="py-5">
          <p className="text-sm">{headline}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        <div className="mb-8">
          <h1 className="sr-only">Mortgage Calculator Suite</h1>

          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as Mode)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-rows-1 sm:grid-cols-2 p-0 gap-4">
              <TabsTrigger value="afford" className="cursor-pointer">
                Home you can afford
              </TabsTrigger>
              <TabsTrigger value="payment" className="cursor-pointer">
                Monthly payment
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Afford ─────────────────────────────────────────── */}
            <TabsContent value="afford">
              <p className="text-sm text-muted-foreground">
                Estimate home price based on a monthly payment you can allocate
                toward a mortgage.
              </p>
              <div className="grid md:grid-cols-2 gap-8 py-8">
                <div className="pr-0">
                  {/* Monthly payment */}
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
                        className="absolute text-[var(--color-symbols)] left-3 top-1/2 -translate-y-1/2 font-medium"
                      >
                        $
                      </span>
                      <input
                        id="monthly-payment"
                        type="text"
                        inputMode="numeric"
                        value={monthlyPayment ? Number(monthlyPayment).toLocaleString("en-US") : ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "");
                          if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                            setMonthlyPayment(raw);
                          }
                        }}
                        onBlur={() => setTouched((t) => ({ ...t, monthlyPayment: true }))}
                        aria-describedby={v.paymentMsg ? "monthly-payment-error" : undefined}
                        aria-invalid={!!v.paymentMsg}
                        className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.paymentMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                      />
                    </div>
                    {v.paymentMsg ? (
                      <FieldError id="monthly-payment-error">{v.paymentMsg}</FieldError>
                    ) : (
                      <p className="text-xs mt-1">
                        This is the amount allocated to the loan payment
                        (principal + interest). Taxes, insurance, and HOA are
                        added separately below.
                      </p>
                    )}
                  </div>

                  {/* Down Payment */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <span className="block text-sm font-semibold">Down payment</span>
                      <fieldset className="border-0 p-0 m-0">
                        <legend className="sr-only">Down payment type</legend>
                        <div className="flex flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="downPaymentModeAfford"
                              checked={downPaymentMode === "percentage"}
                              onChange={() => {
                                setDownPaymentMode("percentage");
                                if (downPaymentAmount >= 0 && calculatedHomePrice > 0) {
                                  const percentValue = (downPaymentAmount / calculatedHomePrice) * 100;
                                  setDownPaymentPercent(percentValue);
                                  setDownPaymentPercentInput(percentValue.toFixed(2));
                                }
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className={`text-xs transition ${downPaymentMode === "percentage" ? "font-semibold" : ""}`}>
                              Percent
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="downPaymentModeAfford"
                              checked={downPaymentMode === "dollar"}
                              onChange={() => {
                                setDownPaymentMode("dollar");
                                const amountValue = calculatedHomePrice * (downPaymentPercent / 100);
                                setDownPaymentAmount(amountValue);
                                setDownPaymentAmountInput(calculatedHomePrice > 0 ? Math.round(amountValue).toString() : "");
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className={`text-xs transition ${downPaymentMode === "dollar" ? "font-semibold" : ""}`}>
                              Dollars
                            </span>
                          </label>
                        </div>
                      </fieldset>
                    </div>
                    <div className="relative">
                      {downPaymentMode === "percentage" ? (
                        <div className="relative">
                          <input
                            id="down-payment-percent-afford"
                            type="number"
                            min="0"
                            step="0.01"
                            value={downPaymentPercentInput}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setDownPaymentPercentInput(raw);
                              if (raw === "") {
                                setDownPaymentPercent(0);
                                setDownPaymentAmount(0);
                                setDownPaymentAmountInput("0");
                                return;
                              }
                              const value = Number(raw);
                              setDownPaymentPercent(value);
                              const price = calculatedHomePrice || 0;
                              const computedAmount = (clampPercent(value) / 100) * price;
                              setDownPaymentAmount(computedAmount);
                              setDownPaymentAmountInput(Math.round(computedAmount).toString());
                            }}
                            aria-label="Down payment percentage"
                            aria-describedby={v.dpMsg ? "down-payment-afford-error" : undefined}
                            aria-invalid={!!v.dpMsg}
                            className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.dpMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                          />
                          <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            id="down-payment-amount-afford"
                            type="text"
                            inputMode="numeric"
                            value={downPaymentAmountInput ? Number(downPaymentAmountInput).toLocaleString("en-US") : ""}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, "");
                              if (raw === "" || /^\d*$/.test(raw)) {
                                setDownPaymentAmountInput(raw);
                                if (raw === "") {
                                  setDownPaymentAmount(0);
                                  setDownPaymentPercent(0);
                                  setDownPaymentPercentInput("0");
                                  return;
                                }
                                setDownPaymentAmount(Number(raw));
                              }
                            }}
                            aria-label="Down payment amount in dollars"
                            aria-describedby={v.dpMsg ? "down-payment-afford-error" : undefined}
                            aria-invalid={!!v.dpMsg}
                            className={`w-full pl-8 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition ${v.dpMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                          />
                          <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                        </div>
                      )}
                      {v.dpMsg ? (
                        <FieldError id="down-payment-afford-error">{v.dpMsg}</FieldError>
                      ) : (
                        <p className="text-xs mt-1">Enter 0 if no down payment is planned.</p>
                      )}
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="pb-5">
                    <label htmlFor="interest-rate-afford" className="block text-sm font-semibold">
                      Interest rate
                    </label>
                    <div className="relative">
                      <input
                        id="interest-rate-afford"
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, interestRate: true }))}
                        aria-describedby={v.rateMsg ? "interest-rate-afford-error" : undefined}
                        aria-invalid={!!v.rateMsg}
                        className={`w-full pr-8 pl-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.rateMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                      />
                      <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                    </div>
                    {v.rateMsg && <FieldError id="interest-rate-afford-error">{v.rateMsg}</FieldError>}
                  </div>

                  {/* Loan Term */}
                  <div className="pb-5">
                    <fieldset className="border-0 p-0 m-0">
                      <legend className="block text-sm font-semibold mb-2">Loan term</legend>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex-1 cursor-pointer flex flex-row">
                          <input type="radio" name="loanTermAfford" value="15" checked={loanTerm === 15} onChange={() => setLoanTerm(15)} className="mr-3 w-4 accent-lagunita" />
                          <span className={`self-center ${loanTerm === 15 ? "font-semibold" : "font-normal"}`}>15 years</span>
                        </label>
                        <label className="flex-1 cursor-pointer flex flex-row">
                          <input type="radio" name="loanTermAfford" value="30" checked={loanTerm === 30} onChange={() => setLoanTerm(30)} className="mr-3 w-4 accent-lagunita" />
                          <span className={`self-center ${loanTerm === 30 ? "font-semibold" : "font-normal"}`}>30 years</span>
                        </label>
                      </div>
                    </fieldset>
                  </div>

                  {/* Optional Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h2 className="text-lg font-semibold mb-4">Additional housing costs</h2>

                    {/* Property Taxes */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <span className="block text-sm font-semibold">Property taxes (annual)</span>
                        <fieldset className="border-0 p-0 m-0">
                          <legend className="sr-only">Property tax input type</legend>
                          <div className="flex flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="propertyTaxModeAfford"
                                value="percentage"
                                checked={propertyTaxMode === "percentage"}
                                onChange={() => {
                                  setPropertyTaxMode("percentage");
                                  if (propertyTaxAmount > 0 && calculatedHomePrice > 0) {
                                    setPropertyTaxPercent((propertyTaxAmount / calculatedHomePrice) * 100);
                                  } else {
                                    setPropertyTaxPercent(0);
                                  }
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span className={`text-xs transition ${propertyTaxMode === "percentage" ? "font-semibold" : ""}`}>Percent</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="propertyTaxModeAfford"
                                value="dollar"
                                checked={propertyTaxMode === "dollar"}
                                onChange={() => {
                                  setPropertyTaxMode("dollar");
                                  setPropertyTaxAmount(calculatedHomePrice * (propertyTaxPercent / 100));
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span className={`text-xs transition ${propertyTaxMode === "dollar" ? "font-semibold" : ""}`}>Dollars</span>
                            </label>
                          </div>
                        </fieldset>
                      </div>
                      {propertyTaxMode === "percentage" ? (
                        <div className="relative">
                          <input
                            id="property-tax-percent-afford"
                            type="number"
                            step="0.01"
                            value={propertyTaxPercent || ""}
                            onChange={(e) => {
                              const value = clampNonNegativeNumber(e.target.value === "" ? 0 : Number(e.target.value));
                              setPropertyTaxPercent(value);
                              setPropertyTaxAmount((value / 100) * (calculatedHomePrice || 0));
                            }}
                            aria-label="Property tax percentage"
                            aria-describedby={v.taxMsg ? "property-tax-afford-error" : undefined}
                            aria-invalid={!!v.taxMsg}
                            className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.taxMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                          />
                          <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            id="property-tax-amount-afford"
                            type="text"
                            inputMode="numeric"
                            value={propertyTaxAmount ? Math.round(propertyTaxAmount).toLocaleString("en-US") : ""}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, "");
                              if (raw === "" || /^\d*$/.test(raw)) {
                                const value = raw === "" ? 0 : clampNonNegativeNumber(Number(raw));
                                setPropertyTaxAmount(value);
                                const price = calculatedHomePrice || 0;
                                if (price > 0) setPropertyTaxPercent((value / price) * 100);
                              }
                            }}
                            aria-label="Property tax annual dollar amount"
                            aria-describedby={v.taxMsg ? "property-tax-afford-error" : undefined}
                            aria-invalid={!!v.taxMsg}
                            className={`w-full pl-8 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition ${v.taxMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                          />
                          <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">$</span>
                        </div>
                      )}
                      {v.taxMsg && <FieldError id="property-tax-afford-error">{v.taxMsg}</FieldError>}
                    </div>

                    {/* Homeowners Insurance */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <span className="block text-sm font-semibold">Homeowners insurance (annual)</span>
                        <fieldset className="border-0 p-0 m-0">
                          <legend className="sr-only">Home insurance input type</legend>
                          <div className="flex flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="homeInsuranceModeAfford"
                                value="percentage"
                                checked={homeInsuranceMode === "percentage"}
                                onChange={() => {
                                  setHomeInsuranceMode("percentage");
                                  if (homeInsuranceAmount > 0 && calculatedHomePrice > 0) {
                                    setHomeInsurancePercent((homeInsuranceAmount / calculatedHomePrice) * 100);
                                  } else {
                                    setHomeInsurancePercent(0);
                                  }
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span className={`text-xs transition ${homeInsuranceMode === "percentage" ? "font-semibold" : ""}`}>Percent</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="homeInsuranceModeAfford"
                                value="dollar"
                                checked={homeInsuranceMode === "dollar"}
                                onChange={() => {
                                  setHomeInsuranceMode("dollar");
                                  setHomeInsuranceAmount(calculatedHomePrice * (homeInsurancePercent / 100));
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span className={`text-xs transition ${homeInsuranceMode === "dollar" ? "font-semibold" : ""}`}>Dollars</span>
                            </label>
                          </div>
                        </fieldset>
                      </div>
                      {homeInsuranceMode === "percentage" ? (
                        <div className="relative">
                          <input
                            id="home-insurance-percent-afford"
                            type="number"
                            step="0.01"
                            value={homeInsurancePercent || ""}
                            onChange={(e) => {
                              const value = clampNonNegativeNumber(e.target.value === "" ? 0 : Number(e.target.value));
                              setHomeInsurancePercent(value);
                              setHomeInsuranceAmount((value / 100) * (calculatedHomePrice || 0));
                            }}
                            aria-label="Home insurance percentage"
                            aria-describedby={v.insMsg ? "home-insurance-afford-error" : undefined}
                            aria-invalid={!!v.insMsg}
                            className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.insMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                          />
                          <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            id="home-insurance-amount-afford"
                            type="text"
                            inputMode="numeric"
                            value={homeInsuranceAmount ? Math.round(homeInsuranceAmount).toLocaleString("en-US") : ""}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, "");
                              if (raw === "" || /^\d*$/.test(raw)) {
                                const value = raw === "" ? 0 : clampNonNegativeNumber(Number(raw));
                                setHomeInsuranceAmount(value);
                                const price = calculatedHomePrice || 0;
                                if (price > 0) setHomeInsurancePercent((value / price) * 100);
                              }
                            }}
                            aria-label="Home insurance annual dollar amount"
                            aria-describedby={v.insMsg ? "home-insurance-afford-error" : undefined}
                            aria-invalid={!!v.insMsg}
                            className={`w-full pl-8 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition ${v.insMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                          />
                          <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">$</span>
                        </div>
                      )}
                      {v.insMsg && <FieldError id="home-insurance-afford-error">{v.insMsg}</FieldError>}
                    </div>

                    {/* HOA Dues */}
                    <div className="pb-5">
                      <label htmlFor="hoa-dues-afford" className="block text-sm font-semibold">HOA dues (monthly)</label>
                      <div className="relative">
                        <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] font-medium">$</span>
                        <input
                          id="hoa-dues-afford"
                          type="text"
                          inputMode="numeric"
                          value={hoaDues ? Number(hoaDues).toLocaleString("en-US") : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            if (raw === "" || /^\d*$/.test(raw)) setHoaDues(raw);
                          }}
                          aria-describedby={v.hoaMsg ? "hoa-dues-afford-error" : undefined}
                          aria-invalid={!!v.hoaMsg}
                          className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.hoaMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                        />
                      </div>
                      {v.hoaMsg && <FieldError id="hoa-dues-afford-error">{v.hoaMsg}</FieldError>}
                    </div>
                  </div>
                </div>

                {/* Right Column - Results */}
                <div className="pl-0">
                  <Card aria-live="polite" aria-atomic="true" className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                    {showAffordResults ? (
                      <>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md font-bold">Estimated home price</CardTitle>
                        </CardHeader>
                        <CardContent className="">
                          <div className="mb-6">
                            <p className="text-3xl font-bold text-[var(--color-teal)]">
                              {formatCurrency(Number(results.homePrice))}
                            </p>
                          </div>
                          <ResultsBody headline="This estimate is based on the portion of your monthly budget allocated to principal and interest. Taxes, insurance, and HOA are shown separately." />
                        </CardContent>
                      </>
                    ) : affordCoral ? (
                      <CoralCard message={limitReached ? limitString : fixFieldsString} />
                    ) : (
                      <EmptyPanel />
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Payment ────────────────────────────────────────── */}
            <TabsContent value="payment">
              <p className="text-sm text-muted-foreground">
                Estimate a monthly mortgage payment based on your target home price.
              </p>
              <div className="grid md:grid-cols-2 py-8 gap-8">
                <div className="pb-5">
                  {/* Home Price */}
                  <div className="pb-5">
                    <label htmlFor="home-price" className="block text-sm font-semibold">Home price</label>
                    <div className="relative">
                      <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">$</span>
                      <input
                        id="home-price"
                        type="text"
                        inputMode="numeric"
                        value={homePrice ? Number(homePrice).toLocaleString("en-US") : ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "");
                          if (raw === "" || /^\d*$/.test(raw)) {
                            setHomePrice(raw);
                            const priceValue = Number(raw) || 0;
                            if (downPaymentMode === "dollar") {
                              const percentValue = priceValue > 0 ? (downPaymentAmount / priceValue) * 100 : 0;
                              setDownPaymentPercent(percentValue);
                              setDownPaymentPercentInput(percentValue.toFixed(2));
                            } else {
                              const computedAmount = (downPaymentPercent / 100) * priceValue;
                              setDownPaymentAmount(computedAmount);
                              setDownPaymentAmountInput(Math.round(computedAmount).toString());
                            }
                          }
                        }}
                        onBlur={() => setTouched((t) => ({ ...t, homePrice: true }))}
                        aria-describedby={v.priceMsg ? "home-price-error" : undefined}
                        aria-invalid={!!v.priceMsg}
                        className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition ${v.priceMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                      />
                    </div>
                    {v.priceMsg ? (
                      <FieldError id="home-price-error">{v.priceMsg}</FieldError>
                    ) : (
                      <p className="text-xs mt-1">Enter the purchase price of the home.</p>
                    )}
                  </div>

                  {/* Down Payment */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <span className="block text-sm font-semibold">Down payment</span>
                      <fieldset className="border-0 p-0 m-0">
                        <legend className="sr-only">Down payment type</legend>
                        <div className="flex flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="downPaymentModePayment"
                              checked={downPaymentMode === "percentage"}
                              onChange={() => {
                                setDownPaymentMode("percentage");
                                if (downPaymentAmount >= 0 && Number(homePrice) > 0) {
                                  const percentValue = (downPaymentAmount / Number(homePrice)) * 100;
                                  setDownPaymentPercent(percentValue);
                                  setDownPaymentPercentInput(percentValue.toFixed(2));
                                }
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className={`text-xs transition ${downPaymentMode === "percentage" ? "font-semibold" : ""}`}>Percent</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="downPaymentModePayment"
                              checked={downPaymentMode === "dollar"}
                              onChange={() => {
                                setDownPaymentMode("dollar");
                                const amountValue = Number(homePrice) * (downPaymentPercent / 100);
                                setDownPaymentAmount(amountValue);
                                setDownPaymentAmountInput(Number(homePrice) > 0 ? Math.round(amountValue).toString() : "");
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className={`text-xs transition ${downPaymentMode === "dollar" ? "font-semibold" : ""}`}>Dollars</span>
                          </label>
                        </div>
                      </fieldset>
                    </div>
                    <div className="relative">
                      {downPaymentMode === "percentage" ? (
                        <div className="relative">
                          <input
                            id="down-payment-percent-payment"
                            type="number"
                            min="0"
                            step="0.01"
                            value={downPaymentPercentInput}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setDownPaymentPercentInput(raw);
                              if (raw === "") {
                                setDownPaymentPercent(0);
                                setDownPaymentAmount(0);
                                setDownPaymentAmountInput("0");
                                return;
                              }
                              const value = Number(raw);
                              setDownPaymentPercent(value);
                              const price = Number(homePrice) || 0;
                              const computedAmount = (clampPercent(value) / 100) * price;
                              setDownPaymentAmount(computedAmount);
                              setDownPaymentAmountInput(Math.round(computedAmount).toString());
                            }}
                            aria-label="Down payment percentage"
                            aria-describedby={v.dpMsg ? "down-payment-payment-error" : undefined}
                            aria-invalid={!!v.dpMsg}
                            className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.dpMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                          />
                          <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            id="down-payment-amount-payment"
                            type="text"
                            inputMode="numeric"
                            value={downPaymentAmountInput ? Number(downPaymentAmountInput).toLocaleString("en-US") : ""}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, "");
                              if (raw === "" || /^\d*$/.test(raw)) {
                                setDownPaymentAmountInput(raw);
                                if (raw === "") {
                                  setDownPaymentAmount(0);
                                  setDownPaymentPercent(0);
                                  setDownPaymentPercentInput("0");
                                  return;
                                }
                                // No clamp: an amount >= home price must surface as an error (#24).
                                const amount = Number(raw);
                                setDownPaymentAmount(amount);
                                const price = Number(homePrice) || 0;
                                const percentValue = price > 0 ? (amount / price) * 100 : 0;
                                setDownPaymentPercent(percentValue);
                                setDownPaymentPercentInput(percentValue.toFixed(2));
                              }
                            }}
                            aria-label="Down payment amount in dollars"
                            aria-describedby={v.dpMsg ? "down-payment-payment-error" : undefined}
                            aria-invalid={!!v.dpMsg}
                            className={`w-full pl-8 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition ${v.dpMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                          />
                          <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">$</span>
                        </div>
                      )}
                      {v.dpMsg ? (
                        <FieldError id="down-payment-payment-error">{v.dpMsg}</FieldError>
                      ) : (
                        <p className="text-xs mt-1">Enter 0 if no down payment is planned.</p>
                      )}
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="pb-5">
                    <label htmlFor="interest-rate-payment" className="block text-sm font-semibold">Interest rate</label>
                    <div className="relative">
                      <input
                        id="interest-rate-payment"
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, interestRate: true }))}
                        aria-describedby={v.rateMsg ? "interest-rate-payment-error" : undefined}
                        aria-invalid={!!v.rateMsg}
                        className={`w-full pr-8 pl-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.rateMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                      />
                      <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                    </div>
                    {v.rateMsg && <FieldError id="interest-rate-payment-error">{v.rateMsg}</FieldError>}
                  </div>

                  {/* Loan Term */}
                  <div className="pb-5">
                    <fieldset className="border-0 p-0 m-0">
                      <legend className="block text-sm font-semibold mb-2">Loan term</legend>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex-1 cursor-pointer flex flex-row">
                          <input type="radio" name="loanTermPayment" value="15" checked={loanTerm === 15} onChange={() => setLoanTerm(15)} className="mr-3 w-4 accent-lagunita" />
                          <span className={`self-center ${loanTerm === 15 ? "font-semibold" : "font-normal"}`}>15 years</span>
                        </label>
                        <label className="flex-1 cursor-pointer flex flex-row">
                          <input type="radio" name="loanTermPayment" value="30" checked={loanTerm === 30} onChange={() => setLoanTerm(30)} className="mr-3 w-4 accent-lagunita" />
                          <span className={`self-center ${loanTerm === 30 ? "font-semibold" : "font-normal"}`}>30 years</span>
                        </label>
                      </div>
                    </fieldset>
                  </div>

                  {/* Optional Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h2 className="text-lg font-semibold mb-4">Additional housing costs</h2>

                    {/* Property Taxes */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <span className="block text-sm font-semibold">Property taxes (annual)</span>
                        <fieldset className="border-0 p-0 m-0">
                          <legend className="sr-only">Property tax input type</legend>
                          <div className="flex flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="propertyTaxModePayment"
                                checked={propertyTaxMode === "percentage"}
                                onChange={() => {
                                  setPropertyTaxMode("percentage");
                                  if (propertyTaxAmount > 0 && Number(homePrice) > 0) {
                                    setPropertyTaxPercent((propertyTaxAmount / Number(homePrice)) * 100);
                                  } else {
                                    setPropertyTaxPercent(0);
                                  }
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span className="text-xs">Percent</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="propertyTaxModePayment"
                                checked={propertyTaxMode === "dollar"}
                                onChange={() => {
                                  setPropertyTaxMode("dollar");
                                  setPropertyTaxAmount(Number(homePrice) * (propertyTaxPercent / 100));
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span className="text-xs">Dollars</span>
                            </label>
                          </div>
                        </fieldset>
                      </div>
                      <div className="relative">
                        {propertyTaxMode === "percentage" ? (
                          <>
                            <input
                              id="property-tax-percent-payment"
                              type="number"
                              step="0.01"
                              value={propertyTaxPercent || ""}
                              onChange={(e) => {
                                const value = clampNonNegativeNumber(e.target.value === "" ? 0 : Number(e.target.value));
                                setPropertyTaxPercent(value);
                                setPropertyTaxAmount((value / 100) * (Number(homePrice) || 0));
                              }}
                              aria-label="Property tax percentage"
                              aria-describedby={v.taxMsg ? "property-tax-payment-error" : undefined}
                              aria-invalid={!!v.taxMsg}
                              className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.taxMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                            />
                            <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                          </>
                        ) : (
                          <>
                            <input
                              id="property-tax-amount-payment"
                              type="text"
                              inputMode="numeric"
                              value={propertyTaxAmount ? Math.round(propertyTaxAmount).toLocaleString("en-US") : ""}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                if (raw === "" || /^\d*$/.test(raw)) {
                                  const value = raw === "" ? 0 : clampNonNegativeNumber(Number(raw));
                                  setPropertyTaxAmount(value);
                                  const price = Number(homePrice) || 0;
                                  if (price > 0) setPropertyTaxPercent((value / price) * 100);
                                }
                              }}
                              aria-label="Property tax annual dollar amount"
                              aria-describedby={v.taxMsg ? "property-tax-payment-error" : undefined}
                              aria-invalid={!!v.taxMsg}
                              className={`w-full pl-8 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition ${v.taxMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                            />
                            <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">$</span>
                          </>
                        )}
                      </div>
                      {v.taxMsg && <FieldError id="property-tax-payment-error">{v.taxMsg}</FieldError>}
                    </div>

                    {/* Homeowners Insurance */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <span className="block text-sm font-semibold">Homeowners insurance (annual)</span>
                        <fieldset className="border-0 p-0 m-0">
                          <legend className="sr-only">Home insurance input type</legend>
                          <div className="flex flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="homeInsuranceModePayment"
                                checked={homeInsuranceMode === "percentage"}
                                onChange={() => {
                                  setHomeInsuranceMode("percentage");
                                  if (homeInsuranceAmount > 0 && Number(homePrice) > 0) {
                                    setHomeInsurancePercent((homeInsuranceAmount / Number(homePrice)) * 100);
                                  } else {
                                    setHomeInsurancePercent(0);
                                  }
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span className="text-xs">Percent</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="homeInsuranceModePayment"
                                checked={homeInsuranceMode === "dollar"}
                                onChange={() => {
                                  setHomeInsuranceMode("dollar");
                                  setHomeInsuranceAmount(Number(homePrice) * (homeInsurancePercent / 100));
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span className="text-xs">Dollars</span>
                            </label>
                          </div>
                        </fieldset>
                      </div>
                      <div className="relative">
                        {homeInsuranceMode === "percentage" ? (
                          <>
                            <input
                              id="home-insurance-percent-payment"
                              type="number"
                              step="0.01"
                              value={homeInsurancePercent || ""}
                              onChange={(e) => {
                                const value = clampNonNegativeNumber(e.target.value === "" ? 0 : Number(e.target.value));
                                setHomeInsurancePercent(value);
                                setHomeInsuranceAmount((value / 100) * (Number(homePrice) || 0));
                              }}
                              aria-label="Home insurance percentage"
                              aria-describedby={v.insMsg ? "home-insurance-payment-error" : undefined}
                              aria-invalid={!!v.insMsg}
                              className={`w-full pl-4 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.insMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                            />
                            <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none">%</span>
                          </>
                        ) : (
                          <>
                            <input
                              id="home-insurance-amount-payment"
                              type="text"
                              inputMode="numeric"
                              value={homeInsuranceAmount ? Math.round(homeInsuranceAmount).toLocaleString("en-US") : ""}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                if (raw === "" || /^\d*$/.test(raw)) {
                                  const value = raw === "" ? 0 : clampNonNegativeNumber(Number(raw));
                                  setHomeInsuranceAmount(value);
                                  const price = Number(homePrice) || 0;
                                  if (price > 0) setHomeInsurancePercent((value / price) * 100);
                                }
                              }}
                              aria-label="Home insurance annual dollar amount"
                              aria-describedby={v.insMsg ? "home-insurance-payment-error" : undefined}
                              aria-invalid={!!v.insMsg}
                              className={`w-full pl-8 pr-16 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition ${v.insMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                            />
                            <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                          </>
                        )}
                      </div>
                      {v.insMsg && <FieldError id="home-insurance-payment-error">{v.insMsg}</FieldError>}
                    </div>

                    {/* HOA Dues */}
                    <div className="pb-5">
                      <label htmlFor="hoa-dues-payment" className="block text-sm font-semibold">HOA dues (monthly)</label>
                      <div className="relative">
                        <span aria-hidden="true" className="absolute text-gray-500 left-3 top-1/2 -translate-y-1/2 font-medium">$</span>
                        <input
                          id="hoa-dues-payment"
                          type="text"
                          inputMode="numeric"
                          value={hoaDues ? Number(hoaDues).toLocaleString("en-US") : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            if (raw === "" || /^\d*$/.test(raw)) setHoaDues(raw);
                          }}
                          aria-describedby={v.hoaMsg ? "hoa-dues-payment-error" : undefined}
                          aria-invalid={!!v.hoaMsg}
                          className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${v.hoaMsg ? "border-[var(--color-inline-error)]" : "border-gray-300"}`}
                        />
                      </div>
                      {v.hoaMsg && <FieldError id="hoa-dues-payment-error">{v.hoaMsg}</FieldError>}
                    </div>
                  </div>
                </div>

                {/* Right Column - Results */}
                <div className="pl-0">
                  <Card aria-live="polite" aria-atomic="true" className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                    {showPaymentResults ? (
                      <>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md font-bold">Estimated monthly mortgage payment</CardTitle>
                        </CardHeader>
                        <CardContent className="">
                          <div className="mb-6">
                            <p className="text-3xl font-bold text-[var(--color-teal)]">
                              {formatCurrency(Number(results.monthlyMortgage))}
                            </p>
                          </div>
                          <ResultsBody headline="This estimate shows your monthly mortgage payment based on the loan amount, interest rate, and term. Taxes, insurance, and HOA are shown separately." />
                        </CardContent>
                      </>
                    ) : paymentCoral ? (
                      <CoralCard message={fixFieldsString} />
                    ) : (
                      <EmptyPanel />
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>

            <div className="flex">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-md font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 h-18 whitespace-normal bg-navy border-2 border-navy cursor-pointer hover:bg-white hover:border-2 hover:border-lagunita hover:text-[var(--color-teal)] text-white w-full md:w-auto"
              >
                Reset
              </button>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
