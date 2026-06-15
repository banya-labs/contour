import { NextResponse } from "next/server";
import {
  buildLocationParts,
  parseBoundingBox,
  type LocationSearchResult,
  type LocationGeometry,
} from "../../../lib/property-location";

const searchCache = new Map<string, { expiresAt: number; data: LocationSearchResult[] }>();

function sanitizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function mapSearchResult(row: Record<string, unknown>): LocationSearchResult {
  const latitude = Number(row.lat);
  const longitude = Number(row.lon);
  const address = (row.address ?? {}) as Record<string, string | undefined>;
  const { province, cityTown, locationArea, displayName } = buildLocationParts(address, String(row.display_name ?? ""));
  const boundingBox = parseBoundingBox(row.boundingbox);
  const geometry = row.geojson && typeof row.geojson === "object" ? (row.geojson as LocationGeometry) : null;

  return {
    placeId: String(row.place_id ?? `${latitude}:${longitude}`),
    displayName: displayName || String(row.display_name ?? ""),
    latitude,
    longitude,
    province,
    cityTown,
    locationArea,
    boundingBox,
    geometry,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = sanitizeQuery(url.searchParams.get("q") ?? "");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const cached = searchCache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ results: cached.data });
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=zm&polygon_geojson=1&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "Contour Analytics Engine",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to search location." }, { status: 502 });
  }

  const payload = (await response.json()) as Record<string, unknown>[];
  const results = payload.map(mapSearchResult);

  searchCache.set(query, { expiresAt: Date.now() + 5 * 60 * 1000, data: results });

  return NextResponse.json({ results });
}
