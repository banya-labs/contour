import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Currency } from "@prisma/client";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  country: z.enum(["ZM", "ZA", "ZW"]).optional(),
  currency: z.enum(["ZMW", "ZAR", "USD"]).optional(),
  agencyType: z.enum(["BROKERAGE", "PROPERTY_MANAGEMENT", "DEVELOPER", "LANDLORD", "MIXED"]).optional(),
  primaryOfficeAddress: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  primaryPhone: z.string().trim().max(32).optional().or(z.literal("")),
  primaryEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
});

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.read"],
  handler: async (_req, { organizationId }) => {
    const organization = await db.organization.findUnique({
      where: { id: organizationId! },
      include: { profile: true },
    });
    if (!organization) return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });

    const trialEndsAt = new Date(organization.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        currency: organization.currency,
        subscriptionTier: organization.subscriptionTier,
        subscriptionStatus: organization.subscriptionStatus,
        createdAt: organization.createdAt,
        trialEndsAt,
        profile: organization.profile,
      },
    });
  },
});

export const PATCH = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.update"],
  bodySchema: profileUpdateSchema,
  handler: async (_req, { body, organizationId, userId }) => {
    const orgId = organizationId!;
    const organization = await db.organization.update({
      where: { id: orgId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.currency ? { currency: body.currency as Currency } : {}),
        profile: {
          upsert: {
            create: {
              country: body.country || "ZM",
              agencyType: body.agencyType || "BROKERAGE",
              primaryOfficeAddress: body.primaryOfficeAddress || null,
              city: body.city || null,
              primaryPhone: body.primaryPhone || null,
              primaryEmail: body.primaryEmail || null,
              onboardingStatus: "ONBOARDING_COMPLETE",
              onboardingStep: "COMPLETE",
              completedAt: new Date(),
            },
            update: {
              ...(body.country ? { country: body.country } : {}),
              ...(body.agencyType ? { agencyType: body.agencyType } : {}),
              ...(body.primaryOfficeAddress !== undefined ? { primaryOfficeAddress: body.primaryOfficeAddress || null } : {}),
              ...(body.city !== undefined ? { city: body.city || null } : {}),
              ...(body.primaryPhone !== undefined ? { primaryPhone: body.primaryPhone || null } : {}),
              ...(body.primaryEmail !== undefined ? { primaryEmail: body.primaryEmail || null } : {}),
            },
          },
        },
      },
      include: { profile: true },
    });
    await db.auditLog.create({ data: { organizationId: orgId, userId, action: "ORGANIZATION_PROFILE_UPDATED", entityType: "Organization", entityId: orgId } });
    return NextResponse.json({ success: true, organization });
  },
});
