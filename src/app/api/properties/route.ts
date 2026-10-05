import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createPropertySchema, updatePropertySchema } from "@/lib/validations";
import { resolveCommissionPct } from "@/lib/commission-policy";
import { isManagementRole } from "@/lib/authorization";
import { z } from "zod";

import { smartCache } from "@/lib/cache";
import { buildInquiryMatchingProfile } from "@/lib/matching/inquiry-profile";
import { buildPropertyMatchingCandidate } from "@/lib/matching/property-profile";
import { isQualifyingMatch, TERMINAL_INQUIRY_STATUSES } from "@/lib/matching/policy";
import { inquirySelect } from "@/lib/matching/service";
import { inquiryVisibility } from "@/lib/matching/visibility";
import { matchingScope } from "@/lib/matching/api";
import { reconcileMatchNotifications } from "@/lib/matching/inquiry-match-notifications";
import { PROPERTY_MATCH_THRESHOLD, scorePropertyForInquiry } from "@/lib/matching/score";
import { propertySlugFromTitle, publicPropertyPath } from "@/lib/public-property";
import { Prisma, type PropertyStatus, type PropertyType } from "@prisma/client";
import type { ApiRouteContext } from "@/lib/api-handler";
import { canChangePropertyAgent, getPropertyAgentLockExpiry } from "@/lib/property-agent-lock";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

const getHandler = createApiHandler({
  requireAuth: false,
  querySchema: z.object({
    includeMatching: z.enum(["true", "false"]).optional(),
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

    if (userId && targetOrgId !== organizationId) return NextResponse.json({ success: false, error: "Workspace access denied" }, { status: 403 });

    // 2. Status filtering
    const allowedStatuses: PropertyStatus[] = ["AVAILABLE", "UNDER_OFFER", "RENTED", "SOLD"];
    let statusFilter: Prisma.PropertyWhereInput["status"] = { in: ["AVAILABLE"] }; // Default to public AVAILABLE listings
    
    if (status && !isPublicRequest) {
      if (status.toUpperCase() === "ALL") {
        statusFilter = { in: allowedStatuses.filter((value) => value !== "SOLD") };
      } else {
        const statuses = status.split(",").map((s) => s.trim().toUpperCase());
        const validStatuses = statuses.filter((s): s is PropertyStatus => allowedStatuses.includes(s as PropertyStatus));
        if (validStatuses.length > 0) {
          statusFilter = { in: validStatuses };
        }
      }
    }

    const whereClause: Prisma.PropertyWhereInput = {
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
      const typeMap: Record<string, PropertyType> = {
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

    const andConditions: Prisma.PropertyWhereInput[] = [];

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
    let orderBy: Prisma.PropertyOrderByWithRelationInput | Prisma.PropertyOrderByWithRelationInput[] = { createdAt: validSortOrder };

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

    const cacheKey = `props:${targetOrgId}:${isPublicRequest ? "public" : "internal"}:${JSON.stringify(whereClause)}:${JSON.stringify(orderBy)}:${pageNum}:${take}`;

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
              landmarkDirections: true,
              assignedAgentId: true,
              assignedAgentAt: true,
              assignedAgentLockExpiresAt: true,
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
              organization: { select: { slug: true } },
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
      publicUrl: publicPropertyPath(targetOrgData?.slug || targetOrgData?.id || "organization", p.slug || p.id),
    }));

    // Matching is persisted inquiry/property data, not a client-side demo
    // alert store. Only expose match details to authenticated workspace users.
    if (!isPublicRequest && query.includeMatching !== "false" && (ctx.permissions?.includes("leads.read") || ctx.permissions?.includes("pwa.inquiries.read"))) {
      const inquiries = await db.inquiry.findMany({
        where: { ...inquiryVisibility(matchingScope(ctx)), propertyId: null, status: { notIn: [...TERMINAL_INQUIRY_STATUSES] } },
        select: inquirySelect,
      });

      for (const property of properties) {
        const matches = inquiries.map((inquiry) => {
          const result = scorePropertyForInquiry(buildInquiryMatchingProfile(inquiry), buildPropertyMatchingCandidate(property));
          return property.status === "AVAILABLE" && isQualifyingMatch(result) ? { inquiry, score: result.score, reasons: result.reasons } : null;
        }).filter((match): match is { inquiry: typeof inquiries[number]; score: number; reasons: string[] } => Boolean(match)).map(({ inquiry, score, reasons }) => ({
          id: inquiry.id,
          clientName: inquiry.clientName,
          clientPhone: inquiry.clientPhone,
          lookingFor: inquiry.lookingFor,
          currency: inquiry.currency,
          budgetMax: inquiry.budgetMax ? Number(inquiry.budgetMax) : null,
          preferredSuburbs: inquiry.preferredSuburbs,
          assignedAgentId: inquiry.assignedAgentId,
          isAssigned: inquiry.propertyId === property.id,
          score,
          reasons,
        }));

        Object.assign(property, { matchingInquiries: matches, matchingInquiryCount: matches.length });
      }
    }

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
        capabilities: {
          canOverrideCommission: isManagementRole(ctx.contourRole),
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

    if (body.agencyCommissionPct !== undefined && !isManagementRole(ctx.contourRole)) {
      return NextResponse.json(
        { success: false, error: "Only owners and broker managers can set commission percentages." },
        { status: 403 },
      );
    }

    const agencyCommissionPct = resolveCommissionPct({
      listingType: body.listingType ?? "FOR_SALE",
      requestedPct: body.agencyCommissionPct,
      canOverride: isManagementRole(ctx.contourRole),
    });

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

    const baseSlug = propertySlugFromTitle(body.title);

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
      `${body.title} - ${body.listingType === "FOR_SALE" ? "For Sale" : "For Rent"} in ${body.suburb || body.city || "the selected location"}.${body.bedrooms ? ` ${body.bedrooms} beds, ${body.bathrooms || 1} baths.` : ""}${body.plotSizeSqm ? ` Plot size: ${body.plotSizeSqm} m².` : ""}${body.landmarkDirections ? ` Located near ${body.landmarkDirections}.` : ""}`.trim();

    const effectiveLat = typeof body.latitude === "number" && !isNaN(body.latitude) ? body.latitude : undefined;
    const effectiveLng = typeof body.longitude === "number" && !isNaN(body.longitude) ? body.longitude : undefined;

    let property;
    try {
      property = await db.property.create({
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
        agencyCommissionPct,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        plotSizeSqm: body.plotSizeSqm,
        description: effectiveDescription,
        photos: body.photos || [],
        featuredPhoto: body.featuredPhoto || (body.photos && body.photos[0]) || undefined,
        suburb: body.suburb,
        city: body.city || "",
        latitude: effectiveLat,
        longitude: effectiveLng,
        landmarkDirections: body.landmarkDirections,
        ownerName: body.ownerName,
        ownerPhone: body.ownerPhone,
        ownerEmail: body.ownerEmail,
        ownerBankDetails: body.ownerBankDetails,
        titleDeedNumber: body.titleDeedNumber,
        createdById: effectiveUserId!,
         assignedAgentId: effectiveAssignedAgentId,
         assignedAgentAt: effectiveAssignedAgentId ? new Date() : null,
         assignedAgentLockExpiresAt: effectiveAssignedAgentId ? getPropertyAgentLockExpiry(new Date()) : null,
        }
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "P2002") {
        return NextResponse.json(
          { success: false, error: `The property name "${body.title.trim()}" is already taken in your agency workspace.` },
          { status: 409, headers: CORS_HEADERS },
        );
      }
      throw error;
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
    if (property.status === "AVAILABLE") await reconcileMatchNotifications(organizationId!, { propertyId: property.id });

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

    if (updateData.agencyCommissionPct !== undefined && !isManagementRole(ctx.contourRole)) {
      return NextResponse.json(
        { success: false, error: "Only owners and broker managers can change commission percentages." },
        { status: 403 },
      );
    }

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

    if (updateData.title !== undefined) {
      const duplicateProperty = await db.property.findFirst({
        where: {
          organizationId: ctx.organizationId,
          id: { not: id },
          title: { equals: updateData.title.trim(), mode: "insensitive" },
        },
        select: { title: true },
      });
      if (duplicateProperty) {
        return NextResponse.json(
          {
            success: false,
            error: `The property name "${duplicateProperty.title}" is already taken in your agency workspace.`,
          },
          { status: 409, headers: CORS_HEADERS },
        );
      }
    }

    const existingProperty = await db.property.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true, status: true, assignedAgentId: true, assignedAgentLockExpiresAt: true },
    });
    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "Property not found." },
        { status: 404 },
      );
    }

    if (existingProperty.status === "SOLD" && updateData.status && updateData.status !== "SOLD") {
      return NextResponse.json({ success: false, error: "Sold properties cannot be reopened. Create a new listing if this sale was entered in error." }, { status: 409 });
    }

    const isAgentChange = updateData.assignedAgentId !== undefined && updateData.assignedAgentId !== existingProperty.assignedAgentId;
    if (isAgentChange && !canChangePropertyAgent(existingProperty.assignedAgentLockExpiresAt)) {
      return NextResponse.json({ success: false, error: "This property is locked to its assigned agent for 30 days.", lockExpiresAt: existingProperty.assignedAgentLockExpiresAt }, { status: 409 });
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
        agencyCommissionPct: updateData.agencyCommissionPct,
        bedrooms: updateData.bedrooms,
        bathrooms: updateData.bathrooms,
        plotSizeSqm: updateData.plotSizeSqm,
        landmarkDirections: updateData.landmarkDirections,
        description: updateData.description !== undefined ? (updateData.description ?? "") : undefined,
        photos: updateData.photos,
        featuredPhoto: updateData.featuredPhoto,
        titleDeedNumber: updateData.titleDeedNumber,
         assignedAgentId: updateData.assignedAgentId,
         ...(isAgentChange && updateData.assignedAgentId ? {
           assignedAgentAt: new Date(),
           assignedAgentLockExpiresAt: getPropertyAgentLockExpiry(new Date()),
         } : updateData.assignedAgentId === null ? {
           assignedAgentAt: null,
           assignedAgentLockExpiresAt: null,
         } : {}),
      }
    });

    await reconcileMatchNotifications(ctx.organizationId!, { propertyId: property.id });

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

export async function GET(req: NextRequest, context: ApiRouteContext) {
  return getHandler(req, context);
}

export async function POST(req: NextRequest, context: ApiRouteContext) {
  return postHandler(req, context);
}

export async function PATCH(req: NextRequest, context: ApiRouteContext) {
  return patchHandler(req, context);
}

export const DELETE = createApiHandler({
  requirePermissions: ["properties.archive"],
  handler: async (req, ctx) => {
    const id = req.nextUrl.searchParams.get("id") || undefined;
    if (!id) return NextResponse.json({ success: false, error: "Property id is required." }, { status: 400 });

    const property = await db.property.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true, title: true, status: true },
    });
    if (!property) return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });

    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          organizationId: ctx.organizationId!,
          userId: ctx.userId,
          action: "PROPERTY_ARCHIVED",
          entityType: "Property",
          entityId: property.id,
          details: { title: property.title, status: property.status },
        },
      });
      await tx.property.update({
        where: { id: property.id },
        data: { status: "ARCHIVED" },
      });
    });

    await reconcileMatchNotifications(ctx.organizationId!, { propertyId: property.id });
    smartCache.invalidateTag(ctx.organizationId!, "properties");
    smartCache.invalidateTag(ctx.organizationId!, "dashboard-metrics");
    return NextResponse.json({ success: true });
  },
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
