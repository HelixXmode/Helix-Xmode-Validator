type Level = "debug" | "info" | "warn" | "error";

const levelOrder: Level[] = ["debug", "info", "warn", "error"];

export interface LoggerOptions {
  level?: Level;
  prefix?: string;
  enableColors?: boolean;
}

const colors = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m",  // green
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m", // red
  reset: "\x1b[0m"
};

export class Logger {
  private level: Level;
  private prefix: string;
  private enableColors: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.prefix = options.prefix ?? "HelixValidator";
    this.enableColors = options.enableColors ?? (typeof process !== "undefined" && process.stdout?.isTTY);
  }

  debug(message: string, ...args: unknown[]) {
    this.write("debug", message, args);
  }

  info(message: string, ...args: unknown[]) {
    this.write("info", message, args);
  }

  warn(message: string, ...args: unknown[]) {
    this.write("warn", message, args);
  }

  error(message: string, ...args: unknown[]) {
    this.write("error", message, args);
  }

  setLevel(level: Level): void {
    this.level = level;
  }

  private write(level: Level, message: string, args: unknown[] = []) {
    // Early exit optimization: check log level before any processing
    if (levelOrder.indexOf(level) < levelOrder.indexOf(this.level)) return;
    
    const ts = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    const prefixStr = this.prefix ? `[${this.prefix}]` : "";
    
    // Optimize: avoid string operations if no args
    let formattedMessage = message;
    if (args.length > 0) {
      try {
        // Optimize: use array join instead of repeated concatenation
        const argStrings = args.map(arg => 
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        );
        formattedMessage = `${message} ${argStrings.join(" ")}`;
      } catch {
        formattedMessage = `${message} ${args.join(" ")}`;
      }
    }

    const logLine = `[${ts}] ${prefixStr} [${levelStr}] ${formattedMessage}`;
    
    // Optimize: single console.log call
    if (this.enableColors && colors[level]) {
      // eslint-disable-next-line no-console
      console.log(`${colors[level]}${logLine}${colors.reset}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(logLine);
    }
  }
}

