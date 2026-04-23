/**
 * Runs a single generated Playwright spec and returns a structured result.
 *
 * "Passed" means:
 *   - `npx playwright test <spec>` exited 0, AND
 *   - the spec contains >= minAssertions `expect(` calls (static count).
 *
 * The second check guards against the worker shipping a green-but-empty spec.
 */

import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'

function countAssertions(source) {
  if (!source) return 0
  // Count `expect(` occurrences, ignoring ones that appear inside //-line or
  // /* */ block comments. This is a pragmatic regex — it works well enough
  // for the worker's output which uses standard JS comment styles.
  const stripped = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
  const matches = stripped.match(/\bexpect\s*\(/g)
  return matches ? matches.length : 0
}

function truncate(s, n) {
  if (typeof s !== 'string') return ''
  return s.length > n ? s.slice(0, n) + `…[truncated ${s.length - n} chars]` : s
}

/**
 * @param {object} opts
 * @param {string} opts.specPath           Absolute path to the spec file.
 * @param {string} opts.cwd                Repo root (where playwright.config.mjs lives).
 * @param {number} [opts.minAssertions=2]  Static assertion floor.
 * @param {number} [opts.timeoutMs=180_000]
 * @param {object} [opts.extraEnv]         Extra env vars for the child.
 * @returns {Promise<{
 *   passed: boolean,
 *   exitCode: number|null,
 *   assertionCount: number,
 *   minAssertions: number,
 *   failureReason: string|null,
 *   stdout: string,
 *   stderr: string,
 *   durationMs: number,
 * }>}
 */
export async function runSpec({
  specPath,
  cwd,
  minAssertions = 2,
  timeoutMs = 180_000,
  extraEnv = {},
}) {
  let source = ''
  try {
    source = await readFile(specPath, 'utf8')
  } catch (err) {
    return {
      passed: false,
      exitCode: null,
      assertionCount: 0,
      minAssertions,
      failureReason: `spec file does not exist: ${specPath} (${err?.message ?? err})`,
      stdout: '',
      stderr: '',
      durationMs: 0,
    }
  }

  const assertionCount = countAssertions(source)
  const relSpec = path.relative(cwd, specPath)

  const startedAt = Date.now()
  const { exitCode, stdout, stderr, killedByTimeout } = await spawnPlaywright({
    cwd,
    args: ['playwright', 'test', relSpec, '--reporter=list'],
    env: { ...process.env, ...extraEnv },
    timeoutMs,
  })
  const durationMs = Date.now() - startedAt

  const passedRun = exitCode === 0
  const passedAssertions = assertionCount >= minAssertions
  const passed = passedRun && passedAssertions

  let failureReason = null
  if (killedByTimeout) {
    failureReason = `playwright test killed after ${timeoutMs}ms`
  } else if (!passedRun) {
    failureReason = `playwright test exited with code ${exitCode}`
  } else if (!passedAssertions) {
    failureReason = `assertion floor not met: found ${assertionCount} expect(...) call(s), need >= ${minAssertions}`
  }

  return {
    passed,
    exitCode,
    assertionCount,
    minAssertions,
    failureReason,
    stdout: truncate(stdout, 8000),
    stderr: truncate(stderr, 4000),
    durationMs,
  }
}

function spawnPlaywright({ cwd, args, env, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn('npx', args, {
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
      stderr += d.toString('utf8')
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
        exitCode: null,
        stdout,
        stderr: stderr + `\nspawn error: ${err?.message ?? err}`,
        killedByTimeout,
      })
    })
    child.on('close', (code) => {
      if (timer) clearTimeout(timer)
      resolve({ exitCode: code, stdout, stderr, killedByTimeout })
    })
  })
}
