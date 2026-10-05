import { afterEach, describe, expect, it, vi } from "vitest";
import { usePageUrlState } from "./use-page-url-state";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URL(window.location.href).searchParams,
}));

afterEach(() => vi.unstubAllGlobals());

function visit(href: string) {
  const location = { href };
  const replaceState = vi.fn((_state: unknown, _title: string, path: string) => {
    location.href = new URL(path, location.href).href;
  });
  vi.stubGlobal("window", { location, history: { replaceState } });
  return { location, replaceState };
}

describe("URL-backed page state", () => {
  it("restores selected records and assignment filters on a fresh render", () => {
    visit("https://contour.test/dashboard/properties?propertyId=p1&assigned=ASSIGNED");
    expect(usePageUrlState<string>("propertyId", "")[0]).toBe("p1");
    expect(usePageUrlState("assigned", "ALL", ["ALL", "ASSIGNED"])[0]).toBe("ASSIGNED");
  });

  it("keeps selection while changing filters and keeps filters when closing selection", () => {
    const { location, replaceState } = visit("https://contour.test/dashboard/clients?clientId=c1&tab=contacts");
    usePageUrlState<string>("search", "")[1]("Mary");
    expect(location.href).toContain("clientId=c1&tab=contacts&search=Mary");
    usePageUrlState<string>("clientId", "")[1]("");
    expect(new URL(location.href).searchParams.get("clientId")).toBeNull();
    expect(usePageUrlState<string>("search", "")[0]).toBe("Mary");
    expect(replaceState).toHaveBeenLastCalledWith(null, "", "/dashboard/clients?tab=contacts&search=Mary");
  });

  it("falls back safely for an invalid assignment filter", () => {
    visit("https://contour.test/dashboard/clients?assigned=UNKNOWN");
    expect(usePageUrlState("assigned", "ALL", ["ALL", "ASSIGNED"])[0]).toBe("ALL");
  });
});
