import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLE_PRESETS } from "./authorization";
import { FIELD_AGENT_BASELINE, PERMISSION_GROUPS, groupKeysForPermissions, permissionsForGroups } from "./authorization-groups";

describe("authorization groups", () => {
  it("assigns every canonical permission to exactly one group", () => {
    const grouped = PERMISSION_GROUPS.flatMap((group) => group.permissions);
    expect(new Set(grouped).size).toBe(PERMISSIONS.length);
    expect(grouped).toHaveLength(PERMISSIONS.length);
  });

  it("keeps Field Agent baseline strictly PWA-only", () => {
    expect(FIELD_AGENT_BASELINE).toEqual([
      "pwa.access",
      "pwa.listings.create",
      "pwa.listings.share",
      "pwa.inquiries.update",
    ]);
    expect(ROLE_PRESETS.FIELD_AGENT).toEqual(FIELD_AGENT_BASELINE);
    expect(FIELD_AGENT_BASELINE).not.toContain("dashboard.read");
    expect(FIELD_AGENT_BASELINE).not.toContain("properties.read");
  });

  it("converts selected groups to permissions and back", () => {
    const selected = permissionsForGroups(["clients_leads", "deals_pipeline"]);
    expect(selected).toContain("leads.read");
    expect(selected).toContain("pipeline.update");
    expect(groupKeysForPermissions(selected)).toEqual(["clients_leads", "deals_pipeline"]);
  });
});
