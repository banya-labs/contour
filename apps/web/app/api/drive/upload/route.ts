import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getPrismaClient, uploadDriveFile, FileType } from "@contour/db";

export const dynamic = "force-dynamic";

// Map MIME types to FileType enum
function mimeTypeToFileType(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) return FileType.image;
  if (mimeType === "application/pdf") return FileType.pdf;
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "text/plain"
  )
    return FileType.document;
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return FileType.spreadsheet;
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return FileType.presentation;
  if (mimeType.startsWith("video/")) return FileType.video;
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/x-7z-compressed"
  )
    return FileType.archive;
  return FileType.other;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;
    const workspaceId = formData.get("workspaceId") as string;
    const createdById = formData.get("createdById") as string;
    const description = formData.get("description") as string;
    const listingId = formData.get("listingId") as string | null;
    const dealId = formData.get("dealId") as string | null;
    const clientId = formData.get("clientId") as string | null;
    const leaseId = formData.get("leaseId") as string | null;

    if (!file || !folderId || !workspaceId || !createdById) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blobName = `${workspaceId}/${folderId}/${Date.now()}-${file.name}`;
    const blob = await put(blobName, file, {
      access: "private",
      addRandomSuffix: true,
    });

    // Record in database
    const prisma = getPrismaClient();
    const fileType = mimeTypeToFileType(file.type);

    const driveFile = await uploadDriveFile(prisma, {
      name: file.name,
      folderId,
      workspaceId,
      createdById,
      blobUrl: blob.url,
      blobKey: blob.pathname,
      fileType,
      mimeType: file.type,
      fileSize: BigInt(file.size),
      description: description || undefined,
      listingId: listingId || undefined,
      dealId: dealId || undefined,
      clientId: clientId || undefined,
      leaseId: leaseId || undefined,
    });

    return NextResponse.json({ file: driveFile }, { status: 201 });
  } catch (error) {
    console.error("[v0] File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
