import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createPropertySchema, updatePropertySchema } from "@/lib/validations";
import { z } from "zod";

import { smartCache } from "@/lib/cache";

const getHandler = createApiHandler({
  requirePermissions: ["properties.read"],
  querySchema: z.object({
    org: z.string().optional(),
    search: z.string().optional(),
    listingType: z.string().optional(),
    propertyType: z.string().optional(),
    status: z.string().optional(),
    assigned: z.string().optional(), // "me" | "all"
    assignedAgentId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }).partial(),
  handler: async (req, ctx) => {
    const { organizationId, userId, query } = ctx;
    const { org, search, listingType, propertyType, status, assigned, assignedAgentId, page, limit } = query;

    if (process.env.NEXT_PUBLIC_DEV_MODE !== "true" && !org && !ctx.session) {
      return NextResponse.json(
        { success: false, error: "Missing required 'org' parameter in public request" },
        { status: 400 }
      );
    }

    const targetOrgId = ctx.session ? organizationId : org;
    if (!targetOrgId) {
      return NextResponse.json({ success: false, error: "Organization context required" }, { status: 403 });
    }

    const allowedStatuses = ["AVAILABLE", "UNDER_OFFER", "RENTED", "SOLD"];
    let statusFilter: any = { in: allowedStatuses };
    
    if (status) {
      const statuses = status.split(",").map(s => s.trim().toUpperCase());
      const validStatuses = statuses.filter(s => allowedStatuses.includes(s));
      if (validStatuses.length > 0) {
        statusFilter = { in: validStatuses };
      }
    }

    const whereClause: any = {
      organizationId: targetOrgId,
      status: statusFilter
    };

    if (assigned === "me" && userId) {
      whereClause.assignedAgentId = userId;
    } else if (assignedAgentId) {
      whereClause.assignedAgentId = assignedAgentId;
    }

    if (listingType && listingType !== "ALL") {
      whereClause.listingType = listingType;
    }
    if (propertyType && propertyType !== "ALL") {
      whereClause.propertyType = propertyType;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { suburb: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const take = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 50;
    const skip = (pageNum - 1) * take;

    const cacheKey = `props:${targetOrgId}:${listingType || "all"}:${status || "all"}:${search || "none"}:${pageNum}:${take}`;

    const { properties, total } = await smartCache.getOrSet(
      targetOrgId,
      "properties",
      cacheKey,
      async () => {
        const [items, count] = await Promise.all([
          db.property.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            select: {
              id: true,
              title: true,
              slug: true,
              ownershipType: true,
              propertyType: true,
              listingType: true,
              status: true,
              askingPrice: true,
              rentalPrice: true,
              currency: true,
              bedrooms: true,
              bathrooms: true,
              plotSizeSqm: true,
              description: true,
              photos: true,
              featuredPhoto: true,
              suburb: true,
              city: true,
              latitude: true,
              longitude: true,
              standBoundary: true,
              landmarkDirections: true,
              assignedAgentId: true,
              createdAt: true,
              updatedAt: true,
              assignedAgent: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  image: true,
                  email: true,
                }
              }
            }
          }),
          db.property.count({ where: whereClause })
        ]);

        return { properties: items, total: count };
      },
      60
    );

    return NextResponse.json(
      {
        success: true,
        properties,
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }
});

const postHandler = createApiHandler({
  requirePermissions: ["pwa.listings.create"],
  bodySchema: createPropertySchema,
  handler: async (req, ctx) => {
    const { organizationId, userId, body } = ctx;

    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const property = await db.property.create({
      data: {
        organizationId: organizationId!,
        title: body.title,
        slug,
        ownershipType: body.ownershipType,
        propertyType: body.propertyType,
        listingType: body.listingType,
        askingPrice: body.askingPrice,
        rentalPrice: body.rentalPrice,
        currency: body.currency,
        agencyCommissionPct: body.agencyCommissionPct,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        plotSizeSqm: body.plotSizeSqm,
        description: body.description,
        photos: body.photos || [],
        featuredPhoto: body.featuredPhoto || (body.photos && body.photos[0]) || undefined,
        suburb: body.suburb,
        city: body.city,
        latitude: body.latitude,
        longitude: body.longitude,
        landmarkDirections: body.landmarkDirections,
        ownerName: body.ownerName,
        ownerPhone: body.ownerPhone,
        ownerEmail: body.ownerEmail,
        ownerBankDetails: body.ownerBankDetails,
        titleDeedNumber: body.titleDeedNumber,
        createdById: userId!,
        assignedAgentId: body.assignedAgentId,
      }
    });

    // Record statutory mandate declaration in immutable AuditLog (ECT Act 2021 & Estate Agents Act Cap 187)
    await db.auditLog.create({
      data: {
        organizationId: organizationId!,
        userId,
        action: "PROPERTY_PUBLISHED_WITH_MANDATE_DECLARATION",
        entityType: "Property",
        entityId: property.id,
        details: {
          title: property.title,
          suburb: property.suburb,
          mandateType: body.mandateType || "SOLE_MANDATE",
          mandateReference: body.mandateReference || null,
          mandateDeclarationAgreed: true,
          statutoryFramework: "Estate Agents Act Cap 187 & Penal Code Cap 87",
        },
      },
    });

    // Invalidate tenant cache tags for instant UI consistency
    smartCache.invalidateTag(organizationId!, "properties", "/dashboard/properties");
    smartCache.invalidateTag(organizationId!, "dashboard-metrics");
    smartCache.invalidateTag(organizationId!, "dashboard-action-queue");

    return NextResponse.json({ success: true, property });
  }
});

const patchHandler = createApiHandler({
  requirePermissions: ["properties.update"],
  bodySchema: updatePropertySchema,
  handler: async (req, ctx) => {
    const { body } = ctx;
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Property ID is required for updating." },
        { status: 400 }
      );
    }

    const property = await db.property.update({
      where: { id },
      data: {
        title: updateData.title,
        suburb: updateData.suburb,
        city: updateData.city,
        listingType: updateData.listingType,
        ownershipType: updateData.ownershipType,
        propertyType: updateData.propertyType,
        status: updateData.status,
        askingPrice: updateData.askingPrice,
        rentalPrice: updateData.rentalPrice,
        currency: updateData.currency,
        bedrooms: updateData.bedrooms,
        bathrooms: updateData.bathrooms,
        plotSizeSqm: updateData.plotSizeSqm,
        landmarkDirections: updateData.landmarkDirections,
        description: updateData.description,
        photos: updateData.photos,
        featuredPhoto: updateData.featuredPhoto,
        assignedAgentId: updateData.assignedAgentId,
      }
    });

    // Invalidate tenant cache tags
    if (ctx.organizationId) {
      smartCache.invalidateTag(ctx.organizationId, "properties", "/dashboard/properties");
      smartCache.invalidateTag(ctx.organizationId, "dashboard-metrics");
    }

    return NextResponse.json({
      success: true,
      message: `Property ${id} updated successfully.`,
      property
    });
  }
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context?: any) {
  return postHandler(req, context);
}

export async function PATCH(req: NextRequest, context?: any) {
  return patchHandler(req, context);
}
