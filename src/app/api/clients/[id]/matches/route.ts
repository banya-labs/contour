import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { scoreAllPropertiesForInquiry } from "@/lib/matching/score";

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
        preferredSuburbs: true, propertyType: true, matchingProfile: true, propertyId: true,
      },
    });
    if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    if (inquiry.propertyId) return NextResponse.json({ success: true, threshold: 60, matchingEnabled: false, matches: [] });

    const properties = await db.property.findMany({
      where: { organizationId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      select: {
        id: true, title: true, suburb: true, listingType: true, propertyType: true,
        currency: true, askingPrice: true, rentalPrice: true, bedrooms: true,
        bathrooms: true, matchingMetadata: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const profile = (inquiry.matchingProfile as Record<string, unknown> | null) || {
      lookingFor: inquiry.lookingFor,
      currency: inquiry.currency,
      budgetMin: inquiry.budgetMin ? Number(inquiry.budgetMin) : null,
      budgetMax: inquiry.budgetMax ? Number(inquiry.budgetMax) : null,
      preferredAreas: inquiry.preferredSuburbs,
      propertyType: inquiry.propertyType,
    };
    const ranked = scoreAllPropertiesForInquiry(profile as never, properties as never);
    const matches = ranked.map((result) => ({
      ...result,
      property: properties.find((property) => property.id === result.propertyId),
    })).filter((result) => result.property);

    return NextResponse.json({ success: true, threshold: 60, matchingEnabled: !inquiry.propertyId, matches: matches.map((match) => ({ ...match, isMatch: match.score > 60 })) });
  },
});
