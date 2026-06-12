import { describe, expect, it } from "vitest";
import {
  ensureContourWorkspaceProfile,
  ensureContourWorkspaceProfileWithClient,
  provisionContourWorkspaceProfile,
} from "./workspace";

describe("workspace provisioning", () => {
  it("creates a profile for a first-time Clerk user", async () => {
    const calls: unknown[] = [];
    const prisma = {
      user: {
        upsert: async (args: unknown) => {
          calls.push(args);
          return {
            id: "user-1",
            clerkUserId: "clerk_123",
            email: "owner@example.com",
            fullName: "Owner One",
            role: "agent" as const,
            isActive: true,
            createdAt: new Date("2026-06-12T12:00:00.000Z"),
            updatedAt: new Date("2026-06-12T12:30:00.000Z"),
          };
        },
      },
    };

    const profile = await provisionContourWorkspaceProfile(
      prisma as Parameters<typeof provisionContourWorkspaceProfile>[0],
      {
        clerkUserId: "clerk_123",
        email: "owner@example.com",
        fullName: "Owner One",
      },
    );

    expect(calls).toHaveLength(1);
    expect(profile.role).toBe("agent");
    expect(profile.email).toBe("owner@example.com");
    expect(profile.fullName).toBe("Owner One");
  });

  it("keeps the assigned role when syncing an existing profile", async () => {
    const calls: unknown[] = [];
    const prisma = {
      user: {
        upsert: async (args: unknown) => {
          calls.push(args);
          return {
            id: "user-2",
            clerkUserId: "clerk_456",
            email: "updated@example.com",
            fullName: "Updated Owner",
            role: "admin" as const,
            isActive: true,
            createdAt: new Date("2026-06-12T12:00:00.000Z"),
            updatedAt: new Date("2026-06-12T12:30:00.000Z"),
          };
        },
      },
    };

    const profile = await provisionContourWorkspaceProfile(
      prisma as Parameters<typeof provisionContourWorkspaceProfile>[0],
      {
        clerkUserId: "clerk_456",
        email: "updated@example.com",
        fullName: "Updated Owner",
      },
    );

    expect(calls).toHaveLength(1);
    expect(profile.role).toBe("admin");
    expect(profile.email).toBe("updated@example.com");
  });

  it("skips writing when the stored profile already matches Clerk data", async () => {
    const calls: unknown[] = [];
    const prisma = {
      user: {
        findUnique: async () => ({
          id: "user-3",
          clerkUserId: "clerk_789",
          email: "same@example.com",
          fullName: "Same Person",
          role: "finance" as const,
          isActive: true,
          createdAt: new Date("2026-06-12T12:00:00.000Z"),
          updatedAt: new Date("2026-06-12T12:30:00.000Z"),
        }),
        upsert: async (args: unknown) => {
          calls.push(args);
          throw new Error("should not be called");
        },
      },
    };

    const profile = await ensureContourWorkspaceProfileWithClient(
      prisma as Parameters<typeof ensureContourWorkspaceProfileWithClient>[0],
      {
        clerkUserId: "clerk_789",
        email: "same@example.com",
        fullName: "Same Person",
      },
    );

    expect(calls).toHaveLength(0);
    expect(profile.role).toBe("finance");
  });
});
