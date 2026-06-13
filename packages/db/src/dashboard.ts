import { neon } from "@neondatabase/serverless";
import { getContourDatabaseConfig } from "@contour/config";

export type ContourDashboardListing = {
  id: string;
  title: string;
  propertyType: string;
  status: string;
  priceCents: number;
  currency: string;
  ownerName: string | null;
  createdAt: string;
};

export type ContourDashboardClient = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  createdAt: string;
};

export type ContourDashboardDeal = {
  id: string;
  title: string;
  stage: string;
  valueCents: number;
  currency: string;
  status: string;
  closedAt: string | null;
  createdAt: string;
};

export type ContourDashboardWorkItem = {
  id: string;
  title: string;
  kind: string;
  tone: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
};

export type ContourDashboardSnapshot = {
  counts: {
    users: number;
    listings: number;
    clients: number;
    deals: number;
    workItems: number;
    events: number;
    auditLogs: number;
    listingUtilities: number;
    clientPreferredLocations: number;
    dealListings: number;
    interactions: number;
    paymentPlans: number;
    installmentScheduleItems: number;
    rentalLeases: number;
    rentalCharges: number;
    payments: number;
    documents: number;
    syncDevices: number;
    syncState: number;
    insights: number;
  };
  metrics: {
    portfolioValueCents: number;
    openDealValueCents: number;
    openInsights: number;
    overdueWorkItems: number;
    activeLeases: number;
    verifiedDocuments: number;
    totalPaymentsCents: number;
    lastSyncAt: string | null;
  };
};

type ContourDashboardQueryClient = {
  query: (queryText: string, params?: unknown[]) => Promise<unknown[]>;
};

type SnapshotRow = {
  users_count: string | number;
  listings_count: string | number;
  clients_count: string | number;
  deals_count: string | number;
  work_items_count: string | number;
  events_count: string | number;
  audit_logs_count: string | number;
  listing_utilities_count: string | number;
  client_preferred_locations_count: string | number;
  deal_listings_count: string | number;
  interactions_count: string | number;
  payment_plans_count: string | number;
  installment_schedule_items_count: string | number;
  rental_leases_count: string | number;
  rental_charges_count: string | number;
  payments_count: string | number;
  documents_count: string | number;
  sync_devices_count: string | number;
  sync_state_count: string | number;
  insights_count: string | number;
  portfolio_value_cents: string | number | null;
  open_deal_value_cents: string | number | null;
  open_insights: string | number | null;
  overdue_work_items: string | number | null;
  active_leases: string | number | null;
  verified_documents: string | number | null;
  total_payments_cents: string | number | null;
  last_sync_at: Date | null;
};

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export async function queryContourDashboardSnapshot(
  client: ContourDashboardQueryClient,
): Promise<ContourDashboardSnapshot> {
  const rows = (await client.query(`
    WITH snapshot AS (
      SELECT
        (SELECT count(*)::int FROM users) AS users_count,
        (SELECT count(*)::int FROM listings) AS listings_count,
        (SELECT count(*)::int FROM clients) AS clients_count,
        (SELECT count(*)::int FROM deals) AS deals_count,
        (SELECT count(*)::int FROM work_items) AS work_items_count,
        (SELECT count(*)::int FROM events) AS events_count,
        (SELECT count(*)::int FROM audit_log) AS audit_logs_count,
        (SELECT count(*)::int FROM listing_utilities) AS listing_utilities_count,
        (SELECT count(*)::int FROM client_preferred_locations) AS client_preferred_locations_count,
        (SELECT count(*)::int FROM deal_listings) AS deal_listings_count,
        (SELECT count(*)::int FROM interactions) AS interactions_count,
        (SELECT count(*)::int FROM payment_plans) AS payment_plans_count,
        (SELECT count(*)::int FROM installment_schedule_items) AS installment_schedule_items_count,
        (SELECT count(*)::int FROM rental_leases) AS rental_leases_count,
        (SELECT count(*)::int FROM rental_charges) AS rental_charges_count,
        (SELECT count(*)::int FROM payments) AS payments_count,
        (SELECT count(*)::int FROM documents) AS documents_count,
        (SELECT count(*)::int FROM sync_devices) AS sync_devices_count,
        (SELECT count(*)::int FROM sync_state) AS sync_state_count,
        (SELECT count(*)::int FROM insights) AS insights_count,
        (SELECT COALESCE(sum(price_cents), 0)::bigint FROM listings) AS portfolio_value_cents,
        (SELECT COALESCE(sum(value_cents), 0)::bigint FROM deals WHERE status = 'open') AS open_deal_value_cents,
        (SELECT count(*)::int FROM insights WHERE status = 'open') AS open_insights,
        (SELECT count(*)::int FROM work_items WHERE status <> 'done') AS overdue_work_items,
        (SELECT count(*)::int FROM rental_leases WHERE status = 'active') AS active_leases,
        (SELECT count(*)::int FROM documents WHERE is_verified = true) AS verified_documents,
        (SELECT COALESCE(sum(amount), 0)::bigint FROM payments) AS total_payments_cents,
        (SELECT max(last_sync_at) FROM sync_state) AS last_sync_at
    )
    SELECT * FROM snapshot
  `)) as SnapshotRow[];

  const snapshot = rows[0];

  return {
    counts: {
      users: Number(snapshot?.users_count ?? 0),
      listings: Number(snapshot?.listings_count ?? 0),
      clients: Number(snapshot?.clients_count ?? 0),
      deals: Number(snapshot?.deals_count ?? 0),
      workItems: Number(snapshot?.work_items_count ?? 0),
      events: Number(snapshot?.events_count ?? 0),
      auditLogs: Number(snapshot?.audit_logs_count ?? 0),
      listingUtilities: Number(snapshot?.listing_utilities_count ?? 0),
      clientPreferredLocations: Number(snapshot?.client_preferred_locations_count ?? 0),
      dealListings: Number(snapshot?.deal_listings_count ?? 0),
      interactions: Number(snapshot?.interactions_count ?? 0),
      paymentPlans: Number(snapshot?.payment_plans_count ?? 0),
      installmentScheduleItems: Number(snapshot?.installment_schedule_items_count ?? 0),
      rentalLeases: Number(snapshot?.rental_leases_count ?? 0),
      rentalCharges: Number(snapshot?.rental_charges_count ?? 0),
      payments: Number(snapshot?.payments_count ?? 0),
      documents: Number(snapshot?.documents_count ?? 0),
      syncDevices: Number(snapshot?.sync_devices_count ?? 0),
      syncState: Number(snapshot?.sync_state_count ?? 0),
      insights: Number(snapshot?.insights_count ?? 0),
    },
    metrics: {
      portfolioValueCents: Number(snapshot?.portfolio_value_cents ?? 0),
      openDealValueCents: Number(snapshot?.open_deal_value_cents ?? 0),
      openInsights: Number(snapshot?.open_insights ?? 0),
      overdueWorkItems: Number(snapshot?.overdue_work_items ?? 0),
      activeLeases: Number(snapshot?.active_leases ?? 0),
      verifiedDocuments: Number(snapshot?.verified_documents ?? 0),
      totalPaymentsCents: Number(snapshot?.total_payments_cents ?? 0),
      lastSyncAt: snapshot?.last_sync_at ? snapshot.last_sync_at.toISOString() : null,
    },
  };
}

export async function getContourDashboardSnapshot(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContourDashboardSnapshot> {
  const databaseConfig = getContourDatabaseConfig(env);
  const sql = neon(databaseConfig.databaseUrl);
  return queryContourDashboardSnapshot({
    query: sql.query.bind(sql),
  });
}
