import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { PROPERTY_MATCH_THRESHOLD, scoreAllPropertiesForInquiry } from "@/lib/matching/score";
import { buildInquiryMatchingProfile } from "@/lib/matching/inquiry-profile";

export const GET = createApiHandler({
  requirePermissions: ["leads.read"],
  handler: async (req, { organizationId }) => {
    const propertyId = new URL(req.url).searchParams.get("propertyId");
    const inquiries = await db.inquiry.findMany({
      where: { organizationId, propertyId: null, status: { not: "CLOSED" } },
      select: {
        id: true, clientName: true, clientPhone: true, lookingFor: true,
        currency: true, budgetMin: true, budgetMax: true, preferredSuburbs: true,
        propertyType: true, matchingProfile: true, status: true,
      },
      orderBy: { updatedAt: "desc" }, take: 100,
    });
    const properties = await db.property.findMany({
      where: { organizationId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      select: {
        id: true, title: true, suburb: true, listingType: true, propertyType: true,
        currency: true, askingPrice: true, rentalPrice: true, bedrooms: true,
        bathrooms: true, matchingMetadata: true,
      },
      orderBy: { updatedAt: "desc" }, take: 500,
    });
    const matches = inquiries.flatMap((inquiry) => {
      const profile = buildInquiryMatchingProfile(inquiry);
      const ranked = scoreAllPropertiesForInquiry(profile as never, properties as never);
      const candidates = propertyId
        ? ranked.filter((result) => result.propertyId === propertyId)
        : ranked.filter((result) => result.score > PROPERTY_MATCH_THRESHOLD).slice(0, 1);
      return candidates
        .filter((result) => result.score > PROPERTY_MATCH_THRESHOLD)
        .flatMap((result) => {
          const property = properties.find((item) => item.id === result.propertyId);
          return property ? [{ inquiry, property, score: result.score, reasons: result.reasons }] : [];
        });
    });
    return NextResponse.json({ success: true, matches });
  },
});
