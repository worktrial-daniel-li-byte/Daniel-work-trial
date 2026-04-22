/**
 * Thin wrappers around the MCP client: connect, partition tools by role,
 * convert MCP content blocks into Anthropic tool-result blocks, and score.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { repoRoot, serverEntry } from "./config.mjs";

export async function connectMcp(
  clientInfo = { name: "verify-write-loop", version: "0.3.0" },
) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    cwd: repoRoot,
    stderr: "inherit",
  });
  const mcp = new Client(clientInfo, { capabilities: {} });
  await mcp.connect(transport);
  return mcp;
}

export function toAnthropicTool(t) {
  return {
    name: t.name,
    description: t.description ?? "",
    input_schema: t.inputSchema ?? { type: "object", properties: {} },
  };
}

/**
 * Pick the MCP tools the verifier is allowed to call directly. The worker is
 * a Claude Code subprocess with its own built-in toolkit (Read, Edit, Grep,
 * Bash, …) and doesn't use the MCP server.
 */
export function partitionTools(mcpTools) {
  const pick = (names) =>
    mcpTools.filter((t) => names.includes(t.name)).map(toAnthropicTool);
  return {
    verifierMcpTools: pick(["score_app", "get_reward_config"]),
  };
}

/** Convert MCP content blocks to Anthropic-shaped tool_result content blocks. */
export function mcpBlocksToAnthropicBlocks(blocks) {
  return (blocks ?? []).map((b) =>
    b.type === "image"
      ? {
          type: "image",
          source: { type: "base64", media_type: b.mimeType, data: b.data },
        }
      : { type: "text", text: b.text ?? JSON.stringify(b) },
  );
}

export async function callMcp(mcp, name, input) {
  const res = await mcp.callTool({ name, arguments: input ?? {} });
  return {
    blocks: mcpBlocksToAnthropicBlocks(res.content),
    isError: res.isError === true,
    structured: res.structuredContent,
  };
}

export async function scoreApp(mcp, appUrl) {
  const res = await callMcp(mcp, "score_app", { app_url: appUrl });
  const reward =
    res.structured && typeof res.structured.reward === "number"
      ? res.structured.reward
      : null;
  return { ...res, reward };
}
