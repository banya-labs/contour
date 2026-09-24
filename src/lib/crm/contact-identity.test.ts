import { describe, expect, it } from "vitest";
import { buildContactIdentity } from "./contact-identity";

describe("buildContactIdentity", () => {
  it("normalizes equivalent phone formats within an organization", () => {
    expect(buildContactIdentity("org-1", "+260 977 123 456")).toBe(
      "org-1:260977123456",
    );
    expect(buildContactIdentity("org-1", "260977123456")).toBe(
      "org-1:260977123456",
    );
  });

  it("creates a deterministic fallback identity for an empty phone", () => {
    expect(buildContactIdentity("org-1", "", "Jane Doe")).toBe(
      "org-1:name:jane doe",
    );
  });
});
