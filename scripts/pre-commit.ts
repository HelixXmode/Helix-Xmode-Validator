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
    // eslint-disable-next-line no-console
    console.log(`Running: ${check.name}...`);
    const result = await check.fn();
    results.push(result);
    
    if (result) {
      // eslint-disable-next-line no-console
      console.log(`✅ ${check.name} passed\n`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`❌ ${check.name} failed\n`);
    }
  }

  const allPassed = results.every(r => r);
  
  if (allPassed) {
    // eslint-disable-next-line no-console
    console.log("✅ All pre-commit checks passed!");
    process.exit(0);
  } else {
    // eslint-disable-next-line no-console
    console.error("❌ Pre-commit checks failed. Please fix the issues above before committing.");
    process.exit(1);
  }
}

preCommit().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error in pre-commit hook:", error);
  process.exit(1);
});

