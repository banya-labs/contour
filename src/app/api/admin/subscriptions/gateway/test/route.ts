import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";
import { env } from "@/env";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.LENCO_API_KEY) return NextResponse.json({ success: false, status: "FAILED", message: "Lenco is not configured in the deployment environment." }, { status: 200 });
  const startedAt = Date.now();
  try {
    const response = await fetch(`${env.LENCO_API_URL.replace(/\/$/, "")}/collections/status/admin-connection-test`, { method: "GET", headers: { Authorization: `Bearer ${env.LENCO_API_KEY}`, Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    const authenticated = response.status !== 401 && response.status !== 403;
    return NextResponse.json({ success: authenticated, status: authenticated ? "SUCCESS" : "FAILED", httpStatus: response.status, durationMs: Date.now() - startedAt, message: authenticated ? "Lenco credentials were accepted by the API." : "Lenco rejected the configured credentials." });
  } catch {
    return NextResponse.json({ success: false, status: "FAILED", durationMs: Date.now() - startedAt, message: "Lenco connection test timed out or failed." }, { status: 200 });
  }
}
