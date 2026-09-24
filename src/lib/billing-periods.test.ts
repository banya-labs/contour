import { describe, expect, it } from "vitest";
import { getNextBillingPeriod } from "./billing-periods";

describe("billing periods", () => {
  it("advances monthly periods by one calendar month", () => {
    const start = new Date("2026-09-25T00:00:00.000Z");
    expect(getNextBillingPeriod(start, "MONTHLY").end).toEqual(new Date("2026-10-25T00:00:00.000Z"));
  });

  it("advances annual periods by twelve calendar months", () => {
    const start = new Date("2026-09-25T00:00:00.000Z");
    expect(getNextBillingPeriod(start, "ANNUAL").end).toEqual(new Date("2027-09-25T00:00:00.000Z"));
  });
});
