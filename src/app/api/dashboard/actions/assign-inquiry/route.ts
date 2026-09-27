import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { smartCache } from "@/lib/cache";
import { canSelfAssignInquiry } from "@/lib/actions/assign-inquiry";

const bodySchema = z.object({ inquiryId: z.string().min(1) });

export const POST = createApiHandler({
  requirePermissions: ["leads.assign"],
  bodySchema,
  handler: async (_request, { body, organizationId, userId }) => {
    if (!organizationId || !userId) return NextResponse.json({ success: false, error: "Organization context is required." }, { status: 400 });

    const member = await db.member.findFirst({ where: { organizationId, userId, status: "active" }, select: { id: true } });
    if (!member) return NextResponse.json({ success: false, error: "You are not an active member of this organization." }, { status: 403 });

    const inquiry = await db.inquiry.findFirst({ where: { id: body.inquiryId, organizationId }, select: { id: true, status: true, assignedAgentId: true, clientName: true } });
    if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    if (!canSelfAssignInquiry(inquiry)) return NextResponse.json({ success: false, error: "This inquiry is already assigned or no longer new." }, { status: 409 });

    const updated = await db.inquiry.update({
      where: { id: inquiry.id },
      data: { assignedAgentId: userId, exclusiveLockExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      include: { assignedAgent: { select: { id: true, name: true } } },
    });

    await db.auditLog.create({ data: { organizationId, userId, action: "INQUIRY_ASSIGNED", entityType: "Inquiry", entityId: inquiry.id, details: { clientName: inquiry.clientName, assignedAgentId: userId, source: "dashboard_action_queue" } } });
    smartCache.invalidateTag(organizationId, "clients", "/dashboard/clients");
    smartCache.invalidateTag(organizationId, "pipeline", "/dashboard/pipeline");
    smartCache.invalidateTag(organizationId, "dashboard-action-queue");
    return NextResponse.json({ success: true, inquiry: updated });
  },
});
