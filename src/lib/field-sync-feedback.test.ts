import { describe, expect, it } from "vitest";
import { fieldSyncCopy } from "./field-sync-feedback";

describe("field sync feedback", () => {
  it("does not call a local queue write synced", () => {
    expect(fieldSyncCopy("QUEUED")).toEqual({ label: "Saved offline — awaiting sync", confirmed: false });
  });

  it("reserves confirmation for server sync", () => {
    expect(fieldSyncCopy("SYNCED")).toEqual({ label: "Synced", confirmed: true });
  });

  it("keeps a failed sync actionable", () => {
    expect(fieldSyncCopy("FAILED")).toEqual({ label: "Sync failed — retry required", confirmed: false });
  });
});
