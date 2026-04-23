#!/usr/bin/env node
/**
 * Test-harness entrypoint.
 *
 * A tests-only sibling to mcp/loop/. The verifier drives a Playwright suite
 * to green by dispatching focused source-code changes to a Claude Code
 * worker, and after every dispatch the orchestrator re-runs ONLY the one
 * spec that was targeted.
 *
 * In addition, the harness polls the visual MCP server's `score_app` tool
 * once at baseline and once after every dispatch as a regression
 * guardrail. Each dispatch result includes `visual.reward`,
 * `visual.baseline`, and `visual.delta`, so the verifier can see — and
 * avoid — edits that fix a test but break the reference-design match.
 * Pass --no-visual to disable the guardrail.
 *
 * Usage:
 *   node mcp/test-harness/index.mjs [appUrl] [extraGuidance] [--dir=<path>] [--no-visual]
 *
 *   --dir=<path>          Playwright test target (dir or single spec file)
 *                         relative to the repo root. Defaults to TESTS_DIR
 *                         (or "tests").
 *   --no-visual           Skip the score_app visual regression guardrail.
 *
 * Env (shared with mcp/loop/config.mjs):
 *   ANTHROPIC_API_KEY / ANTH_API_KEY  (required)
 *   CLAUDE_MODEL / MAX_DISPATCHES / MAX_TOKENS / WORKER_*   — see config.mjs
 *   TESTS_DIR             default "tests"
 */

import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";

import { ensureDevServer } from "../../scripts/reward-check.mjs";
import { config, mcpDir } from "../loop/config.mjs";
import { RunLogger } from "../loop/logger.mjs";
import { connectMcp } from "../loop/mcp-client.mjs";
import { runTestHarnessLoop } from "./verifier.mjs";

function parseArgs(argv) {
  const out = {
    appUrl: null,
    extraGuidance: null,
    dir: null,
    noVisual: false,
    help: false,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--dir") out.dir = argv[++i];
    else if (a.startsWith("--dir=")) out.dir = a.slice("--dir=".length);
    else if (a === "--no-visual") out.noVisual = true;
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
    "Usage: node mcp/test-harness/index.mjs [appUrl] [extraGuidance] [--dir=<path>] [--no-visual]\n\n" +
      "  --dir=<path>   Playwright test target (dir or spec file). Default \"tests\".\n" +
      "  --no-visual    Disable the score_app visual regression guardrail.\n" +
      "                 By default the harness polls score_app once at\n" +
      "                 baseline and after every dispatch, and surfaces\n" +
      "                 visual_reward + delta on each dispatch result so\n" +
      "                 the verifier doesn't regress the reference match\n" +
      "                 while fixing tests.\n",
  );
  process.exit(0);
}

const appUrl = args.appUrl ?? "http://localhost:5173";
const testsDir = args.dir ?? process.env.TESTS_DIR ?? "tests";

// Augment the shared config with harness-specific bits so downstream code
// has a single object.
const harnessConfig = { ...config, testsDir };

const anthropic = new Anthropic({ apiKey: config.apiKey });

const logger = new RunLogger(path.join(mcpDir, "logs"));
await logger.init({ appUrl, model: config.model, config: harnessConfig });
console.log(`logs: ${logger.runDir}`);

console.log(
  `Worker: claude -p (${config.claudeCliPath})  permission_mode=${config.workerPermissionMode}  allowed_tools=${config.workerAllowedTools}` +
    (config.workerModel
      ? `  model=${config.workerModel}`
      : "  model=<claude default>"),
);
console.log(
  `\nRunning test-harness against ${appUrl}` +
    `  verifier_model=${config.model}` +
    `  max_dispatches=${config.maxDispatches}` +
    `  tests_dir=${testsDir}` +
    `\n`,
);

// Own the Vite dev server for the whole run. scripts/test-check.mjs short-
// circuits its own ensureDevServer() when the port is already open.
let devServer = { started: false, stop: async () => {} };
try {
  devServer = await ensureDevServer({ appUrl, autoStart: true });
  if (devServer.started) {
    console.log(`[dev] started Vite for ${appUrl} (harness-owned)`);
  } else {
    console.log(`[dev] reusing existing server at ${appUrl}`);
  }
} catch (err) {
  console.error(`[dev] failed to start dev server: ${err.message}`);
  process.exit(1);
}

let devStopped = false;
async function stopDev() {
  if (devStopped) return;
  devStopped = true;
  try {
    await devServer.stop();
  } catch {}
}

// Connect to the visual MCP server so the harness can poll score_app as a
// regression guardrail while fixing tests. Fully optional: --no-visual or
// an MCP failure just disables the guardrail.
let mcp = null;
if (!args.noVisual) {
  try {
    mcp = await connectMcp();
    console.log(`[mcp] connected — visual guardrail ENABLED.`);
  } catch (err) {
    console.warn(
      `[mcp] could not connect (${err.message}); visual guardrail DISABLED.`,
    );
    mcp = null;
  }
} else {
  console.log(`[mcp] --no-visual set — visual guardrail DISABLED.`);
}

async function stopMcp() {
  if (!mcp) return;
  try {
    await mcp.close();
  } catch {}
  mcp = null;
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    Promise.allSettled([stopDev(), stopMcp()]).finally(() => process.exit(130));
  });
}

let summary;
try {
  summary = await runTestHarnessLoop({
    anthropic,
    mcp,
    appUrl,
    config: harnessConfig,
    logger,
    extraGuidance: args.extraGuidance,
  });
} finally {
  await stopMcp();
  await stopDev();
}

console.log("\n──── summary ────");
console.log(`stopped: ${summary.stopReason}`);
if (summary.doneReason) {
  console.log(
    `verifier declared done: ${summary.doneReason} (success=${summary.doneSuccess})`,
  );
}
console.log(`dispatches used: ${summary.dispatchesUsed}/${config.maxDispatches}`);
console.log(`specs fixed this run: ${summary.fixedSpecs.length}`);
for (const spec of summary.fixedSpecs) console.log(`  - ${spec}`);
if (summary.finalReport) {
  const r = summary.finalReport;
  console.log(
    `final suite: ${r.passed}/${r.total} passed` +
      (r.failed ? ` (${r.failed} failed)` : "") +
      `  pass_rate=${r.pass_rate.toFixed(3)}`,
  );
}
if (summary.visual && (summary.visual.baseline || summary.visual.final)) {
  const b = summary.visual.baseline?.reward ?? null;
  const f = summary.visual.final?.reward ?? null;
  const d = summary.visual.delta;
  const fmt = (x) => (typeof x === "number" ? x.toFixed(4) : "n/a");
  const sign = typeof d === "number" && d >= 0 ? "+" : "";
  console.log(
    `visual_reward: baseline=${fmt(b)}  final=${fmt(f)}  delta=${
      typeof d === "number" ? `${sign}${d.toFixed(4)}` : "n/a"
    }`,
  );
}
if (summary.failures?.length) {
  console.log(`remaining failures:`);
  for (const f of summary.failures) {
    console.log(`  - ${f.file}  ${JSON.stringify(f.title)}`);
    if (f.error) console.log(`      ${f.error}`);
  }
}

await logger.finalize(summary);
console.log(`logs written to: ${logger.runDir}`);

const exitCode =
  summary.stopReason === "all_green_at_baseline" ||
  (summary.finalReport && summary.finalReport.failed === 0)
    ? 0
    : 1;
process.exit(exitCode);
