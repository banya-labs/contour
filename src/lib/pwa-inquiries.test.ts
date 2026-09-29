import { describe, expect, it } from "vitest";
import { filterActivePwaInquiries } from "./pwa-inquiries";

describe("filterActivePwaInquiries", () => {
  it("hides terminal inquiries while preserving active inquiries", () => {
    const inquiries = [
      { id: "active", status: "NEW_INQUIRY" },
      { id: "won", status: "CLOSED", outcome: "WON" },
      { id: "lost", status: "CLOSED", outcome: "LOST", lostReason: "Budget changed" },
      { id: "legacy-lost", status: "CLOSED_LOST" },
    ];

    expect(filterActivePwaInquiries(inquiries)).toEqual([{ id: "active", status: "NEW_INQUIRY" }]);
  });
});
