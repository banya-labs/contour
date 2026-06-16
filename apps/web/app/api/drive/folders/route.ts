import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient, listDriveFolders, createDriveFolder } from "@contour/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const searchParams = request.nextUrl.searchParams;
    const parentFolderId = searchParams.get("parentId") || null;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }

    const folders = await listDriveFolders(prisma, parentFolderId, workspaceId);

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("[v0] Folder listing error:", error);
    return NextResponse.json(
      { error: "Failed to list folders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const body = await request.json();
    
    const { name, workspaceId, createdById, parentFolderId, description } = body;

    if (!name || !workspaceId || !createdById) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const folder = await createDriveFolder(prisma, {
      name,
      workspaceId,
      createdById,
      parentFolderId,
      description,
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("[v0] Folder creation error:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
