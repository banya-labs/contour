import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { smartCache } from "@/lib/cache";
import { isManagementRole } from "@/lib/authorization";
import { canMovePipelineStage, mapLegacyPipelineState, type PipelineRequirementContext, type PipelineStage } from "@/lib/deal-workflow";
import { createPipelineTransitionAuditDetails } from "@/lib/pipeline-transition-audit";

const transitionSchema = z.object({
  targetStage: z.enum(["NEW_INQUIRY", "QUALIFIED", "VIEWING_OR_OFFER", "NEGOTIATING", "VERIFICATION_CLOSING", "CLOSED"]),
  outcome: z.enum(["WON", "LOST"]).optional(),
  reason: z.string().trim().min(10).max(2000).optional(),
  overrideMissingRequirements: z.boolean().optional().default(false),
});

function transitionError(message: string, status = 409, details?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...details }, { status });
}

export const POST = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: transitionSchema,
  handler: async (_req, { body, params, organizationId, userId, contourRole }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId || !organizationId || !userId) {
      return transitionError("Inquiry id and organization context are required.", 400);
    }

    const inquiry = await db.inquiry.findFirst({
      where: { id: inquiryId, organizationId },
      select: {
        id: true,
        status: true,
        outcome: true,
        clientName: true,
        clientPhone: true,
        contactId: true,
        propertyId: true,
        assignedAgentId: true,
        budgetMin: true,
        budgetMax: true,
        notes: true,
        dealValue: true,
        currency: true,
        updatedAt: true,
        lookingFor: true,
        property: { select: { id: true, status: true } },
        visits: { select: { status: true } },
        documentRequests: { select: { status: true } },
        followUpTasks: { where: { status: "PENDING" }, select: { id: true }, take: 1 },
      },
    });
    if (!inquiry) return transitionError("Inquiry not found.", 404);

    const targetStage = body.targetStage as PipelineStage;
    if (targetStage === "CLOSED" && !body.outcome) {
      return transitionError("Choose Won or Lost before closing the inquiry.", 400);
    }
    if (targetStage !== "CLOSED" && body.outcome) {
      return transitionError("An outcome can only be recorded when closing the inquiry.", 400);
    }
    if (body.overrideMissingRequirements && !isManagementRole(contourRole)) {
      return transitionError("Only management can override missing pipeline requirements.", 403);
    }
    if (targetStage === "CLOSED" && body.outcome === "LOST" && !body.reason) {
      return transitionError("A reason is required when marking an inquiry lost.", 400);
    }

    const context: PipelineRequirementContext = {
      hasClient: Boolean(inquiry.contactId && inquiry.clientName.trim() && inquiry.clientPhone.trim()),
      hasProperty: Boolean(inquiry.propertyId),
      hasAssignedAgent: Boolean(inquiry.assignedAgentId),
      hasQualificationNote: Boolean(inquiry.notes?.trim()),
      hasBudget: Boolean(inquiry.budgetMin || inquiry.budgetMax),
      hasNextAction: inquiry.followUpTasks.length > 0,
      hasViewingOutcome: inquiry.visits.some((visit) => ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(visit.status)),
      hasOfferValue: Boolean(inquiry.dealValue && inquiry.dealValue.gt(0)),
      hasCurrentValue: Boolean(inquiry.dealValue && inquiry.dealValue.gt(0)),
      hasRecentContact: Date.now() - inquiry.updatedAt.getTime() <= 30 * 24 * 60 * 60 * 1000,
      hasFollowUpDate: inquiry.followUpTasks.length > 0,
      hasFinalValue: Boolean(inquiry.dealValue && inquiry.dealValue.gt(0)),
      hasRequiredDocuments: inquiry.documentRequests.some((request) => request.status === "FULFILLED"),
    };

    const canonicalCurrent = mapLegacyPipelineState(inquiry.status).status;
    const decision = canMovePipelineStage({
      currentStage: canonicalCurrent,
      targetStage,
      context,
      reason: body.reason,
      isManagerOverride: body.overrideMissingRequirements,
    });
    if (!decision.allowed) {
      return transitionError(decision.reason, 409, { missingRequirements: decision.missingRequirements });
    }

    if (targetStage === "CLOSED" && body.outcome === "WON" && inquiry.property?.status === "SOLD" && inquiry.outcome !== "WON") {
      return transitionError("This property already has a winning inquiry.");
    }

    const closed = targetStage === "CLOSED";
    const now = new Date();
    let competingInquiriesClosed = 0;
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.inquiry.update({
        where: { id: inquiry.id },
        data: {
          status: targetStage,
          ...(closed ? { outcome: body.outcome, closedAt: now, closedById: userId } : {}),
          ...(body.outcome === "LOST" ? { lostReason: body.reason, failedAtStage: inquiry.status } : {}),
        },
        include: { property: { select: { id: true, status: true, title: true } } },
      });

      if (closed && body.outcome === "WON" && inquiry.propertyId) {
        const propertyUpdate = await tx.property.updateMany({
          where: { id: inquiry.propertyId, organizationId, status: { not: "SOLD" } },
          data: { status: inquiry.lookingFor === "FOR_RENT" ? "RENTED" : "SOLD" },
        });
        if (propertyUpdate.count !== 1) throw new Error("This property already has a winning inquiry.");

        const closedCompeting = await tx.inquiry.updateMany({
          where: { organizationId, propertyId: inquiry.propertyId, id: { not: inquiry.id }, status: { not: "CLOSED" } },
          data: { status: "CLOSED", outcome: "LOST", lostReason: "Property sold to another client.", closedAt: now, closedById: userId },
        });
        competingInquiriesClosed = closedCompeting.count;

        const property = result.property;
        const grossValue = Number(inquiry.dealValue || 0);
        if (property && grossValue > 0) {
          const commissionPct = Number((await tx.property.findUnique({ where: { id: property.id }, select: { agencyCommissionPct: true } }))?.agencyCommissionPct ?? 5);
          const commissionAmount = grossValue * commissionPct / 100;
          await tx.transaction.create({
            data: {
              organizationId, propertyId: property.id, inquiryId: inquiry.id,
              transactionType: inquiry.lookingFor === "FOR_RENT" ? "RENTAL_PLACEMENT" : "PROPERTY_SALE",
              grossValue: new Prisma.Decimal(grossValue), currency: inquiry.currency,
              agencyCommissionPct: new Prisma.Decimal(commissionPct), agencyCommissionAmount: new Prisma.Decimal(commissionAmount),
              agentSplitPct: new Prisma.Decimal(50), agentSplitAmount: new Prisma.Decimal(commissionAmount / 2),
              status: "EARNED", closingAgentId: inquiry.assignedAgentId || userId, closedAt: now,
            },
          });
        }
      }

      return result;
    });

    await db.auditLog.create({
      data: {
        organizationId, userId, action: "INQUIRY_PIPELINE_TRANSITION", entityType: "Inquiry", entityId: inquiry.id,
        details: createPipelineTransitionAuditDetails({
          previousStatus: canonicalCurrent,
          status: targetStage,
          outcome: body.outcome ?? null,
          reason: body.reason ?? null,
          override: Boolean(body.overrideMissingRequirements),
          missingRequirements: decision.missingRequirements,
          competingInquiriesClosed,
        }),
      },
    });

    for (const tag of ["clients", "pipeline", "dashboard-metrics", "dashboard-action-queue", "agent-summary"] as const) {
      smartCache.invalidateTag(organizationId, tag, tag === "pipeline" ? "/dashboard/pipeline" : tag === "agent-summary" ? "/agent" : undefined);
    }

    return NextResponse.json({ success: true, inquiry: updated, previousStatus: inquiry.status });
  },
});
