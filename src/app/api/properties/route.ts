import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { createPropertySchema, updatePropertySchema } from "@/lib/validations";
import { z } from "zod";

const getHandler = createApiHandler({
  querySchema: z.object({
    search: z.string().optional(),
    listingType: z.string().optional(),
    propertyType: z.string().optional(),
    status: z.string().optional(),
  }).partial(),
  handler: async (req, ctx) => {
    const { organizationId, query } = ctx;
    const { search, listingType, propertyType, status } = query;

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
      organizationId,
      status: statusFilter
    };

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

    const properties = await db.property.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
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
        createdAt: true,
        updatedAt: true,
        assignedAgent: {
          select: {
            name: true,
            phone: true,
            image: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, properties });
  }
});

const postHandler = createApiHandler({
  bodySchema: createPropertySchema,
  handler: async (req, ctx) => {
    const { organizationId, userId, body } = ctx;

    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const property = await db.property.create({
      data: {
        organizationId: organizationId || "org_contour_demo",
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
        createdById: userId || "user_demo_superadmin",
        assignedAgentId: body.assignedAgentId,
      }
    });

    return NextResponse.json({ success: true, property });
  }
});

const patchHandler = createApiHandler({
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
