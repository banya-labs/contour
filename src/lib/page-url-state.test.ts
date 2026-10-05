import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeCreationLink, updatePageUrl } from "./page-url-state";

afterEach(() => vi.unstubAllGlobals());

describe("refresh-safe page navigation", () => {
  it("preserves a selected record, filter, tab and hash when updating search", () => {
    expect(updatePageUrl("https://contour.test/dashboard/clients?tab=contacts&clientId=c1&assigned=ASSIGNED#details", { search: "Mary Smith" }))
      .toBe("/dashboard/clients?tab=contacts&clientId=c1&assigned=ASSIGNED&search=Mary+Smith#details");
  });

  it("clears a closed record without clearing its list filters", () => {
    expect(updatePageUrl("https://contour.test/dashboard/properties?propertyId=p1&assigned=ASSIGNED", { propertyId: null }))
      .toBe("/dashboard/properties?assigned=ASSIGNED");
  });

  it.each(["1", "true"])("consumes new=%s once while retaining the lease prefill for initial capture", (flag) => {
    const location = { href: `https://contour.test/dashboard/leases?new=${flag}&prefill=%7B%22propertyId%22%3A%22p1%22%7D&tab=statements` };
    const state = { existing: "navigation" };
    const replaceState = vi.fn((_state, _title, path) => { location.href = new URL(path, location.href).href; });
    vi.stubGlobal("window", { location, history: { state, replaceState } });
    expect(consumeCreationLink()?.get("prefill")).toBe('{"propertyId":"p1"}');
    expect(replaceState).toHaveBeenCalledWith(null, "", "/dashboard/leases?tab=statements");
    expect(consumeCreationLink()).toBeNull();
  });

  it("does not treat an ordinary page visit as a creation command", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", { location: { href: "https://contour.test/dashboard/clients?new=0" }, history: { replaceState } });
    expect(consumeCreationLink()).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
