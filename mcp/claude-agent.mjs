#!/usr/bin/env node
/**
 * Claude agent that connects to the reward MCP server over stdio and lets
 * Claude call the reward function in a tool-use loop.
 *
 * Usage:
 *   node mcp/claude-agent.mjs "http://localhost:5173" \
 *     ["Optional extra instruction for the model"]
 *
 * Env:
 *   ANTHROPIC_API_KEY  (or ANTH_API_KEY — we fall back to it)
 *   CLAUDE_MODEL       (default: claude-sonnet-4-5)
 *   CLAUDE_MAX_TURNS   (default: 8)
 *
 * This script:
 *   1. Spawns ./reward-mcp-server.mjs as a stdio MCP subprocess.
 *   2. Lists its tools via the MCP client and converts them to Anthropic tool
 *      definitions.
 *   3. Runs a tool-use loop — Claude can call score_app / get_reward_config
 *      as many times as it wants, up to CLAUDE_MAX_TURNS.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

loadDotenv({ path: path.join(repoRoot, ".env") });

const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.ANTH_API_KEY;
if (!apiKey) {
  console.error(
    "Missing ANTHROPIC_API_KEY (or ANTH_API_KEY) in environment / .env",
  );
  process.exit(1);
}

const model = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5";
const maxTurns = Number(process.env.CLAUDE_MAX_TURNS ?? 8);

const [, , appUrl, extraInstruction] = process.argv;
if (!appUrl) {
  console.error(
    'Usage: node mcp/claude-agent.mjs "http://localhost:5173" [extra instruction]',
  );
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(__dirname, "reward-mcp-server.mjs")],
  cwd: repoRoot,
  stderr: "inherit",
});

const mcp = new Client(
  { name: "claude-reward-agent", version: "0.1.0" },
  { capabilities: {} },
);

await mcp.connect(transport);

const { tools: mcpTools } = await mcp.listTools();
const claudeTools = mcpTools.map((t) => ({
  name: t.name,
  description: t.description ?? "",
  input_schema: t.inputSchema ?? { type: "object", properties: {} },
}));

console.log(`Connected to MCP server. Tools exposed to Claude:`);
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

const userMessage = [
  `Please score the app running at ${appUrl} against the reference design.`,
  extraInstruction ? `\nAdditional instruction: ${extraInstruction}` : "",
].join("");

const messages = [{ role: "user", content: userMessage }];

async function callMcpTool(name, input) {
  const res = await mcp.callTool({ name, arguments: input ?? {} });
  const text = (res.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
  return { text: text || JSON.stringify(res), isError: res.isError === true };
}

for (let turn = 0; turn < maxTurns; turn++) {
  const response = await anthropic.messages.create({
    model,
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

  if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
    break;
  }

  const toolResults = [];
  for (const tu of toolUses) {
    console.log(`[tool] → ${tu.name}(${JSON.stringify(tu.input)})`);
    const { text, isError } = await callMcpTool(tu.name, tu.input);
    console.log(`[tool] ← ${text.length > 500 ? text.slice(0, 500) + "…" : text}\n`);
    toolResults.push({
      type: "tool_result",
      tool_use_id: tu.id,
      content: text,
      is_error: isError,
    });
  }

  messages.push({ role: "user", content: toolResults });
}

await mcp.close();
