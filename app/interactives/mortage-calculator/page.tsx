"use client"

import React, { useState, useEffect, useCallback } from 'react';
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card";

export default function MortgageCalculator() {
  const [mode, setMode] = useState('afford'); // 'afford', 'affordability', 'payment'
  const [monthlyPayment, setMonthlyPayment] = useState(2500);
  const [homePrice, setHomePrice] = useState(500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(7.0);
  const [loanTerm, setLoanTerm] = useState(30);
  const [propertyTaxPercent, setPropertyTaxPercent] = useState(1.25);
  const [homeInsurancePercent, setHomeInsurancePercent] = useState(0.35);
  const [hoaDues, setHoaDues] = useState(0);
  const [downPaymentMode, setDownPaymentMode] = useState('percentage');
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);

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
    const r = interestRate / 100 / 12; // Monthly interest rate
    const n = loanTerm * 12; // Total number of payments

    if (mode === 'afford') {
      // Calculate home price from desired monthly payment
      const loanAmount = monthlyPayment * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
      const computedHomePrice = loanAmount / (1 - downPaymentPercent / 100);
      const downPayment = computedHomePrice * (downPaymentPercent / 100);
      const monthlyTax = (computedHomePrice * (propertyTaxPercent / 100)) / 12;
      const monthlyInsurance = (computedHomePrice * (homeInsurancePercent / 100)) / 12;
      const totalMonthly = monthlyPayment + monthlyTax + monthlyInsurance + hoaDues;

      setResults({
        homePrice: Math.round(computedHomePrice),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyPayment),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(totalMonthly),
        hoaDues: Math.round(hoaDues),
        totalMonthlyHousingCost: Math.round(totalMonthly)
      });
    } else if (mode === 'payment') {
      // Calculate monthly payment from home price
      const downPayment = homePrice * (downPaymentPercent / 100);
      const loanAmount = homePrice - downPayment;
      const monthlyMortgage = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const monthlyTax = (homePrice * (propertyTaxPercent / 100)) / 12;
      const monthlyInsurance = (homePrice * (homeInsurancePercent / 100)) / 12;
      const totalMonthly = monthlyMortgage + monthlyTax + monthlyInsurance + hoaDues;

      setResults({
        homePrice: Math.round(homePrice),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyMortgage),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(totalMonthly),
        hoaDues: Math.round(hoaDues),
        totalMonthlyHousingCost: Math.round(totalMonthly)
      });
    }
  }, [mode, monthlyPayment, homePrice, downPaymentPercent, interestRate, loanTerm, propertyTaxPercent, homeInsurancePercent, hoaDues]);

  useEffect(() => {
    calculateMortgage();
  }, [calculateMortgage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div>
        <ThemeToggle />
        <div className="mb-8">
          {/* Header */}
          <h1 className="sr-only">Mortgage Calculator Suite</h1>

          <Tabs defaultValue={mode} onValueChange={(v) => setMode(v)} className="w-full">
            <TabsList className="grid w-full grid-rows-1 sm:grid-cols-2 p-0 gap-4">
              <TabsTrigger value="afford" className="cursor-pointer">Home you can afford</TabsTrigger>
              <TabsTrigger value="payment" className="cursor-pointer">Monthly payment</TabsTrigger>
            </TabsList>

            <TabsContent value="afford">
              <div className="grid md:grid-cols-2 gap-8 py-8">
                <div className="pr-0">  
                  <div className="pb-5">
                    <label className="block text-sm font-semibold text-gray-700">
                      Monthly mortgage payment
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        type="number"
                        value={monthlyPayment}
                        onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Taxes, insurance, and HOA are separate—add estimates below to see your total cost.</p>
                  </div>
                  {/* Down Payment */}
                  <div>
                    <div className="flex flex-row pb-2 justify-between">
                      <label className="block text-sm font-semibold text-gray-700">Down payment</label>
                      <div className="flex flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDownPaymentMode('percentage');
                            // if switching from dollar, compute percent
                            if (downPaymentAmount && downPaymentAmount > 0) {
                              setDownPaymentPercent((downPaymentAmount / homePrice) * 100);
                            } else {
                              setDownPaymentPercent(downPaymentPercent);
                            }
                          }}
                          className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                            downPaymentMode === 'percentage'
                              ? 'bg-navy border-navy text-white'
                              : 'bg-white border-lagunita text-lagunita'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDownPaymentMode('dollar');
                            // set dollar amount from results if available
                            setDownPaymentAmount(results.downPayment || (homePrice * (downPaymentPercent / 100)));
                          }}
                          className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                            downPaymentMode === 'dollar'
                              ? 'bg-navy border-navy text-white'
                              : 'bg-white border-lagunita text-lagunita'
                          }`}
                        >
                          $
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={downPaymentMode === 'percentage' ? downPaymentPercent : downPaymentAmount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (downPaymentMode === 'percentage') {
                            setDownPaymentPercent(value);
                          } else {
                            setDownPaymentAmount(value);
                            // Calculate percentage from dollar amount
                            setDownPaymentPercent((value / homePrice) * 100);
                          }
                        }}
                        className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                      
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold text-gray-700">Interest rate (APR)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                  </div>

                  {/* Loan Term */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold text-gray-700">Loan term</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLoanTerm(15)}
                        className={`flex-1 py-3 rounded-lg font-medium transition ${
                          loanTerm === 15
                            ? 'bg-navy cursor-pointer border-2 border-navy hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white'
                            : 'bg-white border-2 border-lagunita text-lagunita'
                        }`}
                      >
                        15 years
                      </button>
                      <button
                        onClick={() => setLoanTerm(30)}
                        className={`flex-1 py-3 rounded-lg font-medium transition ${
                          loanTerm === 30
                            ? 'bg-navy cursor-pointer border-2 border-navy hover:bg-white hover:border-2 hover:border-lagunita hover:text-lagunita text-white'
                            : 'bg-white border-2 border-lagunita text-lagunita'
                        }`}
                      >
                        30 years
                      </button>
                    </div>
                  </div>
                  {/* Optional Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Optional</h3>

                    {/* Property Taxes */}
                    <div className="pb-5">
                      <label className="block text-sm font-semibold text-gray-700">Property taxes (yearly)</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            value={propertyTaxPercent}
                            onChange={(e) => setPropertyTaxPercent(Number(e.target.value))}
                            className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                        </div>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                          <input
                            type="text"
                            value={formatCurrency(results.homePrice * (propertyTaxPercent / 100))}
                            readOnly
                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Homeowners Insurance */}
                    <div className="pb-5">
                      <label className="block text-sm font-semibold text-gray-700">Homeowners insurance (annual)</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            value={homeInsurancePercent}
                            onChange={(e) => setHomeInsurancePercent(Number(e.target.value))}
                            className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                        </div>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                          <input
                            type="text"
                            value={formatCurrency(results.homePrice * (homeInsurancePercent / 100))}
                            readOnly
                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* HOA Dues */}
                    <div className="pb-5">
                      <label className="block text-sm font-semibold text-gray-700">HOA dues (monthly)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <input
                          type="number"
                          value={hoaDues}
                          onChange={(e) => setHoaDues(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pl-0">
                {/* Right Column - Results */}
                  <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-bold">Results</CardTitle>
                    </CardHeader>
                    <CardContent className="">
                      <div className="mb-6">
                        <p className="text-sm font-medium">Estimated home price</p>
                        <p className="text-3xl font-bold text-lagunita">{formatCurrency(results.homePrice)}</p>
                      </div>

                      <div className="rounded-lg">
                        <div className="innerwrapper">
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md  p-4 font-bold text-black rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark items-center">
                              Down payment:
                            </div>
                            <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                              {formatCurrency(results.downPayment)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                              Loan amount:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg text-palo-verde font-bold overflow-hidden text-ellipsis bg-[var(--secondary-background)]"
                            >
                              {formatCurrency(results.loanAmount)}
                            </div>
                          </div>
                          <div className="flex flex-col my-3">
                            <h3 className="text-lg uppercase font-bold text-gray-800 mb-4">Monthly breakdown</h3>
                            <hr/>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Mortgage (P&I):
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.monthlyMortgage)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Property taxes:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.monthlyTax)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Insurance:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.monthlyInsurance)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              HOA:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.hoaDues)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-white bg-navy rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Total monthly housing cost:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold bg-lagunita-lighter text-black overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.totalMonthlyHousingCost)}
                            </div>
                          </div>
                          <div className="space-y-6">
                          {/* Disclaimer */}
                            <div className="py-5">
                              <p className="text-sm">
                                Mortgage estimates calculate principal and interest. Taxes, insurance, and HOA are added separately to show total housing cost.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment">
              <div className="grid md:grid-cols-2 py-8 gap-8">
                {/* Left Column - Inputs */}
                <div className="pb-5">
                  <div className="pb-5">
                    <label className="block text-sm font-semibold text-gray-700">
                      Home price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        type="number"
                        value={homePrice}
                        onChange={(e) => setHomePrice(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Enter the purchase price of the home.</p>
                  </div>

                  {/* Down Payment */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold text-gray-700">Down payment</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={downPaymentMode === 'percentage' ? downPaymentPercent : downPaymentAmount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (downPaymentMode === 'percentage') {
                            setDownPaymentPercent(value);
                          } else {
                            setDownPaymentAmount(value);
                            // Calculate percentage from dollar amount
                            setDownPaymentPercent((value / homePrice) * 100);
                          }
                        }}
                        className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDownPaymentMode('percentage');
                            if (downPaymentAmount && downPaymentAmount > 0) {
                              setDownPaymentPercent((downPaymentAmount / homePrice) * 100);
                            }
                          }}
                          className={`px-3 py-1.5 font-bold rounded-md border-2 transition ${
                            downPaymentMode === 'percentage'
                              ? 'bg-navy border-navy text-white'
                              : 'bg-white border-lagunita text-lagunita'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDownPaymentMode('dollar');
                            setDownPaymentAmount(results.downPayment || (homePrice * (downPaymentPercent / 100)));
                          }}
                          className={`px-3 py-1.5 font-bold rounded-md border-2 transition ${
                            downPaymentMode === 'dollar'
                              ? 'bg-navy border-navy text-white'
                              : 'bg-white border-lagunita text-lagunita'
                          }`}
                        >
                          $
                        </button>
                      </div>
                    </div>
                </div>

              {/* Interest Rate */}
              <div className="pb-5">
                <label className="block text-sm font-semibold text-gray-700">Interest rate (APR)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                </div>
              </div>

              {/* Loan Term */}
              <div className="pb-5">
                <label className="block text-sm font-semibold text-gray-700">Loan term</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLoanTerm(15)}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${
                      loanTerm === 15
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    15 years
                  </button>
                  <button
                    onClick={() => setLoanTerm(30)}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${
                      loanTerm === 30
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    30 years
                  </button>
                </div>
              </div>

              {/* Optional Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Optional</h3>

                {/* Property Taxes */}
                <div className="pb-5">
                  <label className="block text-sm font-semibold text-gray-700">Property taxes (yearly)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={propertyTaxPercent}
                        onChange={(e) => setPropertyTaxPercent(Number(e.target.value))}
                        className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        type="text"
                        value={formatCurrency(results.homePrice * (propertyTaxPercent / 100))}
                        readOnly
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Homeowners Insurance */}
                <div className="pb-5">
                  <label className="block text-sm font-semibold text-gray-700">Homeowners insurance (annual)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.01"
                        value={homeInsurancePercent}
                        onChange={(e) => setHomeInsurancePercent(Number(e.target.value))}
                        className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <input
                        type="text"
                        value={formatCurrency(results.homePrice * (homeInsurancePercent / 100))}
                        readOnly
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* HOA Dues */}
                <div className="pb-5">
                  <label className="block text-sm font-semibold text-gray-700">HOA dues (monthly)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      value={hoaDues}
                      onChange={(e) => setHoaDues(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="pl-0">
              {/* Right Column - Results */}
                <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-bold">Results</CardTitle>
                  </CardHeader>
                  <CardContent className="">
                    <div className="mb-6">
                      <p className="text-sm font-medium">Monthly mortgage payment (P&I)</p>
                      <p className="text-3xl font-bold text-lagunita">{formatCurrency(results.monthlyMortgage)}</p>
                    </div>

                    <div className="rounded-lg">
                      <div className="innerwrapper">
                        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                          <div
                              className="w-full sm:w-[50%] text-md  p-4 font-bold text-black rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark items-center">
                            Down payment:
                          </div>
                          <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                            {formatCurrency(results.downPayment)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                          <div
                              className="w-full sm:w-[50%] text-md p-4 text-black font-bold rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark">
                            Loan amount:
                          </div>
                          <div
                              className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg text-palo-verde font-bold overflow-hidden text-ellipsis bg-[var(--secondary-background)]"
                          >
                            {formatCurrency(results.loanAmount)}
                          </div>
                        </div>
                        <div className="flex flex-col my-3">
                          <h3 className="text-lg uppercase font-bold text-gray-800 mb-4">Monthly breakdown</h3>
                          <hr/>
                        </div>
                        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                          <div
                              className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                            Mortgage (P&I):
                          </div>
                          <div
                              className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                            {formatCurrency(results.monthlyMortgage)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                          <div
                              className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                            Property taxes:
                          </div>
                          <div
                              className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                            {formatCurrency(results.monthlyTax)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                          <div
                              className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                            Insurance:
                          </div>
                          <div
                              className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                            {formatCurrency(results.monthlyInsurance)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                          <div
                              className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                            HOA:
                          </div>
                          <div
                              className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                            {formatCurrency(results.hoaDues)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                          <div
                              className="w-full sm:w-[50%] text-md p-4 font-bold text-white bg-navy rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                            Total monthly housing cost:
                          </div>
                          <div
                              className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold bg-lagunita-lighter text-black overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                            {formatCurrency(results.totalMonthlyHousingCost)}
                          </div>
                        </div>
                        <div className="space-y-6">
                        {/* Disclaimer */}
                          <div className="py-5">
                            <p className="text-sm">
                              Mortgage estimates calculate principal and interest. Taxes, insurance, and HOA are added separately to show total housing cost.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
              </div>
            </div>
        </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}