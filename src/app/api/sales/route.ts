import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { smartCache } from "@/lib/cache";
import { z } from "zod";
import { isManagementRole } from "@/lib/authorization";
import { resolveCommissionPct } from "@/lib/commission-policy";
import { Prisma } from "@prisma/client";
import type { ApiRouteContext } from "@/lib/api-handler";

const createTransactionSchema = z.object({
  propertyId: z.string(),
  grossValue: z.number().positive(),
  currency: z.enum(["ZMW", "USD", "ZAR"]).default("ZMW"),
  agencyCommissionPct: z.number().min(0).max(100).optional(),
  agentSplitPct: z.number().min(0).max(100).default(50.0),
  status: z.enum(["EXPECTED", "EARNED", "PARTIALLY_RECEIVED", "RECEIVED", "AGENT_PAID_OUT"]).default("EXPECTED"),
  closingAgentId: z.string(),
  closedAt: z.string().optional(),
});

const getHandler = createApiHandler({
  querySchema: z.object({
    assigned: z.string().optional(), // "me" | "all"
    closingAgentId: z.string().optional(),
  }).partial(),
  handler: async (req, ctx) => {
    const { organizationId, userId, contourRole, query } = ctx;
    const { assigned, closingAgentId } = query;

    const whereClause: Prisma.TransactionWhereInput = { organizationId };

    if (assigned === "me" || contourRole === "FIELD_AGENT") {
      whereClause.closingAgentId = userId;
    } else if (closingAgentId) {
      whereClause.closingAgentId = closingAgentId;
    }

    const transactions = await db.transaction.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            title: true,
            slug: true,
            suburb: true,
          }
        },
        closingAgent: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { closedAt: "desc" }
    });

    return NextResponse.json({ success: true, transactions });
  }
});

const postHandler = createApiHandler({
  bodySchema: createTransactionSchema,
  handler: async (req, ctx) => {
    const { organizationId, body } = ctx;

    const property = await db.property.findFirst({
      where: { id: body.propertyId, organizationId },
      select: { id: true, agencyCommissionPct: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found or access denied." },
        { status: 404 }
      );
    }

    if (body.agencyCommissionPct !== undefined && !isManagementRole(ctx.contourRole)) {
      return NextResponse.json(
        { success: false, error: "Only owners and broker managers can override commission percentages." },
        { status: 403 },
      );
    }

    const commissionPct = resolveCommissionPct({
      listingType: "FOR_SALE",
      propertyPct: Number(property.agencyCommissionPct),
      requestedPct: body.agencyCommissionPct,
      canOverride: isManagementRole(ctx.contourRole),
    });
    const splitPct = body.agentSplitPct ?? 50.0;
    const commissionAmt = (body.grossValue * commissionPct) / 100;
    const agentSplitAmt = (commissionAmt * splitPct) / 100;

    const transaction = await db.transaction.create({
      data: {
        organizationId: organizationId!,
        propertyId: body.propertyId,
        transactionType: "PROPERTY_SALE",
        grossValue: new Prisma.Decimal(body.grossValue),
        currency: body.currency,
        agencyCommissionPct: new Prisma.Decimal(commissionPct),
        agencyCommissionAmount: new Prisma.Decimal(commissionAmt),
        agentSplitPct: new Prisma.Decimal(splitPct),
        agentSplitAmount: new Prisma.Decimal(agentSplitAmt),
        status: body.status || "EXPECTED",
        closingAgentId: body.closingAgentId,
        closedAt: body.closedAt ? new Date(body.closedAt) : null,
      },
      include: {
        property: {
          select: {
            title: true,
            slug: true,
            suburb: true,
          }
        },
        closingAgent: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Update property status to SOLD
    await db.property.update({
      where: { id: body.propertyId },
      data: { status: "SOLD" }
    });

    // Invalidate sales and property caches across all surfaces
    if (organizationId) {
      smartCache.invalidateTag(organizationId, "sales", "/dashboard/sales");
      smartCache.invalidateTag(organizationId, "properties", "/dashboard/properties");
      smartCache.invalidateTag(organizationId, "properties", "/agent");
      smartCache.invalidateTag(organizationId, "properties", "/dashboard/map");
      smartCache.invalidateTag(organizationId, "dashboard-metrics");
      smartCache.invalidateTag(organizationId, "dashboard-action-queue");
    }

    return NextResponse.json({ success: true, transaction });
  }
});

export async function GET(req: NextRequest, context: ApiRouteContext) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context: ApiRouteContext) {
  return postHandler(req, context);
}
