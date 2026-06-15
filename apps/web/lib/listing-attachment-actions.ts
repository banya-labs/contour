"use server";

import { redirect } from "next/navigation";
import { uploadListingAttachments } from "./listing-attachment-upload";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function uploadListingAttachmentsAction(formData: FormData) {
  const listingId = readString(formData, "listingId");
  const returnTo = readString(formData, "returnTo") || `/listings/${listingId}`;

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
  await uploadListingAttachments(listingId, files);

  redirect(returnTo);
}
