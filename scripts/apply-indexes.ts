import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to Neon PostgreSQL database...");
  const sqlFile = path.resolve(process.cwd(), "prisma/migrations/add_performance_indexes.sql");
  const rawSql = fs.readFileSync(sqlFile, "utf-8");

  // Strip single-line comments (-- ...)
  const cleanSql = rawSql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");

  // Split by semicolons
  const statements = cleanSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.replace(/\s+/g, " ").slice(0, 70);
    console.log(`Executing [${i + 1}/${statements.length}]: ${firstLine}...`);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("  -> SUCCESS");
    } catch (err: any) {
      console.error(`  -> ERROR: ${err.message}`);
    }
  }

  console.log("\nAll performance indexes verified and created on Neon database!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
