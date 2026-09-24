export const PLATFORM_ROLES = ["OWNER", "OPERATIONS", "SUPPORT", "FINANCE", "COMPLIANCE", "READ_ONLY"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const PLATFORM_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type PlatformStatus = (typeof PLATFORM_STATUSES)[number];

export const PLATFORM_PERMISSIONS = [
  "platform.read",
  "staff.manage",
  "agency.read",
  "agency.configure",
  "support.impersonate",
  "support.act_as",
  "billing.read",
  "billing.adjust",
  "account.suspend",
  "account.delete",
  "audit.read",
  "system.read",
] as const;
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<PlatformRole, readonly PlatformPermission[]> = {
  OWNER: PLATFORM_PERMISSIONS,
  OPERATIONS: ["platform.read", "agency.read", "agency.configure", "support.impersonate", "billing.read", "account.suspend", "audit.read", "system.read"],
  SUPPORT: ["platform.read", "agency.read", "support.impersonate", "audit.read"],
  FINANCE: ["platform.read", "agency.read", "billing.read", "billing.adjust", "audit.read"],
  COMPLIANCE: ["platform.read", "agency.read", "audit.read", "system.read"],
  READ_ONLY: ["platform.read", "agency.read", "billing.read", "audit.read", "system.read"],
};

export interface PlatformStaffRecord {
  userId: string;
  role: PlatformRole;
  status: PlatformStatus;
}

export function canPlatformRole(role: PlatformRole, permission: PlatformPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isActivePlatformStaff(staff: PlatformStaffRecord | null | undefined): boolean {
  return Boolean(staff && staff.status === "ACTIVE");
}
