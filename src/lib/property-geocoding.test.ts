import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redis: { status: "ready", set: vi.fn() },
}));
vi.mock("@/lib/redis", () => ({ redis: mocks.redis }));
let searchPropertyLocation: typeof import("./property-geocoding").searchPropertyLocation;

describe("explicit property address lookup", () => {
  beforeEach(async () => { vi.resetModules(); ({ searchPropertyLocation } = await import("./property-geocoding")); mocks.redis.status = "ready"; mocks.redis.set.mockReset().mockResolvedValue("OK"); vi.stubEnv("PROPERTY_GEOCODER_URL", "https://nominatim.openstreetmap.org/search"); });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("sends the entered location without forcing a region and preserves zero coordinates", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ display_name: "Recorded place", lat: "0", lon: "18.4" }, { display_name: "Invalid", lat: "91", lon: "0" }] });
    vi.stubGlobal("fetch", fetcher);
    expect(await searchPropertyLocation("org-a", "Riverside, Harare")).toEqual([{ name: "Recorded place", lat: 0, lng: 18.4 }]);
    expect(new URL(fetcher.mock.calls[0][0]).searchParams.get("q")).toBe("Riverside, Harare");
    expect(mocks.redis.set).toHaveBeenCalledWith("contour:property-geocoding:public-provider", "1", "PX", 1000, "NX");
  });

  it("caches repeated searches within an agency without sharing that cache between agencies", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }); vi.stubGlobal("fetch", fetcher);
    await searchPropertyLocation("org-a", "Riverside"); await searchPropertyLocation("org-a", "Riverside");
    expect(fetcher).toHaveBeenCalledTimes(1);
    await searchPropertyLocation("org-b", "Riverside"); expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not contact the public provider without the shared rate-limit lock", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher); mocks.redis.set.mockResolvedValue(null);
    await expect(searchPropertyLocation("org", "Riverside")).rejects.toMatchObject({ status: 429 });
    mocks.redis.status = "end";
    await expect(searchPropertyLocation("org", "Riverside")).rejects.toMatchObject({ status: 503 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("allows an operator-configured compatible provider", async () => {
    vi.stubEnv("PROPERTY_GEOCODER_URL", "https://geocoder.example.test/search"); mocks.redis.status = "end";
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }); vi.stubGlobal("fetch", fetcher);
    await searchPropertyLocation("org", "Riverside");
    expect(new URL(fetcher.mock.calls[0][0]).hostname).toBe("geocoder.example.test"); expect(mocks.redis.set).not.toHaveBeenCalled();
  });
  it("rejects blank provider coordinate strings instead of converting them into a zero pin", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ display_name: "Malformed place", lat: " ", lon: "" }] }); vi.stubGlobal("fetch", fetcher);
    await expect(searchPropertyLocation("org", "Riverside")).rejects.toThrow();
  });

  it("bounds retained unique queries by evicting the oldest result", async () => {
    vi.stubEnv("PROPERTY_GEOCODER_URL", "https://geocoder.example.test/search");
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [] }); vi.stubGlobal("fetch", fetcher);
    for (let index = 0; index <= 1000; index++) await searchPropertyLocation("org", `Public area ${index}`);
    await searchPropertyLocation("org", "Public area 1000"); expect(fetcher).toHaveBeenCalledTimes(1001);
    await searchPropertyLocation("org", "Public area 0"); expect(fetcher).toHaveBeenCalledTimes(1002);
  });

});
