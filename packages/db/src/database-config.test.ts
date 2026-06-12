import { describe, expect, it } from "vitest";
import { getDatabaseConfig } from "./database-config";

describe("database config", () => {
  it("requires contour pooled and direct database urls", () => {
    const config = getDatabaseConfig({
      CONTOUR_DATABASE_URL: "postgresql://pooled.example/db?sslmode=require",
      CONTOUR_DATABASE_URL_UNPOOLED:
        "postgresql://direct.example/db?sslmode=require",
    });

    expect(config).toEqual({
      databaseUrl: "postgresql://pooled.example/db?sslmode=require",
      directUrl: "postgresql://direct.example/db?sslmode=require",
      isConfigured: true,
    });
  });

  it("falls back to the pooled contour url when direct url is missing", () => {
    const config = getDatabaseConfig({
      CONTOUR_DATABASE_URL: "postgresql://pooled.example/db?sslmode=require",
    });

    expect(config.directUrl).toBe("postgresql://pooled.example/db?sslmode=require");
  });
});
