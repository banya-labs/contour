import { NextRequest, NextResponse } from "next/server";
import { s3Storage } from "@/lib/storage/s3";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");

  if (!objectKey || !objectKey.includes("/property_photo/") || objectKey.includes("..")) {
    return NextResponse.json({ error: "Invalid property image path" }, { status: 400 });
  }

  try {
    const image = await s3Storage.getObject(objectKey);
    return new NextResponse(new Uint8Array(image.body), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(image.contentLength),
        "Content-Type": image.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Property image unavailable" }, { status: 404 });
  }
}
