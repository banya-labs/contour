import "../../../lib/load-contour-env";
import { NextResponse } from "next/server";
import {
  getPrismaClient,
  getPendingSyncOperations,
  markSyncOperationAsSynced,
  markSyncOperationAsFailed,
  updateSyncState,
  type EntityType,
} from "@contour/db";

export const dynamic = "force-dynamic";

interface SyncPushOperation {
  id: string;
  entityType: string;
  entityId: string;
  operationType: "create" | "update" | "delete";
  payload: any;
}

interface SyncPushRequest {
  deviceId: string;
  operations: SyncPushOperation[];
}

async function applyOperation(
  prisma: any,
  operation: SyncPushOperation,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { entityType, entityId, operationType, payload } = operation;

    switch (entityType) {
      case "deal":
        if (operationType === "create" || operationType === "update") {
          await prisma.deal.upsert({
            where: { id: entityId },
            create: { id: entityId, ...payload },
            update: payload,
          });
        } else if (operationType === "delete") {
          await prisma.deal.delete({ where: { id: entityId } });
        }
        break;

      case "client":
        if (operationType === "create" || operationType === "update") {
          await prisma.client.upsert({
            where: { id: entityId },
            create: { id: entityId, ...payload },
            update: payload,
          });
        } else if (operationType === "delete") {
          await prisma.client.delete({ where: { id: entityId } });
        }
        break;

      case "listing":
        if (operationType === "create" || operationType === "update") {
          await prisma.listing.upsert({
            where: { id: entityId },
            create: { id: entityId, ...payload },
            update: payload,
          });
        } else if (operationType === "delete") {
          await prisma.listing.delete({ where: { id: entityId } });
        }
        break;

      default:
        return { success: false, error: `Unknown entity type: ${entityType}` };
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

    const results: {
      operationId: string;
      success: boolean;
      error?: string;
    }[] = [];

    // Process each operation in a transaction for consistency
    for (const operation of operations) {
      const result = await applyOperation(prisma, operation);

      if (result.success) {
        results.push({
          operationId: operation.id,
          success: true,
        });
      } else {
        results.push({
          operationId: operation.id,
          success: false,
          error: result.error,
        });
      }
    }

    // Update sync state
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

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

    return NextResponse.json(
      { error: "Failed to push data" },
      { status: 500 },
    );
  }
}
