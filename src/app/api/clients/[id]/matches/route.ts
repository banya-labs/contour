import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { rankPropertiesForInquiry } from "@/lib/matching/score";

export const GET = createApiHandler({
  requirePermissions: ["leads.read"],
  handler: async (_request, { params, organizationId }) => {
    const inquiryId = typeof params?.id === "string" ? params.id : undefined;
    if (!inquiryId || !organizationId) {
      return NextResponse.json({ success: false, error: "Inquiry and organization context are required." }, { status: 400 });
    }

    const inquiry = await db.inquiry.findFirst({
      where: { id: inquiryId, organizationId },
      select: {
        id: true, lookingFor: true, currency: true, budgetMin: true, budgetMax: true,
        preferredSuburbs: true, propertyType: true, matchingProfile: true,
      },
    });
    if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });

    const properties = await db.property.findMany({
      where: { organizationId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      select: {
        id: true, title: true, suburb: true, listingType: true, propertyType: true,
        currency: true, askingPrice: true, rentalPrice: true, bedrooms: true,
        bathrooms: true, matchingMetadata: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    const profile = (inquiry.matchingProfile as Record<string, unknown> | null) || {
      lookingFor: inquiry.lookingFor,
      currency: inquiry.currency,
      budgetMin: inquiry.budgetMin ? Number(inquiry.budgetMin) : null,
      budgetMax: inquiry.budgetMax ? Number(inquiry.budgetMax) : null,
      preferredAreas: inquiry.preferredSuburbs,
      propertyType: inquiry.propertyType,
    };
    const ranked = rankPropertiesForInquiry(profile as never, properties as never, 5);
    const matches = ranked.map((result) => ({
      ...result,
      property: properties.find((property) => property.id === result.propertyId),
    })).filter((result) => result.property);

    return NextResponse.json({ success: true, matches });
  },
});
