import { describe, expect, it, vi } from "vitest";
import {
  createContourDeal,
  findContourListingMatchesForDeal,
  getContourDeal,
  listContourDeals,
  parseContourDealFormData,
  updateContourDeal,
} from "./deals";

describe("deal helpers", () => {
  it("normalizes deal form data for storage", () => {
    const formData = new FormData();
    formData.set("title", "  Ndola West Offer  ");
    formData.set("stage", "negotiating");
    formData.set("status", "open");
    formData.set("value", "2750000");
    formData.set("currency", "usd");
    formData.set("dealType", "sale");
    formData.set("clientId", "client-1");
    formData.set("listingId", "");
    formData.set("requestSummary", "Looking for a family home near Lusaka West");
    formData.set("preferredPropertyType", "house");
    formData.set("preferredLocation", "Lusaka West");
    formData.set("preferredProvince", "Lusaka");
    formData.set("preferredCityTown", "Lusaka");
    formData.set("preferredBedrooms", "3");
    formData.set("preferredBathrooms", "2");

    expect(parseContourDealFormData(formData)).toEqual({
      title: "Ndola West Offer",
      stage: "negotiating",
      status: "open",
      dealType: "sale",
      valueCents: 275000000,
      currency: "USD",
      listingId: null,
      clientId: "client-1",
      requestSummary: "Looking for a family home near Lusaka West",
      preferredPropertyType: "house",
      preferredLocation: "Lusaka West",
      preferredProvince: "Lusaka",
      preferredCityTown: "Lusaka",
      preferredBedrooms: 3,
      preferredBathrooms: 2,
    });
  });

  it("rejects invalid deal input when linked records are missing", () => {
    const formData = new FormData();
    formData.set("title", "Ndola West Offer");
    formData.set("stage", "new_enquiry");
    formData.set("status", "open");
    formData.set("value", "2750000");
    formData.set("currency", "ZMW");
    formData.set("dealType", "sale");
    formData.set("listingId", "");
    formData.set("clientId", "");

    expect(() => parseContourDealFormData(formData)).toThrow("Linked client is required");
  });

  it("loads and mutates deals with linked record display fields", async () => {
    const rows = [
      {
        id: "deal-1",
        title: "Ndola West Offer",
        stage: "new_enquiry",
        status: "open",
        dealType: "sale",
        valueCents: 275000000,
        currency: "ZMW",
        closedAt: null,
        listingId: "listing-1",
        clientId: "client-1",
        createdAt: new Date("2026-06-13T08:00:00.000Z"),
        updatedAt: new Date("2026-06-13T08:00:00.000Z"),
        listingRecordId: "listing-1",
        listingTitle: "Ndola West 14",
        clientRecordId: "client-1",
        clientFullName: "Mwamba Phiri",
        paymentPlansCount: 1,
        paymentsCount: 1,
      },
      {
        id: "deal-1",
        title: "Ndola West Offer",
        stage: "closing",
        status: "won",
        dealType: "sale",
        valueCents: 280000000,
        currency: "USD",
        closedAt: null,
        listingId: "listing-1",
        clientId: "client-1",
        createdAt: new Date("2026-06-13T08:00:00.000Z"),
        updatedAt: new Date("2026-06-13T09:00:00.000Z"),
        listingRecordId: "listing-1",
        listingTitle: "Ndola West 14",
        clientRecordId: "client-1",
        clientFullName: "Mwamba Phiri",
        paymentPlansCount: 1,
        paymentsCount: 2,
      },
    ];

    const queryRaw = vi
      .fn()
      .mockResolvedValueOnce([
        rows[0],
      ])
      .mockResolvedValueOnce([
        rows[0],
      ])
      .mockResolvedValueOnce([
        rows[0],
      ])
      .mockResolvedValueOnce([
        rows[1],
      ]);
    const prisma = {
      $queryRaw: queryRaw,
    };

    const listed = await listContourDeals(prisma as never, { dealType: "sale" });
    const fetched = await getContourDeal(prisma as never, "deal-1");
    const created = await createContourDeal(prisma as never, {
      title: "Ndola West Offer",
      stage: "new_enquiry",
      status: "open",
      dealType: "sale",
      valueCents: 275000000,
      currency: "ZMW",
      listingId: "listing-1",
      clientId: "client-1",
    });
    const updated = await updateContourDeal(prisma as never, "deal-1", {
      title: "Ndola West Offer",
      stage: "closing",
      status: "won",
      dealType: "sale",
      valueCents: 280000000,
      currency: "USD",
      listingId: "listing-1",
      clientId: "client-1",
    });

    expect(listed[0].stage).toBe("new_enquiry");
    expect(fetched?.listing?.title).toBe("Ndola West 14");
    expect(created.listing?.title).toBe("Ndola West 14");
    expect(updated.client?.fullName).toBe("Mwamba Phiri");
    expect(updated.stage).toBe("closing");
    expect(queryRaw).toHaveBeenCalled();
  });

  it("falls back to legacy deal columns when the new request fields are absent", async () => {
    const missingColumnError = Object.assign(new Error("column d.request_summary does not exist"), {
      code: "42703",
    });
    const legacyRow = {
      id: "deal-legacy",
      title: "Legacy Deal",
      stage: "new_enquiry",
      status: "open",
      dealType: "sale",
      valueCents: 120000000,
      currency: "ZMW",
      closedAt: null,
      listingId: "listing-1",
      clientId: "client-1",
      requestSummary: null,
      preferredPropertyType: null,
      preferredLocation: null,
      preferredProvince: null,
      preferredCityTown: null,
      preferredBedrooms: null,
      preferredBathrooms: null,
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T08:00:00.000Z"),
      listingRecordId: "listing-1",
      listingTitle: "Legacy Listing",
      listingDescription: null,
      clientRecordId: "client-1",
      clientFullName: "Legacy Client",
      paymentPlansCount: 0,
      paymentsCount: 0,
    };
    const queryRaw = vi
      .fn()
      .mockRejectedValueOnce(missingColumnError)
      .mockResolvedValueOnce([legacyRow])
      .mockRejectedValueOnce(missingColumnError)
      .mockResolvedValueOnce([legacyRow]);
    const prisma = {
      $queryRaw: queryRaw,
    };

    const listed = await listContourDeals(prisma as never);
    const fetched = await getContourDeal(prisma as never, "deal-legacy");

    expect(listed[0].requestSummary).toBeNull();
    expect(listed[0].listingDescription).toBeNull();
    expect(fetched?.client?.fullName).toBe("Legacy Client");
    expect(queryRaw).toHaveBeenCalledTimes(4);
  });

  it("scores listings against deal requests using the request fields", () => {
    const matches = findContourListingMatchesForDeal(
      {
        requestSummary: "Need a double story home with swimming pool",
        valueCents: 275000000,
        preferredPropertyType: "house",
        preferredLocation: "East Park Mall",
        preferredProvince: "Lusaka",
        preferredCityTown: "Lusaka",
        preferredBedrooms: 3,
        preferredBathrooms: 2,
      },
      [
      {
        id: "listing-1",
        title: "East Park Family Home",
        propertyType: "House",
        description: "3 bedrooms, swimming pool, double story family home with office",
        priceCents: 265000000,
        currency: "ZMW",
        address: "Unit 104, East Park Mall, Thabo Mbeki Rd, Plot 5005, Lusaka 00000, Zambia",
        locationArea: "East Park Mall",
          province: "Lusaka",
          cityTown: "Lusaka",
          bedrooms: 4,
          bathrooms: 2,
        },
        {
        id: "listing-2",
        title: "Far Away Flat",
        propertyType: "Apartment",
        description: "2 bedrooms, compact apartment",
        priceCents: 220000000,
        currency: "ZMW",
        address: "Ndola",
          locationArea: "Ndola",
          province: "Copperbelt",
          cityTown: "Ndola",
          bedrooms: 2,
          bathrooms: 1,
        },
      ],
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].listing.id).toBe("listing-1");
    expect(matches[0].score).toBeGreaterThan(matches[0].reasons.length);
    expect(matches[0].reasons).toContain("Request summary matches the property description");
    expect(matches[0].reasons).toContain("Location matches the request");
    expect(matches[0].reasons).toContain("Bedrooms meet the request (4)");
  });
});
