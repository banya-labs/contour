import "../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import { getPrismaClient, registerDevice, getSyncState, getPendingSyncOperations, updateSyncState } from "@contour/db";

export const dynamic = "force-dynamic";

interface SyncPullRequest {
  deviceId: string;
  lastSyncToken?: string;
  since?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncPullRequest;
    const { deviceId, lastSyncToken, since } = body;

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    const prisma = getPrismaClient();

    // Verify device exists
    const device = await prisma.syncDevice.findUnique({
      where: { deviceId },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not registered" },
        { status: 404 },
      );
    }

    // Get sync state
    const syncState = await getSyncState(prisma, deviceId);

    // Get all deals (simplified - in production you'd implement real change tracking)
    const deals = await prisma.deal.findMany({
      where: {
        updatedAt: since
          ? { gte: new Date(since) }
          : { gte: syncState?.lastSyncAt || new Date(0) },
      },
      include: {
        listing: true,
        client: true,
        paymentPlans: { select: { id: true } },
        payments: { select: { id: true } },
      },
      take: 100,
    });

    // Get all clients
    const clients = await prisma.client.findMany({
      where: {
        updatedAt: since
          ? { gte: new Date(since) }
          : { gte: syncState?.lastSyncAt || new Date(0) },
      },
      take: 100,
    });

    // Get all listings
    const listings = await prisma.listing.findMany({
      where: {
        updatedAt: since
          ? { gte: new Date(since) }
          : { gte: syncState?.lastSyncAt || new Date(0) },
      },
      take: 100,
    });

    // Create a new sync token (in production, use a more sophisticated versioning system)
    const newSyncToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update sync state
    await updateSyncState(prisma, deviceId, {
      lastSyncToken: newSyncToken,
      lastSyncAt: new Date(),
      consecutiveFailures: 0,
    });

    return NextResponse.json({
      syncToken: newSyncToken,
      data: {
        deals,
        clients,
        listings,
      },
      hasMore: deals.length === 100 || clients.length === 100 || listings.length === 100,
    });
  } catch (error) {
    console.error("[v0] Sync pull error:", error);

    const prisma = getPrismaClient();
    const deviceId = (await request.json()).deviceId;

    if (deviceId) {
      const currentState = await getSyncState(prisma, deviceId);
      const failures = (currentState?.consecutiveFailures || 0) + 1;
      await updateSyncState(prisma, deviceId, {
        lastErrorCode: "PULL_ERROR",
        lastErrorAt: new Date(),
        consecutiveFailures: failures,
      });
    }

    return NextResponse.json(
      { error: "Failed to pull data" },
      { status: 500 },
    );
  }
}
