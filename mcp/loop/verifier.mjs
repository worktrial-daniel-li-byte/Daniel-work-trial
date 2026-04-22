/**
 * Verifier agent + orchestrator loop.
 *
 * Exposes two orchestrator-only pseudo-tools (dispatch_to_worker, declare_done)
 * that aren't part of the MCP server but are handled here in JS, plus the
 * real MCP tools (score_app, get_reward_config) forwarded to the client.
 *
 * On dispatch:
 *   - runs the worker (fresh or resumed per state.workerMsgs)
 *   - re-scores via the MCP server
 *   - clears worker context if the reward improved, preserves it if not
 *   - returns the full report + fresh screenshots to the verifier
 */

import { callMcp, scoreApp } from "./mcp-client.mjs";
import { runWorker } from "./worker.mjs";
import { buildVerifierSystemPrompt } from "./prompts.mjs";

// ── Orchestrator-only pseudo-tools the verifier can call ──────────────────

export const dispatchTool = {
  name: "dispatch_to_worker",
  description:
    "Send a single focused task to the code worker. The worker has file-edit tools " +
    "and will attempt the change. After the worker finishes, the orchestrator will " +
    "re-score the app and return: {before_reward, after_reward, improved, worker_summary} " +
    "plus fresh screenshots. If improved=false, the same worker will be resumed with " +
    "your next dispatch (context preserved). If improved=true, the worker context is " +
    "cleared before the next dispatch (so each new task starts fresh).",
  input_schema: {
    type: "object",
    properties: {
      task: {
        type: "string",
        description:
          "A concrete, narrowly scoped instruction: which files to change and what " +
          "the change should look like. Be specific about selectors/classes/text/colors.",
      },
      rationale: {
        type: "string",
        description:
          "Short explanation of which sub-score (ssim/text/color) you expect to rise.",
      },
    },
    required: ["task", "rationale"],
  },
};

export const declareDoneTool = {
  name: "declare_done",
  description:
    "Stop the loop. Call when reward is high enough, or when no further improvement " +
    "looks reachable.",
  input_schema: {
    type: "object",
    properties: {
      reason: { type: "string" },
      success: { type: "boolean" },
    },
    required: ["reason"],
  },
};

// ── Dispatch handler ──────────────────────────────────────────────────────

function makeHandleDispatch({ anthropic, mcp, workerTools, config, appUrl, state }) {
  return async function handleDispatch({ task, rationale }) {
    const before = state.lastReward;
    state.dispatchesUsed += 1;
    const dispatchNo = state.dispatchesUsed;
    const isResume = state.workerMsgs !== null;

    console.log(
      `\n  ▶ dispatch #${dispatchNo}  (${isResume ? "RESUME existing worker" : "FRESH worker"})`,
    );
    console.log(`    task: ${task}`);
    console.log(`    rationale: ${rationale}`);

    const userTurn = isResume
      ? `Follow-up from planner. Your previous attempt did not improve the reward (before=${
          before?.toFixed?.(4) ?? "n/a"
        }).\n\nNew task: ${task}\n\nRationale: ${rationale}\n\nAdjust course and try again.`
      : `Task from planner:\n\n${task}\n\nRationale (for your context only): ${rationale}\n\nMake the minimal necessary edits, then summarize what you changed.`;

    if (!isResume) state.workerMsgs = [];
    state.workerMsgs.push({ role: "user", content: userTurn });

    const workerSummary = await runWorker({
      anthropic,
      mcp,
      workerTools,
      workerMsgs: state.workerMsgs,
      config,
    });

    const scoreRes = await scoreApp(mcp, appUrl);
    const after = scoreRes.reward;
    const improved =
      before === null
        ? true
        : after !== null && after > before + config.improvementDelta;

    if (after !== null) state.lastReward = after;
    if (after !== null && after > state.bestReward) state.bestReward = after;

    console.log(
      `    reward: ${before?.toFixed?.(4) ?? "n/a"} → ${after?.toFixed?.(4) ?? "n/a"}  ` +
        `(${improved ? "IMPROVED → clearing worker context" : "no improvement → worker context preserved"})`,
    );

    if (improved) state.workerMsgs = null;

    const report = {
      dispatch_no: dispatchNo,
      worker_mode: isResume ? "resumed" : "fresh",
      before_reward: before,
      after_reward: after,
      improved,
      improvement: after !== null && before !== null ? after - before : null,
      worker_summary: workerSummary,
      target_reward: config.targetReward,
      target_reached: after !== null && after >= config.targetReward,
      worker_context_after: improved ? "cleared" : "preserved",
    };

    return {
      blocks: [
        { type: "text", text: JSON.stringify(report, null, 2) },
        ...scoreRes.blocks,
      ],
      isError: false,
    };
  };
}

// ── Verifier tool handler ─────────────────────────────────────────────────

function makeHandleVerifierTool({ mcp, state, handleDispatch }) {
  return async function handleVerifierTool(tu) {
    if (tu.name === "dispatch_to_worker") {
      return await handleDispatch(tu.input ?? {});
    }
    if (tu.name === "declare_done") {
      state.done = true;
      state.doneReason = tu.input?.reason ?? "(no reason)";
      state.doneSuccess = !!tu.input?.success;
      return {
        blocks: [{ type: "text", text: "acknowledged; ending loop." }],
        isError: false,
      };
    }
    const res = await callMcp(mcp, tu.name, tu.input ?? {});
    if (
      tu.name === "score_app" &&
      !res.isError &&
      res.structured &&
      typeof res.structured.reward === "number"
    ) {
      state.lastReward = res.structured.reward;
      if (res.structured.reward > state.bestReward) {
        state.bestReward = res.structured.reward;
      }
    }
    return { blocks: res.blocks, isError: res.isError };
  };
}

// ── Main verifier loop ────────────────────────────────────────────────────

/**
 * Run the full verify→write loop until completion.
 *
 * @param {object} opts
 * @param {import("@anthropic-ai/sdk").default} opts.anthropic
 * @param {import("@modelcontextprotocol/sdk/client/index.js").Client} opts.mcp
 * @param {string} opts.appUrl
 * @param {string|undefined} opts.extraGuidance
 * @param {Array} opts.verifierMcpTools   (score_app, get_reward_config)
 * @param {Array} opts.workerTools        (read_file, write_file, list_dir)
 * @param {object} opts.config            See mcp/loop/config.mjs
 * @returns {Promise<object>}             Summary { stopReason, ... }
 */
export async function runVerifyLoop({
  anthropic,
  mcp,
  appUrl,
  extraGuidance,
  verifierMcpTools,
  workerTools,
  config,
}) {
  const verifierTools = [...verifierMcpTools, dispatchTool, declareDoneTool];
  const verifierSystemPrompt = buildVerifierSystemPrompt({
    appUrl,
    targetReward: config.targetReward,
  });

  const verifierMsgs = [
    {
      role: "user",
      content:
        `Begin. Score the app at ${appUrl}, look at the diff, and dispatch the ` +
        `first focused change.` +
        (extraGuidance ? `\n\nOperator guidance: ${extraGuidance}` : ""),
    },
  ];

  const state = {
    workerMsgs: null, // null => next dispatch starts a fresh worker
    lastReward: null,
    bestReward: -Infinity,
    dispatchesUsed: 0,
    done: false,
    doneReason: null,
    doneSuccess: null,
  };

  const handleDispatch = makeHandleDispatch({
    anthropic,
    mcp,
    workerTools,
    config,
    appUrl,
    state,
  });
  const handleVerifierTool = makeHandleVerifierTool({
    mcp,
    state,
    handleDispatch,
  });

  let stopReason = "max_dispatches";

  while (
    !state.done &&
    state.dispatchesUsed < config.maxDispatches &&
    (state.lastReward === null || state.lastReward < config.targetReward)
  ) {
    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      system: verifierSystemPrompt,
      tools: verifierTools,
      messages: verifierMsgs,
    });
    verifierMsgs.push({ role: "assistant", content: response.content });

    for (const b of response.content) {
      if (b.type === "text" && b.text?.trim()) {
        console.log(`[verifier] ${b.text.trim()}`);
      }
    }

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      stopReason = "verifier_idle";
      break;
    }

    const toolResults = [];
    for (const tu of toolUses) {
      if (tu.name !== "dispatch_to_worker" && tu.name !== "declare_done") {
        console.log(
          `[verifier →] ${tu.name}(${JSON.stringify(tu.input ?? {})})`,
        );
      }
      const { blocks, isError } = await handleVerifierTool(tu);
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: blocks,
        is_error: isError,
      });
    }
    verifierMsgs.push({ role: "user", content: toolResults });

    if (state.done) {
      stopReason = "verifier_done";
      break;
    }
    if (state.lastReward !== null && state.lastReward >= config.targetReward) {
      stopReason = "target_reached";
      break;
    }
  }

  return {
    stopReason,
    dispatchesUsed: state.dispatchesUsed,
    lastReward: state.lastReward,
    bestReward: state.bestReward,
    doneReason: state.doneReason,
    doneSuccess: state.doneSuccess,
  };
}
