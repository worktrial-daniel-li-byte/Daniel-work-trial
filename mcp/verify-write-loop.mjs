#!/usr/bin/env node
/**
 * Verify → write loop.
 *
 * Each iteration, Claude:
 *   1. Calls score_app  → sees the reference and current screenshots + sub-scores.
 *   2. Reads relevant source files (read_file / list_dir).
 *   3. Rewrites files (write_file) to close the visual gap.
 *   4. Calls score_app again to verify the delta.
 *
 * Stop when the reward ≥ TARGET_REWARD, or when MAX_ITERATIONS is hit, or when
 * Claude ends a turn without using any tools.
 *
 * Usage:
 *   node mcp/verify-write-loop.mjs ["http://localhost:5173"] \
 *     ["optional extra guidance"]
 *
 * Env:
 *   ANTHROPIC_API_KEY / ANTH_API_KEY (required)
 *   CLAUDE_MODEL       (default: claude-sonnet-4-5)
 *   MAX_ITERATIONS     (default: 10)       total assistant turns
 *   TARGET_REWARD      (default: 0.6)      stop once reward >= this
 *   MAX_TOKENS         (default: 4096)
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
  console.error("Missing ANTHROPIC_API_KEY (or ANTH_API_KEY).");
  process.exit(1);
}

const model = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5";
const maxIterations = Number(process.env.MAX_ITERATIONS ?? 10);
const targetReward = Number(process.env.TARGET_REWARD ?? 0.6);
const maxTokens = Number(process.env.MAX_TOKENS ?? 4096);

const [, , appUrlArg, extraGuidance] = process.argv;
const appUrl = appUrlArg ?? "http://localhost:5173";

const anthropic = new Anthropic({ apiKey });

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(__dirname, "reward-mcp-server.mjs")],
  cwd: repoRoot,
  stderr: "inherit",
});

const mcp = new Client(
  { name: "verify-write-loop", version: "0.1.0" },
  { capabilities: {} },
);
await mcp.connect(transport);

const { tools: mcpTools } = await mcp.listTools();
const claudeTools = mcpTools.map((t) => ({
  name: t.name,
  description: t.description ?? "",
  input_schema: t.inputSchema ?? { type: "object", properties: {} },
}));

console.log("MCP tools exposed to Claude:");
for (const t of claudeTools) console.log(`  - ${t.name}`);
console.log(
  `\nRunning verify→write loop against ${appUrl}\n` +
    `  model=${model}  max_iterations=${maxIterations}  target_reward=${targetReward}\n`,
);

const systemPrompt = `
You are a verify→write agent. The repo at the project root contains a React +
Vite app under src/ that should visually match the reference design rendered
from reference_app/html/reference.html. Your job is to iteratively edit src/
files so the running app at ${appUrl} matches the reference.

Tools available (MCP):
  - score_app({ app_url, ... })   Runs the reward function, returns reward in
                                  [-1, 1] plus SSIM / text / color sub-scores,
                                  AND attaches both screenshots as images so you
                                  can see them side by side.
  - get_reward_config()           Viewport, weights, write allowlist.
  - list_dir({ path })            List a directory inside the repo.
  - read_file({ path })           Read a file.
  - write_file({ path, contents }) Overwrite/create a file. Writes are only
                                  allowed inside src/, public/, prompts/,
                                  reward-artifacts/.

Loop strategy (follow this):
  1. Call score_app once to see the baseline reward and both screenshots.
  2. Compare them visually. Which sub-score is lowest? (ssim=layout/visual,
     text=copy/labels, color=palette.)
  3. Identify the minimal set of files to change. Start with src/App.tsx and
     src/index.css; explore src/ further with list_dir/read_file as needed.
  4. Make a concrete, targeted edit with write_file. Only overwrite a file
     when you have the full new contents ready — write_file overwrites entirely.
  5. Call score_app again to verify the delta. Vite HMR picks up src/ changes
     without a rebuild.
  6. Repeat. Stop calling tools once reward ≥ ${targetReward} or when you are
     confident no further improvement is reachable this turn.

Be efficient: do not read files you don't plan to change, and do not rewrite
files unchanged. Keep your text responses short — one or two sentences naming
the hypothesis you're testing — before each tool call batch.
`.trim();

const firstUserMessage = [
  `Start the loop. Score the app at ${appUrl}, inspect the diff, and improve it.`,
  `Target reward: ${targetReward}. Iteration budget: ${maxIterations} turns.`,
  extraGuidance ? `\nExtra guidance from the operator: ${extraGuidance}` : "",
].join("\n");

const messages = [{ role: "user", content: firstUserMessage }];

async function callMcpTool(name, input) {
  const res = await mcp.callTool({ name, arguments: input ?? {} });
  const blocks = res.content ?? [];
  const contentForClaude = blocks.map((b) => {
    if (b.type === "image") {
      return {
        type: "image",
        source: { type: "base64", media_type: b.mimeType, data: b.data },
      };
    }
    return { type: "text", text: b.text ?? JSON.stringify(b) };
  });
  return {
    contentForClaude,
    isError: res.isError === true,
    structured: res.structuredContent,
  };
}

function extractReward(struct) {
  if (struct && typeof struct.reward === "number") return struct.reward;
  return null;
}

let bestReward = -Infinity;
let lastReward = null;
let stoppedReason = "max_iterations";

for (let turn = 0; turn < maxIterations; turn++) {
  console.log(`\n──── turn ${turn + 1}/${maxIterations} ────`);

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    tools: claudeTools,
    messages,
  });
  messages.push({ role: "assistant", content: response.content });

  for (const b of response.content) {
    if (b.type === "text" && b.text?.trim()) {
      console.log(`[claude] ${b.text.trim()}`);
    }
  }

  const toolUses = response.content.filter((b) => b.type === "tool_use");
  if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
    stoppedReason = "claude_done";
    break;
  }

  const toolResults = [];
  for (const tu of toolUses) {
    const previewInput = JSON.stringify(tu.input);
    console.log(
      `[tool →] ${tu.name}(${previewInput.length > 200 ? previewInput.slice(0, 200) + "…" : previewInput})`,
    );
    const { contentForClaude, isError, structured } = await callMcpTool(
      tu.name,
      tu.input,
    );

    if (tu.name === "score_app" && !isError) {
      const r = extractReward(structured);
      if (r !== null) {
        lastReward = r;
        if (r > bestReward) bestReward = r;
        const d = structured.details ?? {};
        console.log(
          `[tool ←] reward=${r.toFixed(4)}  ssim=${(d.ssim ?? 0).toFixed(3)}  text=${(d.text ?? 0).toFixed(3)}  color=${(d.color ?? 0).toFixed(3)}`,
        );
      }
    } else {
      const firstText = contentForClaude.find((c) => c.type === "text");
      const preview = (firstText?.text ?? "").slice(0, 200);
      console.log(`[tool ←] ${isError ? "ERROR " : ""}${preview}`);
    }

    toolResults.push({
      type: "tool_result",
      tool_use_id: tu.id,
      content: contentForClaude,
      is_error: isError,
    });
  }

  messages.push({ role: "user", content: toolResults });

  if (lastReward !== null && lastReward >= targetReward) {
    stoppedReason = "target_reached";
    break;
  }
}

console.log("\n──── summary ────");
console.log(`stopped: ${stoppedReason}`);
console.log(`last reward: ${lastReward !== null ? lastReward.toFixed(4) : "n/a"}`);
console.log(`best reward: ${Number.isFinite(bestReward) ? bestReward.toFixed(4) : "n/a"}`);

await mcp.close();
