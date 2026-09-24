import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { rankPropertiesForInquiry } from "@/lib/matching/score";

export const GET = createApiHandler({
  requirePermissions: ["leads.read"],
  handler: async (_req, { organizationId }) => {
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
      const profile = (inquiry.matchingProfile as Record<string, unknown> | null) || {
        lookingFor: inquiry.lookingFor, currency: inquiry.currency,
        budgetMin: inquiry.budgetMin ? Number(inquiry.budgetMin) : null,
        budgetMax: inquiry.budgetMax ? Number(inquiry.budgetMax) : null,
        preferredAreas: inquiry.preferredSuburbs, propertyType: inquiry.propertyType,
      };
      const best = rankPropertiesForInquiry(profile as never, properties as never, 1)[0];
      if (!best) return [];
      const property = properties.find((item) => item.id === best.propertyId);
      return property ? [{ inquiry, property, score: best.score, reasons: best.reasons }] : [];
    });
    return NextResponse.json({ success: true, matches });
  },
});
