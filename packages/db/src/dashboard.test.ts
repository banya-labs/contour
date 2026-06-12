import { describe, expect, it } from "vitest";
import { queryContourDashboardSnapshot } from "./dashboard";

describe("dashboard snapshot", () => {
  it("summarizes live listings, clients, deals, and work items", async () => {
    const query: any = async (sql: string) => {
      if (sql.includes("FROM listings") && sql.includes("count(*)")) {
        return [{ count: 3 }];
      }
      if (sql.includes("FROM clients") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM deals") && sql.includes("count(*)")) {
        return [{ count: 4 }];
      }
      if (sql.includes("FROM work_items") && sql.includes("count(*)")) {
        return [{ count: 5 }];
      }
      if (sql.includes("FROM listings")) {
        return [
          {
            id: "listing-1",
            title: "Lusaka West 14",
            property_type: "Property",
            status: "available",
            price_cents: 180000000,
            currency: "ZMW",
            owner_name: "M. Chanda",
            created_at: new Date("2026-06-12T09:00:00.000Z"),
          },
        ];
      }
      if (sql.includes("FROM clients")) {
        return [
          {
            id: "client-1",
            full_name: "N. Banda",
            email: "n@example.com",
            phone: "+260970000000",
            status: "active",
            source: "Referral",
            created_at: new Date("2026-06-12T09:05:00.000Z"),
          },
        ];
      }
      if (sql.includes("FROM deals")) {
        return [
          {
            id: "deal-1",
            title: "Woodlands 09",
            stage: "negotiating",
            value_cents: 185000000,
            currency: "USD",
            status: "open",
            closed_at: null,
            created_at: new Date("2026-06-12T09:10:00.000Z"),
          },
        ];
      }
      if (sql.includes("FROM work_items")) {
        return [
          {
            id: "work-1",
            title: "Verify title deed",
            kind: "document_request",
            tone: "warning",
            status: "open",
            due_at: new Date("2026-06-13T09:00:00.000Z"),
            created_at: new Date("2026-06-12T09:15:00.000Z"),
          },
        ];
      }

      throw new Error(`Unexpected query: ${sql}`);
    };

    const snapshot = await queryContourDashboardSnapshot({ query } as any);

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
