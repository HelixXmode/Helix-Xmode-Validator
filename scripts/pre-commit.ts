#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Pre-commit hook script that runs validation checks before allowing commits.
 * This ensures code quality and prevents broken code from being committed.
 * 
 * Usage:
 *   node scripts/pre-commit.js
 * 
 * Typically installed via:
 *   npm install --save-dev husky
 *   npx husky add .husky/pre-commit "node scripts/pre-commit.js"
 */
async function preCommit() {
  // eslint-disable-next-line no-console
  console.log("🔍 Running pre-commit checks...\n");

  const overallStartTime = Date.now();
  const CHECK_TIMEOUT = 120000; // 2 minutes per check

  const checks: Array<{ name: string; fn: () => Promise<boolean> }> = [
    {
      name: "TypeScript compilation",
      fn: async () => {
        try {
          execSync("npm run build", { stdio: "pipe" });
          return true;
        } catch {
          // eslint-disable-next-line no-console
          console.error("❌ TypeScript compilation failed");
          return false;
        }
      }
    },
    {
      name: "Lint checks",
      fn: () => {
        return new Promise((resolve) => {
          try {
            execSync("npm run lint", { stdio: "pipe" });
            resolve(true);
          } catch {
            // eslint-disable-next-line no-console
            console.error("❌ Lint checks failed");
            resolve(false);
          }
        });
      }
    },
    {
      name: "Test suite",
      fn: () => {
        return new Promise((resolve) => {
          try {
            execSync("npm test", { stdio: "pipe" });
            resolve(true);
          } catch {
            // eslint-disable-next-line no-console
            console.error("❌ Tests failed");
            resolve(false);
          }
        });
      }
    },
    {
      name: "Example config validation",
      fn: async () => {
        const exampleConfig = path.join(process.cwd(), "examples/config/sample-config.json");
        if (!existsSync(exampleConfig)) {
          // eslint-disable-next-line no-console
          console.warn("⚠️  Example config not found, skipping validation");
          return true;
        }

        try {
          execSync(`node dist/cli.js ${exampleConfig} --format json`, { stdio: "pipe" });
          return true;
        } catch {
          // eslint-disable-next-line no-console
          console.error("❌ Example config validation failed");
          return false;
        }
      }
    }
  ];

  const results: boolean[] = [];
  
  for (const check of checks) {
    const checkStartTime = Date.now();
    // eslint-disable-next-line no-console
    console.log(`Running: ${check.name}...`);
    
    try {
      const result = await Promise.race([
        check.fn(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error("Check timeout")), CHECK_TIMEOUT)
        )
      ]);
      
      const checkDuration = ((Date.now() - checkStartTime) / 1000).toFixed(2);
      results.push(result);
      
      if (result) {
        // eslint-disable-next-line no-console
        console.log(`✅ ${check.name} passed (${checkDuration}s)\n`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`❌ ${check.name} failed (${checkDuration}s)\n`);
      }
    } catch (error) {
      const checkDuration = ((Date.now() - checkStartTime) / 1000).toFixed(2);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("timeout")) {
        // eslint-disable-next-line no-console
        console.error(`⏱️  ${check.name} timed out after ${CHECK_TIMEOUT / 1000}s\n`);
      } else {
        // eslint-disable-next-line no-console
        console.error(`❌ ${check.name} error: ${errorMessage} (${checkDuration}s)\n`);
      }
      results.push(false);
    }
  }

  const allPassed = results.every(r => r);
  const totalDuration = ((Date.now() - overallStartTime) / 1000).toFixed(2);
  
  if (allPassed) {
    // eslint-disable-next-line no-console
    console.log(`✅ All pre-commit checks passed! (Total time: ${totalDuration}s)`);
    process.exit(0);
  } else {
    const passedCount = results.filter(r => r).length;
    const failedCount = results.length - passedCount;
    // eslint-disable-next-line no-console
    console.error(`❌ Pre-commit checks failed (${passedCount}/${results.length} passed, ${totalDuration}s)`);
    // eslint-disable-next-line no-console
    console.error("   Please fix the issues above before committing.");
    process.exit(1);
  }
}

preCommit().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error in pre-commit hook:", error);
  process.exit(1);
});

