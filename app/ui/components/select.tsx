import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium mb-1">{label}</label>}
    <select
      className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);