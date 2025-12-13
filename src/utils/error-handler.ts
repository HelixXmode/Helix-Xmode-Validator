import { ValidationIssue } from "../types";
import { Logger } from "./logger";

/**
 * Centralized error handling and issue management.
 */
export class ErrorHandler {
  private logger: Logger;
  private maxIssues: number;

  constructor(logger?: Logger, maxIssues: number = 1000) {
    this.logger = logger ?? new Logger({ level: "info" });
    this.maxIssues = maxIssues;
  }

  /**
   * Handle validation errors and convert to issues.
   */
  handleError(
    error: Error,
    context: { path?: string; rule?: string }
  ): ValidationIssue {
    const issue: ValidationIssue = {
      path: context.path ?? "$error",
      message: this.sanitizeMessage(error.message),
      severity: "error",
      rule: context.rule ?? "system/error"
    };

    this.logger.error(`Error in ${context.path ?? "unknown"}: ${error.message}`);
    return issue;
  }

  /**
   * Sanitize error message for user display.
   */
  private sanitizeMessage(message: string): string {
    // Remove stack traces and internal paths
    return message
      .split("\n")[0] // Take first line only
      .replace(/\/.*?\/node_modules\//g, "[internal]/")
      .replace(/at .*? \(.*?\)/g, "")
      .trim();
  }

  /**
   * Limit number of issues to prevent memory issues.
   */
  limitIssues(issues: ValidationIssue[]): ValidationIssue[] {
    if (issues.length <= this.maxIssues) {
      return issues;
    }

    this.logger.warn(
      `Issue count (${issues.length}) exceeds maximum (${this.maxIssues}). Truncating.`
    );

    // Keep errors first, then warnings, then info
    const errors = issues.filter(i => i.severity === "error");
    const warnings = issues.filter(i => i.severity === "warn");
    const infos = issues.filter(i => i.severity === "info");

    const limited: ValidationIssue[] = [];
    limited.push(...errors.slice(0, Math.floor(this.maxIssues * 0.6)));
    limited.push(...warnings.slice(0, Math.floor(this.maxIssues * 0.3)));
    limited.push(...infos.slice(0, this.maxIssues - limited.length));

    return limited;
  }

  /**
   * Group issues by path for better organization.
   */
  groupByPath(issues: ValidationIssue[]): Map<string, ValidationIssue[]> {
    const grouped = new Map<string, ValidationIssue[]>();

    issues.forEach(issue => {
      const path = issue.path;
      if (!grouped.has(path)) {
        grouped.set(path, []);
      }
      grouped.get(path)!.push(issue);
    });

    return grouped;
  }

  /**
   * Filter issues by severity.
   */
  filterBySeverity(
    issues: ValidationIssue[],
    severity: "error" | "warn" | "info"
  ): ValidationIssue[] {
    return issues.filter(issue => issue.severity === severity);
  }
}

