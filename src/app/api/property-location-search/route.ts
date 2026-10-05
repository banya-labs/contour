import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { checkRateLimit } from "@/lib/rate-limiter";
import { GeocodingError, searchPropertyLocation } from "@/lib/property-geocoding";

export const GET = createApiHandler({
  requirePermissions: ["properties.read"],
  querySchema: z.object({ q: z.string().trim().min(3).max(300) }),
  handler: async (_request, { organizationId, query }) => {
    if (!organizationId) return NextResponse.json({ error: "Agency context required" }, { status: 401 });
    const rate = await checkRateLimit(`property-geocoding:org:${organizationId}`, 30, 60);
    if (!rate.allowed) return NextResponse.json({ error: "Too many address searches. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.resetSeconds), "Cache-Control": "private, no-store" } });
    try {
      const results = await searchPropertyLocation(organizationId, query.q);
      return NextResponse.json({ results }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
      const known = error instanceof GeocodingError;
      return NextResponse.json({ error: known ? error.message : "Address search is unavailable. Use the map or enter coordinates." }, { status: known ? error.status : 502, headers: { "Cache-Control": "private, no-store", ...(known && error.status === 429 ? { "Retry-After": "1" } : {}) } });
    }
  },
});
