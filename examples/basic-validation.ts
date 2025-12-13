import { createValidator } from "../src";
import { ValidationResult } from "../src/types";

/**
 * Basic validation example demonstrating core validator functionality.
 * This example shows how to validate a Helix configuration file
 * with strict ruleset and error handling.
 */
async function demo() {
  const configPath = "./examples/config/sample-config.json";
  
  // Create validator with strict mode enabled
  const validator = createValidator({ 
    format: "text", 
    ruleset: "strict", 
    strict: true 
  });

  try {
    const result: ValidationResult = await validator.validateFile(configPath);
    
    // Output validation summary
    // eslint-disable-next-line no-console
    console.log("=== Validation Results ===");
    // eslint-disable-next-line no-console
    console.log(result.summary);
    // eslint-disable-next-line no-console
    console.log(`\nValidation completed in ${result.elapsedMs}ms`);
    
    // Check if validation passed
    if (result.ok) {
      // eslint-disable-next-line no-console
      console.log("\n✓ Configuration is valid!");
      process.exit(0);
    } else {
      // eslint-disable-next-line no-console
      console.log("\n✗ Configuration validation failed!");
      
      // Show detailed error breakdown
      const errors = result.issues.filter(i => i.severity === "error");
      const warnings = result.issues.filter(i => i.severity === "warn");
      
      if (errors.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`\nErrors (${errors.length}):`);
        errors.forEach(err => {
          // eslint-disable-next-line no-console
          console.log(`  - ${err.path}: ${err.message}`);
        });
      }
      
      if (warnings.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`\nWarnings (${warnings.length}):`);
        warnings.forEach(warn => {
          // eslint-disable-next-line no-console
          console.log(`  - ${warn.path}: ${warn.message}`);
        });
      }
      
      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Fatal error during validation:", error);
    process.exit(1);
  }
}

// Run the demo
demo().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", error);
  process.exit(1);
});

