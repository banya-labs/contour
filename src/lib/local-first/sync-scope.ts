import { OFFLINE_TABLES, type OfflineTable } from "./constants";

const AGENT_ROLES = new Set(["FIELD_AGENT", "AGENT"]);

export interface SyncScopeInput {
  organizationId: string;
  userId: string;
  role: string;
  requestedOrganizationId?: string;
}

export interface SyncScope {
  organizationId: string;
  userId: string;
  role: string;
  tables: readonly OfflineTable[];
  assignmentFilter?: { agentId: string };
}

export function getSyncScope(input: SyncScopeInput): SyncScope {
  if (!input.organizationId.trim()) throw new Error("Organization context is required");
  if (!input.userId.trim()) throw new Error("User context is required");

  return {
    organizationId: input.organizationId,
    userId: input.userId,
    role: input.role,
    tables: OFFLINE_TABLES,
    ...(AGENT_ROLES.has(input.role) ? { assignmentFilter: { agentId: input.userId } } : {}),
  };
}
