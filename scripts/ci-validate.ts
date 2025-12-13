#!/usr/bin/env node
import { createValidator } from "../src";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * CI/CD validation script that runs comprehensive checks
 * suitable for continuous integration pipelines.
 * 
 * Usage:
 *   node scripts/ci-validate.js [--config-dir <path>]
 */
async function ciValidate() {
  const configDirIndex = process.argv.indexOf("--config-dir");
  const configDir = configDirIndex !== -1 && process.argv[configDirIndex + 1]
    ? process.argv[configDirIndex + 1]
    : "./examples/config";

  // eslint-disable-next-line no-console
  console.log("🚀 Starting CI validation pipeline...\n");
  // eslint-disable-next-line no-console
  console.log(`Configuration directory: ${configDir}\n`);

  const validator = createValidator({
    format: "json",
    strict: true,
    ruleset: "strict"
  });

  let totalFiles = 0;
  let passedFiles = 0;
  let failedFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  try {
    // Find all JSON config files
    const configFiles = findConfigFiles(configDir);
    totalFiles = configFiles.length;

    if (totalFiles === 0) {
      // eslint-disable-next-line no-console
      console.warn("⚠️  No configuration files found");
      process.exit(0);
    }

    // eslint-disable-next-line no-console
    console.log(`Found ${totalFiles} configuration file(s) to validate\n`);

    // Validate each file
    for (const file of configFiles) {
      const relativePath = path.relative(process.cwd(), file);
      // eslint-disable-next-line no-console
      console.log(`Validating: ${relativePath}...`);

      try {
        const result = await validator.validateFile(file);
        const parsed = JSON.parse(result.summary) as {
          summary: { errors: number; warnings: number };
        };

        totalErrors += parsed.summary.errors;
        totalWarnings += parsed.summary.warnings;

        if (result.ok) {
          passedFiles++;
          // eslint-disable-next-line no-console
          console.log(`  ✅ Passed (${parsed.summary.warnings} warnings)\n`);
        } else {
          failedFiles++;
          // eslint-disable-next-line no-console
          console.log(`  ❌ Failed (${parsed.summary.errors} errors, ${parsed.summary.warnings} warnings)\n`);
        }
      } catch (error) {
        failedFiles++;
        // eslint-disable-next-line no-console
        console.error(`  ❌ Error: ${(error as Error).message}\n`);
        totalErrors++;
      }
    }

    // Print summary
    // eslint-disable-next-line no-console
    console.log("=".repeat(50));
    // eslint-disable-next-line no-console
    console.log("CI Validation Summary");
    // eslint-disable-next-line no-console
    console.log("=".repeat(50));
    // eslint-disable-next-line no-console
    console.log(`Files processed: ${totalFiles}`);
    // eslint-disable-next-line no-console
    console.log(`Passed: ${passedFiles}`);
    // eslint-disable-next-line no-console
    console.log(`Failed: ${failedFiles}`);
    // eslint-disable-next-line no-console
    console.log(`Total errors: ${totalErrors}`);
    // eslint-disable-next-line no-console
    console.log(`Total warnings: ${totalWarnings}`);

    // Exit with appropriate code
    if (failedFiles > 0 || totalErrors > 0) {
      // eslint-disable-next-line no-console
      console.log("\n❌ CI validation failed");
      process.exit(1);
    } else {
      // eslint-disable-next-line no-console
      console.log("\n✅ CI validation passed");
      process.exit(0);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Fatal error during CI validation:", error);
    process.exit(1);
  }
}

function findConfigFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    if (!statSync(dir).isDirectory()) {
      return files;
    }

    const entries = readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        files.push(...findConfigFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    });
  } catch (error) {
    // Ignore permission errors
  }
  
  return files;
}

ciValidate().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", error);
  process.exit(1);
});

