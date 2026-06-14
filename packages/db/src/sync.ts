import { getPrismaClient } from "./client";

export type ContourSyncSnapshot = {
  syncDevices: number;
  syncState: number;
  lastSyncAt: string | null;
};

type ContourSyncClient = {
  syncDevice: {
    count: () => Promise<number>;
  };
  syncState: {
    count: () => Promise<number>;
    aggregate: (args: {
      _max: {
        lastSyncAt: true;
      };
    }) => Promise<{
      _max: {
        lastSyncAt: Date | null;
      };
    }>;
  };
};

export async function queryContourSyncSnapshot(
  prisma: ContourSyncClient,
): Promise<ContourSyncSnapshot> {
  const [syncDevices, syncState, lastSync] = await Promise.all([
    prisma.syncDevice.count(),
    prisma.syncState.count(),
    prisma.syncState.aggregate({
      _max: {
        lastSyncAt: true,
      },
    }),
  ]);

  return {
    syncDevices,
    syncState,
    lastSyncAt: lastSync._max.lastSyncAt
      ? lastSync._max.lastSyncAt.toISOString()
      : null,
  };
}

export async function getContourSyncSnapshot(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContourSyncSnapshot> {
  const prisma = getPrismaClient(env);
  return queryContourSyncSnapshot(prisma);
}
