import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createLeaseSchema } from "@/lib/validations";
import { smartCache } from "@/lib/cache";
import { Prisma } from "@prisma/client";
import type { ApiRouteContext } from "@/lib/api-handler";

const getHandler = createApiHandler({
  requirePermissions: ["leases.read"],
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
  requirePermissions: ["leases.manage"],
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

    if (property.listingType !== "FOR_RENT" && property.listingType !== "BOTH") {
      return NextResponse.json({ success: false, error: "Leases can only be created for rental properties." }, { status: 409 });
    }

    if (body.inquiryId) {
      const inquiry = await db.inquiry.findFirst({
        where: { id: body.inquiryId, organizationId, propertyId: body.propertyId, lookingFor: "FOR_RENT", status: "CLOSED", outcome: "WON" },
        select: { id: true },
      });
      if (!inquiry) return NextResponse.json({ success: false, error: "The rental inquiry is not a winning closed deal for this property." }, { status: 409 });
    }

    let lease;
    try {
      lease = await db.$transaction(async (tx) => {
      if (body.inquiryId) {
        const existingLease = await tx.lease.findUnique({
          where: { inquiryId: body.inquiryId },
          include: { property: { select: { title: true, slug: true, suburb: true } } },
        });
        if (existingLease) return existingLease;
      }

      const activeLease = await tx.lease.findFirst({
        where: { organizationId, propertyId: body.propertyId, status: { in: ["ACTIVE", "EXPIRING_SOON", "IN_ARREARS"] } },
        select: { id: true },
      });
      if (activeLease) {
        throw new Error("ACTIVE_LEASE_EXISTS");
      }

      const createdLease = await tx.lease.create({
      data: {
        organizationId: organizationId!,
        propertyId: body.propertyId,
        inquiryId: body.inquiryId || undefined,
        tenantName: body.tenantName,
        tenantPhone: body.tenantPhone,
        tenantEmail: body.tenantEmail || undefined,
        tenantIdNumber: body.tenantIdNumber || undefined,
        monthlyRent: new Prisma.Decimal(body.monthlyRent),
        currency: body.currency,
        depositAmount: new Prisma.Decimal(body.depositAmount),
        managementFeePercent: new Prisma.Decimal(body.managementFeePercent),
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
      await tx.property.update({
        where: { id: body.propertyId },
        data: { status: "RENTED" },
      });
      return createdLease;
    });
    } catch (error) {
      if (error instanceof Error && error.message === "ACTIVE_LEASE_EXISTS") {
        return NextResponse.json({ success: false, error: "This property already has an active lease." }, { status: 409 });
      }
      throw error;
    }

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

export async function GET(req: NextRequest, context: ApiRouteContext) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context: ApiRouteContext) {
  return postHandler(req, context);
}
