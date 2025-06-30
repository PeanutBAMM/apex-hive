// git-ops.js - Git operations module

import { exec } from "./utils.js";
import { logger } from "./logger.js";
import path from "path";

export class GitOps {
  constructor() {
    this.logger = logger.child("Git");
  }

  /**
   * Get current git status
   */
  async status() {
    const result = await exec("git status --porcelain");

    if (!result.success) {
      throw new Error(`Git status failed: ${result.error}`);
    }

    const files = result.output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [status, ...fileParts] = line.trim().split(" ");
        return {
          status: status.trim(),
          file: fileParts.join(" "),
        };
      });

    return {
      clean: files.length === 0,
      files,
      branch: await this.currentBranch(),
    };
  }

  /**
   * Get current branch
   */
  async currentBranch() {
    const result = await exec("git branch --show-current");
    return result.success ? result.output.trim() : "unknown";
  }

  /**
   * Add files to staging
   */
  async add(files = ".") {
    const fileList = Array.isArray(files) ? files.join(" ") : files;
    const result = await exec(`git add ${fileList}`);

    if (!result.success) {
      throw new Error(`Git add failed: ${result.error}`);
    }

    return true;
  }

  /**
   * Commit with message
   */
  async commit(message, options = {}) {
    const args = ["commit", "-m", `"${message}"`];

    if (options.amend) {
      args.push("--amend");
    }

    if (options.noVerify) {
      args.push("--no-verify");
    }

    const result = await exec(`git ${args.join(" ")}`);

    if (!result.success) {
      throw new Error(`Git commit failed: ${result.error}`);
    }

    return result.output;
  }

  /**
   * Push to remote
   */
  async push(options = {}) {
    const args = ["push"];

    if (options.force) {
      args.push("--force");
    }

    if (options.upstream) {
      args.push("--set-upstream", "origin", await this.currentBranch());
    }

    if (options.tags) {
      args.push("--tags");
    }

    const result = await exec(`git ${args.join(" ")}`);

    if (!result.success) {
      throw new Error(`Git push failed: ${result.error}`);
    }

    return result.output;
  }

  /**
   * Pull from remote
   */
  async pull(options = {}) {
    const args = ["pull"];

    if (options.rebase) {
      args.push("--rebase");
    }

    const result = await exec(`git ${args.join(" ")}`);

    if (!result.success) {
      throw new Error(`Git pull failed: ${result.error}`);
    }

    return result.output;
  }

  /**
   * Get recent commits
   */
  async log(limit = 10) {
    const result = await exec(`git log --oneline -${limit}`);

    if (!result.success) {
      return [];
    }

    return result.output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, ...messageParts] = line.split(" ");
        return {
          hash: hash.trim(),
          message: messageParts.join(" "),
        };
      });
  }

  /**
   * Check if repository is clean
   */
  async isClean() {
    const status = await this.status();
    return status.clean;
  }

  /**
   * Get diff
   */
  async diff(options = {}) {
    const args = ["diff"];

    if (options.staged) {
      args.push("--staged");
    }

    if (options.nameOnly) {
      args.push("--name-only");
    }

    const result = await exec(`git ${args.join(" ")}`);

    return result.success ? result.output : "";
  }

  /**
   * Create tag
   */
  async tag(name, message) {
    const args = ["tag"];

    if (message) {
      args.push("-a", name, "-m", `"${message}"`);
    } else {
      args.push(name);
    }

    const result = await exec(`git ${args.join(" ")}`);

    if (!result.success) {
      throw new Error(`Git tag failed: ${result.error}`);
    }

    return true;
  }
}

// Singleton instance
export const gitOps = new GitOps();
