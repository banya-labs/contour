import { describe, expect, it } from "vitest";
import {
  bootstrapContourClerkEnv,
  getContourAuthConfig,
  getContourDatabaseConfig,
} from "./runtime-env";

describe("runtime env", () => {
  it("reads clerk keys from contour-prefixed env vars", () => {
    const config = getContourAuthConfig({
      CONTOUR_AUTH_CLERK_SECRET_KEY: "secret-123",
      NEXT_PUBLIC_CONTOUR_AUTH_CLERK_PUBLISHABLE_KEY: "pk_test_123",
    });

    expect(config).toEqual({
      secretKey: "secret-123",
      publishableKey: "pk_test_123",
      isConfigured: true,
    });
  });

  it("bootstraps Clerk's default env names from contour-prefixed env vars", () => {
    const env: NodeJS.ProcessEnv = {
      CONTOUR_AUTH_CLERK_SECRET_KEY: "secret-123",
      NEXT_PUBLIC_CONTOUR_AUTH_CLERK_PUBLISHABLE_KEY: "pk_test_123",
    };

    const config = bootstrapContourClerkEnv(env);

    expect(config.isConfigured).toBe(true);
    expect(env.CLERK_SECRET_KEY).toBe("secret-123");
    expect(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("pk_test_123");
  });

  it("prefers pooled database urls and falls back to direct urls", () => {
    const config = getContourDatabaseConfig({
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
});
