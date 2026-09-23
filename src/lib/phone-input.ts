export type PhoneCountry = {
  code: string;
  name: string;
  dialLabel: string;
  subscriberDigits: number;
};

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { code: "260", name: "Zambia", dialLabel: "+260", subscriberDigits: 9 },
  { code: "27", name: "South Africa", dialLabel: "+27", subscriberDigits: 9 },
  { code: "263", name: "Zimbabwe", dialLabel: "+263", subscriberDigits: 9 },
  { code: "254", name: "Kenya", dialLabel: "+254", subscriberDigits: 9 },
  { code: "234", name: "Nigeria", dialLabel: "+234", subscriberDigits: 10 },
  { code: "255", name: "Tanzania", dialLabel: "+255", subscriberDigits: 9 },
  { code: "265", name: "Malawi", dialLabel: "+265", subscriberDigits: 9 },
  { code: "267", name: "Botswana", dialLabel: "+267", subscriberDigits: 8 },
  { code: "264", name: "Namibia", dialLabel: "+264", subscriberDigits: 9 },
  { code: "44", name: "United Kingdom", dialLabel: "+44", subscriberDigits: 10 },
  { code: "1", name: "United States / Canada", dialLabel: "+1", subscriberDigits: 10 },
];

export const getPhoneCountry = (code: string) =>
  PHONE_COUNTRIES.find((country) => country.code === code) ?? PHONE_COUNTRIES[0];

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export function composePhoneValue(countryCode: string, localValue: string) {
  const country = getPhoneCountry(countryCode);
  let localDigits = digitsOnly(localValue);
  while (localDigits.startsWith("0")) localDigits = localDigits.slice(1);
  if (!localDigits) return "";
  return `+${country.code}${localDigits}`;
}

export function splitPhoneValue(value: string | null | undefined) {
  const raw = value?.trim() ?? "";
  const digits = digitsOnly(raw);
  const country = PHONE_COUNTRIES.find((entry) => digits.startsWith(entry.code)) ?? PHONE_COUNTRIES[0];
  const localDigits = digits.startsWith(country.code) ? digits.slice(country.code.length) : digits;
  return { countryCode: country.code, localDigits: localDigits.replace(/^0+/, "") };
}

export function validatePhoneDigits(countryCode: string, localValue: string) {
  const country = getPhoneCountry(countryCode);
  const localDigits = digitsOnly(localValue).replace(/^0+/, "");
  if (localDigits.length !== country.subscriberDigits) {
    return { valid: false as const, message: `Enter ${country.subscriberDigits} digits after ${country.dialLabel}.` };
  }
  return { valid: true as const };
}

export function normalizeWhatsAppPhone(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const { countryCode, localDigits } = splitPhoneValue(value);
  const validation = validatePhoneDigits(countryCode, localDigits);
  if (!validation.valid) throw new Error(validation.message);
  return composePhoneValue(countryCode, localDigits);
}
