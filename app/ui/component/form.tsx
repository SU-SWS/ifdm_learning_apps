import React, {useState} from "react";

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    step?: number;
    min?: number;
    max?: number;
    label: string;
}
export const NumberInput = ({ value, onChange, step = 1, min = 0, max = Infinity, label }: NumberInputProps) => (
    <div className="flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-black mb-1">
            {label}:
        </label>
        <div className="relative">
            <input
                type="number"
                min={min}
                max={max}
                value={value === 0 ? "" : value}
                onChange={e => onChange(Math.max(min, parseInt(e.target.value) || 0))}
                className="text-[#343434] font-bold block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Increase ${label}`}
                    onClick={() => onChange(Math.min(max, value + step))}
                    className=" hover:text-[#279989] focus:outline-none"
                >
                    <BiSolidUpArrow />
                </button>
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Decrease ${label}`}
                    onClick={() => onChange(Math.max(min, value - step))}
                    className=" hover:text-[#C31F70] focus:outline-none"
                >
                    <BiSolidDownArrow />
                </button>
            </div>
        </div>
    </div>
);
