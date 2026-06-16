import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import { v4 as uuidv4 } from "uuid";

export interface Deal {
  id: string;
  title: string;
  stage: string;
  status: string;
  dealType: string;
  valueCents: number;
  currency: string;
  listingId?: string;
  clientId?: string;
  requestSummary?: string;
  preferredPropertyType?: string;
  preferredLocation?: string;
  preferredProvince?: string;
  preferredCityTown?: string;
  preferredBedrooms?: number;
  preferredBathrooms?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Client {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  location?: string;
  province?: string;
  cityTown?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operationType: "create" | "update" | "delete";
  payload: string;
  status: "pending" | "synced" | "failed";
  errorMessage?: string;
  createdAt: number;
  syncedAt?: number;
}

let db: Database.Database | null = null;

export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = path.join(app.getPath("userData"), "contour.db");
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create tables
  createTables(db);

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

function createTables(database: Database.Database) {
  // Deals table
  database.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      stage TEXT NOT NULL,
      status TEXT NOT NULL,
      deal_type TEXT NOT NULL,
      value_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      listing_id TEXT,
      client_id TEXT,
      request_summary TEXT,
      preferred_property_type TEXT,
      preferred_location TEXT,
      preferred_province TEXT,
      preferred_city_town TEXT,
      preferred_bedrooms INTEGER,
      preferred_bathrooms INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Clients table
  database.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Listings table
  database.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      province TEXT,
      city_town TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Sync queue table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      synced_at INTEGER
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
    CREATE INDEX IF NOT EXISTS idx_deals_updated_at ON deals(updated_at);
    CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON clients(updated_at);
    CREATE INDEX IF NOT EXISTS idx_listings_updated_at ON listings(updated_at);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);
  `);
}

// Deal operations
export function saveDeal(deal: Deal) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO deals (
      id, title, stage, status, deal_type, value_cents, currency,
      listing_id, client_id, request_summary, preferred_property_type,
      preferred_location, preferred_province, preferred_city_town,
      preferred_bedrooms, preferred_bathrooms, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    deal.id,
    deal.title,
    deal.stage,
    deal.status,
    deal.dealType,
    deal.valueCents,
    deal.currency,
    deal.listingId || null,
    deal.clientId || null,
    deal.requestSummary || null,
    deal.preferredPropertyType || null,
    deal.preferredLocation || null,
    deal.preferredProvince || null,
    deal.preferredCityTown || null,
    deal.preferredBedrooms || null,
    deal.preferredBathrooms || null,
    deal.createdAt,
    deal.updatedAt,
  );
}

export function getDeal(id: string): Deal | undefined {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM deals WHERE id = ?");
  const row = stmt.get(id) as any;
  return row ? mapDealRow(row) : undefined;
}

export function getAllDeals(): Deal[] {
  const db = getDatabase();
  const rows = db.prepare("SELECT * FROM deals ORDER BY updated_at DESC").all() as any[];
  return rows.map(mapDealRow);
}

function mapDealRow(row: any): Deal {
  return {
    id: row.id,
    title: row.title,
    stage: row.stage,
    status: row.status,
    dealType: row.deal_type,
    valueCents: row.value_cents,
    currency: row.currency,
    listingId: row.listing_id,
    clientId: row.client_id,
    requestSummary: row.request_summary,
    preferredPropertyType: row.preferred_property_type,
    preferredLocation: row.preferred_location,
    preferredProvince: row.preferred_province,
    preferredCityTown: row.preferred_city_town,
    preferredBedrooms: row.preferred_bedrooms,
    preferredBathrooms: row.preferred_bathrooms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Client operations
export function saveClient(client: Client) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO clients (
      id, full_name, email, phone, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    client.id,
    client.fullName,
    client.email || null,
    client.phone || null,
    client.status,
    client.createdAt,
    client.updatedAt,
  );
}

export function getClient(id: string): Client | undefined {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM clients WHERE id = ?");
  const row = stmt.get(id) as any;
  return row ? mapClientRow(row) : undefined;
}

export function getAllClients(): Client[] {
  const db = getDatabase();
  const rows = db.prepare("SELECT * FROM clients ORDER BY updated_at DESC").all() as any[];
  return rows.map(mapClientRow);
}

function mapClientRow(row: any): Client {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Listing operations
export function saveListing(listing: Listing) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO listings (
      id, title, description, location, province, city_town, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    listing.id,
    listing.title,
    listing.description || null,
    listing.location || null,
    listing.province || null,
    listing.cityTown || null,
    listing.createdAt,
    listing.updatedAt,
  );
}

export function getListing(id: string): Listing | undefined {
  const db = getDatabase();
  const stmt = db.prepare("SELECT * FROM listings WHERE id = ?");
  const row = stmt.get(id) as any;
  return row ? mapListingRow(row) : undefined;
}

export function getAllListings(): Listing[] {
  const db = getDatabase();
  const rows = db.prepare("SELECT * FROM listings ORDER BY updated_at DESC").all() as any[];
  return rows.map(mapListingRow);
}

function mapListingRow(row: any): Listing {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    province: row.province,
    cityTown: row.city_town,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Sync queue operations
export function queueSyncOperation(item: Omit<SyncQueueItem, "id" | "createdAt">) {
  const db = getDatabase();
  const id = uuidv4();
  const createdAt = Date.now();

  const stmt = db.prepare(`
    INSERT INTO sync_queue (
      id, entity_type, entity_id, operation_type, payload, status, error_message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    item.entityType,
    item.entityId,
    item.operationType,
    item.payload,
    item.status,
    item.errorMessage || null,
    createdAt,
  );

  return id;
}

export function getPendingSyncOperations(): SyncQueueItem[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM sync_queue 
    WHERE status IN ('pending', 'failed')
    ORDER BY created_at ASC
  `).all() as any[];
  
  return rows.map(mapSyncQueueRow);
}

export function markSyncOperationSynced(id: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE sync_queue 
    SET status = 'synced', synced_at = ?
    WHERE id = ?
  `);
  
  stmt.run(Date.now(), id);
}

export function markSyncOperationFailed(id: string, errorMessage: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE sync_queue 
    SET status = 'failed', error_message = ?
    WHERE id = ?
  `);
  
  stmt.run(errorMessage, id);
}

function mapSyncQueueRow(row: any): SyncQueueItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    operationType: row.operation_type,
    payload: row.payload,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  };
}

export function clearSyncedOperations() {
  const db = getDatabase();
  db.prepare("DELETE FROM sync_queue WHERE status = 'synced'").run();
}
