import { describe, expect, it } from "vitest";
import { getPublicPropertyImageUrl } from "./property-image-url";

describe("getPublicPropertyImageUrl", () => {
  it("uses the configured CDN even when it is cdn.banyalabs.com", () => {
    expect(
      getPublicPropertyImageUrl(
        "https://cdn.banyalabs.com/",
        "contour-vault",
        "org-1/property_photo/photo.webp",
      ),
    ).toBe("https://cdn.banyalabs.com/contour-vault/org-1/property_photo/photo.webp");
  });

  it("does not produce a machine-local URL when the CDN is unavailable", () => {
    expect(getPublicPropertyImageUrl(undefined, "contour-vault", "photo.webp")).toBeNull();
  });
});
