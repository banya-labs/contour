import { db } from "../db";
import { contactVisibility, type MatchingScope } from "../matching/visibility";
export async function visibleContactsWhere(scope: MatchingScope) {
  const provenance = await db.auditLog.findMany({ where: { organizationId: scope.organizationId, userId: scope.userId, entityType: "Contact", action: "CONTACT_CREATED" }, select: { entityId: true } });
  return contactVisibility(scope, provenance.map((row) => row.entityId).filter((id): id is string => Boolean(id)));
}
