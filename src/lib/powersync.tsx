import React, { createContext, useContext, useState, useEffect } from "react";
import { createContourDatabase } from "./local-first/database";
import { clearLocalFirstDatabase, getLocalFirstDatabase, readLocalFirstCache, setLocalFirstDatabase, writeLocalFirstCache } from "./local-first/cache";
import type { LocalFirstIdentity } from "./local-first/types";

// Types
export interface OfflineOutboxItem {
  id: string;
  type: "INQUIRY" | "VISIT" | "PROPERTY";
  endpoint: string;
  payload: any;
  createdAt: string;
}

interface PowerSyncContextType {
  isOnline: boolean;
  loading: boolean;
  properties: any[];
  leases: any[];
  clients: any[];
  sales: any[];
  outboxCount: number;
  toggleNetwork: () => void;
  syncData: () => Promise<void>;
  addToOutbox: (type: OfflineOutboxItem["type"], endpoint: string, payload: any) => Promise<void>;
  playSuccessTone: () => void;
  playNeutralTone: () => void;
  playErrorTone: () => void;
}

const PowerSyncContext = createContext<PowerSyncContextType | undefined>(undefined);

// Auditory Feedback standard (Web Audio API)
let audioCtx: AudioContext | null = null;
function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playSuccessTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // High double chirp confirmation
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.setValueAtTime(1760, now + 0.1);
  
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.15);
}

export function playNeutralTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Standard neutral blip
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, now);
  
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.08);
}

export function playErrorTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Low frequency buzz / warning drop
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(110, now + 0.25);
  
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.25);
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour TTL for offline client caches

interface CachedPayload<T = any> {
  version: number;
  timestamp: number;
  data: T;
}

/**
 * Purges all PowerSync offline data from browser storage.
 * Called automatically upon sign-out to prevent sensitive real estate records
 * from remaining on shared field kiosks or mobile tablets.
 */
export function clearLocalOfflineCache() {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("powersync_cache_") || key.startsWith("contour_local_db_key_") || key === "powersync_online_state")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    void clearLocalFirstDatabase().catch((error) => console.warn("Failed to clear local-first database", error));
  } catch (err) {
    console.error("Failed to clear local offline cache:", err);
  }
}

// Simulated IndexedDB storage helper with 24h TTL eviction
function getLocalCache(key: string, defaultVal: any) {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(`powersync_cache_${key}`);
    if (!raw) return defaultVal;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "timestamp" in parsed && "data" in parsed) {
      const age = Date.now() - parsed.timestamp;
      if (age > CACHE_TTL_MS) {
        localStorage.removeItem(`powersync_cache_${key}`);
        return defaultVal;
      }
      return parsed.data;
    }
    return parsed;
  } catch {
    return defaultVal;
  }
}

function setLocalCache(key: string, data: any) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedPayload = {
      version: 1,
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`powersync_cache_${key}`, JSON.stringify(payload));
    void writeLocalFirstCache(key, data);
  } catch (err) {
    console.warn("Failed to update local cache:", err);
  }
}

export function PowerSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [properties, setProperties] = useState<any[]>(() => getLocalCache("properties", []));
  const [leases, setLeases] = useState<any[]>(() => getLocalCache("leases", []));
  const [clients, setClients] = useState<any[]>(() => getLocalCache("clients", []));
  const [sales, setSales] = useState<any[]>(() => getLocalCache("sales", []));
  const [outbox, setOutbox] = useState<OfflineOutboxItem[]>(() => getLocalCache("outbox", []));

  useEffect(() => {
    // Initial load
    const storedOnline = localStorage.getItem("powersync_online_state");
    if (storedOnline !== null) {
      setIsOnline(storedOnline === "true");
    }
    syncData();
  }, []);

  // Outbox effect: try to sync when transitioning to online
  useEffect(() => {
    if (isOnline && outbox.length > 0) {
      processOutbox();
    }
  }, [isOnline, outbox]);

  const toggleNetwork = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    localStorage.setItem("powersync_online_state", String(nextState));
    
    if (nextState) {
      playSuccessTone();
    } else {
      playNeutralTone();
    }
  };

  const syncData = async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      // 1. Attempt auth token for PowerSync streaming (non-blocking for REST datasets)
      try {
        const tokenRes = await fetch("/api/powersync/token");
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json().catch(() => null);
          if (tokenData?.success) {
            const [, encodedPayload] = String(tokenData.token).split(".");
            const claims = encodedPayload ? JSON.parse(atob(encodedPayload)) as { sub?: string; org_id?: string; role?: string; exp?: number } : null;
            if (claims?.sub && claims.org_id && claims.exp) {
              const databaseKey = getOrCreateDatabaseKey(claims.org_id, claims.sub);
              const identity: LocalFirstIdentity = {
                userId: claims.sub,
                organizationId: claims.org_id,
                role: claims.role || "FIELD_AGENT",
                databaseKey,
                expiresAt: new Date(claims.exp * 1000).toISOString(),
              };
              const database = getLocalFirstDatabase() || createContourDatabase(identity);
              if (!getLocalFirstDatabase()) {
                await database.init();
                setLocalFirstDatabase(database);
              }
              const [cachedProperties, cachedLeases, cachedClients, cachedSales, cachedOutbox] = await Promise.all([
                readLocalFirstCache("properties", [] as any[]),
                readLocalFirstCache("leases", [] as any[]),
                readLocalFirstCache("clients", [] as any[]),
                readLocalFirstCache("sales", [] as any[]),
                readLocalFirstCache("outbox", [] as OfflineOutboxItem[]),
              ]);
              setProperties(cachedProperties);
              setLeases(cachedLeases);
              setClients(cachedClients);
              setSales(cachedSales);
              setOutbox(cachedOutbox);
            }
          }
        }
      } catch (tokenErr) {
        console.warn("PowerSync background stream token deferred:", tokenErr);
      }

      // 2. Fetch dynamic agency datasets in parallel with cache-busting
      const [propsRes, leasesRes, clientsRes, salesRes] = await Promise.all([
        fetch("/api/properties?status=ALL&limit=500", { cache: "no-store" }),
        fetch("/api/leases", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
        fetch("/api/sales", { cache: "no-store" }),
      ]);

      const [propsData, leasesData, clientsData, salesData] = await Promise.all([
        propsRes.ok ? propsRes.json().catch(() => ({ success: false })) : { success: false },
        leasesRes.ok ? leasesRes.json().catch(() => ({ success: false })) : { success: false },
        clientsRes.ok ? clientsRes.json().catch(() => ({ success: false })) : { success: false },
        salesRes.ok ? salesRes.json().catch(() => ({ success: false })) : { success: false },
      ]);

      if (propsData.success && Array.isArray(propsData.properties)) {
        // Enforce POPIA compliance by stripping owner details on client
        const safeProperties = propsData.properties.map((p: any) => {
          const { ownerName, ownerPhone, ownerEmail, ownerBankDetails, titleDeedNumber, ...publicFields } = p;
          return {
            ...publicFields,
            price: Number(p.price || p.askingPrice || p.rentalPrice || 0),
            askingPrice: p.askingPrice || p.price || null,
            rentalPrice: p.rentalPrice || (p.listingType === "FOR_RENT" ? p.price : null),
          };
        });
        setProperties(safeProperties);
        setLocalCache("properties", safeProperties);
      }

      if (leasesData.success) {
        // Strip sensitive PII (tenant NRC/passport ID, bank accounts) from offline client cache
        const safeLeases = (leasesData.leases || []).map((l: any) => {
          const { tenantIdNumber, tenantBankDetails, depositBankReference, ...safeFields } = l;
          return {
            ...safeFields,
            tenantPhone: safeFields.tenantPhone
              ? `${safeFields.tenantPhone.slice(0, 4)}***${safeFields.tenantPhone.slice(-2)}`
              : undefined,
          };
        });
        setLeases(safeLeases);
        setLocalCache("leases", safeLeases);
      }

      if (clientsData.success) {
        // Normalize CRM client fields from server while preserving all fields
        const normalized = (clientsData.clients || []).map((c: any) => {
          const lockExpiresAt = c.exclusiveLockExpiresAt ? new Date(c.exclusiveLockExpiresAt) : null;
          const daysLeft = lockExpiresAt 
            ? Math.max(0, Math.ceil((lockExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : 30;

          return {
            ...c,
            id: c.id,
            name: c.clientName || c.name,
            clientName: c.clientName || c.name,
            phone: c.clientPhone || c.phone,
            clientPhone: c.clientPhone || c.phone,
            clientEmail: c.clientEmail || c.email || null,
            budget: c.budgetMax ? `${c.currency === "USD" ? "$" : "K"} ${Number(c.budgetMax).toLocaleString()}` : (c.budget || "No budget"),
            budgetMax: c.budgetMax,
            currency: c.currency || "ZMW",
            preferredArea: c.preferredSuburbs?.[0] || c.preferredArea || "Lusaka",
            preferredSuburbs: c.preferredSuburbs || (c.preferredArea ? [c.preferredArea] : ["Lusaka"]),
            lockExpiry: `${daysLeft} Days (Anti-Poaching Active)`,
            assignedAgentId: c.assignedAgentId || c.assignedAgent?.id,
            assignedAgent: c.assignedAgent,
            propertyId: c.propertyId || c.property?.id,
            property: c.property,
            notes: c.notes || "",
            status: c.status || "NEW_INQUIRY",
            lookingFor: c.lookingFor || "FOR_SALE",
          };
        });

        // Preserve any pending outbox clients so they never vanish before server confirmation
        const currentPending = (getLocalCache("outbox", []) as OfflineOutboxItem[])
          .filter((item) => item.type === "INQUIRY" && item.payload?.clientPhone)
          .map((item) => ({
            ...item.payload,
            id: item.id,
            name: item.payload.clientName,
            clientName: item.payload.clientName,
            phone: item.payload.clientPhone,
            clientPhone: item.payload.clientPhone,
            budget: item.payload.budgetMax ? `${item.payload.currency === "USD" ? "$" : "K"} ${Number(item.payload.budgetMax).toLocaleString()}` : "No budget",
            budgetMax: item.payload.budgetMax,
            currency: item.payload.currency || "ZMW",
            preferredArea: item.payload.preferredSuburbs?.[0] || "Lusaka",
            preferredSuburbs: item.payload.preferredSuburbs || ["Lusaka"],
            lockExpiry: "30 Days (Syncing to Registry...)",
            assignedAgentId: item.payload.assignedAgentId,
            status: item.payload.status || "NEW_INQUIRY",
            lookingFor: item.payload.lookingFor || "FOR_SALE",
          }));

        // Exclude pending items already present in the server list by phone
        const uniquePending = currentPending.filter(
          (p) => !normalized.some((n: any) => n.phone?.replace(/\D/g, "") === p.phone?.replace(/\D/g, ""))
        );

        const mergedClients = [...uniquePending, ...normalized];
        setClients(mergedClients);
        setLocalCache("clients", mergedClients);
      }

      if (salesData.success) {
        // Strip internal accounting / escrow account identifiers from offline cache
        const safeSales = (salesData.transactions || []).map((t: any) => {
          const { escrowAccountNumber, bankReference, internalNotes, ...safeFields } = t;
          return safeFields;
        });
        setSales(safeSales);
        setLocalCache("sales", safeSales);
      }
    } catch (err) {
      console.error("PowerSync failed to background sync local SQLite WASM:", err);
    } finally {
      setLoading(false);
    }
  };

  const processOutbox = async (queueOverride?: OfflineOutboxItem[]) => {
    const queue = queueOverride ? [...queueOverride] : [...outbox];
    if (queue.length === 0) return;
    let successCount = 0;
    
    for (const item of queue) {
      try {
        const res = await fetch(item.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          console.error(`Outbox sync failed for item ${item.id}:`, data.error || data);
          break; // Stop queue processing if server errors occur
        }
      } catch (err) {
        console.error(`Outbox sync failed for item ${item.id}:`, err);
        break; // Stop queue processing if network errors occur
      }
    }

    const remaining = queue.slice(successCount);
    setOutbox(remaining);
    setLocalCache("outbox", remaining);
    
    if (successCount > 0) {
      playSuccessTone();
      syncData(); // Reload synced data
    }
  };

  const addToOutbox = async (type: OfflineOutboxItem["type"], endpoint: string, payload: any) => {
    const newItem: OfflineOutboxItem = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      endpoint,
      payload,
      createdAt: new Date().toISOString(),
    };

    // Update local state and IndexedDB mock cache
    const updatedOutbox = [...outbox, newItem];
    setOutbox(updatedOutbox);
    setLocalCache("outbox", updatedOutbox);

    // Optimistically write to local state and persist immediately to offline cache
    if (type === "PROPERTY") {
      const optimisticProperty = {
        id: newItem.id,
        title: payload.title,
        suburb: payload.suburb,
        price: payload.price || payload.askingPrice || payload.rentalPrice || 0,
        askingPrice: payload.askingPrice,
        rentalPrice: payload.rentalPrice,
        currency: payload.currency || "ZMW",
        listingType: payload.listingType || "FOR_SALE",
        propertyType: payload.propertyType || "STANDALONE_HOUSE",
        bedrooms: payload.bedrooms || 4,
        bathrooms: payload.bathrooms || 3,
        status: "AVAILABLE",
        photos: payload.photos || [],
        assignedAgentId: payload.assignedAgentId,
        mandateType: payload.mandateType || "SOLE_MANDATE",
      };
      setProperties((prev) => {
        const next = [optimisticProperty, ...prev];
        setLocalCache("properties", next);
        return next;
      });
    } else if (type === "INQUIRY") {
      const optimisticClient = {
        id: newItem.id,
        name: payload.clientName,
        phone: payload.clientPhone,
        budget: payload.budgetMax ? `${payload.currency === "USD" ? "$" : "K"} ${Number(payload.budgetMax).toLocaleString()}` : "No budget",
        preferredArea: payload.preferredSuburbs?.[0] || "Lusaka",
        lockExpiry: "30 Days (Pending Sync to Registry)",
        assignedAgentId: payload.assignedAgentId,
      };
      setClients((prev) => {
        const next = [optimisticClient, ...prev];
        setLocalCache("clients", next);
        return next;
      });
    }

    if (isOnline) {
      processOutbox(updatedOutbox);
    } else {
      playNeutralTone(); // play neutral tone for successful offline queueing
    }
  };

  return (
    <PowerSyncContext.Provider
      value={{
        isOnline,
        loading,
        properties,
        leases,
        clients,
        sales,
        outboxCount: outbox.length,
        toggleNetwork,
        syncData,
        addToOutbox,
        playSuccessTone,
        playNeutralTone,
        playErrorTone,
      }}
    >
      {children}
    </PowerSyncContext.Provider>
  );
}

export function usePowerSync() {
  const context = useContext(PowerSyncContext);
  if (context === undefined) {
    throw new Error("usePowerSync must be used within a PowerSyncProvider");
  }
  return context;
}

function getOrCreateDatabaseKey(organizationId: string, userId: string): string {
  const keyName = `contour_local_db_key_${organizationId}_${userId}`;
  const existing = localStorage.getItem(keyName);
  if (existing) return existing;
  const key = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  localStorage.setItem(keyName, key);
  return key;
}
