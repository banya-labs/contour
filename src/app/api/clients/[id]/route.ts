import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { updateInquiryPipelineSchema } from "@/lib/validations";

export const PATCH = createApiHandler({
  requirePermissions: ["pipeline.update"],
  bodySchema: updateInquiryPipelineSchema,
  handler: async (_req, { body, params, organizationId, userId }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId) return NextResponse.json({ success: false, error: "Inquiry id is required." }, { status: 400 });

    const inquiry = await db.inquiry.findFirst({
      where: { id: inquiryId, organizationId: organizationId! },
      select: { id: true, status: true },
    });
    if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });

    if (body.assignedAgentId) {
      const member = await db.member.findFirst({
        where: { organizationId: organizationId!, userId: body.assignedAgentId, status: "active" },
        select: { id: true },
      });
      if (!member) return NextResponse.json({ success: false, error: "Assigned agent must be an active member of this organization." }, { status: 400 });
    }

    if (body.propertyId) {
      const property = await db.property.findFirst({ where: { id: body.propertyId, organizationId: organizationId! }, select: { id: true } });
      if (!property) return NextResponse.json({ success: false, error: "Selected property was not found in this organization." }, { status: 400 });
    }

    const isClosed = body.status === "CLOSED";
    const updated = await db.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: body.status,
        outcome: isClosed ? body.outcome : null,
        lostReason: isClosed && body.outcome === "LOST" ? body.lostReason : null,
        closedAt: isClosed ? new Date() : null,
        closedById: isClosed ? userId : null,
        ...(body.assignedAgentId !== undefined ? { assignedAgentId: body.assignedAgentId || null } : {}),
        ...(body.leadSource !== undefined ? { leadSource: body.leadSource } : {}),
        ...(body.propertyId !== undefined ? { propertyId: body.propertyId || null } : {}),
        ...(body.dealValue !== undefined ? { dealValue: body.dealValue as any } : {}),
        ...(body.matchStatus !== undefined ? { matchStatus: body.matchStatus } : {}),
        ...(body.unmatchedReason !== undefined ? { unmatchedReason: body.unmatchedReason || null } : {}),
        ...(body.failedAtStage !== undefined && body.status === "CLOSED" && body.outcome === "LOST" ? { failedAtStage: body.failedAtStage } : {}),
      },
      include: { assignedAgent: { select: { id: true, name: true, phone: true } } },
    });

    await db.auditLog.create({
      data: {
        organizationId: organizationId!,
        userId,
        action: isClosed ? "INQUIRY_CLOSED" : "INQUIRY_PIPELINE_UPDATED",
        entityType: "Inquiry",
        entityId: inquiry.id,
        details: { previousStatus: inquiry.status, status: body.status, outcome: body.outcome, lostReason: body.lostReason },
      },
    });

    return NextResponse.json({ success: true, inquiry: updated });
  },
});
