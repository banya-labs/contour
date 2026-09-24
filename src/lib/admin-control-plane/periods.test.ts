import { describe, expect, it } from "vitest";
import { periodStart } from "./periods";

describe("control plane periods", () => {
  const now = new Date("2026-09-25T14:30:00.000Z");
  it("starts today at midnight", () => expect(periodStart("today", now).getHours()).toBe(0));
  it("starts this month on the first", () => expect(periodStart("this_month", now).getDate()).toBe(1));
  it("starts this year in January", () => expect(periodStart("this_year", now).getMonth()).toBe(0));
});
