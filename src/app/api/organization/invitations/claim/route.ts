import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_DESCRIPTIONS, ROLE_PRESETS, type ContourRoleKey, roleHasPermission } from "@/lib/authorization";
import { hashAccessToken } from "@/lib/access-request";

import { parseInviteInput } from "@/lib/onboarding-contract";

const claimSchema = z.object({
  invitationId: z.string().optional(),
  token: z.string().optional(),
  inviteInput: z.string().optional(),
  confirmRoleChange: z.boolean().optional(),
});

// GET: Inspect an invitation by ID and/or token (public for the accept page)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invitationId = searchParams.get("id");
  const token = searchParams.get("token");

  if (!invitationId) {
    return NextResponse.json({ success: false, error: "Invitation ID is required." }, { status: 400 });
  }

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: {
      organization: { select: { id: true, name: true, slug: true, logo: true } },
      inviter: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ success: false, error: "Invitation not found." }, { status: 404 });
  }

  if (invitation.status !== "pending") {
    return NextResponse.json({
      success: false,
      error: invitation.status === "accepted" ? "This invitation has already been accepted." : "This invitation has been revoked.",
      status: invitation.status,
    }, { status: 410 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ success: false, error: "This invitation has expired.", status: "expired" }, { status: 410 });
  }

  // If token was provided, verify hash
  if (token && invitation.tokenHash && invitation.tokenHash !== hashAccessToken(token)) {
    return NextResponse.json({ success: false, error: "Invalid invitation security token." }, { status: 403 });
  }

  const roleKey = (invitation.roleKey || "FIELD_AGENT") as ContourRoleKey;
  const roleInfo = ROLE_DESCRIPTIONS[roleKey] || ROLE_DESCRIPTIONS.FIELD_AGENT;

  // Check if caller is already logged in and already a member of this organization
  let isAlreadyMember = false;
  let currentMember = null;
  const session = await auth.api.getSession({ headers: req.headers });

  if (session?.user?.id) {
    const existingMember = await db.member.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
      },
      include: {
        roleAssignments: { include: { role: true } },
      },
    });

    if (existingMember) {
      isAlreadyMember = true;
      const assignedRole = existingMember.roleAssignments[0]?.role.key;
      const currentRoleKey: ContourRoleKey = (assignedRole && assignedRole in ROLE_DESCRIPTIONS)
        ? (assignedRole as ContourRoleKey)
        : existingMember.role === "owner" ? "OWNER" : "FIELD_AGENT";
      const currentRoleInfo = ROLE_DESCRIPTIONS[currentRoleKey] || ROLE_DESCRIPTIONS.FIELD_AGENT;
      const isAdminOrOwner = existingMember.role === "owner" || ["OWNER", "SUPER_ADMIN", "BROKER_MANAGER"].includes(currentRoleKey);

      currentMember = {
        email: session.user.email,
        name: session.user.name,
        roleKey: currentRoleKey,
        roleName: currentRoleInfo.displayName,
        isAdminOrOwner,
        status: existingMember.status,
        destination: roleHasPermission(currentRoleKey, "dashboard.read") ? "/dashboard" : "/agent",
      };
    }
  }

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      roleKey,
      roleName: roleInfo.displayName,
      roleDescription: roleInfo.description,
      organizationName: invitation.organization.name,
      organizationSlug: invitation.organization.slug,
      organizationLogo: invitation.organization.logo,
      inviterName: invitation.inviter?.name || "An agency administrator",
      expiresAt: invitation.expiresAt,
    },
    isAlreadyMember,
    currentMember,
  });
}

// POST: Claim/accept pending invitation for authenticated user
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ success: false, error: "Authentication required to claim an invitation." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = claimSchema.safeParse(body);
  const userEmail = session.user.email.toLowerCase().trim();

  const explicitInvite = parseInviteInput(parsed.success ? parsed.data.inviteInput : undefined);
  const targetInvitationId = (parsed.success && parsed.data.invitationId) || explicitInvite.invitationId;
  const targetToken = (parsed.success && parsed.data.token) || explicitInvite.token;
  const hasExplicitTarget = Boolean(targetInvitationId || targetToken);

  // 1. Locate the invitation to claim:
  let invitation;
  if (targetInvitationId) {
    invitation = await db.invitation.findUnique({
      where: { id: targetInvitationId },
      include: { organization: true },
    });

    if (invitation && targetToken && invitation.tokenHash && invitation.tokenHash !== hashAccessToken(targetToken)) {
      return NextResponse.json({ success: false, error: "Invalid security token for this invitation." }, { status: 403 });
    }
  } else if (targetToken) {
    const tokenHash = hashAccessToken(targetToken);
    invitation = await db.invitation.findFirst({
      where: {
        tokenHash,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      include: { organization: true },
    });
  }

  if (!invitation && !hasExplicitTarget) {
    invitation = await db.invitation.findFirst({
      where: {
        email: userEmail,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // 2. If no valid pending invitation found:
  if (!invitation || invitation.status !== "pending" || invitation.expiresAt < new Date()) {
    if (hasExplicitTarget) {
      return NextResponse.json({
        success: false,
        error: "The invite link or code provided is invalid, expired, or has already been accepted.",
      }, { status: 404 });
    }

    const activeMember = await db.member.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: {
        organization: true,
        roleAssignments: { include: { role: true } },
      },
    });

    if (activeMember) {
      const assignedRole = activeMember.roleAssignments[0]?.role.key;
      const roleKey: ContourRoleKey = (assignedRole && assignedRole in ROLE_DESCRIPTIONS)
        ? (assignedRole as ContourRoleKey)
        : activeMember.role === "owner" ? "OWNER" : "FIELD_AGENT";

      const canAccessDashboard = roleHasPermission(roleKey, "dashboard.read");
      const destination = canAccessDashboard ? "/dashboard" : "/agent";

      await db.session.updateMany({
        where: { userId: session.user.id },
        data: { activeOrganizationId: activeMember.organizationId, organizationId: activeMember.organizationId },
      });

      return NextResponse.json({
        success: true,
        claimed: false,
        hasMembership: true,
        organizationId: activeMember.organizationId,
        organizationName: activeMember.organization.name,
        roleKey,
        destination,
      });
    }

    return NextResponse.json({
      success: true,
      claimed: false,
      hasMembership: false,
      message: "No pending invitations found for this account.",
    });
  }

  // Check if caller is already a member of this specific organization
  const existingMember = await db.member.findFirst({
    where: {
      organizationId: invitation.organizationId,
      userId: session.user.id,
    },
    include: {
      roleAssignments: { include: { role: true } },
    },
  });

  if (existingMember) {
    const assignedRole = existingMember.roleAssignments[0]?.role.key;
    const currentRoleKey: ContourRoleKey = (assignedRole && assignedRole in ROLE_DESCRIPTIONS)
      ? (assignedRole as ContourRoleKey)
      : existingMember.role === "owner" ? "OWNER" : "FIELD_AGENT";
    const isAdminOrOwner = existingMember.role === "owner" || ["OWNER", "SUPER_ADMIN", "BROKER_MANAGER"].includes(currentRoleKey);
    const targetRoleKey = (invitation.roleKey || "FIELD_AGENT") as ContourRoleKey;

    // Rule: Admins cannot demote themselves to field agent
    if (isAdminOrOwner && targetRoleKey === "FIELD_AGENT") {
      return NextResponse.json({
        success: false,
        error: "Administrators cannot change their role to field agent via an invite link.",
      }, { status: 400 });
    }

    // If caller hasn't explicitly confirmed changing role, leave their role untouched
    if (!parsed.success || !parsed.data.confirmRoleChange) {
      const destination = roleHasPermission(currentRoleKey, "dashboard.read") ? "/dashboard" : "/agent";
      return NextResponse.json({
        success: true,
        claimed: false,
        isAlreadyMember: true,
        organizationId: invitation.organizationId,
        organizationName: invitation.organization.name,
        roleKey: currentRoleKey,
        destination,
      });
    }
  }

  // 3. Atomically claim the invitation and link the member
  const roleKey = (invitation.roleKey || "FIELD_AGENT") as ContourRoleKey;
  const roleInfo = ROLE_DESCRIPTIONS[roleKey] || ROLE_DESCRIPTIONS.FIELD_AGENT;
  const canAccessDashboard = roleHasPermission(roleKey, "dashboard.read");
  const destination = canAccessDashboard ? "/dashboard" : "/agent";

  await db.$transaction(async (tx) => {
    // Upsert Member
    const member = await tx.member.upsert({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: session.user.id,
        },
      },
      create: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
        role: invitation.role || "member",
        status: "active",
      },
      update: {
        status: "active",
        role: invitation.role || "member",
        deactivatedAt: null,
        deactivatedById: null,
      },
    });

    // Ensure OrganizationRole exists with default permissions
    const orgRole = await tx.organizationRole.upsert({
      where: {
        organizationId_key: {
          organizationId: invitation.organizationId,
          key: roleKey,
        },
      },
      create: {
        organizationId: invitation.organizationId,
        key: roleKey,
        displayName: roleInfo.displayName,
        description: roleInfo.description,
        isSystem: true,
        permissions: {
          create: (ROLE_PRESETS[roleKey] || []).map((permission) => ({ permission })),
        },
      },
      update: {},
    });

    // Assign Role to Member
    await tx.memberRoleAssignment.deleteMany({ where: { memberId: member.id } });
    await tx.memberRoleAssignment.create({
      data: {
        memberId: member.id,
        roleId: orgRole.id,
        assignedById: invitation.inviterId,
      },
    });

    // Mark Invitation as accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
        acceptedByUserId: session.user.id,
      },
    });

    // Update activeOrganizationId in active sessions
    await tx.session.updateMany({
      where: { userId: session.user.id },
      data: {
        activeOrganizationId: invitation.organizationId,
        organizationId: invitation.organizationId,
      },
    });

    // Update User model role if appropriate
    const validUserRoles = ["SUPER_ADMIN", "BROKER_MANAGER", "FIELD_AGENT", "FINANCE_OFFICER", "LANDLORD", "TENANT"] as const;
    const mappedUserRole = roleKey === "OWNER" ? "SUPER_ADMIN" : roleKey;
    if (validUserRoles.includes(mappedUserRole as any)) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: mappedUserRole as any },
      });
    }
  });

  return NextResponse.json({
    success: true,
    claimed: true,
    hasMembership: true,
    organizationId: invitation.organizationId,
    organizationName: invitation.organization.name,
    roleKey,
    destination,
  });
}
