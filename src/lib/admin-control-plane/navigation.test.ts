import { describe, expect, it } from "vitest";
import { CONTROL_PLANE_NAVIGATION } from "./navigation";

describe("control-plane navigation contract", () => {
  it("points every primary destination at an implemented admin route", () => {
    expect(CONTROL_PLANE_NAVIGATION.primary.map((item) => item.href)).toEqual([
      "/admin",
      "/admin/agencies",
      "/admin/subscriptions",
      "/admin/staff",
    ]);
    expect(CONTROL_PLANE_NAVIGATION.primary.find((item) => item.label === "Governance")?.label).toBe("Governance");
  });

  it("keeps governance sub-navigation explicit", () => {
    expect(CONTROL_PLANE_NAVIGATION.governance.map((item) => item.href)).toEqual(["/admin/staff", "/admin/mcp"]);
  });
});
