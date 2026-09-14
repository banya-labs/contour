import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;

    const statements = await db.landlordStatement.findMany({
      where: { organizationId },
      include: {
        property: {
          select: {
            title: true,
            suburb: true,
          }
        }
      },
      orderBy: [
        { statementYear: "desc" },
        { statementMonth: "desc" }
      ]
    });

    return NextResponse.json({ success: true, statements });
  }
});

import { generateLandlordStatementSchema } from "@/lib/validations";

const updateStatementStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["DRAFT", "APPROVED_BY_MANAGER", "SENT_TO_LANDLORD", "PAID_OUT"]),
});

const postHandler = createApiHandler({
  bodySchema: z.union([updateStatementStatusSchema, generateLandlordStatementSchema]),
  handler: async (req, ctx) => {
    const { organizationId, body, userId } = ctx;

    if ("id" in body) {
      const updated = await db.landlordStatement.update({
        where: { id: body.id, organizationId },
        data: {
          status: body.status,
          approvedAt: body.status === "PAID_OUT" ? new Date() : undefined,
          approvedById: body.status === "PAID_OUT" ? userId : undefined,
        },
      });

      return NextResponse.json({ success: true, statement: updated });
    }

    const property = await db.property.findFirst({
      where: { id: body.propertyId, organizationId: organizationId! },
    });
    if (!property) return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });

    const netPayout = body.grossRentCollected - body.agencyFeeDeducted - (body.maintenanceDeducted || 0);

    const statement = await db.landlordStatement.create({
      data: {
        organizationId: organizationId!,
        propertyId: body.propertyId,
        landlordName: property.ownerName || "Landlord",
        statementMonth: body.statementMonth,
        statementYear: body.statementYear,
        grossRentCollected: body.grossRentCollected as any,
        agencyFeeDeducted: body.agencyFeeDeducted as any,
        maintenanceDeducted: (body.maintenanceDeducted || 0) as any,
        netLandlordPayout: netPayout as any,
        currency: body.currency,
        status: "DRAFT",
      },
      include: {
        property: {
          select: {
            title: true,
            suburb: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, statement });
  },
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context?: any) {
  return postHandler(req, context);
}
