import { describe, expect, it } from "vitest";
import { getPlatformPeriodStart } from "./platform-metrics";

describe("platform metrics periods", () => {
  const now = new Date("2026-09-24T15:30:00.000Z");
  it("starts the week on local Monday", () => expect(getPlatformPeriodStart("week", now)?.getDate()).toBe(21));
  it("starts the quarter on its first local month", () => expect(getPlatformPeriodStart("quarter", now)?.getMonth()).toBe(6));
  it("does not constrain all-time metrics", () => expect(getPlatformPeriodStart("all", now)).toBeUndefined());
});
