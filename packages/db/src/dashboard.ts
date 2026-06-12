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
    listings: number;
    clients: number;
    deals: number;
    workItems: number;
  };
  listings: ContourDashboardListing[];
  clients: ContourDashboardClient[];
  deals: ContourDashboardDeal[];
  workItems: ContourDashboardWorkItem[];
};

type ContourDashboardQueryClient = {
  query: (queryText: string, params?: unknown[]) => Promise<unknown[]>;
};

type CountRow = {
  count: string | number;
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

export async function queryContourDashboardSnapshot(
  client: ContourDashboardQueryClient,
): Promise<ContourDashboardSnapshot> {
  const [listingCount, clientCount, dealCount, workItemCount, listings, clients, deals, workItems] =
    await Promise.all([
      queryCount(client, "listings"),
      queryCount(client, "clients"),
      queryCount(client, "deals"),
      queryCount(client, "work_items"),
      queryListings(client),
      queryClients(client),
      queryDeals(client),
      queryWorkItems(client),
    ]);

  return {
    counts: {
      listings: listingCount,
      clients: clientCount,
      deals: dealCount,
      workItems: workItemCount,
    },
    listings,
    clients,
    deals,
    workItems,
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
