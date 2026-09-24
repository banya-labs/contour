export const SUPPORT_ACCESS_MAX_VIEW_MINUTES = 60;
export const SUPPORT_ACCESS_MAX_ACT_AS_MINUTES = 15;

export type SupportAccessMode = "VIEW_ONLY" | "ACT_AS";

export function supportAccessDuration(mode: SupportAccessMode, requestedMinutes: number): number {
  const minimum = 5;
  const maximum = mode === "ACT_AS" ? SUPPORT_ACCESS_MAX_ACT_AS_MINUTES : SUPPORT_ACCESS_MAX_VIEW_MINUTES;
  return Math.min(Math.max(Math.trunc(requestedMinutes), minimum), maximum);
}

export interface SupportAccessRecord {
  startedByUserId: string;
  mode: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export function isSupportAccessActive(access: SupportAccessRecord | null | undefined, operatorUserId: string, now = new Date()): boolean {
  return Boolean(access && access.startedByUserId === operatorUserId && !access.revokedAt && access.expiresAt > now);
}

export function canMutateThroughSupportAccess(access: SupportAccessRecord | null | undefined, operatorUserId: string, now = new Date()): boolean {
  return isSupportAccessActive(access, operatorUserId, now) && access?.mode === "ACT_AS";
}
