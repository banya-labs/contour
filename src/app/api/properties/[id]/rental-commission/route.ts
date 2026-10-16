import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { rentalPropertyCommissionSchema } from "@/lib/property-finance/rental-commission";

function propertyIdFromParams(params?: Record<string, string | string[]>) {
  const value = params?.id;
  return Array.isArray(value) ? value[0] : value;
}

export const GET = createApiHandler({
  requirePermissions: ["properties.read"],
  handler: async (_request, ctx) => {
    const propertyId = propertyIdFromParams(ctx.params);
    if (!propertyId || !ctx.organizationId) return NextResponse.json({ success: false, error: "Property is required." }, { status: 400 });

    const property = await db.property.findFirst({
      where: { id: propertyId, organizationId: ctx.organizationId, listingType: { in: ["FOR_RENT", "BOTH"] } },
      select: { id: true, listingType: true, currency: true, rentalPrice: true },
    });
    if (!property) return NextResponse.json({ success: false, error: "Rental property not found." }, { status: 404 });

    const configurations = await db.propertyRentalCommissionConfig.findMany({
      where: { organizationId: ctx.organizationId, propertyId },
      orderBy: [{ revision: "desc" }],
      take: 50,
    });
    return NextResponse.json({ success: true, property, configurations }, { headers: { "Cache-Control": "private, no-store" } });
  },
});

export const POST = createApiHandler({
  requirePermissions: ["rental.fees.manage"],
  bodySchema: rentalPropertyCommissionSchema,
  handler: async (_request, ctx) => {
    const propertyId = propertyIdFromParams(ctx.params);
    if (!propertyId || !ctx.organizationId || !ctx.userId) return NextResponse.json({ success: false, error: "Property and organization context are required." }, { status: 400 });

    const property = await db.property.findFirst({
      where: { id: propertyId, organizationId: ctx.organizationId, listingType: { in: ["FOR_RENT", "BOTH"] } },
      select: { id: true, currency: true },
    });
    if (!property) return NextResponse.json({ success: false, error: "Rental property not found." }, { status: 404 });
    if (property.currency !== ctx.body.currency) return NextResponse.json({ success: false, error: "Commission currency must match the rental property's currency." }, { status: 400 });

    const configuration = await db.$transaction(async (tx) => {
      const latest = await tx.propertyRentalCommissionConfig.findFirst({
        where: { organizationId: ctx.organizationId!, propertyId },
        orderBy: { revision: "desc" },
        select: { revision: true },
      });
      const saved = await tx.propertyRentalCommissionConfig.create({
        data: {
          organizationId: ctx.organizationId!,
          propertyId,
          revision: (latest?.revision ?? 0) + 1,
          mode: ctx.body.mode,
          basis: ctx.body.calculation,
          fixedAmount: ctx.body.fixedAmount,
          monthsOfRent: ctx.body.monthsOfRent,
          percentage: ctx.body.percentage,
          durationMonths: ctx.body.durationMonths,
          untilLeaseEnd: ctx.body.untilLeaseEnd ?? false,
          currency: ctx.body.currency,
          effectiveFrom: new Date(`${ctx.body.effectiveFrom}T00:00:00.000Z`),
          evidenceReference: ctx.body.evidenceReference,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: ctx.organizationId!,
          userId: ctx.userId!,
          action: "RENTAL_COMMISSION_CONFIGURATION_CREATED",
          entityType: "PropertyRentalCommissionConfig",
          entityId: saved.id,
          details: { propertyId, revision: saved.revision, mode: saved.mode },
        },
      });
      return saved;
    });

    return NextResponse.json({ success: true, configuration }, { headers: { "Cache-Control": "private, no-store" } });
  },
});
