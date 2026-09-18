import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  heic: "image/heic",
  heif: "image/heif",
};

const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    if (!path || path.length === 0) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL, { status: 307 });
    }

    // Sanitize path segments to prevent directory traversal
    const safeSegments = path
      .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, ""))
      .filter((s) => s.length > 0 && s !== ".." && s !== ".");

    if (safeSegments.length === 0) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL, { status: 307 });
    }

    const filePath = join(process.cwd(), "public", "uploads", ...safeSegments);

    if (!existsSync(filePath)) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL, { status: 307 });
    }

    const fileBuffer = await readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.warn("Upload serve error, redirecting to fallback:", error);
    return NextResponse.redirect(FALLBACK_IMAGE_URL, { status: 307 });
  }
}
