import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

const schema = z.object({ organizationId: z.string().min(1), accountStatus: z.enum(["ACTIVE", "LOCKED", "SUSPENDED"]), reason: z.string().trim().min(20).max(500) });

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "account.suspend")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid account state update", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const organization = await db.organization.update({ where: { id: input.organizationId }, data: { accountStatus: input.accountStatus, accountLockedAt: input.accountStatus === "ACTIVE" ? null : new Date(), accountLockReason: input.accountStatus === "ACTIVE" ? null : input.reason }, select: { id: true, name: true, accountStatus: true, accountLockedAt: true, accountLockReason: true } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: organization.id, capability: "account.state.update", reason: input.reason, details: { accountStatus: input.accountStatus } } });
  return NextResponse.json({ success: true, organization });
}
