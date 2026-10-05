import { describe, expect, it, vi } from "vitest";
import { landlordStatementViewerUrl, loadLandlordStatement } from "./viewer";

describe("saved landlord statement viewer", () => {
  it("opens a saved statement route rather than writing into a blank popup", () => {
    expect(landlordStatementViewerUrl("stmt-1")).toBe("/dashboard/statements/stmt-1/print");
  });
  it("reports a denied or missing statement instead of rendering an empty document", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ success: false, error: "Statement not found." }), { status: 404 }));
    await expect(loadLandlordStatement("stmt-1", fetcher)).rejects.toThrow("Statement not found.");
  });
  it("returns the saved ledger values without generating a new statement", async () => {
    const statement = { id: "stmt-1", netLandlordPayout: "4250.00" };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ success: true, statement })));
    expect(await loadLandlordStatement("stmt-1", fetcher)).toEqual(statement);
    expect(fetcher.mock.calls[0][0]).toBe("/api/statements/stmt-1");
    expect(fetcher.mock.calls[0][1]?.cache).toBe("no-store");
    expect(fetcher.mock.calls[0][1]?.method).toBeUndefined();
  });
});
