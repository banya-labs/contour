import type { Prisma } from "@prisma/client";
import type { Permission } from "../authorization";
export type MatchingScope = { organizationId: string; userId: string; permissions: readonly Permission[] };
export function canManageMatching(scope: MatchingScope): boolean { return scope.permissions.includes("leads.assign"); }
export function inquiryVisibility(scope: MatchingScope): Prisma.InquiryWhereInput {
  return { organizationId: scope.organizationId, ...(!canManageMatching(scope) ? { OR: [{ assignedAgentId: scope.userId }, { assignedAgentId: null }] } : {}) };
}
export function contactVisibility(scope: MatchingScope, createdIds: string[] = []): Prisma.ContactWhereInput {
  return { organizationId: scope.organizationId, ...(!canManageMatching(scope) ? { OR: [{ id: { in: createdIds } }, { inquiries: { some: inquiryVisibility(scope) } }] } : {}) };
}
