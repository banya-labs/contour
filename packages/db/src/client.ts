import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getContourDatabaseConfig } from "@contour/config";

declare global {
  // eslint-disable-next-line no-var
  var contourPrisma: PrismaClient | undefined;
}

export function createPrismaClient(env: NodeJS.ProcessEnv = process.env) {
  const databaseConfig = getContourDatabaseConfig(env);
  const adapter = new PrismaPg({
    connectionString: databaseConfig.databaseUrl,
  });

  return new PrismaClient({
    adapter,
  });
}

export function getPrismaClient(env: NodeJS.ProcessEnv = process.env) {
  if (process.env.NODE_ENV !== "production") {
    globalThis.contourPrisma ??= createPrismaClient(env);
    return globalThis.contourPrisma;
  }

  return createPrismaClient(env);
}
