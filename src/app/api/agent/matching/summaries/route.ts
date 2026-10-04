import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";
import { getMatchingSummaries } from "@/lib/matching/service";
import { matchingResponse, matchingScope } from "@/lib/matching/api";
const ids = z.string().default("").transform((value) => value.split(",").filter(Boolean)).refine((items) => items.length <= 100 && items.every((id) => id.length <= 100), "At most 100 IDs are allowed");
export const GET = createApiHandler({ requirePermissions: ["pwa.inquiries.read"], querySchema: z.object({ propertyIds: ids, inquiryIds: ids }), handler: async (_req, ctx) => matchingResponse(() => getMatchingSummaries(matchingScope(ctx), ctx.query.propertyIds, ctx.query.inquiryIds)) });
