import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

function param(params: Record<string, string | string[]> | undefined, key: string) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export const POST = createApiHandler({
  requirePermissions: ["rental.fees.manage"],
  handler: async (_request, ctx) => {
    const propertyId = param(ctx.params, "id");
    const configId = param(ctx.params, "configId");
    if (!propertyId || !configId || !ctx.organizationId || !ctx.userId) return NextResponse.json({ success: false, error: "Property, configuration and organization context are required." }, { status: 400 });

    const configuration = await db.$transaction(async (tx) => {
      const existing = await tx.propertyRentalCommissionConfig.findFirst({
        where: { id: configId, propertyId, organizationId: ctx.organizationId },
        select: { id: true, status: true, mode: true, revision: true },
      });
      if (!existing) return null;
      if (existing.status === "APPROVED") return existing;

      await tx.propertyRentalCommissionConfig.updateMany({
        where: { organizationId: ctx.organizationId!, propertyId, status: "APPROVED", id: { not: configId } },
        data: { status: "SUPERSEDED" },
      });
      const approved = await tx.propertyRentalCommissionConfig.update({
        where: { id: configId },
        data: { status: "APPROVED", approvedById: ctx.userId, approvedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          organizationId: ctx.organizationId!,
          userId: ctx.userId!,
          action: "RENTAL_COMMISSION_CONFIGURATION_APPROVED",
          entityType: "PropertyRentalCommissionConfig",
          entityId: approved.id,
          details: { propertyId, revision: approved.revision, mode: approved.mode },
        },
      });
      return approved;
    });

    if (!configuration) return NextResponse.json({ success: false, error: "Rental commission configuration not found." }, { status: 404 });
    return NextResponse.json({ success: true, configuration }, { headers: { "Cache-Control": "private, no-store" } });
  },
});
