import { describe, expect, it, vi } from "vitest";
import {
  createContourListing,
  parseContourListingFormData,
  updateContourListing,
} from "./listings";

describe("listing helpers", () => {
  it("normalizes listing form data for storage", () => {
    const formData = new FormData();
    formData.set("title", "  Lusaka West 14  ");
    formData.set("propertyType", "Property");
    formData.set("status", "available");
    formData.set("price", "1800000");
    formData.set("currency", "");
    formData.set("ownerName", "  ");

    expect(parseContourListingFormData(formData)).toEqual({
      title: "Lusaka West 14",
      propertyType: "Property",
      status: "available",
      priceCents: 180000000,
      currency: "ZMW",
      ownerName: null,
    });
  });

  it("creates and updates listings with the canonical db shape", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "listing-1",
      title: "Lusaka West 14",
      propertyType: "Property",
      status: "available",
      priceCents: 180000000,
      currency: "ZMW",
      ownerName: "M. Chanda",
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T08:00:00.000Z"),
    });
    const update = vi.fn().mockResolvedValue({
      id: "listing-1",
      title: "Lusaka West 14A",
      propertyType: "Property",
      status: "reserved",
      priceCents: 185000000,
      currency: "USD",
      ownerName: null,
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T09:00:00.000Z"),
    });
    const prisma = {
      listing: {
        create,
        update,
      },
    };

    const created = await createContourListing(prisma as never, {
      title: "Lusaka West 14",
      propertyType: "Property",
      status: "available",
      priceCents: 180000000,
      currency: "ZMW",
      ownerName: "M. Chanda",
    });
    const updated = await updateContourListing(prisma as never, "listing-1", {
      title: "Lusaka West 14A",
      propertyType: "Property",
      status: "reserved",
      priceCents: 185000000,
      currency: "USD",
      ownerName: null,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Lusaka West 14",
        propertyType: "Property",
        status: "available",
        priceCents: 180000000,
        currency: "ZMW",
        ownerName: "M. Chanda",
      },
      select: {
        id: true,
        title: true,
        propertyType: true,
        status: true,
        priceCents: true,
        currency: true,
        ownerName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "listing-1" },
      data: {
        title: "Lusaka West 14A",
        propertyType: "Property",
        status: "reserved",
        priceCents: 185000000,
        currency: "USD",
        ownerName: null,
      },
      select: {
        id: true,
        title: true,
        propertyType: true,
        status: true,
        priceCents: true,
        currency: true,
        ownerName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(created.id).toBe("listing-1");
    expect(updated.status).toBe("reserved");
  });
});
