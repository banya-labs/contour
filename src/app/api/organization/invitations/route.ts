import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { CONTOUR_ROLE_KEYS } from "@/lib/authorization";
import { createAccessToken, hashAccessToken } from "@/lib/access-request";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  roleKey: z.enum(CONTOUR_ROLE_KEYS.filter((key) => key !== "OWNER") as [string, ...string[]]).default("FIELD_AGENT"),
  note: z.string().trim().max(200).optional(),
});

const revokeSchema = z.object({
  invitationId: z.string().min(1),
});

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.read"],
  handler: async (_req, { organizationId }) => {
    const invitations = await db.invitation.findMany({
      where: {
        organizationId: organizationId!,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      include: {
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      invitations,
    });
  },
});

export const POST = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.invite"],
  bodySchema: inviteSchema,
  handler: async (req, { body, organizationId, userId }) => {
    const normalizedEmail = body.email.toLowerCase().trim();

    // Check if user is already an active member of this organization
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        members: {
          where: { organizationId: organizationId!, status: "active" },
        },
      },
    });

    if (existingUser && existingUser.members.length > 0) {
      return NextResponse.json(
        { success: false, error: "This user is already an active member of this workspace." },
        { status: 400 }
      );
    }

    // Revoke any previous pending invitations for this email in this org
    await db.invitation.updateMany({
      where: {
        organizationId: organizationId!,
        email: normalizedEmail,
        status: "pending",
      },
      data: {
        status: "revoked",
        revokedAt: new Date(),
      },
    });

    const token = createAccessToken();
    const tokenHash = hashAccessToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await db.invitation.create({
      data: {
        organizationId: organizationId!,
        inviterId: userId!,
        email: normalizedEmail,
        role: body.roleKey === "BROKER_MANAGER" ? "admin" : "member",
        roleKey: body.roleKey,
        status: "pending",
        tokenHash,
        expiresAt,
        note: body.note || null,
      },
      include: {
        organization: { select: { name: true, slug: true } },
      },
    });

    const origin = req.nextUrl.origin;
    const inviteUrl = `${origin}/accept-invitation/${invitation.id}?token=${token}`;

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        roleKey: invitation.roleKey,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        organizationName: invitation.organization.name,
      },
      token,
      inviteUrl,
    });
  },
});

export const DELETE = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.invite"],
  bodySchema: revokeSchema,
  handler: async (_req, { body, organizationId }) => {
    const invitation = await db.invitation.findFirst({
      where: {
        id: body.invitationId,
        organizationId: organizationId!,
        status: "pending",
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Pending invitation not found." },
        { status: 404 }
      );
    }

    await db.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  },
});
