'use client';
import React, { useState, useEffect } from 'react';

const InterestRateVisual = () => {
  const [mode, setMode] = useState('saving'); // 'saving' or 'borrowing'
  // const [amount, setAmount] = useState(1000); // Default amount in dollars
    // ...existing code...
  const [amount, setAmount] = useState<number>(0);
  // ...existing code...
  const [interestRate, setInterestRate] = useState<number>(0);
  const [years, setYears] = useState<number>(0);
  const [compounding, setCompounding] = useState('annually');
  
  const [interestAmount, setInterestAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Calculate the interest and total amount
  useEffect(() => {
    let periods = 1;
    switch(compounding) {
      case 'monthly':
        periods = 12;
        break;
      case 'quarterly':
        periods = 4;
        break;
      case 'semi-annually':
        periods = 2;
        break;
      default:
        periods = 1;
    }
    
    // Compound interest formula: A = P(1 + r/n)^(nt)
    const rate = interestRate / 100;
    const periodicRate = rate / periods;
    const totalPeriods = periods * years;
    
    const calculatedTotal = amount * Math.pow(1 + periodicRate, totalPeriods);
    const calculatedInterest = calculatedTotal - amount;
    
    setInterestAmount(mode === 'saving' ? calculatedInterest : -calculatedInterest);
    setTotalAmount(mode === 'saving' ? calculatedTotal : amount + calculatedInterest);
  }, [amount, interestRate, years, compounding, mode]);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-black mb-2">Understanding Money Building Blocks</h2>
      <p className="text-center text-gray-600 mb-6">At its core, money has a price - we call this the interest rate.</p>
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Left side explanation */}
        <div className="flex-1 bg-stone-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-stone-600 mb-3">The Concept of Interest</h2>
          <p className="text-gray-700 mb-3">
            When you <span className="font-medium">save money</span>, you are essentially a lender, 
            and you receive interest from those using it.
          </p>
          <p className="text-gray-700 mb-3">
            When you <span className="font-medium">borrow</span>, you are paying for the privilege 
            of using someone else`&#39;`s money.
          </p>
          <p className="text-gray-700 italic">
            In this interactive calculator, you can see how interest works in both scenarios.
          </p>
        </div>
        
        {/* Right side image */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-full bg-stone-100 rounded-lg flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Money stacks */}
              <rect x="30" y="120" width="60" height="60" fill="#008566" rx="4" />
              <rect x="35" y="115" width="50" height="10" fill="#006F54" rx="2" />
              <text x="60" y="155" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">$</text>
              
              {/* Interest visualization */}
              <rect x="110" y="120" width="60" height="60" fill={mode === 'saving' ? "#B6B1A9" : "#B1040E"} rx="4" />
              <rect x="115" y="115" width="50" height="10" fill={mode === 'saving' ? "#7F7776" : "#ef4444"} rx="2" />
              <text x="140" y="155" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">
                {mode === 'saving' ? "+" : "-"}%
              </text>
              
              {/* Labels */}
              <text x="60" y="195" textAnchor="middle" fontSize="12" fill="#1f2937">Principal</text>
              <text x="140" y="195" textAnchor="middle" fontSize="12" fill="#1f2937">
                {mode === 'saving' ? "Interest Earned" : "Interest Paid"}
              </text>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Interactive calculator */}
      <div className="bg-stone-50 p-6 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">I am:</label>
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              <button
                className={`flex-1 py-2 px-3 text-sm font-medium ${
                  mode === 'saving' 
                    ? 'bg-[#B6B1A9] text-black' 
                    : 'bg-white text-gray-700 hover:bg-stone-50'
                }`}
                onClick={() => setMode('saving')}
              >
                Saving
              </button>
              <button
                className={`flex-1 py-2 px-3 text-sm font-medium ${
                  mode === 'borrowing' 
                    ? 'bg-[#B1040E] text-white' 
                    : 'bg-white text-gray-700 hover:bg-stone-50'
                }`}
                onClick={() => setMode('borrowing')}
              >
                Borrowing
              </button>
            </div>
          </div>
          
              <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($):</label>
              <input
                type="number"
                min="0"
                placeholder='Enter amount'
                value={amount === 0 ? '' : amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                }}
                onFocus={(e) => e.target.select()}
                className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border"
              />
              </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%):</label>
            <input
              type="number"
              min="0.1"
              placeholder='Enter rate'
              step="0.1"
              value={interestRate === 0 ? '' : interestRate}
              onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
              className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period (years):</label>
            <input
              type="number"
              min="1"
              max="30"
              placeholder='Enter years'
              value={years === 0 ? '' : years }
              onChange={(e) => setYears(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
              className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border"
            />
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Compounding:</label>
            <select
              value={compounding}
              onChange={(e) => setCompounding(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border"
            >
              <option value="annually">Annually</option>
              <option value="semi-annually">Semi-annually</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        
        {/* Results section */}
        <div className="mt-6 p-4 bg-white rounded-md border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-md bg-stone-50">
              <p className="text-sm text-stone-500">Principal Amount</p>
              <p className="text-2xl font-bold text-gray-900">${amount.toLocaleString()}</p>
            </div>
            
            <div className={`p-3 rounded-md ${mode === 'saving' ? 'bg-stone-200' : 'bg-[#B1040E14]'}`}>
              <p className="text-sm text-stone-600">
                {mode === 'saving' ? 'Interest Earned' : 'Interest Paid'}
              </p>
              <p className={`text-2xl font-bold ${mode === 'saving' ? 'text-stone-600' : 'text-[#B1040E]'}`}>
                ${Math.abs(interestAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
            
            <div className="p-3 rounded-md bg-stone-50">
              <p className="text-sm text-stone-600">
                {mode === 'saving' ? 'Final Amount' : 'Total Repayment'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Example section */}
      <div className="mt-6 p-4 bg-stone-400 border border-stone-900 rounded-lg">
        <h2 className="text-lg font-medium text-black mb-2">Real-world Example</h2>
        <p className="text-black mb-2">
          {mode === 'saving' 
            ? `If you save $${amount.toLocaleString()} in a high-yield savings account earning ${interestRate}% annual interest, you're earning $${(amount * interestRate / 100).toLocaleString()} per year just for keeping your money there.`
            : `A ${interestRate}% interest rate means paying $${(amount * interestRate / 100).toLocaleString()} per year for every $${amount.toLocaleString()} borrowed.`
          }
        </p>
      </div>
    </div>
  );
};

export default InterestRateVisual;