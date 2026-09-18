import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { updateInquirySchema } from "@/lib/validations";
import { smartCache } from "@/lib/cache";
import { normalizePhoneNumber } from "@/lib/phone-utils";

export const PATCH = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: updateInquirySchema,
  handler: async (_req, { body, params, organizationId, userId }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId) return NextResponse.json({ success: false, error: "Inquiry id is required." }, { status: 400 });

    const inquiry = await db.inquiry.findFirst({
      where: { id: inquiryId, organizationId: organizationId! },
      select: { id: true, status: true, clientName: true },
    });
    if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });

    if (body.assignedAgentId) {
      const isDemoUser = body.assignedAgentId.startsWith("user_demo") || body.assignedAgentId.startsWith("usr_");
      if (!isDemoUser) {
        const member = await db.member.findFirst({
          where: { organizationId: organizationId!, userId: body.assignedAgentId, status: "active" },
          select: { id: true },
        });
        if (!member) return NextResponse.json({ success: false, error: "Assigned agent must be an active member of this organization." }, { status: 400 });
      }
    }

    if (body.propertyId) {
      const property = await db.property.findFirst({ where: { id: body.propertyId, organizationId: organizationId! }, select: { id: true } });
      if (!property) return NextResponse.json({ success: false, error: "Selected property was not found in this organization." }, { status: 400 });
    }

    const isClosed = body.status === "CLOSED";
    const rawPhone = body.clientPhone || body.phone;
    const clientPhone = rawPhone ? normalizePhoneNumber(rawPhone) : undefined;
    const clientName = (body.clientName || body.name)?.trim();
    const clientEmail = body.clientEmail !== undefined ? (body.clientEmail || null) : body.email !== undefined ? (body.email || null) : undefined;

    const updated = await db.inquiry.update({
      where: { id: inquiry.id },
      data: {
        ...(clientName ? { clientName } : {}),
        ...(clientPhone ? { clientPhone } : {}),
        ...(clientEmail !== undefined ? { clientEmail } : {}),
        ...(body.budgetMax !== undefined ? { budgetMax: body.budgetMax as any } : {}),
        ...(body.budgetMin !== undefined ? { budgetMin: body.budgetMin as any } : {}),
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.preferredSuburbs !== undefined ? { preferredSuburbs: body.preferredSuburbs } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.lookingFor !== undefined ? { lookingFor: body.lookingFor } : {}),
        ...(body.propertyType !== undefined ? { propertyType: body.propertyType } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(isClosed && body.outcome !== undefined ? { outcome: body.outcome } : {}),
        ...(isClosed && body.outcome === "LOST" && body.lostReason !== undefined ? { lostReason: body.lostReason } : {}),
        ...(isClosed ? { closedAt: new Date(), closedById: userId } : {}),
        ...(body.assignedAgentId !== undefined ? { assignedAgentId: body.assignedAgentId || null } : {}),
        ...(body.leadSource !== undefined ? { leadSource: body.leadSource } : {}),
        ...(body.propertyId !== undefined ? { propertyId: body.propertyId || null } : {}),
        ...(body.dealValue !== undefined ? { dealValue: body.dealValue as any } : {}),
        ...(body.matchStatus !== undefined ? { matchStatus: body.matchStatus } : {}),
        ...(body.unmatchedReason !== undefined ? { unmatchedReason: body.unmatchedReason || null } : {}),
        ...(body.failedAtStage !== undefined && body.status === "CLOSED" && body.outcome === "LOST" ? { failedAtStage: body.failedAtStage } : {}),
      },
      include: {
        assignedAgent: { select: { id: true, name: true, phone: true } },
        property: { select: { id: true, title: true, suburb: true } },
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: organizationId!,
        userId,
        action: isClosed ? "INQUIRY_CLOSED" : "INQUIRY_PROFILE_UPDATED",
        entityType: "Inquiry",
        entityId: inquiry.id,
        details: {
          clientName: updated.clientName,
          clientPhone: updated.clientPhone,
          status: updated.status,
          previousStatus: inquiry.status,
        },
      },
    });

    // Invalidate client, pipeline, and dashboard caches across all surfaces
    if (organizationId) {
      smartCache.invalidateTag(organizationId, "clients", "/dashboard/clients");
      smartCache.invalidateTag(organizationId, "pipeline", "/dashboard/pipeline");
      smartCache.invalidateTag(organizationId, "dashboard-metrics");
      smartCache.invalidateTag(organizationId, "dashboard-action-queue");
      smartCache.invalidateTag(organizationId, "agent-summary", "/agent");
    }

    return NextResponse.json({ success: true, inquiry: updated });
  },
});
