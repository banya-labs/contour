import { describe, expect, it } from "vitest";
import { getContourDatabaseStatus } from "./health";

describe("database health", () => {
  it("reports missing configuration when contour db urls are absent", () => {
    const status = getContourDatabaseStatus({});

    expect(status).toEqual({
      configured: false,
      connected: false,
      message: "Database URL is not configured.",
    });
  });

  it("recognizes contour database env names", () => {
    const status = getContourDatabaseStatus({
      CONTOUR_DATABASE_URL: "postgresql://pooled.example/db?sslmode=require",
      CONTOUR_DATABASE_URL_UNPOOLED:
        "postgresql://direct.example/db?sslmode=require",
    });

    expect(status.configured).toBe(true);
    expect(status.connected).toBe(false);
    expect(status.message).toBe("Database connection check not run.");
  });
});
