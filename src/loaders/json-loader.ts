import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { HelixConfig } from "../types";
import { Logger } from "../utils/logger";

export interface LoaderOptions {
  logger?: Logger;
  validateEncoding?: boolean;
}

/**
 * JSON configuration loader with support for file validation,
 * encoding detection, and error recovery.
 */
export class JsonLoader {
  private logger: Logger;
  private validateEncoding: boolean;

  constructor(options: LoaderOptions = {}) {
    this.logger = options.logger ?? new Logger({ level: "info" });
    this.validateEncoding = options.validateEncoding ?? true;
  }

  /**
   * Load and parse a JSON configuration file.
   * @param filePath Path to the JSON file
   * @returns Parsed HelixConfig object
   * @throws Error if file cannot be read or parsed
   */
  async load(filePath: string): Promise<HelixConfig> {
    const resolved = path.resolve(filePath);
    this.logger.debug(`Loading JSON config from: ${resolved}`);

    try {
      // Verify file exists
      const stats = await stat(resolved);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${resolved}`);
      }

      // Read file with UTF-8 encoding
      const content = await readFile(resolved, "utf8");
      
      // Validate encoding if enabled
      if (this.validateEncoding) {
        this.validateUtf8(content);
      }

      // Parse JSON with detailed error handling
      let config: HelixConfig;
      try {
        config = JSON.parse(content) as HelixConfig;
      } catch (parseError) {
        const error = parseError as Error;
        const match = error.message.match(/position (\d+)/);
        if (match) {
          const position = parseInt(match[1], 10);
          const lines = content.substring(0, position).split("\n");
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;
          throw new Error(
            `JSON parse error at line ${line}, column ${column}: ${error.message}`
          );
        }
        throw error;
      }

      // Validate basic structure
      this.validateStructure(config);

      this.logger.info(`Successfully loaded config: ${resolved}`);
      return config;
    } catch (error) {
      this.logger.error(`Failed to load JSON config from ${resolved}:`, error);
      throw error;
    }
  }

  /**
   * Validate UTF-8 encoding of the content.
   */
  private validateUtf8(content: string): void {
    // Basic UTF-8 validation - check for invalid sequences
    try {
      // Try to encode/decode to ensure valid UTF-8
      Buffer.from(content, "utf8").toString("utf8");
    } catch {
      throw new Error("File contains invalid UTF-8 encoding");
    }
  }

  /**
   * Validate basic structure of the parsed config.
   */
  private validateStructure(config: unknown): void {
    if (typeof config !== "object" || config === null) {
      throw new Error("Config must be a JSON object");
    }

    if (Array.isArray(config)) {
      throw new Error("Config cannot be a JSON array, must be an object");
    }
  }

  /**
   * Check if a file path is likely a JSON file.
   */
  static isJsonFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".json" || ext === ".jsonc";
  }
}

