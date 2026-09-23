import type { PowerSyncDatabase } from "@powersync/web";

let activeDatabase: PowerSyncDatabase | null = null;

export function setLocalFirstDatabase(database: PowerSyncDatabase | null): void {
  activeDatabase = database;
}

export function getLocalFirstDatabase(): PowerSyncDatabase | null {
  return activeDatabase;
}

export async function readLocalFirstCache<T>(key: string, fallback: T): Promise<T> {
  if (!activeDatabase) return fallback;
  try {
    const row = await activeDatabase.getOptional<{ data_json: string }>(
      "SELECT data_json FROM offline_cache WHERE cache_key = ? LIMIT 1",
      [key],
    );
    return row?.data_json ? (JSON.parse(row.data_json) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeLocalFirstCache<T>(key: string, value: T): Promise<void> {
  if (!activeDatabase) return;
  try {
    await activeDatabase.execute(
      "INSERT OR REPLACE INTO offline_cache (id, cache_key, data_json, updated_at) VALUES (?, ?, ?, ?)",
      [`cache_${key}`, key, JSON.stringify(value), new Date().toISOString()],
    );
  } catch (error) {
    console.warn("Failed to persist local-first SQLite cache", error);
  }
}

export async function clearLocalFirstDatabase(): Promise<void> {
  if (!activeDatabase) return;
  await activeDatabase.disconnectAndClear({ clearLocal: true });
  activeDatabase = null;
}
