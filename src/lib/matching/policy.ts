import type { MatchResult } from "./types";
export const PROPERTY_MATCH_THRESHOLD = 70;
export const MATCH_POLICY_VERSION = "2026-10-04";
export const TERMINAL_INQUIRY_STATUSES = ["CLOSED", "CLOSED_WON", "CLOSED_LOST"] as const;
export function isQualifyingMatch(result: Pick<MatchResult, "score" | "hardFailures">): boolean {
  return result.score > PROPERTY_MATCH_THRESHOLD && result.hardFailures.length === 0;
}
export function isActiveInquiry(status: string): boolean {
  return !TERMINAL_INQUIRY_STATUSES.some((terminal) => terminal === status);
}
