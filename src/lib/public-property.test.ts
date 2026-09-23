import { describe, expect, it } from "vitest";
import { normalizePropertyTitle, propertySlugFromTitle, publicPropertyPath } from "./public-property";
import { normalizeWhatsAppPhone } from "./phone-input";

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

  it("normalizes WhatsApp numbers to international format", () => {
    expect(normalizeWhatsAppPhone("097 123 4567")).toBe("+260971234567");
    expect(normalizeWhatsAppPhone("+27821234567")).toBe("+27821234567");
    expect(normalizeWhatsAppPhone("")).toBeNull();
  });

  it("rejects incomplete WhatsApp numbers", () => {
    expect(() => normalizeWhatsAppPhone("097123")).toThrow();
  });
});
