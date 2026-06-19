import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { getContourAuthConfig, getContourDatabaseConfig } from "@contour/config";

function loadIfExists(filePath: string) {
  if (existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
}

const cwd = process.cwd();

for (const filePath of [
  path.resolve(cwd, ".env.development.local"),
  path.resolve(cwd, ".env.local"),
  path.resolve(cwd, "..", "..", ".env.development.local"),
  path.resolve(cwd, "..", "..", ".env.local"),
]) {
  loadIfExists(filePath);
}

function assertContourRuntimeEnv() {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return;
  }

  const problems: string[] = [];
  const auth = getContourAuthConfig();

  if (!auth.isConfigured) {
    problems.push(
      "Clerk auth env is missing. Set CONTOUR_AUTH_CLERK_SECRET_KEY and NEXT_PUBLIC_CONTOUR_AUTH_CLERK_PUBLISHABLE_KEY.",
    );
  }

  try {
    getContourDatabaseConfig();
  } catch (error) {
    problems.push(error instanceof Error ? error.message : "Database env is missing.");
  }

  if (problems.length) {
    throw new Error(`Contour runtime configuration is incomplete: ${problems.join(" ")}`);
  }
}

assertContourRuntimeEnv();
