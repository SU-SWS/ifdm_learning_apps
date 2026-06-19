"use client"

import React, { useState, useEffect, useCallback } from 'react';
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card";
import InfoPopover from "@/app/ui/components/popover";

export default function MortgageCalculator() {
  const [mode, setMode] = useState('afford');
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [homePrice, setHomePrice] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState(30);
  const [propertyTaxPercent, setPropertyTaxPercent] = useState(1.25);
  const [homeInsurancePercent, setHomeInsurancePercent] = useState(0.35);
  const [hoaDues, setHoaDues] = useState("");
  const [downPaymentMode, setDownPaymentMode] = useState('percentage');
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);
  const [downPaymentPercentInput, setDownPaymentPercentInput] = useState('20');
  const [downPaymentAmountInput, setDownPaymentAmountInput] = useState('0');
  const [propertyTaxMode, setPropertyTaxMode] = useState('percentage');
  const [propertyTaxAmount, setPropertyTaxAmount] = useState(0);
  const [homeInsuranceMode, setHomeInsuranceMode] = useState('percentage');
  const [homeInsuranceAmount, setHomeInsuranceAmount] = useState(0);
  const [calculatedHomePrice, setCalculatedHomePrice] = useState(0);
  const [showRateError, setShowRateError] = useState(false);

  const [results, setResults] = useState({
    homePrice: 0,
    downPayment: 0,
    loanAmount: 0,
    monthlyMortgage: 0,
    monthlyTax: 0,
    monthlyInsurance: 0,
    totalMonthly: 0,
    hoaDues: 0,
    totalMonthlyHousingCost: 0
  });

  const calculateMortgage = useCallback(() => {
    const r = (Number(interestRate) / 100 / 12);
    const n = loanTerm * 12;
    const hoaDuesNum = Number(hoaDues) || 0;

    if (mode === 'afford') {
      const paymentAmount = Math.max(0, Number(monthlyPayment));
      const interestRateValue = Number(interestRate);

      if (paymentAmount <= 0 || interestRateValue <= 0) {
        setResults({ homePrice: 0, downPayment: 0, loanAmount: 0, monthlyMortgage: 0, monthlyTax: 0, monthlyInsurance: 0, totalMonthly: 0, hoaDues: 0, totalMonthlyHousingCost: 0 });
        setCalculatedHomePrice(0);
        return;
      }

      const loanAmount = paymentAmount * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
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
        if (safeDownPaymentPercent >= 100) {
          setResults({ homePrice: 0, downPayment: 0, loanAmount: 0, monthlyMortgage: 0, monthlyTax: 0, monthlyInsurance: 0, totalMonthly: 0, hoaDues: 0, totalMonthlyHousingCost: 0 });
          setCalculatedHomePrice(0);
          return;
        }
        computedHomePrice = loanAmount / (1 - safeDownPaymentPercent / 100);
        downPayment = computedHomePrice * (safeDownPaymentPercent / 100);
      }

      setCalculatedHomePrice(computedHomePrice);

      const monthlyTax = propertyTaxMode === 'percentage'
        ? (computedHomePrice * (propertyTaxPercent / 100)) / 12
        : propertyTaxAmount / 12;

      const monthlyInsurance = homeInsuranceMode === 'percentage'
        ? (computedHomePrice * (homeInsurancePercent / 100)) / 12
        : homeInsuranceAmount / 12;

      const totalMonthly = Number(monthlyPayment) + monthlyTax + monthlyInsurance + hoaDuesNum;

      setResults({
        homePrice: Math.round(computedHomePrice),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Number(Math.round(Number(monthlyPayment))),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(Number(totalMonthly)),
        hoaDues: Math.round(hoaDuesNum),
        totalMonthlyHousingCost: Math.round(Number(totalMonthly))
      });
    } else if (mode === 'payment') {
      const homePriceAmount = Math.max(0, Number(homePrice));
      const safeDownPaymentPercent = clampPercent(downPaymentPercent);
      const downPayment = homePriceAmount * (safeDownPaymentPercent / 100);
      const loanAmount = clampNonNegativeNumber(homePriceAmount - downPayment);

      if (homePriceAmount <= 0 || safeDownPaymentPercent >= 100) {
        setResults({ homePrice: 0, downPayment: 0, loanAmount: 0, monthlyMortgage: 0, monthlyTax: 0, monthlyInsurance: 0, totalMonthly: 0, hoaDues: 0, totalMonthlyHousingCost: 0 });
        return;
      }

      const monthlyMortgage = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      if (!isFinite(monthlyMortgage) || monthlyMortgage < loanAmount * r) {
        setResults({ homePrice: 0, downPayment: 0, loanAmount: 0, monthlyMortgage: 0, monthlyTax: 0, monthlyInsurance: 0, totalMonthly: 0, hoaDues: 0, totalMonthlyHousingCost: 0 });
        return;
      }

      const monthlyTax = propertyTaxMode === 'percentage'
        ? (Number(homePrice) * (propertyTaxPercent / 100)) / 12
        : propertyTaxAmount / 12;

      const monthlyInsurance = homeInsuranceMode === 'percentage'
        ? (Number(homePrice) * (homeInsurancePercent / 100)) / 12
        : homeInsuranceAmount / 12;

      const totalMonthly = monthlyMortgage + monthlyTax + monthlyInsurance + hoaDuesNum;

      setResults({
        homePrice: Math.round(Number(homePrice)),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyMortgage),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(Number(totalMonthly)),
        hoaDues: Math.round(hoaDuesNum),
        totalMonthlyHousingCost: Math.round(Number(totalMonthly))
      });
    }
  }, [mode, monthlyPayment, homePrice, downPaymentPercent, downPaymentAmount, downPaymentMode, interestRate, loanTerm, propertyTaxPercent, propertyTaxMode, propertyTaxAmount, homeInsurancePercent, homeInsuranceMode, homeInsuranceAmount, hoaDues]);

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

  const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
  const clampNonNegativeNumber = (value: number) => Math.max(0, Number(value) || 0);
  const clampDownPaymentAmount = (amount: number, price: number) => Math.max(0, Math.min(amount, price));

  const emptyResultsString = "Enter values to see your estimate"
  const validationErrorMessage = "Your inputs are not valid for this scenario. Try lowering the down payment or increasing the home price."
  const hasValidationError = (
    Number(monthlyPayment) < 0 ||
    Number(homePrice) < 0 ||
    Number(interestRate) < 0 ||
    Number(propertyTaxPercent) < 0 ||
    Number(homeInsurancePercent) < 0 ||
    Number(propertyTaxAmount) < 0 ||
    Number(homeInsuranceAmount) < 0 ||
    Number(hoaDues) < 0 ||
    downPaymentPercent < 0 ||
    downPaymentPercent >= 100 ||
    downPaymentAmount < 0 ||
    (Number(homePrice) > 0 && downPaymentAmount > Number(homePrice))
  );
  const showAffordResults = mode === 'afford' && Number(monthlyPayment) > 0 && Number(interestRate) > 0 && downPaymentPercent < 100;
  const showPaymentResults = mode === 'payment' && Number(homePrice) > 0 && interestRate !== "" && downPaymentPercent < 100;

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
    setShowRateError(false);
    setResults({ homePrice: 0, downPayment: 0, loanAmount: 0, monthlyMortgage: 0, monthlyTax: 0, monthlyInsurance: 0, totalMonthly: 0, hoaDues: 0, totalMonthlyHousingCost: 0 });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        <div className="mb-8">
          <h1 className="sr-only">Mortgage Calculator Suite</h1>

          {/* Fix 6: role="alert" so screen readers announce the error */}
          {hasValidationError && (
            <div
              role="alert"
              className="mb-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              {validationErrorMessage}
            </div>
          )}

          <Tabs
            value={mode}
            onValueChange={(v) => { setMode(v); setShowRateError(false); }}
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
                      {/* Fix 1: htmlFor links label to input */}
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
                      {/* Fix 2: aria-hidden on decorative symbols */}
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
                        value={
                          monthlyPayment
                            ? Number(monthlyPayment).toLocaleString("en-US")
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "");
                          if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                            setMonthlyPayment(raw);
                          }
                        }}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-xs mt-1">
                      This is the amount allocated to the loan payment
                      (principal + interest). Taxes, insurance, and HOA are
                      added separately below.
                    </p>
                  </div>

                  {/* Down Payment */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <span className="block text-sm font-semibold">
                        Down payment
                      </span>
                      {/* Fix 4: fieldset+legend for radio group */}
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
                                if (
                                  downPaymentAmount >= 0 &&
                                  calculatedHomePrice > 0
                                ) {
                                  const percentValue =
                                    (downPaymentAmount / calculatedHomePrice) *
                                    100;
                                  setDownPaymentPercent(percentValue);
                                  setDownPaymentPercentInput(
                                    percentValue.toFixed(2),
                                  );
                                }
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span
                              className={`text-xs transition ${downPaymentMode === "percentage" ? "font-semibold" : ""}`}
                            >
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
                                const amountValue =
                                  calculatedHomePrice *
                                  (downPaymentPercent / 100);
                                setDownPaymentAmount(amountValue);
                                setDownPaymentAmountInput(
                                  calculatedHomePrice > 0
                                    ? Math.round(amountValue).toString()
                                    : "",
                                );
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span
                              className={`text-xs transition ${downPaymentMode === "dollar" ? "font-semibold" : ""}`}
                            >
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
                              const value = clampPercent(Number(raw));
                              setDownPaymentPercent(value);
                              const price = calculatedHomePrice || 0;
                              const computedAmount = (value / 100) * price;
                              setDownPaymentAmount(computedAmount);
                              setDownPaymentAmountInput(
                                Math.round(computedAmount).toString(),
                              );
                            }}
                            aria-label="Down payment percentage"
                            className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          <input
                            id="down-payment-amount-afford"
                            type="text"
                            inputMode="numeric"
                            value={
                              downPaymentAmountInput
                                ? Number(downPaymentAmountInput).toLocaleString(
                                    "en-US",
                                  )
                                : ""
                            }
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
                            className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                          >
                            $
                          </span>
                        </div>
                      )}
                      <p className="text-xs mt-1">
                        Enter 0 if no down payment is planned.
                      </p>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="pb-5">
                    <label
                      htmlFor="interest-rate-afford"
                      className="block text-sm font-semibold"
                    >
                      Interest rate
                    </label>
                    <div className="relative">
                      <input
                        id="interest-rate-afford"
                        type="number"
                        placeholder=""
                        step="0.1"
                        min="0"
                        value={interestRate}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setInterestRate("");
                            return;
                          }
                          setInterestRate(Math.max(0, Number(raw)).toString());
                        }}
                        onBlur={() => {
                          if (interestRate === "" && monthlyPayment !== "") {
                            setShowRateError(true);
                          } else {
                            setShowRateError(false);
                          }
                        }}
                        aria-describedby={
                          showRateError
                            ? "interest-rate-afford-error"
                            : undefined
                        }
                        aria-invalid={showRateError}
                        className={`w-full pr-8 pl-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showRateError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                      >
                        %
                      </span>
                    </div>
                    {showRateError && (
                      <p
                        id="interest-rate-afford-error"
                        role="alert"
                        className="mt-1 text-sm font-semibold text-[var(--color-inline-error)]"
                      >
                        Please enter an interest rate.
                      </p>
                      )}
                  </div>

                  {/* Loan Term — Fix 4: fieldset+legend */}
                  <div className="pb-5">
                    <fieldset className="border-0 p-0 m-0">
                      <legend className="block text-sm font-semibold mb-2">
                        Loan term
                      </legend>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex-1 cursor-pointer flex flex-row">
                          <input
                            type="radio"
                            name="loanTermAfford"
                            value="15"
                            checked={loanTerm === 15}
                            onChange={() => setLoanTerm(15)}
                            className="mr-3 w-4 accent-lagunita"
                          />
                          <span
                            className={`self-center ${loanTerm === 15 ? "font-semibold" : "font-normal"}`}
                          >
                            15 years
                          </span>
                        </label>
                        <label className="flex-1 cursor-pointer flex flex-row">
                          <input
                            type="radio"
                            name="loanTermAfford"
                            value="30"
                            checked={loanTerm === 30}
                            onChange={() => setLoanTerm(30)}
                            className="mr-3 w-4 accent-lagunita"
                          />
                          <span
                            className={`self-center ${loanTerm === 30 ? "font-semibold" : "font-normal"}`}
                          >
                            30 years
                          </span>
                        </label>
                      </div>
                    </fieldset>
                  </div>

                  {/* Optional Section */}
                  <div className="pt-4 border-t border-gray-200">
                    {/* Fix 7: proper h2 heading */}
                    <h2 className="text-lg font-semibold mb-4">
                      Additional housing costs
                    </h2>

                    {/* Property Taxes */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <span className="block text-sm font-semibold">
                          Property taxes (annual)
                        </span>
                        <fieldset className="border-0 p-0 m-0">
                          <legend className="sr-only">
                            Property tax input type
                          </legend>
                          <div className="flex flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="propertyTaxModeAfford"
                                value="percentage"
                                checked={propertyTaxMode === "percentage"}
                                onChange={() => {
                                  setPropertyTaxMode("percentage");
                                  if (
                                    propertyTaxAmount &&
                                    propertyTaxAmount > 0 &&
                                    calculatedHomePrice > 0
                                  ) {
                                    setPropertyTaxPercent(
                                      (propertyTaxAmount /
                                        calculatedHomePrice) *
                                        100,
                                    );
                                  } else {
                                    setPropertyTaxPercent(0);
                                  }
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span
                                className={`text-xs transition ${propertyTaxMode === "percentage" ? "font-semibold" : ""}`}
                              >
                                Percent
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="propertyTaxModeAfford"
                                value="dollar"
                                checked={propertyTaxMode === "dollar"}
                                onChange={() => {
                                  setPropertyTaxMode("dollar");
                                  setPropertyTaxAmount(
                                    calculatedHomePrice *
                                      (propertyTaxPercent / 100),
                                  );
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span
                                className={`text-xs transition ${propertyTaxMode === "dollar" ? "font-semibold" : ""}`}
                              >
                                Dollars
                              </span>
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
                              const value = clampNonNegativeNumber(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value),
                              );
                              setPropertyTaxPercent(value);
                              setPropertyTaxAmount(
                                (value / 100) * (calculatedHomePrice || 0),
                              );
                            }}
                            aria-label="Property tax percentage"
                            className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          <input
                            id="property-tax-amount-afford"
                            type="text"
                            inputMode="numeric"
                            value={
                              propertyTaxAmount
                                ? Math.round(propertyTaxAmount).toLocaleString(
                                    "en-US",
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, "");
                              if (raw === "" || /^\d*$/.test(raw)) {
                                const value =
                                  raw === ""
                                    ? 0
                                    : clampNonNegativeNumber(Number(raw));
                                setPropertyTaxAmount(value);
                                const price = calculatedHomePrice || 0;
                                if (price > 0)
                                  setPropertyTaxPercent((value / price) * 100);
                              }
                            }}
                            aria-label="Property tax annual dollar amount"
                            className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                          >
                            $
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Homeowners Insurance */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <span className="block text-sm font-semibold">
                          Homeowners insurance (annual)
                        </span>
                        <fieldset className="border-0 p-0 m-0">
                          <legend className="sr-only">
                            Home insurance input type
                          </legend>
                          <div className="flex flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="homeInsuranceModeAfford"
                                value="percentage"
                                checked={homeInsuranceMode === "percentage"}
                                onChange={() => {
                                  setHomeInsuranceMode("percentage");
                                  if (
                                    homeInsuranceAmount &&
                                    homeInsuranceAmount > 0 &&
                                    calculatedHomePrice > 0
                                  ) {
                                    setHomeInsurancePercent(
                                      (homeInsuranceAmount /
                                        calculatedHomePrice) *
                                        100,
                                    );
                                  } else {
                                    setHomeInsurancePercent(0);
                                  }
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span
                                className={`text-xs transition ${homeInsuranceMode === "percentage" ? "font-semibold" : ""}`}
                              >
                                Percent
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="homeInsuranceModeAfford"
                                value="dollar"
                                checked={homeInsuranceMode === "dollar"}
                                onChange={() => {
                                  setHomeInsuranceMode("dollar");
                                  setHomeInsuranceAmount(
                                    calculatedHomePrice *
                                      (homeInsurancePercent / 100),
                                  );
                                }}
                                className="w-4 h-4 accent-lagunita cursor-pointer"
                              />
                              <span
                                className={`text-xs transition ${homeInsuranceMode === "dollar" ? "font-semibold" : ""}`}
                              >
                                Dollars
                              </span>
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
                              const value = clampNonNegativeNumber(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value),
                              );
                              setHomeInsurancePercent(value);
                              setHomeInsuranceAmount(
                                (value / 100) * (calculatedHomePrice || 0),
                              );
                            }}
                            aria-label="Home insurance percentage"
                            className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          <input
                            id="home-insurance-amount-afford"
                            type="text"
                            inputMode="numeric"
                            value={
                              homeInsuranceAmount
                                ? Math.round(
                                    homeInsuranceAmount,
                                  ).toLocaleString("en-US")
                                : ""
                            }
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, "");
                              if (raw === "" || /^\d*$/.test(raw)) {
                                const value =
                                  raw === ""
                                    ? 0
                                    : clampNonNegativeNumber(Number(raw));
                                setHomeInsuranceAmount(value);
                                const price = calculatedHomePrice || 0;
                                if (price > 0)
                                  setHomeInsurancePercent(
                                    (value / price) * 100,
                                  );
                              }
                            }}
                            aria-label="Home insurance annual dollar amount"
                            className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                          >
                            $
                          </span>
                        </div>
                      )}
                    </div>

                    {/* HOA Dues */}
                    <div className="pb-5">
                      <label
                        htmlFor="hoa-dues-afford"
                        className="block text-sm font-semibold"
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
                          id="hoa-dues-afford"
                          type="text"
                          inputMode="numeric"
                          value={
                            hoaDues
                              ? Number(hoaDues).toLocaleString("en-US")
                              : ""
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            if (raw === "") {
                              setHoaDues("");
                              return;
                            }
                            const clamped = Math.min(
                              Math.max(0, Number(raw)),
                              100000,
                            );
                            setHoaDues(clamped.toString());
                          }}
                          placeholder=""
                          step="1"
                          min="0"
                          max="100000"
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Results — Fix 3: aria-live */}
                <div className="pl-0">
                  <Card
                    aria-live="polite"
                    aria-atomic="true"
                    className="bg-[var(--card-background)] rounded-3xl p-[32px]"
                  >
                    {showAffordResults ? (
                      <>
                        <CardHeader className="pb-2">
                          {/* Fix 7: explicit h2 */}
                          <CardTitle className="text-md font-bold">
                            Estimated home price
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="">
                          <div className="mb-6">
                            <p
                              className={
                                results.homePrice > 0
                                  ? "text-3xl font-bold text-[var(--color-teal)]"
                                  : "text-lg font-bold text-gray-500 italic"
                              }
                            >
                              {results.homePrice > 0
                                ? formatCurrency(Number(results.homePrice))
                                : emptyResultsString}
                            </p>
                          </div>
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
                                <h3 className="text-lg font-bold mb-4">
                                  Monthly breakdown
                                </h3>
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
                                  {formatCurrency(
                                    results.monthlyInsurance || 0,
                                  )}
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
                                  {formatCurrency(
                                    results.totalMonthlyHousingCost || 0,
                                  )}
                                </div>
                              </div>
                              <div className="py-5">
                                <p className="text-sm">
                                  This estimate is based on the portion of your
                                  monthly budget allocated to principal and
                                  interest. Taxes, insurance, and HOA are shown
                                  separately.
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <div className="min-h-[28rem]" />
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Payment ────────────────────────────────────────── */}
            <TabsContent value="payment">
              <p className="text-sm text-muted-foreground">
                Estimate a monthly mortgage payment based on your target home
                price.
              </p>
              <div className="grid md:grid-cols-2 py-8 gap-8">
                <div className="pb-5">
                  {/* Home Price */}
                  <div className="pb-5">
                    <label
                      htmlFor="home-price"
                      className="block text-sm font-semibold"
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
                        placeholder=""
                        value={
                          homePrice
                            ? Number(homePrice).toLocaleString("en-US")
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "");
                          if (raw === "" || /^\d*$/.test(raw)) {
                            setHomePrice(raw);
                            const priceValue = Math.max(0, Number(raw));
                            if (downPaymentMode === "dollar") {
                              const clampedDownPayment = clampDownPaymentAmount(
                                downPaymentAmount,
                                priceValue,
                              );
                              setDownPaymentAmount(clampedDownPayment);
                              setDownPaymentAmountInput(
                                Math.round(clampedDownPayment).toString(),
                              );
                              const percentValue =
                                priceValue > 0
                                  ? (clampedDownPayment / priceValue) * 100
                                  : 0;
                              setDownPaymentPercent(percentValue);
                              setDownPaymentPercentInput(
                                percentValue.toFixed(2),
                              );
                            } else {
                              const computedAmount =
                                (downPaymentPercent / 100) * priceValue;
                              setDownPaymentAmount(computedAmount);
                              setDownPaymentAmountInput(
                                Math.round(computedAmount).toString(),
                              );
                            }
                          }
                        }}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                    </div>
                    <p className="text-xs mt-1">
                      Enter the purchase price of the home.
                    </p>
                  </div>

                  {/* Down Payment */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <span className="block text-sm font-semibold">
                        Down payment
                      </span>
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
                                if (
                                  downPaymentAmount >= 0 &&
                                  Number(homePrice) > 0
                                ) {
                                  const percentValue =
                                    (downPaymentAmount / Number(homePrice)) *
                                    100;
                                  setDownPaymentPercent(percentValue);
                                  setDownPaymentPercentInput(
                                    percentValue.toFixed(2),
                                  );
                                }
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span
                              className={`text-xs transition ${downPaymentMode === "percentage" ? "font-semibold" : ""}`}
                            >
                              Percent
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="downPaymentModePayment"
                              checked={downPaymentMode === "dollar"}
                              onChange={() => {
                                setDownPaymentMode("dollar");
                                const amountValue =
                                  Number(homePrice) *
                                  (downPaymentPercent / 100);
                                setDownPaymentAmount(amountValue);
                                setDownPaymentAmountInput(
                                  Number(homePrice) > 0
                                    ? Math.round(amountValue).toString()
                                    : "",
                                );
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span
                              className={`text-xs transition ${downPaymentMode === "dollar" ? "font-semibold" : ""}`}
                            >
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
                              const value = clampPercent(Number(raw));
                              setDownPaymentPercent(value);
                              const price = Number(homePrice) || 0;
                              const computedAmount = (value / 100) * price;
                              setDownPaymentAmount(computedAmount);
                              setDownPaymentAmountInput(
                                Math.round(computedAmount).toString(),
                              );
                            }}
                            aria-label="Down payment percentage"
                            className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          <input
                            id="down-payment-amount-payment"
                            type="text"
                            inputMode="numeric"
                            value={
                              downPaymentAmountInput
                                ? Number(downPaymentAmountInput).toLocaleString(
                                    "en-US",
                                  )
                                : ""
                            }
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
                                const maxPrice = Number(homePrice) || 0;
                                const clampedAmount = clampDownPaymentAmount(
                                  Number(raw),
                                  maxPrice,
                                );
                                setDownPaymentAmount(clampedAmount);
                                const percentValue =
                                  maxPrice > 0
                                    ? (clampedAmount / maxPrice) * 100
                                    : 0;
                                setDownPaymentPercent(percentValue);
                                setDownPaymentPercentInput(
                                  percentValue.toFixed(2),
                                );
                              }
                            }}
                            aria-label="Down payment amount in dollars"
                            className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                          >
                            $
                          </span>
                        </div>
                      )}
                      <p className="text-xs mt-1">
                        Enter 0 if no down payment is planned.
                      </p>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="pb-5">
                    <label
                      htmlFor="interest-rate-payment"
                      className="block text-sm font-semibold"
                    >
                      Interest rate
                    </label>
                    <div className="relative">
                      <input
                        id="interest-rate-payment"
                        type="number"
                        placeholder=""
                        step="0.1"
                        min="0"
                        value={interestRate}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') { setInterestRate(''); return; }
                          setInterestRate(Math.max(0, Number(raw)).toString());
                        }}
                        onBlur={() => {
                          if (interestRate === '' && homePrice !== '') {
                            setShowRateError(true);
                          } else {
                            setShowRateError(false);
                          }
                        }}
                        aria-describedby={showRateError ? "interest-rate-payment-error" : undefined}
                        aria-invalid={showRateError}
                        className={`w-full pr-8 pl-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showRateError ? "border-[var(--color-inline-error)] border-2" : ""}`}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                      >
                        %
                      </span>
                    </div>
                    {showRateError && (
                      <p id="interest-rate-payment-error" role="alert" className="mt-1 text-sm font-semibold text-[var(--color-inline-error)]">
                        Please enter an interest rate.
                      </p>
                    )}
                  </div>

                  {/* Loan Term — Fix 5: separate name from afford tab */}
                  <div className="pb-5">
                    <fieldset className="border-0 p-0 m-0">
                      <legend className="block text-sm font-semibold mb-2">
                        Loan term
                      </legend>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex-1 cursor-pointer flex flex-row">
                          <input
                            type="radio"
                            name="loanTermPayment"
                            value="15"
                            checked={loanTerm === 15}
                            onChange={() => setLoanTerm(15)}
                            className="mr-3 w-4 accent-lagunita"
                          />
                          <span
                            className={`self-center ${loanTerm === 15 ? "font-semibold" : "font-normal"}`}
                          >
                            15 years
                          </span>
                        </label>
                        <label className="flex-1 cursor-pointer flex flex-row">
                          <input
                            type="radio"
                            name="loanTermPayment"
                            value="30"
                            checked={loanTerm === 30}
                            onChange={() => setLoanTerm(30)}
                            className="mr-3 w-4 accent-lagunita"
                          />
                          <span
                            className={`self-center ${loanTerm === 30 ? "font-semibold" : "font-normal"}`}
                          >
                            30 years
                          </span>
                        </label>
                      </div>
                    </fieldset>
                  </div>

                  {/* Optional Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h2 className="text-lg font-semibold mb-4">
                      Additional housing costs
                    </h2>

                    {/* Property Taxes */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <span className="block text-sm font-semibold">
                          Property taxes (annual)
                        </span>
                        <fieldset className="border-0 p-0 m-0">
                          <legend className="sr-only">
                            Property tax input type
                          </legend>
                          <div className="flex flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="propertyTaxModePayment"
                                checked={propertyTaxMode === "percentage"}
                                onChange={() => {
                                  setPropertyTaxMode("percentage");
                                  if (
                                    propertyTaxAmount &&
                                    propertyTaxAmount > 0 &&
                                    Number(homePrice) > 0
                                  ) {
                                    setPropertyTaxPercent(
                                      (propertyTaxAmount / Number(homePrice)) *
                                        100,
                                    );
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
                                  setPropertyTaxAmount(
                                    Number(homePrice) *
                                      (propertyTaxPercent / 100),
                                  );
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
                              value={propertyTaxPercent || ""}
                              onChange={(e) => {
                                const value = clampNonNegativeNumber(
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                                );
                                setPropertyTaxPercent(value);
                                setPropertyTaxAmount(
                                  (value / 100) * (Number(homePrice) || 0),
                                );
                              }}
                              aria-label="Property tax percentage"
                              className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                            >
                              %
                            </span>
                          </>
                        ) : (
                          <>
                            <input
                              id="property-tax-amount-payment"
                              type="text"
                              inputMode="numeric"
                              value={
                                propertyTaxAmount
                                  ? Math.round(
                                      propertyTaxAmount,
                                    ).toLocaleString("en-US")
                                  : ""
                              }
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                if (raw === "" || /^\d*$/.test(raw)) {
                                  const value =
                                    raw === ""
                                      ? 0
                                      : clampNonNegativeNumber(Number(raw));
                                  setPropertyTaxAmount(value);
                                  const price = Number(homePrice) || 0;
                                  if (price > 0)
                                    setPropertyTaxPercent(
                                      (value / price) * 100,
                                    );
                                }
                              }}
                              aria-label="Property tax annual dollar amount"
                              className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                            >
                              $
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Homeowners Insurance */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <span className="block text-sm font-semibold">
                          Homeowners insurance (annual)
                        </span>
                        <fieldset className="border-0 p-0 m-0">
                          <legend className="sr-only">
                            Home insurance input type
                          </legend>
                          <div className="flex flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="homeInsuranceModePayment"
                                checked={homeInsuranceMode === "percentage"}
                                onChange={() => {
                                  setHomeInsuranceMode("percentage");
                                  if (
                                    homeInsuranceAmount &&
                                    homeInsuranceAmount > 0 &&
                                    Number(homePrice) > 0
                                  ) {
                                    setHomeInsurancePercent(
                                      (homeInsuranceAmount /
                                        Number(homePrice)) *
                                        100,
                                    );
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
                                  setHomeInsuranceAmount(
                                    Number(homePrice) *
                                      (homeInsurancePercent / 100),
                                  );
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
                              value={homeInsurancePercent || ""}
                              onChange={(e) => {
                                const value = clampNonNegativeNumber(
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                                );
                                setHomeInsurancePercent(value);
                                setHomeInsuranceAmount(
                                  (value / 100) * (Number(homePrice) || 0),
                                );
                              }}
                              aria-label="Home insurance percentage"
                              className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-symbols)] pointer-events-none"
                            >
                              %
                            </span>
                          </>
                        ) : (
                          <>
                            <input
                              id="home-insurance-amount-payment"
                              type="text"
                              inputMode="numeric"
                              value={
                                homeInsuranceAmount
                                  ? Math.round(
                                      homeInsuranceAmount,
                                    ).toLocaleString("en-US")
                                  : ""
                              }
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                if (raw === "" || /^\d*$/.test(raw)) {
                                  const value =
                                    raw === ""
                                      ? 0
                                      : clampNonNegativeNumber(Number(raw));
                                  setHomeInsuranceAmount(value);
                                  const price = Number(homePrice) || 0;
                                  if (price > 0)
                                    setHomeInsurancePercent(
                                      (value / price) * 100,
                                    );
                                }
                              }}
                              aria-label="Home insurance annual dollar amount"
                              className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                            >
                              $
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* HOA Dues */}
                    <div className="pb-5">
                      <label
                        htmlFor="hoa-dues-payment"
                        className="block text-sm font-semibold"
                      >
                        HOA dues (monthly)
                      </label>
                      <div className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute text-gray-500 left-3 top-1/2 -translate-y-1/2 font-medium"
                        >
                          $
                        </span>
                        <input
                          id="hoa-dues-payment"
                          type="text"
                          inputMode="numeric"
                          value={
                            hoaDues
                              ? Number(hoaDues).toLocaleString("en-US")
                              : ""
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, "");
                            if (raw === "") {
                              setHoaDues("");
                              return;
                            }
                            setHoaDues(Math.max(0, Number(raw)).toString());
                          }}
                          placeholder=""
                          step="1"
                          min="0"
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Results — Fix 3: aria-live */}
                <div className="pl-0">
                  <Card
                    aria-live="polite"
                    aria-atomic="true"
                    className="bg-[var(--card-background)] rounded-3xl p-[32px]"
                  >
                    {showPaymentResults ? (
                      <>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md font-bold">
                            Estimated monthly mortgage payment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="">
                          <div className="mb-6">
                            <p
                              className={
                                results.homePrice > 0
                                  ? "text-3xl font-bold text-[var(--color-teal)]"
                                  : "text-lg font-bold text-gray-500 italic"
                              }
                            >
                              {results.homePrice > 0
                                ? formatCurrency(
                                    Number(results.monthlyMortgage),
                                  )
                                : emptyResultsString}
                            </p>
                          </div>
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
                                  {formatCurrency(results.loanAmount)}
                                </div>
                              </div>
                              <div className="flex flex-col my-3">
                                <h3 className="text-lg font-bold mb-4">
                                  Monthly breakdown
                                </h3>
                                <hr />
                              </div>
                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                                  Mortgage payment:
                                </div>
                                <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                                  {formatCurrency(results.monthlyMortgage)}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                                  Property taxes:
                                </div>
                                <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                                  {formatCurrency(results.monthlyTax)}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                                  Insurance:
                                </div>
                                <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                                  {formatCurrency(results.monthlyInsurance)}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                                  HOA:
                                </div>
                                <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                                  {formatCurrency(results.hoaDues)}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                                <div className="w-full sm:w-[50%] text-md p-4 font-bold text-white bg-navy rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                                  Total monthly housing cost:
                                </div>
                                <div className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold bg-lagunita-lighter text-black overflow-hidden text-ellipsis flex items-center">
                                  {formatCurrency(
                                    results.totalMonthlyHousingCost,
                                  )}
                                </div>
                              </div>
                              <div className="py-5">
                                <p className="text-sm">
                                  This estimate shows your monthly mortgage
                                  payment based on the loan amount, interest
                                  rate, and term. Taxes, insurance, and HOA are
                                  shown separately.
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <div className="min-h-[28rem]" />
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Fix 8: type="button" to prevent accidental form submit */}
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
