import type { SyncMutationStatus } from "./constants";

export interface LocalFirstIdentity {
  userId: string;
  organizationId: string;
  role: string;
  databaseKey: string;
  expiresAt: string;
}

export interface SyncMutation<TPayload = Record<string, unknown>> {
  mutationId: string;
  organizationId: string;
  userId: string;
  entityType: string;
  entityId: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  payload: TPayload;
  status: SyncMutationStatus;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}
