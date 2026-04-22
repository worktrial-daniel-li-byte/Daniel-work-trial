#!/usr/bin/env node
/**
 * One-shot Claude agent that connects to the reward MCP server and runs a
 * short tool-use loop — Claude can call any of the server's tools (score_app,
 * read_file, write_file, list_dir, etc.) up to CLAUDE_MAX_TURNS times.
 *
 * Usage:
 *   node mcp/agent/index.mjs "http://localhost:5173" [extra instruction] [--focus=<sub>]
 *
 *   --focus=<pqgram|ssim|text|color>
 *       Prepends an operator directive asking the agent to prioritize raising
 *       that sub-score.
 *
 * Env:
 *   ANTHROPIC_API_KEY / ANTH_API_KEY
 *   CLAUDE_MODEL       default claude-opus-4-7
 *   CLAUDE_MAX_TURNS   default 8
 */

import Anthropic from "@anthropic-ai/sdk";

import { config } from "../loop/config.mjs";
import { connectMcp, callMcp, toAnthropicTool } from "../loop/mcp-client.mjs";
import { buildFocusGuidance, FOCUS_SUB_SCORES } from "../loop/prompts.mjs";

function parseArgs(argv) {
  const out = { appUrl: null, extraInstruction: null, focus: null };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--focus") out.focus = argv[++i];
    else if (a.startsWith("--focus=")) out.focus = a.slice("--focus=".length);
    else if (a.startsWith("--")) {
      console.error(`unknown flag: ${a}`);
      process.exit(2);
    } else positional.push(a);
  }
  out.appUrl = positional[0] ?? null;
  out.extraInstruction = positional[1] ?? null;
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.appUrl) {
  console.error(
    'Usage: node mcp/agent/index.mjs "http://localhost:5173" [extra instruction] [--focus=<sub>]',
  );
  process.exit(1);
}
if (args.focus && !FOCUS_SUB_SCORES.includes(args.focus)) {
  console.error(
    `--focus must be one of: ${FOCUS_SUB_SCORES.join(", ")} (got '${args.focus}')`,
  );
  process.exit(2);
}
const appUrl = args.appUrl;
const extraInstruction = args.extraInstruction;
const focusGuidance = args.focus ? buildFocusGuidance(args.focus) : null;

const maxTurns = Number(process.env.CLAUDE_MAX_TURNS ?? 8);

const anthropic = new Anthropic({ apiKey: config.apiKey });
const mcp = await connectMcp({ name: "claude-reward-agent", version: "0.1.0" });

const { tools: mcpTools } = await mcp.listTools();
const claudeTools = mcpTools.map(toAnthropicTool);

console.log("Connected to MCP server. Tools exposed to Claude:");
for (const t of claudeTools) console.log(`  - ${t.name}: ${t.description}`);
console.log();

const systemPrompt = [
  "You are an agent that evaluates how closely a running web app matches a reference design.",
  "Use the tools provided to score the app. score_app returns a reward in [-1, 1] plus a breakdown",
  "of four sub-scores:",
  "  - ssim:   visual similarity of the screenshots",
  "  - text:   visible-text match (document.body.innerText only)",
  "  - color:  palette histogram match",
  "  - pqgram: DOM structure match — Augsten pq-grams over (tag + data-testid)",
  "            labels. Reports a per-region breakdown. A region scoring 0 means",
  "            the reference has that [data-testid] anchor and yours is missing.",
  "            To raise pqgram, emit the reference's data-testid values verbatim",
  "            on the matching tag, and mirror its wrapper-div nesting.",
  "Higher reward is better.",
  "",
  "Workflow:",
  "  1. Optionally call get_reward_config once to understand the scoring and see",
  "     the list of pqgram region anchors.",
  `  2. Call score_app with app_url="${appUrl}".`,
  "  3. Interpret the result for the user: summarize the reward, each sub-score,",
  "     and suggest concrete improvements. For pqgram specifically, call out any",
  "     region scoring 0 and name the missing data-testid anchor.",
  "",
  "Return a clear final message with the numeric reward and your diagnosis.",
].join("\n");

const userMessage =
  `Please score the app running at ${appUrl} against the reference design.` +
  (focusGuidance ? `\n\n${focusGuidance}` : "") +
  (extraInstruction ? `\n\nAdditional instruction: ${extraInstruction}` : "");

const messages = [{ role: "user", content: userMessage }];

for (let turn = 0; turn < maxTurns; turn++) {
  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: 2048,
    system: systemPrompt,
    tools: claudeTools,
    messages,
  });
  messages.push({ role: "assistant", content: response.content });

  const toolUses = response.content.filter((b) => b.type === "tool_use");
  const textBlocks = response.content.filter((b) => b.type === "text");

  for (const tb of textBlocks) {
    if (tb.text?.trim()) console.log(`[claude] ${tb.text.trim()}\n`);
  }
  if (response.stop_reason !== "tool_use" || toolUses.length === 0) break;

  const toolResults = [];
  for (const tu of toolUses) {
    console.log(`[tool] → ${tu.name}(${JSON.stringify(tu.input)})`);
    const { blocks, isError } = await callMcp(mcp, tu.name, tu.input);
    const firstText = blocks.find((b) => b.type === "text");
    const preview = (firstText?.text ?? "").slice(0, 500);
    console.log(`[tool] ← ${preview}\n`);
    toolResults.push({
      type: "tool_result",
      tool_use_id: tu.id,
      content: blocks,
      is_error: isError,
    });
  }
  messages.push({ role: "user", content: toolResults });
}

await mcp.close();
