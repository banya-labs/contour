import { describe, expect, it } from "vitest";
import { queryContourDashboardSnapshot } from "./dashboard";

describe("dashboard snapshot", () => {
  it("summarizes live listings, clients, deals, and work items", async () => {
    const prisma = {
      listing: {
        count: async () => 3,
        findMany: async () => [
          {
            id: "listing-1",
            title: "Lusaka West 14",
            propertyType: "Property",
            status: "available",
            priceCents: 180000000,
            currency: "ZMW",
            ownerName: "M. Chanda",
            createdAt: new Date("2026-06-12T09:00:00.000Z"),
          },
        ],
      },
      client: {
        count: async () => 2,
        findMany: async () => [
          {
            id: "client-1",
            fullName: "N. Banda",
            email: "n@example.com",
            phone: "+260970000000",
            status: "active",
            source: "Referral",
            createdAt: new Date("2026-06-12T09:05:00.000Z"),
          },
        ],
      },
      deal: {
        count: async () => 4,
        findMany: async () => [
          {
            id: "deal-1",
            title: "Woodlands 09",
            stage: "negotiating",
            valueCents: 185000000,
            currency: "USD",
            status: "open",
            closedAt: null,
            createdAt: new Date("2026-06-12T09:10:00.000Z"),
          },
        ],
      },
      workItem: {
        count: async () => 5,
        findMany: async () => [
          {
            id: "work-1",
            title: "Verify title deed",
            kind: "document_request",
            tone: "warning",
            status: "open",
            dueAt: new Date("2026-06-13T09:00:00.000Z"),
            createdAt: new Date("2026-06-12T09:15:00.000Z"),
          },
        ],
      },
    };

    const snapshot = await queryContourDashboardSnapshot(
      prisma as Parameters<typeof queryContourDashboardSnapshot>[0],
    );

    expect(snapshot.counts).toEqual({
      listings: 3,
      clients: 2,
      deals: 4,
      workItems: 5,
    });
    expect(snapshot.listings[0]?.title).toBe("Lusaka West 14");
    expect(snapshot.clients[0]?.fullName).toBe("N. Banda");
    expect(snapshot.deals[0]?.stage).toBe("negotiating");
    expect(snapshot.workItems[0]?.tone).toBe("warning");
  });
});
