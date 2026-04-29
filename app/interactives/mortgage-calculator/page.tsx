"use client"

import React, { useState, useEffect, useCallback } from 'react';
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card";
import InfoPopover from "@/app/ui/components/popover";

export default function MortgageCalculator() {
  const [mode, setMode] = useState('afford'); // 'afford', 'affordability', 'payment'
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
  const [propertyTaxMode, setPropertyTaxMode] = useState('percentage');
  const [propertyTaxAmount, setPropertyTaxAmount] = useState(0);
  const [homeInsuranceMode, setHomeInsuranceMode] = useState('percentage');
  const [homeInsuranceAmount, setHomeInsuranceAmount] = useState(0);

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
    const r = (Number(interestRate) / 100 / 12); // Monthly interest rate
    const n = loanTerm * 12; // Total number of payments
    const hoaDuesNum = Number(hoaDues) || 0; // FIX: Parse HOA as number

    if (mode === 'afford') {
      // Calculate home price from desired monthly payment
      const loanAmount = Number(monthlyPayment) * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
      const computedHomePrice = loanAmount / (1 - downPaymentPercent / 100);
      const downPayment = computedHomePrice * (downPaymentPercent / 100);

      // FIX: Handle property tax correctly based on mode
      const monthlyTax = propertyTaxMode === 'percentage'
        ? (computedHomePrice * (propertyTaxPercent / 100)) / 12
        : propertyTaxAmount / 12;

      // FIX: Handle home insurance correctly based on mode
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
      // Calculate monthly payment from home price
      const downPayment = Number(homePrice) * (downPaymentPercent / 100);
      const loanAmount = Number(homePrice) - downPayment;
      const monthlyMortgage = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

      // FIX: Handle property tax correctly based on mode
      const monthlyTax = propertyTaxMode === 'percentage'
        ? (Number(homePrice) * (propertyTaxPercent / 100)) / 12
        : propertyTaxAmount / 12;

      // FIX: Handle home insurance correctly based on mode
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
  }, [mode, monthlyPayment, homePrice, downPaymentPercent, interestRate, loanTerm, propertyTaxPercent, propertyTaxMode, propertyTaxAmount, homeInsurancePercent, homeInsuranceMode, homeInsuranceAmount, hoaDues]);

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

  const emptyResultsString = "Enter values to see your estimate"

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
              <p className="text-sm text-muted-foreground">Estimate home price based on a monthly payment you can allocate toward a mortgage.</p>
              <div className="grid md:grid-cols-2 gap-8 py-8">
                <div className="pr-0">
                  <div className="pb-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="block text-sm font-semibold">
                          Monthly mortgage budget (principal + interest)
                        </label>
                        <InfoPopover title="Monthly mortgage budget">Enter the portion of the monthly budget used for the loan payment. Additional housing costs like taxes and insurance are not included here.</InfoPopover>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute text-gray-500 left-3 top-1/2 -translate-y-1/2 font-medium">$</span>
                      <input
                        type="number"
                        placeholder=""
                        step="1"
                        value={monthlyPayment}
                        onChange={(e) => setMonthlyPayment(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-xs mt-1">This is the amount allocated to the loan payment (principal + interest). Taxes, insurance, and HOA are added separately below.</p>
                  </div>
                  {/* Down Payment */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <label className="block text-sm font-semibold">Down payment</label>
                      <div className="flex flex-row gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="downPaymentModeAfford"
                            checked={downPaymentMode === 'percentage'}
                            onChange={() => {
                              setDownPaymentMode('percentage');
                              // if switching from dollar, compute percent
                              if (downPaymentAmount >= 0 && results.homePrice > 0) {
                                setDownPaymentPercent(Math.round((downPaymentAmount / results.homePrice * 100) * 100) / 100);
                              }
                            }}
                            className="w-4 h-4 accent-lagunita cursor-pointer"
                          />
                          <span className={`text-xs transition ${
                            downPaymentMode === 'percentage'
                              ? 'text-black font-semibold'
                              : 'text-black'
                          }`}>
                            Percent
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="downPaymentModeAfford"
                            checked={downPaymentMode === 'dollar'}
                            onChange={() => {
                              setDownPaymentMode('dollar');
                              // set dollar amount from results if available
                              setDownPaymentAmount(Math.round(results.downPayment || (results.homePrice * (downPaymentPercent / 100))));
                            }}
                            className="w-4 h-4 accent-lagunita cursor-pointer"
                          />
                          <span className={`text-xs transition ${
                            downPaymentMode === 'dollar'
                              ? 'text-black font-semibold'
                              : 'text-black'
                          }`}>
                            Dollars
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="relative">
                      {downPaymentMode === 'percentage' ? (
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={downPaymentPercent === 0 ? '0' : downPaymentPercent || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || raw === '0') {
                                setDownPaymentPercent(0);
                                setDownPaymentAmount(0);
                                return;
                              }
                              const value = Number(raw);
                              setDownPaymentPercent(Math.round(value * 100) / 100);
                              const price = results.homePrice || 1;
                              setDownPaymentAmount(Math.round((value / 100) * price));
                            }}
                            className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            %
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={downPaymentAmount === 0 ? '0' : downPaymentAmount || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || raw === '0') {
                                setDownPaymentAmount(0);
                                setDownPaymentPercent(0);
                                return;
                              }
                              const value = Number(raw);
                              setDownPaymentAmount(Math.round(value));
                              const price = results.homePrice || 1;
                              if (price > 0) setDownPaymentPercent(Math.round((value / price) * 100 * 100) / 100);
                            }}
                            className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                        </div>
                      )}
                      <p className="text-xs mt-1">Enter 0 if no down payment is planned.</p>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold">Interest rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder=""
                        step="0.1"
                        min="0"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-medium text-gray-500 ">%</span>
                    </div>
                  </div>

                  {/* Loan Term */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold">Loan term</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className={`flex-1 cursor-pointer flex flex-row ${
                        loanTerm === 15
                          ? ' border-navy'
                          : ' border-lagunita'
                      }`}>
                        <input
                          type="radio"
                          name="loanTerm"
                          value="15"
                          checked={loanTerm === 15}
                          onChange={() => setLoanTerm(15)}
                          className="mr-3 w-4 accent-lagunita"
                        />
                        <span className={`self-center ${loanTerm === 15 ? 'font-semibold' : 'font-normal'}`}>15 years</span>
                      </label>
                      <label className={`flex-1 cursor-pointer flex flex-row ${
                        loanTerm === 30
                          ? 'border-navy'
                          : 'border-lagunita'
                      }`}>
                        <input
                          type="radio"
                          name="loanTerm"
                          value="30"
                          checked={loanTerm === 30}
                          onChange={() => setLoanTerm(30)}
                          className="mr-3 w-4 accent-lagunita"
                        />
                        <span className={`self-center ${loanTerm === 30 ? 'font-semibold' : 'font-normal'}`}>30 years</span>
                      </label>
                    </div>
                  </div>
                  {/* Optional Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semiboldmb-4">Additional housing costs</h3>

                    {/*  Property Taxes */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <label className="block text-sm font-semibold">Property taxes (annual)</label>
                        <div className="flex flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="propertyTaxMode"
                              value="percentage"
                              checked={propertyTaxMode === 'percentage'}
                              onChange={() => {
                                setPropertyTaxMode('percentage');
                                // if switching from dollar, compute percent
                                if (propertyTaxAmount && propertyTaxAmount > 0) {
                                  setPropertyTaxPercent((propertyTaxAmount / Number(results.homePrice)) * 100);
                                } else {
                                  setPropertyTaxPercent(0);
                                }
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className={`text-xs transition ${
                              propertyTaxMode === 'percentage'
                                ? 'text-black font-semibold'
                                : 'text-black'
                            }`}>
                              Percent
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="propertyTaxMode"
                              value="dollar"
                              checked={propertyTaxMode === 'dollar'}
                              onChange={() => {
                                setPropertyTaxMode('dollar');
                                // Calculate annual property tax amount, not home price
                                const annualTax = results.homePrice * (propertyTaxPercent / 100);
                                setPropertyTaxAmount(annualTax);
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className={`text-xs transition ${
                              propertyTaxMode === 'dollar'
                                ? 'text-black font-semibold'
                                : 'text-black'
                            }`}>
                              Dollars
                            </span>
                          </label>
                        </div>
                      </div>
                      {/* Property Tax Input */}
                      {propertyTaxMode === 'percentage' ? (
                        <div className="relative">
                          <input
                            type="number"
                            value={propertyTaxPercent || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const value = raw === '' ? 0 : Number(raw);
                              setPropertyTaxPercent(Math.round(value * 100) / 100);
                              const price = results.homePrice || 1;
                              setPropertyTaxAmount(Math.round((value / 100) * price));
                            }}
                            className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            %
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            value={propertyTaxAmount || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const value = raw === '' ? 0 : Number(raw);
                              setPropertyTaxAmount(Math.round(value));
                              const price = results.homePrice || 1;
                              if (price > 0) setPropertyTaxPercent(Math.round((value / price) * 100 * 100) / 100);
                            }}
                            className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                        </div>
                      )}
                    </div>

                    {/*  Homeowners Insurance */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <label className="block text-sm font-semibold">Homeowners insurance (annual)</label>
                        <div className="flex flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="homeInsuranceMode"
                              value="percentage"
                              checked={homeInsuranceMode === 'percentage'}
                              onChange={() => {
                                setHomeInsuranceMode('percentage');
                                // if switching from dollar, compute percent
                                if (homeInsuranceAmount && homeInsuranceAmount > 0) {
                                  setHomeInsurancePercent((homeInsuranceAmount / Number(results.homePrice)) * 100);
                                } else {
                                  setHomeInsurancePercent(0);
                                }
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className={`text-xs transition ${
                              homeInsuranceMode === 'percentage'
                                ? 'text-black font-semibold'
                                : 'text-black'
                            }`}>
                              Percent
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="homeInsuranceMode"
                              value="dollar"
                              checked={homeInsuranceMode === 'dollar'}
                              onChange={() => {
                                setHomeInsuranceMode('dollar');
                                // Calculate annual insurance amount, not home price
                                const annualInsurance = results.homePrice * (homeInsurancePercent / 100);
                                setHomeInsuranceAmount(annualInsurance);
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className={`text-xs transition ${
                              homeInsuranceMode === 'dollar'
                                ? 'text-black font-semibold'
                                : 'text-black'
                            }`}>
                              Dollars
                            </span>
                          </label>
                        </div>
                      </div>
                      {/* Home Insurance Amount Input */}
                      {homeInsuranceMode === 'percentage' ? (
                        <div className="relative">
                          <input
                            type="number"
                            value={homeInsurancePercent || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const value = raw === '' ? 0 : Number(raw);
                              setHomeInsurancePercent(Math.round(value * 100) / 100);
                              const price = results.homePrice || 1;
                              setHomeInsuranceAmount(Math.round((value / 100) * price));
                            }}
                            className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            %
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            value={homeInsuranceAmount || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const value = raw === '' ? 0 : Number(raw);
                              setHomeInsuranceAmount(Math.round(value));
                              const price = results.homePrice || 1;
                              if (price > 0) setHomeInsurancePercent(Math.round((value / price) * 100 * 100) / 100);
                            }}
                            className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                        </div>
                      )}
                    </div>

                    {/* HOA Dues */}
                    <div className="pb-5">
                      <label className="block text-sm font-semibold">HOA dues (monthly)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <input
                          type="number"
                          placeholder=""
                          step="1"
                          min="0"
                          max="100000"
                          value={hoaDues}
                          onChange={(e) => {
                            const value = Math.min(Number(e.target.value) || 0, 100000);
                            setHoaDues(value.toString());
                          }}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pl-0">
                {/* Right Column - Results */}
                  <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-bold">Estimated home price</CardTitle>
                    </CardHeader>
                    <CardContent className="">
                      <div className="mb-6">
                        <p className="text-sm font-medium">Based on your monthly housing budget.</p>
                        <p className="text-3xl font-bold text-lagunita">{formatCurrency(Number(results.homePrice || 0))}</p>
                      </div>

                      <div className="rounded-lg">
                        <div className="innerwrapper">
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md  p-4 font-bold text-black rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-grey-med-dark items-center">
                              Down payment:
                            </div>
                            <div className="w-full sm:w-[50%] text-lg-title p-4 self-center rounded-lg sm:rounded-r-lg font-bold text-[var(--foreground)] overflow-hidden text-ellipsis bg-[var(--secondary-background)]">
                              {formatCurrency(results.downPayment || 0)}
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
                              {formatCurrency(results.loanAmount || 0)}
                            </div>
                          </div>
                          <div className="flex flex-col my-3">
                            <h3 className="text-lg font-bold mb-4">Monthly breakdown</h3>
                            <hr/>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Mortgage payment:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.monthlyMortgage || 0)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Property taxes:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.monthlyTax || 0)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Insurance:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.monthlyInsurance || 0)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              HOA:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.hoaDues || 0)}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-white bg-navy rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Total monthly housing cost:
                            </div>
                            <div
                                className="w-full sm:w-[50%] text-lg-title p-4 rounded-lg sm:rounded-r-lg font-bold bg-lagunita-lighter text-black overflow-hidden text-ellipsis flex items-center bg-[var(--secondary-background)]">
                              {formatCurrency(results.totalMonthlyHousingCost || 0)}
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
                    <label className="block text-sm font-semibold">
                      Home price
                    </label>
                    <div className="relative">
                      <span className="absolute text-gray-500 left-3 top-1/2 -translate-y-1/2 font-medium">$</span>
                      <input
                        type="number"
                        placeholder=""
                        step="1"
                        value={homePrice}
                        onChange={(e) => setHomePrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-xs mt-1">Enter the purchase price of the home.</p>
                  </div>

                  {/* Down Payment Monthly Payment */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <label className="block text-sm font-semibold">Down payment</label>
                      {/* Radio Buttons for Payment Mode */}
                      <div className="flex flex-row gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="downPaymentModePayment"
                            checked={downPaymentMode === 'percentage'}
                            onChange={() => {
                              setDownPaymentMode('percentage');
                              // if switching from dollar, compute percent
                              if (downPaymentAmount >= 0 && Number(homePrice) > 0) {
                                setDownPaymentPercent(Math.round((downPaymentAmount / Number(homePrice) * 100) * 100) / 100);
                              }
                            }}
                            className="w-4 h-4 accent-lagunita cursor-pointer"
                          />
                          <span className={`text-xs transition ${
                            downPaymentMode === 'percentage'
                              ? 'text-black font-semibold'
                              : 'text-black'
                          }`}>
                            Percent
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="downPaymentModePayment"
                            checked={downPaymentMode === 'dollar'}
                            onChange={() => {
                              setDownPaymentMode('dollar');
                              // set dollar amount from results if available
                              setDownPaymentAmount(Math.round(results.downPayment || (Number(homePrice) * (downPaymentPercent / 100))));
                            }}
                            className="w-4 h-4 accent-lagunita cursor-pointer"
                          />
                          <span className={`text-xs transition ${
                            downPaymentMode === 'dollar'
                              ? 'text-black font-semibold'
                              : 'text-black'
                          }`}>
                            Dollars
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="relative">
                      {downPaymentMode === 'percentage' ? (
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={downPaymentPercent === 0 ? '0' : downPaymentPercent || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || raw === '0') {
                                setDownPaymentPercent(0);
                                setDownPaymentAmount(0);
                                return;
                              }
                              const value = Number(raw);
                              setDownPaymentPercent(Math.round(value * 100) / 100);
                              const price = Number(homePrice) || results.homePrice;
                              setDownPaymentAmount(Math.round((value / 100) * price));
                            }}
                            className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            %
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={downPaymentAmount === 0 ? '0' : downPaymentAmount || ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '' || raw === '0') {
                                setDownPaymentAmount(0);
                                setDownPaymentPercent(0);
                                return;
                              }
                              const value = Number(raw);
                              setDownPaymentAmount(Math.round(value));
                              const price = Number(homePrice) || results.homePrice;
                              if (price > 0) setDownPaymentPercent(Math.round((value / price) * 100 * 100) / 100);
                            }}
                            className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                        </div>
                      )}
                      <p className="text-xs mt-1">Enter 0 if no down payment is planned.</p>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold">Interest rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder=""
                        min="0"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 text-gray-500 top-1/2 -translate-y-1/2 font-medium">%</span>
                    </div>
                  </div>

                  {/* Loan Term */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold">Loan term</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className={`flex-1 cursor-pointer flex flex-row ${
                        loanTerm === 15
                          ? ' border-navy'
                          : ' border-lagunita'
                      }`}>
                        <input
                          type="radio"
                          name="loanTerm"
                          value="15"
                          checked={loanTerm === 15}
                          onChange={() => setLoanTerm(15)}
                          className="mr-3 w-4 accent-lagunita"
                        />
                        <span className={`self-center ${loanTerm === 15 ? 'font-semibold' : 'font-normal'}`}>15 years</span>
                      </label>
                      <label className={`flex-1 cursor-pointer flex flex-row ${
                        loanTerm === 30
                          ? 'border-navy'
                          : 'border-lagunita'
                      }`}>
                        <input
                          type="radio"
                          name="loanTerm"
                          value="30"
                          checked={loanTerm === 30}
                          onChange={() => setLoanTerm(30)}
                          className="mr-3 w-4 accent-lagunita"
                        />
                        <span className={`self-center ${loanTerm === 30 ? 'font-semibold' : 'font-normal'}`}>30 years</span>
                      </label>
                    </div>
                  </div>

                  {/* Optional Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Optional</h3>

                    {/*  Property Taxes */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <label className="block text-sm font-semibold">Property taxes (annual)</label>
                        {/* Radio Buttons for Property Tax Mode */}
                        <div className="flex flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="propertyTaxMode"
                              checked={propertyTaxMode === 'percentage'}
                              onChange={() => {
                                setPropertyTaxMode('percentage');
                                // if switching from dollar, compute percent
                                if (propertyTaxAmount && propertyTaxAmount > 0) {
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
                              name="propertyTaxMode"
                              checked={propertyTaxMode === 'dollar'}
                              onChange={() => {
                                setPropertyTaxMode('dollar');
                                // Calculate annual property tax amount
                                const annualTax = results.homePrice * (propertyTaxPercent / 100);
                                setPropertyTaxAmount(annualTax);
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className="text-xs">Dollars</span>
                          </label>
                        </div>
                      </div>
                      <div className="relative">
                        {propertyTaxMode === 'percentage' ? (
                          <>
                            <input
                              type="number"
                              value={propertyTaxPercent || ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const value = raw === '' ? 0 : Number(raw);
                                setPropertyTaxPercent(Math.round(value * 100) / 100);
                                const price = Number(homePrice) || results.homePrice;
                                setPropertyTaxAmount(Math.round((value / 100) * price));
                              }}
                              className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                              %
                            </span>
                          </>
                        ) : (
                          <>
                            <input
                              type="number"
                              value={propertyTaxAmount || ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const value = raw === '' ? 0 : Number(raw);
                                setPropertyTaxAmount(Math.round(value));
                                const price = Number(homePrice) || results.homePrice;
                                if (price > 0) setPropertyTaxPercent(Math.round((value / price) * 100 * 100) / 100);
                              }}
                              className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/*  Homeowners Insurance */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <label className="block text-sm font-semibold">Homeowners insurance (annual)</label>
                        {/* Radio Buttons for Home Insurance Mode */}
                        <div className="flex flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="homeInsuranceMode"
                              checked={homeInsuranceMode === 'percentage'}
                              onChange={() => {
                                setHomeInsuranceMode('percentage');
                                // if switching from dollar, compute percent
                                if (homeInsuranceAmount && homeInsuranceAmount > 0) {
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
                              name="homeInsuranceMode"
                              checked={homeInsuranceMode === 'dollar'}
                              onChange={() => {
                                setHomeInsuranceMode('dollar');
                                // Calculate annual insurance amount
                                const annualInsurance = results.homePrice * (homeInsurancePercent / 100);
                                setHomeInsuranceAmount(annualInsurance);
                              }}
                              className="w-4 h-4 accent-lagunita cursor-pointer"
                            />
                            <span className="text-xs">Dollars</span>
                          </label>
                        </div>
                      </div>
                      <div className="relative">
                        {homeInsuranceMode === 'percentage' ? (
                          <>
                            <input
                              type="number"
                              value={homeInsurancePercent || ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const value = raw === '' ? 0 : Number(raw);
                                setHomeInsurancePercent(Math.round(value * 100) / 100);
                                const price = Number(homePrice) || results.homePrice;
                                setHomeInsuranceAmount(Math.round((value / 100) * price));
                              }}
                              className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                              %
                            </span>
                          </>
                        ) : (
                          <>
                            <input
                              type="number"
                              value={homeInsuranceAmount || ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const value = raw === '' ? 0 : Number(raw);
                                setHomeInsuranceAmount(Math.round(value));
                                const price = Number(homePrice) || results.homePrice;
                                if (price > 0) setHomeInsurancePercent(Math.round((value / price) * 100 * 100) / 100);
                              }}
                              className="w-full pl-8 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                          </>
                        )}
                      </div>
                    </div>

                      {/* HOA Dues */}
                      <div className="pb-5">
                        <label className="block text-sm font-semibold">HOA dues (monthly)</label>
                        <div className="relative">
                          <span className="absolute text-gray-500 left-3 top-1/2 -translate-y-1/2 font-medium">$</span>
                          <input
                            type="number"
                            placeholder=""
                            step="1"
                            min="0"
                            value={hoaDues}
                            onChange={(e) => setHoaDues(e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      <CardTitle className="text-md font-bold">Estimated monthly mortgage payment</CardTitle>
                    </CardHeader>
                    <CardContent className="">
                      <div className="mb-6">
                        <p className="text-sm font-medium">Total including taxes, insurance, and HOA</p>
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
                              {formatCurrency(results.downPayment || 0)}
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
                            <h3 className="text-lg font-bold mb-4">Monthly breakdown</h3>
                            <hr/>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Mortgage payment:
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