import { describe, expect, it } from "vitest";
import { OFFLINE_TABLES, SENSITIVE_OFFLINE_EXCLUSIONS } from "./constants";
import { contourSchema, getDatabaseName, getEncryptionKey } from "./database";

describe("local-first SQLite database", () => {
  it("defines only the approved operational tables", () => {
    const tableNames = contourSchema.tables.map((table) => table.name);

    expect(tableNames).toEqual(expect.arrayContaining([...OFFLINE_TABLES]));
    expect(tableNames).not.toEqual(expect.arrayContaining([...SENSITIVE_OFFLINE_EXCLUSIONS]));
  });

  it("derives a database filename from the organization and user", () => {
    expect(getDatabaseName("org_123", "user_456")).toBe("contour-org_123-user_456.db");
  });

  it("requires a non-empty encryption key", () => {
    expect(() => getEncryptionKey({ userId: "user", organizationId: "org", databaseKey: "", role: "AGENT", expiresAt: "" })).toThrow(
      "Local database encryption key is required",
    );
  });
});
