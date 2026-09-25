import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

const schema = z.object({ organizationId: z.string().min(1), reason: z.string().trim().min(20).max(500) });

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || actor.role !== "OWNER" || !canPlatformRole(actor.role, "account.delete")) return NextResponse.json({ error: "Only platform owners can restore an agency." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A reason of at least 20 characters is required." }, { status: 400 });
  const result = await db.organization.updateMany({ where: { id: parsed.data.organizationId, accountStatus: "DELETION_PENDING" }, data: { accountStatus: "ACTIVE", accountLockedAt: null, accountLockReason: null } });
  if (!result.count) return NextResponse.json({ error: "Agency is not pending deletion or was not found." }, { status: 404 });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: parsed.data.organizationId, capability: "account.delete.restore", reason: parsed.data.reason } });
  return NextResponse.json({ success: true });
}
