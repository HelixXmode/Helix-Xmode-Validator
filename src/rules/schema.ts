import { HelixConfig, ValidationIssue } from "../types";

const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/;
const nameRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i;
const maxNameLength = 64;
const maxVersionLength = 32;

export function validateSchema(config: HelixConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Name validation - optimized with early returns for common cases
  if (!config.name) {
    issues.push({
      path: "name",
      message: "Config name is required.",
      severity: "error",
      rule: "schema/name-required"
    });
    // Early return optimization: if name is missing, skip further name checks
  } else if (typeof config.name !== "string") {
    issues.push({
      path: "name",
      message: "Config name must be a string.",
      severity: "error",
      rule: "schema/name-type"
    });
  } else {
    // Optimize: combine length and format checks
    if (config.name.length > maxNameLength) {
      issues.push({
        path: "name",
        message: `Config name exceeds maximum length of ${maxNameLength} characters.`,
        severity: "error",
        rule: "schema/name-length"
      });
    }
    if (!nameRegex.test(config.name)) {
      issues.push({
        path: "name",
        message: "Config name must contain only alphanumeric characters and hyphens, and cannot start or end with a hyphen.",
        severity: "error",
        rule: "schema/name-format"
      });
    }
  }

  // Version validation
  if (config.version !== undefined) {
    if (typeof config.version !== "string") {
      issues.push({
        path: "version",
        message: "Version must be a string.",
        severity: "error",
        rule: "schema/version-type"
      });
    } else {
      if (config.version.length > maxVersionLength) {
        issues.push({
          path: "version",
          message: `Version exceeds maximum length of ${maxVersionLength} characters.`,
          severity: "warn",
          rule: "schema/version-length"
        });
      }
      if (!semverRegex.test(config.version)) {
        issues.push({
          path: "version",
          message: "Version should follow semver format (x.y.z[-prerelease][+build]).",
          severity: "warn",
          rule: "schema/version-semver"
        });
      }
    }
  }

  // Rules validation
  if (!config.rules) {
    issues.push({
      path: "rules",
      message: "Rules section is required.",
      severity: "error",
      rule: "schema/rules-required"
    });
  } else if (typeof config.rules !== "object" || Array.isArray(config.rules)) {
    issues.push({
      path: "rules",
      message: "Rules section must be an object.",
      severity: "error",
      rule: "schema/rules-object"
    });
  } else if (Object.keys(config.rules).length === 0) {
    issues.push({
      path: "rules",
      message: "Rules section cannot be empty.",
      severity: "warn",
      rule: "schema/rules-empty"
    });
  }

  // Metadata validation (optional but should be object if present)
  if (config.metadata !== undefined && (typeof config.metadata !== "object" || Array.isArray(config.metadata) || config.metadata === null)) {
    issues.push({
      path: "metadata",
      message: "Metadata must be an object if provided.",
      severity: "warn",
      rule: "schema/metadata-type"
    });
  }

  return issues;
}

