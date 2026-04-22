/**
 * Env + path resolution for the verify→write loop.
 *
 * Env:
 *   ANTHROPIC_API_KEY / ANTH_API_KEY   (required)
 *   CLAUDE_MODEL          default claude-opus-4-7
 *   MAX_DISPATCHES        default 30   total times the verifier calls the worker
 *   MAX_WORKER_TURNS      default 40   tool-use turns per single worker run
 *   TARGET_REWARD         default 0.85 stop once reward >= this
 *   IMPROVEMENT_DELTA     default 0.005 reward increase that counts as "got it right"
 *   MAX_TOKENS            default 32768  — large enough to hold a full-file
 *                                           rewrite without truncating the
 *                                           tool_use block (truncation causes
 *                                           400s / silently-missing fields).
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
  maxWorkerTurns: Number(process.env.MAX_WORKER_TURNS ?? 40),
  targetReward: Number(process.env.TARGET_REWARD ?? 0.85),
  improvementDelta: Number(process.env.IMPROVEMENT_DELTA ?? 0.005),
  maxTokens: Number(process.env.MAX_TOKENS ?? 32768),
};
