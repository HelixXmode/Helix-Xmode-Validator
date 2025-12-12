type Level = "debug" | "info" | "warn" | "error";

const levelOrder: Level[] = ["debug", "info", "warn", "error"];

export interface LoggerOptions {
  level?: Level;
}

export class Logger {
  private level: Level;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
  }

  debug(message: string) {
    this.write("debug", message);
  }

  info(message: string) {
    this.write("info", message);
  }

  warn(message: string) {
    this.write("warn", message);
  }

  error(message: string) {
    this.write("error", message);
  }

  private write(level: Level, message: string) {
    if (levelOrder.indexOf(level) < levelOrder.indexOf(this.level)) return;
    const ts = new Date().toISOString();
    // Minimal formatting to look production-ready.
    // eslint-disable-next-line no-console
    console.log(`[${ts}] [${level.toUpperCase()}] ${message}`);
  }
}

