import { describe, expect, it } from "vitest";
import { agencyProfileSchema, inviteSchema, normalizeSlug } from "./onboarding-contract";

describe("onboarding contracts", () => {
  it("normalizes slugs without accepting path separators", () => {
    expect(normalizeSlug("  Lusaka / North Agency  ")).toBe("lusaka-north-agency");
    expect(agencyProfileSchema.safeParse({ name: "Agency", slug: "../admin" }).success).toBe(false);
  });

  it("defaults the first release to Zambia operations", () => {
    const result = agencyProfileSchema.parse({ name: "Contour Agency", slug: "contour-agency" });
    expect(result.country).toBe("ZM");
    expect(result.currency).toBe("ZMW");
    expect(result.timezone).toBe("Africa/Lusaka");
  });

  it("only permits approved invited roles", () => {
    expect(inviteSchema.safeParse({ email: "agent@example.com", roleKey: "FIELD_AGENT" }).success).toBe(true);
    expect(inviteSchema.safeParse({ email: "agent@example.com", roleKey: "OWNER" }).success).toBe(false);
  });
});
