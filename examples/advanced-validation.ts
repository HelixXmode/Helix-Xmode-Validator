import { createValidator } from "../src";
import { ValidationResult } from "../src/types";
import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Advanced validation example demonstrating batch processing,
 * custom error handling, and result aggregation.
 */
async function advancedValidation() {
  const configDir = "./examples/config";
  const results: Array<{ file: string; result: ValidationResult }> = [];

  // Create validator with JSON output for programmatic processing
  const validator = createValidator({
    format: "json",
    ruleset: "strict",
    strict: false // Allow warnings for batch processing
  });

  try {
    // Get all JSON files in config directory
    const files = await readdir(configDir);
    const jsonFiles = files.filter(f => f.endsWith(".json"));

    if (jsonFiles.length === 0) {
      // eslint-disable-next-line no-console
      console.log("No JSON configuration files found in", configDir);
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`Found ${jsonFiles.length} configuration file(s) to validate\n`);

    // Validate each file
    for (const file of jsonFiles) {
      const filePath = path.join(configDir, file);
      // eslint-disable-next-line no-console
      console.log(`Validating: ${file}...`);

      try {
        const result = await validator.validateFile(filePath);
        results.push({ file, result });

        // Parse JSON result for detailed analysis
        const parsed = JSON.parse(result.summary) as {
          summary: { errors: number; warnings: number; info: number };
          issues: Array<{ severity: string; path: string; message: string }>;
        };

        if (result.ok) {
          // eslint-disable-next-line no-console
          console.log(`  ✓ ${file}: Valid (${parsed.summary.warnings} warnings, ${parsed.summary.info} info)`);
        } else {
          // eslint-disable-next-line no-console
          console.log(`  ✗ ${file}: Invalid`);
          // eslint-disable-next-line no-console
          console.log(`    Errors: ${parsed.summary.errors}, Warnings: ${parsed.summary.warnings}`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`  ✗ ${file}: Failed to validate - ${(error as Error).message}`);
        results.push({
          file,
          result: {
            ok: false,
            issues: [{
              path: "$file",
              message: `Validation failed: ${(error as Error).message}`,
              severity: "error",
              rule: "io/validation-error"
            }],
            summary: `Error: ${(error as Error).message}`,
            elapsedMs: 0,
            format: "json"
          }
        });
      }
    }

    // Aggregate results
    // eslint-disable-next-line no-console
    console.log("\n=== Validation Summary ===");
    const totalFiles = results.length;
    const passedFiles = results.filter(r => r.result.ok).length;
    const failedFiles = totalFiles - passedFiles;

    const totalErrors = results.reduce((sum, r) => {
      const parsed = JSON.parse(r.result.summary) as { summary: { errors: number } };
      return sum + parsed.summary.errors;
    }, 0);

    const totalWarnings = results.reduce((sum, r) => {
      const parsed = JSON.parse(r.result.summary) as { summary: { warnings: number } };
      return sum + parsed.summary.warnings;
    }, 0);

    // eslint-disable-next-line no-console
    console.log(`Files processed: ${totalFiles}`);
    // eslint-disable-next-line no-console
    console.log(`Passed: ${passedFiles}, Failed: ${failedFiles}`);
    // eslint-disable-next-line no-console
    console.log(`Total errors: ${totalErrors}, Total warnings: ${totalWarnings}`);

    // Exit with appropriate code
    if (failedFiles > 0 || totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Fatal error during batch validation:", error);
    process.exit(1);
  }
}

// Run advanced validation
advancedValidation().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", error);
  process.exit(1);
});

