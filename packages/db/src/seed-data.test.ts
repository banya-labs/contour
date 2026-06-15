import { describe, expect, it } from "vitest";
import { buildContourSeedBlueprint } from "../prisma/seed-data";

describe("contour seed blueprint", () => {
  it("builds eight coherent rows for every table", () => {
    const blueprint = buildContourSeedBlueprint();

    expect(blueprint.users).toHaveLength(8);
    expect(blueprint.listings).toHaveLength(8);
    expect(blueprint.clients).toHaveLength(8);
    expect(blueprint.deals).toHaveLength(8);
    expect(blueprint.workItems).toHaveLength(8);
    expect(blueprint.listingUtilities).toHaveLength(8);
    expect(blueprint.clientPreferredLocations).toHaveLength(8);
    expect(blueprint.dealListings).toHaveLength(8);
    expect(blueprint.interactions).toHaveLength(8);
    expect(blueprint.paymentPlans).toHaveLength(8);
    expect(blueprint.installmentScheduleItems).toHaveLength(8);
    expect(blueprint.rentalLeases).toHaveLength(8);
    expect(blueprint.rentalCharges).toHaveLength(8);
    expect(blueprint.payments).toHaveLength(8);
    expect(blueprint.documents).toHaveLength(8);
    expect(blueprint.insights).toHaveLength(8);
    expect(blueprint.syncDevices).toHaveLength(8);
    expect(blueprint.syncState).toHaveLength(8);
    expect(blueprint.events).toHaveLength(8);
    expect(blueprint.auditLogs).toHaveLength(8);

    for (const listing of blueprint.listings) {
      expect(typeof listing.latitude).toBe("number");
      expect(typeof listing.longitude).toBe("number");
      expect(Number.isFinite(listing.latitude as number)).toBe(true);
      expect(Number.isFinite(listing.longitude as number)).toBe(true);
    }

    const listingIds = new Set(blueprint.listings.map((row) => row.id));
    const clientIds = new Set(blueprint.clients.map((row) => row.id));
    const dealIds = new Set(blueprint.deals.map((row) => row.id));
    const leaseIds = new Set(blueprint.rentalLeases.map((row) => row.id));
    const insightIds = new Set(blueprint.insights.map((row) => row.id));
    const deviceIds = new Set(blueprint.syncDevices.map((row) => row.id));
    const userIds = new Set(blueprint.users.map((row) => row.id));

    for (const deal of blueprint.deals) {
      expect(listingIds.has(deal.listing_id as string)).toBe(true);
      expect(clientIds.has(deal.client_id as string)).toBe(true);
      expect(userIds.has(deal.assigned_user_id as string)).toBe(true);
      expect(userIds.has(deal.agent_user_id as string)).toBe(true);
    }

    for (const plan of blueprint.paymentPlans) {
      expect(dealIds.has(plan.deal_id as string)).toBe(true);
      expect(clientIds.has(plan.client_id as string)).toBe(true);
    }

    for (const item of blueprint.installmentScheduleItems) {
      expect(blueprint.paymentPlans.some((plan) => plan.id === item.payment_plan_id)).toBe(true);
    }

    for (const lease of blueprint.rentalLeases) {
      expect(listingIds.has(lease.listing_id as string)).toBe(true);
      expect(clientIds.has(lease.tenant_client_id as string)).toBe(true);
      expect(userIds.has(lease.last_modified_by_user_id as string)).toBe(true);
      expect(
        [
          "enquiry_received",
          "viewing_scheduled",
          "viewing_completed",
          "application_received",
          "screening",
          "lease_draft",
          "active_tenancy",
          "closed",
        ].includes(String(lease.lease_stage)),
      ).toBe(true);
    }

    for (const charge of blueprint.rentalCharges) {
      expect(blueprint.rentalLeases.some((lease) => lease.id === charge.lease_id)).toBe(true);
    }

    for (const payment of blueprint.payments) {
      expect(clientIds.has(payment.client_id as string)).toBe(true);
      expect(userIds.has(payment.recorded_by_user_id as string)).toBe(true);
    }

    for (const document of blueprint.documents) {
      expect(listingIds.has(document.listing_id as string)).toBe(true);
      expect(clientIds.has(document.client_id as string)).toBe(true);
      expect(dealIds.has(document.deal_id as string)).toBe(true);
      expect(userIds.has(document.verified_by_user_id as string)).toBe(true);
      expect(userIds.has(document.uploaded_by_user_id as string)).toBe(true);
    }

    for (const insight of blueprint.insights) {
      expect(userIds.has(insight.owner_user_id as string)).toBe(true);
      expect(
        listingIds.has(insight.entity_id as string) ||
          dealIds.has(insight.entity_id as string) ||
          leaseIds.has(insight.entity_id as string),
      ).toBe(true);
      expect(insightIds.has(insight.id)).toBe(true);
    }

    for (const device of blueprint.syncDevices) {
      expect(userIds.has(device.user_id as string)).toBe(true);
      expect(deviceIds.has(device.id)).toBe(true);
    }

    for (const state of blueprint.syncState) {
      expect(deviceIds.has(state.device_id as string)).toBe(true);
    }

    for (const event of blueprint.events) {
      expect(userIds.has(event.actor_user_id as string)).toBe(true);
      expect(event.metadata).toBeTruthy();
    }

    for (const audit of blueprint.auditLogs) {
      expect(userIds.has(audit.actor_user_id as string)).toBe(true);
      expect(audit.after_data).toBeTruthy();
    }
  });
});
