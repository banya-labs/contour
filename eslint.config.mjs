import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      ".artifacts/**",
      ".superpowers/**",
      ".test-screenshots/**",
      ".agents/**",
      "scripts/**",
      "next-env.d.ts",
      "documentation_legacy/**",
      "contour.rar",
    ],
  },
];

export default eslintConfig;
