export type OfflinePolicyMode = "FIELD" | "OPERATIONS";

export interface AdminOfflinePolicy {
  mode: OfflinePolicyMode;
  allowedActions: readonly string[];
  onlineOnlyActions: readonly string[];
}

const onlineOnlyActions = ["BILLING", "PERMISSIONS", "VAULT", "DELETE", "PAYMENTS", "FINANCIAL_RECONCILIATION"] as const;

export function getAdminOfflinePolicy(role: string): AdminOfflinePolicy {
  if (role === "BROKER_MANAGER" || role === "SUPER_ADMIN" || role === "OWNER") {
    return {
      mode: "OPERATIONS",
      allowedActions: ["VIEW_QUEUE", "VIEW_PROPERTIES", "VIEW_CLIENTS", "VIEW_ORGANIZATION_PIPELINE", "ADD_NOTE", "REVIEW_SYNC_FAILURES"],
      onlineOnlyActions,
    };
  }

  return {
    mode: "FIELD",
    allowedActions: ["VIEW_QUEUE", "VIEW_PROPERTIES", "VIEW_CLIENTS", "ADD_NOTE"],
    onlineOnlyActions,
  };
}
