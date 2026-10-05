import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { smartCache } from "@/lib/cache";

const leaseActionSchema = z.object({
  action: z.enum(["TERMINATE", "RELIST"]),
  reason: z.string().trim().min(1).max(2000).optional(),
});

export const PATCH = createApiHandler({
  requirePermissions: ["leases.manage"],
  bodySchema: leaseActionSchema,
  handler: async (_req, { body, params, organizationId, userId }) => {
    const leaseId = typeof params?.id === "string" ? params.id : undefined;
    if (!leaseId || !organizationId || !userId) {
      return NextResponse.json({ success: false, error: "Lease and organization context are required." }, { status: 400 });
    }
    if (body.action === "TERMINATE" && !body.reason) {
      return NextResponse.json({ success: false, error: "A reason is required to cancel a lease." }, { status: 400 });
    }

    const lease = await db.lease.findFirst({ where: { id: leaseId, organizationId }, select: { id: true, propertyId: true, status: true } });
    if (!lease) return NextResponse.json({ success: false, error: "Lease not found." }, { status: 404 });

    if (body.action === "RELIST" && lease.status !== "TERMINATED") {
      return NextResponse.json({ success: false, error: "Cancel the lease before returning the property to market." }, { status: 409 });
    }

    const result = await db.$transaction(async (tx) => {
      if (body.action === "TERMINATE") {
        const updatedLease = await tx.lease.update({ where: { id: lease.id }, data: { status: "TERMINATED", terminatedAt: new Date() } });
        await tx.property.update({ where: { id: lease.propertyId }, data: { status: "AVAILABLE" } });
        await tx.auditLog.create({ data: { organizationId, userId, action: "LEASE_TERMINATED", entityType: "Lease", entityId: lease.id, details: { reason: body.reason } } });
        return updatedLease;
      }

      const property = await tx.property.update({ where: { id: lease.propertyId }, data: { status: "AVAILABLE" } });
      await tx.auditLog.create({ data: { organizationId, userId, action: "PROPERTY_RELISTED", entityType: "Property", entityId: property.id, details: { leaseId: lease.id } } });
      return property;
    });

    for (const tag of ["leases", "properties", "dashboard"] as const) smartCache.invalidateTag(organizationId, tag, tag === "leases" ? "/dashboard/leases" : undefined);
    return NextResponse.json({ success: true, action: body.action, result });
  },
});
