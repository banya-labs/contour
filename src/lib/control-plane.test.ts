import { describe, expect, it } from "vitest";
import { getControlPlaneOwnerEmails, hasControlPlaneAccess, isControlPlaneBootstrapOwner } from "./control-plane";

describe("control plane access", () => {
  it("fails closed when no owner emails are configured", () => {
    expect(getControlPlaneOwnerEmails()).toEqual([]);
    expect(hasControlPlaneAccess("owner@example.com")).toBe(false);
  });

  it("does not grant access from an agency role without a session identity", () => {
    expect(isControlPlaneBootstrapOwner(undefined)).toBe(false);
    expect(hasControlPlaneAccess(undefined)).toBe(false);
  });
});
