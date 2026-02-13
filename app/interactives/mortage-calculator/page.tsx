"use client";

import { useState } from "react";
import { useEffect } from "react";

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

  const formatCurrency = (value) => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <h1 className="text-4xl font-bold mb-2">Mortgage Calculator</h1>
            <p className="text-blue-100">Estimate your monthly mortgage payment or see how much home you can afford.</p>
          </div>

          {/* Mode Selector */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setMode('afford')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  mode === 'afford'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Home you can afford
              </button>
              <button
                onClick={() => setMode('affordability')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  mode === 'affordability'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Affordability
              </button>
              <button
                onClick={() => setMode('payment')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  mode === 'payment'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Monthly payment
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Left Column - Inputs */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Inputs</h2>
                <button
                  onClick={handleReset}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Reset
                </button>
              </div>

              {/* Monthly Payment or Home Price */}
              {mode === 'afford' ? (
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
              ) : (
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
              )}

              {/* Down Payment */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Down payment</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                      className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="text"
                      value={formatCurrency(results.downPayment)}
                      readOnly
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                    />
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
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(results.homePrice)}</p>
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
      </div>
    </div>
  );
}