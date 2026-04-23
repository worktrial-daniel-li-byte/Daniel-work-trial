/**
 * Thin adapter around scripts/test-check.mjs → Playwright runner.
 *
 * The verify→write loop calls runTestsForLoop() after each worker dispatch
 * (when --tests is enabled) to get a pass_rate signal it can blend into the
 * reward, plus a compact list of failures so the verifier can write targeted
 * follow-up tasks for the worker.
 *
 * We deliberately reuse scripts/test-check.mjs — it already knows how to
 * shell out to `npx playwright test`, sets JIRA_BASE_URL for the route-map
 * shim in tests/_fixtures/jira.mjs, writes the JSON report, and doesn't
 * restart the dev server when the port is already open (ensureDevServer
 * short-circuits on isPortOpen).
 */

import path from 'node:path'
import { runTests } from '../../scripts/test-check.mjs'
import { repoRoot } from './config.mjs'

function firstLine(s) {
  if (!s) return null
  const stripped = String(s).replace(/\u001b\[[0-9;]*m/g, '') // eslint-disable-line no-control-regex
  return stripped.split('\n').find((ln) => ln.trim()) ?? null
}

/**
 * @param {object} opts
 * @param {string} opts.appUrl         Dev-server URL (used verbatim).
 * @param {string} opts.testDir        Directory under repo root (e.g. "tests/board").
 * @param {string} [opts.artifactDir]  Where to write per-run artifacts.
 * @returns {Promise<{
 *   passed: number,
 *   failed: number,
 *   total: number,
 *   skipped: number,
 *   pass_rate: number,              // 0..1 (0 if total===0)
 *   pass_rate_signed: number,       // -1..1  (= 2*pass_rate - 1)
 *   exit_code: number,
 *   failures: Array<{ file: string, title: string, error: string|null }>,
 *   artifact_dir: string,
 * }>}
 */
export async function runTestsForLoop({ appUrl, testDir, artifactDir }) {
  const result = await runTests({
    appUrl,
    testDir,
    artifactDir,
    autoStart: false, // the loop already owns the dev server
    headed: false,
  })

  const total = result.counts?.total ?? 0
  const passed = result.counts?.passed ?? 0
  const failed = result.counts?.failed ?? 0
  const skipped = result.counts?.skipped ?? 0
  const pass_rate = total > 0 ? passed / total : 0
  const pass_rate_signed = 2 * pass_rate - 1

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
    pass_rate_signed,
    exit_code: result.exit_code,
    failures,
    artifact_dir: result.artifact_dir,
  }
}

/**
 * Blend the visual reward ([-1, 1]) and the test pass_rate_signed ([-1, 1])
 * into a single scalar in [-1, 1] the loop can track for improvement/target.
 *
 * @param {number|null} visualReward        From score_app; may be null.
 * @param {number|null} passRateSigned      2 * pass_rate - 1; may be null.
 * @param {number} weight                   In [0, 1] — share given to tests.
 * @returns {number|null}
 */
export function blendReward(visualReward, passRateSigned, weight) {
  const hasV = typeof visualReward === 'number' && Number.isFinite(visualReward)
  const hasT = typeof passRateSigned === 'number' && Number.isFinite(passRateSigned)
  if (!hasV && !hasT) return null
  if (!hasV) return passRateSigned
  if (!hasT) return visualReward
  const w = Math.max(0, Math.min(1, weight))
  return (1 - w) * visualReward + w * passRateSigned
}
