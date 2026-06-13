import { describe, expect, it } from "vitest";
import { queryContourDashboardSnapshot } from "./dashboard";

describe("dashboard snapshot", () => {
  it("summarizes live listings, clients, deals, and work items", async () => {
    const query: any = async (sql: string) => {
      if (sql.includes("FROM users") && sql.includes("count(*)")) {
        return [{ count: 6 }];
      }
      if (sql.includes("FROM listings") && sql.includes("count(*)")) {
        return [{ count: 3 }];
      }
      if (sql.includes("FROM clients") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM deals") && sql.includes("count(*)")) {
        return [{ count: 4 }];
      }
      if (sql.includes("FROM work_items") && sql.includes("count(*)") && !sql.includes(`status <> 'done'`)) {
        return [{ count: 5 }];
      }
      if (sql.includes("FROM events") && sql.includes("count(*)")) {
        return [{ count: 7 }];
      }
      if (sql.includes("FROM audit_log") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM listing_utilities") && sql.includes("count(*)")) {
        return [{ count: 4 }];
      }
      if (sql.includes("FROM client_preferred_locations") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM deal_listings") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM interactions") && sql.includes("count(*)")) {
        return [{ count: 3 }];
      }
      if (sql.includes("FROM payment_plans") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM installment_schedule_items") && sql.includes("count(*)")) {
        return [{ count: 3 }];
      }
      if (sql.includes("FROM rental_leases") && sql.includes("count(*)") && !sql.includes(`status = 'active'`)) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM rental_charges") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM payments") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM documents") && sql.includes("count(*)") && !sql.includes(`is_verified = true`)) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM sync_devices") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM sync_state") && sql.includes("count(*)")) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM insights") && sql.includes("count(*)")) {
        return [{ count: 4 }];
      }
      if (sql.includes("FROM work_items") && sql.includes("count(*)") && sql.includes(`status <> 'done'`)) {
        return [{ count: 4 }];
      }
      if (sql.includes("FROM rental_leases") && sql.includes("count(*)") && sql.includes(`status = 'active'`)) {
        return [{ count: 2 }];
      }
      if (sql.includes("FROM documents") && sql.includes("count(*)") && sql.includes(`is_verified = true`)) {
        return [{ count: 1 }];
      }
      if (sql.includes("SELECT COALESCE(sum(price_cents)")) {
        return [{ value_cents: 300000000 }];
      }
      if (sql.includes("SELECT COALESCE(sum(value_cents)")) {
        return [{ value_cents: 185000000 }];
      }
      if (sql.includes("SELECT COALESCE(sum(amount)")) {
        return [{ value_cents: 185000 }];
      }
      if (sql.includes("SELECT max(last_sync_at)")) {
        return [{ last_sync_at: new Date("2026-06-13T08:56:00.000Z") }];
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
      if (sql.includes("FROM insights")) {
        return [
          {
            id: "insight-1",
            title: "Review stale listing",
            severity: "warn",
            status: "open",
            recommended_action: "Contact owner",
            due_at: new Date("2026-06-20T09:00:00.000Z"),
          },
        ];
      }

      throw new Error(`Unexpected query: ${sql}`);
    };

    const snapshot = await queryContourDashboardSnapshot({ query } as any);

    expect(snapshot.counts).toEqual({
      users: 6,
      listings: 3,
      clients: 2,
      deals: 4,
      workItems: 5,
      events: 7,
      auditLogs: 2,
      listingUtilities: 4,
      clientPreferredLocations: 2,
      dealListings: 2,
      interactions: 3,
      paymentPlans: 2,
      installmentScheduleItems: 3,
      rentalLeases: 2,
      rentalCharges: 2,
      payments: 2,
      documents: 2,
      syncDevices: 2,
      syncState: 2,
      insights: 4,
    });
    expect(snapshot.metrics).toEqual({
      portfolioValueCents: 300000000,
      openDealValueCents: 185000000,
      openInsights: 4,
      overdueWorkItems: 4,
      activeLeases: 2,
      verifiedDocuments: 1,
      totalPaymentsCents: 185000,
      lastSyncAt: "2026-06-13T08:56:00.000Z",
    });
    expect(snapshot.listings[0]?.title).toBe("Lusaka West 14");
    expect(snapshot.clients[0]?.fullName).toBe("N. Banda");
    expect(snapshot.deals[0]?.stage).toBe("negotiating");
    expect(snapshot.workItems[0]?.tone).toBe("warning");
    expect(snapshot.insights[0]?.title).toBeDefined();
  });
});
