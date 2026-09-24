import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { updateInquirySchema } from "@/lib/validations";
import { smartCache } from "@/lib/cache";
import { normalizePhoneNumber } from "@/lib/phone-utils";
import { isManagementRole } from "@/lib/authorization";
import { canAdvancePipelineStage } from "@/lib/pipeline-transition";

export const PATCH = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: updateInquirySchema,
  handler: async (_req, { body, params, organizationId, userId, contourRole }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId) return NextResponse.json({ success: false, error: "Inquiry id is required." }, { status: 400 });

    const inquiry = await db.inquiry.findFirst({
      where: { id: inquiryId, organizationId: organizationId! },
      select: { id: true, status: true, outcome: true, clientName: true, propertyId: true },
    });
    if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });

    if (body.status === "CLOSED" && !isManagementRole(contourRole)) {
      return NextResponse.json({ success: false, error: "Only management can close deals." }, { status: 403 });
    }

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
      const property = await db.property.findFirst({ where: { id: body.propertyId, organizationId: organizationId! }, select: { id: true, status: true } });
      if (!property) return NextResponse.json({ success: false, error: "Selected property was not found in this organization." }, { status: 400 });
      if (property.status === "SOLD" && inquiry.propertyId !== property.id) {
        return NextResponse.json({ success: false, error: "This property has already been sold and cannot enter another pipeline." }, { status: 409 });
      }
    }

    const targetPropertyId = body.propertyId !== undefined ? body.propertyId : inquiry.propertyId;
    if (body.status && body.status !== "CLOSED" && body.status !== inquiry.status) {
      const currentValue = body.dealValue ?? null;
      if (!canAdvancePipelineStage(inquiry.status, body.status, currentValue)) {
        return NextResponse.json({ success: false, error: "Deals must progress through each stage in order, and an offer must have a positive value." }, { status: 409 });
      }
    }
    if (body.status !== "CLOSED" && body.propertyId !== undefined && targetPropertyId) {
      const property = await db.property.findFirst({ where: { id: targetPropertyId, organizationId: organizationId! }, select: { status: true } });
      if (property?.status === "SOLD") return NextResponse.json({ success: false, error: "This property has already been sold and cannot be reopened in the pipeline." }, { status: 409 });
    }
    if (inquiry.status === "CLOSED" && body.status !== undefined && body.status !== "CLOSED") {
      return NextResponse.json({ success: false, error: "Closed deals cannot be reopened or edited." }, { status: 409 });
    }
    if (body.status === "CLOSED" && body.outcome === "WON" && targetPropertyId) {
      const soldProperty = await db.property.findFirst({ where: { id: targetPropertyId, organizationId: organizationId! }, select: { status: true } });
      if (soldProperty?.status === "SOLD" && inquiry.outcome !== "WON") return NextResponse.json({ success: false, error: "This property already has a winning deal." }, { status: 409 });
    }

    const isClosed = body.status === "CLOSED";
    const rawPhone = body.clientPhone || body.phone;
    const clientPhone = rawPhone ? normalizePhoneNumber(rawPhone) : undefined;
    const clientName = (body.clientName || body.name)?.trim();
    const clientEmail = body.clientEmail !== undefined ? (body.clientEmail || null) : body.email !== undefined ? (body.email || null) : undefined;

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.inquiry.update({
      where: { id: inquiry.id },
      data: {
        ...(clientName ? { clientName } : {}),
        ...(clientPhone ? { clientPhone } : {}),
        ...(clientEmail !== undefined ? { clientEmail } : {}),
        ...(body.budgetMax != null ? { budgetMax: new Prisma.Decimal(body.budgetMax) } : {}),
        ...(body.budgetMin != null ? { budgetMin: new Prisma.Decimal(body.budgetMin) } : {}),
        ...(body.currency !== undefined ? { currency: body.currency } : {}),
        ...(body.preferredSuburbs !== undefined ? { preferredSuburbs: body.preferredSuburbs } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.lookingFor !== undefined ? { lookingFor: body.lookingFor } : {}),
        ...(body.propertyType !== undefined ? { propertyType: body.propertyType } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(isClosed && body.outcome !== undefined ? { outcome: body.outcome } : {}),
        ...(isClosed && body.outcome === "LOST" && body.lostReason !== undefined ? { lostReason: body.lostReason } : {}),
        ...(isClosed ? { closedAt: new Date(), closedById: userId } : {}),
        ...(body.status === "MANAGEMENT_HANDOVER" ? { managementCloseRequestedAt: new Date(), managementCloseRequestedById: userId } : {}),
        ...(body.assignedAgentId !== undefined ? {
          assignedAgentId: body.assignedAgentId || null,
          exclusiveLockExpiresAt: body.assignedAgentId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        } : {}),
        ...(body.leadSource !== undefined ? { leadSource: body.leadSource } : {}),
        ...(body.propertyId !== undefined ? { propertyId: body.propertyId || null } : {}),
        ...(body.dealValue != null ? { dealValue: new Prisma.Decimal(body.dealValue) } : {}),
        ...(body.matchStatus !== undefined ? { matchStatus: body.matchStatus } : {}),
        ...(body.unmatchedReason !== undefined ? { unmatchedReason: body.unmatchedReason || null } : {}),
        ...(body.failedAtStage !== undefined && body.status === "CLOSED" && body.outcome === "LOST" ? { failedAtStage: body.failedAtStage } : {}),
      },
      include: {
        assignedAgent: { select: { id: true, name: true, phone: true } },
        property: { select: { id: true, title: true, suburb: true, rentalPrice: true, askingPrice: true, listingType: true, currency: true, agencyCommissionPct: true } },
      },
    });
      if (isClosed && body.outcome === "WON" && targetPropertyId) {
        await tx.property.updateMany({ where: { id: targetPropertyId, organizationId: organizationId! }, data: { status: result.lookingFor === "FOR_RENT" ? "RENTED" : "SOLD" } });
        await tx.inquiry.updateMany({ where: { organizationId: organizationId!, propertyId: targetPropertyId, id: { not: inquiry.id }, status: { not: "CLOSED" } }, data: { status: "CLOSED", outcome: "LOST", lostReason: "Property sold to another client.", closedAt: new Date(), closedById: userId } });

        const property = result.property;
        const grossValue = Number(result.dealValue || (result.lookingFor === "FOR_RENT" ? property?.rentalPrice : property?.askingPrice) || 0);
        if (property && grossValue > 0 && userId) {
          const commissionPct = Number(property.agencyCommissionPct);
          const commissionAmount = grossValue * commissionPct / 100;
          await tx.transaction.create({
            data: {
              organizationId: organizationId!, propertyId: targetPropertyId, inquiryId: inquiry.id,
              transactionType: result.lookingFor === "FOR_RENT" ? "RENTAL_PLACEMENT" : "PROPERTY_SALE",
              grossValue: new Prisma.Decimal(grossValue), currency: result.currency,
              agencyCommissionPct: new Prisma.Decimal(commissionPct), agencyCommissionAmount: new Prisma.Decimal(commissionAmount),
              agentSplitPct: new Prisma.Decimal(50), agentSplitAmount: new Prisma.Decimal(commissionAmount / 2),
              status: "EARNED", closingAgentId: result.assignedAgentId || userId, closedAt: new Date(),
            },
          });
        }
      }
      return result;
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

    return NextResponse.json({
      success: true,
      inquiry: updated,
      leasePrefill: updated.outcome === "WON" && updated.lookingFor === "FOR_RENT" && updated.property
        ? {
            propertyId: updated.property.id,
            inquiryId: updated.id,
            propertyTitle: updated.property.title,
            tenantName: updated.clientName,
            tenantPhone: updated.clientPhone,
            tenantEmail: updated.clientEmail,
            monthlyRent: Number(updated.dealValue || updated.property.rentalPrice || 0),
            currency: updated.currency,
          }
        : null,
    });
  },
});

export const DELETE = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  handler: async (_req, { params, organizationId, userId }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId) {
      return NextResponse.json({ success: false, error: "Client ID is required." }, { status: 400 });
    }

    const inquiry = await db.inquiry.findFirst({
      where: { id: inquiryId, organizationId: organizationId! },
      select: { id: true, clientName: true, clientPhone: true },
    });
    if (!inquiry) {
      return NextResponse.json({ success: false, error: "Client not found." }, { status: 404 });
    }

    await db.inquiry.delete({
      where: { id: inquiry.id },
    });

    await db.auditLog.create({
      data: {
        organizationId: organizationId!,
        userId,
        action: "INQUIRY_DELETED",
        entityType: "Inquiry",
        entityId: inquiry.id,
        details: {
          clientName: inquiry.clientName,
          clientPhone: inquiry.clientPhone,
        },
      },
    });

    if (organizationId) {
      smartCache.invalidateTag(organizationId, "clients", "/dashboard/clients");
      smartCache.invalidateTag(organizationId, "pipeline", "/dashboard/pipeline");
      smartCache.invalidateTag(organizationId, "dashboard-metrics");
      smartCache.invalidateTag(organizationId, "dashboard-action-queue");
      smartCache.invalidateTag(organizationId, "agent-summary", "/agent");
    }

    return NextResponse.json({ success: true, message: "Client deleted successfully." });
  },
});
