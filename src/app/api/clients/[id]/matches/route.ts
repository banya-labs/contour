import { createApiHandler } from "@/lib/api-handler";
import { getInquiryPropertyMatches, matchingQuerySchema } from "@/lib/matching/service";
import { matchingResponse, matchingScope } from "@/lib/matching/api";
export const GET = createApiHandler({ requirePermissions: ["leads.read"], querySchema: matchingQuerySchema, handler: async (_req, ctx) => matchingResponse(async () => {
  const data = await getInquiryPropertyMatches(matchingScope(ctx), String(ctx.params?.id || ""), ctx.query);
  return { ...data, matches: data.results };
}) });
