import { HelixConfig, ValidationIssue } from "../types";

const RESERVED_NAMES = new Set(["default", "system", "core", "internal", "root", "admin"]);
const MAX_RULE_KEY_LENGTH = 128;
const MAX_RULES_COUNT = 1000;
const DEPRECATED_PATTERNS = ["legacy", "old", "deprecated"];

export interface RulesetOptions {
  name?: string;
  maxRules?: number;
}

export function evaluateRules(
  config: HelixConfig,
  options: RulesetOptions = {}
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rules = config.rules ?? {};

  // Reserved name check
  if (config.name && RESERVED_NAMES.has(config.name.toLowerCase())) {
    issues.push({
      path: "name",
      message: `Name "${config.name}" is reserved and cannot be used.`,
      severity: "error",
      rule: "ruleset/reserved-name"
    });
  }

  const ruleKeys = Object.keys(rules);
  const maxRules = options.maxRules ?? MAX_RULES_COUNT;

  // Rule count validation
  if (ruleKeys.length > maxRules) {
    issues.push({
      path: "rules",
      message: `Too many rules: ${ruleKeys.length} exceeds maximum of ${maxRules}.`,
      severity: "error",
      rule: "ruleset/max-rules"
    });
  }

  // Duplicate detection (case-insensitive)
  const duplicates = findDuplicates(ruleKeys);
  duplicates.forEach((dup) => {
    issues.push({
      path: `rules.${dup}`,
      message: `Duplicate rule key "${dup}" (case-insensitive match detected).`,
      severity: "warn",
      rule: "ruleset/duplicate-rule"
    });
  });

  // Rule key format validation - optimized with compiled regex
  const keyFormatRegex = /^[a-zA-Z0-9_][a-zA-Z0-9_\-.]*$/;
  for (const key of ruleKeys) {
    if (key.length > MAX_RULE_KEY_LENGTH) {
      issues.push({
        path: `rules.${key}`,
        message: `Rule key "${key}" exceeds maximum length of ${MAX_RULE_KEY_LENGTH} characters.`,
        severity: "error",
        rule: "ruleset/key-length"
      });
    }

    if (!keyFormatRegex.test(key)) {
      issues.push({
        path: `rules.${key}`,
        message: `Rule key "${key}" contains invalid characters. Only alphanumeric, underscore, hyphen, and dot are allowed.`,
        severity: "error",
        rule: "ruleset/key-format"
      });
    }

    // Deprecation warnings - optimized with early exit
    const lowerKey = key.toLowerCase();
    for (const pattern of DEPRECATED_PATTERNS) {
      if (lowerKey.includes(pattern)) {
        issues.push({
          path: `rules.${key}`,
          message: `Rule key "${key}" appears to use deprecated naming pattern. Consider updating to current conventions.`,
          severity: "info",
          rule: "ruleset/deprecated-pattern"
        });
        break; // Early exit after first match
      }
    }
  }

  // Strict ruleset validation
  if (options.name === "strict") {
    if (ruleKeys.length === 0) {
      issues.push({
        path: "rules",
        message: "Strict ruleset requires at least one rule.",
        severity: "error",
        rule: "ruleset/strict-min-rules"
      });
    }

    // In strict mode, warn about empty rule values
    ruleKeys.forEach((key) => {
      const value = rules[key];
      if (value === null || value === undefined || (typeof value === "object" && Object.keys(value).length === 0)) {
        issues.push({
          path: `rules.${key}`,
          message: `Rule "${key}" has an empty value, which may not be intended in strict mode.`,
          severity: "warn",
          rule: "ruleset/strict-empty-value"
        });
      }
    });
  }

  return issues;
}

function findDuplicates(values: string[]): string[] {
  // Optimize: use single pass with early detection
  const seen = new Map<string, string>(); // normalized -> original
  const dup = new Set<string>();
  
  for (const value of values) {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) {
      dup.add(normalized);
    } else {
      seen.set(normalized, value);
    }
  }
  
  return Array.from(dup);
}

