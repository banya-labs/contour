"use server";

import { redirect } from "next/navigation";
import {
  createContourListing,
  getPrismaClient,
  parseContourListingFormData,
  updateContourListing,
} from "@contour/db";

export async function saveContourListingAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "").trim();
  const input = parseContourListingFormData(formData);
  const prisma = getPrismaClient();

  if (listingId) {
    const listing = await updateContourListing(prisma, listingId, input);
    redirect(`/listings/${listing.id}`);
  }

  const listing = await createContourListing(prisma, input);
  redirect(`/listings/${listing.id}`);
}
