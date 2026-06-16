import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient, listDriveFiles, searchDriveFiles, FileType } from "@contour/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get("folderId");
    const query = searchParams.get("q");
    const workspaceId = searchParams.get("workspaceId");
    const fileType = searchParams.get("fileType");
    const listingId = searchParams.get("listingId");
    const dealId = searchParams.get("dealId");
    const clientId = searchParams.get("clientId");
    const leaseId = searchParams.get("leaseId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }

    if (query) {
      // Search across all files
      const result = await searchDriveFiles(prisma, workspaceId, query, {
        fileType: fileType as FileType | undefined,
        listingId: listingId || undefined,
        dealId: dealId || undefined,
        clientId: clientId || undefined,
        leaseId: leaseId || undefined,
      });

      return NextResponse.json(result);
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID or search query required" },
        { status: 400 }
      );
    }

    const files = await listDriveFiles(prisma, folderId);

    return NextResponse.json({ files, total: files.length });
  } catch (error) {
    console.error("[v0] File listing error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
