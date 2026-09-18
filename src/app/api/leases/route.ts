import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createLeaseSchema } from "@/lib/validations";
import { smartCache } from "@/lib/cache";

const getHandler = createApiHandler({
  handler: async (req, ctx) => {
    const { organizationId } = ctx;

    const leases = await db.lease.findMany({
      where: { organizationId },
      include: {
        property: {
          select: {
            title: true,
            slug: true,
            suburb: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, leases });
  }
});

const postHandler = createApiHandler({
  bodySchema: createLeaseSchema,
  handler: async (req, ctx) => {
    const { organizationId, body } = ctx;

    const property = await db.property.findFirst({
      where: {
        id: body.propertyId,
        organizationId
      }
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found or access denied." },
        { status: 404 }
      );
    }

    const lease = await db.lease.create({
      data: {
        organizationId: organizationId!,
        propertyId: body.propertyId,
        tenantName: body.tenantName,
        tenantPhone: body.tenantPhone,
        tenantEmail: body.tenantEmail || undefined,
        tenantIdNumber: body.tenantIdNumber || undefined,
        monthlyRent: body.monthlyRent as any,
        currency: body.currency,
        depositAmount: body.depositAmount as any,
        managementFeePercent: body.managementFeePercent as any,
        leaseStartDate: new Date(body.leaseStartDate),
        leaseEndDate: new Date(body.leaseEndDate),
        paymentDayOfMonth: body.paymentDayOfMonth,
        status: "ACTIVE"
      },
      include: {
        property: {
          select: {
            title: true,
            slug: true,
            suburb: true,
          }
        }
      }
    });

    // Mark the property as RENTED
    await db.property.update({
      where: { id: body.propertyId },
      data: { status: "RENTED" },
    });

    // Invalidate lease and property caches across all surfaces
    if (organizationId) {
      smartCache.invalidateTag(organizationId, "leases", "/dashboard/leases");
      smartCache.invalidateTag(organizationId, "properties", "/dashboard/properties");
      smartCache.invalidateTag(organizationId, "properties", "/agent");
      smartCache.invalidateTag(organizationId, "properties", "/dashboard/map");
      smartCache.invalidateTag(organizationId, "dashboard-metrics");
      smartCache.invalidateTag(organizationId, "dashboard-action-queue");
    }

    return NextResponse.json({ success: true, lease });
  }
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context?: any) {
  return postHandler(req, context);
}
