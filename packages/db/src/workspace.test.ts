import { describe, expect, it } from "vitest";
import { queryContourWorkspaceSnapshot } from "./workspace";

describe("workspace snapshot", () => {
  it("summarizes a provisioned workspace profile", async () => {
    const prisma = {
      user: {
        findUnique: async () => ({
          id: "user-1",
          clerkUserId: "clerk_123",
          email: "owner@example.com",
          fullName: "Owner One",
          role: "admin" as const,
          isActive: true,
          createdAt: new Date("2026-06-12T12:00:00.000Z"),
          updatedAt: new Date("2026-06-12T12:30:00.000Z"),
        }),
        count: async () => 2,
      },
      event: {
        count: async () => 7,
        findMany: async () => [
          {
            id: "event-1",
            eventType: "listing.created",
            entityType: "listing",
            entityId: "listing-1",
            occurredAt: new Date("2026-06-12T12:45:00.000Z"),
          },
        ],
      },
      auditLog: {
        count: async () => 3,
      },
    };

    const snapshot = await queryContourWorkspaceSnapshot(
      prisma as Parameters<typeof queryContourWorkspaceSnapshot>[0],
      "clerk_123",
    );

    expect(snapshot.profile?.role).toBe("admin");
    expect(snapshot.counts).toEqual({
      users: 2,
      events: 7,
      auditLogs: 3,
    });
    expect(snapshot.recentEvents[0]?.eventType).toBe("listing.created");
    expect(snapshot.needsProvisioning).toBe(false);
  });

  it("flags missing workspace profiles for onboarding", async () => {
    const prisma = {
      user: {
        findUnique: async () => null,
        count: async () => 0,
      },
      event: {
        count: async () => 0,
        findMany: async () => [],
      },
      auditLog: {
        count: async () => 0,
      },
    };

    const snapshot = await queryContourWorkspaceSnapshot(
      prisma as Parameters<typeof queryContourWorkspaceSnapshot>[0],
      "clerk_456",
    );

    expect(snapshot.profile).toBeNull();
    expect(snapshot.needsProvisioning).toBe(true);
    expect(snapshot.stats[0]?.detail).toBe("No workspace profile yet");
  });
});
