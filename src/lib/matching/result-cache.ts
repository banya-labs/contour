import { MATCH_POLICY_VERSION } from "./policy";
export function matchCacheKey(scope: { organizationId: string; userId: string }, kind: string, id: string, view: string, page: number) {
  return `contour_matches_${JSON.stringify([scope.organizationId, scope.userId, MATCH_POLICY_VERSION, kind, id, view, page])}`;
}
export function canRequestMatches(id: string) { return Boolean(id) && !/^(outbox_|deal_)/.test(id); }
export function isCurrentMatchRequest(requestKey: string, currentKey: string) { return requestKey === currentKey; }
export function clearMatchCache() {
  if (typeof window === "undefined") return;
  for (const key of Object.keys(localStorage)) if (key.startsWith("contour_matches_")) localStorage.removeItem(key);
}
