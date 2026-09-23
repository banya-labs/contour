import { PowerSyncDatabase } from "@powersync/web";
import type { LocalFirstIdentity } from "./types";
import { contourSchema } from "./schema";

export { contourSchema };

export function getDatabaseName(organizationId: string, userId: string): string {
  return `contour-${organizationId}-${userId}.db`;
}

export function getEncryptionKey(identity: LocalFirstIdentity): string {
  if (!identity.databaseKey.trim()) {
    throw new Error("Local database encryption key is required");
  }
  return identity.databaseKey;
}

export function createContourDatabase(identity: LocalFirstIdentity): PowerSyncDatabase {
  if (typeof window === "undefined") {
    throw new Error("The local SQLite database can only be opened in a browser");
  }

  return new PowerSyncDatabase({
    schema: contourSchema,
    database: {
      dbFilename: getDatabaseName(identity.organizationId, identity.userId),
      enableMultiTabs: true,
      encryptionKey: getEncryptionKey(identity),
    },
  });
}
