import { describe, expect, it } from "vitest";
import { matchCacheKey, canRequestMatches, isCurrentMatchRequest } from "./result-cache";
describe("match cache isolation", () => {
  it("separates tenant/user/entity/query/policy", () => {
    const scope = { organizationId: "o", userId: "u" };
    const a = matchCacheKey(scope, "properties", "a", "qualifying", 1);
    expect(a).not.toBe(matchCacheKey({ ...scope, organizationId: "other" }, "properties", "a", "qualifying", 1));
    expect(a).not.toBe(matchCacheKey({ ...scope, userId: "other" }, "properties", "a", "qualifying", 1));
    expect(a).not.toBe(matchCacheKey(scope, "properties", "a", "near", 1));
  });
  it("never requests temporary IDs and discards superseded requests", () => {
    expect(canRequestMatches("outbox_123")).toBe(false);
    expect(canRequestMatches("inquiry123")).toBe(true);
    expect(isCurrentMatchRequest("a", "b")).toBe(false);
  });
});
