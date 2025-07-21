"use client";
import React, { useState, useEffect } from "react";
import { FaPiggyBank } from "react-icons/fa";
import { FaArrowTrendDown, FaAngleDown } from "react-icons/fa6";
import { BiSolidUpArrow } from "react-icons/bi";
import { BiSolidDownArrow } from "react-icons/bi";
import { poppins } from '@/app/ui/fonts';

const InterestRateVisual = () => {
  const [mode, setMode] = useState("saving"); // 'saving' or 'borrowing'
  const [amount, setAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [years, setYears] = useState<number>(0);
  const [compounding, setCompounding] = useState("annually");

  const [interestAmount, setInterestAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Calculate the interest and total amount
  useEffect(() => {
    let periods = 1;
    switch (compounding) {
      case "monthly":
        periods = 12;
        break;
      case "quarterly":
        periods = 4;
        break;
      case "semi-annually":
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

    setInterestAmount(
      mode === "saving" ? calculatedInterest : -calculatedInterest
    );
    setTotalAmount(
      mode === "saving" ? calculatedTotal : amount + calculatedInterest
    );
  }, [amount, interestRate, years, compounding, mode]);

  return (
    <div className="bg-white p-6 max-w-5xl mx-auto">
      <h2 className={`${poppins.className} text-[20px] lg:text-[50px] font-bold text-black mb-2`}>
        Interest Calculator
      </h2>
      <p className="text-black mb-6">
        Explore how interest affects your money over time
      </p>

      {/* Interactive calculator */}
      <div className="py-6">
        <div className="flex flex-col mb-6">
          <h2 className={`${poppins.className} text-xl text-black font-bold mb-1`}>I am:</h2>

          <div className="flex-1 flex gap-4">
            <button
              className={`min-w-[150px] flex-1 py-2 px-3 text-md font-bold ${
                mode === "saving"
                  ? "bg-[#279989] rounded-lg border-1 border-[#279989]"
                  : "rounded-lg border-1 border-[#279989]"
              }`}
              onClick={() => setMode("saving")}
            >
              <div className="flex-1 flex gap-3 align-center justify-center">
                <div
                  className={`text-3xl self-center ${
                    mode === "saving" ? "text-[#ffffff]" : "text-[#279989]"
                  }`}
                >
                  <FaPiggyBank />
                </div>
                <div
                  className={`self-center ${
                    mode === "saving" ? "text-[#ffffff]" : "text-[#000000]"
                  }`}
                >
                  Saving
                </div>
              </div>
            </button>
            <button
              className={` min-w-[150px] flex-1 py-2 px-3 text-md font-bold ${
                mode === "borrowing"
                  ? "bg-[#C31F70] rounded-lg border-1 border-[#C31F70]"
                  : "rounded-lg border-1 border-[#C31F70]"
              }`}
              onClick={() => setMode("borrowing")}
            >
              <div className="flex-1 flex gap-3 align-center justify-center">
                <div
                  className={`text-3xl self-center ${
                    mode === "borrowing" ? "text-[#ffffff]" : "text-[#C31F70]"
                  }`}
                >
                  <FaArrowTrendDown />
                </div>
                <div
                  className={` self-center ${
                    mode === "borrowing" ? "text-[#ffffff]" : "text-[#000000]"
                  }`}
                >
                  Borrowing
                </div>
              </div>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-black mb-1">
              Initial amount ($):
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                placeholder="Enter amount"
                value={amount === 0 ? "" : amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === "" ? 0 : Math.max(0, parseInt(val) || 0));
                }}
                onFocus={(e) => e.target.select()}
                className="text-[#343434] font-bold block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Increase amount"
                  onClick={() => setAmount((prev) => Math.max(0, prev + 1))}
                  className=" hover:text-[#279989] focus:outline-none"
                >
                  <BiSolidUpArrow />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Decrease amount"
                  onClick={() => setAmount((prev) => Math.max(0, prev - 1))}
                  className=" hover:text-[#C31F70] focus:outline-none"
                >
                  <BiSolidDownArrow />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-black mb-1">
              Interest rate (%):
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                placeholder="Enter rate"
                step="0.1"
                value={interestRate === 0 ? "" : interestRate}
                onChange={(e) =>
                  setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))
                }
                className={`font-bold block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  mode === "borrowing" ? "text-[#C31F70]" : "text-[#007C92]"
                }`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Increase interest rate"
                  onClick={() =>
                    setInterestRate((prev) =>
                      Math.max(0, parseFloat((prev + 0.1).toFixed(1)))
                    )
                  }
                  className="hover:text-[#279989] focus:outline-none"
                >
                  <BiSolidUpArrow />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Decrease interest rate"
                  onClick={() =>
                    setInterestRate((prev) =>
                      Math.max(0, parseFloat((prev - 0.1).toFixed(1)))
                    )
                  }
                  className="hover:text-[#C31F70] focus:outline-none"
                >
                  <BiSolidDownArrow />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-black mb-1">
              Time Period (years):
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="30"
                placeholder="Enter years"
                value={years === 0 ? "" : years}
                onChange={(e) =>
                  setYears(
                    Math.min(30, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Increase years"
                  onClick={() => setYears((prev) => Math.min(30, prev + 1))}
                  className="hover:text-[#279989] focus:outline-none"
                >
                  <BiSolidUpArrow />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Decrease years"
                  onClick={() => setYears((prev) => Math.max(1, prev - 1))}
                  className="hover:text-[#C31F70] focus:outline-none"
                >
                  <BiSolidDownArrow />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-black mb-1">
            Compounding:
          </label>
            <div className="relative">
              <select
              value={compounding}
              onChange={(e) => setCompounding(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border appearance-none"
              >
              <option value="annually">Annually</option>
              <option value="semi-annually">Semi-annually</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              <FaAngleDown />
              </div>
            </div>
          </div>
        </div>

        {/* Results section */}
        <div className="mt-6 p-4 bg-[#F7F8FF] rounded-lg border border-[#F7F8FF]">
          <h2 className={`${poppins.className} text-lg text-black font-bold pb-4`}>Results:</h2>
          <div className="lg:grid lg:grid-cols-2 lg:gap-15">
            <div className="innerwrapper">
              <div className="flex flex-col mb-1">
                <div className="flex align-center flex-row">
                  <div className="w-[50%] text-[15px]  p-4 text-black rounded-l-lg bg-[#D7D7D7]">
                    Initial Amount:
                  </div>
                  <div className="w-[50%] text-xl p-4 self-center rounded-r-lg bg-white font-bold text-black overflow-hidden text-ellipsis">
                    ${amount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col  mb-1">
                <div className={`flex align-center flex-row`}>
                  <div
                    className={`w-[50%] text-[15px] p-4 font-bold text-white rounded-l-lg  ${
                      mode === "saving" ? "bg-[#279989]" : "bg-[#c31f70]"
                    }`}
                  >
                    {mode === "saving" ? "Interest Earned" : "Interest Paid"}:
                  </div>
                  <div
                    className={`w-[50%] text-xl p-4 self-center rounded-r-lg font-bold overflow-hidden text-ellipsis ${
                      mode === "saving"
                        ? "bg-[#EFF7EF] text-[#279989]"
                        : "bg-[#FFEDF6] text-[#C31f70]"
                    }`}
                  >
                    ${Math.abs(interestAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col mb-1">
                <div className={`flex align-center flex-row`}>
                  <div className="w-[50%] text-[15px] p-4 font-bold text-white bg-[#0E3B4F] rounded-l-lg">
                    Final Amount:
                  </div>
                  <div className="w-[50%] text-xl p-4 self-center rounded-r-lg font-bold text-black bg-white  overflow-hidden text-ellipsis">
                    ${totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Example section */}
            <div className="mt-6 py-4 align-self-top lg:mt-0 lg:py-0">
              {mode === "saving" ? (
                <h2 className="text-md font-bold text-[#279989] mb-2">
                  <FaPiggyBank /> When you save:
                </h2>
              ) : (
                <h2 className="text-md font-bold text-[#C31F70] mb-2">
                  <FaArrowTrendDown /> When you borrow
                </h2>
              )}
              <p className="text-black mb-2 text-md">
                {mode === "saving"
                  ? `You are essentially a lender, and you get interest from those using your money.`
                  : `You are paying intereest for the privilege of using someone else's money.`}
              </p>
            </div>
          </div>{" "}
          {/* Wrapper section ends */}
        </div>
      </div>
    </div>
  );
};

export default InterestRateVisual;
