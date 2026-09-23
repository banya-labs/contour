import { describe, expect, it } from "vitest";
import {
  composePhoneValue,
  getPhoneCountry,
  splitPhoneValue,
  validatePhoneDigits,
} from "./phone-input";

describe("phone input contract", () => {
  it("prefills Zambia and removes a local leading zero", () => {
    expect(composePhoneValue("260", "097 123 4567")).toBe("+260971234567");
  });

  it("preserves a selected country code when the subscriber changes", () => {
    expect(composePhoneValue("27", "082 123 4567")).toBe("+27821234567");
  });

  it("splits stored E.164 values for editing", () => {
    expect(splitPhoneValue("+260971234567")).toEqual({ countryCode: "260", localDigits: "971234567" });
  });

  it("validates exact subscriber digit counts", () => {
    expect(validatePhoneDigits("260", "971234567")).toEqual({ valid: true });
    expect(validatePhoneDigits("260", "97123456")).toEqual({ valid: false, message: "Enter 9 digits after +260." });
  });

  it("falls back to Zambia for an unknown country code", () => {
    expect(getPhoneCountry("999").code).toBe("260");
  });
});
