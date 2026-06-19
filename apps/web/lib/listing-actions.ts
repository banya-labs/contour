"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  createContourListing,
  getPrismaClient,
  parseContourListingFormData,
  updateContourListing,
} from "@contour/db";
import { reverseGeocodeAddress } from "./location-reverse";

export async function saveContourListingAction(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "").trim();
  const input = parseContourListingFormData(formData);
  const prisma = getPrismaClient();
  const hasCoordinates = input.latitude != null && input.longitude != null;
  const addressFromCoordinates = hasCoordinates
    ? await reverseGeocodeAddress(input.latitude as number, input.longitude as number)
    : null;
  const normalizedInput = {
    ...input,
    address: hasCoordinates ? addressFromCoordinates ?? input.address : input.address,
  };

  if (listingId) {
    const listing = await updateContourListing(prisma, listingId, normalizedInput);
    revalidateTag("contour-dashboard", "max");
    revalidateTag("contour-listings-page-data", "max");
    revalidateTag("contour-lookup-options", "max");
    redirect(`/listings/${listing.id}`);
  }

  const listing = await createContourListing(prisma, normalizedInput);
  revalidateTag("contour-dashboard", "max");
  revalidateTag("contour-listings-page-data", "max");
  revalidateTag("contour-lookup-options", "max");
  redirect(`/listings/${listing.id}`);
}
