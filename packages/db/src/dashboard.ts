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
  listings: ContourDashboardListing[];
  clients: ContourDashboardClient[];
  deals: ContourDashboardDeal[];
  workItems: ContourDashboardWorkItem[];
  insights: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    recommendedAction: string | null;
    dueAt: string | null;
  }>;
};

type ContourDashboardQueryClient = {
  query: (queryText: string, params?: unknown[]) => Promise<unknown[]>;
};

type CountRow = {
  count: string | number;
};

type SumRow = {
  value_cents?: string | number | null;
  value?: string | number | null;
  last_sync_at?: Date | null;
};

type ListingRow = {
  id: string;
  title: string;
  property_type: string;
  status: string;
  price_cents: number;
  currency: string;
  owner_name: string | null;
  created_at: Date;
};

type ClientRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  created_at: Date;
};

type DealRow = {
  id: string;
  title: string;
  stage: string;
  value_cents: number;
  currency: string;
  status: string;
  closed_at: Date | null;
  created_at: Date;
};

type WorkItemRow = {
  id: string;
  title: string;
  kind: string;
  tone: string;
  status: string;
  due_at: Date | null;
  created_at: Date;
};

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

async function queryCount(client: ContourDashboardQueryClient, tableName: string) {
  const rows = (await client.query(`SELECT count(*)::int AS count FROM ${tableName}`)) as CountRow[];
  const row = rows[0];
  return Number(row?.count ?? 0);
}

async function queryCountWhere(
  client: ContourDashboardQueryClient,
  sql: string,
  params: unknown[] = [],
) {
  const rows = (await client.query(sql, params)) as CountRow[];
  return Number(rows[0]?.count ?? 0);
}

async function querySumCents(
  client: ContourDashboardQueryClient,
  sql: string,
  params: unknown[] = [],
) {
  const rows = (await client.query(sql, params)) as SumRow[];
  return Number(rows[0]?.value_cents ?? 0);
}

async function queryLastSyncAt(client: ContourDashboardQueryClient) {
  const rows = (await client.query(`
    SELECT max(last_sync_at) AS last_sync_at
    FROM sync_state
  `)) as Array<{ last_sync_at: Date | null }>;
  return rows[0]?.last_sync_at ? rows[0].last_sync_at.toISOString() : null;
}

async function queryListings(client: ContourDashboardQueryClient) {
  const rows = (await client.query(`
    SELECT
      id,
      title,
      property_type,
      status,
      price_cents,
      currency,
      owner_name,
      created_at
    FROM listings
    ORDER BY created_at DESC
    LIMIT 4
  `)) as ListingRow[];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    propertyType: row.property_type,
    status: row.status,
    priceCents: row.price_cents,
    currency: row.currency,
    ownerName: row.owner_name,
    createdAt: row.created_at.toISOString(),
  }));
}

async function queryClients(client: ContourDashboardQueryClient) {
  const rows = (await client.query(`
    SELECT
      id,
      full_name,
      email,
      phone,
      status,
      source,
      created_at
    FROM clients
    ORDER BY created_at DESC
    LIMIT 4
  `)) as ClientRow[];

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    source: row.source,
    createdAt: row.created_at.toISOString(),
  }));
}

async function queryDeals(client: ContourDashboardQueryClient) {
  const rows = (await client.query(`
    SELECT
      id,
      title,
      stage,
      value_cents,
      currency,
      status,
      closed_at,
      created_at
    FROM deals
    ORDER BY created_at DESC
    LIMIT 4
  `)) as DealRow[];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    stage: row.stage,
    valueCents: row.value_cents,
    currency: row.currency,
    status: row.status,
    closedAt: toIsoString(row.closed_at),
    createdAt: row.created_at.toISOString(),
  }));
}

async function queryWorkItems(client: ContourDashboardQueryClient) {
  const rows = (await client.query(`
    SELECT
      id,
      title,
      kind,
      tone,
      status,
      due_at,
      created_at
    FROM work_items
    ORDER BY created_at DESC
    LIMIT 4
  `)) as WorkItemRow[];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind,
    tone: row.tone,
    status: row.status,
    dueAt: toIsoString(row.due_at),
    createdAt: row.created_at.toISOString(),
  }));
}

async function queryInsights(client: ContourDashboardQueryClient) {
  const rows = (await client.query(`
    SELECT
      id,
      title,
      severity,
      status,
      recommended_action,
      due_at
    FROM insights
    ORDER BY created_at DESC
    LIMIT 4
  `)) as Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    recommended_action: string | null;
    due_at: Date | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    severity: row.severity,
    status: row.status,
    recommendedAction: row.recommended_action,
    dueAt: toIsoString(row.due_at),
  }));
}

export async function queryContourDashboardSnapshot(
  client: ContourDashboardQueryClient,
): Promise<ContourDashboardSnapshot> {
  const [
    userCount,
    listingCount,
    clientCount,
    dealCount,
    workItemCount,
    eventCount,
    auditLogCount,
    listingUtilityCount,
    clientPreferredLocationCount,
    dealListingCount,
    interactionCount,
    paymentPlanCount,
    installmentScheduleItemCount,
    rentalLeaseCount,
    rentalChargeCount,
    paymentCount,
    documentCount,
    syncDeviceCount,
    syncStateCount,
    insightCount,
    portfolioValueCents,
    openDealValueCents,
    openInsights,
    overdueWorkItems,
    activeLeases,
    verifiedDocuments,
    totalPaymentsCents,
    lastSyncAt,
    listings,
    clients,
    deals,
    workItems,
    insights,
  ] =
    await Promise.all([
      queryCount(client, "users"),
      queryCount(client, "listings"),
      queryCount(client, "clients"),
      queryCount(client, "deals"),
      queryCount(client, "work_items"),
      queryCount(client, "events"),
      queryCount(client, "audit_log"),
      queryCount(client, "listing_utilities"),
      queryCount(client, "client_preferred_locations"),
      queryCount(client, "deal_listings"),
      queryCount(client, "interactions"),
      queryCount(client, "payment_plans"),
      queryCount(client, "installment_schedule_items"),
      queryCount(client, "rental_leases"),
      queryCount(client, "rental_charges"),
      queryCount(client, "payments"),
      queryCount(client, "documents"),
      queryCount(client, "sync_devices"),
      queryCount(client, "sync_state"),
      queryCount(client, "insights"),
      querySumCents(
        client,
        `SELECT COALESCE(sum(price_cents), 0)::bigint AS value_cents FROM listings`,
      ),
      querySumCents(
        client,
        `SELECT COALESCE(sum(value_cents), 0)::bigint AS value_cents FROM deals WHERE status = 'open'`,
      ),
      queryCountWhere(
        client,
        `SELECT count(*)::int AS count FROM insights WHERE status = 'open'`,
      ),
      queryCountWhere(
        client,
        `SELECT count(*)::int AS count FROM work_items WHERE status <> 'done'`,
      ),
      queryCountWhere(
        client,
        `SELECT count(*)::int AS count FROM rental_leases WHERE status = 'active'`,
      ),
      queryCountWhere(
        client,
        `SELECT count(*)::int AS count FROM documents WHERE is_verified = true`,
      ),
      querySumCents(
        client,
        `SELECT COALESCE(sum(amount), 0)::numeric AS value_cents FROM payments`,
      ),
      queryLastSyncAt(client),
      queryListings(client),
      queryClients(client),
      queryDeals(client),
      queryWorkItems(client),
      queryInsights(client),
    ]);

  return {
    counts: {
      users: userCount,
      listings: listingCount,
      clients: clientCount,
      deals: dealCount,
      workItems: workItemCount,
      events: eventCount,
      auditLogs: auditLogCount,
      listingUtilities: listingUtilityCount,
      clientPreferredLocations: clientPreferredLocationCount,
      dealListings: dealListingCount,
      interactions: interactionCount,
      paymentPlans: paymentPlanCount,
      installmentScheduleItems: installmentScheduleItemCount,
      rentalLeases: rentalLeaseCount,
      rentalCharges: rentalChargeCount,
      payments: paymentCount,
      documents: documentCount,
      syncDevices: syncDeviceCount,
      syncState: syncStateCount,
      insights: insightCount,
    },
    metrics: {
      portfolioValueCents,
      openDealValueCents,
      openInsights,
      overdueWorkItems,
      activeLeases,
      verifiedDocuments,
      totalPaymentsCents,
      lastSyncAt,
    },
    listings,
    clients,
    deals,
    workItems,
    insights,
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
