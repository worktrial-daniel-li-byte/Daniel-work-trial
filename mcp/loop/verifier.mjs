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
import { buildVerifierSystemPrompt, workerSystemPrompt } from "./prompts.mjs";
import { repoRoot } from "./config.mjs";

function truncate(s, n) {
  if (typeof s !== "string") return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

const ANTHROPIC_MAX_RETRIES = 8;
const ANTHROPIC_BASE_DELAY_MS = 5000;
const ANTHROPIC_MAX_DELAY_MS = 60000;

function isRetryableAnthropicError(err) {
  if (!err) return false;
  const type = err.type ?? err.error?.type ?? err.error?.error?.type;
  if (
    type === "overloaded_error" ||
    type === "rate_limit_error" ||
    type === "api_error"
  ) {
    return true;
  }
  const status = err.status;
  if (status === 408 || status === 429 || status === 529 || (typeof status === "number" && status >= 500)) {
    return true;
  }
  const code = err.code ?? err.cause?.code;
  if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return true;
  }
  return false;
}

async function streamVerifierMessageWithRetry(anthropic, params) {
  let attempt = 0;
  while (true) {
    try {
      const stream = anthropic.messages.stream(params);
      return await stream.finalMessage();
    } catch (err) {
      attempt += 1;
      if (attempt > ANTHROPIC_MAX_RETRIES || !isRetryableAnthropicError(err)) {
        throw err;
      }
      const backoff = Math.min(
        ANTHROPIC_MAX_DELAY_MS,
        ANTHROPIC_BASE_DELAY_MS * 2 ** (attempt - 1),
      );
      const jitter = Math.floor(Math.random() * 1000);
      const waitMs = backoff + jitter;
      const label = err?.type ?? err?.error?.type ?? err?.code ?? err?.status ?? "unknown";
      console.warn(
        `[verifier] anthropic call failed (${label}); retry ${attempt}/${ANTHROPIC_MAX_RETRIES} in ${waitMs}ms`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

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
          "Short explanation of which sub-score (ssim/text/color/pqgram) you " +
          "expect to rise and why. If an operator focus is set, the rationale " +
          "must name that sub-score.",
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

function makeHandleDispatch({ mcp, config, appUrl, state, logger }) {
  return async function handleDispatch({ task, rationale }) {
    const before = state.lastReward;
    state.dispatchesUsed += 1;
    const dispatchNo = state.dispatchesUsed;
    const isResume = state.workerSessionId !== null;
    const mode = isResume ? "resumed" : "fresh";

    console.log(
      `\n  ▶ dispatch #${dispatchNo}  (${isResume ? `RESUME claude session ${state.workerSessionId}` : "FRESH claude worker"})`,
    );
    console.log(`    task: ${task}`);
    console.log(`    rationale: ${rationale}`);

    const userTurn = isResume
      ? `Follow-up from planner. Your previous attempt did not improve the reward (before=${
          before?.toFixed?.(4) ?? "n/a"
        }).\n\nNew task: ${task}\n\nRationale: ${rationale}\n\nAdjust course and try again.`
      : `Task from planner:\n\n${task}\n\nRationale (for your context only): ${rationale}\n\nMake the minimal necessary edits, then summarize what you changed.`;

    const workerResult = await runWorker({
      prompt: userTurn,
      sessionId: state.workerSessionId,
      cwd: repoRoot,
      appendSystemPrompt: workerSystemPrompt,
      model: config.workerModel,
      allowedTools: config.workerAllowedTools,
      permissionMode: config.workerPermissionMode,
      cliPath: config.claudeCliPath,
      timeoutMs: config.workerTimeoutMs,
      onStderr: (line) => console.log(`    [worker stderr] ${line}`),
    });

    const workerSummary = workerResult.summary;
    console.log(
      `    [worker] ${workerSummary}` +
        (workerResult.numTurns !== null
          ? `  (${workerResult.numTurns} turns, ${
              workerResult.durationMs !== null
                ? (workerResult.durationMs / 1000).toFixed(1) + "s"
                : "?s"
            }${
              workerResult.totalCostUsd !== null
                ? ", $" + workerResult.totalCostUsd.toFixed(4)
                : ""
            })`
          : ""),
    );
    if (workerResult.isError) {
      console.warn(
        `    [worker] flagged is_error (exit=${workerResult.exitCode})`,
      );
    }

    const scoreRes = await scoreApp(mcp, appUrl);
    const after = scoreRes.reward;

    const improved =
      before === null
        ? true
        : after !== null && after > before + config.improvementDelta;

    if (after !== null) state.lastReward = after;
    if (after !== null && after > state.bestReward) state.bestReward = after;

    console.log(
      `    reward: ${before?.toFixed?.(4) ?? "n/a"} → ${after?.toFixed?.(4) ?? "n/a"}` +
        `  (${improved ? "IMPROVED → clearing worker session" : "no improvement → worker session preserved"})`,
    );

    if (improved) {
      state.workerSessionId = null;
    } else if (workerResult.sessionId) {
      // On non-improvement, continue the same Claude Code session next time so
      // the worker can course-correct against its own history.
      state.workerSessionId = workerResult.sessionId;
    }

    if (logger) {
      try {
        await logger.logDispatch({
          task,
          rationale,
          mode,
          before,
          after,
          improved,
          workerSummary,
        });
        if (scoreRes.structured) await logger.logScore(scoreRes.structured);
      } catch (err) {
        console.warn(`    [logger] failed to write: ${err.message}`);
      }
    }

    const report = {
      dispatch_no: dispatchNo,
      worker_mode: mode,
      before_reward: before,
      after_reward: after,
      improved,
      improvement: after !== null && before !== null ? after - before : null,
      worker_summary: workerSummary,
      worker_session_id: workerResult.sessionId,
      worker_turns: workerResult.numTurns,
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

function makeHandleVerifierTool({
  mcp,
  config,
  appUrl,
  state,
  handleDispatch,
  logger,
}) {
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
      const reward = res.structured.reward;
      state.lastReward = reward;
      if (reward > state.bestReward) state.bestReward = reward;
      if (logger) {
        try {
          await logger.logScore(res.structured);
        } catch (err) {
          console.warn(`[logger] failed to log score: ${err.message}`);
        }
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
 * @param {object} opts.config            See mcp/loop/config.mjs
 * @param {import("./logger.mjs").RunLogger|null} [opts.logger] Optional run logger.
 * @returns {Promise<object>}             Summary { stopReason, ... }
 */
export async function runVerifyLoop({
  anthropic,
  mcp,
  appUrl,
  extraGuidance,
  focusGuidance,
  verifierMcpTools,
  config,
  logger = null,
}) {
  const verifierTools = [...verifierMcpTools, dispatchTool, declareDoneTool];
  const verifierSystemPrompt = buildVerifierSystemPrompt({
    appUrl,
    targetReward: config.targetReward,
  });

  const kickoff =
    `Begin. Score the app at ${appUrl}, look at the diff, and dispatch the ` +
    `first focused change.`;
  const focusBlock = focusGuidance ? `\n\n${focusGuidance}` : "";
  const extraBlock = extraGuidance
    ? `\n\nOperator guidance: ${extraGuidance}`
    : "";

  const verifierMsgs = [
    { role: "user", content: kickoff + focusBlock + extraBlock },
  ];

  const state = {
    workerSessionId: null, // null => next dispatch starts a fresh claude -p
    lastReward: null,
    bestReward: -Infinity,
    dispatchesUsed: 0,
    done: false,
    doneReason: null,
    doneSuccess: null,
  };

  const handleDispatch = makeHandleDispatch({
    mcp,
    config,
    appUrl,
    state,
    logger,
  });
  const handleVerifierTool = makeHandleVerifierTool({
    mcp,
    config,
    appUrl,
    state,
    handleDispatch,
    logger,
  });

  let stopReason = "max_dispatches";

  while (
    !state.done &&
    state.dispatchesUsed < config.maxDispatches &&
    (state.lastReward === null || state.lastReward < config.targetReward)
  ) {
    const response = await streamVerifierMessageWithRetry(anthropic, {
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
      const argPreview = truncate(JSON.stringify(tu.input ?? {}), 400);
      console.log(`[verifier →] ${tu.name}(${argPreview})`);

      const { blocks, isError } = await handleVerifierTool(tu);

      const firstText = blocks.find((b) => b.type === "text")?.text ?? "";
      const imgCount = blocks.filter((b) => b.type === "image").length;
      const resultPreview = truncate(firstText.replace(/\s+/g, " "), 400);
      console.log(
        `[verifier ←] ${tu.name}${isError ? " ERROR" : ""} ${resultPreview}` +
          (imgCount ? ` [+${imgCount} image${imgCount > 1 ? "s" : ""}]` : ""),
      );

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
