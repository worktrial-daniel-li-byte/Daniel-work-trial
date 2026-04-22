/**
 * Worker agent: a subprocess invocation of Claude Code in headless mode
 * (`claude -p`). Claude Code brings its own agent loop, context management,
 * and built-in tools (Read / Edit / Write / MultiEdit / Bash / Grep / Glob),
 * so the orchestrator just hands it a prompt and reads back the final
 * summary + session id.
 *
 * Session continuity across dispatches is via `--resume <session_id>` — the
 * verifier stores the id on `state.workerSessionId` and passes it back in
 * on the next dispatch when the previous attempt did not improve the reward.
 *
 * Docs: https://code.claude.com/docs/en/headless
 */

import { spawn } from "node:child_process";

/**
 * Invoke Claude Code headless once and resolve with the parsed result.
 *
 * @param {object}  opts
 * @param {string}  opts.prompt              Task + rationale text.
 * @param {string|null} opts.sessionId       If set, --resume <sessionId> (continue previous worker).
 * @param {string}  opts.cwd                 Working directory for the worker (repo root).
 * @param {string}  opts.appendSystemPrompt  Injected via --append-system-prompt.
 * @param {string|null} [opts.model]         Optional --model override.
 * @param {string}  [opts.allowedTools]      Comma-separated tool allowlist. Default covers
 *                                           the common file/shell toolkit.
 * @param {string}  [opts.permissionMode]    Default "acceptEdits" so file writes + common fs
 *                                           commands don't prompt. Other shell commands still
 *                                           need to be in allowedTools.
 * @param {string}  [opts.cliPath]           Override the `claude` executable path.
 * @param {number}  [opts.timeoutMs]         Kill the subprocess after this many ms.
 * @param {(line: string) => void} [opts.onStderr]  Stderr line callback (for live logging).
 * @returns {Promise<{
 *   summary: string,
 *   sessionId: string|null,
 *   isError: boolean,
 *   numTurns: number|null,
 *   durationMs: number|null,
 *   totalCostUsd: number|null,
 *   exitCode: number|null,
 *   raw: object|null,
 * }>}
 */
export async function runWorker({
  prompt,
  sessionId,
  cwd,
  appendSystemPrompt,
  model = null,
  allowedTools = "Read,Edit,Write,MultiEdit,Bash,Grep,Glob",
  permissionMode = "acceptEdits",
  cliPath = "claude",
  timeoutMs = null,
  onStderr = null,
}) {
  const args = [
    "-p",
    prompt,
    "--bare",
    "--output-format",
    "json",
    "--permission-mode",
    permissionMode,
    "--allowedTools",
    allowedTools,
    "--append-system-prompt",
    appendSystemPrompt,
  ];
  if (sessionId) args.push("--resume", sessionId);
  if (model) args.push("--model", model);

  // --bare uses ANTHROPIC_API_KEY only. If the host env is using ANTH_API_KEY
  // (e.g. our .env), mirror it so the worker authenticates without needing
  // `claude /login`.
  const env = { ...process.env };
  if (!env.ANTHROPIC_API_KEY && env.ANTH_API_KEY) {
    env.ANTHROPIC_API_KEY = env.ANTH_API_KEY;
  }

  return new Promise((resolve) => {
    const child = spawn(cliPath, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d) => {
      const s = d.toString("utf8");
      stderr += s;
      if (onStderr) {
        for (const line of s.split("\n")) if (line.trim()) onStderr(line);
      }
    });

    let killedByTimeout = false;
    const timer =
      typeof timeoutMs === "number" && timeoutMs > 0
        ? setTimeout(() => {
            killedByTimeout = true;
            try {
              child.kill("SIGKILL");
            } catch {}
          }, timeoutMs)
        : null;

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      resolve({
        summary: `spawn ${cliPath} failed: ${err.message}`,
        sessionId: null,
        isError: true,
        numTurns: null,
        durationMs: null,
        totalCostUsd: null,
        exitCode: null,
        raw: null,
      });
    });

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      const raw = parseClaudeJson(stdout);
      const summaryText =
        typeof raw?.result === "string" && raw.result.trim()
          ? raw.result.trim()
          : stderr.trim() || `(claude -p exited ${code})`;

      const prefix = killedByTimeout ? "[worker killed by timeout] " : "";
      resolve({
        summary: prefix + summaryText,
        sessionId: raw?.session_id ?? null,
        isError: killedByTimeout || code !== 0 || raw?.is_error === true,
        numTurns: typeof raw?.num_turns === "number" ? raw.num_turns : null,
        durationMs: typeof raw?.duration_ms === "number" ? raw.duration_ms : null,
        totalCostUsd:
          typeof raw?.total_cost_usd === "number" ? raw.total_cost_usd : null,
        exitCode: code,
        raw,
      });
    });
  });
}

/**
 * `claude -p --output-format json` emits a single JSON object on stdout, but
 * a stray warning or log line can sneak in front of it. Try the whole stdout
 * first, then fall back to the last non-empty line.
 */
function parseClaudeJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {}
  const lines = trimmed.split("\n").filter((l) => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {}
  }
  return null;
}
