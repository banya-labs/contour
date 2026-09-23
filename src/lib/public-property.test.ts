import { describe, expect, it } from "vitest";
import { normalizePropertyTitle, propertySlugFromTitle, publicPropertyPath } from "./public-property";

describe("public property identity", () => {
  it("normalizes names for case-insensitive uniqueness", () => {
    expect(normalizePropertyTitle("  Glass   House ")).toBe("glass house");
  });

  it("builds an organisation-scoped public path", () => {
    expect(publicPropertyPath("agency-one", "glass-house")).toBe("/p/agency-one/glass-house");
  });

  it("derives a stable property slug from its title", () => {
    expect(propertySlugFromTitle("Glass House")).toBe("glass-house");
  });
});
