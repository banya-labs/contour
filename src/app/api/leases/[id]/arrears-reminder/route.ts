import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { canQueueArrearsReminder } from "@/lib/actions/arrears-reminder";
import { smartCache } from "@/lib/cache";

const bodySchema = z.object({ tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1) });

export const POST = createApiHandler({
  requirePermissions: ["leases.manage"],
  bodySchema,
  handler: async (_request, { body, params, organizationId, userId }) => {
    const leaseId = typeof params?.id === "string" ? params.id : undefined;
    if (!leaseId || !organizationId || !userId) return NextResponse.json({ success: false, error: "Lease and organization context are required." }, { status: 400 });
    const lease = await db.lease.findFirst({ where: { id: leaseId, organizationId, status: "IN_ARREARS" }, select: { id: true, tenantPhone: true } });
    if (!lease) return NextResponse.json({ success: false, error: "Arrears lease not found." }, { status: 404 });
    if (!lease.tenantPhone.trim()) return NextResponse.json({ success: false, error: "The tenant has no phone number for a reminder." }, { status: 409 });

    const latest = await db.rentArrearsReminder.findFirst({ where: { leaseId: lease.id, organizationId, tier: body.tier, status: { not: "FAILED" } }, orderBy: { sentAt: "desc" }, select: { sentAt: true } });
    const now = new Date();
    if (!canQueueArrearsReminder(latest?.sentAt || null, now)) return NextResponse.json({ success: false, error: "This reminder is still within the four-day cooldown.", nextEligibleAt: new Date(latest!.sentAt.getTime() + 4 * 24 * 60 * 60 * 1000) }, { status: 409 });

    const dayKey = now.toISOString().slice(0, 10);
    const reminder = await db.rentArrearsReminder.create({ data: { organizationId, leaseId: lease.id, tier: body.tier, recipientPhone: lease.tenantPhone, idempotencyKey: `arrears-${lease.id}-${dayKey}-tier${body.tier}`, status: "QUEUED" } });
    await db.auditLog.create({ data: { organizationId, userId, action: "ARREARS_REMINDER_QUEUED", entityType: "Lease", entityId: lease.id, details: { reminderId: reminder.id, tier: body.tier, channel: "WHATSAPP" } } });
    smartCache.invalidateTag(organizationId, "dashboard-action-queue");
    return NextResponse.json({ success: true, status: "QUEUED", reminder });
  },
});
