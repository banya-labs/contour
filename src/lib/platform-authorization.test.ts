import { describe, expect, it } from "vitest";
import { canPlatformRole, isActivePlatformStaff, PLATFORM_PERMISSIONS, type PlatformStaffRecord } from "./platform-authorization";

const staff = (overrides: Partial<PlatformStaffRecord> = {}): PlatformStaffRecord => ({
  userId: "user_1",
  role: "SUPPORT",
  status: "ACTIVE",
  ...overrides,
});

describe("platform authorization", () => {
  it("grants only the permissions assigned to a platform role", () => {
    expect(canPlatformRole("SUPPORT", "agency.read")).toBe(true);
    expect(canPlatformRole("SUPPORT", "billing.adjust")).toBe(false);
    expect(canPlatformRole("OWNER", "billing.adjust")).toBe(true);
  });

  it("fails closed for suspended staff", () => {
    expect(isActivePlatformStaff(staff({ status: "SUSPENDED" }))).toBe(false);
    expect(isActivePlatformStaff(staff({ role: "SUPPORT", status: "ACTIVE" }))).toBe(true);
  });

  it("keeps the permission vocabulary explicit", () => {
    expect(PLATFORM_PERMISSIONS).toContain("staff.manage");
    expect(PLATFORM_PERMISSIONS).toContain("support.impersonate");
  });
});
