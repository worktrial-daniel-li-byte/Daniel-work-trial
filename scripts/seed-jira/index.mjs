#!/usr/bin/env node
/**
 * Jira seeding harness (plan + subagents, pattern 3).
 *
 * Rewritten on top of @anthropic-ai/claude-agent-sdk: each Jira tab is an
 * AgentDefinition with its own prompt, tool allowlist (Playwright MCP), and
 * per-task turn budget. The orchestrator iterates the plan and runs one
 * `query()` per task, selecting the right specialist via `options.agent`.
 *
 *   Planner       (plan.mjs, buildTasks)
 *     Reads seed/initial-state.json, emits per-tab tasks.
 *
 *   Subagents     (agents.mjs, AGENTS)
 *     AgentDefinition per tab: role prompt, Playwright tools, maxTurns, model.
 *
 *   Orchestrator  (this file)
 *     For each planned task:
 *       1. Pick the matching subagent.
 *       2. Hand it the items + the path to write its final report to.
 *       3. Stream SDK messages to stdout for live visibility.
 *       4. Read the written report, fold into the run-level scorecard.
 *
 * Safety:
 *   Default is dry-run (prints the plan, no SDK calls). Pass --execute to
 *   actually mutate Jira.
 *
 * Usage:
 *   npm run seed-jira                               # dry-run plan
 *   npm run seed-jira -- --execute                  # board + pages by default
 *   npm run seed-jira -- --execute --only=board     # one tab
 *   npm run seed-jira -- --execute --only=pages,approvals --headed
 *   npm run seed-jira -- --seed=path.json --space=XYZ --base=https://...
 */

import 'dotenv/config'
import path from 'node:path'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { query } from '@anthropic-ai/claude-agent-sdk'

import { buildTasks, loadSeed, DEFAULT_BASE_URL, DEFAULT_SEED_PATH } from './plan.mjs'
import { AGENTS, AGENT_IDS } from './agents.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const PLAYWRIGHT_MCP_CLI = path.join(PROJECT_ROOT, 'node_modules', '@playwright', 'mcp', 'cli.js')
const PROFILE_DIR = path.join(PROJECT_ROOT, 'tests', '.pw-profile-jira')
const REPORT_DIR = path.join(PROJECT_ROOT, 'tests', 'reports')

const DEFAULT_ONLY = new Set(['board', 'pages'])
const KNOWN_TASK_IDS = new Set(AGENT_IDS)

function parseArgs(argv) {
  const out = {
    seed: DEFAULT_SEED_PATH,
    base: DEFAULT_BASE_URL,
    space: 'AUT',
    only: null,
    execute: false,
    headed: false,
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
      '  --execute            Drive the browser and mutate Jira (default: dry-run)',
      '  --dry-run            Print the plan and exit',
      `  --only=a,b,c         Known ids: ${[...KNOWN_TASK_IDS].join(', ')}`,
      `                       Default: ${[...DEFAULT_ONLY].join(', ')}`,
      '  --seed=<path>        Seed JSON (default: seed/initial-state.json)',
      '  --space=<key>        Jira project key (default: AUT)',
      '  --base=<url>         Jira host',
      '  --headed             Show the Chromium window',
      '',
      'Env:',
      '  ANTHROPIC_API_KEY    or ANTH_API_KEY — required when --execute',
      '  ANTHROPIC_MODEL      optional; overrides subagent default',
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

function buildUserMessage(task, reportPath) {
  return [
    `Task id: ${task.id}`,
    `Target Jira tab: ${task.tab}`,
    `Target URL: ${task.target_url}`,
    '',
    `Goal: ${task.goal}`,
    '',
    'First, call browser_navigate with the target URL. Then iterate the items below in order, applying your tab hint from the system prompt.',
    '',
    `Items (${task.items.length}):`,
    '```json',
    JSON.stringify(task.items, null, 2),
    '```',
    '',
    `When done, write the final report JSON to exactly this absolute path:`,
    `  ${reportPath}`,
    '',
    'After writing the file, end your turn without calling any more tools.',
  ].join('\n')
}

function buildPlaywrightMcpServer({ headed }) {
  const args = [PLAYWRIGHT_MCP_CLI, '--user-data-dir', PROFILE_DIR]
  if (!headed) args.push('--headless')
  return {
    type: 'stdio',
    command: process.execPath,
    args,
  }
}

function shortToolArgs(input) {
  if (!input || typeof input !== 'object') return ''
  const parts = []
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string') {
      parts.push(`${k}=${v.length > 40 ? v.slice(0, 37) + '…' : v}`)
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      parts.push(`${k}=${v}`)
    }
    if (parts.length >= 2) break
  }
  return parts.join(' ')
}

function extractToolUses(message) {
  const content = message?.message?.content
  if (!Array.isArray(content)) return []
  return content.filter((block) => block?.type === 'tool_use')
}

async function runTask({ task, args, runStamp, log }) {
  const reportPath = path.join(
    REPORT_DIR,
    'seed-jira-tasks',
    `${runStamp}-${task.id}.json`,
  )
  await mkdir(path.dirname(reportPath), { recursive: true })
  // If a stale report exists at this path, remove it so a missing report
  // after the run means the agent never wrote one.
  await rm(reportPath, { force: true }).catch(() => {})

  log(`\n=== [${task.id}] ${task.tab} (${task.items.length} item${task.items.length === 1 ? '' : 's'}) ===`)

  const startedAt = Date.now()
  let turnsSeen = 0
  let finalResult = null

  const stream = query({
    prompt: buildUserMessage(task, reportPath),
    options: {
      agent: task.id,
      agents: AGENTS,
      mcpServers: {
        playwright: buildPlaywrightMcpServer({ headed: args.headed }),
      },
      permissionMode: 'bypassPermissions',
      settingSources: [],
    },
  })

  try {
    for await (const message of stream) {
      if (message.type === 'assistant') {
        const toolUses = extractToolUses(message)
        for (const t of toolUses) {
          turnsSeen += 1
          const suffix = shortToolArgs(t.input)
          log(`  [${task.id} t${turnsSeen}] ${t.name}${suffix ? '  ' + suffix : ''}`)
        }
      } else if (message.type === 'result') {
        finalResult = message
      }
    }
  } catch (err) {
    log(`  [${task.id}] stream error: ${err?.message || err}`)
  }

  let report = null
  try {
    report = JSON.parse(await readFile(reportPath, 'utf8'))
  } catch {
    report = null
  }

  const summary = {
    task_id: task.id,
    tab: task.tab,
    status: report?.status || (finalResult?.is_error ? 'FAIL' : 'PARTIAL'),
    created_count: Array.isArray(report?.created) ? report.created.length : 0,
    skipped_count: Array.isArray(report?.skipped) ? report.skipped.length : 0,
    failed_count: Array.isArray(report?.failed) ? report.failed.length : 0,
    num_turns: finalResult?.num_turns ?? turnsSeen,
    duration_ms: Date.now() - startedAt,
    cost_usd: finalResult?.total_cost_usd ?? null,
    stop_reason: finalResult?.stop_reason ?? null,
    report_path: reportPath,
    report,
  }

  log(
    `  [${task.id}] -> ${summary.status}  created=${summary.created_count}  skipped=${summary.skipped_count}  failed=${summary.failed_count}  turns=${summary.num_turns}  cost=$${(summary.cost_usd ?? 0).toFixed(3)}`,
  )

  return summary
}

function printScorecard(results) {
  const pad = (s, n) => String(s).padEnd(n)
  console.log('\n================= SEED SCORECARD =================')
  console.log(
    `${pad('task', 14)}${pad('status', 10)}${pad('ok', 5)}${pad('skip', 6)}${pad('fail', 6)}${pad('turns', 7)}cost`,
  )
  console.log('-'.repeat(64))
  let totalCost = 0
  const total = { created: 0, skipped: 0, failed: 0 }
  for (const r of results) {
    total.created += r.created_count
    total.skipped += r.skipped_count
    total.failed += r.failed_count
    totalCost += r.cost_usd || 0
    console.log(
      `${pad(r.task_id, 14)}${pad(r.status, 10)}${pad(r.created_count, 5)}${pad(r.skipped_count, 6)}${pad(r.failed_count, 6)}${pad(r.num_turns, 7)}$${(r.cost_usd || 0).toFixed(3)}`,
    )
  }
  console.log('-'.repeat(64))
  console.log(
    `TOTALS  created=${total.created}  skipped=${total.skipped}  failed=${total.failed}  cost=$${totalCost.toFixed(3)}`,
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
    console.error(`Plan is empty. Known ids: ${[...KNOWN_TASK_IDS].join(', ')}`)
    process.exit(2)
  }

  printPlan(tasks, args)

  if (!args.execute) {
    console.log('\n(dry-run — pass --execute to actually drive Jira via subagents)')
    process.exit(0)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTH_API_KEY
  if (!apiKey) {
    console.error('\nMissing ANTHROPIC_API_KEY / ANTH_API_KEY. Add it to .env and retry.')
    process.exit(1)
  }
  // Claude Agent SDK reads ANTHROPIC_API_KEY; alias if the user set ANTH_API_KEY.
  if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = apiKey

  console.log(
    `\nLaunching Agent SDK  headed=${args.headed}  subagents=${Object.keys(AGENTS).join(',')}`,
  )

  const runStamp = new Date().toISOString().replace(/[:.]/g, '-')
  const results = []
  for (const task of tasks) {
    const summary = await runTask({ task, args, runStamp, log: (msg) => console.log(msg) })
    results.push(summary)
  }

  printScorecard(results)

  await mkdir(REPORT_DIR, { recursive: true })
  const runReportPath = path.join(REPORT_DIR, `seed-jira-${runStamp}.json`)
  await writeFile(
    runReportPath,
    JSON.stringify(
      { started_at_stamp: runStamp, finished_at: new Date().toISOString(), args, results },
      null,
      2,
    ) + '\n',
    'utf8',
  )
  console.log(`\nreport: ${path.relative(PROJECT_ROOT, runReportPath)}`)

  const anyFail = results.some((r) => r.status === 'FAIL' || r.status === 'BLOCKED')
  process.exit(anyFail ? 1 : 0)
}

main().catch((err) => {
  console.error('seed harness crashed:', err?.stack || err?.message || err)
  process.exit(1)
})
