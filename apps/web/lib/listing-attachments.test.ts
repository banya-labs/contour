import { describe, expect, it } from "vitest";
import {
  buildListingAttachmentPath,
  isImageMimeType,
  pickPrimaryListingImage,
} from "./listing-attachments";

describe("listing attachments", () => {
  it("builds stable blob paths for uploads", () => {
    expect(buildListingAttachmentPath("listing-1", "Unit 104, East Park Mall.pdf", "abc123")).toBe(
      "listings/listing-1/abc123-unit-104-east-park-mall.pdf",
    );
  });

  it("treats image mime types as previewable", () => {
    expect(isImageMimeType("image/jpeg")).toBe(true);
    expect(isImageMimeType("application/pdf")).toBe(false);
  });

  it("picks the first image attachment for a thumbnail", () => {
    expect(
      pickPrimaryListingImage([
        { mimeType: "application/pdf", blobUrl: "https://blob.example/brochure.pdf" },
        { mimeType: "image/png", blobUrl: "https://blob.example/front.png" },
      ]),
    ).toEqual("https://blob.example/front.png");
  });
});
