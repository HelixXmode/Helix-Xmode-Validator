import { readFile } from "node:fs/promises";
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

export class HelixValidator {
  private logger: Logger;
  private options: ValidatorOptions;

  constructor(options: ValidatorOptions = {}) {
    this.options = options;
    this.logger = new Logger({ level: "info" });
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    const started = Date.now();
    const config = await this.loadConfig(filePath);
    const result = this.validateConfig(config);
    const elapsedMs = Date.now() - started;
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
    try {
      const file = await readFile(resolved, "utf8");
      return JSON.parse(file) as HelixConfig;
    } catch (error) {
      const issue: ValidationIssue = {
        path: "$file",
        message: `Failed to read or parse config: ${(error as Error).message}`,
        severity: "error",
        rule: "io/parse-error"
      };
      const summary = this.render(this.buildSummary([issue]), [issue], "text");
      return { rules: {}, metadata: { error: summary } };
    }
  }

  private buildSummary(issues: ValidationIssue[]) {
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warn").length;
    const infos = issues.filter((i) => i.severity === "info").length;
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
}

