import { describe, expect, it } from "vitest";
import { getInquiryLocationDisplayValue, getInquiryLocationMode } from "./inquiry-location-field";

describe("inquiry location field", () => {
  const options = ["Kabulonga", "Roma Park"] as const;

  it("recognizes empty, predefined, and custom values", () => {
    expect(getInquiryLocationMode("", options)).toBe("empty");
    expect(getInquiryLocationMode("Kabulonga", options)).toBe("option");
    expect(getInquiryLocationMode("Kabulonga East", options)).toBe("custom");
    expect(getInquiryLocationDisplayValue("roma park", options)).toBe("Roma Park");
  });
});
