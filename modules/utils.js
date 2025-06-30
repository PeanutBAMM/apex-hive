// utils.js - Common utilities for Apex Hive

import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

/**
 * Execute a command and return result
 */
export async function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024, // 10MB
      ...options,
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr?.toString() || "",
      stdout: error.stdout?.toString() || "",
    };
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read JSON file safely
 */
export async function readJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON from ${filePath}: ${error.message}`);
  }
}

/**
 * Write JSON file safely
 */
export async function writeJSON(filePath, data, pretty = true) {
  try {
    const content = pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    await fs.writeFile(filePath, content, "utf8");
  } catch (error) {
    throw new Error(`Failed to write JSON to ${filePath}: ${error.message}`);
  }
}

/**
 * Get project root directory
 */
export function getProjectRoot() {
  return process.cwd();
}

/**
 * Format file size
 */
export function formatSize(bytes) {
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}
