import { describe, expect, it } from "vitest";
import { getPublicPropertyImageUrl, normalizePropertyImageUrl } from "./property-image-url";

describe("getPublicPropertyImageUrl", () => {
  it("uses the public app proxy for property photos", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://contour.banyalabs.com";
    expect(
      getPublicPropertyImageUrl(
        "https://cdn.banyalabs.com/",
        "contour-vault",
        "org-1/property_photo/photo.webp",
      ),
    ).toBe("https://contour.banyalabs.com/api/properties/images/org-1/property_photo/photo.webp");
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  });

  it("does not produce a machine-local URL when the CDN is unavailable", () => {
    expect(getPublicPropertyImageUrl(undefined, "contour-vault", "photo.webp")).toBeNull();
  });

  it("normalizes existing CDN property photos to the public app proxy", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://contour.banyalabs.com";
    expect(normalizePropertyImageUrl("https://cdn.banyalabs.com/contour-vault/org-1/property_photo/photo.webp"))
      .toBe("https://contour.banyalabs.com/api/properties/images/org-1/property_photo/photo.webp");
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  });
});
