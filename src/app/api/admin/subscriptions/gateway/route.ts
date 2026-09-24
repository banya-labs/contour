import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";
import { env } from "@/env";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const key = env.LENCO_API_KEY || "";
  return NextResponse.json({ success: true, connection: { provider: "LENCO", environment: env.LENCO_ENVIRONMENT, apiUrl: env.LENCO_API_URL, configured: Boolean(key), maskedKey: key ? `${key.slice(0, 4)}••••${key.slice(-4)}` : null, secretSource: "deployment environment", editableInApp: false } });
}
