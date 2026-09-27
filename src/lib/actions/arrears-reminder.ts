const COOLDOWN_MS = 4 * 24 * 60 * 60 * 1000;

export function canQueueArrearsReminder(lastSentAt: Date | null, now: Date): boolean {
  return !lastSentAt || now.getTime() - lastSentAt.getTime() >= COOLDOWN_MS;
}
