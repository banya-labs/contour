import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient, getDriveFile, updateDriveFile, deleteDriveFile, incrementDownloadCount } from "@contour/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrismaClient();
    const file = await getDriveFile(prisma, id);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error("[v0] File fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const prisma = getPrismaClient();

    const file = await updateDriveFile(prisma, id, body);

    return NextResponse.json({ file });
  } catch (error) {
    console.error("[v0] File update error:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrismaClient();

    await deleteDriveFile(prisma, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] File deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

// Track download
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "incrementDownload") {
      const prisma = getPrismaClient();
      await incrementDownloadCount(prisma, id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[v0] File action error:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
