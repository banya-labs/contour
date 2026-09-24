import { env } from "@/env";
import { db } from "@/lib/db";

export const CONTROL_PLANE_PATH = "/admin";

export function getControlPlaneOwnerEmails(): string[] {
  return env.CONTOUR_CONTROL_PLANE_OWNER_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isControlPlaneBootstrapOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return getControlPlaneOwnerEmails().includes(email.trim().toLowerCase());
}

export function hasControlPlaneAccess(email: string | null | undefined, persistedStaff = false): boolean {
  return persistedStaff || isControlPlaneBootstrapOwner(email);
}

export async function hasPersistedControlPlaneAccess(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const staff = await db.platformStaff.findUnique({
    where: { userId },
    select: { status: true },
  });
  return staff?.status === "ACTIVE";
}
