import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Some local env loaders preserve optional wrapping quotes. Prisma expects the
// URL itself, so normalize only the outer pair before constructing the client.
const databaseUrl = process.env.DATABASE_URL?.trim().replace(/^(["'])(.*)\1$/, "$2");

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasourceUrl: databaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
