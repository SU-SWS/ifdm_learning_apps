import React from 'react';
import { poppins } from '@/app/ui/fonts';
import "@/app/ui/globals.css";
import { CiCalculator1 } from "react-icons/ci";

const PageMoved = () => {
  return (
      <div className="m-20">
        <h1 className={`${poppins.className} text-[30px]  font-bold text-black mb-2`}>Applications</h1>
        <ul >
          <li className="mb-2">
            <a
              className="text-blue-500 hover:underline"
              href="/interactives/investment-calculator"
            >
              <CiCalculator1 className="w-[2em] h-[2em] inline-block mr-2" />
              Investment Calculator
            </a>
          </li>
        </ul>
      </div>
  );
}

export default PageMoved;