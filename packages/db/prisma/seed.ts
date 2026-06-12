import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { Pool, type PoolClient } from "pg";
import { getContourDatabaseConfig } from "@contour/config";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "..", "..", "..");

for (const filePath of [
  path.resolve(repoRoot, ".env.development.local"),
  path.resolve(repoRoot, ".env.local"),
]) {
  if (existsSync(filePath)) {
    loadEnv({ path: filePath, override: false });
  }
}

type SeedCounts = {
  listings: number;
  clients: number;
  deals: number;
  workItems: number;
};

async function getCount(client: PoolClient, table: string) {
  const { rows } = await client.query<{ count: string }>(
    `SELECT count(*)::int AS count FROM ${table}`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function seedContourWorkspace(client: PoolClient) {
  const seededAt = new Date();
  const counts: SeedCounts = {
    listings: await getCount(client, "listings"),
    clients: await getCount(client, "clients"),
    deals: await getCount(client, "deals"),
    workItems: await getCount(client, "work_items"),
  };

  if (Object.values(counts).some((count) => count > 0)) {
    console.log("Contour seed skipped: CRM tables already contain data.");
    return;
  }

  await client.query("BEGIN");

  try {
    const listing1 = await insertListing(client, {
      title: "Lusaka West 14",
      propertyType: "Property",
      status: "available",
      priceCents: 180000000,
      currency: "ZMW",
      ownerName: "M. Chanda",
      updatedAt: seededAt,
    });
    const listing2 = await insertListing(client, {
      title: "Woodlands 09",
      propertyType: "Property",
      status: "reserved",
      priceCents: 18500000,
      currency: "USD",
      ownerName: "N. Banda",
      updatedAt: seededAt,
    });
    const listing3 = await insertListing(client, {
      title: "Ndola North 24",
      propertyType: "Vacant land",
      status: "under_maintenance",
      priceCents: 46000000,
      currency: "ZMW",
      ownerName: "Estate Trust",
      updatedAt: seededAt,
    });
    const listing4 = await insertListing(client, {
      title: "Livingstone Plot 88",
      propertyType: "Vacant land",
      status: "sold",
      priceCents: 5200000,
      currency: "USD",
      ownerName: "T. Phiri",
      updatedAt: seededAt,
    });

    const client1 = await insertClient(client, {
      fullName: "M. Chanda",
      email: "m.chanda@example.com",
      phone: "+260970000001",
      status: "active",
      source: "Referral",
      updatedAt: seededAt,
    });
    const client2 = await insertClient(client, {
      fullName: "N. Banda",
      email: "n.banda@example.com",
      phone: "+260970000002",
      status: "lead",
      source: "Website",
      updatedAt: seededAt,
    });
    const client3 = await insertClient(client, {
      fullName: "Estate Trust",
      email: "trust@example.com",
      phone: "+260970000003",
      status: "archived",
      source: "Legacy import",
      updatedAt: seededAt,
    });
    const client4 = await insertClient(client, {
      fullName: "T. Phiri",
      email: "t.phiri@example.com",
      phone: "+260970000004",
      status: "active",
      source: "Walk-in",
      updatedAt: seededAt,
    });

    const deal1 = await insertDeal(client, {
      title: "Lusaka West 14",
      stage: "negotiating",
      valueCents: 180000000,
      currency: "ZMW",
      status: "open",
      listingId: listing1,
      clientId: client1,
      updatedAt: seededAt,
    });
    await insertDeal(client, {
      title: "Woodlands 09",
      stage: "contract",
      valueCents: 18500000,
      currency: "USD",
      status: "open",
      listingId: listing2,
      clientId: client2,
      updatedAt: seededAt,
    });
    await insertDeal(client, {
      title: "Ndola North 24",
      stage: "viewing",
      valueCents: 46000000,
      currency: "ZMW",
      status: "won",
      closedAt: new Date("2026-06-12T10:30:00.000Z"),
      listingId: listing3,
      clientId: client3,
      updatedAt: seededAt,
    });
    await insertDeal(client, {
      title: "Livingstone Plot 88",
      stage: "new",
      valueCents: 5200000,
      currency: "USD",
      status: "lost",
      listingId: listing4,
      clientId: client4,
      updatedAt: seededAt,
    });

    const workItem1 = await insertWorkItem(client, {
      title: "Verify title deed for Lusaka West 14",
      kind: "document_request",
      tone: "warning",
      status: "open",
      updatedAt: seededAt,
    });
    await insertWorkItem(client, {
      title: "Follow up on Woodlands 09 viewing",
      kind: "follow_up",
      tone: "info",
      status: "in_progress",
      updatedAt: seededAt,
    });
    await insertWorkItem(client, {
      title: "Review duplicate client suspicion",
      kind: "audit_check",
      tone: "danger",
      status: "blocked",
      updatedAt: seededAt,
    });
    await insertWorkItem(client, {
      title: "Resolve sync failure on desktop device",
      kind: "sync_health",
      tone: "info",
      status: "open",
      updatedAt: seededAt,
    });

    await client.query(
      `
        INSERT INTO events (event_type, occurred_at, entity_type, entity_id)
        VALUES ($1, $2, $3, $4),
               ($5, $6, $7, $8),
               ($9, $10, $11, $12)
      `,
      [
        "listing.seeded",
        new Date("2026-06-12T09:00:00.000Z"),
        "listing",
        listing1,
        "deal.seeded",
        new Date("2026-06-12T09:10:00.000Z"),
        "deal",
        deal1,
        "work_item.seeded",
        new Date("2026-06-12T09:15:00.000Z"),
        "work_item",
        workItem1,
      ],
    );

    await client.query(
      `
        INSERT INTO audit_log (action, entity_type, source)
        VALUES ($1, $2, $3)
      `,
      ["insert", "user", "seed"],
    );

    await client.query("COMMIT");
    console.log("Contour seed applied: CRM domain demo data loaded.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function insertListing(
  client: PoolClient,
    data: {
    title: string;
    propertyType: string;
    status: "available" | "reserved" | "sold" | "under_maintenance";
    priceCents: number;
    currency: string;
    ownerName: string;
    updatedAt: Date;
  },
) {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO listings (title, property_type, status, price_cents, currency, owner_name, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [
      data.title,
      data.propertyType,
      data.status,
      data.priceCents,
      data.currency,
      data.ownerName,
      data.updatedAt,
    ],
  );
  return rows[0]!.id;
}

async function insertClient(
  client: PoolClient,
  data: {
    fullName: string;
    email: string;
    phone: string;
    status: "lead" | "active" | "archived";
    source: string;
    updatedAt: Date;
  },
) {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO clients (full_name, email, phone, status, source, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [data.fullName, data.email, data.phone, data.status, data.source, data.updatedAt],
  );
  return rows[0]!.id;
}

async function insertDeal(
  client: PoolClient,
  data: {
    title: string;
    stage: "new" | "viewing" | "negotiating" | "contract" | "closed_won" | "closed_lost";
    valueCents: number;
    currency: string;
    status: "open" | "won" | "lost";
    closedAt?: Date;
    listingId: string;
    clientId: string;
    updatedAt: Date;
  },
) {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO deals (title, stage, value_cents, currency, status, closed_at, listing_id, client_id, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
    [
      data.title,
      data.stage,
      data.valueCents,
      data.currency,
      data.status,
      data.closedAt ?? null,
      data.listingId,
      data.clientId,
      data.updatedAt,
    ],
  );
  return rows[0]!.id;
}

async function insertWorkItem(
  client: PoolClient,
  data: {
    title: string;
    kind: string;
    tone: "info" | "warning" | "danger" | "success";
    status: "open" | "in_progress" | "blocked" | "done";
    updatedAt: Date;
  },
) {
  const { rows } = await client.query<{ id: string }>(
    `
      INSERT INTO work_items (title, kind, tone, status, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [data.title, data.kind, data.tone, data.status, data.updatedAt],
  );
  return rows[0]!.id;
}

async function main() {
  const databaseConfig = getContourDatabaseConfig();
  const pool = new Pool({
    connectionString: databaseConfig.databaseUrl,
    max: 1,
    connectionTimeoutMillis: 60000,
  });
  const client = await pool.connect();

  try {
    await seedContourWorkspace(client);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end().catch(() => undefined);
  }
}

void main();
