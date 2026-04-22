#!/usr/bin/env node
import 'dotenv/config'
import path from 'node:path'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const PLAYWRIGHT_MCP_CLI = path.join(PROJECT_ROOT, 'node_modules', '@playwright', 'mcp', 'cli.js')
const REPORT_DIR = path.join(PROJECT_ROOT, 'tests', 'reports')
const PROFILE_DIR = path.join(PROJECT_ROOT, 'tests', '.pw-profile-jira')

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7'
const MAX_TURNS_PER_CASE = Number(process.env.BOARD_MAX_TURNS_PER_CASE || 30)
const HEADLESS = process.env.HEADLESS === '1'

const TABS_DIR = path.join(PROJECT_ROOT, 'mcp', 'summary', 'tabs')
const TAB_FIXTURES = {
  board: {
    json: path.join(TABS_DIR, 'board.json'),
    url: 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status',
  },
  list: {
    json: path.join(TABS_DIR, 'list.json'),
    url: 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/list',
  },
  summary: {
    json: path.join(TABS_DIR, 'summary.json'),
    url: 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/summary',
  },
  calendar: {
    json: path.join(TABS_DIR, 'calendar.json'),
    url: 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/calendar',
  },
  timeline: {
    json: path.join(TABS_DIR, 'timeline.json'),
    url: 'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/timeline',
  },
}

function parseArgs(argv) {
  const args = { tab: null, json: null, url: null, only: null, skipPresence: false }

  for (const tab of Object.keys(TAB_FIXTURES)) {
    const envKey = `npm_config_${tab}`
    const val = process.env[envKey]
    if (val !== undefined && val !== 'false' && val !== '0') args.tab = tab
  }
  const npmTab = process.env.npm_config_tab
  if (npmTab) args.tab = npmTab

  for (const raw of argv) {
    if (raw.startsWith('--json=')) args.json = raw.slice(7)
    else if (raw.startsWith('--url=')) args.url = raw.slice(6)
    else if (raw.startsWith('--tab=')) args.tab = raw.slice(6)
    else if (raw.startsWith('--only=')) args.only = new Set(raw.slice(7).split(',').map((s) => s.trim()).filter(Boolean))
    else if (raw === '--skip-presence-only') args.skipPresence = true
    else if (raw.startsWith('--')) {
      const bare = raw.slice(2)
      if (TAB_FIXTURES[bare]) args.tab = bare
      else if (raw === '--help' || raw === '-h') {
        printHelp()
        process.exit(0)
      }
    }
  }

  if (!args.json) {
    const tab = args.tab
    if (!tab) {
      console.error('Pick a tab fixture. Example:')
      console.error('  npm run browser-test --board')
      console.error('  npm run browser-test -- --board')
      console.error('  npm run browser-test -- --tab=list')
      console.error('  npm run browser-test -- --json=./some/other.json --url=https://...')
      process.exit(2)
    }
    const fixture = TAB_FIXTURES[tab]
    if (!fixture) {
      console.error(`Unknown tab: ${tab}. Known: ${Object.keys(TAB_FIXTURES).join(', ')}`)
      process.exit(2)
    }
    args.json = fixture.json
    if (!args.url) args.url = fixture.url
  }
  if (!args.url) args.url = process.env.APP_URL || TAB_FIXTURES.board.url
  return args
}

function printHelp() {
  console.log(`Usage: npm run browser-test -- --<tab> [options]

Tab selectors (pick one):
  --board    --list    --summary    --calendar    --timeline
  --tab=<name>             same thing, explicit

Other options:
  --json=<path>            override fixture JSON path
  --url=<url>              override app URL
  --only=id1,id2           run only the named feature_checks
  --skip-presence-only     drop checks whose fixture status is "pass_presence_only"
  -h, --help               show this message

npm invocation notes:
  npm run browser-test --board         (npm turns --board into env var; supported)
  npm run browser-test -- --board      (explicit arg form; also supported)

Env:
  ANTHROPIC_API_KEY          required
  ANTHROPIC_MODEL            default: claude-opus-4-7
  APP_URL                    fallback URL if no --url and no tab default
  HEADLESS=1                 headless Chromium (default: headed, so first-run login works)
  BOARD_MAX_TURNS_PER_CASE   default: 30

Auth:
  Persistent Chromium profile lives at tests/.pw-profile-jira.
  Sign into Atlassian once on first run; every later run reuses the session.`)
}

function buildSystemPrompt(testCase, appUrl) {
  return `You are an automated QA agent verifying a single Jira Board feature in a real browser.

APP
- URL under test: ${appUrl}
- This is real Atlassian Jira. The browser profile persists; assume you are already signed in.
- If the page shows a login screen, mark status "BLOCKED" and stop.

TOOLS
- You only have browser_* tools from a Playwright MCP. Do not invent tools.
- Use browser_snapshot before clicking. Refs are tied to the latest snapshot for that tab.
- Use browser_evaluate only to read non-visible state (URL, localStorage) or to expand ARIA attributes.
- Do not reset or clear storage. Do not sign out.

METHODOLOGY
1. Navigate to the URL under test first (unless already there).
2. Read the feature and how_to_verify carefully. Perform the minimum interactions needed.
3. Collect direct evidence: a relevant snapshot fragment, visible text, URL, or element attribute.
4. If action_is_mutating is true:
   a. Perform the mutation and verify the expected post-state.
   b. Perform the reverted_by steps and verify the original state is restored.
   c. Both halves must succeed to mark PASS.
5. If you encounter the same error twice, stop and report partial/fail rather than thrashing.
6. You have at most ${MAX_TURNS_PER_CASE} tool-using turns. Budget accordingly.

SCORING (strict)
- "PASS"    = everything in how_to_verify (and reverted_by, if present) observed with direct evidence.
- "PARTIAL" = some observable sub-parts verified, others could not be (with a clear reason).
- "FAIL"    = feature is broken, missing, or contradicts the description.
- "BLOCKED" = could not even attempt (not signed in, app errored, etc.).

OUTPUT
When done, emit EXACTLY ONE fenced \`\`\`json block with the shape below and nothing after it:

{
  "id": "${testCase.id}",
  "status": "PASS" | "PARTIAL" | "FAIL" | "BLOCKED",
  "evidence": string,
  "revert_verified": boolean,
  "notes": string
}

"evidence" must quote concrete observations (element names, URL fragment, counts). Do not rely on prior knowledge.`
}

function buildUserMessage(testCase) {
  const payload = {
    id: testCase.id,
    feature: testCase.feature,
    how_to_verify: testCase.how_to_verify,
    ...(testCase.expect ? { expect: testCase.expect } : {}),
    ...(testCase.expect_url_contains ? { expect_url_contains: testCase.expect_url_contains } : {}),
    ...(testCase.expect_sections ? { expect_sections: testCase.expect_sections } : {}),
    ...(testCase.expect_radios ? { expect_radios: testCase.expect_radios } : {}),
    ...(testCase.default_checked ? { default_checked: testCase.default_checked } : {}),
    ...(testCase.expect_menu_items ? { expect_menu_items: testCase.expect_menu_items } : {}),
    ...(testCase.expect_fields ? { expect_fields: testCase.expect_fields } : {}),
    ...(testCase.expect_options ? { expect_options: testCase.expect_options } : {}),
    ...(testCase.expect_popover ? { expect_popover: testCase.expect_popover } : {}),
    ...(testCase.reverted_by ? { reverted_by: testCase.reverted_by } : {}),
    ...(testCase.action_is_mutating !== undefined ? { action_is_mutating: testCase.action_is_mutating } : {}),
    ...(testCase.notes ? { notes_from_fixture: testCase.notes } : {}),
  }
  return [
    'Verify this single feature check:',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    '',
    'Use only what you can observe in the live browser. Emit only the final JSON result block when done.',
  ].join('\n')
}

function toAnthropicTools(mcpTools) {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? '',
    input_schema: tool.inputSchema ?? { type: 'object', properties: {} },
  }))
}

function stringifyToolResult(result) {
  if (!result || !Array.isArray(result.content)) return JSON.stringify(result ?? {})
  return result.content
    .map((part) => (part.type === 'text' && typeof part.text === 'string' ? part.text : JSON.stringify(part)))
    .join('\n')
}

function extractFinalText(content) {
  return content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

function extractJsonBlock(text) {
  if (!text) return null
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenceMatch ? fenceMatch[1] : text
  try {
    return JSON.parse(candidate.trim())
  } catch {
    return null
  }
}

async function navigateHome(mcp, appUrl) {
  try {
    await mcp.callTool({ name: 'browser_navigate', arguments: { url: appUrl } })
  } catch (error) {
    console.error('  [setup] browser_navigate failed:', error instanceof Error ? error.message : error)
  }
}

async function runSingleCase(anthropic, tools, mcp, testCase, appUrl) {
  const label = `[${testCase.id}] ${testCase.feature}`
  console.log(`\n=== ${label} ===`)

  await navigateHome(mcp, appUrl)

  const messages = [{ role: 'user', content: buildUserMessage(testCase) }]
  const system = buildSystemPrompt(testCase, appUrl)
  let finalText = ''
  let turns = 0
  let stoppedForBudget = false

  while (turns < MAX_TURNS_PER_CASE) {
    turns += 1
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      tools,
      messages,
    })
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      finalText = extractFinalText(response.content)
      break
    }
    if (response.stop_reason !== 'tool_use') {
      finalText = extractFinalText(response.content) || `Stopped with reason: ${response.stop_reason}`
      break
    }

    const toolUses = response.content.filter((block) => block.type === 'tool_use')
    const toolResults = []
    for (const toolUse of toolUses) {
      process.stdout.write(`  [${testCase.id}] ${toolUse.name}\n`)
      try {
        const result = await mcp.callTool({ name: toolUse.name, arguments: toolUse.input ?? {} })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: stringifyToolResult(result),
          is_error: Boolean(result?.isError),
        })
      } catch (error) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: error instanceof Error ? error.message : String(error),
          is_error: true,
        })
      }
    }
    messages.push({ role: 'user', content: toolResults })
  }

  if (!finalText && turns >= MAX_TURNS_PER_CASE) {
    stoppedForBudget = true
    console.log(`  [${testCase.id}] turn budget reached; forcing final report`)
    messages.push({
      role: 'user',
      content:
        'Turn budget reached. Do not call any more tools. Output ONLY the final JSON result block described in the system prompt. If you could not finish verification, status="PARTIAL" with notes="turn budget exhausted".',
    })
    const forced = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages,
    })
    finalText = extractFinalText(forced.content) || '(no text output from model)'
  }

  const parsed = extractJsonBlock(finalText)
  const status = parsed?.status ?? 'FAIL'
  const result = {
    id: testCase.id,
    feature: testCase.feature,
    expected_status: testCase.status ?? null,
    status,
    evidence: parsed?.evidence ?? '',
    revert_verified: parsed?.revert_verified ?? null,
    notes: parsed?.notes ?? '',
    turns,
    stopped_for_budget: stoppedForBudget,
    raw: parsed ? undefined : finalText,
  }
  console.log(`  [${testCase.id}] -> ${status}`)
  return result
}

function pickCases(board, args) {
  const all = Array.isArray(board.feature_checks) ? board.feature_checks : []
  return all.filter((c) => {
    if (args.only && !args.only.has(c.id)) return false
    if (args.skipPresence && c.status === 'pass_presence_only') return false
    return true
  })
}

function printScorecard(report) {
  const pad = (s, n) => String(s).padEnd(n)
  const w = { id: 32, st: 9, exp: 9 }
  console.log('\n================= BOARD FEATURE SCORECARD =================')
  console.log(`${pad('id', w.id)}${pad('status', w.st)}${pad('expected', w.exp)}notes`)
  console.log('-'.repeat(90))
  for (const r of report.results) {
    const note = (r.notes || '').replace(/\s+/g, ' ').slice(0, 80)
    console.log(`${pad(r.id, w.id)}${pad(r.status, w.st)}${pad(r.expected_status || '-', w.exp)}${note}`)
  }
  console.log('-'.repeat(90))
  const s = report.summary
  console.log(
    `TOTALS   pass=${s.pass}  partial=${s.partial}  fail=${s.fail}  blocked=${s.blocked}  total=${s.total}  score=${s.score_pct}%  (pass+0.5*partial)/total`,
  )
  console.log(`OVERALL  ${s.overall}`)
  console.log('===========================================================')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTH_API_KEY
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY. Add it to .env and retry.')
    process.exit(1)
  }

  const boardRaw = await readFile(args.json, 'utf8')
  const board = JSON.parse(boardRaw)
  const cases = pickCases(board, args)
  if (cases.length === 0) {
    console.error('No feature_checks matched. Exiting.')
    process.exit(1)
  }
  console.log(`Running ${cases.length} feature check(s) from ${path.relative(PROJECT_ROOT, args.json)}`)
  console.log(`App URL: ${args.url}`)
  console.log(`Model:   ${MODEL}`)
  console.log(`Headed:  ${!HEADLESS}`)

  await mkdir(PROFILE_DIR, { recursive: true })
  await mkdir(REPORT_DIR, { recursive: true })

  const anthropic = new Anthropic({ apiKey })
  const mcp = new Client({ name: 'browser-test-agent', version: '1.0.0' })
  const mcpArgs = [PLAYWRIGHT_MCP_CLI, '--user-data-dir', PROFILE_DIR]
  if (HEADLESS) mcpArgs.push('--headless')
  const transport = new StdioClientTransport({ command: process.execPath, args: mcpArgs })
  await mcp.connect(transport)

  const { tools: mcpTools } = await mcp.listTools()
  const tools = toAnthropicTools(mcpTools)

  const startedAt = new Date().toISOString()
  const results = []

  try {
    for (const testCase of cases) {
      try {
        results.push(await runSingleCase(anthropic, tools, mcp, testCase, args.url))
      } catch (error) {
        console.error(`  [${testCase.id}] session error:`, error)
        results.push({
          id: testCase.id,
          feature: testCase.feature,
          expected_status: testCase.status ?? null,
          status: 'FAIL',
          evidence: '',
          revert_verified: null,
          notes: `Session error: ${error instanceof Error ? error.message : String(error)}`,
          turns: 0,
          stopped_for_budget: false,
        })
      }
    }
  } finally {
    await mcp.close().catch(() => {})
  }

  const finishedAt = new Date().toISOString()
  const tally = results.reduce(
    (acc, r) => {
      const k =
        r.status === 'PASS' ? 'pass' : r.status === 'PARTIAL' ? 'partial' : r.status === 'BLOCKED' ? 'blocked' : 'fail'
      acc[k] += 1
      return acc
    },
    { pass: 0, partial: 0, fail: 0, blocked: 0 },
  )
  const total = results.length
  const scorePct = total === 0 ? 0 : Math.round(((tally.pass + 0.5 * tally.partial) / total) * 1000) / 10
  const overall = tally.fail > 0 || tally.blocked > 0 ? 'red' : tally.partial > 0 ? 'yellow' : 'green'

  const report = {
    source_json: path.relative(PROJECT_ROOT, args.json),
    app_url: args.url,
    model: MODEL,
    started_at: startedAt,
    finished_at: finishedAt,
    results,
    summary: { ...tally, total, score_pct: scorePct, overall },
  }

  const reportPath = path.join(REPORT_DIR, `board-report-${startedAt.replace(/[:.]/g, '-')}.json`)
  await writeFile(reportPath, JSON.stringify(report, null, 2))

  printScorecard(report)
  console.log(`\nReport written to ${path.relative(PROJECT_ROOT, reportPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
