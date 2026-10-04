import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CONTOUR_PLANS } from "@/lib/lenco";

export const dynamic = "force-dynamic";

export async function GET() {
  const tiers = await db.subscriptionTier.findMany({
    where: { active: true },
    orderBy: { key: "asc" },
    select: { key: true, name: true, description: true, monthlyZmw: true, annualZmw: true, monthlyUsd: true, annualUsd: true, maxAgents: true, maxListings: true, maxRentalUnits: true, features: true },
  });

  return NextResponse.json({
    success: true,
    tiers: tiers.map((tier) => {
      const plan = CONTOUR_PLANS[tier.key.toLowerCase()];
      return {
        id: tier.key.toLowerCase(),
        name: tier.name,
        description: tier.description,
        monthlyZmw: Number(tier.monthlyZmw),
        annualZmw: Number(tier.annualZmw),
        monthlyUsd: Number(tier.monthlyUsd),
        annualUsd: Number(tier.annualUsd),
        badge: plan?.badge || tier.name,
        features: tier.features.length ? tier.features : plan?.features || [],
        maxAgents: tier.maxAgents || plan?.maxAgents || null,
        maxListings: tier.maxListings || plan?.maxListings || null,
        maxRentalUnits: tier.maxRentalUnits || plan?.maxRentalUnits || null,
      };
    }),
  }, { headers: { "Cache-Control": "no-store" } });
}
