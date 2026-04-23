/**
 * Env + path resolution for the browser-verify → code-write → test-run loop.
 *
 * Env:
 *   ANTHROPIC_API_KEY / ANTH_API_KEY   (required — mirrored into the worker env)
 *   CLAUDE_MODEL              default claude-opus-4-7  (browser-agent model)
 *   ANTHROPIC_MODEL           alt alias for browser-agent model
 *
 *   MAX_FIX_DISPATCHES        default 3    # of code-worker retries per check
 *                                            if the generated test fails.
 *   MUTATION_CHECK            default 0    1 = after the spec goes green, run a
 *                                            saboteur agent that removes the
 *                                            feature in src/ and confirm the
 *                                            spec now fails; then revert via
 *                                            snapshot and confirm it's green
 *                                            again. Only meaningful when the
 *                                            specs target your local clone —
 *                                            leave off when pointing at real
 *                                            Jira (default).
 *   MIN_ASSERTIONS_PER_SPEC   default 2    (static) required `expect(` count.
 *   PW_TIMEOUT_MS             default 60000  per-test timeout
 *   BROWSER_AGENT_MAX_TURNS   default 30   MCP turns per browser-agent pass
 *   TEST_LOOP_HEADLESS        default 0    run browser agent headed
 *
 *   WORKER_CLI_PATH           default "claude"
 *   WORKER_MODEL              default unset  passed to `claude --model`
 *   WORKER_ALLOWED_TOOLS      default "Read,Edit,Write,MultiEdit,Grep,Glob,Bash"
 *   WORKER_PERMISSION_MODE    default "acceptEdits"
 *   WORKER_TIMEOUT_MS         default 0 (no timeout)
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const loopDir = __dirname
export const mcpDir = path.resolve(__dirname, '..')
export const repoRoot = path.resolve(__dirname, '..', '..')
export const tabsDir = path.join(mcpDir, 'summary', 'tabs')
export const testsDir = path.join(repoRoot, 'tests')
export const profileDir = path.join(testsDir, '.pw-profile-jira')
export const playwrightMcpCli = path.join(
  repoRoot,
  'node_modules',
  '@playwright',
  'mcp',
  'cli.js',
)

loadDotenv({ path: path.join(repoRoot, '.env') })

const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.ANTH_API_KEY
if (!apiKey) {
  console.error('Missing ANTHROPIC_API_KEY (or ANTH_API_KEY).')
  process.exit(1)
}

export const config = {
  apiKey,
  model:
    process.env.ANTHROPIC_MODEL ??
    process.env.CLAUDE_MODEL ??
    'claude-opus-4-7',
  maxFixDispatches: Number(process.env.MAX_FIX_DISPATCHES ?? 3),
  mutationCheck:
    (process.env.MUTATION_CHECK ?? '0') !== '0' &&
    (process.env.MUTATION_CHECK ?? '0') !== 'false',
  minAssertionsPerSpec: Number(process.env.MIN_ASSERTIONS_PER_SPEC ?? 2),
  browserAgentMaxTurns: Number(process.env.BROWSER_AGENT_MAX_TURNS ?? 30),
  headless:
    process.env.TEST_LOOP_HEADLESS === '1' ||
    process.env.HEADLESS === '1',
  pwTimeoutMs: Number(process.env.PW_TIMEOUT_MS ?? 60_000),
  claudeCliPath: process.env.WORKER_CLI_PATH ?? 'claude',
  workerModel: process.env.WORKER_MODEL || null,
  workerAllowedTools:
    process.env.WORKER_ALLOWED_TOOLS ??
    'Read,Edit,Write,MultiEdit,Grep,Glob,Bash',
  workerPermissionMode: process.env.WORKER_PERMISSION_MODE ?? 'acceptEdits',
  workerTimeoutMs: Number(process.env.WORKER_TIMEOUT_MS ?? 0) || null,
}
