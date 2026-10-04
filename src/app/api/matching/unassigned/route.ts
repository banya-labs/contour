import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";
import { getPropertyInquiryMatches, getUnassignedBestMatches, matchingQuerySchema } from "@/lib/matching/service";
import { matchingResponse, matchingScope } from "@/lib/matching/api";
export const GET = createApiHandler({ requirePermissions: ["leads.read"], querySchema: matchingQuerySchema.extend({ propertyId: z.string().optional() }), handler: async (_req, ctx) => matchingResponse(async () => {
  const data = ctx.query.propertyId ? await getPropertyInquiryMatches(matchingScope(ctx), ctx.query.propertyId, ctx.query) : await getUnassignedBestMatches(matchingScope(ctx), ctx.query);
  return { ...data, matches: data.results };
}) });
