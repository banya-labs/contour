export const ACTION_TYPES = [
  "ASSIGN_INQUIRY",
  "SEND_ARREARS_REMINDER",
  "REVIEW_CLOSING",
  "REGISTER_LEASE",
  "APPROVE_STATEMENT",
  "RELEASE_STATEMENT",
  "VERIFY_DEED",
  "REVIEW_LEASE_EXPIRY",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export type ActionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "DISMISSED";

export type ActionPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";

export type ActionOwner = {
  userId?: string;
  name?: string;
  team?: string;
};

export type OperationalAction = {
  id: string;
  type: ActionType;
  entityType: string;
  entityId: string;
  status: ActionStatus;
  priority: ActionPriority;
  owner: ActionOwner | null;
  dueAt: string | null;
  title: string;
  detail: string;
};

export type ActionCommandResult = {
  success: boolean;
  status: ActionStatus;
  actionId: string;
  message: string;
  data?: Record<string, unknown>;
};

export function getActionType(value: string): ActionType {
  if ((ACTION_TYPES as readonly string[]).includes(value)) return value as ActionType;
  throw new Error(`Unsupported action type: ${value}`);
}

export function buildActionIdempotencyKey(organizationId: string, type: ActionType, entityId: string): string {
  return `${organizationId}:${type}:${entityId}`;
}
