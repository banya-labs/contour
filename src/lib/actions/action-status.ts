import type { ActionStatus } from "./action-types";

export const TERMINAL_ACTION_STATUSES: readonly ActionStatus[] = ["COMPLETED", "DISMISSED"];

export function isTerminalActionStatus(status: ActionStatus): boolean {
  return TERMINAL_ACTION_STATUSES.includes(status);
}
