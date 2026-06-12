export const contourRoles = ["admin", "agent", "finance", "legal", "auditor"] as const;

export type ContourRole = (typeof contourRoles)[number];

export function isContourRole(value: string): value is ContourRole {
  return (contourRoles as readonly string[]).includes(value);
}

export function canViewKycFields(role: ContourRole): boolean {
  return role !== "agent";
}

export function canWriteKycFields(role: ContourRole): boolean {
  return role === "admin" || role === "legal";
}

export function canWriteFinancialRecords(role: ContourRole): boolean {
  return role === "admin" || role === "finance";
}

export function canManageUsers(role: ContourRole): boolean {
  return role === "admin";
}
