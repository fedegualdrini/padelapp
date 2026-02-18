import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Unrelated project directories:
    "cartscanner/**",
    "investment-portfolio-tracker/**",
    "clawd-control/**",
    "file-browser-dashboard/**",
    "padelapp/**",
    "padel-backend/**",
    "padel-frontend/**",
    "padel-growth/**",
    "padel-orchestrator/**",
    "padel-product/**",
    "padel-qa/**",
    "actions-runner/**",
    "base-rebalancer/**",
  ]),
]);

export default eslintConfig;
