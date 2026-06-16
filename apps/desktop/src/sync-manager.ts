import { v4 as uuidv4 } from "uuid";
import {
  saveDeal,
  saveClient,
  saveListing,
  getPendingSyncOperations,
  markSyncOperationSynced,
  markSyncOperationFailed,
  queueSyncOperation,
  getAllDeals,
  getAllClients,
  getAllListings,
  type Deal,
  type Client,
  type Listing,
} from "./database";

export interface SyncConfig {
  apiUrl: string;
  deviceId: string;
  userId: string;
  appVersion: string;
  onSyncStart?: () => void;
  onSyncProgress?: (message: string) => void;
  onSyncComplete?: (result: SyncResult) => void;
  onSyncError?: (error: Error) => void;
  onOfflineStatusChange?: (offline: boolean) => void;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

let isOnline = true;
let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

export function initializeSync(config: SyncConfig) {
  // Register device on first sync
  registerDevice(config);

  // Set up interval-based syncing (every 30 seconds when online)
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    if (isOnline && !isSyncing) {
      performSync(config).catch((error) => {
        console.error("[v0] Sync error:", error);
        config.onSyncError?.(error);
      });
    }
  }, 30000);

  // Set up network status listener
  setupNetworkStatusListener(config);
}

export function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export function isCurrentlyOnline(): boolean {
  return isOnline;
}

function setupNetworkStatusListener(config: SyncConfig) {
  // Listen to online/offline events
  const handleOnline = () => {
    isOnline = true;
    config.onOfflineStatusChange?.(false);
    console.log("[v0] App is online");
    // Try to sync immediately when coming back online
    performSync(config).catch((error) => {
      console.error("[v0] Sync after coming online failed:", error);
    });
  };

  const handleOffline = () => {
    isOnline = false;
    config.onOfflineStatusChange?.(true);
    console.log("[v0] App is offline");
  };

  // Note: In Electron, we would use native APIs to detect online status
  // This is a simplified version. In production, use electron-better-ipc or similar
  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }
}

async function registerDevice(config: SyncConfig): Promise<void> {
  try {
    const response = await fetch(`${config.apiUrl}/api/sync/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: config.userId,
        deviceId: config.deviceId,
        deviceType: "desktop",
        appVersion: config.appVersion,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register device: ${response.statusText}`);
    }

    console.log("[v0] Device registered successfully");
  } catch (error) {
    console.error("[v0] Device registration failed:", error);
    throw error;
  }
}

export async function performSync(config: SyncConfig): Promise<SyncResult> {
  if (isSyncing) {
    return { success: false, synced: 0, failed: 0, errors: ["Sync already in progress"] };
  }

  isSyncing = true;
  config.onSyncStart?.();

  try {
    config.onSyncProgress?.("Pulling remote data...");
    await pullRemoteData(config);

    config.onSyncProgress?.("Pushing local changes...");
    const pushResult = await pushLocalChanges(config);

    config.onSyncProgress?.("Sync complete");
    config.onSyncComplete?.(pushResult);

    return pushResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    config.onSyncError?.(error instanceof Error ? error : new Error(errorMessage));
    return {
      success: false,
      synced: 0,
      failed: 0,
      errors: [errorMessage],
    };
  } finally {
    isSyncing = false;
  }
}

async function pullRemoteData(config: SyncConfig): Promise<void> {
  try {
    const response = await fetch(`${config.apiUrl}/api/sync/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: config.deviceId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pull failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Save deals
    if (data.data?.deals) {
      for (const deal of data.data.deals) {
        saveDeal({
          id: deal.id,
          title: deal.title,
          stage: deal.stage,
          status: deal.status,
          dealType: deal.dealType,
          valueCents: deal.valueCents,
          currency: deal.currency,
          listingId: deal.listingId,
          clientId: deal.clientId,
          requestSummary: deal.requestSummary,
          preferredPropertyType: deal.preferredPropertyType,
          preferredLocation: deal.preferredLocation,
          preferredProvince: deal.preferredProvince,
          preferredCityTown: deal.preferredCityTown,
          preferredBedrooms: deal.preferredBedrooms,
          preferredBathrooms: deal.preferredBathrooms,
          createdAt: new Date(deal.createdAt).getTime(),
          updatedAt: new Date(deal.updatedAt).getTime(),
        });
      }
    }

    // Save clients
    if (data.data?.clients) {
      for (const client of data.data.clients) {
        saveClient({
          id: client.id,
          fullName: client.fullName,
          email: client.email,
          phone: client.phone,
          status: client.status,
          createdAt: new Date(client.createdAt).getTime(),
          updatedAt: new Date(client.updatedAt).getTime(),
        });
      }
    }

    // Save listings
    if (data.data?.listings) {
      for (const listing of data.data.listings) {
        saveListing({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          location: listing.location,
          province: listing.province,
          cityTown: listing.cityTown,
          createdAt: new Date(listing.createdAt).getTime(),
          updatedAt: new Date(listing.updatedAt).getTime(),
        });
      }
    }

    console.log("[v0] Successfully pulled remote data");
  } catch (error) {
    console.error("[v0] Pull failed:", error);
    throw error;
  }
}

async function pushLocalChanges(config: SyncConfig): Promise<SyncResult> {
  try {
    const operations = getPendingSyncOperations();

    if (operations.length === 0) {
      return { success: true, synced: 0, failed: 0, errors: [] };
    }

    const response = await fetch(`${config.apiUrl}/api/sync/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: config.deviceId,
        operations: operations.map((op) => ({
          id: op.id,
          entityType: op.entityType,
          entityId: op.entityId,
          operationType: op.operationType,
          payload: JSON.parse(op.payload),
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Update sync queue based on results
    if (result.results) {
      for (const r of result.results) {
        if (r.success) {
          markSyncOperationSynced(r.operationId);
        } else {
          markSyncOperationFailed(r.operationId, r.error || "Unknown error");
        }
      }
    }

    console.log(`[v0] Successfully pushed changes: ${result.synced} synced, ${result.failed} failed`);

    return {
      success: result.failed === 0,
      synced: result.synced,
      failed: result.failed,
      errors: result.failed > 0 ? result.results.filter((r: any) => !r.success).map((r: any) => r.error) : [],
    };
  } catch (error) {
    console.error("[v0] Push failed:", error);
    throw error;
  }
}

export function trackLocalChange(
  entityType: string,
  entityId: string,
  operationType: "create" | "update" | "delete",
  payload: any,
) {
  queueSyncOperation({
    entityType,
    entityId,
    operationType,
    payload: JSON.stringify(payload),
    status: "pending",
  });

  console.log(`[v0] Queued ${operationType} operation for ${entityType} ${entityId}`);
}
