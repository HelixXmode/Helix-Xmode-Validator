import { HelixConfig, ValidationIssue } from "../types";

/**
 * Plugin interface for custom validation rules.
 * Allows extending the validator with domain-specific checks.
 */
export interface RulePlugin {
  /**
   * Unique identifier for the plugin.
   */
  name: string;

  /**
   * Version of the plugin.
   */
  version: string;

  /**
   * Validate the configuration and return issues.
   */
  validate(config: HelixConfig): ValidationIssue[] | Promise<ValidationIssue[]>;

  /**
   * Optional: Initialize the plugin with options.
   */
  initialize?(options: Record<string, unknown>): void | Promise<void>;
}

/**
 * Plugin registry for managing custom rule plugins.
 */
export class PluginRegistry {
  private plugins: Map<string, RulePlugin> = new Map();

  /**
   * Register a plugin.
   */
  register(plugin: RulePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Unregister a plugin.
   */
  unregister(name: string): void {
    this.plugins.delete(name);
  }

  /**
   * Get a plugin by name.
   */
  get(name: string): RulePlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins.
   */
  getAll(): RulePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Validate configuration using all registered plugins.
   */
  async validateAll(config: HelixConfig): Promise<ValidationIssue[]> {
    const allIssues: ValidationIssue[] = [];

    for (const plugin of this.plugins.values()) {
      try {
        const issues = await plugin.validate(config);
        // Prefix plugin name to rule identifiers
        const prefixedIssues = issues.map(issue => ({
          ...issue,
          rule: `${plugin.name}/${issue.rule}`
        }));
        allIssues.push(...prefixedIssues);
      } catch (error) {
        // If plugin fails, add an error issue
        allIssues.push({
          path: "$plugin",
          message: `Plugin "${plugin.name}" failed: ${(error as Error).message}`,
          severity: "error",
          rule: `plugin/${plugin.name}/error`
        });
      }
    }

    return allIssues;
  }

  /**
   * Clear all registered plugins.
   */
  clear(): void {
    this.plugins.clear();
  }
}

/**
 * Example plugin: Validates that all rule keys follow a naming convention.
 */
export class NamingConventionPlugin implements RulePlugin {
  name = "naming-convention";
  version = "1.0.0";
  private pattern: RegExp;

  constructor(pattern?: RegExp) {
    this.pattern = pattern ?? /^[a-z][a-z0-9-]*$/;
  }

  validate(config: HelixConfig): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const rules = config.rules ?? {};

    Object.keys(rules).forEach((key) => {
      if (!this.pattern.test(key)) {
        issues.push({
          path: `rules.${key}`,
          message: `Rule key "${key}" does not follow naming convention (${this.pattern.source})`,
          severity: "warn",
          rule: "naming-convention"
        });
      }
    });

    return issues;
  }
}

