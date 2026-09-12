import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { createAccessToken, hashAccessToken } from "@/lib/access-request";

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.invite"],
  handler: async (_req, { organizationId }) => {
    const link = await db.accessRequestLink.findUnique({ where: { organizationId: organizationId! } });
    return NextResponse.json({ success: true, active: Boolean(link && !link.revokedAt), createdAt: link?.createdAt ?? null });
  },
});

export const POST = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.invite"],
  handler: async (_req, { organizationId, userId }) => {
    const token = createAccessToken();
    await db.accessRequestLink.upsert({
      where: { organizationId: organizationId! },
      create: { organizationId: organizationId!, tokenHash: hashAccessToken(token), createdById: userId! },
      update: { tokenHash: hashAccessToken(token), createdById: userId!, revokedAt: null },
    });
    return NextResponse.json({ success: true, token });
  },
});
