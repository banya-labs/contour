import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ property: { findFirst: vi.fn(), findMany: vi.fn() }, inquiry: { findFirst: vi.fn(), findMany: vi.fn() } }));
vi.mock("../db", () => ({ db: mocks }));
import { getPropertyInquiryMatches, getInquiryPropertyMatches, getMatchingSummaries, invalidateMatchingSummaries } from "./service";
const scope = { organizationId: "org", userId: "agent", permissions: [] };
const p = { id: "p", title: "House", suburb: "Roma", listingType: "FOR_SALE", currency: "ZMW", propertyType: "STANDALONE_HOUSE", askingPrice: 100, rentalPrice: null, bedrooms: 3, bathrooms: 2, plotSizeSqm: 300, matchingMetadata: null, status: "AVAILABLE" };
describe("matching queries", () => {
  beforeEach(() => { vi.resetAllMocks(); invalidateMatchingSummaries("org"); invalidateMatchingSummaries("other"); });
  it("reverse lookup scores only selected property and includes older inquiries beyond 100", async () => {
    mocks.property.findFirst.mockResolvedValue(p);
    mocks.inquiry.findMany.mockResolvedValue(Array.from({ length: 101 }, (_, i) => ({ id: `i${i}`, lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 100, preferredSuburbs: ["Roma"], propertyId: null, status: "NEW_INQUIRY" })));
    const result = await getPropertyInquiryMatches(scope, "p", { page: 6, pageSize: 20, view: "qualifying" });
    expect(result.total).toBe(101);
    expect(result.results).toHaveLength(1);
    expect(mocks.property.findMany).not.toHaveBeenCalled();
    expect(mocks.inquiry.findMany.mock.calls[0][0].where).toMatchObject({ organizationId: "org", propertyId: null, status: { notIn: ["CLOSED", "CLOSED_WON", "CLOSED_LOST"] } });
  });
  it("inquiry lookup ranks full inventory beyond 500 and exposes rejections", async () => {
    mocks.inquiry.findFirst.mockResolvedValue({ id: "i", lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 100, preferredSuburbs: ["Roma"] });
    mocks.property.findMany.mockResolvedValue(Array.from({ length: 501 }, (_, i) => ({ ...p, id: `p${i}` })));
    expect((await getInquiryPropertyMatches(scope, "i", { page: 1, pageSize: 20, view: "qualifying" })).total).toBe(501);
  });
  it("foreign/hidden records fail lookup", async () => {
    mocks.inquiry.findFirst.mockResolvedValue(null);
    await expect(getInquiryPropertyMatches(scope, "foreign", { page: 1, pageSize: 20, view: "qualifying" })).rejects.toThrow("Inquiry not found");
  });
  it("summaries reuse scoped batches and invalidate after mutations", async () => {
    mocks.property.findMany.mockResolvedValue([p]);
    mocks.inquiry.findMany.mockResolvedValue([{ id: "i", clientName: "Buyer", lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 100, preferredSuburbs: ["Roma"] }]);
    expect((await getMatchingSummaries(scope, ["p"], ["i"])).propertySummaries[0].qualifyingCount).toBe(1);
    await getMatchingSummaries(scope, ["p"], []);
    expect(mocks.property.findMany).toHaveBeenCalledTimes(1);
    await getMatchingSummaries({ ...scope, userId: "other" }, ["p"], []);
    expect(mocks.property.findMany).toHaveBeenCalledTimes(2);
    invalidateMatchingSummaries("org");
    mocks.inquiry.findMany.mockResolvedValue([]);
    expect((await getMatchingSummaries(scope, ["p"], [])).propertySummaries[0].qualifyingCount).toBe(0);
  });
  it("counts the complete 501-property and 101-inquiry fixture with bounded previews", async () => {
    const properties = Array.from({ length: 501 }, (_, i) => ({ ...p, id: `p${i}` }));
    const inquiries = Array.from({ length: 101 }, (_, i) => ({ id: `i${i}`, clientName: `Buyer ${i}`, lookingFor: "FOR_SALE", currency: "ZMW", budgetMax: 100, preferredSuburbs: ["Roma"] }));
    mocks.property.findMany.mockResolvedValue(properties); mocks.inquiry.findMany.mockResolvedValue(inquiries);
    const started = performance.now();
    const result = await getMatchingSummaries(scope, properties.map((row) => row.id), inquiries.map((row) => row.id));
    expect(result.propertySummaries.every((row) => row.qualifyingCount === 101 && row.topMatches.length === 2)).toBe(true);
    expect(result.inquirySummaries.every((row) => row.qualifyingCount === 501 && row.topMatches.length === 2)).toBe(true);
    expect(mocks.property.findMany).toHaveBeenCalledTimes(1); expect(mocks.inquiry.findMany).toHaveBeenCalledTimes(1);
    console.info(`Matching fixture: 50601 pairs; ${(performance.now()-started).toFixed(1)}ms; ${Buffer.byteLength(JSON.stringify(result))} summary bytes; two mocked database reads.`);
  });
});
