import { describe, expect, it } from "vitest";
import { CONTROL_PLANE_NAVIGATION, getControlPlanePrimaryItems, isControlPlaneItemActive } from "./navigation";

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

  it("renders Governance once and highlights the active child route", () => {
    expect(getControlPlanePrimaryItems().filter((item) => item.label === "Governance")).toHaveLength(1);
    expect(isControlPlaneItemActive("/admin/staff", "/admin/staff")).toBe(true);
    expect(isControlPlaneItemActive("/admin/staff", "/admin/mcp")).toBe(false);
  });
});
