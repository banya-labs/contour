import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export interface RegisterDeviceInput {
  userId: string;
  deviceId: string;
  deviceType: "desktop" | "web" | "mobile";
  appVersion: string;
}

export interface RegisteredDevice {
  id: string;
  deviceId: string;
  userId: string;
  deviceType: string;
  appVersion: string;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function registerDevice(
  prisma: PrismaClient,
  input: RegisterDeviceInput,
): Promise<RegisteredDevice> {
  const { userId, deviceId, deviceType, appVersion } = input;

  const device = await prisma.syncDevice.upsert({
    where: { deviceId },
    create: {
      deviceId,
      userId,
      deviceType,
      appVersion,
    },
    update: {
      appVersion,
      lastSeenAt: new Date(),
    },
  });

  return device;
}

export async function getDevicesByUser(
  prisma: PrismaClient,
  userId: string,
): Promise<RegisteredDevice[]> {
  return prisma.syncDevice.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
  });
}

export async function getSyncState(
  prisma: PrismaClient,
  deviceId: string,
) {
  return prisma.syncState.findUnique({
    where: { deviceId },
  });
}

export async function updateSyncState(
  prisma: PrismaClient,
  deviceId: string,
  data: {
    lastSyncToken?: string;
    lastSyncAt?: Date;
    lastErrorCode?: string;
    lastErrorAt?: Date;
    consecutiveFailures?: number;
  },
) {
  return prisma.syncState.upsert({
    where: { deviceId },
    create: {
      deviceId,
      ...data,
    },
    update: data,
  });
}

export interface PendingSyncOperation {
  id: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  operationType: string;
  status: string;
  payload: any;
  createdAt: Date;
}

export async function getPendingSyncOperations(
  prisma: PrismaClient,
  deviceId: string,
  limit = 100,
): Promise<PendingSyncOperation[]> {
  return prisma.syncOperation.findMany({
    where: {
      deviceId,
      status: { in: ["pending", "failed"] },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function createSyncOperation(
  prisma: PrismaClient,
  input: {
    deviceId: string;
    entityType: string;
    entityId: string;
    operationType: "create" | "update" | "delete";
    payload: any;
  },
) {
  return prisma.syncOperation.create({
    data: {
      id: uuidv4(),
      deviceId: input.deviceId,
      entityType: input.entityType as any,
      entityId: input.entityId,
      operationType: input.operationType,
      payload: input.payload,
      status: "pending",
    },
  });
}

export async function markSyncOperationAsSynced(
  prisma: PrismaClient,
  operationId: string,
) {
  return prisma.syncOperation.update({
    where: { id: operationId },
    data: {
      status: "synced",
      syncedAt: new Date(),
    },
  });
}

export async function markSyncOperationAsFailed(
  prisma: PrismaClient,
  operationId: string,
  errorCode: string,
  errorMessage: string,
) {
  return prisma.syncOperation.update({
    where: { id: operationId },
    data: {
      status: "failed",
      errorCode,
      errorMessage,
    },
  });
}
