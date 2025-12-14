import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { evaluateRules } from "./rules/ruleset";
import { validateSchema } from "./rules/schema";
import { Logger } from "./utils/logger";
import {
  HelixConfig,
  ValidationIssue,
  ValidationResult,
  ValidatorOptions
} from "./types";

interface CacheEntry {
  config: HelixConfig;
  timestamp: number;
  mtime: number;
}

export class HelixValidator {
  private logger: Logger;
  private options: ValidatorOptions;
  private cache: Map<string, CacheEntry>;
  private readonly cacheTtl: number = 5000; // 5 seconds
  private readonly maxCacheSize: number = 50; // LRU cache limit

  constructor(options: ValidatorOptions = {}) {
    this.options = options;
    this.logger = new Logger({ level: options.strict ? "warn" : "info" });
    this.cache = new Map();
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    const started = Date.now();
    let config: HelixConfig;
    
    try {
      config = await this.loadConfig(filePath);
    } catch (error) {
      // Return early validation result for file loading errors
      const issue: ValidationIssue = {
        path: "$file",
        message: `Failed to load config: ${(error as Error).message}`,
        severity: "error",
        rule: "io/load-error"
      };
      const summary = this.buildSummary([issue]);
      const format = this.options.format ?? "text";
      return {
        ok: false,
        issues: [issue],
        summary: this.render(summary, [issue], format),
        elapsedMs: Date.now() - started,
        format
      };
    }
    
    const result = this.validateConfig(config);
    const elapsedMs = Date.now() - started;
    
    this.logger.debug(`Validation completed in ${elapsedMs}ms`);
    if (!result.ok) {
      const errorCount = result.issues.filter(i => i.severity === "error").length;
      this.logger.warn(`Validation failed: ${errorCount} errors`);
    }
    
    return { ...result, elapsedMs };
  }

  validateConfig(config: HelixConfig): ValidationResult {
    const schemaIssues = validateSchema(config);
    const rulesetIssues = evaluateRules(config, {
      name: this.options.ruleset
    });
    const issues = [...schemaIssues, ...rulesetIssues];
    const summary = this.buildSummary(issues);
    const ok = this.computeOk(issues);
    const format = this.options.format ?? "text";
    return { ok, issues, summary: this.render(summary, issues, format), elapsedMs: 0, format };
  }

  private async loadConfig(filePath: string): Promise<HelixConfig> {
    const resolved = path.resolve(filePath);
    this.logger.info(`Loading config from ${resolved}`);
    
    // Verify file exists and get stats
    const stats = await stat(resolved);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${resolved}`);
    }

    // Check cache with mtime validation for better cache invalidation
    const cached = this.cache.get(resolved);
    const now = Date.now();
    if (cached && 
        (now - cached.timestamp < this.cacheTtl) && 
        cached.mtime === stats.mtimeMs) {
      this.logger.debug(`Using cached config for ${resolved}`);
      return cached.config;
    }

    // Enforce LRU cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.logger.debug(`Cache size limit reached, evicted: ${firstKey}`);
      }
    }

    // Read and parse file
    const file = await readFile(resolved, "utf8");
    const config = JSON.parse(file) as HelixConfig;
    
    // Cache the parsed config with mtime for change detection
    this.cache.set(resolved, { 
      config, 
      timestamp: now,
      mtime: stats.mtimeMs 
    });
    
    return config;
  }

  private buildSummary(issues: ValidationIssue[]) {
    // Optimize: single pass through issues array instead of multiple filters
    let errors = 0;
    let warnings = 0;
    let infos = 0;
    
    for (const issue of issues) {
      if (issue.severity === "error") errors++;
      else if (issue.severity === "warn") warnings++;
      else if (issue.severity === "info") infos++;
    }
    
    return { errors, warnings, infos, total: issues.length };
  }

  private computeOk(issues: ValidationIssue[]) {
    if (issues.some((i) => i.severity === "error")) return false;
    if (this.options.strict && issues.some((i) => i.severity === "warn")) return false;
    return true;
  }

  private render(
    summary: { errors: number; warnings: number; infos: number; total: number },
    issues: ValidationIssue[],
    format: "text" | "json"
  ): string {
    if (format === "json") {
      return JSON.stringify({ summary, issues }, null, 2);
    }

    const header = `Helix X validation: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.infos} info`;
    const body = issues
      .map(
        (issue) =>
          `- [${issue.severity}] (${issue.rule}) ${issue.path}: ${issue.message}`
      )
      .join("\n");
    return [header, body].filter(Boolean).join("\n");
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.debug("Cache cleared");
  }

  /**
   * Get cache statistics for monitoring.
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }
}

