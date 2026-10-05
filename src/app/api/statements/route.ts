import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { z } from "zod";
import { calculateTenantLedger, ledgerPaymentPeriodWhere, landlordClosingArrears } from "@/lib/statements/ledger";

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
import { canTransitionStatement } from "@/lib/actions/statement-workflow";
import { smartCache } from "@/lib/cache";

const updateStatementStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["DRAFT", "APPROVED_BY_MANAGER", "SENT_TO_LANDLORD", "PAID_OUT"]),
});

const postHandler = createApiHandler({
  requirePermissions: ["leases.manage"],
  bodySchema: z.union([updateStatementStatusSchema, generateLandlordStatementSchema]),
  handler: async (req, ctx) => {
    const { organizationId, body, userId } = ctx;

    if ("id" in body) {
      const existing = await db.landlordStatement.findFirst({ where: { id: body.id, organizationId } });
      if (!existing) return NextResponse.json({ success: false, error: "Statement not found." }, { status: 404 });
      const role = resolveContourRole(ctx.contourRole ?? ctx.userRole ?? "member", "member");
      const requiredPermission: "finance.manage" | "statements.approve" = body.status === "PAID_OUT" ? "finance.manage" : "statements.approve";
      if (!roleHasPermission(role, requiredPermission)) {
        return NextResponse.json({ success: false, error: "Statement approval permission required." }, { status: 403 });
      }
      if (!canTransitionStatement(existing.status, body.status)) {
        return NextResponse.json({ success: false, error: `Statement cannot move from ${existing.status} to ${body.status}.` }, { status: 409 });
      }
      const updated = await db.landlordStatement.update({
        where: { id: body.id },
        data: {
          status: body.status,
          approvedAt: body.status === "PAID_OUT" ? new Date() : undefined,
          approvedById: body.status === "PAID_OUT" ? userId : undefined,
        },
      });

      await db.auditLog.create({ data: { organizationId: organizationId!, userId, action: "STATEMENT_STATUS_CHANGED", entityType: "LandlordStatement", entityId: existing.id, details: { previousStatus: existing.status, nextStatus: body.status, propertyId: existing.propertyId } } });
      smartCache.invalidateTag(organizationId!, "dashboard-action-queue");
      smartCache.invalidateTag(organizationId!, "statements", "/dashboard/leases?tab=statements");

      return NextResponse.json({ success: true, statement: updated });
    }

    const property = await db.property.findFirst({
      where: { id: body.propertyId, organizationId: organizationId!, listingType: { in: ["FOR_RENT", "BOTH"] } },
    });
    if (!property) return NextResponse.json({ success: false, error: "Select an active rental property." }, { status: 404 });

    const duplicate = await db.landlordStatement.findFirst({ where: { organizationId, propertyId: body.propertyId, statementMonth: body.statementMonth, statementYear: body.statementYear }, orderBy: { revision: "desc" }, include: { property: { select: { title: true, suburb: true } } } });
    if (duplicate && !body.regenerate) return NextResponse.json({ success: true, existing: true, statement: duplicate });

    const payments = await db.rentPayment.findMany({
      where: { organizationId: organizationId!, lease: { propertyId: body.propertyId }, periodMonth: body.statementMonth, periodYear: body.statementYear, status: "CONFIRMED" },
      select: { amountPaid: true, currency: true }, take: 5001,
    });
    const expenses = await db.maintenanceExpense.findMany({
      where: { organizationId: organizationId!, propertyId: body.propertyId, periodMonth: body.statementMonth, periodYear: body.statementYear, status: { in: ["APPROVED", "PAID"] } },
      select: { amount: true, currency: true }, take: 5001,
    });
    if (payments.length > 5000 || expenses.length > 5000) return NextResponse.json({ success: false, error: "The property period exceeds the 5,000-record statement limit." }, { status: 400 });
    const currencies = new Set([...payments.map((payment) => payment.currency), ...expenses.map(expense => expense.currency)]);
    currencies.add(body.currency ?? "ZMW");
    if (currencies.size > 1) return NextResponse.json({ success: false, error: "Payments and statement must use the same currency." }, { status: 400 });
    const leases = await db.lease.findMany({ where: { organizationId, propertyId: body.propertyId, leaseStartDate: { lt: new Date(Date.UTC(body.statementYear, body.statementMonth, 1)) }, OR: [{ leaseEndDate: { gte: new Date(Date.UTC(body.statementYear, body.statementMonth - 1, 1)) } }, { payments: { some: { periodMonth: body.statementMonth, periodYear: body.statementYear, status: "CONFIRMED" } } }] }, take: 201 });
    const organization = await db.organizationProfile.findUnique({ where: { organizationId: organizationId! }, select: { timezone: true } });
    let rentDue = new Prisma.Decimal(0), arrearsBroughtForward = new Prisma.Decimal(0), arrearsClosing = new Prisma.Decimal(0);
    try {
      if (leases.length > 200) throw new Error("This property exceeds the 200-lease statement limit.");
      for (const lease of leases) {
        if (lease.currency !== body.currency) throw new Error("All leases and payments must match the statement currency.");
        const leasePayments = await db.rentPayment.findMany({ where: { organizationId, leaseId: lease.id, paymentDate: { lte: new Date() }, ...ledgerPaymentPeriodWhere(lease.openingBalanceYear || body.statementYear, lease.openingBalanceMonth || body.statementMonth, body.statementYear, body.statementMonth) }, take: 5001 });
        if (leasePayments.length > 5000) throw new Error("This lease needs a recent verified opening balance before statement generation.");
        const ledger = calculateTenantLedger({ ...lease, payments: leasePayments, baseline: lease.openingBalance !== null && lease.openingBalanceVerifiedAt && lease.openingBalanceMonth && lease.openingBalanceYear ? { amount: lease.openingBalance, month: lease.openingBalanceMonth, year: lease.openingBalanceYear } : null, month: body.statementMonth, year: body.statementYear, timezone: organization?.timezone || "Africa/Lusaka" });
        rentDue = rentDue.plus(ledger.rentCharged);
        arrearsBroughtForward = arrearsBroughtForward.plus(Prisma.Decimal.max(0, ledger.openingBalance));
        arrearsClosing = arrearsClosing.plus(landlordClosingArrears([ledger]));
      }
    } catch (error) { return NextResponse.json({ success: false, error: `${error instanceof Error ? error.message : "Unable to verify the rental ledger."} Use Prepare tenant statement to verify the lease opening balance.` }, { status: 400 }); }
    const grossRentCollected = payments.reduce((sum, payment) => sum.plus(payment.amountPaid), new Prisma.Decimal(0));
    const maintenanceDeducted = expenses.reduce((sum, expense) => sum.plus(expense.amount), new Prisma.Decimal(0));
    const agencyFeeDeducted = grossRentCollected.mul(property.agencyCommissionPct ?? 10).div(100).toDecimalPlaces(2);
    const netPayout = grossRentCollected.minus(agencyFeeDeducted).minus(maintenanceDeducted);

    const statement = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${organizationId}:landlord:${body.propertyId}:${body.statementYear}:${body.statementMonth}`}, 0))`;
      const latest = await tx.landlordStatement.findFirst({ where: { organizationId, propertyId: body.propertyId, statementMonth: body.statementMonth, statementYear: body.statementYear }, orderBy: { revision: "desc" } });
      if (latest && !body.regenerate) return latest;
      return tx.landlordStatement.create({
      data: {
        organizationId: organizationId!,
        propertyId: body.propertyId,
        landlordName: property.ownerName || "Landlord",
        statementMonth: body.statementMonth,
        statementYear: body.statementYear,
        revision: (latest?.revision || 0) + 1,
        grossRentCollected: new Prisma.Decimal(grossRentCollected),
        rentDue,
        arrearsBroughtForward,
        arrearsClosing,
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
