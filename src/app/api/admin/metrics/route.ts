import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { getPlatformMetrics, PLATFORM_METRICS_PERIODS } from "@/lib/platform-metrics";

const querySchema = z.object({ period: z.enum(PLATFORM_METRICS_PERIODS).default("month") });

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "platform.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = querySchema.safeParse({ period: request.nextUrl.searchParams.get("period") || undefined });
  if (!parsed.success) return NextResponse.json({ error: "Invalid metrics period", details: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ success: true, metrics: await getPlatformMetrics(parsed.data.period) });
}
