#!/usr/bin/env node
/**
 * Two-agent verify→write loop entrypoint.
 *
 *   Verifier  (vision + planning; tools: score_app, get_reward_config,
 *              dispatch_to_worker, declare_done) — looks at reference vs app
 *              screenshots and dispatches one focused change at a time.
 *
 *   Worker    (execution; tools: read_file, write_file, list_dir) — receives
 *              one task, makes the edits, reports back.
 *
 *   Orchestrator (this file, via ./verifier.mjs):
 *     - On dispatch: runs the worker, re-scores the app.
 *     - Improved  → clears worker context (next dispatch starts fresh).
 *     - Not improved → preserves worker context (next dispatch resumes).
 *
 * Usage:
 *   node mcp/loop/index.mjs ["http://localhost:5173"] ["optional extra guidance"]
 *
 * Env: see ./config.mjs for the full list.
 */

import Anthropic from "@anthropic-ai/sdk";

import { config } from "./config.mjs";
import { connectMcp, partitionTools } from "./mcp-client.mjs";
import { runVerifyLoop, dispatchTool, declareDoneTool } from "./verifier.mjs";

const [, , appUrlArg, extraGuidance] = process.argv;
const appUrl = appUrlArg ?? "http://localhost:5173";

const anthropic = new Anthropic({ apiKey: config.apiKey });
const mcp = await connectMcp();

const { tools: mcpTools } = await mcp.listTools();
const { verifierMcpTools, workerTools } = partitionTools(mcpTools);

console.log("MCP tools discovered:", mcpTools.map((t) => t.name).join(", "));
console.log(
  "Verifier tools:",
  [...verifierMcpTools, dispatchTool, declareDoneTool]
    .map((t) => t.name)
    .join(", "),
);
console.log("Worker tools:", workerTools.map((t) => t.name).join(", "));
console.log(
  `\nRunning against ${appUrl}` +
    `  model=${config.model}  max_dispatches=${config.maxDispatches}` +
    `  target_reward=${config.targetReward}` +
    `  improvement_delta=${config.improvementDelta}\n`,
);

const summary = await runVerifyLoop({
  anthropic,
  mcp,
  appUrl,
  extraGuidance,
  verifierMcpTools,
  workerTools,
  config,
});

console.log("\n──── summary ────");
console.log(`stopped: ${summary.stopReason}`);
if (summary.doneReason) {
  console.log(
    `verifier declared done: ${summary.doneReason} (success=${summary.doneSuccess})`,
  );
}
console.log(
  `dispatches used: ${summary.dispatchesUsed}/${config.maxDispatches}`,
);
console.log(
  `last reward: ${summary.lastReward !== null ? summary.lastReward.toFixed(4) : "n/a"}`,
);
console.log(
  `best reward: ${Number.isFinite(summary.bestReward) ? summary.bestReward.toFixed(4) : "n/a"}`,
);

await mcp.close();
