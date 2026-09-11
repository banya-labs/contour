export const ORGANIZATION_ROLES = [
  "SUPER_ADMIN",
  "BROKER_MANAGER",
  "FIELD_AGENT",
  "FINANCE_OFFICER",
  "LANDLORD",
  "TENANT",
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export function resolveApplicationRole(userRole: string | undefined, membershipRole: string): string {
  if (membershipRole === "owner") return "SUPER_ADMIN";
  if (membershipRole === "admin") return "BROKER_MANAGER";
  return userRole || "FIELD_AGENT";
}

export function hasRequiredRole(userRole: string | undefined, requiredRoles: readonly string[]): boolean {
  return Boolean(userRole && requiredRoles.includes(userRole));
}
