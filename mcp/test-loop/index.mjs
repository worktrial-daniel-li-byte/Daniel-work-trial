#!/usr/bin/env node
/**
 * Browser-verified test-writer loop (real Jira edition).
 *
 *   BrowserAgent      (Playwright MCP + Claude): verifies each feature_check
 *                     live on real Jira and emits structured evidence.
 *   Test-writer       (claude -p): invoked when the browser agent reports
 *     worker          PASS. Writes tests/<tab>/<id>.spec.mjs. The runner
 *                     executes it (`npx playwright test`) and counts
 *                     `expect(…)` calls; failures resume the writer with
 *                     the stdout/stderr attached, up to MAX_FIX_DISPATCHES.
 *
 * Non-PASS browser verdicts (PARTIAL / FAIL / BLOCKED) are recorded and
 * skipped — they're part of the reward signal, not a reason to retry.
 *
 * Usage:
 *   node mcp/test-loop/index.mjs                 (defaults to --board)
 *   node mcp/test-loop/index.mjs --board
 *   node mcp/test-loop/index.mjs --tab=board --only=page.load,toolbar.search.present
 *   node mcp/test-loop/index.mjs --json=./mcp/summary/tabs/board.json --url=https://...
 *
 *   --board | --list | --summary | --calendar | --timeline
 *   --tab=<name>              explicit tab selector
 *   --json=<path>             override tab JSON path
 *   --url=<url>               override live URL (default = live Jira)
 *   --only=id1,id2            run only the named feature_checks
 *   --skip-presence-only      drop checks whose fixture status is "pass_presence_only"
 *   --help, -h
 */

import path from 'node:path'
import { readFile } from 'node:fs/promises'

import { config, repoRoot, tabsDir } from './config.mjs'
import { TestLoopLogger } from './logger.mjs'
import { runTestLoop } from './verifier.mjs'

const TAB_URLS = {
  board:
    'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status',
  list: 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/list',
  summary:
    'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/summary',
  calendar:
    'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar',
  timeline:
    'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/timeline',
}

function printHelp() {
  console.log(
    `Usage: node mcp/test-loop/index.mjs [--<tab>] [options]\n\n` +
      `Tab selectors (default: --board):\n` +
      `  --board    --list    --summary    --calendar    --timeline\n` +
      `  --tab=<name>              explicit tab selector\n\n` +
      `Options:\n` +
      `  --json=<path>             override tab JSON path\n` +
      `  --url=<url>               override live URL\n` +
      `  --only=id1,id2            run only the named feature_checks\n` +
      `  --skip-presence-only      drop checks whose fixture status is "pass_presence_only"\n` +
      `  --help, -h                show this message\n\n` +
      `Branching per feature:\n` +
      `  browser-verify  →  PASS                     → test-writer sub-loop\n` +
      `                                                (spec must go green with\n` +
      `                                                 ≥ MIN_ASSERTIONS_PER_SPEC\n` +
      `                                                 expect() calls)\n` +
      `  browser-verify  →  PARTIAL / FAIL / BLOCKED → record & skip\n\n` +
      `Env (see mcp/test-loop/config.mjs for the full list):\n` +
      `  ANTHROPIC_API_KEY / ANTH_API_KEY   required\n` +
      `  MAX_FIX_DISPATCHES                 default 3 (test-writer retries)\n` +
      `  MIN_ASSERTIONS_PER_SPEC            default 2\n` +
      `  MUTATION_CHECK=1                   enable saboteur/revert step (only\n` +
      `                                     useful when specs target your local\n` +
      `                                     clone, not real Jira; off by default)\n` +
      `  BROWSER_AGENT_MAX_TURNS            default 30\n` +
      `  TEST_LOOP_HEADLESS=1               headless Chromium\n`,
  )
}

function parseArgs(argv) {
  const out = {
    tab: null,
    json: null,
    url: null,
    only: null,
    skipPresenceOnly: false,
    help: false,
  }
  for (const raw of argv) {
    if (raw === '--help' || raw === '-h') out.help = true
    else if (raw.startsWith('--json=')) out.json = raw.slice('--json='.length)
    else if (raw.startsWith('--url=')) out.url = raw.slice('--url='.length)
    else if (raw.startsWith('--tab=')) out.tab = raw.slice('--tab='.length)
    else if (raw.startsWith('--only=')) {
      out.only = new Set(
        raw
          .slice('--only='.length)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
    } else if (raw === '--skip-presence-only') out.skipPresenceOnly = true
    else if (raw.startsWith('--')) {
      const bare = raw.slice(2)
      if (TAB_URLS[bare]) out.tab = bare
      else {
        console.error(`unknown flag: ${raw}`)
        process.exit(2)
      }
    }
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }

  // Resolve the tab + JSON path. Default to the board tab.
  const tab =
    args.tab ??
    (args.json
      ? path.basename(args.json).replace(/\.json$/i, '')
      : 'board')
  const jsonPath = args.json ?? path.join(tabsDir, `${tab}.json`)
  const appUrl = args.url ?? TAB_URLS[tab] ?? null
  if (!appUrl) {
    console.error(
      `No URL available for tab '${tab}'. Pass --url=... explicitly.`,
    )
    process.exit(2)
  }

  let tabJson
  try {
    tabJson = JSON.parse(await readFile(jsonPath, 'utf8'))
  } catch (err) {
    console.error(`Failed to read tab JSON at ${jsonPath}: ${err?.message ?? err}`)
    process.exit(1)
  }

  const logger = new TestLoopLogger(path.join(repoRoot, 'logs', 'functionality'))
  await logger.init({
    tab,
    source: path.relative(repoRoot, jsonPath),
    appUrl,
    model: config.model,
    config,
  })
  console.log(`logs: ${logger.runDir}`)

  const summary = await runTestLoop({
    tabJson,
    tab,
    appUrl,
    only: args.only,
    skipPresenceOnly: args.skipPresenceOnly,
    logger,
  })

  console.log('\n──── final scorecard ────')
  const pad = (s, n) => String(s).padEnd(n)
  console.log(
    `${pad('id', 34)}${pad('status', 16)}${pad('test', 6)}${pad('mutation', 14)}spec`,
  )
  console.log('-'.repeat(140))
  for (const r of summary.results) {
    const mut =
      r.mutation_checked === false
        ? 'off'
        : r.mutation_saboteur_skipped
          ? 'skipped'
          : r.load_bearing === true
            ? 'load-bearing'
            : r.load_bearing === false
              ? 'NOT-LB'
              : '-'
    console.log(
      `${pad(r.id, 34)}${pad(r.status, 16)}${pad(String(r.test_attempts ?? 0), 6)}${pad(mut, 14)}${r.spec}`,
    )
  }
  console.log('-'.repeat(140))
  const s = summary.summary
  console.log(
    `TOTALS   pass=${s.passed}  test_failed=${s.failed}  ` +
      `verify_failed=${s.verify_failed ?? 0}  blocked=${s.blocked ?? 0}  total=${s.total}`,
  )

  await logger.finalize({
    stopReason: summary.stopReason,
    counts: summary.summary,
    results: summary.results.map((r) => ({
      id: r.id,
      status: r.status,
      phase: r.phase ?? null,
      test_attempts: r.test_attempts ?? 0,
      browser_status: r.browser_status ?? null,
      load_bearing: r.load_bearing ?? null,
      mutation_saboteur_skipped: r.mutation_saboteur_skipped ?? null,
      mutation_failure_reason: r.mutation_failure_reason ?? null,
      spec: r.spec,
    })),
  })
  console.log(`\nlogs written to: ${logger.runDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
