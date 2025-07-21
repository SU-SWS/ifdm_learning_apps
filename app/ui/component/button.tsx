import {FaArrowTrendDown} from "react-icons/fa6";
import React from "react";

export function selectingButton(){
    return (
        <button type={type} onClick={onClick}
                className={`min-w-[150px] flex-1 py-2 px-3 text-md font-bold ${
                    mode === "saving"
                        ? "bg-[#279989] rounded-lg border-1 border-[#279989]"
                        : "rounded-lg border-1 border-[#279989]"
                }`}>
            {buttonText}
        </button>
    );
}

