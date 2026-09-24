import { PERMISSIONS, type Permission, type ContourRoleKey } from "./authorization";

export type PermissionGroupKey =
  | "agency_team"
  | "billing"
  | "dashboard_reports"
  | "properties"
  | "clients_leads"
  | "deals_pipeline"
  | "rentals_leases"
  | "finance_statements"
  | "documents_vault"
  | "field_agent_pwa";

export type PermissionGroup = {
  key: PermissionGroupKey;
  displayName: string;
  description: string;
  permissions: readonly Permission[];
  roleOnly?: ContourRoleKey;
};

export const FIELD_AGENT_BASELINE: readonly Permission[] = [
  "pwa.access",
  "pwa.listings.create",
  "pwa.listings.share",
  "pwa.inquiries.update",
];

export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  { key: "agency_team", displayName: "Agency & team management", description: "Manage agency settings and members.", permissions: ["org.read", "org.update", "org.members.read", "org.members.invite", "org.members.update_role", "org.members.deactivate"] },
  { key: "billing", displayName: "Billing & subscription", description: "View and manage the agency subscription.", permissions: ["org.billing.read", "org.billing.manage"] },
  { key: "dashboard_reports", displayName: "Dashboard & reports", description: "Access the main dashboard and operational reporting.", permissions: ["dashboard.read"] },
  { key: "properties", displayName: "Properties", description: "View and manage property listings.", permissions: ["properties.read", "properties.create", "properties.update", "properties.archive"] },
  { key: "clients_leads", displayName: "Clients & leads", description: "Manage client and lead records.", permissions: ["leads.read", "leads.create", "leads.assign"] },
  { key: "deals_pipeline", displayName: "Deals & pipeline", description: "View and progress deals through the pipeline.", permissions: ["pipeline.read", "pipeline.update"] },
  { key: "rentals_leases", displayName: "Rentals & leases", description: "Manage rental and lease workflows.", permissions: ["leases.read", "leases.manage"] },
  { key: "finance_statements", displayName: "Finance & statements", description: "Manage finance records and landlord statements.", permissions: ["finance.read", "finance.manage", "statements.read", "statements.approve"] },
  { key: "documents_vault", displayName: "Documents & legal vault", description: "Manage legal and compliance documents.", permissions: ["vault.read", "vault.upload", "vault.download", "vault.verify", "vault.delete", "vault.grant_access"] },
  { key: "field_agent_pwa", displayName: "Field Agent PWA", description: "Mobile field-agent access included by the Field Agent role.", permissions: FIELD_AGENT_BASELINE, roleOnly: "FIELD_AGENT" },
];

export function permissionsForGroups(groupKeys: readonly PermissionGroupKey[]): readonly Permission[] {
  const selected = new Set(groupKeys);
  return PERMISSIONS.filter((permission) => PERMISSION_GROUPS.some((group) => selected.has(group.key) && group.permissions.includes(permission)));
}

export function groupKeysForPermissions(permissions: readonly Permission[]): PermissionGroupKey[] {
  const selected = new Set(permissions);
  return PERMISSION_GROUPS.filter((group) => group.permissions.some((permission) => selected.has(permission))).map((group) => group.key);
}
