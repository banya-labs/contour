import { describe, expect, it } from "vitest";
import { agencyProfileSchema, inviteSchema, normalizeSlug, parseInviteInput } from "./onboarding-contract";

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

  describe("parseInviteInput", () => {
    it("parses full URL with invitationId and token", () => {
      const parsed = parseInviteInput("https://contour.app/accept-invitation/inv_12345?token=tok_secret_6789");
      expect(parsed.invitationId).toBe("inv_12345");
      expect(parsed.token).toBe("tok_secret_6789");
    });

    it("parses relative path with invitationId and token", () => {
      const parsed = parseInviteInput("/accept-invitation/cly123456789?token=secret123");
      expect(parsed.invitationId).toBe("cly123456789");
      expect(parsed.token).toBe("secret123");
    });

    it("parses token query string format", () => {
      const parsed = parseInviteInput("token=my_secret_token_abc");
      expect(parsed.token).toBe("my_secret_token_abc");
    });

    it("returns raw string as fallback for invitationId/token", () => {
      const parsed = parseInviteInput("inv_standalone_999");
      expect(parsed.invitationId).toBe("inv_standalone_999");
      expect(parsed.token).toBe("inv_standalone_999");
    });

    it("handles empty or whitespace inputs gracefully", () => {
      expect(parseInviteInput("")).toEqual({});
      expect(parseInviteInput("   ")).toEqual({});
      expect(parseInviteInput(undefined)).toEqual({});
    });
  });
});
