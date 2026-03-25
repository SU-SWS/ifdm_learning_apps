"use client"

import React, { useState, useEffect, useCallback } from 'react';
import ThemeToggle from "@/app/lib/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/ui/components/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/components/card";
import { BiSolidDownArrow, BiSolidUpArrow } from "react-icons/bi";

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

    if (mode === 'afford') {
      // Calculate home price from desired monthly payment
      const loanAmount = Number(monthlyPayment) * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
      const computedHomePrice = loanAmount / (1 - downPaymentPercent / 100);
      const downPayment = computedHomePrice * (downPaymentPercent / 100);
      const monthlyTax = (computedHomePrice * (propertyTaxPercent / 100)) / 12;
      const monthlyInsurance = (computedHomePrice * (homeInsurancePercent / 100)) / 12;
      const totalMonthly = Number(monthlyPayment) + monthlyTax + monthlyInsurance + hoaDues;

      setResults({
        homePrice: Math.round(computedHomePrice),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Number(Math.round(Number(monthlyPayment))),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(Number(totalMonthly)),
        hoaDues: Math.round(Number(hoaDues) || 0),
        totalMonthlyHousingCost: Math.round(Number(totalMonthly))
      });
    } else if (mode === 'payment') {
      // Calculate monthly payment from home price
      const downPayment = Number(homePrice) * (downPaymentPercent / 100);
      const loanAmount = Number(homePrice) - downPayment;
      const monthlyMortgage = loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const monthlyTax = (Number(homePrice) * (propertyTaxPercent / 100)) / 12;
      const monthlyInsurance = (Number(homePrice) * (homeInsurancePercent / 100)) / 12;
      const totalMonthly = monthlyMortgage + monthlyTax + monthlyInsurance + hoaDues;

      setResults({
        homePrice: Math.round(Number(homePrice)),
        downPayment: Math.round(downPayment),
        loanAmount: Math.round(loanAmount),
        monthlyMortgage: Math.round(monthlyMortgage),
        monthlyTax: Math.round(monthlyTax),
        monthlyInsurance: Math.round(monthlyInsurance),
        totalMonthly: Math.round(Number(totalMonthly)),
        hoaDues: Math.round(Number(hoaDues) || 0),
        totalMonthlyHousingCost: Math.round(Number(totalMonthly))
      });
    }
  }, [mode, monthlyPayment, homePrice, downPaymentPercent, interestRate, loanTerm, propertyTaxPercent, homeInsurancePercent, hoaDues]);

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
                    <label className="block text-sm font-semibold">
                      Monthly mortgage payment
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium">$</span>
                      <input
                        type="number"
                        placeholder="-"
                        step="1"
                        value={monthlyPayment}
                        onChange={(e) => setMonthlyPayment(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Increase amount"
                          onClick={() =>
                            setMonthlyPayment(
                              String((Number(monthlyPayment) || 0) + 1)
                            )
                          }
                          className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                        >
                          <BiSolidUpArrow size={24} />
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Decrease amount"
                          onClick={() =>
                            setMonthlyPayment(
                              String(Math.max(0, (Number(monthlyPayment) || 0) - 1))
                            )
                          }
                          className="hover:text-grey-med-dark focus:outline-none"
                        >
                          <BiSolidDownArrow size={24} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs">Taxes, insurance, and HOA are separate—add estimates below to see your total cost.</p>
                  </div>
                  {/* Down Payment */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <label className="block text-sm font-semibold">Down payment</label>
                      <div className="flex flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDownPaymentMode('percentage');
                            // if switching from dollar, compute percent
                            if (downPaymentAmount && downPaymentAmount > 0) {
                              setDownPaymentPercent(Number(downPaymentAmount / Number(homePrice)) * 100);
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
                            setDownPaymentAmount(results.downPayment || (Number(homePrice) * (downPaymentPercent / 100)));
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
                        value={downPaymentMode === 'percentage' ? downPaymentPercent || '' : downPaymentAmount || ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const value = raw === '' ? 0 : Number(raw);
                          if (downPaymentMode === 'percentage') {
                            setDownPaymentPercent(value);
                          } else {
                            setDownPaymentAmount(value);
                            // Calculate percentage from dollar amount
                            const price = Number(homePrice) || results.homePrice;
                            if (price > 0) setDownPaymentPercent((value / price) * 100);
                          }
                        }}
                        className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Increase amount"
                          onClick={() => {
                            if (downPaymentMode === 'percentage') {
                              const newPercent = (Number(downPaymentPercent) || 0) + 0.25;
                              setDownPaymentPercent(newPercent);
                              const price = Number(homePrice) || 0;
                              if (price > 0) setDownPaymentAmount(Math.round((newPercent / 100) * price));
                            } else {
                              const newAmount = (Number(downPaymentAmount) || 0) + 1000;
                              setDownPaymentAmount(newAmount);
                              setDownPaymentPercent((newAmount / Number(homePrice)) * 100);
                            }
                          }}
                          className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                        >
                          <BiSolidUpArrow size={24} />
                        </button>
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Decrease amount"
                          onClick={() => {
                            if (downPaymentMode === 'percentage') {
                              const newPercent = Math.max(0, (Number(downPaymentPercent) || 0) - 0.25);
                              setDownPaymentPercent(newPercent);
                              const price = Number(homePrice) || 0;
                              if (price > 0) setDownPaymentAmount(Math.round((newPercent / 100) * price));
                            } else {
                              const newAmount = Math.max(0, (Number(downPaymentAmount) || 0) - 1000);
                              setDownPaymentAmount(newAmount);
                              setDownPaymentPercent((newAmount / Number(homePrice)) * 100);
                            }
                          }}
                          className="hover:text-grey-med-dark focus:outline-none"
                        >
                          <BiSolidDownArrow size={24} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold">Interest rate (APR)</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="-"
                        step="0.1"
                        min="0"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-medium">%</span>
                    </div>
                  </div>

                  {/* Loan Term */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold">Loan term</label>
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
                    <h3 className="text-lg font-semiboldmb-4">Optional</h3>

                    {/*  Property Taxes */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <label className="block text-sm font-semibold">Property taxes (annual)</label>
                        <div className="flex flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPropertyTaxMode('percentage');
                              // if switching from dollar, compute percent
                              if (propertyTaxAmount && propertyTaxAmount > 0) {
                                setPropertyTaxPercent((propertyTaxAmount / Number(results.homePrice)) * 100);
                              } else {
                                setPropertyTaxPercent(0);
                              }
                            }}
                            className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                              propertyTaxMode === 'percentage'
                                ? 'bg-navy border-navy text-white'
                                : 'bg-white border-lagunita text-lagunita'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPropertyTaxMode('dollar');
                              // set dollar amount from results if available
                              setPropertyTaxAmount(results.homePrice || (Number(homePrice) * (propertyTaxPercent / 100)));
                            }}
                            className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                              propertyTaxMode === 'dollar'
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
                          value={propertyTaxMode === 'percentage' ? propertyTaxPercent : propertyTaxAmount}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (propertyTaxMode === 'percentage') {
                              setPropertyTaxPercent(value);
                            } else {
                              setPropertyTaxAmount(value);
                              // Calculate percentage from dollar amount
                              setPropertyTaxPercent((value / Number(homePrice)) * 100);
                            }
                          }}
                          className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Increase amount"
                            onClick={() => {
                              if (propertyTaxMode === 'percentage') {
                                setPropertyTaxPercent((Number(propertyTaxPercent) || 0) + 0.25);
                              } else {
                                const newAmount = (Number(propertyTaxAmount) || 0) + 1000;
                                setPropertyTaxAmount(newAmount);
                                setPropertyTaxPercent((newAmount / Number(homePrice)) * 100);
                              }
                            }}
                            className="mb-[-5px] hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidUpArrow size={24} />
                          </button>
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Decrease amount"
                            onClick={() => {
                              if (propertyTaxMode === 'percentage') {
                                setPropertyTaxPercent(Math.max(0, (Number(propertyTaxPercent) || 0) - 0.25));
                              } else {
                                const newAmount = Math.max(0, (Number(propertyTaxAmount) || 0) - 1000);
                                setPropertyTaxAmount(newAmount);
                                setPropertyTaxPercent((newAmount / Number(homePrice)) * 100);
                              }
                            }}
                            className="hover:text-grey-med-dark focus:outline-none"
                          >
                            <BiSolidDownArrow size={24} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/*  Homeowners Insurance */}
                    <div className="pb-5">
                      <div className="flex flex-row pb-2 justify-between items-center">
                        <label className="block text-sm font-semibold">Homeowners insurance (annual)</label>
                        <div className="flex flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setHomeInsuranceMode('percentage');
                              // if switching from dollar, compute percent
                              if (homeInsuranceAmount && homeInsuranceAmount > 0) {
                                setHomeInsurancePercent((homeInsuranceAmount / Number(results.homePrice)) * 100);
                              } else {
                                setHomeInsurancePercent(0);
                              }
                            }}
                            className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                              homeInsuranceMode === 'percentage'
                                ? 'bg-navy border-navy text-white'
                                : 'bg-white border-lagunita text-lagunita'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHomeInsuranceMode('dollar');
                              // set dollar amount from results if available
                              setHomeInsuranceAmount(results.homePrice || (Number(homePrice) * (homeInsurancePercent / 100)));
                            }}
                            className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                              homeInsuranceMode === 'dollar'
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
                          value={homeInsuranceMode === 'percentage' ? homeInsurancePercent : homeInsuranceAmount}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (homeInsuranceMode === 'percentage') {
                              setHomeInsurancePercent(value);
                            } else {
                              setHomeInsuranceAmount(value);
                              // Calculate percentage from dollar amount
                              setHomeInsurancePercent((value / Number(homePrice)) * 100);
                            }
                          }}
                          className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        
                      </div>
                    </div>

                    {/* HOA Dues */}
                    <div className="pb-5">
                      <label className="block text-sm font-semibold">HOA dues (monthly)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium">$</span>
                        <input
                          type="number"
                          placeholder="-"
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
                <div className="pl-0">
                {/* Right Column - Results */}
                  <Card className="bg-[var(--card-background)] rounded-3xl p-[32px]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md font-bold">Results</CardTitle>
                    </CardHeader>
                    <CardContent className="">
                      <div className="mb-6">
                        <p className="text-sm font-medium">Estimated home price</p>
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
                            <h3 className="text-lg uppercase font-bold mb-4">Monthly breakdown</h3>
                            <hr/>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Mortgage Payment:
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
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium">$</span>
                      <input
                        type="number"
                        placeholder="-"
                        step="1"
                        value={homePrice}
                        onChange={(e) => setHomePrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="text-xs">Enter the purchase price of the home.</p>
                  </div>

                  {/* Down Payment */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <label className="block text-sm font-semibold">Down payment</label>
                      <div className="flex flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDownPaymentMode('percentage');
                            // if switching from dollar, compute percent
                            if (downPaymentAmount && downPaymentAmount > 0) {
                              setDownPaymentPercent((downPaymentAmount / Number(homePrice) * 100));
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
                            setDownPaymentAmount(results.downPayment || (Number(homePrice) * (downPaymentPercent / 100)));
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
                        value={downPaymentMode === 'percentage' ? downPaymentPercent || '' : downPaymentAmount || ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const value = raw === '' ? 0 : Number(raw);
                          if (downPaymentMode === 'percentage') {
                            setDownPaymentPercent(value);
                          } else {
                            setDownPaymentAmount(value);
                            // Calculate percentage from dollar amount
                            const price = Number(homePrice) || results.homePrice;
                            if (price > 0) setDownPaymentPercent((value / price) * 100);
                          }
                        }}
                        className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

              {/* Interest Rate */}
              <div className="pb-5">
                <label className="block text-sm font-semibold">Interest rate (APR)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="-"
                    min="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full pr-8 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-medium">%</span>
                </div>
              </div>

              {/* Loan Term */}
              <div className="pb-5">
                <label className="block text-sm font-semibold">Loan term</label>
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
                <h3 className="text-lg font-semibold mb-4">Optional</h3>

                {/*  Property Taxes */}
                <div className="pb-5">
                  <div className="flex flex-row pb-2 justify-between items-center">
                    <label className="block text-sm font-semibold">Property taxes (annual)</label>
                    <div className="flex flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPropertyTaxMode('percentage');
                          // if switching from dollar, compute percent
                          if (propertyTaxAmount && propertyTaxAmount > 0) {
                            setPropertyTaxPercent((propertyTaxAmount / Number(homePrice)) * 100);
                          } else {
                            setPropertyTaxPercent(0);
                          }
                        }}
                        className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                          propertyTaxMode === 'percentage'
                            ? 'bg-navy border-navy text-white'
                            : 'bg-white border-lagunita text-lagunita'
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPropertyTaxMode('dollar');
                          // set dollar amount from results if available
                          setPropertyTaxAmount(results.homePrice || (Number(homePrice) * (propertyTaxPercent / 100)));
                        }}
                        className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                          propertyTaxMode === 'dollar'
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
                      value={propertyTaxMode === 'percentage' ? propertyTaxPercent : propertyTaxAmount}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (propertyTaxMode === 'percentage') {
                          setPropertyTaxPercent(value);
                        } else {
                          setPropertyTaxAmount(value);
                          // Calculate percentage from dollar amount
                          setPropertyTaxPercent((value / Number(homePrice)) * 100);
                        }
                      }}
                      className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    
                  </div>
                </div>

                {/*  Homeowners Insurance */}
                  <div className="pb-5">
                    <div className="flex flex-row pb-2 justify-between items-center">
                      <label className="block text-sm font-semibold">Homeowners insurance (annual)</label>
                      <div className="flex flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setHomeInsuranceMode('percentage');
                            // if switching from dollar, compute percent
                            if (homeInsuranceAmount && homeInsuranceAmount > 0) {
                              setHomeInsurancePercent((homeInsuranceAmount / Number(homePrice)) * 100);
                            } else {
                              setHomeInsurancePercent(0);
                            }
                          }}
                          className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                            homeInsuranceMode === 'percentage'
                              ? 'bg-navy border-navy text-white'
                              : 'bg-white border-lagunita text-lagunita'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHomeInsuranceMode('dollar');
                            // set dollar amount from results if available
                            setHomeInsuranceAmount(results.homePrice || (Number(homePrice) * (homeInsurancePercent / 100)));
                          }}
                          className={`w-[50px] text-md font-bold rounded-md border-2 transition ${
                            homeInsuranceMode === 'dollar'
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
                        value={homeInsuranceMode === 'percentage' ? homeInsurancePercent : homeInsuranceAmount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (homeInsuranceMode === 'percentage') {
                            setHomeInsurancePercent(value);
                          } else {
                            setHomeInsuranceAmount(value);
                            // Calculate percentage from dollar amount
                            setHomeInsurancePercent((value / Number(homePrice)) * 100);
                          }
                        }}
                        className="w-full pl-4 pr-16 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      
                    </div>
                  </div>

                  {/* HOA Dues */}
                  <div className="pb-5">
                    <label className="block text-sm font-semibold">HOA dues (monthly)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium">$</span>
                      <input
                        type="number"
                        placeholder="-"
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
                      <CardTitle className="text-md font-bold">Results</CardTitle>
                    </CardHeader>
                    <CardContent className="">
                      <div className="mb-6">
                        <p className="text-sm font-medium">Monthly mortgage payment</p>
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
                            <h3 className="text-lg uppercase font-bold mb-4">Monthly breakdown</h3>
                            <hr/>
                          </div>
                          <div className="flex flex-col sm:flex-row mb-1 sm:bg-[var(--results-white-background)] rounded-lg">
                            <div
                                className="w-full sm:w-[50%] text-md p-4 font-bold text-black bg-grey-med-dark rounded-lg sm:rounded-l-lg sm:rounded-r-none flex items-center">
                              Mortgage Payment:
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