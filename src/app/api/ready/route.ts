import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redisPing } from "@/lib/redis";
import { S3StorageService } from "@/lib/storage/s3";

export async function GET() {
  try {
    const storage = new S3StorageService();
    const [database, redis, objectStorage] = await Promise.all([
      db.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      redisPing(),
      storage.ping(),
    ]);
    const production = process.env.NODE_ENV === "production";
    const ready = database && (!production || (redis && objectStorage));

    if (!ready) {
      return NextResponse.json(
        {
          status: "unhealthy",
          service: "contour-web",
          dependencies: { database, redis, objectStorage },
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        status: "ready",
        service: "contour-web",
        dependencies: { database, redis, objectStorage },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Readiness probe failed";
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "contour-web",
        dependencies: { database: false, redis: false, objectStorage: false },
        error: process.env.NODE_ENV === "production" ? "Dependency probe failed" : message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
