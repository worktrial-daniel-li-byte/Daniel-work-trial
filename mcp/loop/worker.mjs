/**
 * Worker agent: runs a Claude instance with file-edit tools only.
 *
 * Executes a single focused task given by the verifier. Mutates the passed-in
 * `workerMsgs` array so the orchestrator can preserve or discard context
 * across dispatches.
 */

import { callMcp } from "./mcp-client.mjs";
import { workerSystemPrompt } from "./prompts.mjs";

/**
 * @param {object} opts
 * @param {import("@anthropic-ai/sdk").default} opts.anthropic
 * @param {import("@modelcontextprotocol/sdk/client/index.js").Client} opts.mcp
 * @param {Array}  opts.workerTools       Anthropic tool definitions for the worker
 * @param {Array}  opts.workerMsgs        Mutable message history for this worker
 * @param {object} opts.config            { model, maxWorkerTurns, maxTokens }
 * @returns {Promise<string>}             The worker's final text summary
 */
export async function runWorker({
  anthropic,
  mcp,
  workerTools,
  workerMsgs,
  config,
}) {
  let summary = "(worker produced no summary)";

  // Self-heal: if the last assistant message has tool_use blocks with no
  // matching tool_result in the following user message, synthesize cancelled
  // tool_result blocks so the API doesn't 400 on the next request.
  healOrphanedToolUses(workerMsgs);

  for (let turn = 0; turn < config.maxWorkerTurns; turn++) {
    const stream = anthropic.messages.stream({
      model: config.model,
      max_tokens: config.maxTokens,
      system: workerSystemPrompt,
      tools: workerTools,
      messages: workerMsgs,
    });
    const response = await stream.finalMessage();
    workerMsgs.push({ role: "assistant", content: response.content });

    const textBlocks = response.content.filter((b) => b.type === "text");
    for (const tb of textBlocks) {
      if (tb.text?.trim()) console.log(`    [worker] ${tb.text.trim()}`);
    }
    const finalText = textBlocks.map((b) => b.text ?? "").join("\n").trim();
    if (finalText) summary = finalText;

    const toolUses = response.content.filter((b) => b.type === "tool_use");

    // Always service every tool_use — regardless of stop_reason — so the
    // history never has a tool_use without a matching tool_result.
    if (toolUses.length === 0) {
      return summary;
    }

    const toolResults = [];
    for (const tu of toolUses) {
      const inputPreview = JSON.stringify(tu.input);
      console.log(
        `    [worker →] ${tu.name}(${
          inputPreview.length > 160
            ? inputPreview.slice(0, 160) + "…"
            : inputPreview
        })`,
      );
      try {
        const res = await callMcp(mcp, tu.name, tu.input);
        const firstText = res.blocks.find((b) => b.type === "text");
        const preview = (firstText?.text ?? "").slice(0, 160);
        console.log(`    [worker ←] ${res.isError ? "ERROR " : ""}${preview}`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: res.blocks,
          is_error: res.isError,
        });
      } catch (err) {
        console.log(`    [worker ←] EXCEPTION ${err.message}`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: [{ type: "text", text: `tool error: ${err.message}` }],
          is_error: true,
        });
      }
    }
    // If the model was cut off mid-tool_use by the token budget, the tool
    // args are probably malformed (the MCP server will return an error for
    // each one). Don't bail — give the worker another turn to retry with a
    // smaller edit (e.g. replace_in_file instead of a full write_file).
    if (response.stop_reason === "max_tokens") {
      toolResults.push({
        type: "text",
        text:
          "NOTE: your previous response was truncated by max_tokens. Any " +
          "tool_use blocks above were incomplete and failed. Prefer " +
          "replace_in_file over write_file for smaller, non-truncated edits.",
      });
    }

    workerMsgs.push({ role: "user", content: toolResults });

    // If the model stopped for a non-tool reason other than max_tokens
    // (end_turn, pause_turn, ...) but still emitted tool_use blocks, service
    // them once then stop so we don't loop on a model that has nothing more
    // to say.
    if (response.stop_reason !== "tool_use" && response.stop_reason !== "max_tokens") {
      return summary;
    }
  }

  return summary + " (hit maxWorkerTurns)";
}

/**
 * Inspect workerMsgs and, if the tail ends with an assistant message whose
 * tool_use blocks aren't answered by a following user message's tool_result
 * blocks, append synthetic cancelled tool_result blocks so the conversation
 * is valid to send to the API again.
 */
function healOrphanedToolUses(workerMsgs) {
  if (!Array.isArray(workerMsgs) || workerMsgs.length === 0) return;

  const last = workerMsgs[workerMsgs.length - 1];
  if (!last || last.role !== "assistant") return;

  const content = Array.isArray(last.content) ? last.content : [];
  const toolUses = content.filter((b) => b.type === "tool_use");
  if (toolUses.length === 0) return;

  const toolResults = toolUses.map((tu) => ({
    type: "tool_result",
    tool_use_id: tu.id,
    content: [
      {
        type: "text",
        text: "(previous turn was interrupted before this tool ran; treat as cancelled)",
      },
    ],
    is_error: true,
  }));
  workerMsgs.push({ role: "user", content: toolResults });
  console.log(
    `    [worker] healed ${toolUses.length} orphaned tool_use block(s) from prior turn`,
  );
}
