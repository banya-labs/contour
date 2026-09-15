import { NextResponse } from "next/server";
import { Currency } from "@prisma/client";
import { createApiHandler } from "@/lib/api-handler";
import { getTrialEnd } from "@/lib/billing-access";
import { db } from "@/lib/db";
import { agencyProfileSchema } from "@/lib/onboarding-contract";

export const POST = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.update"],
  bodySchema: agencyProfileSchema,
  handler: async (_req, { body, organizationId, userId }) => {
    const orgId = organizationId!;
    const organization = await db.organization.findUnique({
      where: { id: orgId },
      select: {
        createdAt: true,
        profile: { select: { id: true } },
        lencoSubscriptionId: true,
        trialEndsAt: true,
        payments: { where: { status: "SUCCESS" }, select: { id: true }, take: 1 },
      },
    });
    if (!organization) return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });

    const shouldStartTrial = !organization.profile && !organization.lencoSubscriptionId && organization.payments.length === 0;
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

    const regulatoryMetadata = {
      pacraRegistrationNumber: body.pacraRegistrationNumber || null,
      ziereaLicenseNumber: body.ziereaLicenseNumber || null,
      dpoName: body.dpoName || null,
      dpoEmail: body.dpoEmail || null,
      regulatoryDeclarationAgreed: Boolean(body.regulatoryDeclarationAgreed),
      declaredAt: new Date().toISOString(),
      statutoryFramework: "Zambia DPA No. 3 of 2021, Estate Agents Act Cap 187, FIC Act No. 46 of 2010",
    };

    await db.organization.update({
      where: { id: orgId },
      data: {
        name: body.name,
        slug: body.slug,
        currency: body.currency as Currency,
        metadata: JSON.stringify(regulatoryMetadata),
        ...(shouldStartTrial ? { subscriptionStatus: "trialing", trialEndsAt: getTrialEnd(organization.createdAt) } : {}),
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "AGENCY_REGULATORY_DECLARATION_EXECUTED",
        entityType: "Organization",
        entityId: orgId,
        details: regulatoryMetadata,
      },
    });

    await db.auditLog.create({
      data: { organizationId: orgId, userId, action: "ONBOARDING_PROFILE_COMPLETED", entityType: "Organization", entityId: orgId, details: { country: body.country, agencyType: body.agencyType, trialStarted: shouldStartTrial } },
    });
    return NextResponse.json({ success: true, profile });
  },
});
