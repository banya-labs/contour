import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";
import { s3Storage } from "@/lib/storage/s3";

const schema = z.object({ organizationId: z.string().min(1), action: z.enum(["SCHEDULE", "DELETE"]), confirmation: z.literal("DELETE AGENCY"), reason: z.string().trim().min(30).max(500) });

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || actor.role !== "OWNER" || !canPlatformRole(actor.role, "account.delete")) return NextResponse.json({ error: "Only platform owners can manage agency deletion." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Typed confirmation and reason are required.", details: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.action === "DELETE") {
    const organization = await db.organization.findUnique({ where: { id: parsed.data.organizationId }, select: { id: true, name: true, logo: true, assets: { select: { objectKey: true } }, vaultDocuments: { select: { objectKey: true } } } });
    if (!organization) return NextResponse.json({ error: "Agency not found." }, { status: 404 });
    await db.organization.delete({ where: { id: organization.id } });
    await Promise.allSettled([...organization.assets.map((asset) => asset.objectKey), ...organization.vaultDocuments.map((document) => document.objectKey), organization.logo].filter((key): key is string => Boolean(key)).map((key) => s3Storage.deleteObject(key)));
    await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: organization.id, capability: "account.delete.immediate", reason: parsed.data.reason, details: { confirmation: "DELETE AGENCY", deletedAt: new Date().toISOString() } } });
    return NextResponse.json({ success: true, deletedOrganization: { id: organization.id, name: organization.name } });
  }

  const organization = await db.organization.update({ where: { id: parsed.data.organizationId }, data: { accountStatus: "DELETION_PENDING", accountLockedAt: new Date(), accountLockReason: parsed.data.reason }, select: { id: true, name: true, accountStatus: true, accountLockedAt: true } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: organization.id, capability: "account.delete.schedule", reason: parsed.data.reason, details: { confirmation: "DELETE AGENCY", recoveryWindowDays: 30, scheduledAt: new Date().toISOString() } } });
  return NextResponse.json({ success: true, organization, recoveryWindowDays: 30 });
}
