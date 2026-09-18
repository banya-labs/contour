/**
 * Phone number normalization utilities for Contour & Southern African operations.
 * Defaults to Zambia (+260) while supporting South Africa (+27), Zimbabwe (+263), etc.
 */

/**
 * Normalizes any entered phone number into standard E.164 format (+260971234567).
 * Handles:
 *  - "0971234567" -> "+260971234567"
 *  - "971234567"  -> "+260971234567"
 *  - "+260 97 123 4567" -> "+260971234567"
 *  - "260971234567" -> "+260971234567"
 *  - "+27 82 123 4567" -> "+27821234567"
 */
export function normalizePhoneNumber(raw: string | null | undefined, defaultCountryCode = "260"): string {
  if (!raw) return "";

  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Strip all non-digit and non-plus characters
  const cleaned = trimmed.replace(/[^\d+]/g, "");

  // If already starts with '+', return with only digits after plus
  if (cleaned.startsWith("+")) {
    const digitsOnly = cleaned.slice(1).replace(/\D/g, "");
    return digitsOnly ? `+${digitsOnly}` : "";
  }

  // Remove any leading plus if present elsewhere
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return "";

  // If it starts with '0' (standard local prefix in Zambia e.g. 097, 096, 095)
  if (digits.startsWith("0")) {
    return `+${defaultCountryCode}${digits.slice(1)}`;
  }

  // If it already starts with default country code without plus (e.g. 260971234567)
  if (digits.startsWith(defaultCountryCode)) {
    return `+${digits}`;
  }

  // If it starts with other Southern African regional codes (27 = SA, 263 = ZW, 254 = KE)
  if (digits.startsWith("27") || digits.startsWith("263") || digits.startsWith("254") || digits.startsWith("255")) {
    return `+${digits}`;
  }

  // If 9 digits (standard Zambian phone without leading zero e.g. 977112233)
  if (digits.length === 9) {
    return `+${defaultCountryCode}${digits}`;
  }

  // Fallback: prepend default country code
  return `+${defaultCountryCode}${digits}`;
}

/**
 * Formats a phone number strictly as digits for WhatsApp direct links (https://wa.me/260971234567).
 * WhatsApp wa.me links must NOT have '+', dashes, brackets, spaces, or leading zeros.
 */
export function formatWhatsAppDigits(raw: string | null | undefined, defaultCountryCode = "260"): string {
  const normalized = normalizePhoneNumber(raw, defaultCountryCode);
  return normalized.replace(/\D/g, "");
}

/**
 * Pretty-formats a Zambian or international phone number for UI display (+260 97 123 4567).
 */
export function formatPhoneDisplay(raw: string | null | undefined, defaultCountryCode = "260"): string {
  const normalized = normalizePhoneNumber(raw, defaultCountryCode);
  if (!normalized) return "";

  // Zambian number formatting (+260 97 123 4567)
  if (normalized.startsWith("+260") && normalized.length === 13) {
    const prefix = normalized.slice(0, 4); // +260
    const network = normalized.slice(4, 6); // 97, 96, 95
    const part1 = normalized.slice(6, 9);   // 123
    const part2 = normalized.slice(9, 13);  // 4567
    return `${prefix} ${network} ${part1} ${part2}`;
  }

  return normalized;
}
