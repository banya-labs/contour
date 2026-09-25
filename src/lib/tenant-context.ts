import { NextRequest } from "next/server";
import { auth, type Session } from "./auth";
import { toAuthHeaders } from "./auth-headers";
import { db } from "./db";
import { effectivePermissionsForMember, resolveApplicationRole, resolveContourRole, type ContourRoleKey, type Permission } from "./authorization";

export type TenantContext = {
  session: Session;
  userId: string;
  organizationId: string;
  userRole: string;
  contourRole: ContourRoleKey;
  permissions: readonly Permission[];
};

type Membership = {
  organizationId?: string;
  role: string;
  status: string;
  roleAssignments: Array<{ role: { key: string; permissions: Array<{ permission: string }> } }>;
  permissionOverrides: Array<{ effect: string; permission: string }>;
};

/**
 * Resolves the authenticated tenant for a request.
 *
 * Tenant identity comes only from the Better Auth session and a database
 * membership check. Callers must never accept organization IDs from the
 * client for protected operations.
 */
export async function getTenantContext(req: NextRequest): Promise<TenantContext | null> {
  const session = await auth.api.getSession({ headers: toAuthHeaders(req.headers) });
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const supportAccessId = req.cookies.get("contour_support_access")?.value;
  if (supportAccessId) {
    const supportAccess = await db.supportAccessSession.findUnique({ where: { id: supportAccessId }, select: { organizationId: true, startedByUserId: true, expiresAt: true, revokedAt: true, mode: true } });
    if (supportAccess?.startedByUserId === userId && supportAccess.mode === "ACT_AS" && !supportAccess.revokedAt && supportAccess.expiresAt > new Date()) {
      return { session, userId, organizationId: supportAccess.organizationId, userRole: "SUPER_ADMIN", contourRole: "OWNER", permissions: effectivePermissionsForMember("owner", undefined, []) };
    }
  }
  let organizationId = session.session?.activeOrganizationId;

  let membership: Membership | null = null;
  if (organizationId) {
    try {
      membership = await db.member.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
        select: { id: true, role: true, status: true, roleAssignments: { include: { role: { include: { permissions: true } } } }, permissionOverrides: true },
      }) as Membership | null;
    } catch {
      // Allow an application rollout before the additive RBAC migration has been applied.
      const legacyMembership = await db.member.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
        select: { id: true, role: true },
      });
      membership = legacyMembership ? { ...legacyMembership, status: "active", roleAssignments: [], permissionOverrides: [] } : null;
    }
  }

  // If organizationId was unset or membership is not active in that organization,
  // never silently switch tenants. Only infer an organization when the user
  // has exactly one active membership and no active organization is set.
  if (!membership || membership.status !== "active") {
    if (organizationId) return null;
    try {
      const activeMembers = await db.member.findMany({
        where: { userId, status: "active" },
        select: {
          id: true,
          organizationId: true,
          role: true,
          status: true,
          roleAssignments: { include: { role: { include: { permissions: true } } } },
          permissionOverrides: true,
        },
        orderBy: { createdAt: "asc" },
        take: 2,
      });
      if (activeMembers.length === 1) {
        const onlyMember = activeMembers[0];
        organizationId = onlyMember.organizationId;
        membership = onlyMember as Membership;

        // Persist activeOrganizationId into the active session record
        if (session.session?.id) {
          db.session.update({
            where: { id: session.session.id },
            data: { activeOrganizationId: organizationId, organizationId },
          }).catch(() => {});
        }
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (!membership || membership.status !== "active" || !organizationId) {
    return null;
  }

  const roleAssignments = membership.roleAssignments ?? [];
  const permissionOverrides = membership.permissionOverrides ?? [];
  const assignedRole = roleAssignments[0]?.role.key;
  const contourRole = resolveContourRole(session.user.role ?? undefined, membership.role, assignedRole);
  const permissions = effectivePermissionsForMember(membership.role, assignedRole, permissionOverrides);

  return {
    session,
    userId,
    organizationId,
    userRole: resolveApplicationRole(session.user.role ?? undefined, membership.role),
    contourRole,
    permissions,
  };
}
