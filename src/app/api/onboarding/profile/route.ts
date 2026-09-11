import { NextResponse } from "next/server";
import { Currency } from "@prisma/client";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { agencyProfileSchema } from "@/lib/onboarding-contract";

export const POST = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.update"],
  bodySchema: agencyProfileSchema,
  handler: async (_req, { body, organizationId, userId }) => {
    const orgId = organizationId!;
    const profile = await db.organizationProfile.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        country: body.country,
        timezone: body.timezone,
        agencyType: body.agencyType,
        primaryOfficeAddress: body.primaryOfficeAddress || null,
        city: body.city || null,
        primaryPhone: body.primaryPhone || null,
        primaryEmail: body.primaryEmail || null,
        onboardingStatus: "ONBOARDING_COMPLETE",
        onboardingStep: "COMPLETE",
        completedAt: new Date(),
      },
      update: {
        country: body.country,
        timezone: body.timezone,
        agencyType: body.agencyType,
        primaryOfficeAddress: body.primaryOfficeAddress || null,
        city: body.city || null,
        primaryPhone: body.primaryPhone || null,
        primaryEmail: body.primaryEmail || null,
        onboardingStatus: "ONBOARDING_COMPLETE",
        onboardingStep: "COMPLETE",
        completedAt: new Date(),
      },
    });

    await db.organization.update({ where: { id: orgId }, data: { name: body.name, slug: body.slug, currency: body.currency as Currency } });
    await db.auditLog.create({
      data: { organizationId: orgId, userId, action: "ONBOARDING_PROFILE_COMPLETED", entityType: "Organization", entityId: orgId, details: { country: body.country, agencyType: body.agencyType } },
    });
    return NextResponse.json({ success: true, profile });
  },
});
