import { describe, expect, it } from "vitest";
import { queryContourSyncSnapshot } from "./sync";

describe("getContourSyncSnapshot", () => {
  it("summarizes sync counts and last sync time", async () => {
    const snapshot = await queryContourSyncSnapshot({
      syncDevice: {
        count: async () => 3,
      },
      syncState: {
        count: async () => 2,
        aggregate: async () => ({
          _max: {
            lastSyncAt: new Date("2026-06-14T08:30:00.000Z"),
          },
        }),
      },
    } as never);

    expect(snapshot).toEqual({
      syncDevices: 3,
      syncState: 2,
      lastSyncAt: "2026-06-14T08:30:00.000Z",
    });
  });
});
