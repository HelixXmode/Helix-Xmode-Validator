import { ValidationIssue, ValidationResult } from "../types";

export interface TextFormatterOptions {
  useColors?: boolean;
  showRule?: boolean;
  showPath?: boolean;
  maxLineLength?: number;
}

/**
 * Human-readable text formatter for validation results.
 * Provides clear, colorized output for terminal consumption.
 */
export class TextFormatter {
  private useColors: boolean;
  private showRule: boolean;
  private showPath: boolean;
  private maxLineLength: number;

  private readonly colors = {
    error: "\x1b[31m", // red
    warn: "\x1b[33m",  // yellow
    info: "\x1b[36m",  // cyan
    success: "\x1b[32m", // green
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    bold: "\x1b[1m"
  };

  constructor(options: TextFormatterOptions = {}) {
    this.useColors = options.useColors ?? true;
    this.showRule = options.showRule ?? true;
    this.showPath = options.showPath ?? true;
    this.maxLineLength = options.maxLineLength ?? 80;
  }

  /**
   * Format validation result as text string.
   */
  format(result: ValidationResult): string {
    const lines: string[] = [];

    // Header
    lines.push(this.formatHeader(result));

    // Summary line
    lines.push(this.formatSummary(result));

    // Issues list
    if (result.issues.length > 0) {
      lines.push("");
      lines.push(this.formatIssues(result.issues));
    }

    // Footer with timing
    if (result.elapsedMs > 0) {
      lines.push("");
      lines.push(this.colorize(`Completed in ${result.elapsedMs}ms`, "dim"));
    }

    return lines.join("\n");
  }

  /**
   * Format header section.
   */
  private formatHeader(result: ValidationResult): string {
    const status = result.ok ? "✓ PASSED" : "✗ FAILED";
    const statusColor = result.ok ? "success" : "error";
    return this.colorize(`Helix X Validator - ${status}`, statusColor);
  }

  /**
   * Format summary statistics.
   */
  private formatSummary(result: ValidationResult): string {
    const errors = result.issues.filter((i) => i.severity === "error").length;
    const warnings = result.issues.filter((i) => i.severity === "warn").length;
    const infos = result.issues.filter((i) => i.severity === "info").length;

    const parts: string[] = [];
    if (errors > 0) {
      parts.push(this.colorize(`${errors} error${errors !== 1 ? "s" : ""}`, "error"));
    }
    if (warnings > 0) {
      parts.push(this.colorize(`${warnings} warning${warnings !== 1 ? "s" : ""}`, "warn"));
    }
    if (infos > 0) {
      parts.push(this.colorize(`${infos} info${infos !== 1 ? "s" : ""}`, "info"));
    }

    if (parts.length === 0) {
      return this.colorize("No issues found", "success");
    }

    return `Found: ${parts.join(", ")}`;
  }

  /**
   * Format issues list.
   */
  private formatIssues(issues: ValidationIssue[]): string {
    // Group by severity
    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warn");
    const infos = issues.filter((i) => i.severity === "info");

    const sections: string[] = [];

    if (errors.length > 0) {
      sections.push(this.colorize("Errors:", "error"));
      sections.push(...errors.map((issue) => this.formatIssue(issue, "error")));
    }

    if (warnings.length > 0) {
      if (sections.length > 0) sections.push("");
      sections.push(this.colorize("Warnings:", "warn"));
      sections.push(...warnings.map((issue) => this.formatIssue(issue, "warn")));
    }

    if (infos.length > 0) {
      if (sections.length > 0) sections.push("");
      sections.push(this.colorize("Info:", "info"));
      sections.push(...infos.map((issue) => this.formatIssue(issue, "info")));
    }

    return sections.join("\n");
  }

  /**
   * Format a single issue.
   */
  private formatIssue(issue: ValidationIssue, severity: "error" | "warn" | "info"): string {
    const parts: string[] = [];
    const prefix = this.colorize(`  [${severity.toUpperCase()}]`, severity);

    if (this.showPath && issue.path) {
      parts.push(this.colorize(issue.path, "dim"));
    }

    if (this.showRule && issue.rule) {
      parts.push(this.colorize(`(${issue.rule})`, "dim"));
    }

    parts.push(issue.message);

    const line = `${prefix} ${parts.join(" ")}`;
    
    // Truncate if too long
    if (line.length > this.maxLineLength) {
      return line.substring(0, this.maxLineLength - 3) + "...";
    }

    return line;
  }

  /**
   * Apply color to text if colors are enabled.
   */
  private colorize(text: string, color: keyof typeof this.colors): string {
    if (!this.useColors) return text;
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }
}

