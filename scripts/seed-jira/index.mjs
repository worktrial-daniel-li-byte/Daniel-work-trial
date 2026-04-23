#!/usr/bin/env node
/**
 * Jira seeding harness (plan + spawn).
 *
 * Reads seed/initial-state.json, cuts it into per-tab tasks, then runs each
 * task as a Claude + Playwright-MCP browser agent against your real Atlassian
 * instance. Reuses the persistent Chromium profile at tests/.pw-profile-jira
 * (the same one browser-test / capture use) so no re-auth is required.
 *
 * Shape mirrors mcp/loop and scripts/capture:
 *
 *   Planner      (plan.mjs, buildTasks)
 *     Groups seed items by tab (board, pages, forms, approvals, attachments)
 *     into one task each, with a goal + items list.
 *
 *   Orchestrator (this file)
 *     Launches one Playwright MCP subprocess, iterates tasks, dispatches each
 *     to a sub-agent. Prints a scorecard and writes a run report to disk.
 *
 *   Sub-agent    (agent.mjs, runSeedTask)
 *     One Claude turn loop per task, given browser_* tools and the items to
 *     create. Reports created / skipped / failed as structured JSON.
 *
 * Safety:
 *   By default, this runs in --dry-run mode (prints the plan, no browser
 *   launch, no Claude calls). Pass --execute to actually mutate Jira.
 *
 * Usage:
 *   npm run seed-jira                         # dry-run plan
 *   npm run seed-jira -- --execute            # write the default set
 *   npm run seed-jira -- --execute --only=pages,forms
 *   npm run seed-jira -- --execute --headed   # watch it run
 *   npm run seed-jira -- --seed=path/to.json --space=AUT --base=https://...
 */

import 'dotenv/config'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import { buildTasks, loadSeed, DEFAULT_BASE_URL, DEFAULT_SEED_PATH } from './plan.mjs'
import { runSeedTask } from './agent.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const PLAYWRIGHT_MCP_CLI = path.join(PROJECT_ROOT, 'node_modules', '@playwright', 'mcp', 'cli.js')
const PROFILE_DIR = path.join(PROJECT_ROOT, 'tests', '.pw-profile-jira')
const REPORT_DIR = path.join(PROJECT_ROOT, 'tests', 'reports')

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7'
// Default to the tabs we've confirmed exist on the live space. (Forms, approvals,
// and attachments are opt-in via --only — forms redirected to /not-found during
// capture, and attachments/approvals require file uploads or per-card navigation.)
const DEFAULT_ONLY = new Set(['board', 'pages'])
const KNOWN_TASK_IDS = new Set(['board', 'pages', 'forms', 'approvals', 'attachments'])

function parseArgs(argv) {
  const out = {
    seed: DEFAULT_SEED_PATH,
    base: DEFAULT_BASE_URL,
    space: 'AUT',
    only: null,
    execute: false,
    headed: false,
    maxTurns: Number(process.env.SEED_MAX_TURNS || 60),
    help: false,
  }
  for (const raw of argv) {
    if (raw === '--help' || raw === '-h') out.help = true
    else if (raw === '--execute' || raw === '--run') out.execute = true
    else if (raw === '--dry-run') out.execute = false
    else if (raw === '--headed') out.headed = true
    else if (raw.startsWith('--seed=')) out.seed = path.resolve(raw.slice('--seed='.length))
    else if (raw.startsWith('--space=')) out.space = raw.slice('--space='.length)
    else if (raw.startsWith('--base=')) out.base = raw.slice('--base='.length).replace(/\/$/, '')
    else if (raw.startsWith('--max-turns=')) out.maxTurns = Number(raw.slice('--max-turns='.length))
    else if (raw.startsWith('--only=')) {
      out.only = new Set(
        raw.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean),
      )
    } else if (raw.startsWith('--')) {
      console.error(`unknown flag: ${raw}`)
      process.exit(2)
    }
  }
  if (!out.only) out.only = new Set(DEFAULT_ONLY)
  for (const id of out.only) {
    if (!KNOWN_TASK_IDS.has(id)) {
      console.error(`--only contains unknown task id "${id}". Known: ${[...KNOWN_TASK_IDS].join(', ')}`)
      process.exit(2)
    }
  }
  return out
}

function printHelp() {
  console.log(
    [
      'Usage: npm run seed-jira -- [flags]',
      '',
      'Flags:',
      '  --execute             Actually drive the browser and mutate Jira (default: dry-run)',
      '  --dry-run             Print the plan and exit (default behaviour)',
      '  --only=a,b,c          Which tasks to include. Known ids:',
      `                        ${[...KNOWN_TASK_IDS].join(', ')}`,
      `                        Default: ${[...DEFAULT_ONLY].join(', ')}`,
      '  --seed=<path>         Seed JSON (default: seed/initial-state.json)',
      '  --space=<key>         Jira project key (default: AUT)',
      '  --base=<url>          Jira host (default: https://fleet-team-y0ak1u2s.atlassian.net)',
      '  --headed              Show the browser window (easier debugging)',
      '  --max-turns=<n>       Turn budget per task (default: 60, or SEED_MAX_TURNS env)',
      '',
      'Env:',
      '  ANTHROPIC_API_KEY     or ANTH_API_KEY — required when --execute',
      '  ANTHROPIC_MODEL       default: claude-opus-4-7',
    ].join('\n'),
  )
}

function printPlan(tasks, args) {
  console.log(`Seed plan  space=${args.space}  base=${args.base}`)
  console.log(`seed: ${path.relative(PROJECT_ROOT, args.seed)}`)
  console.log(`tasks: ${tasks.length}  (only=${[...args.only].join(',')})`)
  for (const t of tasks) {
    console.log(`\n  • ${t.id.padEnd(12)} ${t.tab}  →  ${t.target_url}`)
    console.log(`      goal: ${t.goal}`)
    console.log(`      items (${t.items.length}):`)
    for (const it of t.items.slice(0, 5)) {
      const label =
        it.summary || it.name || it.title || it.work_item || it.filename || JSON.stringify(it).slice(0, 60)
      console.log(`        - ${label}`)
    }
    if (t.items.length > 5) console.log(`        … +${t.items.length - 5} more`)
  }
}

async function connectPlaywrightMcp({ headed }) {
  const mcp = new Client({ name: 'seed-jira-agent', version: '1.0.0' })
  const mcpArgs = [PLAYWRIGHT_MCP_CLI, '--user-data-dir', PROFILE_DIR]
  if (!headed) mcpArgs.push('--headless')
  const transport = new StdioClientTransport({ command: process.execPath, args: mcpArgs })
  await mcp.connect(transport)
  const { tools } = await mcp.listTools()
  return { mcp, tools }
}

function printScorecard(results) {
  const pad = (s, n) => String(s).padEnd(n)
  console.log('\n================= SEED SCORECARD =================')
  console.log(`${pad('task', 14)}${pad('status', 10)}${pad('ok', 5)}${pad('skip', 6)}${pad('fail', 6)}turns`)
  console.log('-'.repeat(60))
  for (const r of results) {
    console.log(
      `${pad(r.task_id, 14)}${pad(r.status, 10)}${pad(r.created_count, 5)}${pad(
        r.skipped_count,
        6,
      )}${pad(r.failed_count, 6)}${r.turns}${r.budget_reached ? '*' : ''}`,
    )
  }
  console.log('-'.repeat(60))
  const total = results.reduce(
    (acc, r) => ({
      created: acc.created + r.created_count,
      skipped: acc.skipped + r.skipped_count,
      failed: acc.failed + r.failed_count,
    }),
    { created: 0, skipped: 0, failed: 0 },
  )
  console.log(
    `TOTALS  created=${total.created}  skipped=${total.skipped}  failed=${total.failed}  (* = hit turn budget)`,
  )
  console.log('==================================================')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const seed = await loadSeed(args.seed)
  const tasks = buildTasks(seed, { baseUrl: args.base, spaceKey: args.space }).filter((t) =>
    args.only.has(t.id),
  )

  if (tasks.length === 0) {
    console.error(`Plan is empty. Check --only against known ids: ${[...KNOWN_TASK_IDS].join(', ')}`)
    process.exit(2)
  }

  printPlan(tasks, args)

  if (!args.execute) {
    console.log('\n(dry-run — pass --execute to actually run these agents against Jira)')
    process.exit(0)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTH_API_KEY
  if (!apiKey) {
    console.error('\nMissing ANTHROPIC_API_KEY / ANTH_API_KEY. Add it to .env and retry.')
    process.exit(1)
  }

  console.log(
    `\nConnecting to Playwright MCP  headed=${args.headed}  model=${MODEL}  max_turns=${args.maxTurns}`,
  )
  const anthropic = new Anthropic({ apiKey })
  const { mcp, tools: mcpTools } = await connectPlaywrightMcp({ headed: args.headed })

  const startedAt = new Date().toISOString()
  const results = []
  try {
    for (const task of tasks) {
      const summary = await runSeedTask({
        anthropic,
        model: MODEL,
        mcp,
        mcpTools,
        task,
        maxTurns: args.maxTurns,
        log: (msg) => console.log(msg),
      })
      results.push(summary)
    }
  } finally {
    await mcp.close().catch(() => {})
  }

  printScorecard(results)

  await mkdir(REPORT_DIR, { recursive: true })
  const reportPath = path.join(REPORT_DIR, `seed-jira-${startedAt.replace(/[:.]/g, '-')}.json`)
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        args,
        results,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  )
  console.log(`\nreport: ${path.relative(PROJECT_ROOT, reportPath)}`)

  const anyFail = results.some((r) => r.status === 'FAIL' || r.status === 'BLOCKED')
  process.exit(anyFail ? 1 : 0)
}

main().catch((err) => {
  console.error('seed harness crashed:', err?.stack || err?.message || err)
  process.exit(1)
})
