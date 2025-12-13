import { ValidationIssue, ValidationResult } from "../types";

export interface JsonFormatterOptions {
  pretty?: boolean;
  includeMetadata?: boolean;
  includeTiming?: boolean;
}

/**
 * JSON formatter for validation results.
 * Provides structured output suitable for programmatic consumption
 * and CI/CD integration.
 */
export class JsonFormatter {
  private pretty: boolean;
  private includeMetadata: boolean;
  private includeTiming: boolean;

  constructor(options: JsonFormatterOptions = {}) {
    this.pretty = options.pretty ?? true;
    this.includeMetadata = options.includeMetadata ?? true;
    this.includeTiming = options.includeTiming ?? true;
  }

  /**
   * Format validation result as JSON string.
   */
  format(result: ValidationResult): string {
    const output: Record<string, unknown> = {
      ok: result.ok,
      summary: this.buildSummary(result.issues),
      issues: result.issues
    };

    if (this.includeTiming && result.elapsedMs > 0) {
      output.timing = {
        elapsedMs: result.elapsedMs,
        timestamp: new Date().toISOString()
      };
    }

    if (this.includeMetadata) {
      output.metadata = {
        format: "json",
        version: "1.0.0",
        validator: "helix-x-validator"
      };
    }

    // Group issues by severity for easier processing
    output.issuesBySeverity = this.groupBySeverity(result.issues);

    // Add issue counts per rule
    output.ruleStats = this.buildRuleStats(result.issues);

    if (this.pretty) {
      return JSON.stringify(output, null, 2);
    }
    return JSON.stringify(output);
  }

  /**
   * Build summary statistics from issues.
   */
  private buildSummary(issues: ValidationIssue[]): Record<string, number> {
    const summary = {
      total: issues.length,
      errors: 0,
      warnings: 0,
      info: 0
    };

    issues.forEach((issue) => {
      switch (issue.severity) {
        case "error":
          summary.errors++;
          break;
        case "warn":
          summary.warnings++;
          break;
        case "info":
          summary.info++;
          break;
      }
    });

    return summary;
  }

  /**
   * Group issues by severity level.
   */
  private groupBySeverity(
    issues: ValidationIssue[]
  ): Record<string, ValidationIssue[]> {
    const grouped: Record<string, ValidationIssue[]> = {
      error: [],
      warn: [],
      info: []
    };

    issues.forEach((issue) => {
      grouped[issue.severity].push(issue);
    });

    return grouped;
  }

  /**
   * Build statistics per rule.
   */
  private buildRuleStats(
    issues: ValidationIssue[]
  ): Record<string, { count: number; severities: Record<string, number> }> {
    const stats: Record<
      string,
      { count: number; severities: Record<string, number> }
    > = {};

    issues.forEach((issue) => {
      if (!stats[issue.rule]) {
        stats[issue.rule] = {
          count: 0,
          severities: { error: 0, warn: 0, info: 0 }
        };
      }

      stats[issue.rule].count++;
      stats[issue.rule].severities[issue.severity]++;
    });

    return stats;
  }

  /**
   * Format a single issue as JSON.
   */
  static formatIssue(issue: ValidationIssue): Record<string, unknown> {
    return {
      path: issue.path,
      message: issue.message,
      severity: issue.severity,
      rule: issue.rule
    };
  }
}

