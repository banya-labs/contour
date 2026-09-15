import { NextRequest } from "next/server";
import { auth, type Session } from "./auth";
import { db } from "./db";
import { permissionsForRole, resolveApplicationRole, resolveContourRole, type ContourRoleKey, type Permission } from "./authorization";

export type TenantContext = {
  session: Session;
  userId: string;
  organizationId: string;
  userRole: string;
  contourRole: ContourRoleKey;
  permissions: readonly Permission[];
};

/**
 * Resolves the authenticated tenant for a request.
 *
 * Tenant identity comes only from the Better Auth session and a database
 * membership check. Callers must never accept organization IDs from the
 * client for protected operations.
 */
export async function getTenantContext(req: NextRequest): Promise<TenantContext | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  let organizationId = session.session?.activeOrganizationId;

  if (!organizationId) {
    try {
      const activeMember = await db.member.findFirst({
        where: { userId, status: "active" },
        select: { organizationId: true },
        orderBy: { createdAt: "asc" },
      });
      if (activeMember) {
        organizationId = activeMember.organizationId;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }
  let membership;
  try {
    membership = await db.member.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { id: true, role: true, status: true, roleAssignments: { include: { role: { include: { permissions: true } } } }, permissionOverrides: true },
    });
  } catch {
    // Allow an application rollout before the additive RBAC migration has been applied.
    const legacyMembership = await db.member.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { id: true, role: true },
    });
    membership = legacyMembership ? { ...legacyMembership, status: "active", roleAssignments: [], permissionOverrides: [] } : null;
  }

  if (!membership || membership.status !== "active") {
    return null;
  }

  const roleAssignments = membership.roleAssignments ?? [];
  const permissionOverrides = membership.permissionOverrides ?? [];
  const assignedRole = roleAssignments[0]?.role.key;
  const contourRole = resolveContourRole(session.user.role ?? undefined, membership.role, assignedRole);
  const basePermissions = new Set<Permission>(permissionsForRole(contourRole));
  for (const assignment of roleAssignments) for (const permission of assignment.role.permissions) basePermissions.add(permission.permission as Permission);
  for (const override of permissionOverrides) {
    if (override.effect === "DENY") basePermissions.delete(override.permission as Permission);
    if (override.effect === "ALLOW") basePermissions.add(override.permission as Permission);
  }

  return {
    session,
    userId,
    organizationId,
    userRole: resolveApplicationRole(session.user.role ?? undefined, membership.role),
    contourRole,
    permissions: [...basePermissions],
  };
}
