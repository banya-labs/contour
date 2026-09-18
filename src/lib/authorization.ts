export const CONTOUR_ROLE_KEYS = [
  "OWNER", "BROKER_MANAGER", "ADMIN_STAFF", "FIELD_AGENT",
  "FINANCE_OFFICER", "VAULT_MANAGER", "LANDLORD", "TENANT",
] as const;

export type ContourRoleKey = (typeof CONTOUR_ROLE_KEYS)[number];
export const PERMISSIONS = [
  "org.read", "org.update", "org.members.read", "org.members.invite", "org.members.update_role",
  "org.members.deactivate", "org.billing.read", "org.billing.manage", "dashboard.read",
  "properties.read", "properties.create", "properties.update", "properties.archive", "leads.read",
  "leads.create", "leads.assign", "pipeline.read", "pipeline.update", "leases.read", "leases.manage",
  "finance.read", "finance.manage", "statements.read", "statements.approve", "vault.read", "vault.upload",
  "vault.download", "vault.verify", "vault.delete", "vault.grant_access", "pwa.access",
  "pwa.listings.create", "pwa.listings.share", "pwa.inquiries.update",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;
export const ROLE_PRESETS: Readonly<Record<ContourRoleKey, readonly Permission[]>> = {
  OWNER: ALL,
  BROKER_MANAGER: ["org.read", "org.update", "org.members.read", "org.members.invite", "dashboard.read", "properties.read", "properties.create", "properties.update", "properties.archive", "leads.read", "leads.create", "leads.assign", "pipeline.read", "pipeline.update", "leases.read", "leases.manage", "statements.read", "statements.approve", "vault.read", "vault.upload", "vault.download", "vault.verify", "vault.grant_access", "pwa.access", "pwa.listings.create", "pwa.listings.share", "pwa.inquiries.update"],
  ADMIN_STAFF: ["org.read", "org.members.read", "dashboard.read", "properties.read", "leads.read", "pipeline.read", "leases.read", "pwa.access"],
  FIELD_AGENT: ["properties.read", "leads.read", "pwa.access", "pwa.listings.share", "pwa.inquiries.update"],
  FINANCE_OFFICER: ["org.read", "dashboard.read", "finance.read", "finance.manage", "statements.read", "statements.approve"],
  VAULT_MANAGER: ["org.read", "vault.read", "vault.upload", "vault.download", "vault.verify", "vault.grant_access"],
  LANDLORD: [], TENANT: [],
};

export const ROLE_DESCRIPTIONS: Readonly<Record<ContourRoleKey, { displayName: string; description: string }>> = {
  OWNER: { displayName: "Owner", description: "Full agency access and ownership controls." },
  BROKER_MANAGER: { displayName: "Broker manager", description: "Runs agency operations and invites team members." },
  ADMIN_STAFF: { displayName: "Admin staff", description: "Operational read access with PWA access by default." },
  FIELD_AGENT: { displayName: "Field agent", description: "PWA-first access for assigned field work." },
  FINANCE_OFFICER: { displayName: "Finance officer", description: "Finance and statement operations without vault access." },
  VAULT_MANAGER: { displayName: "Vault manager", description: "Legal document operations subject to vault grants." },
  LANDLORD: { displayName: "Landlord", description: "Scoped landlord portal access only." },
  TENANT: { displayName: "Tenant", description: "Scoped tenant portal access only." },
};

export function normalizeContourRole(value: string | null | undefined): ContourRoleKey {
  return value && CONTOUR_ROLE_KEYS.includes(value as ContourRoleKey) ? value as ContourRoleKey : "FIELD_AGENT";
}

export function resolveApplicationRole(userRole: string | undefined, membershipRole: string): string {
  if (membershipRole === "owner") return "SUPER_ADMIN";
  if (membershipRole === "admin") return "BROKER_MANAGER";
  return userRole || "FIELD_AGENT";
}

export function resolveContourRole(userRole: string | undefined, membershipRole: string, assignedRole?: string): ContourRoleKey {
  if (assignedRole) return normalizeContourRole(assignedRole);
  if (membershipRole === "owner" || userRole === "SUPER_ADMIN") return "OWNER";
  if (membershipRole === "admin" || userRole === "BROKER_MANAGER") return "BROKER_MANAGER";
  return normalizeContourRole(userRole);
}

export function hasRequiredRole(userRole: string | undefined, requiredRoles: readonly string[]): boolean {
  return Boolean(userRole && requiredRoles.includes(userRole));
}

export function roleHasPermission(role: ContourRoleKey, permission: Permission): boolean {
  return ROLE_PRESETS[role].includes(permission);
}

export function permissionsForRole(role: ContourRoleKey): readonly Permission[] {
  return ROLE_PRESETS[role];
}

export function isManagementRole(role: ContourRoleKey | string | undefined | null): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase();
  return normalized === "OWNER" || normalized === "BROKER_MANAGER" || normalized === "SUPER_ADMIN";
}

export function canManagePropertyPhotos(
  user: { id: string; role?: string | null; contourRole?: ContourRoleKey },
  property: { assignedAgentId?: string | null; createdById?: string | null }
): boolean {
  if (!user || !user.id) return false;
  if (isManagementRole(user.contourRole) || isManagementRole(user.role)) return true;
  return Boolean(
    (property.assignedAgentId && property.assignedAgentId === user.id) ||
    (property.createdById && property.createdById === user.id)
  );
}
