/**
 * Tests-only verifier/orchestrator loop.
 *
 * State is a list of failing specs. Each dispatch targets ONE spec and the
 * orchestrator only re-runs that spec after the worker edits. The full
 * suite is re-run only when the verifier explicitly calls list_failures().
 */

import { runWorker } from "../loop/worker.mjs";
import { repoRoot } from "../loop/config.mjs";
import { scoreApp } from "../loop/mcp-client.mjs";
import { runPlaywrightSuite } from "./test-runner.mjs";
import { buildVerifierSystemPrompt, workerSystemPrompt } from "./prompts.mjs";

/**
 * Pull a current visual reward + sub-score breakdown from the MCP server.
 * Returns null on failure so the caller can soldier on without guardrail
 * data instead of crashing the harness.
 */
async function takeVisualScore(mcp, appUrl) {
  if (!mcp) return null;
  try {
    const res = await scoreApp(mcp, appUrl);
    if (typeof res.reward !== "number") return null;
    const details = res.structured?.details ?? null;
    return {
      reward: res.reward,
      details,
      at: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`    [visual] score_app failed: ${err.message}`);
    return null;
  }
}

function formatVisualDelta(d) {
  if (typeof d !== "number" || !Number.isFinite(d)) return "n/a";
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(4)}`;
}

// Threshold below which a drop counts as a regression worth flagging on
// the dispatch report. Tight enough to catch real damage, loose enough to
// tolerate the normal noise in ssim across test-fixing edits.
const VISUAL_REGRESSION_TOLERANCE = 0.01;

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
  if (
    status === 408 ||
    status === 429 ||
    status === 529 ||
    (typeof status === "number" && status >= 500)
  ) {
    return true;
  }
  const code = err.code ?? err.cause?.code;
  if (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  ) {
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
      const label =
        err?.type ?? err?.error?.type ?? err?.code ?? err?.status ?? "unknown";
      console.warn(
        `[verifier] anthropic call failed (${label}); retry ${attempt}/${ANTHROPIC_MAX_RETRIES} in ${waitMs}ms`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

// ── Tools ────────────────────────────────────────────────────────────────

export const listFailuresTool = {
  name: "list_failures",
  description:
    "Run the FULL Playwright suite against the app and return the current " +
    "failure list. Slow (minutes). Call sparingly — the orchestrator already " +
    "ran this once at startup and put the result in your first user message. " +
    "Use it again before declare_done to confirm, or when you suspect a fix " +
    "regressed another spec.",
  input_schema: { type: "object", properties: {} },
};

export const dispatchTool = {
  name: "dispatch_to_worker",
  description:
    "Send one focused fix to the code worker. The orchestrator will run the " +
    "worker, then re-run ONLY the spec named in `target_spec` (optionally " +
    "narrowed by `target_grep`). Returns the focused rerun result: " +
    "{ passed, failed, failures }. If the focused rerun passes, the worker " +
    "session is cleared for the next dispatch; if it still fails, the same " +
    "worker is resumed so you can course-correct.",
  input_schema: {
    type: "object",
    properties: {
      task: {
        type: "string",
        description:
          "Concrete instruction for the worker: which source file to edit " +
          "and what the change should look like. Name selectors / roles / " +
          "aria-label / data-testid / text verbatim. Also tell the worker " +
          "to read the failing spec file for context.",
      },
      rationale: {
        type: "string",
        description:
          "One-sentence explanation of why this change should make " +
          "`target_spec` pass.",
      },
      target_spec: {
        type: "string",
        description:
          "Path to the failing spec file, relative to the repo root " +
          "(e.g. 'tests/board/toolbar.view_settings.spec.mjs'). Take this " +
          "verbatim from failures[].file.",
      },
      target_grep: {
        type: "string",
        description:
          "Optional Playwright --grep pattern (test title substring or " +
          "regex) to narrow the focused rerun to a single test inside " +
          "target_spec when it contains multiple tests.",
      },
    },
    required: ["task", "rationale", "target_spec"],
  },
};

export const declareDoneTool = {
  name: "declare_done",
  description:
    "Stop the loop. Before exiting, the orchestrator will automatically run " +
    "list_failures() once more to produce the final report. Call with " +
    "success=true when you believe all previously failing specs are green.",
  input_schema: {
    type: "object",
    properties: {
      reason: { type: "string" },
      success: { type: "boolean" },
    },
    required: ["reason"],
  },
};

// ── Handlers ─────────────────────────────────────────────────────────────

function formatFailuresList(failures) {
  if (!failures.length) return "(none — all specs passing)";
  return failures
    .map(
      (f, i) =>
        `  [${i + 1}] ${f.file}\n      ${JSON.stringify(f.title)}\n      ${
          f.error ?? ""
        }`,
    )
    .join("\n");
}

/**
 * Run the suite until the FIRST failure and return it (or null on all-green).
 * Uses Playwright's --max-failures=1 so a big failing suite aborts fast —
 * seconds instead of minutes.
 */
async function findNextFailure({ appUrl, testsDir, label = "find-next" }) {
  console.log(
    `\n  ▶ ${label}  (fail-fast @ ${testsDir} against ${appUrl})`,
  );
  const report = await runPlaywrightSuite({
    appUrl,
    testDir: testsDir,
    artifactDir: undefined,
    maxFailures: 1,
  });
  console.log(
    `    fail-fast: ${report.passed}/${report.total} passed` +
      (report.failed ? ` (${report.failed} failed)` : "") +
      `  ${report.failures.length ? "→ next failure found" : "→ all green"}`,
  );
  return { report, failure: report.failures[0] ?? null };
}

function makeHandleListFailures({ state, config, appUrl, logger, mcp }) {
  return async function handleListFailures() {
    let result;
    try {
      result = await findNextFailure({
        appUrl,
        testsDir: config.testsDir,
        label: "list_failures",
      });
    } catch (err) {
      console.warn(`    [list_failures] runner failed: ${err.message}`);
      return {
        blocks: [
          {
            type: "text",
            text: JSON.stringify({ error: err.message }, null, 2),
          },
        ],
        isError: true,
      };
    }

    const { report, failure } = result;
    state.lastFailures = failure ? [failure] : [];
    state.lastFullReport = {
      passed: report.passed,
      failed: report.failed,
      total: report.total,
      skipped: report.skipped,
      pass_rate: report.pass_rate,
      at: new Date().toISOString(),
    };

    if (logger) {
      try {
        await logger.logListFailures(report);
      } catch (err) {
        console.warn(`    [logger] failed to write: ${err.message}`);
      }
    }

    // While we're at it, refresh the visual score. The verifier uses it as
    // a guardrail against regressing the reference-match while fixing tests.
    const visual = await takeVisualScore(mcp, appUrl);
    if (visual) state.lastVisual = visual;

    const payload = {
      mode: "fail_fast",
      note:
        "The harness runs with Playwright --max-failures=1, so this report " +
        "surfaces ONE failure at a time. Fix it, then the next dispatch " +
        "result will include the next failure automatically; you rarely " +
        "need to call list_failures yourself.",
      next_failure: failure ?? null,
      counts_at_stop: {
        ran: report.total,
        passed: report.passed,
        failed: report.failed,
        skipped: report.skipped,
      },
      visual: buildVisualBlock(visual, state.baselineVisual),
      artifact_dir: report.artifact_dir,
      fixed_specs: [...state.fixedSpecs].sort(),
      dispatches_used: state.dispatchesUsed,
      dispatch_budget: config.maxDispatches,
    };
    return {
      blocks: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      isError: false,
    };
  };
}

/**
 * Shape the visual guardrail block we attach to tool results. Always a
 * consistent object so the verifier can read `visual.delta` every turn.
 */
function buildVisualBlock(current, baseline) {
  if (!current && !baseline) return null;
  const c = current?.reward ?? null;
  const b = baseline?.reward ?? null;
  const delta = c !== null && b !== null ? c - b : null;
  const regressed =
    typeof delta === "number" && delta < -VISUAL_REGRESSION_TOLERANCE;
  return {
    reward: c,
    baseline: b,
    delta,
    regressed,
    tolerance: VISUAL_REGRESSION_TOLERANCE,
    details: current?.details ?? null,
    baseline_details: baseline?.details ?? null,
    note: regressed
      ? "visual_reward dropped more than the tolerance vs baseline. Do NOT " +
        "accept this fix; resume the worker and course-correct so the change " +
        "keeps the visual score. If unavoidable, narrow the change to just " +
        "the selector/a11y attributes the spec needs."
      : "visual_reward tracked against the baseline captured at harness " +
        "startup. Stay within tolerance while fixing tests.",
  };
}

function makeHandleDispatch({ state, config, appUrl, logger, mcp }) {
  return async function handleDispatch({
    task,
    rationale,
    target_spec,
    target_grep = null,
  }) {
    if (!target_spec || typeof target_spec !== "string") {
      return {
        blocks: [
          {
            type: "text",
            text: "dispatch rejected: target_spec is required (the failing spec path, verbatim from failures[].file).",
          },
        ],
        isError: true,
      };
    }

    state.dispatchesUsed += 1;
    const dispatchNo = state.dispatchesUsed;
    const isResume = state.workerSessionId !== null;
    const mode = isResume ? "resumed" : "fresh";

    console.log(
      `\n  ▶ dispatch #${dispatchNo}  (${
        isResume
          ? `RESUME claude session ${state.workerSessionId}`
          : "FRESH claude worker"
      })`,
    );
    console.log(`    task: ${task}`);
    console.log(`    rationale: ${rationale}`);
    console.log(
      `    target_spec: ${target_spec}` +
        (target_grep ? `  grep=${JSON.stringify(target_grep)}` : ""),
    );

    const userTurn = isResume
      ? `Follow-up from planner. Your previous attempt did not make ${target_spec} pass.\n\nNew task: ${task}\n\nRationale: ${rationale}\n\nAdjust course and try again.`
      : `Task from planner:\n\n${task}\n\nRationale (for your context only): ${rationale}\n\nTargeting Playwright spec: ${target_spec}${
          target_grep ? `  (grep: ${target_grep})` : ""
        }\n\nMake the minimal necessary edits to make this spec pass, then summarize what you changed.`;

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

    let focusedReport;
    try {
      focusedReport = await runPlaywrightSuite({
        appUrl,
        testDir: target_spec,
        grep: target_grep || null,
        artifactDir: undefined,
      });
      console.log(
        `    focused-tests: ${focusedReport.passed}/${focusedReport.total} passed` +
          (focusedReport.failed ? ` (${focusedReport.failed} failed)` : ""),
      );
    } catch (err) {
      console.warn(`    [focused-tests] runner failed: ${err.message}`);
      focusedReport = { error: err.message };
    }

    const improved =
      focusedReport &&
      !focusedReport.error &&
      focusedReport.total > 0 &&
      focusedReport.failed === 0;

    if (improved) {
      state.workerSessionId = null;
      state.fixedSpecs.add(target_spec);
      state.lastFailures = state.lastFailures.filter(
        (f) => f.file !== target_spec,
      );
    } else if (workerResult.sessionId) {
      state.workerSessionId = workerResult.sessionId;
    }

    console.log(
      `    focused=${
        improved
          ? "PASSED → clearing worker session"
          : "still failing → worker session preserved"
      }`,
    );

    // Visual guardrail: regardless of whether the focused rerun passed, the
    // worker's edit may have moved DOM/CSS in ways that regress the match
    // against the reference design. Refresh the visual score so the verifier
    // can see the delta in the dispatch report.
    const visual = await takeVisualScore(mcp, appUrl);
    if (visual) state.lastVisual = visual;
    const visualBlock = buildVisualBlock(visual, state.baselineVisual);
    if (visualBlock) {
      console.log(
        `    visual: reward=${
          visualBlock.reward !== null ? visualBlock.reward.toFixed(4) : "n/a"
        }  baseline=${
          visualBlock.baseline !== null
            ? visualBlock.baseline.toFixed(4)
            : "n/a"
        }  delta=${formatVisualDelta(visualBlock.delta)}` +
          (visualBlock.regressed ? "  REGRESSION" : ""),
      );
    }

    // On a successful focused rerun, hunt for the next failing spec in the
    // background so the verifier's next turn already has a target in hand.
    // Playwright --max-failures=1 aborts as soon as one fails (seconds even
    // on a large failing suite); on an all-green suite it will run
    // everything and that's fine because that means we're done.
    let nextFailureResult = null;
    if (improved) {
      try {
        nextFailureResult = await findNextFailure({
          appUrl,
          testsDir: config.testsDir,
          label: "auto_next_failure",
        });
        if (nextFailureResult.failure) {
          state.lastFailures = [nextFailureResult.failure];
        } else {
          state.lastFailures = [];
          state.allGreen = true;
        }
        state.lastFullReport = {
          passed: nextFailureResult.report.passed,
          failed: nextFailureResult.report.failed,
          total: nextFailureResult.report.total,
          skipped: nextFailureResult.report.skipped,
          pass_rate: nextFailureResult.report.pass_rate,
          at: new Date().toISOString(),
        };
        if (logger) {
          try {
            await logger.logListFailures(nextFailureResult.report);
          } catch (err) {
            console.warn(`    [logger] failed to write: ${err.message}`);
          }
        }
      } catch (err) {
        console.warn(`    [auto_next_failure] runner failed: ${err.message}`);
        nextFailureResult = { error: err.message };
      }
    }

    if (logger) {
      try {
        await logger.logHarnessDispatch({
          dispatchNo,
          mode,
          task,
          rationale,
          targetSpec: target_spec,
          targetGrep: target_grep || null,
          workerSummary,
          focusedReport,
          improved,
        });
      } catch (err) {
        console.warn(`    [logger] failed to write: ${err.message}`);
      }
    }

    const reportBody = {
      dispatch_no: dispatchNo,
      worker_mode: mode,
      target_spec,
      target_grep: target_grep || null,
      focused_rerun: focusedReport?.error
        ? { error: focusedReport.error }
        : {
            passed: focusedReport.passed,
            failed: focusedReport.failed,
            total: focusedReport.total,
            failures: (focusedReport.failures ?? []).slice(0, 5),
            artifact_dir: focusedReport.artifact_dir,
          },
      improved,
      worker_summary: workerSummary,
      worker_session_id: workerResult.sessionId,
      worker_turns: workerResult.numTurns,
      worker_context_after: improved ? "cleared" : "preserved",
      visual: visualBlock,
      fixed_specs: [...state.fixedSpecs].sort(),
      dispatches_used: state.dispatchesUsed,
      dispatch_budget: config.maxDispatches,
      // When the focused rerun passed, the orchestrator also runs a fail-
      // fast pass over the whole suite to hand you the NEXT failing spec
      // on a silver platter. If this is null on an improved dispatch, the
      // suite is all green — call declare_done.
      next_failure:
        improved && nextFailureResult && !nextFailureResult.error
          ? nextFailureResult.failure ?? null
          : null,
      all_green:
        improved &&
        nextFailureResult &&
        !nextFailureResult.error &&
        nextFailureResult.failure === null,
      next_failure_error:
        improved && nextFailureResult?.error ? nextFailureResult.error : null,
    };

    return {
      blocks: [{ type: "text", text: JSON.stringify(reportBody, null, 2) }],
      isError: false,
    };
  };
}

// ── Main loop ────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {import("@anthropic-ai/sdk").default} opts.anthropic
 * @param {import("@modelcontextprotocol/sdk/client/index.js").Client|null} [opts.mcp]
 *        MCP client used to poll score_app for the visual guardrail. If
 *        null, the harness runs without visual regression tracking.
 * @param {string} opts.appUrl
 * @param {object} opts.config         Shared + testsDir/maxDispatches.
 * @param {object|null} [opts.logger]
 * @param {string|null} [opts.extraGuidance]
 */
export async function runTestHarnessLoop({
  anthropic,
  mcp = null,
  appUrl,
  config,
  logger = null,
  extraGuidance = null,
}) {
  const state = {
    workerSessionId: null,
    dispatchesUsed: 0,
    lastFailures: [],
    lastFullReport: null,
    fixedSpecs: new Set(),
    allGreen: false,
    baselineVisual: null,
    lastVisual: null,
    done: false,
    doneReason: null,
    doneSuccess: null,
  };

  const handleListFailures = makeHandleListFailures({
    state,
    config,
    appUrl,
    logger,
    mcp,
  });
  const handleDispatch = makeHandleDispatch({
    state,
    config,
    appUrl,
    logger,
    mcp,
  });

  // Visual baseline: capture the reference-match reward BEFORE any edits so
  // we can compare every dispatch's post-edit reward against a stable
  // anchor. Optional — if mcp is unavailable or score_app fails, the
  // harness still runs, just without the guardrail.
  if (mcp) {
    console.log(`\n[harness] capturing visual baseline via score_app…`);
    state.baselineVisual = await takeVisualScore(mcp, appUrl);
    state.lastVisual = state.baselineVisual;
    if (state.baselineVisual) {
      const d = state.baselineVisual.details || {};
      const flat = Object.entries(d)
        .filter(([, v]) => typeof v === "number")
        .map(([k, v]) => `${k}=${v.toFixed(3)}`)
        .join(" ");
      console.log(
        `[harness] baseline visual_reward=${state.baselineVisual.reward.toFixed(4)}` +
          (flat ? `  (${flat})` : ""),
      );
    } else {
      console.warn(`[harness] visual baseline unavailable — guardrail disabled.`);
    }
  }

  // Baseline: fail-fast run so we bail at the first failure (seconds instead
  // of minutes when the suite has many failures) and hand the verifier ONE
  // concrete target to fix. A successful fix will auto-trigger another
  // fail-fast run to surface the next failure.
  console.log(
    `\n[harness] baseline fail-fast run against ${appUrl} (${config.testsDir})…`,
  );
  let baseline;
  try {
    baseline = await findNextFailure({
      appUrl,
      testsDir: config.testsDir,
      label: "baseline",
    });
  } catch (err) {
    console.error(`[harness] baseline suite failed to run: ${err.message}`);
    return {
      stopReason: "baseline_failed",
      dispatchesUsed: 0,
      failures: [],
      fixedSpecs: [],
    };
  }

  state.lastFailures = baseline.failure ? [baseline.failure] : [];
  state.lastFullReport = {
    passed: baseline.report.passed,
    failed: baseline.report.failed,
    total: baseline.report.total,
    skipped: baseline.report.skipped,
    pass_rate: baseline.report.pass_rate,
    at: new Date().toISOString(),
  };
  if (logger) {
    try {
      await logger.logListFailures(baseline.report);
    } catch (err) {
      console.warn(`[logger] failed to write: ${err.message}`);
    }
  }

  if (!baseline.failure) {
    console.log("[harness] no failing specs at baseline — nothing to do.");
    return {
      stopReason: "all_green_at_baseline",
      dispatchesUsed: 0,
      failures: [],
      fixedSpecs: [],
      finalReport: state.lastFullReport,
    };
  }

  console.log(`[harness] first failing spec:`);
  console.log(formatFailuresList([baseline.failure]));

  const verifierSystemPrompt = buildVerifierSystemPrompt({
    appUrl,
    testsDir: config.testsDir,
    maxDispatches: config.maxDispatches,
    visualEnabled: Boolean(mcp) && Boolean(state.baselineVisual),
    visualTolerance: VISUAL_REGRESSION_TOLERANCE,
  });
  const verifierTools = [listFailuresTool, dispatchTool, declareDoneTool];

  const baselinePayload = {
    mode: "fail_fast",
    note:
      "The harness runs Playwright with --max-failures=1, so this baseline " +
      "aborted at the FIRST failing spec. After you dispatch a fix and the " +
      "focused rerun passes, the next dispatch result will include the NEXT " +
      "failure as `next_failure` (or `all_green: true` when the suite is " +
      "done). You normally won't need to call list_failures yourself.",
    next_failure: baseline.failure,
    counts_at_stop: {
      ran: state.lastFullReport.total,
      passed: state.lastFullReport.passed,
      failed: state.lastFullReport.failed,
      skipped: state.lastFullReport.skipped,
    },
    visual: buildVisualBlock(state.baselineVisual, state.baselineVisual),
    dispatch_budget: config.maxDispatches,
  };
  const kickoff =
    `Baseline fail-fast run complete. First failure:\n\n` +
    "```json\n" +
    JSON.stringify(baselinePayload, null, 2) +
    "\n```\n\n" +
    `Dispatch a focused fix now. Pass \`target_spec\` verbatim from ` +
    `\`next_failure.file\` so the orchestrator only re-runs that spec.` +
    (extraGuidance ? `\n\nOperator guidance: ${extraGuidance}` : "");

  const verifierMsgs = [{ role: "user", content: kickoff }];

  let stopReason = "max_dispatches";

  while (!state.done && state.dispatchesUsed < config.maxDispatches) {
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

      let result;
      if (tu.name === "list_failures") {
        result = await handleListFailures();
      } else if (tu.name === "dispatch_to_worker") {
        result = await handleDispatch(tu.input ?? {});
      } else if (tu.name === "declare_done") {
        state.done = true;
        state.doneReason = tu.input?.reason ?? "(no reason)";
        state.doneSuccess = !!tu.input?.success;
        result = {
          blocks: [
            {
              type: "text",
              text: "acknowledged; ending loop after final list_failures().",
            },
          ],
          isError: false,
        };
      } else {
        result = {
          blocks: [{ type: "text", text: `unknown tool: ${tu.name}` }],
          isError: true,
        };
      }

      const firstText = result.blocks.find((b) => b.type === "text")?.text ?? "";
      const preview = truncate(firstText.replace(/\s+/g, " "), 400);
      console.log(
        `[verifier ←] ${tu.name}${result.isError ? " ERROR" : ""} ${preview}`,
      );

      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: result.blocks,
        is_error: result.isError,
      });
    }
    verifierMsgs.push({ role: "user", content: toolResults });

    if (state.done) {
      stopReason = "verifier_done";
      break;
    }
  }

  // Final confirm. If the verifier already observed all_green via an auto
  // next-failure hunt, skip this — we just re-ran the suite moments ago.
  // Otherwise do a fail-fast run so regressions show up immediately.
  console.log("\n[harness] final confirm run…");
  let finalReport = null;
  try {
    if (state.allGreen) {
      finalReport = {
        passed: state.lastFullReport?.total ?? 0,
        failed: 0,
        total: state.lastFullReport?.total ?? 0,
        skipped: state.lastFullReport?.skipped ?? 0,
        pass_rate: 1,
        failures: [],
      };
      console.log(
        `[harness] reusing recent all-green report (${finalReport.passed}/${finalReport.total}).`,
      );
    } else {
      const res = await runPlaywrightSuite({
        appUrl,
        testDir: config.testsDir,
        artifactDir: undefined,
        maxFailures: 1,
      });
      finalReport = res;
      console.log(
        `[harness] final: ${res.passed}/${res.total} ran, ${res.failed} failed` +
          (res.failures.length ? ` (first: ${res.failures[0].file})` : ""),
      );
    }
  } catch (err) {
    console.warn(`[harness] final suite failed: ${err.message}`);
  }

  // One more visual read so the summary reflects the final state, not the
  // last dispatch's post-edit score.
  let finalVisual = state.lastVisual;
  if (mcp) {
    const v = await takeVisualScore(mcp, appUrl);
    if (v) finalVisual = v;
  }

  return {
    stopReason,
    dispatchesUsed: state.dispatchesUsed,
    failures: finalReport?.failures ?? state.lastFailures,
    fixedSpecs: [...state.fixedSpecs].sort(),
    finalReport: finalReport
      ? {
          passed: finalReport.passed,
          failed: finalReport.failed,
          total: finalReport.total,
          skipped: finalReport.skipped,
          pass_rate: finalReport.pass_rate,
        }
      : null,
    visual: {
      baseline:
        state.baselineVisual
          ? {
              reward: state.baselineVisual.reward,
              details: state.baselineVisual.details,
            }
          : null,
      final: finalVisual
        ? { reward: finalVisual.reward, details: finalVisual.details }
        : null,
      delta:
        finalVisual && state.baselineVisual
          ? finalVisual.reward - state.baselineVisual.reward
          : null,
    },
    doneReason: state.doneReason,
    doneSuccess: state.doneSuccess,
  };
}
