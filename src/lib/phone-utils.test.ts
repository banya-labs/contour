import { describe, it, expect } from "vitest";
import { normalizePhoneNumber, formatWhatsAppDigits, formatPhoneDisplay } from "./phone-utils";

describe("phone-utils", () => {
  it("normalizes Zambian phone numbers with leading 0", () => {
    expect(normalizePhoneNumber("0971234567")).toBe("+260971234567");
    expect(normalizePhoneNumber("0965987654")).toBe("+260965987654");
    expect(normalizePhoneNumber("0950112233")).toBe("+260950112233");
  });

  it("normalizes Zambian numbers with country code without plus", () => {
    expect(normalizePhoneNumber("260971234567")).toBe("+260971234567");
  });

  it("normalizes Zambian 9-digit numbers without leading zero", () => {
    expect(normalizePhoneNumber("977112233")).toBe("+260977112233");
  });

  it("normalizes numbers with spaces, brackets, or dashes", () => {
    expect(normalizePhoneNumber("+260 97 123 4567")).toBe("+260971234567");
    expect(normalizePhoneNumber("(097) 123-4567")).toBe("+260971234567");
  });

  it("preserves South African numbers (+27)", () => {
    expect(normalizePhoneNumber("+27 82 123 4567")).toBe("+27821234567");
    expect(normalizePhoneNumber("27821234567")).toBe("+27821234567");
  });

  it("formats strictly digits for WhatsApp wa.me links", () => {
    expect(formatWhatsAppDigits("0971234567")).toBe("260971234567");
    expect(formatWhatsAppDigits("+260 97 123 4567")).toBe("260971234567");
    expect(formatWhatsAppDigits("971234567")).toBe("260971234567");
    expect(formatWhatsAppDigits("+27 82 123 4567")).toBe("27821234567");
  });

  it("formats display numbers cleanly", () => {
    expect(formatPhoneDisplay("0971234567")).toBe("+260 97 123 4567");
    expect(formatPhoneDisplay("+260971234567")).toBe("+260 97 123 4567");
  });

  it("handles null, undefined, or empty inputs gracefully", () => {
    expect(normalizePhoneNumber(null)).toBe("");
    expect(normalizePhoneNumber(undefined)).toBe("");
    expect(normalizePhoneNumber("")).toBe("");
    expect(formatWhatsAppDigits("")).toBe("");
    expect(formatPhoneDisplay("")).toBe("");
  });
});
