/**
 * Code worker: a subprocess invocation of Claude Code in headless mode
 * (`claude -p`) that writes (or fixes) one Playwright spec file given the
 * feature_check + browser-agent evidence.
 *
 * Session continuity across retries for the same check uses
 * `--resume <session_id>`: on failure, we resume so the worker can
 * course-correct against its own history.
 */

import { spawn } from 'node:child_process'

/**
 * @param {object} opts
 * @param {string} opts.prompt                Task text (feature_check + evidence + previous failure).
 * @param {string|null} opts.sessionId        Resume this claude session if set.
 * @param {string} opts.cwd                   Working directory (repo root).
 * @param {string} opts.appendSystemPrompt    System prompt text to append.
 * @param {string|null} [opts.model]
 * @param {string} [opts.allowedTools]
 * @param {string} [opts.permissionMode]
 * @param {string} [opts.cliPath]
 * @param {number|null} [opts.timeoutMs]
 * @param {(line: string) => void} [opts.onStderr]
 * @returns {Promise<{
 *   summary: string, sessionId: string|null, isError: boolean,
 *   numTurns: number|null, durationMs: number|null, totalCostUsd: number|null,
 *   exitCode: number|null, raw: object|null,
 * }>}
 */
export async function runCodeWorker({
  prompt,
  sessionId,
  cwd,
  appendSystemPrompt,
  model = null,
  allowedTools = 'Read,Edit,Write,MultiEdit,Grep,Glob,Bash',
  permissionMode = 'acceptEdits',
  cliPath = 'claude',
  timeoutMs = null,
  onStderr = null,
}) {
  const args = [
    '-p',
    prompt,
    '--bare',
    '--output-format',
    'json',
    '--permission-mode',
    permissionMode,
    '--allowedTools',
    allowedTools,
    '--append-system-prompt',
    appendSystemPrompt,
  ]
  if (sessionId) args.push('--resume', sessionId)
  if (model) args.push('--model', model)

  const env = { ...process.env }
  if (!env.ANTHROPIC_API_KEY && env.ANTH_API_KEY) {
    env.ANTHROPIC_API_KEY = env.ANTH_API_KEY
  }

  return new Promise((resolve) => {
    const child = spawn(cliPath, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d.toString('utf8')
    })
    child.stderr.on('data', (d) => {
      const s = d.toString('utf8')
      stderr += s
      if (onStderr) {
        for (const line of s.split('\n')) if (line.trim()) onStderr(line)
      }
    })

    let killedByTimeout = false
    const timer =
      typeof timeoutMs === 'number' && timeoutMs > 0
        ? setTimeout(() => {
            killedByTimeout = true
            try {
              child.kill('SIGKILL')
            } catch {}
          }, timeoutMs)
        : null

    child.on('error', (err) => {
      if (timer) clearTimeout(timer)
      resolve({
        summary: `spawn ${cliPath} failed: ${err.message}`,
        sessionId: null,
        isError: true,
        numTurns: null,
        durationMs: null,
        totalCostUsd: null,
        exitCode: null,
        raw: null,
      })
    })

    child.on('close', (code) => {
      if (timer) clearTimeout(timer)
      const raw = parseClaudeJson(stdout)
      const summaryText =
        typeof raw?.result === 'string' && raw.result.trim()
          ? raw.result.trim()
          : stderr.trim() || `(claude -p exited ${code})`
      const prefix = killedByTimeout ? '[worker killed by timeout] ' : ''
      resolve({
        summary: prefix + summaryText,
        sessionId: raw?.session_id ?? null,
        isError: killedByTimeout || code !== 0 || raw?.is_error === true,
        numTurns: typeof raw?.num_turns === 'number' ? raw.num_turns : null,
        durationMs:
          typeof raw?.duration_ms === 'number' ? raw.duration_ms : null,
        totalCostUsd:
          typeof raw?.total_cost_usd === 'number' ? raw.total_cost_usd : null,
        exitCode: code,
        raw,
      })
    })
  })
}

function parseClaudeJson(stdout) {
  const trimmed = stdout.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {}
  const lines = trimmed.split('\n').filter((l) => l.trim())
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i])
    } catch {}
  }
  return null
}
