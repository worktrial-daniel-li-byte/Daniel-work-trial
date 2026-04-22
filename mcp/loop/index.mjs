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
 *   node mcp/loop/index.mjs [appUrl] [extraGuidance] [--focus=<sub>]
 *
 *   --focus=<pqgram|ssim|text|color>
 *       Inject an operator directive telling the verifier to prioritize
 *       raising that one sub-score this run. Stacks on top of any positional
 *       extraGuidance.
 *
 * Env: see ./config.mjs for the full list.
 */

import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";

import { config, mcpDir } from "./config.mjs";
import { RunLogger } from "./logger.mjs";
import { connectMcp, partitionTools } from "./mcp-client.mjs";
import {
  buildFocusGuidance,
  FOCUS_SUB_SCORES,
} from "./prompts.mjs";
import { runVerifyLoop, dispatchTool, declareDoneTool } from "./verifier.mjs";

function parseArgs(argv) {
  const out = { appUrl: null, extraGuidance: null, focus: null, help: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--focus") out.focus = argv[++i];
    else if (a.startsWith("--focus=")) out.focus = a.slice("--focus=".length);
    else if (a.startsWith("--")) {
      console.error(`unknown flag: ${a}`);
      process.exit(2);
    } else positional.push(a);
  }
  out.appUrl = positional[0] ?? null;
  out.extraGuidance = positional[1] ?? null;
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(
    "Usage: node mcp/loop/index.mjs [appUrl] [extraGuidance] [--focus=<sub>]\n\n" +
      `  --focus   One of: ${FOCUS_SUB_SCORES.join(", ")}\n` +
      "            Tells the verifier to prioritize that sub-score this run.\n",
  );
  process.exit(0);
}
if (args.focus && !FOCUS_SUB_SCORES.includes(args.focus)) {
  console.error(
    `--focus must be one of: ${FOCUS_SUB_SCORES.join(", ")} (got '${args.focus}')`,
  );
  process.exit(2);
}
const appUrl = args.appUrl ?? "http://localhost:5173";
const extraGuidance = args.extraGuidance;
const focusGuidance = args.focus ? buildFocusGuidance(args.focus) : null;

const anthropic = new Anthropic({ apiKey: config.apiKey });
const mcp = await connectMcp();

const logger = new RunLogger(path.join(mcpDir, "logs"));
await logger.init({ appUrl, model: config.model, config });
console.log(`logs: ${logger.runDir}`);

const { tools: mcpTools } = await mcp.listTools();
const { verifierMcpTools } = partitionTools(mcpTools);

console.log("MCP tools discovered:", mcpTools.map((t) => t.name).join(", "));
console.log(
  "Verifier tools:",
  [...verifierMcpTools, dispatchTool, declareDoneTool]
    .map((t) => t.name)
    .join(", "),
);
console.log(
  `Worker: claude -p (${config.claudeCliPath})  permission_mode=${config.workerPermissionMode}  allowed_tools=${config.workerAllowedTools}` +
    (config.workerModel ? `  model=${config.workerModel}` : "  model=<claude default>"),
);
console.log(
  `\nRunning against ${appUrl}` +
    `  verifier_model=${config.model}  max_dispatches=${config.maxDispatches}` +
    `  target_reward=${config.targetReward}` +
    `  improvement_delta=${config.improvementDelta}` +
    (args.focus ? `  focus=${args.focus}` : "") +
    `\n`,
);

const summary = await runVerifyLoop({
  anthropic,
  mcp,
  appUrl,
  extraGuidance,
  focusGuidance,
  verifierMcpTools,
  config,
  logger,
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

await logger.finalize(summary);
console.log(`logs written to: ${logger.runDir}`);

await mcp.close();
