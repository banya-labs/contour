export const PROPERTY_AGENT_LOCK_DAYS = 30;

export function getPropertyAgentLockExpiry(assignedAt: Date): Date {
  return new Date(assignedAt.getTime() + PROPERTY_AGENT_LOCK_DAYS * 24 * 60 * 60 * 1000);
}

export function canChangePropertyAgent(lockExpiresAt: Date | null, now = new Date()): boolean {
  return !lockExpiresAt || lockExpiresAt.getTime() <= now.getTime();
}
