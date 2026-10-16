import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createContourDatabase } from "./local-first/database";
import { clearLocalFirstDatabase, getLocalFirstDatabase, readLocalFirstCache, setLocalFirstDatabase, writeLocalFirstCache } from "./local-first/cache";
import type { LocalFirstIdentity } from "./local-first/types";
import { authClient } from "./auth-client";
import { fetchAllPages } from "./fetch-pages";
import { clearMatchCache } from "./matching/result-cache";
import { filterActivePwaInquiries } from "./pwa-inquiries";
import type { FieldInquiry, FieldLease, FieldProperty, FieldTransaction, OfflineOutboxPayload } from "@/types/field-operations";

// Types
export interface OfflineOutboxItem {
  id: string;
  type: "INQUIRY" | "VISIT" | "PROPERTY";
  endpoint: string;
  payload: OfflineOutboxPayload;
  createdAt: string;
}

interface PowerSyncContextType {
  isOnline: boolean;
  loading: boolean;
  syncing: boolean;
  syncError: string | null;
  retrySync: () => Promise<void>;
  properties: FieldProperty[];
  leases: FieldLease[];
  clients: FieldInquiry[];
  sales: FieldTransaction[];
  outboxCount: number;
  toggleNetwork: () => void;
  syncData: () => Promise<void>;
  addToOutbox: (type: OfflineOutboxItem["type"], endpoint: string, payload: OfflineOutboxPayload) => Promise<void>;
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
    const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return null;
    audioCtx = new AudioContextConstructor();
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

interface CachedPayload<T = unknown> {
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
  clearMatchCache();
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
function readBrowserCache<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(`powersync_cache_${key}`);
    if (!raw) return defaultVal;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "timestamp" in parsed && "data" in parsed) {
      const payload = parsed as { timestamp?: number; data?: T };
      const age = Date.now() - (payload.timestamp ?? 0);
      if (age > CACHE_TTL_MS) {
        localStorage.removeItem(`powersync_cache_${key}`);
        return defaultVal;
      }
      return payload.data ?? defaultVal;
    }
    return parsed as T;
  } catch {
    return defaultVal;
  }
}

function writeBrowserCache(key: string, data: unknown) {
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

let databaseScope = "";
function omitFields<T extends object, K extends keyof T>(value: T, keys: readonly K[]): Omit<T, K> {
  const result = { ...value } as T;
  for (const key of keys) delete result[key];
  return result;
}
export function PowerSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const scope = session?.session.activeOrganizationId && session?.user.id ? `${session.session.activeOrganizationId}:${session.user.id}` : "";
  if (isPending || !scope) return null;
  return <ScopedPowerSyncProvider key={scope} scope={scope}>{children}</ScopedPowerSyncProvider>;
}
function ScopedPowerSyncProvider({ children, scope }: { children: React.ReactNode; scope: string }) {
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    const reset = (event: Event) => { if ((event as CustomEvent<{ scopes?: string[] }>).detail?.scopes?.includes("tenant-reset")) { active.current = false; setProperties([]); setClients([]); setLeases([]); setSales([]); setOutbox([]); } };
    window.addEventListener("contour:workspace-mutated", reset);
    return () => { active.current = false; window.removeEventListener("contour:workspace-mutated", reset); };
  }, []);
  const getLocalCache = useCallback(<T,>(key: string, fallback: T): T => readBrowserCache(`${scope}:${key}`, fallback), [scope]);
  const setLocalCache = useCallback((key: string, value: unknown) => { if (active.current) writeBrowserCache(`${scope}:${key}`, value); }, [scope]);

  const processingOutbox = useRef(false);
  const refreshing = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [outboxError, setOutboxError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [properties, setProperties] = useState<FieldProperty[]>(() => getLocalCache("properties", []));
  const [leases, setLeases] = useState<FieldLease[]>(() => getLocalCache("leases", []));
  const [clients, setClients] = useState<FieldInquiry[]>(() => getLocalCache("clients", []));
  const [sales, setSales] = useState<FieldTransaction[]>(() => getLocalCache("sales", []));
  const [outbox, setOutbox] = useState<OfflineOutboxItem[]>(() => getLocalCache("outbox", []));

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

  const syncData = useCallback(async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    if (refreshing.current || !active.current) return;
    refreshing.current = true;
    setLoading(true);
    setSyncError(null);
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
              if (`${claims.org_id}:${claims.sub}` !== scope || !active.current) return;
              if (databaseScope !== scope) {
                await clearLocalFirstDatabase();
                databaseScope = scope;
              }
              if (!active.current) return;
              const database = getLocalFirstDatabase() || createContourDatabase(identity);
              if (!getLocalFirstDatabase()) {
                await database.init();
                if (!active.current) { await database.disconnectAndClear({ clearLocal: true }); return; }
                setLocalFirstDatabase(database);
              }
              const [cachedProperties, cachedLeases, cachedClients, cachedSales, cachedOutbox] = await Promise.all([
                readLocalFirstCache<FieldProperty[]>(`${scope}:properties`, []),
                readLocalFirstCache<FieldLease[]>(`${scope}:leases`, []),
                readLocalFirstCache<FieldInquiry[]>(`${scope}:clients`, []),
                readLocalFirstCache<FieldTransaction[]>(`${scope}:sales`, []),
                readLocalFirstCache(`${scope}:outbox`, [] as OfflineOutboxItem[]),
              ]);
              if (!active.current) return;
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
        // The field app is an active inventory surface. Sold, rented, and under-offer
        // records remain available to their operational records, but must not be pitched.
        fetchAllPages<Record<string, unknown>>("/api/properties?status=AVAILABLE&includeMatching=false", "properties").then((properties) => ({ ok: true, json: async () => ({ success: true, properties }) })),
        fetch("/api/leases", { cache: "no-store" }),
        fetchAllPages<Record<string, unknown>>("/api/agent/inquiries", "clients").then((clients) => ({ ok: true, json: async () => ({ success: true, clients }) })),
        fetch("/api/sales", { cache: "no-store" }),
      ]);

      const [propsData, leasesData, clientsData, salesData] = await Promise.all([
        propsRes.ok ? propsRes.json().catch(() => ({ success: false, properties: [] })) : { success: false, properties: [] },
        leasesRes.ok ? leasesRes.json().catch(() => ({ success: false })) : { success: false },
        clientsRes.ok ? clientsRes.json().catch(() => ({ success: false, clients: [] })) : { success: false, clients: [] },
        salesRes.ok ? salesRes.json().catch(() => ({ success: false })) : { success: false },
      ]);

      if (!active.current) return;
      if (propsData.success && clientsData.success) {
        const properties = propsData.properties || [], clients = clientsData.clients || [];
        const batches = Math.max(Math.ceil(properties.length / 100), Math.ceil(clients.length / 100));
        for (let batch = 0; batch < batches; batch++) {
          const propertyIds = properties.slice(batch * 100, (batch + 1) * 100).map((p) => String(p.id)).join(",");
          const inquiryIds = clients.slice(batch * 100, (batch + 1) * 100).map((c) => String(c.id)).join(",");
          const response = await fetch(`/api/agent/matching/summaries?propertyIds=${encodeURIComponent(propertyIds)}&inquiryIds=${encodeURIComponent(inquiryIds)}`, { cache: "no-store" });
          type Summary = { id: string; qualifyingCount: number; topMatches: Record<string, unknown>[] };
          const summary: { success: boolean; error?: string; propertySummaries?: Summary[]; inquirySummaries?: Summary[] } = await response.json();
          if (!response.ok || !summary.success) throw new Error(summary.error || "Unable to refresh matching summaries");
          const ps = new Map((summary.propertySummaries || []).map((s) => [s.id, s] as const));
          const ins = new Map((summary.inquirySummaries || []).map((s) => [s.id, s] as const));
          for (const property of properties) { const s = ps.get(String(property.id)); if (s) { property.matchingInquiryCount = s.qualifyingCount; property.matchingInquiryPreview = s.topMatches; } }
          for (const client of clients) { const s = ins.get(String(client.id)); if (s) { client.matchingPropertyCount = s.qualifyingCount; client.matchingProperties = s.topMatches; } }
        }
      }

      if (!active.current) return;
      if (propsData.success && Array.isArray(propsData.properties)) {
        // Enforce POPIA compliance by stripping owner details on client
        const safeProperties = (propsData.properties as FieldProperty[]).filter((p) => p.status === "AVAILABLE").map((p) => {
          const publicFields = omitFields(p, ["ownerName", "ownerPhone", "ownerEmail", "ownerBankDetails", "titleDeedNumber"]);
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
        const safeLeases = ((leasesData.leases || []) as FieldLease[]).map((l) => {
          const safeFields = omitFields(l, ["tenantIdNumber", "tenantBankDetails", "depositBankReference"]);
          return {
            ...safeFields,
            tenantPhone: safeFields.tenantPhone
              ? `${safeFields.tenantPhone.slice(0, 4)}***${safeFields.tenantPhone.slice(-2)}`
              : "",
          };
        });
        setLeases(safeLeases);
        setLocalCache("leases", safeLeases);
      }

      if (clientsData.success) {
        // Normalize CRM client fields from server while preserving all fields
        const normalized = filterActivePwaInquiries((clientsData.clients || []) as FieldInquiry[]).map((c) => {
          const lockExpiresAt = c.exclusiveLockExpiresAt ? new Date(c.exclusiveLockExpiresAt) : null;
          const daysLeft = lockExpiresAt 
            ? Math.max(0, Math.ceil((lockExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : 30;

          return {
            ...c,
            id: c.id,
            name: c.clientName || c.name || "",
            clientName: c.clientName || c.name || "",
            phone: c.clientPhone || c.phone || "",
            clientPhone: c.clientPhone || c.phone || "",
            clientEmail: c.clientEmail || c.email || null,
            budget: c.budgetMax ? `${c.currency === "USD" ? "$" : "K"} ${Number(c.budgetMax).toLocaleString()}` : (c.budget || "No budget"),
            budgetMax: c.budgetMax,
            currency: c.currency || "ZMW",
            preferredArea: c.preferredSuburbs?.[0] || c.preferredArea || "",
            preferredSuburbs: c.preferredSuburbs || (c.preferredArea ? [c.preferredArea] : []),
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
            name: item.payload.clientName || "",
            clientName: item.payload.clientName || "",
            phone: item.payload.clientPhone || "",
            clientPhone: item.payload.clientPhone || "",
            budget: item.payload.budgetMax ? `${item.payload.currency === "USD" ? "$" : "K"} ${Number(item.payload.budgetMax).toLocaleString()}` : "No budget",
            budgetMax: item.payload.budgetMax,
            currency: item.payload.currency || "ZMW",
            preferredArea: item.payload.preferredSuburbs?.[0] || "",
            preferredSuburbs: item.payload.preferredSuburbs || [],
            lockExpiry: "30 Days (Syncing to Registry...)",
            assignedAgentId: item.payload.assignedAgentId,
            status: item.payload.status || "NEW_INQUIRY",
            lookingFor: item.payload.lookingFor || "FOR_SALE",
          }));

        // Exclude pending items already present in the server list by phone
        const uniquePending = currentPending.filter((p) => !normalized.some((n) => n.idempotencyKey === p.idempotencyKey));

        const mergedClients = [...uniquePending, ...normalized];
        setClients(mergedClients);
        setLocalCache("clients", mergedClients);
      }

      if (salesData.success) {
        // Strip internal accounting / escrow account identifiers from offline cache
        const safeSales = ((salesData.transactions || []) as FieldTransaction[]).map((t) =>
          omitFields(t, ["escrowAccountNumber", "bankReference", "internalNotes"])
        );
        setSales(safeSales);
        setLocalCache("sales", safeSales);
      }
    } catch (err) {
      if (active.current) setSyncError("Unable to refresh field data. Your saved local data remains available. Retry when connected.");
      console.error("PowerSync failed to background sync local SQLite WASM:", err);
    } finally {
      refreshing.current = false;
      if (active.current) setLoading(false);
    }
  }, [getLocalCache, isOnline, scope, setLocalCache]);

  const processOutbox = useCallback(async (queueOverride?: OfflineOutboxItem[]) => {
    const queue = queueOverride ? [...queueOverride] : [...outbox];
    if (!isOnline || !active.current || queue.length === 0 || processingOutbox.current) return;
    processingOutbox.current = true;
    setSyncing(true);
    setOutboxError(null);
    let successCount = 0;
    
    for (const item of queue) {
      if (!active.current) break;
      try {
        const res = await fetch(item.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          successCount++;
        } else {
          if (active.current) setOutboxError("A queued action could not be confirmed. It remains saved on this device. Retry sync or review the action.");
          console.error(`Outbox sync failed for item ${item.id}:`, data.error || data);
          break; // Stop queue processing if server errors occur
        }
      } catch (err) {
        if (active.current) setOutboxError("Sync connection failed. Queued actions remain saved on this device. Retry when connected.");
        console.error(`Outbox sync failed for item ${item.id}:`, err);
        break; // Stop queue processing if network errors occur
      }
    }

    processingOutbox.current = false;
    if (active.current) setSyncing(false);
    if (!active.current) return;
    if (successCount === 0) return;
    const successfulIds = new Set(queue.slice(0, successCount).map((item) => item.id));
    setOutbox((current) => { const remaining = current.filter((item) => !successfulIds.has(item.id)); setLocalCache("outbox", remaining); return remaining; });
    
    if (successCount > 0) {
      playSuccessTone();
      syncData(); // Reload synced data
    }
  }, [active, isOnline, outbox, setLocalCache, syncData]);

  useEffect(() => {
    const storedOnline = localStorage.getItem("powersync_online_state");
    if (storedOnline !== null) setIsOnline(storedOnline === "true");
    void syncData();
  }, [syncData]);

  useEffect(() => {
    if (isOnline && outbox.length > 0) void processOutbox();
  }, [isOnline, outbox.length, processOutbox]);

  const addToOutbox = async (type: OfflineOutboxItem["type"], endpoint: string, payload: OfflineOutboxPayload) => {
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
        title: typeof payload.title === "string" ? payload.title : "Untitled property",
        suburb: typeof payload.suburb === "string" ? payload.suburb : "",
        city: typeof payload.city === "string" ? payload.city : "",
        latitude: typeof payload.latitude === "number" ? payload.latitude : null,
        longitude: typeof payload.longitude === "number" ? payload.longitude : null,
        price: payload.price ?? payload.askingPrice ?? payload.rentalPrice ?? 0,
        askingPrice: payload.askingPrice as FieldProperty["askingPrice"],
        rentalPrice: payload.rentalPrice as FieldProperty["rentalPrice"],
        currency: payload.currency || "ZMW",
        listingType: payload.listingType || "FOR_SALE",
        propertyType: payload.propertyType || "STANDALONE_HOUSE",
        bedrooms: typeof payload.bedrooms === "number" ? payload.bedrooms : 4,
        bathrooms: typeof payload.bathrooms === "number" ? payload.bathrooms : 3,
        status: "AVAILABLE",
        photos: Array.isArray(payload.photos) ? payload.photos.filter((photo): photo is string => typeof photo === "string") : [],
        assignedAgentId: payload.assignedAgentId,
        mandateType: typeof payload.mandateType === "string" ? payload.mandateType : "SOLE_MANDATE",
      };
      setProperties((prev) => {
        const next = [optimisticProperty, ...prev];
        setLocalCache("properties", next);
        return next;
      });
    } else if (type === "INQUIRY") {
      const optimisticClient = {
        ...payload,
        id: newItem.id,
        name: payload.clientName || "",
        phone: payload.clientPhone || "",
        clientName: payload.clientName || "",
        clientPhone: payload.clientPhone || "",
        budget: payload.budgetMax ? `${payload.currency === "USD" ? "$" : "K"} ${Number(payload.budgetMax).toLocaleString()}` : "No budget",
        preferredArea: payload.preferredSuburbs?.[0] || "",
        preferredSuburbs: payload.preferredSuburbs || [],
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
      void processOutbox(updatedOutbox);
    } else {
      playNeutralTone(); // play neutral tone for successful offline queueing
    }
  };

  return (
    <PowerSyncContext.Provider
      value={{
        isOnline,
        loading,
        syncing,
        syncError: outboxError || syncError,
        retrySync: async () => { await processOutbox(); await syncData(); },
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
