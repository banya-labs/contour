import { env } from "@/env";
import { db } from "@/lib/db";

export const CONTROL_PLANE_PATH = "/admin";

export function getControlPlaneAccessDestination(hasSession: boolean, hasAccess: boolean): string | null {
  if (!hasSession) return "/sign-in?redirect_url=%2Fadmin";
  if (!hasAccess) return "/admin/access-denied";
  return null;
}

export function getControlPlaneOwnerEmails(): string[] {
  return (env.CONTOUR_CONTROL_PLANE_OWNER_EMAILS || "").split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isControlPlaneBootstrapOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return getControlPlaneOwnerEmails().includes(email.trim().toLowerCase());
}

export function hasControlPlaneAccess(email: string | null | undefined, persistedStaff = false, emailVerified = false): boolean {
  return persistedStaff || (emailVerified && isControlPlaneBootstrapOwner(email));
}

export async function hasPersistedControlPlaneAccess(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const staff = await db.platformStaff.findUnique({
    where: { userId },
    select: { status: true },
  });
  return staff?.status === "ACTIVE";
}

export async function getPlatformActor(userId: string | null | undefined, email: string | null | undefined) {
  if (!userId || !email) return null;
  const staff = await db.platformStaff.findUnique({ where: { userId }, select: { id: true, role: true, status: true } });
  if (staff) return staff.status === "ACTIVE" ? { userId, staffId: staff.id, role: staff.role } : null;
  if (!isControlPlaneBootstrapOwner(email)) return null;
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!user?.emailVerified || user.email.toLowerCase() !== email.toLowerCase()) return null;
  return { userId, staffId: null, role: "OWNER" as const };
}
