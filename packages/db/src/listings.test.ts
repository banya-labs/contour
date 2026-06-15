import { describe, expect, it, vi } from "vitest";
import {
  createContourListing,
  createContourListingAttachment,
  getContourListingWithDocuments,
  listContourListings,
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
    formData.set("address", " 14 Lusaka West Road, Lusaka ");
    formData.set("ownerName", "  ");
    formData.set("description", " 3 bedrooms, swimming pool, double story ");

    expect(parseContourListingFormData(formData)).toEqual({
      title: "Lusaka West 14",
      propertyType: "Property",
      status: "available",
      priceCents: 180000000,
      currency: "ZMW",
      address: "14 Lusaka West Road, Lusaka",
      description: "3 bedrooms, swimming pool, double story",
      ownerName: null,
      locationArea: null,
      province: null,
      cityTown: null,
      latitude: null,
      longitude: null,
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
      address: "14 Lusaka West Road, Lusaka",
      description: "3 bedrooms, swimming pool, double story",
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
      address: "Unit 104, East Park Mall, Thabo Mbeki Rd, Plot 5005, Lusaka 00000, Zambia",
      description: "4 bedrooms, double story, swimming pool, office",
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
      address: "14 Lusaka West Road, Lusaka",
      description: "3 bedrooms, swimming pool, double story",
      locationArea: null,
      province: null,
      cityTown: null,
      latitude: null,
      longitude: null,
    });
    const updated = await updateContourListing(prisma as never, "listing-1", {
      title: "Lusaka West 14A",
      propertyType: "Property",
      status: "reserved",
      priceCents: 185000000,
      currency: "USD",
      ownerName: null,
      address: "Unit 104, East Park Mall, Thabo Mbeki Rd, Plot 5005, Lusaka 00000, Zambia",
      description: "4 bedrooms, double story, swimming pool, office",
      locationArea: "Roma",
      province: "Lusaka",
      cityTown: "Lusaka",
      latitude: -15.4167,
      longitude: 28.2833,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Lusaka West 14",
        propertyType: "Property",
        status: "available",
        priceCents: 180000000,
        currency: "ZMW",
        ownerName: "M. Chanda",
        address: "14 Lusaka West Road, Lusaka",
        description: "3 bedrooms, swimming pool, double story",
        locationArea: null,
        province: null,
        cityTown: null,
        latitude: null,
        longitude: null,
      },
      select: {
        id: true,
        title: true,
        propertyType: true,
        status: true,
        priceCents: true,
        currency: true,
        ownerName: true,
        address: true,
        description: true,
        locationArea: true,
        province: true,
        cityTown: true,
        latitude: true,
        longitude: true,
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
        address: "Unit 104, East Park Mall, Thabo Mbeki Rd, Plot 5005, Lusaka 00000, Zambia",
        description: "4 bedrooms, double story, swimming pool, office",
        locationArea: "Roma",
        province: "Lusaka",
        cityTown: "Lusaka",
        latitude: -15.4167,
        longitude: 28.2833,
      },
      select: {
        id: true,
        title: true,
        propertyType: true,
        status: true,
        priceCents: true,
        currency: true,
        ownerName: true,
        address: true,
        description: true,
        locationArea: true,
        province: true,
        cityTown: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(created.id).toBe("listing-1");
    expect(updated.status).toBe("reserved");
  });

  it("falls back to the legacy listing shape when description is missing", async () => {
    const missingColumnError = Object.assign(new Error("column listings.description does not exist"), {
      code: "42703",
    });
    const legacyRow = {
      id: "listing-1",
      title: "Legacy Listing",
      propertyType: "Property",
      status: "available",
      priceCents: 180000000,
      currency: "ZMW",
      ownerName: "M. Chanda",
      address: "14 Lusaka West Road, Lusaka",
      locationArea: "Roma",
      province: "Lusaka",
      cityTown: "Lusaka",
      latitude: -15.4167,
      longitude: 28.2833,
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T08:00:00.000Z"),
    };
    const findMany = vi
      .fn()
      .mockRejectedValueOnce(missingColumnError)
      .mockResolvedValueOnce([legacyRow]);
    const prisma = {
      listing: {
        findMany,
      },
    };

    const listings = await listContourListings(prisma as never);

    expect(listings[0].description).toBeNull();
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it("loads listing attachments with image flags", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "listing-1",
      title: "Lusaka West 14",
        propertyType: "Property",
        status: "available",
        priceCents: 180000000,
        currency: "ZMW",
        ownerName: "M. Chanda",
        address: "14 Lusaka West Road, Lusaka",
        description: "3 bedrooms, swimming pool, double story",
        locationArea: "Roma",
        province: "Lusaka",
        cityTown: "Lusaka",
        latitude: -15.4167,
        longitude: 28.2833,
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T08:00:00.000Z"),
      documents: [
        {
          id: "doc-1",
          documentName: "front.jpg",
          blobUrl: "https://blob.example/front.jpg",
          blobKey: "listings/listing-1/front.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 2048n,
          createdAt: new Date("2026-06-13T08:10:00.000Z"),
        },
        {
          id: "doc-2",
          documentName: "brochure.pdf",
          blobUrl: "https://blob.example/brochure.pdf",
          blobKey: "listings/listing-1/brochure.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 4096n,
          createdAt: new Date("2026-06-13T08:11:00.000Z"),
        },
      ],
    });
    const prisma = {
      listing: {
        findUnique,
      },
    };

    const listing = await getContourListingWithDocuments(prisma as never, "listing-1");

    expect(listing?.documents).toEqual([
      {
        id: "doc-1",
        documentName: "front.jpg",
        blobUrl: "https://blob.example/front.jpg",
        blobKey: "listings/listing-1/front.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 2048,
        isImage: true,
        createdAt: "2026-06-13T08:10:00.000Z",
      },
      {
        id: "doc-2",
        documentName: "brochure.pdf",
        blobUrl: "https://blob.example/brochure.pdf",
        blobKey: "listings/listing-1/brochure.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 4096,
        isImage: false,
        createdAt: "2026-06-13T08:11:00.000Z",
      },
    ]);
  });

  it("creates listing attachments as generic documents", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "doc-1",
      documentName: "front.jpg",
      blobUrl: "https://blob.example/front.jpg",
      blobKey: "listings/listing-1/front.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 2048n,
      createdAt: new Date("2026-06-13T08:10:00.000Z"),
    });
    const prisma = {
      document: {
        create,
      },
    };

    const attachment = await createContourListingAttachment(prisma as never, {
      listingId: "listing-1",
      documentName: "front.jpg",
      blobUrl: "https://blob.example/front.jpg",
      blobKey: "listings/listing-1/front.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 2048,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        listingId: "listing-1",
        documentName: "front.jpg",
        category: "other",
        blobUrl: "https://blob.example/front.jpg",
        blobKey: "listings/listing-1/front.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 2048n,
      },
      select: {
        id: true,
        documentName: true,
        blobUrl: true,
        blobKey: true,
        mimeType: true,
        fileSizeBytes: true,
        createdAt: true,
      },
    });
    expect(attachment.documentName).toBe("front.jpg");
  });
});
