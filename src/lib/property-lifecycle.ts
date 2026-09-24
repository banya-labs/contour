import type { PropertyStatus } from "@prisma/client";

export function isPropertyAvailableForNewOpportunity(status: PropertyStatus): boolean {
  return status !== "SOLD";
}
