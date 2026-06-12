type ContourRuntimeEnv = NodeJS.ProcessEnv &
  Partial<
    Record<
      | "CLERK_SECRET_KEY"
      | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
      | "CONTOUR_AUTH_CLERK_SECRET_KEY"
      | "NEXT_PUBLIC_CONTOUR_AUTH_CLERK_PUBLISHABLE_KEY"
      | "DATABASE_URL"
      | "DIRECT_URL"
      | "CONTOUR_DATABASE_URL"
      | "CONTOUR_DATABASE_URL_UNPOOLED"
      | "CONTOUR_POSTGRES_URL"
      | "CONTOUR_POSTGRES_URL_NO_SSL"
      | "CONTOUR_POSTGRES_URL_NON_POOLING"
      | "CONTOUR_POSTGRES_PRISMA_URL",
      string
    >
  >;

export type ContourAuthConfig = {
  secretKey: string;
  publishableKey: string;
  isConfigured: boolean;
};

export type ContourDatabaseConfig = {
  databaseUrl: string;
  directUrl: string;
  isConfigured: boolean;
};

export function getContourAuthConfig(
  env: ContourRuntimeEnv = process.env,
): ContourAuthConfig {
  const secretKey =
    env.CONTOUR_AUTH_CLERK_SECRET_KEY ?? env.CLERK_SECRET_KEY ?? "";
  const publishableKey =
    env.NEXT_PUBLIC_CONTOUR_AUTH_CLERK_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    "";

  return {
    secretKey,
    publishableKey,
    isConfigured: Boolean(secretKey && publishableKey),
  };
}

export function bootstrapContourClerkEnv(
  env: ContourRuntimeEnv = process.env,
): ContourAuthConfig {
  const config = getContourAuthConfig(env);

  if (config.secretKey) {
    env.CLERK_SECRET_KEY = config.secretKey;
  }

  if (config.publishableKey) {
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = config.publishableKey;
  }

  return config;
}

export function getContourDatabaseConfig(
  env: ContourRuntimeEnv = process.env,
): ContourDatabaseConfig {
  const databaseUrl =
    env.CONTOUR_DATABASE_URL ??
    env.CONTOUR_POSTGRES_PRISMA_URL ??
    env.CONTOUR_POSTGRES_URL ??
    env.DATABASE_URL ??
    "";
  const directUrl =
    env.CONTOUR_DATABASE_URL_UNPOOLED ??
    env.CONTOUR_POSTGRES_URL_NON_POOLING ??
    env.CONTOUR_POSTGRES_URL_NO_SSL ??
    env.CONTOUR_POSTGRES_PRISMA_URL ??
    env.DIRECT_URL ??
    databaseUrl;

  if (!databaseUrl) {
    throw new Error(
      "Contour database URL is required. Set CONTOUR_DATABASE_URL or CONTOUR_POSTGRES_URL.",
    );
  }

  return {
    databaseUrl,
    directUrl,
    isConfigured: Boolean(databaseUrl),
  };
}
