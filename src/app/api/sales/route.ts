import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { smartCache } from "@/lib/cache";
import { z } from "zod";

const createTransactionSchema = z.object({
  propertyId: z.string(),
  grossValue: z.number().positive(),
  currency: z.enum(["ZMW", "USD", "ZAR"]).default("ZMW"),
  agencyCommissionPct: z.number().min(0).max(100).default(5.0),
  agentSplitPct: z.number().min(0).max(100).default(50.0),
  status: z.enum(["EXPECTED", "RECEIVED", "CANCELLED"]).default("EXPECTED"),
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

    const whereClause: any = { organizationId };

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

    const commissionPct = body.agencyCommissionPct ?? 5.0;
    const splitPct = body.agentSplitPct ?? 50.0;
    const commissionAmt = (body.grossValue * commissionPct) / 100;
    const agentSplitAmt = (commissionAmt * splitPct) / 100;

    const property = await db.property.findFirst({
      where: { id: body.propertyId, organizationId }
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found or access denied." },
        { status: 404 }
      );
    }

    const transaction = await db.transaction.create({
      data: {
        organizationId: organizationId!,
        propertyId: body.propertyId,
        transactionType: "PROPERTY_SALE",
        grossValue: body.grossValue as any,
        currency: body.currency,
        agencyCommissionPct: commissionPct as any,
        agencyCommissionAmount: commissionAmt as any,
        agentSplitPct: splitPct as any,
        agentSplitAmount: agentSplitAmt as any,
        status: (body.status || "EXPECTED") as any,
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

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context?: any) {
  return postHandler(req, context);
}
