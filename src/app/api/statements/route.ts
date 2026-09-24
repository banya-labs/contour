import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";

const getHandler = createApiHandler({
  requirePermissions: ["statements.read"],
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
import { Prisma } from "@prisma/client";
import type { ApiRouteContext } from "@/lib/api-handler";
import { roleHasPermission, resolveContourRole } from "@/lib/authorization";

const updateStatementStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["DRAFT", "APPROVED_BY_MANAGER", "SENT_TO_LANDLORD", "PAID_OUT"]),
});

const postHandler = createApiHandler({
  requirePermissions: ["statements.read"],
  bodySchema: z.union([updateStatementStatusSchema, generateLandlordStatementSchema]),
  handler: async (req, ctx) => {
    const { organizationId, body, userId } = ctx;

    if ("id" in body) {
      const existing = await db.landlordStatement.findFirst({ where: { id: body.id, organizationId } });
      if (!existing) return NextResponse.json({ success: false, error: "Statement not found." }, { status: 404 });
      if (!roleHasPermission(resolveContourRole(ctx.contourRole ?? ctx.userRole ?? "member", "member"), "statements.approve")) {
        return NextResponse.json({ success: false, error: "Statement approval permission required." }, { status: 403 });
      }
      const updated = await db.landlordStatement.update({
        where: { id: body.id },
        data: {
          status: body.status,
          approvedAt: body.status === "PAID_OUT" ? new Date() : undefined,
          approvedById: body.status === "PAID_OUT" ? userId : undefined,
        },
      });

      return NextResponse.json({ success: true, statement: updated });
    }

    const property = await db.property.findFirst({
      where: { id: body.propertyId, organizationId: organizationId!, listingType: { in: ["FOR_RENT", "BOTH"] } },
    });
    if (!property) return NextResponse.json({ success: false, error: "Select an active rental property." }, { status: 404 });

    const duplicate = await db.landlordStatement.findFirst({ where: { organizationId, propertyId: body.propertyId, statementMonth: body.statementMonth, statementYear: body.statementYear } });
    if (duplicate) return NextResponse.json({ success: false, error: "A statement already exists for this property and month." }, { status: 409 });

    const payments = await db.rentPayment.findMany({
      where: { organizationId: organizationId!, lease: { propertyId: body.propertyId }, periodMonth: body.statementMonth, periodYear: body.statementYear, status: "CONFIRMED" },
      select: { amountPaid: true, currency: true },
    });
    const expenses = await db.maintenanceExpense.findMany({
      where: { organizationId: organizationId!, propertyId: body.propertyId, periodMonth: body.statementMonth, periodYear: body.statementYear, status: { in: ["APPROVED", "PAID"] } },
      select: { amount: true },
    });
    const currencies = new Set(payments.map((payment) => payment.currency));
    currencies.add(body.currency);
    if (currencies.size > 1) return NextResponse.json({ success: false, error: "Payments and statement must use the same currency." }, { status: 400 });
    const leases = await db.lease.findMany({ where: { organizationId, propertyId: body.propertyId, status: { in: ["ACTIVE", "IN_ARREARS", "EXPIRING_SOON"] } }, select: { monthlyRent: true, currency: true } });
    const rentDue = leases.filter((lease) => lease.currency === body.currency).reduce((sum, lease) => sum + Number(lease.monthlyRent), 0);
    const arrearsBroughtForward = leases.filter((lease) => lease.status === "IN_ARREARS" && lease.currency === body.currency).reduce((sum, lease) => sum + Number(lease.monthlyRent), 0);
    const grossRentCollected = payments.reduce((sum, payment) => sum + Number(payment.amountPaid), 0);
    const maintenanceDeducted = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const agencyFeeDeducted = grossRentCollected * Number(property.agencyCommissionPct ?? 10) / 100;
    const netPayout = grossRentCollected - agencyFeeDeducted - maintenanceDeducted;

    const statement = await db.landlordStatement.create({
      data: {
        organizationId: organizationId!,
        propertyId: body.propertyId,
        landlordName: property.ownerName || "Landlord",
        statementMonth: body.statementMonth,
        statementYear: body.statementYear,
        grossRentCollected: new Prisma.Decimal(grossRentCollected),
        rentDue: new Prisma.Decimal(rentDue),
        arrearsBroughtForward: new Prisma.Decimal(arrearsBroughtForward),
        arrearsClosing: new Prisma.Decimal(Math.max(0, arrearsBroughtForward + rentDue - grossRentCollected)),
        agencyFeeDeducted: new Prisma.Decimal(agencyFeeDeducted),
        maintenanceDeducted: new Prisma.Decimal(maintenanceDeducted),
        netLandlordPayout: new Prisma.Decimal(netPayout),
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

export async function GET(req: NextRequest, context: ApiRouteContext) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context: ApiRouteContext) {
  return postHandler(req, context);
}
