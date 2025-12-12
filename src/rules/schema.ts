import { HelixConfig, ValidationIssue } from "../types";

const semverRegex = /^\d+\.\d+\.\d+$/;

export function validateSchema(config: HelixConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!config.name) {
    issues.push({
      path: "name",
      message: "Config name is required.",
      severity: "error",
      rule: "schema/name-required"
    });
  }

  if (config.version && !semverRegex.test(config.version)) {
    issues.push({
      path: "version",
      message: "Version should follow semver (x.y.z).",
      severity: "warn",
      rule: "schema/version-semver"
    });
  }

  if (!config.rules || typeof config.rules !== "object") {
    issues.push({
      path: "rules",
      message: "Rules section should be an object.",
      severity: "error",
      rule: "schema/rules-object"
    });
  }

  return issues;
}

