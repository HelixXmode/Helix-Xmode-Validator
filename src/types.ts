export type Severity = "error" | "warn" | "info";

export interface ValidationIssue {
  path: string;
  message: string;
  severity: Severity;
  rule: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  summary: string;
  elapsedMs: number;
  format: "text" | "json";
}

export interface HelixConfig {
  name?: string;
  version?: string;
  rules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ValidatorOptions {
  strict?: boolean;
  ruleset?: string;
  format?: "text" | "json";
}

