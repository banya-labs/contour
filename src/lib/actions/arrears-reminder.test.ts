import { describe, expect, it } from "vitest";
import { canQueueArrearsReminder } from "./arrears-reminder";

describe("arrears reminder action", () => {
  it("allows a reminder when no recent reminder exists", () => {
    expect(canQueueArrearsReminder(null, new Date("2026-09-27T12:00:00Z"))).toBe(true);
  });

  it("enforces the four-day cooldown", () => {
    expect(canQueueArrearsReminder(new Date("2026-09-25T12:00:00Z"), new Date("2026-09-27T12:00:00Z"))).toBe(false);
    expect(canQueueArrearsReminder(new Date("2026-09-23T12:00:00Z"), new Date("2026-09-27T12:00:00Z"))).toBe(true);
  });
});
