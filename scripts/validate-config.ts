#!/usr/bin/env node
import { createValidator } from "../src";
import { ValidationResult } from "../src/types";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Standalone validation script for configuration files.
 * Can be used in CI/CD pipelines or as a pre-commit hook.
 * 
 * Usage:
 *   node scripts/validate-config.js <config-path> [options]
 * 
 * Options:
 *   --format <text|json>  Output format (default: json)
 *   --strict              Fail on warnings
 *   --ruleset <name>      Ruleset to use
 */
async function run() {
  const args = process.argv.slice(2);
  const configPath = args.find(arg => !arg.startsWith("--")) ?? "./examples/config/sample-config.json";
  
  // Parse options
  const formatIndex = args.indexOf("--format");
  const format = formatIndex !== -1 && args[formatIndex + 1] 
    ? (args[formatIndex + 1] as "text" | "json")
    : "json";
  
  const strict = args.includes("--strict");
  const rulesetIndex = args.indexOf("--ruleset");
  const ruleset = rulesetIndex !== -1 && args[rulesetIndex + 1]
    ? args[rulesetIndex + 1]
    : undefined;

  // Validate file exists
  if (!existsSync(configPath)) {
    // eslint-disable-next-line no-console
    console.error(`Error: Configuration file not found: ${configPath}`);
    process.exit(1);
  }

  const resolvedPath = path.resolve(configPath);
  // eslint-disable-next-line no-console
  console.log(`Validating configuration: ${resolvedPath}`);

  try {
    const validator = createValidator({ 
      format,
      strict,
      ruleset
    });

    const result: ValidationResult = await validator.validateFile(resolvedPath);
    
    // Output results
    if (format === "json") {
      // eslint-disable-next-line no-console
      console.log(result.summary);
    } else {
      // eslint-disable-next-line no-console
      console.log("\n" + result.summary);
    }

    // Exit with appropriate code
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.error(`\nValidation failed for ${configPath}`);
      process.exit(1);
    } else {
      // eslint-disable-next-line no-console
      console.log(`\n✓ Validation passed for ${configPath}`);
      process.exit(0);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Fatal error during validation:`, error);
    process.exit(1);
  }
}

// Run the script
run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", error);
  process.exit(1);
});

