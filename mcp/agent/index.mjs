#!/usr/bin/env node
/**
 * One-shot Claude agent that connects to the reward MCP server and runs a
 * short tool-use loop — Claude can call any of the server's tools (score_app,
 * read_file, write_file, list_dir, etc.) up to CLAUDE_MAX_TURNS times.
 *
 * Usage:
 *   node mcp/agent/index.mjs "http://localhost:5173" ["extra instruction"]
 *
 * Env:
 *   ANTHROPIC_API_KEY / ANTH_API_KEY
 *   CLAUDE_MODEL       default claude-opus-4-7
 *   CLAUDE_MAX_TURNS   default 8
 */

import Anthropic from "@anthropic-ai/sdk";

import { config } from "../loop/config.mjs";
import { connectMcp, callMcp, toAnthropicTool } from "../loop/mcp-client.mjs";

const [, , appUrl, extraInstruction] = process.argv;
if (!appUrl) {
  console.error(
    'Usage: node mcp/agent/index.mjs "http://localhost:5173" [extra instruction]',
  );
  process.exit(1);
}

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
  "of SSIM, text-similarity, and color-palette similarity. Higher is better.",
  "",
  "Workflow:",
  "  1. Optionally call get_reward_config once to understand the scoring.",
  `  2. Call score_app with app_url="${appUrl}".`,
  "  3. Interpret the result for the user: summarize the reward, each sub-score,",
  "     and suggest concrete improvements (layout, missing text, wrong colors, etc).",
  "",
  "Return a clear final message with the numeric reward and your diagnosis.",
].join("\n");

const userMessage =
  `Please score the app running at ${appUrl} against the reference design.` +
  (extraInstruction ? `\nAdditional instruction: ${extraInstruction}` : "");

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
