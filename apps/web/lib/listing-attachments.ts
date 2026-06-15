import type { ContourListingDocumentSummary } from "@contour/db";

export type ListingAttachmentDraft = {
  mimeType: string | null;
  blobUrl: string;
};

export function isImageMimeType(mimeType: string | null) {
  return Boolean(mimeType?.toLowerCase().startsWith("image/"));
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function buildListingAttachmentPath(listingId: string, fileName: string, suffix: string) {
  const cleanedFileName = sanitizeFileName(fileName);
  return `listings/${listingId}/${suffix}-${cleanedFileName}`;
}

export function pickPrimaryListingImage(
  attachments: Array<Pick<ContourListingDocumentSummary, "mimeType" | "blobUrl">>,
) {
  return attachments.find((attachment) => isImageMimeType(attachment.mimeType))?.blobUrl ?? null;
}

export function summarizeAttachmentKind(mimeType: string | null) {
  return isImageMimeType(mimeType) ? "image" : "file";
}
