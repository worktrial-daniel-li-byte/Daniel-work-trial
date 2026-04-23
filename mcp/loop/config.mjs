/**
 * Env + path resolution for the visual verify→write loop.
 *
 * Env:
 *   ANTHROPIC_API_KEY / ANTH_API_KEY   (required — mirrored into the worker's env)
 *   CLAUDE_MODEL          default claude-opus-4-7   (verifier model, Anthropic SDK)
 *   MAX_DISPATCHES        default 30   total times the verifier calls the worker
 *   TARGET_REWARD         default 0.85 stop once reward >= this
 *   IMPROVEMENT_DELTA     default 0.005 reward increase that counts as "got it right"
 *   MAX_TOKENS            default 32768  verifier max_tokens per Anthropic request
 *
 *   WORKER_CLI_PATH          default "claude"   path to the Claude Code CLI
 *   WORKER_MODEL             default unset      passed to `claude --model` if set
 *   WORKER_ALLOWED_TOOLS     default "Read,Edit,Write,MultiEdit,Bash,Grep,Glob"
 *   WORKER_PERMISSION_MODE   default "acceptEdits"
 *   WORKER_TIMEOUT_MS        default 0 (no timeout) — kill the subprocess after N ms
 *
 * For the Playwright-driven loop, see mcp/test-harness/.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loopDir = __dirname;
export const mcpDir = path.resolve(__dirname, "..");
export const repoRoot = path.resolve(__dirname, "..", "..");
export const serverEntry = path.join(mcpDir, "server", "index.mjs");

loadDotenv({ path: path.join(repoRoot, ".env") });

const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.ANTH_API_KEY;
if (!apiKey) {
  console.error("Missing ANTHROPIC_API_KEY (or ANTH_API_KEY).");
  process.exit(1);
}

export const config = {
  apiKey,
  model: process.env.CLAUDE_MODEL ?? "claude-opus-4-7",
  maxDispatches: Number(process.env.MAX_DISPATCHES ?? 30),
  targetReward: Number(process.env.TARGET_REWARD ?? 0.85),
  improvementDelta: Number(process.env.IMPROVEMENT_DELTA ?? 0.005),
  maxTokens: Number(process.env.MAX_TOKENS ?? 32768),
  claudeCliPath: process.env.WORKER_CLI_PATH ?? "claude",
  workerModel: process.env.WORKER_MODEL || null,
  workerAllowedTools:
    process.env.WORKER_ALLOWED_TOOLS ??
    "Read,Edit,Write,MultiEdit,Bash,Grep,Glob",
  workerPermissionMode: process.env.WORKER_PERMISSION_MODE ?? "acceptEdits",
  workerTimeoutMs: Number(process.env.WORKER_TIMEOUT_MS ?? 0) || null,
};
