/**
 * Per-run logger for the test-loop.
 *
 * Layout:
 *   mcp/logs/test-loop/<run-timestamp>/
 *     run.json                 - header
 *     run.md                   - final human summary
 *     timeline.json
 *     feature-<id>/
 *       browser-evidence.json  - evidence captured by the browser agent
 *       attempt-01/
 *         spec.mjs             - snapshot of the generated spec
 *         runner.json          - test runner result (stdout, stderr, exitCode, assertions)
 *         worker.md            - task given to code worker + its summary
 *       result.json            - final status for this feature
 */

import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

function pad(n) {
  return String(n).padStart(2, '0')
}

export class TestLoopLogger {
  constructor(baseDir) {
    this.baseDir = baseDir
    this.runId = new Date().toISOString().replace(/[:.]/g, '-')
    this.runDir = path.join(baseDir, this.runId)
    this.timeline = []
  }

  async init({ tab, source, appUrl, model, config }) {
    await mkdir(this.runDir, { recursive: true })
    const header = {
      run_id: this.runId,
      started_at: new Date().toISOString(),
      tab,
      source,
      app_url: appUrl,
      model,
      config: {
        maxFixDispatches: config.maxFixDispatches,
        minAssertionsPerSpec: config.minAssertionsPerSpec,
        browserAgentMaxTurns: config.browserAgentMaxTurns,
        headless: config.headless,
        pwTimeoutMs: config.pwTimeoutMs,
        workerModel: config.workerModel,
        workerAllowedTools: config.workerAllowedTools,
        workerPermissionMode: config.workerPermissionMode,
      },
    }
    await writeFile(
      path.join(this.runDir, 'run.json'),
      JSON.stringify(header, null, 2),
    )
    this.timeline.push({ at: new Date().toISOString(), type: 'start', ...header })
    return this.runDir
  }

  featureDir(featureId) {
    return path.join(this.runDir, `feature-${featureId}`)
  }

  async logBrowserEvidence(featureId, evidence, tag = 'initial') {
    const dir = this.featureDir(featureId)
    await mkdir(dir, { recursive: true })
    const fname =
      tag === 'initial'
        ? 'browser-evidence.json'
        : `browser-evidence.${tag}.json`
    await writeFile(
      path.join(dir, fname),
      JSON.stringify(evidence, null, 2),
    )
    this.timeline.push({
      at: new Date().toISOString(),
      type: 'browser_evidence',
      featureId,
      tag,
      status: evidence.status ?? null,
      turns: evidence.turns ?? null,
    })
  }

  async logMutationCheck(
    featureId,
    attemptNo,
    {
      task,
      workerSummary,
      saboteurSkipped,
      runAfterSabotage,
      runAfterRevert,
      loadBearing,
      failureReason,
    },
  ) {
    const dir = path.join(
      this.featureDir(featureId),
      `mutation-${pad(attemptNo)}`,
    )
    await mkdir(dir, { recursive: true })
    await writeFile(
      path.join(dir, 'result.json'),
      JSON.stringify(
        {
          saboteur_skipped: !!saboteurSkipped,
          run_after_sabotage: runAfterSabotage ?? null,
          run_after_revert: runAfterRevert ?? null,
          load_bearing: !!loadBearing,
          failure_reason: failureReason ?? null,
        },
        null,
        2,
      ),
    )
    const md = [
      `# Feature ${featureId} — mutation attempt ${pad(attemptNo)}`,
      '',
      '## Task to saboteur',
      '',
      task ?? '(none)',
      '',
      '## Saboteur summary',
      '',
      workerSummary ?? '(none)',
      '',
      `- saboteur_skipped: ${!!saboteurSkipped}`,
      `- after-sabotage runner: exit=${runAfterSabotage?.exitCode ?? 'n/a'} passed=${runAfterSabotage?.passed ?? 'n/a'}`,
      `- after-revert runner:   exit=${runAfterRevert?.exitCode ?? 'n/a'} passed=${runAfterRevert?.passed ?? 'n/a'}`,
      `- load_bearing:          ${!!loadBearing}`,
      failureReason ? `- failure_reason:        ${failureReason}` : '',
      '',
    ]
      .filter(Boolean)
      .join('\n')
    await writeFile(path.join(dir, 'worker.md'), md)

    this.timeline.push({
      at: new Date().toISOString(),
      type: 'mutation_check',
      featureId,
      attempt: attemptNo,
      load_bearing: !!loadBearing,
      saboteur_skipped: !!saboteurSkipped,
    })
  }

  async logAttempt(featureId, attemptNo, { task, workerSummary, specPath, runner }) {
    const dir = path.join(
      this.featureDir(featureId),
      `test-${pad(attemptNo)}`,
    )
    await mkdir(dir, { recursive: true })

    if (specPath) {
      try {
        await copyFile(specPath, path.join(dir, path.basename(specPath)))
      } catch {}
    }
    await writeFile(
      path.join(dir, 'runner.json'),
      JSON.stringify(runner ?? {}, null, 2),
    )
    const md = [
      `# Feature ${featureId} — attempt ${pad(attemptNo)}`,
      '',
      '## Task to worker',
      '',
      task ?? '(none)',
      '',
      '## Worker summary',
      '',
      workerSummary ?? '(none)',
      '',
      '## Runner',
      '',
      `- exit code: ${runner?.exitCode ?? 'n/a'}`,
      `- assertions counted: ${runner?.assertionCount ?? 'n/a'}`,
      `- passed: ${runner?.passed ?? 'n/a'}`,
      '',
    ].join('\n')
    await writeFile(path.join(dir, 'worker.md'), md)

    this.timeline.push({
      at: new Date().toISOString(),
      type: 'attempt',
      featureId,
      attempt: attemptNo,
      passed: runner?.passed ?? null,
      exitCode: runner?.exitCode ?? null,
      assertions: runner?.assertionCount ?? null,
    })
  }

  async logFeatureResult(featureId, result) {
    const dir = this.featureDir(featureId)
    await mkdir(dir, { recursive: true })
    await writeFile(
      path.join(dir, 'result.json'),
      JSON.stringify(result, null, 2),
    )
    this.timeline.push({
      at: new Date().toISOString(),
      type: 'feature_result',
      featureId,
      ...result,
    })
  }

  async finalize(summary) {
    this.timeline.push({ at: new Date().toISOString(), type: 'end', ...summary })
    const lines = [
      `# Test-loop run \`${this.runId}\``,
      '',
      '## Final summary',
      '',
      '```json',
      JSON.stringify(summary, null, 2),
      '```',
      '',
      '## Timeline',
      '',
      ...this.timeline.map((e) => {
        const { at, type, ...rest } = e
        return `- \`${at}\` **${type}** — \`${JSON.stringify(rest)}\``
      }),
      '',
    ]
    await writeFile(path.join(this.runDir, 'run.md'), lines.join('\n'))
    await writeFile(
      path.join(this.runDir, 'timeline.json'),
      JSON.stringify(this.timeline, null, 2),
    )
  }
}
