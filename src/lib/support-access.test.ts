import { describe, expect, it } from "vitest";
import { canMutateThroughSupportAccess, isSupportAccessActive } from "./support-access";

const future = new Date(Date.now() + 60_000);

describe("support access guards", () => {
  it("allows only the originating operator to use an active session", () => {
    const access = { startedByUserId: "operator_1", mode: "VIEW_ONLY", expiresAt: future, revokedAt: null };
    expect(isSupportAccessActive(access, "operator_1")).toBe(true);
    expect(isSupportAccessActive(access, "operator_2")).toBe(false);
  });

  it("does not allow view-only sessions to mutate agency data", () => {
    const access = { startedByUserId: "operator_1", mode: "VIEW_ONLY", expiresAt: future, revokedAt: null };
    expect(canMutateThroughSupportAccess(access, "operator_1")).toBe(false);
  });

  it("allows mutation only for an active act-as session", () => {
    const access = { startedByUserId: "operator_1", mode: "ACT_AS", expiresAt: future, revokedAt: null };
    expect(canMutateThroughSupportAccess(access, "operator_1")).toBe(true);
    expect(canMutateThroughSupportAccess({ ...access, revokedAt: new Date() }, "operator_1")).toBe(false);
  });

  it("rejects expired act-as sessions", () => {
    const access = { startedByUserId: "operator_1", mode: "ACT_AS", expiresAt: new Date(Date.now() - 1), revokedAt: null };
    expect(isSupportAccessActive(access, "operator_1")).toBe(false);
    expect(canMutateThroughSupportAccess(access, "operator_1")).toBe(false);
  });

  it("rejects revoked act-as sessions", () => {
    const access = { startedByUserId: "operator_1", mode: "ACT_AS", expiresAt: future, revokedAt: new Date() };
    expect(isSupportAccessActive(access, "operator_1")).toBe(false);
  });
});
