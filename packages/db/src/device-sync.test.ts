import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  registerDevice,
  getSyncState,
  updateSyncState,
  createSyncOperation,
  getPendingSyncOperations,
  markSyncOperationAsSynced,
  markSyncOperationAsFailed,
} from "../src/device-sync";

// Note: These tests assume a test database is available
// In a real project, use testcontainers or a test database

describe("Device Sync Integration Tests", () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let testDeviceId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();
    testUserId = "test-user-" + Math.random().toString(36).substr(2, 9);
    testDeviceId = "test-device-" + Math.random().toString(36).substr(2, 9);
  });

  afterEach(async () => {
    // Cleanup
    await prisma.syncDevice.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.$disconnect();
  });

  describe("Device Registration", () => {
    it("should register a new device", async () => {
      const device = await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      expect(device).toBeDefined();
      expect(device.userId).toBe(testUserId);
      expect(device.deviceId).toBe(testDeviceId);
      expect(device.deviceType).toBe("desktop");
      expect(device.appVersion).toBe("1.0.0");
    });

    it("should update device on re-registration", async () => {
      // Register first time
      const device1 = await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      // Re-register with new version
      const device2 = await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.1.0",
      });

      expect(device2.appVersion).toBe("1.1.0");
      expect(device1.id).toBe(device2.id);
    });
  });

  describe("Sync State Management", () => {
    it("should create sync state on first update", async () => {
      // First register device
      await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      const now = new Date();
      await updateSyncState(prisma, testDeviceId, {
        lastSyncToken: "token-123",
        lastSyncAt: now,
        consecutiveFailures: 0,
      });

      const state = await getSyncState(prisma, testDeviceId);

      expect(state).toBeDefined();
      expect(state?.lastSyncToken).toBe("token-123");
      expect(state?.consecutiveFailures).toBe(0);
    });

    it("should update sync state with error info", async () => {
      await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      const now = new Date();
      await updateSyncState(prisma, testDeviceId, {
        lastErrorCode: "NETWORK_ERROR",
        lastErrorAt: now,
        consecutiveFailures: 1,
      });

      const state = await getSyncState(prisma, testDeviceId);

      expect(state?.lastErrorCode).toBe("NETWORK_ERROR");
      expect(state?.consecutiveFailures).toBe(1);
    });
  });

  describe("Sync Operations Queue", () => {
    it("should create and retrieve pending operations", async () => {
      await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      const opId = await createSyncOperation(prisma, {
        deviceId: testDeviceId,
        entityType: "deal",
        entityId: "deal-123",
        operationType: "create",
        payload: { title: "Test Deal", valueCents: 10000 },
      });

      const pending = await getPendingSyncOperations(prisma, testDeviceId);

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(opId);
      expect(pending[0].entityType).toBe("deal");
      expect(pending[0].status).toBe("pending");
    });

    it("should mark operation as synced", async () => {
      await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      const opId = await createSyncOperation(prisma, {
        deviceId: testDeviceId,
        entityType: "client",
        entityId: "client-123",
        operationType: "update",
        payload: { fullName: "John Doe" },
      });

      await markSyncOperationAsSynced(prisma, opId);

      const operation = await prisma.syncOperation.findUnique({
        where: { id: opId },
      });

      expect(operation?.status).toBe("synced");
      expect(operation?.syncedAt).toBeDefined();
    });

    it("should mark operation as failed", async () => {
      await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      const opId = await createSyncOperation(prisma, {
        deviceId: testDeviceId,
        entityType: "listing",
        entityId: "listing-123",
        operationType: "delete",
        payload: {},
      });

      await markSyncOperationAsFailed(prisma, opId, "NOT_FOUND", "Entity not found on server");

      const operation = await prisma.syncOperation.findUnique({
        where: { id: opId },
      });

      expect(operation?.status).toBe("failed");
      expect(operation?.errorCode).toBe("NOT_FOUND");
      expect(operation?.errorMessage).toBe("Entity not found on server");
    });

    it("should filter pending operations correctly", async () => {
      await registerDevice(prisma, {
        userId: testUserId,
        deviceId: testDeviceId,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      // Create pending operation
      const pending1 = await createSyncOperation(prisma, {
        deviceId: testDeviceId,
        entityType: "deal",
        entityId: "deal-1",
        operationType: "create",
        payload: {},
      });

      // Create synced operation
      const synced = await createSyncOperation(prisma, {
        deviceId: testDeviceId,
        entityType: "client",
        entityId: "client-1",
        operationType: "update",
        payload: {},
      });
      await markSyncOperationAsSynced(prisma, synced);

      // Create failed operation
      const failed = await createSyncOperation(prisma, {
        deviceId: testDeviceId,
        entityType: "listing",
        entityId: "listing-1",
        operationType: "delete",
        payload: {},
      });
      await markSyncOperationAsFailed(prisma, failed, "ERROR", "Test error");

      // Get pending should only return pending and failed
      const pending = await getPendingSyncOperations(prisma, testDeviceId);

      expect(pending).toHaveLength(2);
      expect(pending.map((p) => p.id)).toContain(pending1);
      expect(pending.map((p) => p.id)).toContain(failed);
      expect(pending.map((p) => p.id)).not.toContain(synced);
    });
  });

  describe("Multiple Devices per User", () => {
    it("should support multiple devices for same user", async () => {
      const device1Id = testDeviceId + "-1";
      const device2Id = testDeviceId + "-2";

      const dev1 = await registerDevice(prisma, {
        userId: testUserId,
        deviceId: device1Id,
        deviceType: "desktop",
        appVersion: "1.0.0",
      });

      const dev2 = await registerDevice(prisma, {
        userId: testUserId,
        deviceId: device2Id,
        deviceType: "mobile",
        appVersion: "1.0.0",
      });

      // Each device has its own sync operations
      await createSyncOperation(prisma, {
        deviceId: device1Id,
        entityType: "deal",
        entityId: "deal-1",
        operationType: "create",
        payload: {},
      });

      const device1Ops = await getPendingSyncOperations(prisma, device1Id);
      const device2Ops = await getPendingSyncOperations(prisma, device2Id);

      expect(device1Ops).toHaveLength(1);
      expect(device2Ops).toHaveLength(0);
    });
  });
});
