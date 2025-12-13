#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Build verification script that checks if the project builds successfully
 * and validates the output structure.
 * 
 * Usage:
 *   node scripts/build-check.js
 */
function checkBuild() {
  // eslint-disable-next-line no-console
  console.log("🔨 Checking build process...\n");

  try {
    // Check if TypeScript is available
    try {
      execSync("tsc --version", { stdio: "pipe" });
    } catch {
      // eslint-disable-next-line no-console
      console.error("❌ TypeScript compiler not found. Install with: npm install");
      process.exit(1);
    }

    // Run build
    // eslint-disable-next-line no-console
    console.log("Running TypeScript compilation...");
    execSync("npm run build", { stdio: "inherit" });

    // Verify output directory exists
    const distDir = path.join(process.cwd(), "dist");
    if (!existsSync(distDir)) {
      // eslint-disable-next-line no-console
      console.error("❌ Build failed: dist directory not created");
      process.exit(1);
    }

    // Check for essential output files
    const requiredFiles = [
      "dist/index.js",
      "dist/cli.js",
      "dist/validator.js"
    ];

    const missingFiles: string[] = [];
    requiredFiles.forEach(file => {
      if (!existsSync(file)) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`❌ Build incomplete. Missing files:\n${missingFiles.join("\n")}`);
      process.exit(1);
    }

    // Check file sizes (ensure files are not empty)
    let hasEmptyFiles = false;
    requiredFiles.forEach(file => {
      const stats = statSync(file);
      if (stats.size === 0) {
        // eslint-disable-next-line no-console
        console.warn(`⚠️  Warning: ${file} is empty`);
        hasEmptyFiles = true;
      }
    });

    if (hasEmptyFiles) {
      // eslint-disable-next-line no-console
      console.warn("\n⚠️  Some output files are empty. This may indicate compilation issues.");
    }

    // eslint-disable-next-line no-console
    console.log("\n✅ Build check passed!");
    // eslint-disable-next-line no-console
    console.log(`   Output directory: ${distDir}`);
    // eslint-disable-next-line no-console
    console.log(`   Files generated: ${requiredFiles.length}`);

    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("\n❌ Build check failed:", (error as Error).message);
    process.exit(1);
  }
}

checkBuild();

