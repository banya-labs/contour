import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDifyRequest } from "@/lib/dify-auth";
import { MOCK_PROPERTIES } from "@/lib/mock-data";

/**
 * Dify Tool: `search_properties`
 * 
 * Queries the Neon PostgreSQL database for property listings strictly scoped
 * to the authenticated organization (tenant).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      organization_id,
      query,
      suburb,
      listingType,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      limit = 10,
    } = body;

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;

    // Build strict tenant-scoped query for Neon PostgreSQL
    const whereClause: any = {
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
      whereClause.bedrooms = { gte: Number(bedrooms) };
    }

    if (minPrice || maxPrice) {
      if (listingType === "FOR_RENT") {
        whereClause.rentalPrice = {};
        if (minPrice) whereClause.rentalPrice.gte = Number(minPrice);
        if (maxPrice) whereClause.rentalPrice.lte = Number(maxPrice);
      } else {
        whereClause.askingPrice = {};
        if (minPrice) whereClause.askingPrice.gte = Number(minPrice);
        if (maxPrice) whereClause.askingPrice.lte = Number(maxPrice);
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

    let properties: any[] = [];

    try {
      properties = await db.property.findMany({
        where: whereClause,
        take: Number(limit),
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
    } catch (dbError) {
      // Fallback for dev / mock environment
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        properties = MOCK_PROPERTIES.filter((p) => {
          if (suburb && !p.suburb.toLowerCase().includes(suburb.toLowerCase())) return false;
          if (listingType && p.listingType !== listingType) return false;
          if (bedrooms && (!p.bedrooms || p.bedrooms < Number(bedrooms))) return false;
          return true;
        });
      } else {
        throw dbError;
      }
    }

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
      publicUrl: `https://contour.app/p/${p.slug}`,
      photosCount: p.photos?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      tenant: tenantOrgId,
      totalCount: formattedResults.length,
      properties: formattedResults,
    });
  } catch (error: any) {
    console.error("Dify Property Search Tool Error:", error);
    return NextResponse.json(
      { error: "Failed to search properties", details: error.message },
      { status: 500 }
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
