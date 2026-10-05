import React, { useId } from "react";
import { cleanLocationValues, locationsEqual } from "@/lib/locations/normalize-location";

type LocationMode = "empty" | "option" | "custom";

export function getInquiryLocationMode(value: string, options: readonly string[] = []): LocationMode {
  if (!value.trim()) return "empty";
  return options.some((option) => locationsEqual(option, value)) ? "option" : "custom";
}

export function getInquiryLocationDisplayValue(value: string, options: readonly string[] = []): string {
  return options.find((option) => locationsEqual(option, value)) || value;
}

type InquiryLocationFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  suggestions?: readonly string[];
};

export function InquiryLocationField({ value, onChange, disabled = false, suggestions = [] }: InquiryLocationFieldProps) {
  const inputId = useId();
  const options = cleanLocationValues(suggestions);
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider">
        Preferred suburb or neighborhood (Optional)
      </label>
      <input
        id={inputId}
        aria-label="Preferred suburb or neighborhood"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onChange(value.trim())}
        disabled={disabled}
        placeholder="Any location"
        maxLength={80}
        list={options.length ? `${inputId}-suggestions` : undefined}
        className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
      />
      {options.length > 0 && <datalist id={`${inputId}-suggestions`}>{options.map((option) => <option key={option} value={option} />)}</datalist>}
    </div>
  );
}
