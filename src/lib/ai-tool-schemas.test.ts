import { describe, expect, it } from "vitest";
import {
  inquiryToolSchema,
  searchPropertiesToolSchema,
} from "./ai-tool-schemas";

describe("AI tool input schemas", () => {
  it("coerces bounded search query numbers", () => {
    const result = searchPropertiesToolSchema.safeParse({
      suburb: "Kabulonga",
      minPrice: "1000",
      maxPrice: "5000",
      bedrooms: "3",
      limit: "20",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPrice).toBe(1000);
      expect(result.data.bedrooms).toBe(3);
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejects an invalid price range and unsafe limit", () => {
    expect(searchPropertiesToolSchema.safeParse({ minPrice: 5000, maxPrice: 1000 }).success).toBe(false);
    expect(searchPropertiesToolSchema.safeParse({ limit: 5000 }).success).toBe(false);
  });

  it("requires the minimum fields for an inquiry", () => {
    expect(inquiryToolSchema.safeParse({ clientName: "A", clientPhone: "1" }).success).toBe(false);
    expect(inquiryToolSchema.safeParse({ clientName: "Alice Banda", clientPhone: "+260977123456" }).success).toBe(true);
  });
});
