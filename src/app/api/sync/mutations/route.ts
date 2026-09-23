import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";

const mutationSchema = z.object({
  mutationId: z.string().min(8).max(128),
  endpoint: z.enum(["/api/clients", "/api/properties"]),
  payload: z.record(z.unknown()),
});

const mutationHandler = createApiHandler({
  requireAuth: true,
  bodySchema: mutationSchema,
  handler: async (req, ctx) => {
    if (!ctx.organizationId || !ctx.userId) {
      return NextResponse.json({ success: false, error: "Organization context required" }, { status: 403 });
    }

    const payload = {
      ...ctx.body.payload,
      idempotencyKey: ctx.body.mutationId,
      organizationId: undefined,
    };
    const targetUrl = new URL(ctx.body.endpoint, req.url);
    const headers = new Headers(req.headers);
    headers.delete("content-length");
    headers.delete("host");
    headers.set("content-type", "application/json");

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") || "application/json" },
    });
  },
});

export async function POST(req: NextRequest, context: { params: Promise<Record<string, string | string[]>> }) {
  return mutationHandler(req, context);
}
