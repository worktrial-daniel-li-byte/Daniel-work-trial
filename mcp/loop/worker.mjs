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

  for (let turn = 0; turn < config.maxWorkerTurns; turn++) {
    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      system: workerSystemPrompt,
      tools: workerTools,
      messages: workerMsgs,
    });
    workerMsgs.push({ role: "assistant", content: response.content });

    const textBlocks = response.content.filter((b) => b.type === "text");
    for (const tb of textBlocks) {
      if (tb.text?.trim()) console.log(`    [worker] ${tb.text.trim()}`);
    }
    const finalText = textBlocks.map((b) => b.text ?? "").join("\n").trim();
    if (finalText) summary = finalText;

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
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
    }
    workerMsgs.push({ role: "user", content: toolResults });
  }

  return summary + " (hit maxWorkerTurns)";
}
