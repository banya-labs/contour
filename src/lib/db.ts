import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Some local env loaders preserve optional wrapping quotes. Prisma expects the
// URL itself, so normalize only the outer pair before constructing the client.
let databaseUrl = process.env.DATABASE_URL?.trim().replace(/^(["'])(.*)\1$/, "$2");

// Connection pooling configuration (Layer 3 & Neon / Dokploy standard)
// Ensures connection limits and timeouts are enforced to prevent pool exhaustion.
if (databaseUrl && !databaseUrl.includes("connection_limit=")) {
  const separator = databaseUrl.includes("?") ? "&" : "?";
  databaseUrl = `${databaseUrl}${separator}connection_limit=10&pool_timeout=20`;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasourceUrl: databaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
