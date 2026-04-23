/**
 * Per-feature browser-verified test-writer loop (real Jira edition).
 *
 * For each feature_check in the chosen tab JSON:
 *   Step A — Browser agent verifies the feature live and emits evidence JSON.
 *   Branch on evidence.status:
 *
 *   • PASS → Test-writer sub-loop:
 *       1. Code worker writes tests/<tab>/<check-id>.spec.mjs.
 *       2. Runner executes it via `npx playwright test` against real Jira.
 *          Must go green with ≥ minAssertionsPerSpec `expect()` calls.
 *       3. Mutation check (only if config.mutationCheck = 1 — off by
 *          default; only meaningful when the specs target a local clone
 *          you control, e.g. http://localhost:5173).
 *       4. On any failure, resume the code worker with the diagnostic
 *          and retry up to maxFixDispatches times.
 *
 *   • PARTIAL / FAIL / BLOCKED → record status and skip. The reward
 *     signal is "browser agent verified PASS AND writer produced a green
 *     spec", so anything short of PASS is a data point, not a retry.
 *
 * The browser agent + the spec runner both use the shared persistent
 * Chromium profile at tests/.pw-profile-jira, and Chrome acquires a
 * SingletonLock on that user-data-dir. To avoid a lock collision we
 * connect the browser agent only while it's verifying, close it, then run
 * the spec, then reconnect for the next call.
 */

import path from 'node:path'

import { BrowserAgent } from './browser-agent.mjs'
import { runCodeWorker } from './code-worker.mjs'
import { runSpec } from './test-runner.mjs'
import {
  buildWriterSystemPrompt,
  buildWriterTask,
  buildSaboteurSystemPrompt,
  buildSaboteurTask,
} from './prompts.mjs'
import { snapshotSources } from './snapshot.mjs'
import { config, repoRoot, testsDir } from './config.mjs'

function sanitizeForFilename(id) {
  // Feature ids in board.json look like "toolbar.search.filters_cards" — keep
  // them readable but strip anything that would be a filesystem hazard.
  return id.replace(/[^a-zA-Z0-9._-]+/g, '-')
}

function buildSpecPaths(tab, featureId) {
  const safe = sanitizeForFilename(featureId)
  const abs = path.join(testsDir, tab, `${safe}.spec.mjs`)
  const rel = path.relative(repoRoot, abs)
  return { abs, rel }
}

function pickCases(feature_checks, { only, skipPresenceOnly }) {
  return (feature_checks ?? []).filter((c) => {
    if (only && !only.has(c.id)) return false
    if (skipPresenceOnly && c.status === 'pass_presence_only') return false
    return true
  })
}

function makeFailureEvidence(testCase, appUrl, err) {
  return {
    id: testCase.id,
    status: 'FAIL',
    navigate_url: appUrl,
    observations: [],
    playwright_hints: { locators: [], url_assertions: [], interactions: [] },
    notes: `browser agent threw: ${err?.message ?? err}`,
  }
}

/**
 * One end-to-end browser verification in a freshly-connected Chromium.
 * Opens the MCP client, runs the check, closes cleanly so the spec runner
 * (or the next verification) can acquire the profile lock.
 */
async function verifyOnce({ testCase, appUrl, label }) {
  const browser = new BrowserAgent()
  try {
    await browser.connect()
    const { evidence } = await browser.verifyFeature({ testCase, appUrl })
    console.log(
      `    [browser-agent:${label}] status=${evidence.status}  turns=${evidence.turns}` +
        (evidence.stopped_for_budget ? '  (budget exhausted)' : ''),
    )
    return evidence
  } catch (err) {
    console.error(
      `    [browser-agent:${label}] error: ${err?.message ?? err}`,
    )
    return makeFailureEvidence(testCase, appUrl, err)
  } finally {
    await browser.close()
  }
}

// ── Mutation-check sub-step ─────────────────────────────────────────────
// Proves the freshly-green spec is actually load-bearing: a saboteur worker
// breaks the feature in src/, the harness re-runs the spec (must fail), and
// the harness reverts via `snapshotSources.restore()` (must pass again).
async function runMutationCheck({
  testCase,
  evidence,
  specAbs,
  specRel,
  saboteurSystem,
  attemptNo,
  logger,
}) {
  console.log(
    `    ▶ mutation check (saboteur + revert) for attempt ${attemptNo}`,
  )

  // 1. Snapshot src/ + public/ BEFORE letting the saboteur loose.
  const snap = await snapshotSources({
    repoRoot,
    dirs: ['src', 'public'],
    label: `feat-${testCase.id}`,
  })

  const task = buildSaboteurTask({
    featureCheck: testCase,
    evidence,
    specPathRel: specRel,
  })

  let saboteurSkipped = false
  let runAfterSabotage = null
  let runAfterRevert = null
  let workerSummary = '(not run)'
  let failureReason = null
  let loadBearing = false

  try {
    const workerRes = await runCodeWorker({
      prompt: task,
      sessionId: null, // always fresh — saboteur shouldn't carry context
      cwd: repoRoot,
      appendSystemPrompt: saboteurSystem,
      model: config.workerModel,
      allowedTools: config.workerAllowedTools,
      permissionMode: config.workerPermissionMode,
      cliPath: config.claudeCliPath,
      timeoutMs: config.workerTimeoutMs,
      onStderr: (line) => console.log(`      [saboteur stderr] ${line}`),
    })
    workerSummary = workerRes.summary
    console.log(`    [saboteur] ${workerSummary}`)

    // If the saboteur reports it made no edits (e.g. feature isn't in src/),
    // treat the mutation step as informational-only rather than a failure.
    // Heuristic: summary contains a phrase like "no edit" or "not load-bearing".
    const sLower = (workerSummary ?? '').toLowerCase()
    saboteurSkipped =
      /no edits?|no changes?|did not modify|not implemented|not load-bearing|not in src/.test(
        sLower,
      )

    // 2. Run spec with feature removed — expect FAILURE.
    runAfterSabotage = await runSpec({
      specPath: specAbs,
      cwd: repoRoot,
      minAssertions: config.minAssertionsPerSpec,
      timeoutMs: Math.max(config.pwTimeoutMs * 2, 60_000),
    })
    console.log(
      `    [runner:post-sabotage] exit=${runAfterSabotage.exitCode}  passed=${runAfterSabotage.passed}` +
        (runAfterSabotage.failureReason
          ? `  reason=${runAfterSabotage.failureReason}`
          : ''),
    )
  } finally {
    // 3. Harness-owned revert — always runs, even if the saboteur threw.
    try {
      await snap.restore()
      console.log(`    [revert] src/ + public/ restored from snapshot`)
    } catch (err) {
      failureReason = `snapshot restore failed: ${err?.message ?? err}`
      console.error(`    [revert] ERROR: ${failureReason}`)
    }
  }

  // If restore succeeded, re-run the spec to confirm it's green again.
  if (!failureReason) {
    runAfterRevert = await runSpec({
      specPath: specAbs,
      cwd: repoRoot,
      minAssertions: config.minAssertionsPerSpec,
      timeoutMs: Math.max(config.pwTimeoutMs * 2, 60_000),
    })
    console.log(
      `    [runner:post-revert]  exit=${runAfterRevert.exitCode}  passed=${runAfterRevert.passed}` +
        (runAfterRevert.failureReason
          ? `  reason=${runAfterRevert.failureReason}`
          : ''),
    )
  }

  // Clean up the tempdir regardless.
  await snap.cleanup().catch(() => {})

  if (failureReason) {
    loadBearing = false
  } else if (saboteurSkipped) {
    // Saboteur refused to edit. Treat the spec as provisionally load-bearing
    // since we couldn't actually test it, but surface this clearly.
    loadBearing = runAfterRevert?.passed === true
    if (!loadBearing) {
      failureReason = `saboteur made no edits AND spec did not re-pass after no-op revert (exit=${runAfterRevert?.exitCode})`
    } else {
      failureReason = 'saboteur declined to edit (feature may not live in src/); mutation contract not verified'
    }
  } else {
    const saboteurBrokeIt = runAfterSabotage?.passed === false
    const revertHealedIt = runAfterRevert?.passed === true
    loadBearing = saboteurBrokeIt && revertHealedIt
    if (!saboteurBrokeIt) {
      failureReason =
        'spec STAYED GREEN after feature was removed — the test is not load-bearing. Tighten its assertions against the specific DOM the feature produces.'
    } else if (!revertHealedIt) {
      failureReason = `spec did NOT re-pass after revert (exit=${runAfterRevert?.exitCode}); the revert may have failed or something outside src/+public/ was disturbed`
    }
  }

  await logger.logMutationCheck(testCase.id, attemptNo, {
    task,
    workerSummary,
    saboteurSkipped,
    runAfterSabotage,
    runAfterRevert,
    loadBearing,
    failureReason,
  })

  return {
    loadBearing,
    saboteurSkipped,
    workerSummary,
    runAfterSabotage,
    runAfterRevert,
    failureReason,
  }
}

// ── Test-writer sub-loop ─────────────────────────────────────────────────
// Runs once the feature is confirmed PASS by the browser agent.
// Each iteration:
//   1. Writer authors/updates tests/<tab>/<id>.spec.mjs.
//   2. Runner executes it — must be green.
//   3. (If enabled) mutation check — saboteur breaks feature, spec must
//      fail; harness reverts, spec must go green again.
// Failures at any step feed back into the resumed writer session.
async function runTestWriterSubLoop({
  testCase,
  evidence,
  specAbs,
  specRel,
  writerSystem,
  saboteurSystem,
  logger,
}) {
  let sessionId = null
  let previousFailure = null
  let passed = false
  let attemptNo = 0
  let lastRunner = null
  let lastWorkerSummary = null
  let lastMutation = null

  while (attemptNo < config.maxFixDispatches) {
    attemptNo += 1
    const task = buildWriterTask({
      featureCheck: testCase,
      evidence,
      specPathRel: specRel,
      previousFailure,
      minAssertions: config.minAssertionsPerSpec,
    })
    console.log(
      `    ▶ test-writer attempt ${attemptNo}/${config.maxFixDispatches}` +
        (sessionId ? '  (resumed session)' : '  (fresh session)'),
    )

    const workerRes = await runCodeWorker({
      prompt: task,
      sessionId,
      cwd: repoRoot,
      appendSystemPrompt: writerSystem,
      model: config.workerModel,
      allowedTools: config.workerAllowedTools,
      permissionMode: config.workerPermissionMode,
      cliPath: config.claudeCliPath,
      timeoutMs: config.workerTimeoutMs,
      onStderr: (line) => console.log(`      [test-writer stderr] ${line}`),
    })
    lastWorkerSummary = workerRes.summary
    console.log(
      `    [test-writer] ${workerRes.summary}` +
        (workerRes.numTurns !== null
          ? `  (${workerRes.numTurns} turns${
              workerRes.totalCostUsd !== null
                ? ', $' + workerRes.totalCostUsd.toFixed(4)
                : ''
            })`
          : ''),
    )
    if (workerRes.isError) {
      console.warn(
        `    [test-writer] flagged is_error (exit=${workerRes.exitCode})`,
      )
    }
    if (workerRes.sessionId) sessionId = workerRes.sessionId

    const runner = await runSpec({
      specPath: specAbs,
      cwd: repoRoot,
      minAssertions: config.minAssertionsPerSpec,
      timeoutMs: Math.max(config.pwTimeoutMs * 2, 60_000),
    })
    lastRunner = runner
    console.log(
      `    [runner] exit=${runner.exitCode}  assertions=${runner.assertionCount}/${runner.minAssertions}  passed=${runner.passed}` +
        (runner.failureReason ? `  reason=${runner.failureReason}` : ''),
    )

    await logger.logAttempt(testCase.id, attemptNo, {
      task,
      workerSummary: workerRes.summary,
      specPath: specAbs,
      runner,
    })

    if (!runner.passed) {
      previousFailure = [
        `Runner exitCode=${runner.exitCode}`,
        `assertions: ${runner.assertionCount} / required ${runner.minAssertions}`,
        runner.failureReason ? `reason: ${runner.failureReason}` : null,
        '',
        '----- STDOUT (last ~8KB) -----',
        runner.stdout || '(empty)',
        '',
        '----- STDERR (last ~4KB) -----',
        runner.stderr || '(empty)',
      ]
        .filter(Boolean)
        .join('\n')
      continue
    }

    // Spec green. Now prove it's load-bearing with the mutation check.
    if (!config.mutationCheck) {
      passed = true
      break
    }

    const mutation = await runMutationCheck({
      testCase,
      evidence,
      specAbs,
      specRel,
      saboteurSystem,
      attemptNo,
      logger,
    })
    lastMutation = mutation

    if (mutation.loadBearing || mutation.saboteurSkipped) {
      passed = true
      break
    }

    previousFailure = [
      `Spec passed initially, but the mutation check FAILED — the test is`,
      `not load-bearing. Rewrite the spec with stricter assertions that`,
      `target the specific DOM surfaces the feature produces (role+name,`,
      `exact visible text, exact URL fragment, computed attributes).`,
      '',
      `Diagnostic: ${mutation.failureReason ?? '(unknown)'}`,
      '',
      `Saboteur summary: ${mutation.workerSummary}`,
      '',
      '----- RUNNER (post-sabotage) -----',
      mutation.runAfterSabotage
        ? `exitCode=${mutation.runAfterSabotage.exitCode} passed=${mutation.runAfterSabotage.passed}\n${(mutation.runAfterSabotage.stdout || '').slice(0, 4000)}`
        : '(did not run)',
      '',
      '----- RUNNER (post-revert) -----',
      mutation.runAfterRevert
        ? `exitCode=${mutation.runAfterRevert.exitCode} passed=${mutation.runAfterRevert.passed}\n${(mutation.runAfterRevert.stdout || '').slice(0, 2000)}`
        : '(did not run)',
    ].join('\n')
  }

  return {
    passed,
    attempts: attemptNo,
    runner: lastRunner,
    workerSummary: lastWorkerSummary,
    mutation: lastMutation,
  }
}

/**
 * @param {object} opts
 * @param {object} opts.tabJson      Parsed tab JSON (e.g. board.json).
 * @param {string} opts.tab          Tab name (e.g. 'board') — picks dest dir tests/<tab>.
 * @param {string} opts.appUrl       Live URL to verify against.
 * @param {Set<string>|null} opts.only
 * @param {boolean} opts.skipPresenceOnly
 * @param {import('./logger.mjs').TestLoopLogger} opts.logger
 */
export async function runTestLoop({
  tabJson,
  tab,
  appUrl,
  only = null,
  skipPresenceOnly = false,
  logger,
}) {
  const cases = pickCases(tabJson.feature_checks, { only, skipPresenceOnly })
  if (cases.length === 0) {
    return {
      stopReason: 'no_cases',
      results: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        implemented: 0,
        impl_failed: 0,
      },
    }
  }

  console.log(
    `\nRunning ${cases.length} feature check(s) from tab '${tab}'.\n` +
      `  app URL: ${appUrl}\n` +
      `  max fix dispatches per check:  ${config.maxFixDispatches}\n` +
      `  min assertions per spec:       ${config.minAssertionsPerSpec}\n` +
      `  mutation check:                ${config.mutationCheck ? 'on' : 'off'}\n`,
  )

  const writerSystemPromptCache = new Map()
  const saboteurSystemPrompt = buildSaboteurSystemPrompt()
  const results = []

  for (const testCase of cases) {
    const { abs: specAbs, rel: specRel } = buildSpecPaths(tab, testCase.id)
    console.log(`\n=== [${testCase.id}] ${testCase.feature} ===`)
    console.log(`    spec: ${specRel}`)

    // ── Step A: browser verification on real Jira ────────────────────────
    const evidence = await verifyOnce({
      testCase,
      appUrl,
      label: 'verify',
    })
    await logger.logBrowserEvidence(testCase.id, evidence, 'initial')

    if (evidence.status !== 'PASS') {
      const result = {
        id: testCase.id,
        feature: testCase.feature,
        status:
          evidence.status === 'BLOCKED' ? 'BLOCKED' : 'VERIFY_FAILED',
        phase: 'browser',
        test_attempts: 0,
        spec: specRel,
        browser_status: evidence.status,
        reason: `browser agent reported ${evidence.status}: ${evidence.notes ?? ''}`,
      }
      results.push(result)
      await logger.logFeatureResult(testCase.id, result)
      console.log(`    → ${result.status} (skipping test-writer)`)
      continue
    }

    // ── Test-writer sub-loop (runs only on PASS) ───────────────────────
    if (!writerSystemPromptCache.has(specRel)) {
      writerSystemPromptCache.set(
        specRel,
        buildWriterSystemPrompt({ specPathRel: specRel }),
      )
    }
    const writer = await runTestWriterSubLoop({
      testCase,
      evidence,
      specAbs,
      specRel,
      writerSystem: writerSystemPromptCache.get(specRel),
      saboteurSystem: saboteurSystemPrompt,
      logger,
    })

    const result = {
      id: testCase.id,
      feature: testCase.feature,
      status: writer.passed ? 'PASS' : 'TEST_FAILED',
      phase: 'test',
      test_attempts: writer.attempts,
      spec: specRel,
      last_exit_code: writer.runner?.exitCode ?? null,
      last_assertions: writer.runner?.assertionCount ?? null,
      last_failure_reason: writer.runner?.failureReason ?? null,
      last_worker_summary: writer.workerSummary,
      mutation_checked: config.mutationCheck,
      load_bearing: writer.mutation
        ? writer.mutation.loadBearing && !writer.mutation.saboteurSkipped
        : null,
      mutation_saboteur_skipped: writer.mutation?.saboteurSkipped ?? null,
      mutation_failure_reason: writer.mutation?.failureReason ?? null,
    }
    results.push(result)
    await logger.logFeatureResult(testCase.id, result)

    const mutTag = !config.mutationCheck
      ? 'mutation=off'
      : writer.mutation?.saboteurSkipped
        ? 'mutation=skipped'
        : writer.mutation?.loadBearing
          ? 'load-bearing=yes'
          : 'load-bearing=NO'
    console.log(
      `    → ${result.status}  test=${writer.attempts}  ${mutTag}`,
    )
  }

  const summary = results.reduce(
    (acc, r) => {
      acc.total += 1
      if (r.status === 'PASS') acc.passed += 1
      else if (r.status === 'BLOCKED') acc.blocked += 1
      else if (r.status === 'VERIFY_FAILED') acc.verify_failed += 1
      else acc.failed += 1
      return acc
    },
    {
      total: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      verify_failed: 0,
    },
  )

  return {
    stopReason: 'completed',
    results,
    summary,
  }
}
