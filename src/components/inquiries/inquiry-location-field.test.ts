import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getInquiryLocationDisplayValue, getInquiryLocationMode, InquiryLocationField } from "./inquiry-location-field";

describe("inquiry location field", () => {
  it("offers any location with free text and no regional defaults", () => {
    const html = renderToStaticMarkup(React.createElement(InquiryLocationField, { value: "Cape Town", onChange: () => {} }));
    expect(html).toContain('placeholder="Any location"');
    expect(html).toContain('value="Cape Town"');
    expect(html).not.toContain("Kabulonga");
    expect(html).not.toContain("datalist");
  });

  it("shows only supplied location suggestions while keeping free text", () => {
    const html = renderToStaticMarkup(React.createElement(InquiryLocationField, { value: "Durban", onChange: () => {}, suggestions: ["Cape Town", " cape town ", "Johannesburg"] }));
    expect(html).toContain('value="Durban"');
    expect(html).toContain('value="Cape Town"');
    expect(html.match(/<option/g)).toHaveLength(2);
  });
  it("preserves any saved location without assuming a regional catalog", () => {
    expect(getInquiryLocationMode("Kabulonga")).toBe("custom");
    expect(getInquiryLocationMode("Cape Town")).toBe("custom");
    expect(getInquiryLocationDisplayValue("Roma Park")).toBe("Roma Park");
    expect(getInquiryLocationMode("  ")).toBe("empty");
  });

  const options = ["Kabulonga", "Roma Park"] as const;

  it("recognizes empty, predefined, and custom values", () => {
    expect(getInquiryLocationMode("", options)).toBe("empty");
    expect(getInquiryLocationMode("Kabulonga", options)).toBe("option");
    expect(getInquiryLocationMode("Kabulonga East", options)).toBe("custom");
    expect(getInquiryLocationDisplayValue("roma park", options)).toBe("Roma Park");
  });
});
