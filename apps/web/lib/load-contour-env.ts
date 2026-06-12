import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

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
