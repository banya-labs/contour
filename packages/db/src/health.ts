import { getContourDatabaseConfig } from "@contour/config";
import { getPrismaClient } from "./client";

export type ContourDatabaseStatus = {
  configured: boolean;
  connected: boolean;
  message: string;
};

export function getContourDatabaseStatus(
  env: NodeJS.ProcessEnv = process.env,
): ContourDatabaseStatus {
  try {
    getContourDatabaseConfig(env);
  } catch {
    return {
      configured: false,
      connected: false,
      message: "Database URL is not configured.",
    };
  }

  return {
    configured: true,
    connected: false,
    message: "Database connection check not run.",
  };
}

export async function checkContourDatabaseConnection(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ContourDatabaseStatus> {
  let databaseStatus = getContourDatabaseStatus(env);

  if (!databaseStatus.configured) {
    return databaseStatus;
  }

  try {
    const prisma = getPrismaClient(env);
    await prisma.$queryRaw`SELECT 1`;

    databaseStatus = {
      configured: true,
      connected: true,
      message: "Neon connection verified.",
    };
  } catch (error) {
    databaseStatus = {
      configured: true,
      connected: false,
      message:
        error instanceof Error
          ? `Neon connection failed: ${error.message}`
          : "Neon connection failed.",
    };
  }

  return databaseStatus;
}
