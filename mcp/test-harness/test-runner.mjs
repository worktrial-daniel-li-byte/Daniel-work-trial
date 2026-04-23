/**
 * Thin adapter around scripts/test-check.mjs → Playwright runner, for the
 * test-harness loop.
 *
 * Reuses scripts/test-check.mjs — it already knows how to shell out to
 * `npx playwright test`, sets JIRA_BASE_URL for the route-map shim in
 * tests/_fixtures/jira.mjs, writes the JSON report, and short-circuits
 * ensureDevServer when the port is already open.
 */

import path from 'node:path'
import { runTests } from '../../scripts/test-check.mjs'
import { repoRoot } from '../loop/config.mjs'

function firstLine(s) {
  if (!s) return null
  const stripped = String(s).replace(/\u001b\[[0-9;]*m/g, '') // eslint-disable-line no-control-regex
  return stripped.split('\n').find((ln) => ln.trim()) ?? null
}

/**
 * @param {object} opts
 * @param {string} opts.appUrl         Dev-server URL (used verbatim).
 * @param {string} opts.testDir        Directory OR spec file path under repo
 *                                     root (e.g. "tests" or
 *                                     "tests/board/foo.spec.mjs").
 * @param {string} [opts.artifactDir]  Where to write per-run artifacts.
 * @param {boolean} [opts.autoStart]   If true, start the dev server when the
 *                                     port is not already open (and kill it on
 *                                     teardown). Defaults to false — the
 *                                     harness owns the dev server for the
 *                                     whole run, so downstream callers should
 *                                     find the port already open.
 * @param {string|null} [opts.grep]    Optional Playwright --grep pattern, used
 *                                     to pin a run to a single test title when
 *                                     a spec file contains multiple tests.
 * @param {number|null} [opts.maxFailures]
 *                                     Forwarded to Playwright as
 *                                     --max-failures. Use 1 to make the
 *                                     runner abort as soon as one spec
 *                                     fails (keeps baseline + next-failure
 *                                     hunts fast when the suite is large).
 * @returns {Promise<{
 *   passed: number,
 *   failed: number,
 *   total: number,
 *   skipped: number,
 *   pass_rate: number,              // 0..1 (0 if total===0)
 *   exit_code: number,
 *   failures: Array<{ file: string, title: string, error: string|null }>,
 *   artifact_dir: string,
 * }>}
 */
export async function runPlaywrightSuite({
  appUrl,
  testDir,
  artifactDir,
  autoStart = false,
  grep = null,
  maxFailures = null,
}) {
  const extraArgs = []
  if (grep) extraArgs.push('--grep', grep)
  if (typeof maxFailures === 'number' && maxFailures > 0) {
    extraArgs.push(`--max-failures=${maxFailures}`)
  }

  const result = await runTests({
    appUrl,
    testDir,
    artifactDir,
    autoStart,
    headed: false,
    extraArgs,
  })

  const total = result.counts?.total ?? 0
  const passed = result.counts?.passed ?? 0
  const failed = result.counts?.failed ?? 0
  const skipped = result.counts?.skipped ?? 0
  const pass_rate = total > 0 ? passed / total : 0

  const failures = (result.tests || [])
    .filter((t) => t.status === 'failed' || t.status === 'timedOut')
    .map((t) => ({
      file: t.file ? path.relative(repoRoot, t.file) : '',
      title: t.title,
      error: firstLine(t.error),
    }))

  return {
    passed,
    failed,
    total,
    skipped,
    pass_rate,
    exit_code: result.exit_code,
    failures,
    artifact_dir: result.artifact_dir,
  }
}
