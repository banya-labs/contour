import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ staff: vi.fn(), user: vi.fn() }));
vi.mock("@/env", () => ({ env: { CONTOUR_CONTROL_PLANE_OWNER_EMAILS: "owner@example.com" } }));
vi.mock("@/lib/db", () => ({ db: { platformStaff: { findUnique: mocks.staff }, user: { findUnique: mocks.user } } }));
import { getPlatformActor, hasControlPlaneAccess } from "./control-plane";
describe("bootstrap administration", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.staff.mockResolvedValue(null); });
  it("requires a verified owner email both at middleware and actor resolution", async () => {
    expect(hasControlPlaneAccess("owner@example.com")).toBe(false);
    mocks.user.mockResolvedValue({ email: "owner@example.com", emailVerified: false });
    expect(await getPlatformActor("user", "owner@example.com")).toBeNull();
    mocks.user.mockResolvedValue({ email: "owner@example.com", emailVerified: true });
    expect((await getPlatformActor("user", "owner@example.com"))?.role).toBe("OWNER");
  });
  it("does not bypass a staff suspension using the bootstrap allowlist", async () => {
    mocks.staff.mockResolvedValue({ id: "staff", role: "OWNER", status: "SUSPENDED" });
    expect(await getPlatformActor("user", "owner@example.com")).toBeNull();
    expect(mocks.user).not.toHaveBeenCalled();
  });
});
