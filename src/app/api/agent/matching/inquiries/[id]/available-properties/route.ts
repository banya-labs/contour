import { createApiHandler } from "@/lib/api-handler";
import { getInquiryPropertyMatches, matchingQuerySchema } from "@/lib/matching/service";
import { matchingResponse, matchingScope } from "@/lib/matching/api";

export const GET = createApiHandler({
  requirePermissions: ["pwa.inquiries.read"],
  querySchema: matchingQuerySchema,
  handler: async (_req, ctx) => matchingResponse(() => getInquiryPropertyMatches(
    matchingScope(ctx), String(ctx.params?.id || ""), { ...ctx.query, view: "all" },
  )),
});
