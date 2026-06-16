import "../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import { getPrismaClient, registerDevice } from "@contour/db";

export const dynamic = "force-dynamic";

interface RegisterDeviceRequest {
  userId: string;
  deviceId: string;
  deviceType: "desktop" | "web" | "mobile";
  appVersion: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterDeviceRequest;
    const { userId, deviceId, deviceType, appVersion } = body;

    if (!userId || !deviceId || !deviceType || !appVersion) {
      return NextResponse.json(
        { error: "userId, deviceId, deviceType, and appVersion are required" },
        { status: 400 },
      );
    }

    const prisma = getPrismaClient();

    const device = await registerDevice(prisma, {
      userId,
      deviceId,
      deviceType,
      appVersion,
    });

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        deviceId: device.deviceId,
        userId: device.userId,
        deviceType: device.deviceType,
        appVersion: device.appVersion,
        createdAt: device.createdAt,
      },
    });
  } catch (error) {
    console.error("[v0] Device registration error:", error);

    return NextResponse.json(
      { error: "Failed to register device" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 },
      );
    }

    const prisma = getPrismaClient();

    const devices = await prisma.syncDevice.findMany({
      where: { userId },
      select: {
        id: true,
        deviceId: true,
        deviceType: true,
        appVersion: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: { lastSeenAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      devices,
    });
  } catch (error) {
    console.error("[v0] Get devices error:", error);

    return NextResponse.json(
      { error: "Failed to get devices" },
      { status: 500 },
    );
  }
}
