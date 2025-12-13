#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * Type generation script that creates TypeScript definition files
 * and type exports for the project.
 * 
 * Usage:
 *   node scripts/generate-types.js
 */
function generateTypes() {
  // eslint-disable-next-line no-console
  console.log("📝 Generating type definitions...\n");

  const outputDir = path.join(process.cwd(), "dist");
  const typesDir = path.join(outputDir, "types");

  // Ensure directories exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  if (!existsSync(typesDir)) {
    mkdirSync(typesDir, { recursive: true });
  }

  // Generate index type exports
  const indexTypes = `/**
 * Type exports for Helix X Validator
 * Auto-generated - do not edit manually
 */

export * from "./types";
export * from "./validator";
export * from "./rules/schema";
export * from "./rules/ruleset";
export * from "./formatters/json-formatter";
export * from "./formatters/text-formatter";
export * from "./loaders/json-loader";
export * from "./loaders/yaml-loader";
export * from "./plugins/rule-plugin";
export * from "./utils/logger";
export * from "./utils/config-resolver";
export * from "./utils/error-handler";
`;

  // Generate API types documentation
  const apiTypes = `/**
 * Public API types for Helix X Validator
 * 
 * These types are exported for use in consuming applications.
 */

export interface ValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warn" | "info";
  rule: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  summary: string;
  elapsedMs: number;
  format: "text" | "json";
}

export interface HelixConfig {
  name?: string;
  version?: string;
  rules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ValidatorOptions {
  strict?: boolean;
  ruleset?: string;
  format?: "text" | "json";
}
`;

  try {
    // Write type exports
    const indexTypesPath = path.join(outputDir, "index.d.ts");
    writeFileSync(indexTypesPath, indexTypes, "utf8");
    // eslint-disable-next-line no-console
    console.log(`✅ Generated: ${path.relative(process.cwd(), indexTypesPath)}`);

    // Write API types
    const apiTypesPath = path.join(typesDir, "api.d.ts");
    writeFileSync(apiTypesPath, apiTypes, "utf8");
    // eslint-disable-next-line no-console
    console.log(`✅ Generated: ${path.relative(process.cwd(), apiTypesPath)}`);

    // eslint-disable-next-line no-console
    console.log("\n✅ Type generation completed successfully!");
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Type generation failed:", (error as Error).message);
    process.exit(1);
  }
}

generateTypes();

