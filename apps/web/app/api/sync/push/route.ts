import "../../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import { getPrismaClient, updateSyncState } from "@contour/db";

export const dynamic = "force-dynamic";

type SyncOperationPayload = Record<string, unknown>;

type SyncPushOperation = {
  id: string;
  entityType: "deal" | "client" | "listing";
  entityId: string;
  operationType: "create" | "update" | "delete";
  payload: SyncOperationPayload;
};

type SyncPushRequest = {
  deviceId: string;
  operations: SyncPushOperation[];
};

async function applyOperation(
  prisma: ReturnType<typeof getPrismaClient>,
  operation: SyncPushOperation,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { entityType, entityId, operationType, payload } = operation;

    switch (entityType) {
      case "deal":
        if (operationType === "create" || operationType === "update") {
          await prisma.deal.upsert({
            where: { id: entityId },
            create: { id: entityId, ...payload } as never,
            update: payload as never,
          });
        } else {
          await prisma.deal.delete({ where: { id: entityId } });
        }
        break;
      case "client":
        if (operationType === "create" || operationType === "update") {
          await prisma.client.upsert({
            where: { id: entityId },
            create: { id: entityId, ...payload } as never,
            update: payload as never,
          });
        } else {
          await prisma.client.delete({ where: { id: entityId } });
        }
        break;
      case "listing":
        if (operationType === "create" || operationType === "update") {
          await prisma.listing.upsert({
            where: { id: entityId },
            create: { id: entityId, ...payload } as never,
            update: payload as never,
          });
        } else {
          await prisma.listing.delete({ where: { id: entityId } });
        }
        break;
    }

    return { success: true };
  } catch (error) {
    console.error("[v0] Failed to apply operation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncPushRequest;
    const { deviceId, operations } = body;

    if (!deviceId || !operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { error: "deviceId and operations array are required" },
        { status: 400 },
      );
    }

    const prisma = getPrismaClient();

    const device = await prisma.syncDevice.findUnique({ where: { deviceId } });
    if (!device) {
      return NextResponse.json({ error: "Device not registered" }, { status: 404 });
    }

    const results: Array<{ operationId: string; success: boolean; error?: string }> = [];

    for (const operation of operations) {
      const result = await applyOperation(prisma, operation);
      results.push({
        operationId: operation.id,
        success: result.success,
        ...(result.error ? { error: result.error } : {}),
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    await updateSyncState(prisma, deviceId, {
      lastSyncAt: new Date(),
      consecutiveFailures: failureCount > 0 ? 1 : 0,
    });

    return NextResponse.json({
      synced: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error("[v0] Sync push error:", error);
    return NextResponse.json({ error: "Failed to push data" }, { status: 500 });
  }
}
