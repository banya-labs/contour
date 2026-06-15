import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { Pool, type PoolClient } from "pg";
import { getContourDatabaseConfig } from "@contour/config";
import { buildContourSeedBlueprint } from "./seed-data";

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

type SeedRow = Record<string, unknown>;

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function upsertRows(
  client: PoolClient,
  table: string,
  rows: SeedRow[],
  conflictColumns: string[],
) {
  if (rows.length === 0) {
    return;
  }

  const columns = Object.keys(rows[0]!);
  const updateColumns = columns.filter((column) => !conflictColumns.includes(column));
  const conflictTarget = conflictColumns.map(quoteIdentifier).join(", ");

  for (const row of rows) {
    const values = columns.map((column) => {
      const value = row[column];
      if (value === undefined) {
        throw new Error(`Missing value for ${table}.${column}`);
      }
      return value;
    });

    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const updates = updateColumns
      .map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`)
      .join(", ");

    const sql = `
      INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(", ")})
      VALUES (${placeholders})
      ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updates}
    `;

    await client.query(sql, values);
  }
}

async function main() {
  const databaseConfig = getContourDatabaseConfig();
  const pool = new Pool({
    connectionString: databaseConfig.databaseUrl,
    max: 1,
    connectionTimeoutMillis: 60000,
  });
  const client = await pool.connect();
  const blueprint = buildContourSeedBlueprint();

  try {
    await client.query("BEGIN");

    await upsertRows(client, "users", blueprint.users, ["id"]);
    await upsertRows(client, "listings", blueprint.listings, ["id"]);
    await upsertRows(client, "clients", blueprint.clients, ["id"]);
    await upsertRows(client, "deals", blueprint.deals, ["id"]);
    await upsertRows(client, "listing_utilities", blueprint.listingUtilities, ["listing_id", "utility"]);
    await upsertRows(client, "client_preferred_locations", blueprint.clientPreferredLocations, ["client_id", "location_area"]);
    await upsertRows(client, "deal_listings", blueprint.dealListings, ["deal_id", "listing_id"]);
    await upsertRows(client, "interactions", blueprint.interactions, ["id"]);
    await upsertRows(client, "payment_plans", blueprint.paymentPlans, ["id"]);
    await upsertRows(client, "installment_schedule_items", blueprint.installmentScheduleItems, ["id"]);
    await upsertRows(client, "rental_leases", blueprint.rentalLeases, ["id"]);
    await upsertRows(client, "rental_charges", blueprint.rentalCharges, ["id"]);
    await upsertRows(client, "payments", blueprint.payments, ["id"]);
    await upsertRows(client, "documents", blueprint.documents, ["id"]);
    await upsertRows(client, "insights", blueprint.insights, ["id"]);
    await upsertRows(client, "work_items", blueprint.workItems, ["id"]);
    await upsertRows(client, "sync_devices", blueprint.syncDevices, ["id"]);
    await upsertRows(client, "sync_state", blueprint.syncState, ["device_id"]);
    await upsertRows(client, "events", blueprint.events, ["id"]);
    await upsertRows(client, "audit_log", blueprint.auditLogs, ["id"]);

    await client.query("COMMIT");
    console.log("Contour seed applied: realistic 8-row dataset loaded.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end().catch(() => undefined);
  }
}

void main();
