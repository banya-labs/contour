import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { PROPERTY_MATCH_THRESHOLD, scoreAllPropertiesForInquiry } from "@/lib/matching/score";
import { buildInquiryMatchingProfile } from "@/lib/matching/inquiry-profile";

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
        bedroomsMin: true, bathroomsMin: true, areaMinSqm: true,
      },
    });
    if (!inquiry) return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    const properties = await db.property.findMany({
      where: { organizationId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      select: {
        id: true, title: true, suburb: true, listingType: true, propertyType: true,
        currency: true, askingPrice: true, rentalPrice: true, bedrooms: true,
        bathrooms: true, plotSizeSqm: true, matchingMetadata: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const profile = buildInquiryMatchingProfile(inquiry);
    const ranked = scoreAllPropertiesForInquiry(profile as never, properties as never);
    const matches = ranked.map((result) => ({
      ...result,
      property: properties.find((property) => property.id === result.propertyId),
    })).filter((result) => result.property);

    return NextResponse.json({ success: true, threshold: PROPERTY_MATCH_THRESHOLD, matchingEnabled: true, matches: matches.map((match) => ({ ...match, isMatch: match.score > PROPERTY_MATCH_THRESHOLD })) });
  },
});
