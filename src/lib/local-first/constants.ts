export const OFFLINE_SUPPORTED_ROUTES = ["/agent", "/kiosk"] as const;

export const OFFLINE_TABLES = [
  "organizations",
  "properties",
  "clients",
  "visits",
  "inquiries",
  "deals",
  "follow_ups",
  "sync_mutations",
  "sync_conflicts",
] as const;

export const SENSITIVE_OFFLINE_EXCLUSIONS = [
  "vault_documents",
  "bank_accounts",
  "payment_transactions",
  "title_deeds",
  "identity_documents",
] as const;

export const SYNC_MUTATION_STATUSES = [
  "LOCAL_ONLY",
  "QUEUED",
  "SYNCING",
  "CONFIRMED",
  "FAILED",
  "CONFLICT",
] as const;

export type OfflineSupportedRoute = (typeof OFFLINE_SUPPORTED_ROUTES)[number];
export type OfflineTable = (typeof OFFLINE_TABLES)[number];
export type SyncMutationStatus = (typeof SYNC_MUTATION_STATUSES)[number];
