import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.CONTOUR_DATABASE_URL_UNPOOLED ??
      process.env.CONTOUR_POSTGRES_URL_NON_POOLING ??
      process.env.CONTOUR_POSTGRES_PRISMA_URL ??
      process.env.DIRECT_URL ??
      "",
  },
});
