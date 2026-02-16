"use client"

import React, { useState, useEffect } from 'react';
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs";

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
    totalMonthly: 0
  });

  useEffect(() => {
    calculateMortgage();
  }, [mode, monthlyPayment, homePrice, downPaymentPercent, interestRate, loanTerm, propertyTaxPercent, homeInsurancePercent, hoaDues]);

  const calculateMortgage = () => {
    const r = interestRate / 100 / 12; // Monthly interest rate
    const n = loanTerm * 12; // Total number of payments
    
    if (mode === 'afford') {
      // Calculate home price from desired monthly payment
      const loanAmount = monthlyPayment * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
      const homePrice = loanAmount / (1 - downPaymentPercent / 100);
      const downPayment = homePrice * (downPaymentPercent / 100);
      const monthlyTax = (homePrice * (propertyTaxPercent / 100)) / 12;
      const monthlyInsurance = (homePrice * (homeInsurancePercent / 100)) / 12;
      const totalMonthly = monthlyPayment + monthlyTax + monthlyInsurance + hoaDues;

      setResults({
        homePrice: Math.round(homePrice),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyPayment),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(totalMonthly)
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
        totalMonthly: Math.round(totalMonthly)
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleReset = () => {
    setMonthlyPayment(2500);
    setHomePrice(500000);
    setDownPaymentPercent(20);
    setInterestRate(7.0);
    setLoanTerm(30);
    setPropertyTaxPercent(1.25);
    setHomeInsurancePercent(0.35);
    setHoaDues(0);
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
              <div className="grid md:grid-cols-2 gap-8 p-8">
                <div className="pr-4">  
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                      <button
                        type="button"
                        onClick={() => {
                          if (downPaymentMode === 'percentage') {
                            setDownPaymentMode('dollar');
                            setDownPaymentAmount(results.downPayment);
                          } else {
                            setDownPaymentMode('percentage');
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 w-[50px] font-bold py-1.5 bg-lagunita hover:bg-white rounded-md border-2 border-lagunita hover:text-lagunita text-white transition min-w-[40px]"
                      >
                        {downPaymentMode === 'percentage' ? '%' : '$'}
                      </button>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                    <div className="space-y-2 mb-4">
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
                    <div className="space-y-2 mb-4">
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
                    <div className="space-y-2">
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
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Results</h2>

                    {/* Key Metrics */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Estimated home price</p>
                        <p className="text-3xl font-bold text-lagunita">{formatCurrency(results.homePrice)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Down payment</p>
                          <p className="text-xl font-bold text-gray-800">{formatCurrency(results.downPayment)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Loan amount</p>
                          <p className="text-xl font-bold text-gray-800">{formatCurrency(results.loanAmount)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">Mortgage (P&I)</span>
                          <span className="text-gray-900 font-bold">{formatCurrency(results.monthlyMortgage)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">Property taxes</span>
                          <span className="text-gray-900 font-bold">{formatCurrency(results.monthlyTax)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">Insurance</span>
                          <span className="text-gray-900 font-bold">{formatCurrency(results.monthlyInsurance)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">HOA</span>
                          <span className="text-gray-900 font-bold">{formatCurrency(hoaDues)}</span>
                        </div>
                        <div className="border-t-2 border-gray-300 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-800">Total monthly housing cost</span>
                            <span className="text-2xl font-bold text-blue-600">{formatCurrency(results.totalMonthly)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600">
                        Mortgage estimates calculate principal and interest. Taxes, insurance, and HOA are added separately to show total housing cost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment">
              <div className="grid md:grid-cols-2 gap-8 p-8">
                {/* Left Column - Inputs */}
                <div className="space-y-6">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                      <div className="flex flex-row gap-2 absolute right-2 top-1/2 -translate-y-1/2">
                        <button
                          type="button"
                          onClick={() => {
                            if (downPaymentMode === 'percentage') {
                              setDownPaymentMode('dollar');
                              setDownPaymentAmount(results.downPayment);
                            } else {
                              setDownPaymentMode('percentage');
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 w-[50px] font-bold py-1.5 bg-lagunita hover:bg-white rounded-md border-2 border-lagunita hover:text-lagunita text-white transition min-w-[40px]"
                        >
                          {downPaymentMode === 'percentage' ? '%' : '$'}
                        </button>
                      </div>
                    </div>
                </div>

              {/* Interest Rate */}
              <div className="space-y-2">
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
              <div className="space-y-2">
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
                <div className="space-y-2 mb-4">
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
                <div className="space-y-2 mb-4">
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
                <div className="space-y-2">
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
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Results</h2>

              {/* Key Metrics */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estimated home price</p>
                  <p className="text-3xl font-bold text-lagunita">{formatCurrency(results.homePrice)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Down payment</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(results.downPayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Loan amount</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(results.loanAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Mortgage (P&I)</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(results.monthlyMortgage)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Property taxes</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(results.monthlyTax)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Insurance</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(results.monthlyInsurance)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">HOA</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(hoaDues)}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total monthly housing cost</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(results.totalMonthly)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600">
                  Mortgage estimates calculate principal and interest. Taxes, insurance, and HOA are added separately to show total housing cost.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}