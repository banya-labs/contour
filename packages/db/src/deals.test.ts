import { describe, expect, it, vi } from "vitest";
import {
  createContourDeal,
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
    formData.set("listingId", "listing-1");
    formData.set("clientId", "client-1");

    expect(parseContourDealFormData(formData)).toEqual({
      title: "Ndola West Offer",
      stage: "negotiating",
      status: "open",
      valueCents: 275000000,
      currency: "USD",
      listingId: "listing-1",
      clientId: "client-1",
    });
  });

  it("rejects invalid deal input when linked records are missing", () => {
    const formData = new FormData();
    formData.set("title", "Ndola West Offer");
    formData.set("stage", "new");
    formData.set("status", "open");
    formData.set("value", "2750000");
    formData.set("currency", "ZMW");
    formData.set("listingId", "");
    formData.set("clientId", "");

    expect(() => parseContourDealFormData(formData)).toThrow("Linked listing is required");
  });

  it("creates and updates deals with linked record display fields", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "deal-1",
      title: "Ndola West Offer",
      stage: "new",
      status: "open",
      valueCents: 275000000,
      currency: "ZMW",
      closedAt: null,
      listingId: "listing-1",
      clientId: "client-1",
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T08:00:00.000Z"),
      listing: { id: "listing-1", title: "Ndola West 14" },
      client: { id: "client-1", fullName: "Mwamba Phiri" },
      paymentPlans: [{ id: "plan-1" }],
      payments: [{ id: "payment-1" }],
    });
    const update = vi.fn().mockResolvedValue({
      id: "deal-1",
      title: "Ndola West Offer",
      stage: "contract",
      status: "won",
      valueCents: 280000000,
      currency: "USD",
      closedAt: null,
      listingId: "listing-1",
      clientId: "client-1",
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
      updatedAt: new Date("2026-06-13T09:00:00.000Z"),
      listing: { id: "listing-1", title: "Ndola West 14" },
      client: { id: "client-1", fullName: "Mwamba Phiri" },
      paymentPlans: [{ id: "plan-1" }],
      payments: [{ id: "payment-1" }, { id: "payment-2" }],
    });
    const prisma = {
      deal: {
        create,
        update,
      },
    };

    const created = await createContourDeal(prisma as never, {
      title: "Ndola West Offer",
      stage: "new",
      status: "open",
      valueCents: 275000000,
      currency: "ZMW",
      listingId: "listing-1",
      clientId: "client-1",
    });
    const updated = await updateContourDeal(prisma as never, "deal-1", {
      title: "Ndola West Offer",
      stage: "contract",
      status: "won",
      valueCents: 280000000,
      currency: "USD",
      listingId: "listing-1",
      clientId: "client-1",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Ndola West Offer",
        stage: "new",
        status: "open",
        valueCents: 275000000,
        currency: "ZMW",
        listingId: "listing-1",
        clientId: "client-1",
      },
      select: {
        id: true,
        title: true,
        stage: true,
        status: true,
        valueCents: true,
        currency: true,
        closedAt: true,
        listingId: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
          },
        },
        paymentPlans: {
          select: {
            id: true,
          },
        },
        payments: {
          select: {
            id: true,
          },
        },
      },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "deal-1" },
      data: {
        title: "Ndola West Offer",
        stage: "contract",
        status: "won",
        valueCents: 280000000,
        currency: "USD",
        listingId: "listing-1",
        clientId: "client-1",
      },
      select: {
        id: true,
        title: true,
        stage: true,
        status: true,
        valueCents: true,
        currency: true,
        closedAt: true,
        listingId: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
          },
        },
        paymentPlans: {
          select: {
            id: true,
          },
        },
        payments: {
          select: {
            id: true,
          },
        },
      },
    });
    expect(created.listing?.title).toBe("Ndola West 14");
    expect(updated.client?.fullName).toBe("Mwamba Phiri");
    expect(updated.stage).toBe("contract");
  });
});
