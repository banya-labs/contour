import "../../../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import { uploadListingAttachments } from "../../../../../lib/listing-attachment-upload";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const listingId = readString(formData, "listingId") || id;
  const returnTo = readString(formData, "returnTo") || `/listings/${listingId}`;
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  try {
    const attachments = await uploadListingAttachments(listingId, files);
    return NextResponse.json({
      attachments,
      count: attachments.length,
      returnTo,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload attachments.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
