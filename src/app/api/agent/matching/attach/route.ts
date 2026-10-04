import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";
import { attachPropertyToInquiry } from "@/lib/matching/attach-property";
import { matchingResponse, matchingScope } from "@/lib/matching/api";
export const POST = createApiHandler({ requirePermissions: ["pwa.inquiries.update"], bodySchema: z.object({ inquiryId: z.string().min(1), propertyId: z.string().min(1).nullable(), expectedPropertyId: z.string().nullable().optional() }), handler: async (_req, ctx) => matchingResponse(async () => ({ inquiry: await attachPropertyToInquiry(matchingScope(ctx), ctx.body) })) });
