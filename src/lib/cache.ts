import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Banya Labs Smart Caching & Invalidation Engine (Layer 10 Standard)
 *
 * Core Doctrine: "Smart Caching Beats Stale Data"
 * - Short TTLs (default 60s for live operational data)
 * - Tag-based multi-key eviction on every mutation (write/update/delete)
 * - Tenant namespace isolation (tenantId:tag:key)
 * - Zero stale client state on critical real estate operations
 */

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  tags: string[];
  tenantId: string;
};

class SmartCacheManager {
  private store = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>(); // "tenantId:tag" -> Set of cacheKeys

  private buildKey(tenantId: string, tag: string, key: string): string {
    return `banya:${tenantId}:${tag}:${key}`;
  }

  private buildTagIndexKey(tenantId: string, tag: string): string {
    return `${tenantId}:${tag}`;
  }

  /**
   * Smart Cache-Aside: Reads from cache if fresh, otherwise executes fetcher, caches result, and indexes tags.
   */
  async getOrSet<T>(
    tenantId: string,
    tag: string,
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60, // Default 60s for high-accuracy operational data
    extraTags: string[] = []
  ): Promise<T> {
    const cacheKey = this.buildKey(tenantId, tag, key);
    const now = Date.now();

    const existing = this.store.get(cacheKey);
    if (existing && existing.expiresAt > now) {
      return existing.data as T;
    }

    // Cache miss or expired: execute fresh database query
    const freshData = await fetcher();

    const allTags = [tag, ...extraTags];
    this.store.set(cacheKey, {
      data: freshData,
      expiresAt: now + ttlSeconds * 1000,
      tags: allTags,
      tenantId,
    });

    // Index tags for O(1) bulk invalidation
    for (const t of allTags) {
      const tagKey = this.buildTagIndexKey(tenantId, t);
      if (!this.tagIndex.has(tagKey)) {
        this.tagIndex.set(tagKey, new Set());
      }
      this.tagIndex.get(tagKey)!.add(cacheKey);
    }

    return freshData;
  }

  /**
   * Event-Driven Smart Invalidation: Evicts all cache entries belonging to a tenant tag.
   * Call this immediately on any database write, update, or deletion!
   */
  invalidateTag(tenantId: string, tag: string, pathUrlToRevalidate?: string) {
    const tagKey = this.buildTagIndexKey(tenantId, tag);
    const keysToEvict = this.tagIndex.get(tagKey);

    if (keysToEvict) {
      for (const cacheKey of keysToEvict) {
        this.store.delete(cacheKey);
      }
      this.tagIndex.delete(tagKey);
    }

    // Revalidate Next.js App Router cache tags if in server context
    try {
      revalidateTag(tag);
      if (pathUrlToRevalidate) {
        revalidatePath(pathUrlToRevalidate);
      }
    } catch {
      // Graceful fallback if invoked outside Next.js request lifecycle
    }
  }

  /**
   * Evicts all cache entries for an entire tenant workspace (e.g. on role change or workspace reset)
   */
  invalidateTenant(tenantId: string) {
    for (const [key, entry] of this.store.entries()) {
      if (entry.tenantId === tenantId) {
        this.store.delete(key);
      }
    }
    for (const tagKey of this.tagIndex.keys()) {
      if (tagKey.startsWith(`${tenantId}:`)) {
        this.tagIndex.delete(tagKey);
      }
    }
  }

  /**
   * Diagnostic statistics
   */
  getStats() {
    return {
      activeEntries: this.store.size,
      activeTags: this.tagIndex.size,
    };
  }
}

// Global Singleton
export const smartCache = new SmartCacheManager();

/**
 * Standard Cache Tags across Banya Labs
 */
export const CACHE_TAGS = {
  PROPERTIES: "properties",
  MAP_PINS: "map_pins",
  LEASES: "leases",
  SALES: "sales",
  DOCUMENTS: "documents",
  COMMISSIONS: "commissions",
  CLIENTS: "clients",
  DAILY_QUEUE: "daily_queue",
  METRICS: "dashboard_metrics",
} as const;
