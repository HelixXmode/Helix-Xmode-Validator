import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { Logger } from "./logger";

/**
 * Configuration file resolver with support for multiple file formats
 * and automatic format detection.
 */
export class ConfigResolver {
  private logger: Logger;
  private searchPaths: string[];

  constructor(logger?: Logger) {
    this.logger = logger ?? new Logger({ level: "info" });
    this.searchPaths = [];
  }

  /**
   * Add a search path for configuration files.
   */
  addSearchPath(searchPath: string): void {
    this.searchPaths.push(searchPath);
    this.logger.debug(`Added search path: ${searchPath}`);
  }

  /**
   * Resolve configuration file path with fallback options.
   */
  resolve(filePath: string): string | null {
    // If absolute path, check directly
    if (path.isAbsolute(filePath)) {
      if (this.fileExists(filePath)) {
        return filePath;
      }
      return null;
    }

    // Check in current directory
    if (this.fileExists(filePath)) {
      return path.resolve(filePath);
    }

    // Check in search paths
    for (const searchPath of this.searchPaths) {
      const fullPath = path.join(searchPath, filePath);
      if (this.fileExists(fullPath)) {
        this.logger.debug(`Resolved config from search path: ${fullPath}`);
        return path.resolve(fullPath);
      }
    }

    // Try with common extensions
    const extensions = [".json", ".yaml", ".yml", ".jsonc"];
    for (const ext of extensions) {
      const withExt = filePath.endsWith(ext) ? filePath : `${filePath}${ext}`;
      
      if (this.fileExists(withExt)) {
        return path.resolve(withExt);
      }

      for (const searchPath of this.searchPaths) {
        const fullPath = path.join(searchPath, withExt);
        if (this.fileExists(fullPath)) {
          return path.resolve(fullPath);
        }
      }
    }

    this.logger.warn(`Could not resolve configuration file: ${filePath}`);
    return null;
  }

  /**
   * Check if file exists and is readable.
   */
  private fileExists(filePath: string): boolean {
    try {
      if (!existsSync(filePath)) {
        return false;
      }

      const stats = statSync(filePath);
      return stats.isFile() && stats.size > 0;
    } catch {
      return false;
    }
  }

  /**
   * Detect file format from extension or content.
   */
  static detectFormat(filePath: string): "json" | "yaml" | "unknown" {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === ".json" || ext === ".jsonc") {
      return "json";
    }
    
    if (ext === ".yaml" || ext === ".yml") {
      return "yaml";
    }

    return "unknown";
  }

  /**
   * Get all possible paths for a configuration file.
   */
  getAllPossiblePaths(baseName: string): string[] {
    const paths: string[] = [];
    const extensions = ["", ".json", ".yaml", ".yml", ".jsonc"];

    // Current directory
    for (const ext of extensions) {
      paths.push(path.resolve(`${baseName}${ext}`));
    }

    // Search paths
    for (const searchPath of this.searchPaths) {
      for (const ext of extensions) {
        paths.push(path.join(searchPath, `${baseName}${ext}`));
      }
    }

    return paths;
  }
}

