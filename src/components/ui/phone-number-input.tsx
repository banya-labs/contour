"use client";

import React, { useEffect, useId, useState } from "react";
import {
  composePhoneValue,
  getPhoneCountry,
  PHONE_COUNTRIES,
  splitPhoneValue,
  validatePhoneDigits,
} from "@/lib/phone-input";

type PhoneNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
};

export function PhoneNumberInput({
  value,
  onChange,
  id,
  name,
  label = "Phone number",
  required = false,
  disabled = false,
  placeholder = "971 234 567",
  className = "",
  error,
}: PhoneNumberInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const initial = splitPhoneValue(value);
  const [countryCode, setCountryCode] = useState(initial.countryCode);
  const [localDigits, setLocalDigits] = useState(initial.localDigits);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setLocalDigits("");
      return;
    }
    const next = splitPhoneValue(value);
    setCountryCode(next.countryCode);
    setLocalDigits(next.localDigits);
  }, [value]);

  const country = getPhoneCountry(countryCode);
  const validation = validatePhoneDigits(countryCode, localDigits);
  const validationMessage = touched && localDigits && !validation.valid ? validation.message : undefined;
  const describedBy = `${inputId}-hint${validationMessage || error ? ` ${inputId}-error` : ""}`;

  const updateLocal = (nextValue: string) => {
    const nextDigits = nextValue.replace(/\D/g, "").replace(/^0+/, "").slice(0, country.subscriberDigits);
    setLocalDigits(nextDigits);
    onChange(composePhoneValue(countryCode, nextDigits));
  };

  const updateCountry = (nextCode: string) => {
    setCountryCode(nextCode);
    onChange(composePhoneValue(nextCode, localDigits));
    setTouched(false);
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-xs font-heading font-semibold uppercase tracking-wider text-editorial-black">
          {label} {required && <span className="text-contour-red">*</span>}
        </label>
      )}
      <div className="flex min-w-0 border border-editorial-border bg-white focus-within:border-editorial-black">
        <select
          aria-label="Country calling code"
          value={countryCode}
          onChange={(event) => updateCountry(event.target.value)}
          disabled={disabled}
          className="w-[8.5rem] shrink-0 border-r border-editorial-border bg-neutral-50 px-2 py-2 text-xs text-editorial-black focus:outline-none disabled:opacity-60"
        >
          {PHONE_COUNTRIES.map((option) => (
            <option key={option.code} value={option.code}>{option.dialLabel} · {option.name}</option>
          ))}
        </select>
        <input
          id={inputId}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={localDigits}
          onChange={(event) => updateLocal(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          required={required}
          pattern={`\\d{${country.subscriberDigits}}`}
          title={`Enter exactly ${country.subscriberDigits} digits after ${country.dialLabel}.`}
          disabled={disabled}
          aria-invalid={Boolean(validationMessage || error)}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 px-3 py-2 text-sm text-editorial-black focus:outline-none disabled:bg-neutral-100 disabled:text-editorial-muted"
        />
      </div>
      <p id={`${inputId}-hint`} className="mt-1 text-[11px] text-editorial-muted">
        Enter {country.subscriberDigits} digits only. {country.dialLabel} is already selected — do not add the country code or a leading 0.
      </p>
      {(validationMessage || error) && <p id={`${inputId}-error`} role="alert" className="mt-1 text-[11px] font-semibold text-red-700">{error || validationMessage}</p>}
    </div>
  );
}
