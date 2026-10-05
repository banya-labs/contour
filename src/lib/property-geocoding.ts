import { createHash } from "node:crypto";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { hasValidCoordinates } from "@/lib/locations/map-coordinates";

const PUBLIC_PROVIDER = "https://nominatim.openstreetmap.org/search";
const coordinateString = z.string().trim().min(1).refine(value => Number.isFinite(Number(value)));
const resultSchema = z.array(z.object({ display_name: z.string().max(2000), lat: coordinateString, lon: coordinateString })).max(40);
type LocationResult = { name: string; lat: number; lng: number };
const resultCache = new Map<string, { data: LocationResult[]; expiresAt: number }>();
const MAX_CACHED_QUERIES = 1000;
export class GeocodingError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Explicit public-address lookup; provider requests never run on keystrokes. */
export async function searchPropertyLocation(organizationId: string, query: string) {
  const provider = new URL(process.env.PROPERTY_GEOCODER_URL || PUBLIC_PROVIDER);
  const key = createHash("sha256").update(`${provider.href}\n${query.toLowerCase()}`).digest("hex");
  const cacheKey = `${organizationId}:${key}`;
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  resultCache.delete(cacheKey);
  const results = await (async () => {
    // The public provider requires an application-wide limit, including across replicas.
    if (provider.hostname === "nominatim.openstreetmap.org") {
      if (!redis || redis.status !== "ready") throw new GeocodingError("Address search is temporarily unavailable. Select a point on the map or enter coordinates.", 503);
      try {
        const acquired = await redis.set("contour:property-geocoding:public-provider", "1", "PX", 1000, "NX");
        if (!acquired) throw new GeocodingError("Address search is busy. Wait a moment and search again.", 429);
      } catch (error) {
        if (error instanceof GeocodingError) throw error;
        throw new GeocodingError("Address search is temporarily unavailable. Select a point on the map or enter coordinates.", 503);
      }
    }
    provider.searchParams.set("q", query);
    provider.searchParams.set("format", "json");
    provider.searchParams.set("limit", "4");
    const response = await fetch(provider, { headers: { "User-Agent": "Contour/2.0 property-location-search (https://contour.banyalabs.com)", "Accept": "application/json" }, signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!response.ok) throw new GeocodingError("Address search is unavailable. Select a point on the map or enter coordinates.", 502);
    const rows = resultSchema.parse(await response.json());
    return rows.filter(row => hasValidCoordinates(Number(row.lat), Number(row.lon)))
      .slice(0, 4).map(row => ({ name: row.display_name, lat: Number(row.lat), lng: Number(row.lon) }));
  })();
  for (const [storedKey, entry] of resultCache) if (entry.expiresAt <= Date.now()) resultCache.delete(storedKey);
  if (resultCache.size >= MAX_CACHED_QUERIES) resultCache.delete(resultCache.keys().next().value!);
  resultCache.set(cacheKey, { data: results, expiresAt: Date.now() + 86400000 });
  return results;
}
