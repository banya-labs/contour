import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { readStatementDocument } from "@/lib/statements/service";
export const dynamic = "force-dynamic";
export const GET = createApiHandler({ handler: async (_req, ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== "string" || id.length > 128) return NextResponse.json({ error: "Invalid statement reference." }, { status: 400 });
  return NextResponse.json({ success: true, ...await readStatementDocument(ctx, id) }, { headers: { "Cache-Control": "private, no-store" } });
} });
