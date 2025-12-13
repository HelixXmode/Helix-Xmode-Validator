import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { HelixConfig } from "../types";
import { Logger } from "../utils/logger";

export interface YamlLoaderOptions {
  logger?: Logger;
  allowComments?: boolean;
}

/**
 * YAML configuration loader with support for YAML parsing,
 * comment handling, and multi-document support.
 * Note: This is a placeholder implementation. In production,
 * you would use a library like 'js-yaml' or 'yaml'.
 */
export class YamlLoader {
  private logger: Logger;
  private allowComments: boolean;

  constructor(options: YamlLoaderOptions = {}) {
    this.logger = options.logger ?? new Logger({ level: "info" });
    this.allowComments = options.allowComments ?? true;
  }

  /**
   * Load and parse a YAML configuration file.
   * @param filePath Path to the YAML file
   * @returns Parsed HelixConfig object
   * @throws Error if file cannot be read or parsed
   */
  async load(filePath: string): Promise<HelixConfig> {
    const resolved = path.resolve(filePath);
    this.logger.debug(`Loading YAML config from: ${resolved}`);

    try {
      // Verify file exists
      const stats = await stat(resolved);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${resolved}`);
      }

      // Read file content
      const content = await readFile(resolved, "utf8");

      // Remove comments if not allowed
      const processedContent = this.allowComments
        ? content
        : this.removeComments(content);

      // Parse YAML (placeholder - would use actual YAML parser)
      const config = this.parseYaml(processedContent);

      // Validate structure
      this.validateStructure(config);

      this.logger.info(`Successfully loaded YAML config: ${resolved}`);
      return config;
    } catch (error) {
      this.logger.error(`Failed to load YAML config from ${resolved}:`, error);
      throw error;
    }
  }

  /**
   * Remove YAML comments from content.
   */
  private removeComments(content: string): string {
    return content
      .split("\n")
      .map((line) => {
        // Don't remove comments inside strings
        const commentIndex = line.indexOf("#");
        if (commentIndex === -1) return line;
        
        // Check if # is inside quotes
        const beforeComment = line.substring(0, commentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;
        
        if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1) {
          return line; // Inside quotes, keep comment
        }
        
        return line.substring(0, commentIndex).trimEnd();
      })
      .join("\n");
  }

  /**
   * Parse YAML content (placeholder implementation).
   * In production, this would use a proper YAML parser.
   */
  private parseYaml(content: string): HelixConfig {
    // This is a mock implementation
    // In real code, you would use: yaml.parse(content) or js-yaml.load(content)
    try {
      // For now, try to parse as JSON if it looks like JSON
      // This is just for demonstration purposes
      return JSON.parse(content) as HelixConfig;
    } catch {
      throw new Error(
        "YAML parsing not fully implemented. Please use JSON format or install a YAML parser."
      );
    }
  }

  /**
   * Validate basic structure of the parsed config.
   */
  private validateStructure(config: unknown): void {
    if (typeof config !== "object" || config === null) {
      throw new Error("Config must be a YAML object");
    }

    if (Array.isArray(config)) {
      throw new Error("Config cannot be a YAML array, must be an object");
    }
  }

  /**
   * Check if a file path is likely a YAML file.
   */
  static isYamlFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".yaml" || ext === ".yml";
  }
}

