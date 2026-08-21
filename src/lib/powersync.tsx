import React, { createContext, useContext, useState, useEffect } from "react";

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

// Simulated IndexedDB storage helper
function getLocalCache(key: string, defaultVal: any) {
  if (typeof window === "undefined") return defaultVal;
  const cached = localStorage.getItem(`powersync_cache_${key}`);
  return cached ? JSON.parse(cached) : defaultVal;
}

function setLocalCache(key: string, data: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`powersync_cache_${key}`, JSON.stringify(data));
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
      // Get auth token first to check access validity
      const tokenRes = await fetch("/api/powersync/token");
      const tokenData = await tokenRes.json();
      if (!tokenData.success) {
        throw new Error("PowerSync token authentication failed.");
      }

      // Fetch dynamic datasets in parallel
      const [propsRes, leasesRes, clientsRes, salesRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/leases"),
        fetch("/api/clients"),
        fetch("/api/sales")
      ]);

      const [propsData, leasesData, clientsData, salesData] = await Promise.all([
        propsRes.json(),
        leasesRes.json(),
        clientsRes.json(),
        salesRes.json()
      ]);

      if (propsData.success) {
        // Enforce POPIA compliance by stripping owner details on client
        const safeProperties = propsData.properties.map((p: any) => {
          const { ownerName, ownerPhone, ownerEmail, ownerBankDetails, titleDeedNumber, ...publicFields } = p;
          return publicFields;
        });
        setProperties(safeProperties);
        setLocalCache("properties", safeProperties);
      }

      if (leasesData.success) {
        setLeases(leasesData.leases);
        setLocalCache("leases", leasesData.leases);
      }

      if (clientsData.success) {
        // Normalize CRM client fields
        const normalized = clientsData.clients.map((c: any) => {
          const lockExpiresAt = c.exclusiveLockExpiresAt ? new Date(c.exclusiveLockExpiresAt) : null;
          const daysLeft = lockExpiresAt 
            ? Math.max(0, Math.ceil((lockExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : 30;

          return {
            id: c.id,
            name: c.clientName,
            phone: c.clientPhone,
            budget: c.budgetMax ? `${c.currency === "USD" ? "$" : "K"} ${Number(c.budgetMax).toLocaleString()}` : "No budget",
            preferredArea: c.preferredSuburbs?.[0] || "Lusaka",
            lockExpiry: `${daysLeft} Days (Anti-Poaching Active)`,
          };
        });
        setClients(normalized);
        setLocalCache("clients", normalized);
      }

      if (salesData.success) {
        setSales(salesData.transactions);
        setLocalCache("sales", salesData.transactions);
      }
    } catch (err) {
      console.error("PowerSync failed to background sync local SQLite WASM:", err);
    } finally {
      setLoading(false);
    }
  };

  const processOutbox = async () => {
    const queue = [...outbox];
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
        }
      } catch (err) {
        console.error(`Outbox sync failed for item ${item.id}:`, err);
        break; // Stop queue processing if server errors occur
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

    // Optimistically write to local state to represent instant response time
    if (type === "INQUIRY") {
      const optimisticClient = {
        id: newItem.id,
        name: payload.clientName,
        phone: payload.clientPhone,
        budget: payload.budgetMax ? `${payload.currency === "USD" ? "$" : "K"} ${payload.budgetMax.toLocaleString()}` : "No budget",
        preferredArea: payload.preferredSuburbs?.[0] || "Lusaka",
        lockExpiry: "30 Days (Optimistic Offline Lock)",
      };
      setClients(prev => [optimisticClient, ...prev]);
    }

    if (isOnline) {
      processOutbox();
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
