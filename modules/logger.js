// logger.js - Smart logging for Apex Hive

const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const COLORS = {
  DEBUG: "\x1b[36m", // Cyan
  INFO: "\x1b[32m", // Green
  WARN: "\x1b[33m", // Yellow
  ERROR: "\x1b[31m", // Red
  RESET: "\x1b[0m",
};

const ICONS = {
  DEBUG: "🔍",
  INFO: "✅",
  WARN: "⚠️",
  ERROR: "❌",
};

export class Logger {
  constructor(name = "Apex", level = "INFO") {
    this.name = name;
    this.level = LEVELS[level] || LEVELS.INFO;
  }

  log(level, message, data = null) {
    if (LEVELS[level] < this.level) return;

    const timestamp = new Date().toISOString();
    const color = COLORS[level];
    const icon = ICONS[level];
    const reset = COLORS.RESET;

    // Format message
    let output = `${color}[${timestamp}] ${icon} ${this.name} ${level}: ${message}${reset}`;

    // Add data if provided
    if (data) {
      if (typeof data === "object") {
        output += "\n" + JSON.stringify(data, null, 2);
      } else {
        output += " " + data;
      }
    }

    // Always log to stderr to avoid stdout pollution
    console.error(output);
  }

  debug(message, data) {
    this.log("DEBUG", message, data);
  }

  info(message, data) {
    this.log("INFO", message, data);
  }

  warn(message, data) {
    this.log("WARN", message, data);
  }

  error(message, data) {
    this.log("ERROR", message, data);
  }

  // Create a child logger with a new name
  child(name) {
    return new Logger(`${this.name}:${name}`, Object.keys(LEVELS)[this.level]);
  }
}

// Default logger instance
export const logger = new Logger("Apex", process.env.LOG_LEVEL || "INFO");
