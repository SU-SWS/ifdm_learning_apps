import {FaArrowTrendDown} from "react-icons/fa6";
import React, {JSX, useState} from "react";
import {FaPiggyBank} from "react-icons/fa";
import clsx from 'clsx';
import { BiSolidDownArrow, BiSolidUpArrow } from "react-icons/bi";

interface SelectorButtonProps {
    mode: "string";
    selectedMode: "saving" | "borrowing";
    onSelectMode: (mode: "saving" | "borrowing") => void;
    icon: JSX.Element;
    label: string;
}
export const SelectorButton = ({ mode, selectedMode, onSelectMode, icon, label }: SelectorButtonProps) => (
    echo { mode }
    <button
        className={`
      min-w-[150px] flex-1 py-2 px-3 text-md font-bold
      ${mode === selectedMode ? `bg-[${modeColor[mode]}] rounded-lg border-1 border-[${modeColor[mode]}]` :
            "rounded-lg border-1 border-[#279989]"}`
        }
        onClick={() => onSelectMode(mode)}
    >
        <div className="flex-1 flex gap-3 align-center justify-center">
            <div className={`text-3xl self-center ${mode === selectedMode ? "text-[#ffffff]" : "text-[#279989]"}`}>
                {icon}
            </div>
            <div className={`self-center ${mode === selectedMode ? "text-[#ffffff]" : "text-[#000000]"}`}>
                {label}
            </div>
        </div>
    </button>
);
