import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";
import { expireDueTrials } from "@/lib/billing-lifecycle";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.adjust")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const expiredCount = await expireDueTrials();
  await db.platformAuditEvent.create({
    data: {
      actorStaffId: actor.staffId,
      actorUserId: actor.userId,
      targetType: "Organization",
      targetId: "BULK_TRIAL_EXPIRY",
      capability: "billing.trial.expire_due",
      reason: "Operator-triggered due trial reconciliation",
      details: { expiredCount },
    },
  });
  return NextResponse.json({ success: true, expiredCount });
}
