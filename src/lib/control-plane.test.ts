import { describe, expect, it } from "vitest";
import { getControlPlaneAccessDestination, getControlPlaneOwnerEmails, hasControlPlaneAccess, isControlPlaneBootstrapOwner } from "./control-plane";

describe("control plane access", () => {
  it("fails closed when no owner emails are configured", () => {
    expect(getControlPlaneOwnerEmails()).toEqual([]);
    expect(hasControlPlaneAccess("owner@example.com")).toBe(false);
  });

  it("does not grant access from an agency role without a session identity", () => {
    expect(isControlPlaneBootstrapOwner(undefined)).toBe(false);
    expect(hasControlPlaneAccess(undefined)).toBe(false);
  });

  it("redirects unauthenticated admins to sign-in and authenticated non-staff to access denied", () => {
    expect(getControlPlaneAccessDestination(false, false)).toBe("/sign-in?redirect_url=%2Fadmin");
    expect(getControlPlaneAccessDestination(true, false)).toBe("/admin/access-denied");
    expect(getControlPlaneAccessDestination(true, true)).toBeNull();
  });
});
