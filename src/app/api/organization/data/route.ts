import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { s3Storage } from "@/lib/storage/s3";

const requestSchema = z.object({
  action: z.enum(["RESET", "DELETE"]),
  confirmation: z.string().trim().min(1).max(160),
});

const confirmationFor = (action: "RESET" | "DELETE", slug: string) =>
  action === "DELETE" ? `DELETE ${slug}` : `RESET ${slug}`;

export const POST = createApiHandler({
  requireAuth: true,
  bodySchema: requestSchema,
  handler: async (_req, { body, organizationId, userId, contourRole }) => {
    if (!organizationId || !userId || contourRole !== "OWNER") {
      return NextResponse.json({ success: false, error: "Only the workspace owner can perform this action." }, { status: 403 });
    }

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, logo: true },
    });
    if (!organization) return NextResponse.json({ success: false, error: "Workspace not found." }, { status: 404 });

    const expectedConfirmation = confirmationFor(body.action, organization.slug);
    if (body.confirmation !== expectedConfirmation) {
      return NextResponse.json({ success: false, error: `Type ${expectedConfirmation} exactly to confirm.` }, { status: 400 });
    }

    const [documents, assets] = await Promise.all([
      db.vaultDocument.findMany({ where: { organizationId }, select: { objectKey: true } }),
      db.organizationAsset.findMany({ where: { organizationId }, select: { objectKey: true } }),
    ]);
    const objectKeys = [...documents.map((item) => item.objectKey), ...assets.map((item) => item.objectKey), organization.logo]
      .filter((key): key is string => Boolean(key));

    if (body.action === "DELETE") {
      await db.organization.delete({ where: { id: organizationId } });
    } else {
      await db.$transaction(async (tx) => {
        await tx.boundaryEvidenceEvent.deleteMany({ where: { organizationId } });
        await tx.propertyBoundary.deleteMany({ where: { organizationId } });
        await tx.surveyExtractionJob.deleteMany({ where: { organizationId } });
        await tx.vaultAccessGrant.deleteMany({ where: { organizationId } });
        await tx.documentRequest.deleteMany({ where: { organizationId } });
        await tx.rentPayment.deleteMany({ where: { organizationId } });
        await tx.rentArrearsReminder.deleteMany({ where: { organizationId } });
        await tx.lease.deleteMany({ where: { organizationId } });
        await tx.maintenanceExpense.deleteMany({ where: { organizationId } });
        await tx.landlordStatement.deleteMany({ where: { organizationId } });
        await tx.transaction.deleteMany({ where: { organizationId } });
        await tx.propertyVisit.deleteMany({ where: { organizationId } });
        await tx.followUpTask.deleteMany({ where: { organizationId } });
        await tx.inquiry.deleteMany({ where: { organizationId } });
        await tx.property.deleteMany({ where: { organizationId } });
        await tx.auditLog.deleteMany({ where: { organizationId } });
        await tx.aiUsageLog.deleteMany({ where: { organizationId } });
        await tx.payment.deleteMany({ where: { organizationId } });
        await tx.uploadSession.deleteMany({ where: { organizationId } });
        await tx.apiKey.deleteMany({ where: { organizationId } });
        await tx.accessRequest.deleteMany({ where: { organizationId } });
        await tx.accessRequestLink.deleteMany({ where: { organizationId } });
        await tx.invitation.deleteMany({ where: { organizationId } });
        await tx.memberPermissionOverride.deleteMany({ where: { member: { organizationId } } });
        await tx.memberRoleAssignment.deleteMany({ where: { member: { organizationId } } });
        await tx.organizationRole.deleteMany({ where: { organizationId } });
        await tx.member.deleteMany({ where: { organizationId, userId: { not: userId } } });
        await tx.organizationAsset.deleteMany({ where: { organizationId } });
        await tx.organizationProfile.deleteMany({ where: { organizationId } });
        await tx.organization.update({ where: { id: organizationId }, data: { logo: null } });
        await tx.auditLog.create({ data: { organizationId, userId, action: "ORGANIZATION_DATA_RESET", entityType: "Organization", entityId: organizationId } });
      });
    }

    await Promise.allSettled(objectKeys.map((objectKey) => s3Storage.deleteObject(objectKey)));
    return NextResponse.json({ success: true, action: body.action });
  },
});
