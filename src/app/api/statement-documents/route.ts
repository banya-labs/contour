import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { generationSchema } from "@/lib/statements/document";
import { generateStatementDocument } from "@/lib/statements/service";
export const POST = createApiHandler({ bodySchema: generationSchema, handler: async (_req, ctx) => NextResponse.json({ success: true, ...await generateStatementDocument(ctx, ctx.body) }, { headers: { "Cache-Control": "private, no-store" } }) });
