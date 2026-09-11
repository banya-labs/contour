import { NextRequest } from "next/server";
import { auth, type Session } from "./auth";
import { db } from "./db";
import { resolveApplicationRole } from "./authorization";

export type TenantContext = {
  session: Session;
  userId: string;
  organizationId: string;
  userRole: string;
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
  if (!session?.user.id || !session.session.activeOrganizationId) {
    return null;
  }

  const userId = session.user.id;
  const organizationId = session.session.activeOrganizationId;
  const membership = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: { id: true, role: true },
  });

  if (!membership) {
    return null;
  }

  return {
    session,
    userId,
    organizationId,
    userRole: resolveApplicationRole(session.user.role ?? undefined, membership.role),
  };
}
