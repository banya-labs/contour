"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { createContourListingAttachment, getPrismaClient } from "@contour/db";
import { buildListingAttachmentPath } from "./listing-attachments";

function assertBlobUploadConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }
}

export async function uploadListingAttachments(listingId: string, files: File[]) {
  assertBlobUploadConfigured();

  if (!listingId) {
    throw new Error("Listing id is required");
  }

  if (!files.length) {
    throw new Error("At least one file is required");
  }

  const prisma = getPrismaClient();
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  const attachments = [];

  for (const file of files) {
    const pathname = buildListingAttachmentPath(listingId, file.name, crypto.randomUUID());
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    attachments.push(
      await createContourListingAttachment(prisma, {
        listingId,
        documentName: file.name,
        blobUrl: blob.url,
        blobKey: blob.pathname ?? pathname,
        mimeType: file.type || null,
        fileSizeBytes: file.size,
      }),
    );
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/edit`);
  revalidatePath("/listings");
  revalidatePath("/listings/map");

  return attachments;
}
