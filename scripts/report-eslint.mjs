import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;
const intermediatePath = resolve(".artifacts/eslint-raw.json");
const eslintArgs = ["exec", "eslint", ".", "-f", "json", "-o", intermediatePath, ...args.filter((arg, index) => index !== outputIndex && index !== outputIndex + 1)];

try {
  execFileSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", eslintArgs, {
    encoding: "utf8",
    stdio: ["ignore", "ignore", "ignore"],
    maxBuffer: 1024 * 1024,
  });
} catch {
  // ESLint exits 1 when findings exist; its JSON report is still valid.
}
const raw = readFileSync(intermediatePath, "utf8");

const report = JSON.parse(raw);
const rules = {};
const files = report
  .filter((file) => file.errorCount > 0 || file.warningCount > 0)
  .map((file) => {
    for (const message of file.messages) {
      const rule = message.ruleId ?? "unknown";
      rules[rule] = (rules[rule] ?? 0) + 1;
    }
    return {
      filePath: file.filePath,
      errors: file.errorCount,
      warnings: file.warningCount,
    };
  })
  .sort((a, b) => b.errors + b.warnings - (a.errors + a.warnings));

const summary = {
  errors: report.reduce((total, file) => total + file.errorCount, 0),
  warnings: report.reduce((total, file) => total + file.warningCount, 0),
  rules: Object.fromEntries(Object.entries(rules).sort(([, a], [, b]) => b - a)),
  files,
};

const serialized = `${JSON.stringify(summary, null, 2)}\n`;
if (outputPath) writeFileSync(resolve(outputPath), serialized);
process.stdout.write(serialized);
