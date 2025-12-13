import { createValidator } from "../src";
import { ValidationResult } from "../src/types";
import { glob } from "glob";
import path from "node:path";

/**
 * Batch validation example for processing multiple configuration files
 * across a directory tree. Useful for CI/CD pipelines and bulk validation.
 */
interface BatchOptions {
  pattern: string;
  format: "text" | "json";
  ruleset?: string;
  strict: boolean;
  parallel: boolean;
}

async function batchValidate(options: BatchOptions): Promise<void> {
  const validator = createValidator({
    format: options.format,
    ruleset: options.ruleset,
    strict: options.strict
  });

  // eslint-disable-next-line no-console
  console.log(`Scanning for files matching: ${options.pattern}`);

  // Find all matching files
  const files = await glob(options.pattern, {
    ignore: ["**/node_modules/**", "**/.git/**"]
  });

  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.log("No files found matching the pattern");
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Found ${files.length} file(s) to validate\n`);

  const results: Array<{ file: string; result: ValidationResult }> = [];
  const startTime = Date.now();

  // Validate files
  if (options.parallel) {
    // Parallel validation
    const promises = files.map(async (file) => {
      try {
        const result = await validator.validateFile(file);
        return { file, result };
      } catch (error) {
        return {
          file,
          result: {
            ok: false,
            issues: [{
              path: "$file",
              message: `Failed to validate: ${(error as Error).message}`,
              severity: "error",
              rule: "io/validation-error"
            }],
            summary: `Error: ${(error as Error).message}`,
            elapsedMs: 0,
            format: options.format
          } as ValidationResult
        };
      }
    });

    const resolved = await Promise.all(promises);
    results.push(...resolved);
  } else {
    // Sequential validation
    for (const file of files) {
      try {
        const result = await validator.validateFile(file);
        results.push({ file, result });
      } catch (error) {
        results.push({
          file,
          result: {
            ok: false,
            issues: [{
              path: "$file",
              message: `Failed to validate: ${(error as Error).message}`,
              severity: "error",
              rule: "io/validation-error"
            }],
            summary: `Error: ${(error as Error).message}`,
            elapsedMs: 0,
            format: options.format
          } as ValidationResult
        });
      }
    }
  }

  const totalTime = Date.now() - startTime;

  // Aggregate and report results
  const passed = results.filter(r => r.result.ok).length;
  const failed = results.length - passed;

  let totalErrors = 0;
  let totalWarnings = 0;

  results.forEach(({ result }) => {
    if (options.format === "json") {
      try {
        const parsed = JSON.parse(result.summary) as {
          summary: { errors: number; warnings: number };
        };
        totalErrors += parsed.summary.errors;
        totalWarnings += parsed.summary.warnings;
      } catch {
        // Fallback if parsing fails
      }
    } else {
      // Parse text format (basic extraction)
      const errorMatch = result.summary.match(/(\d+) error/);
      const warnMatch = result.summary.match(/(\d+) warning/);
      if (errorMatch) totalErrors += parseInt(errorMatch[1], 10);
      if (warnMatch) totalWarnings += parseInt(warnMatch[1], 10);
    }
  });

  // Output summary
  // eslint-disable-next-line no-console
  console.log("\n=== Batch Validation Summary ===");
  // eslint-disable-next-line no-console
  console.log(`Files processed: ${results.length}`);
  // eslint-disable-next-line no-console
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  // eslint-disable-next-line no-console
  console.log(`Total errors: ${totalErrors}, Total warnings: ${totalWarnings}`);
  // eslint-disable-next-line no-console
  console.log(`Total time: ${totalTime}ms`);

  // Output detailed results if requested
  if (options.format === "json") {
    // eslint-disable-next-line no-console
    console.log("\n=== Detailed Results ===");
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(results, null, 2));
  } else {
    // Show failed files
    const failedFiles = results.filter(r => !r.result.ok);
    if (failedFiles.length > 0) {
      // eslint-disable-next-line no-console
      console.log("\n=== Failed Files ===");
      failedFiles.forEach(({ file, result }) => {
        // eslint-disable-next-line no-console
        console.log(`\n${file}:`);
        // eslint-disable-next-line no-console
        console.log(result.summary);
      });
    }
  }

  // Exit with appropriate code
  if (failed > 0 || totalErrors > 0) {
    process.exit(1);
  }
}

// Example usage
const options: BatchOptions = {
  pattern: "examples/config/**/*.json",
  format: "text",
  ruleset: "strict",
  strict: false,
  parallel: true
};

batchValidate(options).catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Batch validation failed:", error);
  process.exit(1);
});

