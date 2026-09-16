import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createPropertySchema, updatePropertySchema } from "@/lib/validations";
import { z } from "zod";

import { smartCache } from "@/lib/cache";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

const getHandler = createApiHandler({
  requireAuth: false,
  querySchema: z.object({
    org: z.string().optional(),
    search: z.string().optional(),
    suburb: z.string().optional(),
    listingType: z.string().optional(),
    propertyType: z.string().optional(),
    status: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    assigned: z.string().optional(), // "me" | "all"
    assignedAgentId: z.string().optional(),
    sortBy: z.enum(["date", "price", "bedrooms", "title"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }).partial(),
  handler: async (req, ctx) => {
    const { organizationId, userId, query } = ctx;
    const {
      org,
      search,
      suburb,
      listingType,
      propertyType,
      status,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      assigned,
      assignedAgentId,
      sortBy = "date",
      sortOrder = "desc",
      page,
      limit,
    } = query;

    // 1. Resolve target organization context (by ID or Slug)
    let targetOrgId: string | null = null;
    let targetOrgData: { id: string; name: string; slug: string } | null = null;

    if (org) {
      const found = await db.organization.findFirst({
        where: {
          OR: [{ id: org }, { slug: org }],
        },
        select: { id: true, name: true, slug: true },
      });
      if (found) {
        targetOrgId = found.id;
        targetOrgData = found;
      } else {
        return NextResponse.json(
          { success: false, error: `Organization '${org}' not found.` },
          { status: 404, headers: CORS_HEADERS }
        );
      }
    } else if (organizationId) {
      targetOrgId = organizationId;
      const found = await db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, slug: true },
      });
      if (found) targetOrgData = found;
    } else {
      // Fallback to primary active agency organization
      const defaultOrg = await db.organization.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, slug: true },
      });
      if (defaultOrg) {
        targetOrgId = defaultOrg.id;
        targetOrgData = defaultOrg;
      }
    }

    if (!targetOrgId) {
      return NextResponse.json(
        { success: false, error: "Organization context required. Pass ?org=<your-agency-slug-or-id>" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 2. Status filtering
    const allowedStatuses = ["AVAILABLE", "UNDER_OFFER", "RENTED", "SOLD"];
    let statusFilter: any = { in: ["AVAILABLE"] }; // Default to public AVAILABLE listings
    
    if (status) {
      if (status.toUpperCase() === "ALL") {
        statusFilter = { in: allowedStatuses };
      } else {
        const statuses = status.split(",").map((s) => s.trim().toUpperCase());
        const validStatuses = statuses.filter((s) => allowedStatuses.includes(s));
        if (validStatuses.length > 0) {
          statusFilter = { in: validStatuses };
        }
      }
    }

    const whereClause: any = {
      organizationId: targetOrgId,
      status: statusFilter,
    };

    if (assigned === "me" && userId) {
      whereClause.assignedAgentId = userId;
    } else if (assignedAgentId) {
      whereClause.assignedAgentId = assignedAgentId;
    }

    if (listingType && listingType !== "ALL") {
      const upper = listingType.trim().toUpperCase();
      if (upper === "SALE" || upper === "FOR_SALE") {
        whereClause.listingType = "FOR_SALE";
      } else if (upper === "RENT" || upper === "FOR_RENT") {
        whereClause.listingType = "FOR_RENT";
      } else if (upper === "BOTH") {
        whereClause.listingType = "BOTH";
      }
    }
    if (propertyType && propertyType !== "ALL") {
      const upper = propertyType.trim().toUpperCase();
      const typeMap: Record<string, string> = {
        HOUSE: "STANDALONE_HOUSE",
        STANDALONE: "STANDALONE_HOUSE",
        STANDALONE_HOUSE: "STANDALONE_HOUSE",
        RESIDENTIAL: "STANDALONE_HOUSE",
        APARTMENT: "APARTMENT",
        FLAT: "APARTMENT",
        OFFICE: "COMMERCIAL_OFFICE",
        COMMERCIAL: "COMMERCIAL_OFFICE",
        COMMERCIAL_OFFICE: "COMMERCIAL_OFFICE",
        WAREHOUSE: "WAREHOUSE",
        INDUSTRIAL: "WAREHOUSE",
        LAND: "VACANT_LAND_PLOT",
        PLOT: "VACANT_LAND_PLOT",
        VACANT_LAND_PLOT: "VACANT_LAND_PLOT",
        FARM: "FARM_AGRICULTURAL",
        AGRICULTURAL: "FARM_AGRICULTURAL",
        FARM_AGRICULTURAL: "FARM_AGRICULTURAL",
      };
      if (typeMap[upper]) {
        whereClause.propertyType = typeMap[upper];
      }
    }
    if (suburb) {
      whereClause.suburb = { contains: suburb, mode: "insensitive" };
    }
    if (bedrooms) {
      const b = parseInt(bedrooms, 10);
      if (!isNaN(b)) whereClause.bedrooms = { gte: b };
    }
    if (bathrooms) {
      const b = parseInt(bathrooms, 10);
      if (!isNaN(b)) whereClause.bathrooms = { gte: b };
    }

    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { suburb: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        andConditions.push({
          OR: [
            { askingPrice: { gte: min } },
            { rentalPrice: { gte: min } },
          ],
        });
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        andConditions.push({
          OR: [
            { askingPrice: { lte: max } },
            { rentalPrice: { lte: max } },
          ],
        });
      }
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    // 3. Sorting & Ordering
    const validSortOrder: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";
    let orderBy: any = { createdAt: validSortOrder };

    if (sortBy === "price") {
      if (listingType === "RENT") {
        orderBy = { rentalPrice: validSortOrder };
      } else if (listingType === "SALE") {
        orderBy = { askingPrice: validSortOrder };
      } else {
        orderBy = [
          { askingPrice: validSortOrder },
          { rentalPrice: validSortOrder },
        ];
      }
    } else if (sortBy === "bedrooms") {
      orderBy = { bedrooms: validSortOrder };
    } else if (sortBy === "title") {
      orderBy = { title: validSortOrder };
    } else {
      orderBy = { createdAt: validSortOrder };
    }

    // 4. Pagination
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const take = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;
    const skip = (pageNum - 1) * take;

    const cacheKey = `props:${targetOrgId}:${listingType || "all"}:${status || "all"}:${search || "none"}:${suburb || "none"}:${sortBy}:${validSortOrder}:${pageNum}:${take}`;

    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://contour.banyalabs.com").replace(/\/$/, "");

    const { rawProperties, total } = await smartCache.getOrSet(
      targetOrgId,
      "properties",
      cacheKey,
      async () => {
        const [items, count] = await Promise.all([
          db.property.findMany({
            where: whereClause,
            orderBy,
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
                },
              },
            },
          }),
          db.property.count({ where: whereClause }),
        ]);

        return { rawProperties: items, total: count };
      },
      60
    );

    const properties = rawProperties.map((p) => ({
      ...p,
      publicUrl: `${siteUrl}/p/${p.slug || p.id}`,
    }));

    const totalPages = Math.ceil(total / take);

    return NextResponse.json(
      {
        success: true,
        agency: targetOrgData
          ? {
              id: targetOrgData.id,
              name: targetOrgData.name,
              slug: targetOrgData.slug,
            }
          : null,
        organization: targetOrgData
          ? {
              id: targetOrgData.id,
              name: targetOrgData.name,
              slug: targetOrgData.slug,
            }
          : null,
        properties,
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      {
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  },
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
