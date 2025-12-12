import { HelixConfig, ValidationIssue } from "../types";

const RESERVED_NAMES = new Set(["default", "system", "core"]);

export interface RulesetOptions {
  name?: string;
}

export function evaluateRules(
  config: HelixConfig,
  options: RulesetOptions = {}
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rules = config.rules ?? {};

  if (config.name && RESERVED_NAMES.has(config.name.toLowerCase())) {
    issues.push({
      path: "name",
      message: `Name "${config.name}" is reserved.`,
      severity: "error",
      rule: "ruleset/reserved-name"
    });
  }

  const ruleKeys = Object.keys(rules);
  const duplicates = findDuplicates(ruleKeys);
  duplicates.forEach((dup) => {
    issues.push({
      path: `rules.${dup}`,
      message: `Duplicate rule key "${dup}".`,
      severity: "warn",
      rule: "ruleset/duplicate-rule"
    });
  });

  if (options.name === "strict" && ruleKeys.length === 0) {
    issues.push({
      path: "rules",
      message: "Strict ruleset requires at least one rule.",
      severity: "error",
      rule: "ruleset/strict-min-rules"
    });
  }

  return issues;
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  values.forEach((value) => {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) {
      dup.add(normalized);
    } else {
      seen.add(normalized);
    }
  });
  return Array.from(dup);
}

