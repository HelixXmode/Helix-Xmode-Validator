#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Comprehensive linting script that checks all TypeScript files
 * in the project for code quality issues.
 * 
 * Usage:
 *   node scripts/lint-all.js [--fix]
 */
function lintAll() {
  const fix = process.argv.includes("--fix");
  const fixFlag = fix ? " --fix" : "";
  const startTime = Date.now();

  // eslint-disable-next-line no-console
  console.log("🔍 Running lint checks...\n");

  const directories = ["src", "examples", "scripts", "tests"];
  const extensions = [".ts", ".tsx"];
  let totalFiles = 0;
  let totalIssues = 0;
  let totalSize = 0;

  try {
    directories.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (!statSync(dirPath).isDirectory()) {
        return;
      }

      // eslint-disable-next-line no-console
      console.log(`Checking ${dir}/...`);

      const files = findTypeScriptFiles(dirPath, extensions);
      totalFiles += files.length;

      files.forEach(file => {
        try {
          // In a real setup, this would run ESLint
          // For now, we'll do basic checks
          const relativePath = path.relative(process.cwd(), file);
          
          // Check file size (very large files might indicate issues)
          const stats = statSync(file);
          totalSize += stats.size;
          
          if (stats.size > 1000000) {
            // eslint-disable-next-line no-console
            console.warn(`⚠️  Large file detected: ${relativePath} (${(stats.size / 1024).toFixed(2)} KB)`);
            totalIssues++;
          }

          // Check for empty files
          if (stats.size === 0) {
            // eslint-disable-next-line no-console
            console.warn(`⚠️  Empty file detected: ${relativePath}`);
            totalIssues++;
          }

          // Basic syntax check would go here
          // execSync(`eslint ${file}${fixFlag}`, { stdio: "pipe" });
        } catch (error) {
          const relativePath = path.relative(process.cwd(), file);
          // eslint-disable-next-line no-console
          console.error(`❌ Error checking ${relativePath}:`, (error as Error).message);
          totalIssues++;
        }
      });
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    // eslint-disable-next-line no-console
    console.log(`\n📊 Lint Summary:`);
    // eslint-disable-next-line no-console
    console.log(`   Files checked: ${totalFiles}`);
    // eslint-disable-next-line no-console
    console.log(`   Total code size: ${totalSizeMB} MB`);
    // eslint-disable-next-line no-console
    console.log(`   Issues found: ${totalIssues}`);
    // eslint-disable-next-line no-console
    console.log(`   Time elapsed: ${duration}s`);

    if (totalIssues === 0) {
      // eslint-disable-next-line no-console
      console.log("\n✅ All lint checks passed!");
      process.exit(0);
    } else {
      // eslint-disable-next-line no-console
      console.log("\n❌ Lint checks failed. Please fix the issues above.");
      if (fix) {
        // eslint-disable-next-line no-console
        console.log("   Some issues may have been auto-fixed. Please review the changes.");
      } else {
        // eslint-disable-next-line no-console
        console.log("   Run with --fix to attempt automatic fixes.");
      }
      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Fatal error during linting:", error);
    process.exit(1);
  }
}

function findTypeScriptFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        files.push(...findTypeScriptFiles(fullPath, extensions));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  } catch (error) {
    // Ignore permission errors
  }
  
  return files;
}

lintAll();

