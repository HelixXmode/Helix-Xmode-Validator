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

  const startTime = Date.now();

  try {
    // Check if TypeScript is available
    try {
      const tscVersion = execSync("tsc --version", { encoding: "utf-8", stdio: "pipe" }).trim();
      // eslint-disable-next-line no-console
      console.log(`📦 TypeScript version: ${tscVersion}`);
    } catch {
      // eslint-disable-next-line no-console
      console.error("❌ TypeScript compiler not found. Install with: npm install");
      process.exit(1);
    }

    // Run build
    // eslint-disable-next-line no-console
    console.log("Running TypeScript compilation...");
    const buildStartTime = Date.now();
    execSync("npm run build", { stdio: "inherit" });
    const buildDuration = ((Date.now() - buildStartTime) / 1000).toFixed(2);
    // eslint-disable-next-line no-console
    console.log(`⏱️  Build completed in ${buildDuration}s\n`);

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

    // Optional source maps for better debugging
    const optionalFiles = [
      "dist/index.js.map",
      "dist/cli.js.map",
      "dist/validator.js.map"
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
    let totalSize = 0;
    requiredFiles.forEach(file => {
      const stats = statSync(file);
      totalSize += stats.size;
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

    // Check for source maps
    const sourceMapsFound = optionalFiles.filter(file => existsSync(file)).length;
    if (sourceMapsFound > 0) {
      // eslint-disable-next-line no-console
      console.log(`🗺️  Source maps: ${sourceMapsFound}/${optionalFiles.length} found`);
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalSizeKB = (totalSize / 1024).toFixed(2);

    // eslint-disable-next-line no-console
    console.log("\n✅ Build check passed!");
    // eslint-disable-next-line no-console
    console.log(`   Output directory: ${distDir}`);
    // eslint-disable-next-line no-console
    console.log(`   Files generated: ${requiredFiles.length}`);
    // eslint-disable-next-line no-console
    console.log(`   Total size: ${totalSizeKB} KB`);
    // eslint-disable-next-line no-console
    console.log(`   Total time: ${totalDuration}s`);

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error && error.stack ? error.stack : undefined;
    
    // eslint-disable-next-line no-console
    console.error("\n❌ Build check failed:", errorMessage);
    if (errorStack && process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.error("\nStack trace:", errorStack);
    }
    // eslint-disable-next-line no-console
    console.error("\n💡 Tip: Run with DEBUG=1 for detailed error information");
    process.exit(1);
  }
}

checkBuild();

