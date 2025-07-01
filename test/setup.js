import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const TEST_CACHE_DIR = join(__dirname, "../.test-cache");

// Set test cache directory
process.env.APEX_CACHE_DIR = TEST_CACHE_DIR;

export async function setupTestCache() {
  // Create test cache directory
  await fs.mkdir(TEST_CACHE_DIR, { recursive: true });
}

export async function cleanupTestCache() {
  // Remove test cache directory
  if (existsSync(TEST_CACHE_DIR)) {
    await fs.rm(TEST_CACHE_DIR, { recursive: true, force: true });
  }
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateTestData(size = 100) {
  return "x".repeat(size);
}

// Mock console for testing
export function mockConsole() {
  const originalConsole = { ...console };
  const logs = [];

  console.log = (...args) => logs.push(["log", ...args]);
  console.error = (...args) => logs.push(["error", ...args]);

  return {
    logs,
    restore: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
    },
  };
}
