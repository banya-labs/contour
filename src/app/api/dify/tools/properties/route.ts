import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticateDifyRequest } from "@/lib/dify-auth";
import { searchPropertiesToolSchema } from "@/lib/ai-tool-schemas";
import { getOrCreateCorrelationId } from "@/lib/correlation";

/**
 * Dify Tool: `search_properties`
 * 
 * Queries the Neon PostgreSQL database for property listings strictly scoped
 * to the authenticated organization (tenant).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = searchPropertiesToolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid property search arguments" }, { status: 400 });
    }
    const { organization_id, query, suburb, listingType, propertyType, minPrice, maxPrice, bedrooms, limit } = parsed.data;

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;

    // Build strict tenant-scoped query for Neon PostgreSQL
    const whereClause: Prisma.PropertyWhereInput = {
      organizationId: tenantOrgId,
      status: "AVAILABLE",
    };

    if (suburb) {
      whereClause.suburb = { contains: suburb, mode: "insensitive" };
    }

    if (listingType && ["FOR_SALE", "FOR_RENT", "BOTH"].includes(listingType)) {
      whereClause.listingType = listingType;
    }

    if (propertyType) {
      whereClause.propertyType = propertyType;
    }

    if (bedrooms) {
      whereClause.bedrooms = { gte: bedrooms };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      if (listingType === "FOR_RENT") {
        whereClause.rentalPrice = {};
        if (minPrice !== undefined) whereClause.rentalPrice.gte = minPrice;
        if (maxPrice !== undefined) whereClause.rentalPrice.lte = maxPrice;
      } else {
        whereClause.askingPrice = {};
        if (minPrice !== undefined) whereClause.askingPrice.gte = minPrice;
        if (maxPrice !== undefined) whereClause.askingPrice.lte = maxPrice;
      }
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { suburb: { contains: query, mode: "insensitive" } },
        { landmarkDirections: { contains: query, mode: "insensitive" } },
      ];
    }

    const properties = await db.property.findMany({
        where: whereClause,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          suburb: true,
          city: true,
          propertyType: true,
          listingType: true,
          status: true,
          askingPrice: true,
          rentalPrice: true,
          currency: true,
          bedrooms: true,
          bathrooms: true,
          plotSizeSqm: true,
          landmarkDirections: true,
          description: true,
          photos: true,
          featuredPhoto: true,
          createdAt: true,
        },
      });

    // Format properties for Dify LLM context
    const formattedResults = properties.map((p) => ({
      id: p.id,
      title: p.title,
      suburb: p.suburb,
      city: p.city || "Lusaka",
      listingType: p.listingType,
      propertyType: p.propertyType,
      price: p.listingType === "FOR_RENT" 
        ? `${p.currency} ${Number(p.rentalPrice || 0).toLocaleString()}/month`
        : `${p.currency} ${Number(p.askingPrice || 0).toLocaleString()}`,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms ? Number(p.bathrooms) : null,
      plotSizeSqm: p.plotSizeSqm ? `${p.plotSizeSqm} m²` : null,
      landmarks: p.landmarkDirections,
      summary: p.description?.substring(0, 200) + "...",
      publicUrl: `https://contour.app/p/${encodeURIComponent(tenantOrgId)}/${encodeURIComponent(p.slug)}`,
      photosCount: p.photos?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      tenant: tenantOrgId,
      totalCount: formattedResults.length,
      properties: formattedResults,
    });
  } catch (error: unknown) {
    const correlationId = getOrCreateCorrelationId(req);
    console.error("Dify Property Search Tool Error:", { correlationId, error });
    return NextResponse.json(
      { error: "Failed to search properties", correlationId },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  
  // Reuse POST logic with query params
  const mockReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(searchParams),
  });

  return POST(mockReq);
}
