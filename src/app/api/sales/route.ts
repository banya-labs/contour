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
            clientName: true,
            clientPhone: true,
            clientEmail: true,
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
