import type { UserRole } from "@prisma/client";
import { getPrismaClient } from "./client";

export type ContourWorkspaceProfile = {
  id: string;
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContourWorkspaceStat = {
  label: string;
  value: string;
  detail: string;
};

export type ContourWorkspaceEvent = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string | null;
  occurredAt: string;
};

export type ContourWorkspaceSnapshot = {
  clerkUserId: string;
  profile: ContourWorkspaceProfile | null;
  counts: {
    users: number;
    events: number;
    auditLogs: number;
  };
  recentEvents: ContourWorkspaceEvent[];
  stats: ContourWorkspaceStat[];
  needsProvisioning: boolean;
};

type ContourWorkspaceUserRecord = {
  id: string;
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ContourWorkspaceProvisionInput = {
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  role?: UserRole;
};

type ContourWorkspaceProvisionClient = {
  user: {
    findUnique: (args: {
      where: { clerkUserId: string };
      select: {
        id: true;
        clerkUserId: true;
        email: true;
        fullName: true;
        role: true;
        isActive: true;
        createdAt: true;
        updatedAt: true;
      };
    }) => Promise<ContourWorkspaceUserRecord | null>;
    upsert: (args: {
      where: { clerkUserId: string };
      create: {
        clerkUserId: string;
        email: string | null;
        fullName: string | null;
        role: UserRole;
        isActive: true;
      };
      update: {
        email: string | null;
        fullName: string | null;
      };
      select: {
        id: true;
        clerkUserId: true;
        email: true;
        fullName: true;
        role: true;
        isActive: true;
        createdAt: true;
        updatedAt: true;
      };
    }) => Promise<ContourWorkspaceUserRecord>;
  };
};

type ContourWorkspaceClient = {
  user: {
    findUnique: (args: {
      where: { clerkUserId: string };
      select: {
        id: true;
        clerkUserId: true;
        email: true;
        fullName: true;
        role: true;
        isActive: true;
        createdAt: true;
        updatedAt: true;
      };
    }) => Promise<ContourWorkspaceUserRecord | null>;
    count: () => Promise<number>;
  };
  event: {
    count: () => Promise<number>;
    findMany: (args: {
      orderBy: { occurredAt: "desc" };
      take: number;
      select: {
        id: true;
        eventType: true;
        entityType: true;
        entityId: true;
        occurredAt: true;
      };
    }) => Promise<
      Array<{
        id: string;
        eventType: string;
        entityType: string;
        entityId: string | null;
        occurredAt: Date;
      }>
    >;
  };
  auditLog: {
    count: () => Promise<number>;
  };
};

function toWorkspaceProfile(profile: ContourWorkspaceUserRecord): ContourWorkspaceProfile {
  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function provisionContourWorkspaceProfile(
  prisma: ContourWorkspaceProvisionClient,
  input: ContourWorkspaceProvisionInput,
): Promise<ContourWorkspaceProfile> {
  const profile = await prisma.user.upsert({
    where: { clerkUserId: input.clerkUserId },
    create: {
      clerkUserId: input.clerkUserId,
      email: input.email,
      fullName: input.fullName,
      role: input.role ?? "agent",
      isActive: true,
    },
    update: {
      email: input.email,
      fullName: input.fullName,
    },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return toWorkspaceProfile(profile);
}

async function queryContourWorkspaceSnapshot(
  prisma: ContourWorkspaceClient,
  clerkUserId: string,
): Promise<ContourWorkspaceSnapshot> {
  const [profile, usersCount, eventsCount, auditLogsCount, recentEvents] =
    await Promise.all([
      prisma.user.findUnique({
        where: { clerkUserId },
        select: {
          id: true,
          clerkUserId: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
      prisma.event.count(),
      prisma.auditLog.count(),
      prisma.event.findMany({
        orderBy: { occurredAt: "desc" },
        take: 5,
        select: {
          id: true,
          eventType: true,
          entityType: true,
          entityId: true,
          occurredAt: true,
        },
      }),
    ]);

  return {
    clerkUserId,
    profile: profile ? toWorkspaceProfile(profile) : null,
    counts: {
      users: usersCount,
      events: eventsCount,
      auditLogs: auditLogsCount,
    },
    recentEvents: recentEvents.map((event) => ({
      ...event,
      occurredAt: event.occurredAt.toISOString(),
    })),
    stats: [
      {
        label: "Workspace users",
        value: usersCount.toString(),
        detail: profile ? "Profile row exists" : "No workspace profile yet",
      },
      {
        label: "Activity events",
        value: eventsCount.toString(),
        detail: "System activity feed",
      },
      {
        label: "Audit logs",
        value: auditLogsCount.toString(),
        detail: "Change history ready",
      },
    ],
    needsProvisioning: profile === null,
  };
}

export async function getContourWorkspaceSnapshot(
  clerkUserId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContourWorkspaceSnapshot> {
  const prisma = getPrismaClient(env);
  return queryContourWorkspaceSnapshot(prisma, clerkUserId);
}

export async function ensureContourWorkspaceProfile(
  input: ContourWorkspaceProvisionInput,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContourWorkspaceProfile> {
  const prisma = getPrismaClient(env);
  return ensureContourWorkspaceProfileWithClient(prisma, input);
}

export async function ensureContourWorkspaceProfileWithClient(
  prisma: ContourWorkspaceProvisionClient,
  input: ContourWorkspaceProvisionInput,
): Promise<ContourWorkspaceProfile> {
  const existing = await prisma.user.findUnique({
    where: { clerkUserId: input.clerkUserId },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (
    existing &&
    existing.email === input.email &&
    existing.fullName === input.fullName
  ) {
    return toWorkspaceProfile(existing);
  }

  return provisionContourWorkspaceProfile(prisma, input);
}

export { queryContourWorkspaceSnapshot };
