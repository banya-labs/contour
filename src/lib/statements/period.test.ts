import { describe, expect, it } from "vitest";
import { resolveEarningsPeriod } from "./period";
describe("shared organization earnings period", () => {
  it("uses Monday-Sunday weeks with exclusive next-Monday end", () => {
    const p = resolveEarningsPeriod("week", "Africa/Lusaka", new Date("2026-10-04T12:00:00Z"));
    expect(p.start?.toISOString()).toBe("2026-09-27T22:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-10-04T22:00:00.000Z");
  });
  it("uses organization midnight and month rather than browser/server timezone", () => {
    const p = resolveEarningsPeriod("month", "Africa/Lusaka", new Date("2026-09-30T23:30:00Z"));
    expect(p.start?.toISOString()).toBe("2026-09-30T22:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-10-31T22:00:00.000Z");
  });
});
