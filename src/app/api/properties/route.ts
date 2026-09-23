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

    const isPublicRequest = !userId;

    if (org) {
      const found = await db.organization.findFirst({
        where: {
          ...(isPublicRequest ? { slug: org } : { OR: [{ id: org }, { slug: org }] }),
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
      // If user is authenticated, look up their active agency organization
      if (userId) {
        const member = await db.member.findFirst({
          where: { userId, status: "active" },
          select: { organization: { select: { id: true, name: true, slug: true } } },
          orderBy: { createdAt: "desc" },
        });
        if (member?.organization) {
          targetOrgId = member.organization.id;
          targetOrgData = member.organization;
        }
      }

      // Public callers must name the organization by its public slug. Never
      // select a default tenant: that leaks whichever organization's listings
      // happens to be oldest in the database.
      if (!targetOrgId && isPublicRequest) {
        return NextResponse.json(
          { success: false, error: "Organization slug required for public listings." },
          { status: 400, headers: CORS_HEADERS },
        );
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
    
    if (status && !isPublicRequest) {
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

    // Public catalogue responses are always limited to available inventory;
    // internal status views and assignment filters require a signed-in tenant.
    if (isPublicRequest) {
      whereClause.status = { in: ["AVAILABLE"] };
    }

    if (!isPublicRequest && assigned === "me" && userId) {
      whereClause.assignedAgentId = userId;
    } else if (!isPublicRequest && assignedAgentId) {
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
    const take = limit
      ? Math.min(isPublicRequest ? 50 : 500, Math.max(1, parseInt(limit, 10)))
      : 50;
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
  requirePermissions: ["properties.create"],
  bodySchema: createPropertySchema,
  handler: async (req, ctx) => {
    const { organizationId, userId, body } = ctx;

    // Enforce unique property titles within the same organization context
    const duplicateProperty = await db.property.findFirst({
      where: {
        organizationId: organizationId!,
        title: { equals: body.title.trim(), mode: "insensitive" },
      },
      select: { id: true, title: true },
    });
    if (duplicateProperty) {
      return NextResponse.json(
        {
          success: false,
          error: `A property named "${duplicateProperty.title}" already exists in your agency workspace. Each property listing title must be unique.`,
        },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    const existingWithSlug = await db.property.findFirst({
      where: { organizationId: organizationId!, slug },
      select: { id: true },
    });
    if (existingWithSlug) {
      slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    // Resolve valid user foreign key to guarantee relational integrity across dev & prod
    let effectiveUserId = userId;
    if (userId) {
      const authorExists = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!authorExists) {
        const fallbackUser = await db.user.findFirst({ select: { id: true } });
        if (fallbackUser) effectiveUserId = fallbackUser.id;
      }
    } else {
      const fallbackUser = await db.user.findFirst({ select: { id: true } });
      if (fallbackUser) effectiveUserId = fallbackUser.id;
    }

    let effectiveAssignedAgentId = body.assignedAgentId || undefined;
    if (effectiveAssignedAgentId) {
      const agentExists = await db.user.findUnique({ where: { id: effectiveAssignedAgentId }, select: { id: true } });
      if (!agentExists) effectiveAssignedAgentId = effectiveUserId || undefined;
    } else {
      effectiveAssignedAgentId = effectiveUserId || undefined;
    }

    const effectiveDescription =
      body.description?.trim() ||
      `${body.title} - ${body.listingType === "FOR_SALE" ? "For Sale" : "For Rent"} in ${body.suburb || "Lusaka"}.${body.bedrooms ? ` ${body.bedrooms} beds, ${body.bathrooms || 1} baths.` : ""}${body.plotSizeSqm ? ` Plot size: ${body.plotSizeSqm} m².` : ""}${body.landmarkDirections ? ` Located near ${body.landmarkDirections}.` : ""}`.trim();

    const effectiveLat = typeof body.latitude === "number" && !isNaN(body.latitude) ? body.latitude : undefined;
    const effectiveLng = typeof body.longitude === "number" && !isNaN(body.longitude) ? body.longitude : undefined;

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
        description: effectiveDescription,
        photos: body.photos || [],
        featuredPhoto: body.featuredPhoto || (body.photos && body.photos[0]) || undefined,
        suburb: body.suburb,
        city: body.city || "Lusaka",
        latitude: effectiveLat,
        longitude: effectiveLng,
        landmarkDirections: body.landmarkDirections,
        ownerName: body.ownerName,
        ownerPhone: body.ownerPhone,
        ownerEmail: body.ownerEmail,
        ownerBankDetails: body.ownerBankDetails,
        titleDeedNumber: body.titleDeedNumber,
        standBoundary: body.standBoundary || undefined,
        createdById: effectiveUserId!,
        assignedAgentId: effectiveAssignedAgentId,
      }
    });

    // If stand boundaries were extracted from an uploaded title deed, establish PropertyBoundary & link VaultDocument
    if (body.standBoundary && Array.isArray(body.standBoundary) && body.standBoundary.length >= 3) {
      try {
        const ringCoordinates = [...body.standBoundary, body.standBoundary[0]].map(([lat, lng]: [number, number]) => [lng, lat]);
        const geoJson = {
          type: "Polygon" as const,
          coordinates: [ringCoordinates],
        };

        let sourceDocId: string | null = null;
        if (body.titleDeedDocumentId) {
          const doc = await db.vaultDocument.findFirst({
            where: { id: body.titleDeedDocumentId, organizationId: organizationId! },
          });
          if (doc) {
            sourceDocId = doc.id;
            await db.vaultDocument.update({
              where: { id: doc.id },
              data: { propertyId: property.id },
            });
          }
        }

        const boundary = await db.propertyBoundary.create({
          data: {
            organizationId: organizationId!,
            propertyId: property.id,
            sourceType: "TITLE_DEED",
            status: "PENDING",
            geometryGeoJson: geoJson,
            sourceDocumentId: sourceDocId,
            statedAreaSqm: body.plotSizeSqm ? body.plotSizeSqm : null,
            createdById: effectiveUserId!,
            confidenceScore: 0.95,
          },
        });

        await db.boundaryEvidenceEvent.create({
          data: {
            organizationId: organizationId!,
            propertyId: property.id,
            boundaryId: boundary.id,
            eventType: "BOUNDARY_CREATED",
            actorId: effectiveUserId!,
            details: {
              sourceType: "TITLE_DEED",
              sourceDocumentId: sourceDocId,
              extractedVia: "OCR",
              beaconCount: body.standBoundary.length,
            },
          },
        });
      } catch (boundaryErr) {
        console.error("[BOUNDARY_PERSISTENCE_WARNING]", boundaryErr);
      }
    }

    // Record statutory mandate declaration in immutable AuditLog (ECT Act 2021 & Estate Agents Act Cap 187)
    await db.auditLog.create({
      data: {
        organizationId: organizationId!,
        userId: effectiveUserId,
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

    // Invalidate tenant cache tags for instant UI consistency across all surfaces
    smartCache.invalidateTag(organizationId!, "properties", "/dashboard/properties");
    smartCache.invalidateTag(organizationId!, "properties", "/agent");
    smartCache.invalidateTag(organizationId!, "properties", "/dashboard/map");
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

    if (!ctx.organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization context required." },
        { status: 403 },
      );
    }

    const existingProperty = await db.property.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Property not found." },
        { status: 404 },
      );
    }

    const property = await db.property.update({
      where: { id: existingProperty.id },
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
        description: updateData.description !== undefined ? (updateData.description ?? "") : undefined,
        photos: updateData.photos,
        featuredPhoto: updateData.featuredPhoto,
        titleDeedNumber: updateData.titleDeedNumber,
        standBoundary: updateData.standBoundary !== undefined ? (updateData.standBoundary as any) : undefined,
        assignedAgentId: updateData.assignedAgentId,
      }
    });

    // Invalidate tenant cache tags across all surfaces
    if (ctx.organizationId) {
      smartCache.invalidateTag(ctx.organizationId, "properties", "/dashboard/properties");
      smartCache.invalidateTag(ctx.organizationId, "properties", "/agent");
      smartCache.invalidateTag(ctx.organizationId, "properties", "/dashboard/map");
      smartCache.invalidateTag(ctx.organizationId, "dashboard-metrics");
      smartCache.invalidateTag(ctx.organizationId, "dashboard-action-queue");
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
