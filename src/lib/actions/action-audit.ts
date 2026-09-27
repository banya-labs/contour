import type { ActionType } from "./action-types";

export type ActionAuditDetails = {
  actionType: ActionType;
  entityType: string;
  entityId: string;
  previousStatus?: string;
  nextStatus: string;
  idempotencyKey: string;
  message?: string;
};

export function createActionAuditDetails(details: ActionAuditDetails): ActionAuditDetails {
  return { ...details };
}
