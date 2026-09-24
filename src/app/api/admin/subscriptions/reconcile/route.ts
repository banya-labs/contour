import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";
import { markPastDueSubscriptions } from "@/lib/subscription-lifecycle";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.adjust")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const pastDueCount = await markPastDueSubscriptions();
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Subscription", targetId: "BULK_RECONCILIATION", capability: "billing.subscription.reconcile", reason: "Operator-triggered subscription period reconciliation", details: { pastDueCount } } });
  return NextResponse.json({ success: true, pastDueCount, providerReconciliation: "not_configured" });
}
