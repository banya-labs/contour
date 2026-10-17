import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";

import { z } from "zod";


import { Prisma } from "@prisma/client";
import type { ApiRouteContext } from "@/lib/api-handler";


const getHandler = createApiHandler({
  requirePermissions: ["finance.read"],
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
        },
        inquiry: {
          select: {
            id: true,
            contactId: true,
            clientName: true,
            clientPhone: true,
            clientEmail: true,
          },
        },
        salePaymentPlan: {
          select: {
            id: true,
            status: true,
            price: true,
            currency: true,
            currentRevision: true,
            revisions: { orderBy: { revision: "desc" }, take: 1, include: { installments: true } },
            events: { where: { kind: "CONFIRM" }, include: { allocations: true }, orderBy: { postedAt: "asc" } },
          },
        },
      },
      orderBy: { closedAt: "desc" }
    });

    return NextResponse.json({ success: true, transactions });
  }
});

const postHandler = createApiHandler({ requirePermissions: ["finance.manage"], handler: async () => NextResponse.json({ success: false, error: "Start the sale closing workflow before recording a completed sale.", code: "CLOSING_WORKFLOW_REQUIRED" }, { status: 409 }) });

export async function GET(req: NextRequest, context: ApiRouteContext) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context: ApiRouteContext) {
  return postHandler(req, context);
}
