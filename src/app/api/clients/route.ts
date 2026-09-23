import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createInquirySchema } from "@/lib/validations";
import { smartCache } from "@/lib/cache";
import { normalizePhoneNumber } from "@/lib/phone-utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { ApiRouteContext } from "@/lib/api-handler";

const getHandler = createApiHandler({
  requirePermissions: ["leads.read"],
  querySchema: z.object({
    assigned: z.string().optional(), // "me" | "all"
    assignedAgentId: z.string().optional(),
    search: z.string().optional(),
  }).partial(),
  handler: async (req, ctx) => {
    const { organizationId, userId, query } = ctx;
    const { assigned, assignedAgentId, search } = query;

    const whereClause: Prisma.InquiryWhereInput = { organizationId };

    if (assigned === "me" && userId) {
      whereClause.assignedAgentId = userId;
    } else if (assignedAgentId) {
      whereClause.assignedAgentId = assignedAgentId;
    }

    if (search) {
      whereClause.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientPhone: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const clients = await db.inquiry.findMany({
      where: whereClause,
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        },
        property: { select: { id: true, title: true, suburb: true, agencyCommissionPct: true } },
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, clients });
  }
});

const postHandler = createApiHandler({
  requirePermissions: ["pwa.inquiries.update"],
  bodySchema: createInquirySchema,
  handler: async (req, ctx) => {
    const { organizationId, body, userId } = ctx;

    // Safely resolve assignedAgentId to an existing User record in DB
    const candidateAgentId = body.assignedAgentId || userId || undefined;
    let effectiveAgentId: string | undefined = undefined;

    if (candidateAgentId) {
      const agentUser = await db.user.findUnique({
        where: { id: candidateAgentId },
        select: { id: true },
      });
      if (agentUser) {
        effectiveAgentId = agentUser.id;
      } else if (userId) {
        const currentUser = await db.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (currentUser) {
          effectiveAgentId = currentUser.id;
        }
      }
    }

    let validPropertyId: string | undefined = undefined;
    if (body.propertyId) {
      const property = await db.property.findFirst({
        where: { id: body.propertyId, organizationId: organizationId! },
        select: { id: true },
      });
      if (property) {
        validPropertyId = property.id;
      }
    }

    const lockDurationDays = 30;
    const exclusiveLockExpiresAt = new Date();
    exclusiveLockExpiresAt.setDate(exclusiveLockExpiresAt.getDate() + lockDurationDays);

    const clientPhone = normalizePhoneNumber(body.clientPhone);

    const client = await db.inquiry.create({
      data: {
        organizationId: organizationId!,
        clientName: body.clientName.trim(),
        clientPhone,
        clientEmail: body.clientEmail?.trim() || undefined,
        lookingFor: body.lookingFor || "FOR_SALE",
        propertyType: body.propertyType,
        budgetMin: body.budgetMin ? new Prisma.Decimal(body.budgetMin) : undefined,
        budgetMax: body.budgetMax ? new Prisma.Decimal(body.budgetMax) : undefined,
        currency: body.currency || "ZMW",
        preferredSuburbs: body.preferredSuburbs || [],
        notes: body.notes,
        status: body.status || "CONTACTED",
        leadSource: body.leadSource || "OTHER",
        propertyId: validPropertyId,
        dealValue: body.dealValue !== undefined ? new Prisma.Decimal(body.dealValue) : undefined,
        assignedAgentId: effectiveAgentId,
        exclusiveLockExpiresAt,
      },
      include: {
        assignedAgent: {
          select: {
            name: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            suburb: true,
            agencyCommissionPct: true,
          },
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

    return NextResponse.json({ success: true, client });
  },
});

export async function GET(req: NextRequest, context: ApiRouteContext) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context: ApiRouteContext) {
  return postHandler(req, context);
}
