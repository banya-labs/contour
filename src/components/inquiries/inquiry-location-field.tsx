import { useEffect, useId, useState } from "react";
import { LUSAKA_SUBURBS } from "@/lib/locations/lusaka-suburbs";
import { locationsEqual } from "@/lib/locations/normalize-location";

type LocationMode = "empty" | "option" | "custom";

export function getInquiryLocationMode(value: string, options: readonly string[] = LUSAKA_SUBURBS): LocationMode {
  if (!value.trim()) return "empty";
  return options.some((option) => locationsEqual(option, value)) ? "option" : "custom";
}

export function getInquiryLocationDisplayValue(value: string, options: readonly string[] = LUSAKA_SUBURBS): string {
  return options.find((option) => locationsEqual(option, value)) || value;
}

type InquiryLocationFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function InquiryLocationField({ value, onChange, disabled = false }: InquiryLocationFieldProps) {
  const inputId = useId();
  const [mode, setMode] = useState<LocationMode>(() => getInquiryLocationMode(value));
  const selectValue = mode === "custom" ? "__CUSTOM__" : getInquiryLocationDisplayValue(value);

  useEffect(() => {
    setMode(getInquiryLocationMode(value));
  }, [value]);

  const handleModeChange = (nextMode: LocationMode) => {
    setMode(nextMode);
    if (nextMode === "empty") onChange("");
    if (nextMode === "option") onChange(LUSAKA_SUBURBS.find((option) => locationsEqual(option, value)) || "");
  };

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block font-mono text-[11px] font-bold text-editorial-black uppercase tracking-wider">
        Preferred suburb or neighborhood (Optional)
      </label>
      <select
        id={inputId}
        value={selectValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue === "__CUSTOM__") {
            handleModeChange("custom");
            return;
          }
          setMode(getInquiryLocationMode(nextValue));
          onChange(nextValue);
        }}
        disabled={disabled}
        className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
      >
        <option value="">Any location</option>
        {LUSAKA_SUBURBS.map((suburb) => <option key={suburb} value={suburb}>{suburb}</option>)}
        <option value="__CUSTOM__">Custom location...</option>
      </select>
      {mode === "custom" && (
        <input
          aria-label="Custom suburb or neighborhood"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onChange(value.trim())}
          disabled={disabled}
          placeholder="Type suburb or neighborhood"
          maxLength={80}
          className="w-full bg-editorial-paper/40 px-3 py-2 rounded-none border border-editorial-border text-editorial-black focus:outline-none focus:border-editorial-black font-mono text-xs"
        />
      )}
    </div>
  );
}
