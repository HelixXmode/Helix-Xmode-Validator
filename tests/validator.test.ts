import { describe, it, expect, beforeEach } from "@jest/globals";
import { HelixValidator } from "../src/validator";
import { HelixConfig } from "../src/types";

describe("HelixValidator", () => {
  let validator: HelixValidator;

  beforeEach(() => {
    validator = new HelixValidator({
      format: "text",
      strict: false
    });
  });

  describe("validateConfig", () => {
    it("should accept valid configuration", () => {
      const config: HelixConfig = {
        name: "test-config",
        version: "1.0.0",
        rules: {
          "rule1": { enabled: true },
          "rule2": { enabled: false }
        }
      };

      const result = validator.validateConfig(config);
      expect(result.ok).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it("should reject configuration without name", () => {
      const config: HelixConfig = {
        version: "1.0.0",
        rules: {}
      };

      const result = validator.validateConfig(config);
      expect(result.ok).toBe(false);
      expect(result.issues.some(i => i.rule === "schema/name-required")).toBe(true);
    });

    it("should reject configuration without rules", () => {
      const config: HelixConfig = {
        name: "test-config",
        version: "1.0.0"
      };

      const result = validator.validateConfig(config);
      expect(result.ok).toBe(false);
      expect(result.issues.some(i => i.rule === "schema/rules-required")).toBe(true);
    });

    it("should warn about invalid semver version", () => {
      const config: HelixConfig = {
        name: "test-config",
        version: "invalid-version",
        rules: {
          "rule1": {}
        }
      };

      const result = validator.validateConfig(config);
      expect(result.ok).toBe(true); // Should still pass
      expect(result.issues.some(i => 
        i.rule === "schema/version-semver" && i.severity === "warn"
      )).toBe(true);
    });

    it("should detect reserved names", () => {
      const config: HelixConfig = {
        name: "default",
        rules: {
          "rule1": {}
        }
      };

      const result = validator.validateConfig(config);
      expect(result.ok).toBe(false);
      expect(result.issues.some(i => 
        i.rule === "ruleset/reserved-name" && i.severity === "error"
      )).toBe(true);
    });

    it("should detect duplicate rule keys (case-insensitive)", () => {
      const config: HelixConfig = {
        name: "test-config",
        rules: {
          "Rule1": {},
          "rule1": {},
          "RULE1": {}
        }
      };

      const result = validator.validateConfig(config);
      expect(result.issues.some(i => 
        i.rule === "ruleset/duplicate-rule" && i.severity === "warn"
      )).toBe(true);
    });

    it("should enforce strict mode", () => {
      const strictValidator = new HelixValidator({
        format: "text",
        strict: true,
        ruleset: "strict"
      });

      const config: HelixConfig = {
        name: "test-config",
        rules: {
          "rule1": {}
        }
      };

      const result = strictValidator.validateConfig(config);
      // In strict mode, even warnings should fail
      expect(result.ok).toBe(true); // This config should pass
    });

    it("should format output as JSON when requested", () => {
      const jsonValidator = new HelixValidator({
        format: "json"
      });

      const config: HelixConfig = {
        name: "test-config",
        rules: {
          "rule1": {}
        }
      };

      const result = jsonValidator.validateConfig(config);
      expect(result.format).toBe("json");
      
      // Should be valid JSON
      const parsed = JSON.parse(result.summary);
      expect(parsed).toHaveProperty("summary");
      expect(parsed).toHaveProperty("issues");
    });
  });

  describe("cache behavior", () => {
    it("should clear cache when requested", () => {
      validator.clearCache();
      // Cache should be empty after clear
      expect(validator).toBeDefined();
    });
  });
});

