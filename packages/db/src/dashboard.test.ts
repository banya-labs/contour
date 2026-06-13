import { describe, expect, it } from "vitest";
import { queryContourDashboardSnapshot } from "./dashboard";

describe("dashboard snapshot", () => {
  it("summarizes the key dashboard counts and metrics in one roundtrip", async () => {
    const query: any = async (sql: string) => {
      if (!sql.includes("WITH snapshot AS")) {
        throw new Error(`Unexpected query: ${sql}`);
      }

      return [
        {
          users_count: 6,
          listings_count: 3,
          clients_count: 2,
          deals_count: 4,
          work_items_count: 5,
          events_count: 7,
          audit_logs_count: 2,
          listing_utilities_count: 4,
          client_preferred_locations_count: 2,
          deal_listings_count: 2,
          interactions_count: 3,
          payment_plans_count: 2,
          installment_schedule_items_count: 3,
          rental_leases_count: 2,
          rental_charges_count: 2,
          payments_count: 2,
          documents_count: 2,
          sync_devices_count: 2,
          sync_state_count: 2,
          insights_count: 4,
          portfolio_value_cents: 300000000,
          open_deal_value_cents: 185000000,
          open_insights: 4,
          overdue_work_items: 4,
          active_leases: 2,
          verified_documents: 1,
          total_payments_cents: 185000,
          last_sync_at: new Date("2026-06-13T08:56:00.000Z"),
        },
      ];
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
  });
});
