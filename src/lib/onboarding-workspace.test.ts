import { describe, expect, it } from "vitest";
import { shouldCreateWorkspace } from "./onboarding-workspace";

describe("shouldCreateWorkspace", () => {
  it("blocks workspace creation when the user already belongs to an organization", () => {
    expect(shouldCreateWorkspace(1)).toBe(false);
    expect(shouldCreateWorkspace(4)).toBe(false);
  });

  it("allows workspace creation only with no memberships", () => {
    expect(shouldCreateWorkspace(0)).toBe(true);
  });
});
