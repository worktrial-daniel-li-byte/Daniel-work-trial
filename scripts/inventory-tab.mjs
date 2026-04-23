#!/usr/bin/env node
/**
 * Inventory-Tab agent.
 *
 * Drives a Playwright-MCP-powered Claude agent against a live Jira tab and
 * writes a feature_checks manifest to `mcp/summary/tabs/<tab>.json` in the
 * same schema as the hand-authored `board.json`. The downstream consumers
 * (`npm run browser-test -- --<tab>` and `npm run unit-test-writer -- --<tab>`)
 * can then run against the generated manifest.
 *
 * This is the agent that `presentation.md` describes at lines 108-110 but
 * that was never actually checked in.
 *
 * Usage:
 *   node scripts/inventory-tab.mjs --calendar
 *   node scripts/inventory-tab.mjs --tab=list --max-turns=40
 *   node scripts/inventory-tab.mjs --tab=timeline --url=https://.../timeline \
 *       --out=mcp/summary/tabs/timeline.json --dry-run
 *
 * Flags:
 *   --board | --list | --summary | --calendar | --timeline
 *   --tab=<name>            explicit tab selector
 *   --url=<url>             override live URL
 *   --out=<path>            override output path (default mcp/summary/tabs/<tab>.json)
 *   --max-turns=<n>         MCP turns for the agent (default 45)
 *   --headed                show the browser window (default headless)
 *   --dry-run               print the generated JSON to stdout, don't write
 *   --help, -h
 *
 * Env:
 *   ANTHROPIC_API_KEY / ANTH_API_KEY   required
 *   ANTHROPIC_MODEL / CLAUDE_MODEL     default claude-opus-4-7
 */

import 'dotenv/config'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const PLAYWRIGHT_MCP_CLI = path.join(
  PROJECT_ROOT,
  'node_modules',
  '@playwright',
  'mcp',
  'cli.js',
)
const PROFILE_DIR = path.join(PROJECT_ROOT, 'tests', '.pw-profile-jira')
const TABS_DIR = path.join(PROJECT_ROOT, 'mcp', 'summary', 'tabs')

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

const SPACE_KEY = 'AUT'
const SPACE_NAME = 'Autoloop'

function printHelp() {
  console.log(`Usage: node scripts/inventory-tab.mjs --<tab> [options]

Tabs (pick one): --board --list --summary --calendar --timeline
                 --tab=<name> for any other Jira-like path.

Options:
  --url=<url>           override live URL
  --out=<path>          override output path
  --max-turns=<n>       default 45
  --headed              show the browser window
  --dry-run             print JSON to stdout, don't write

Env:
  ANTHROPIC_API_KEY / ANTH_API_KEY    required
  ANTHROPIC_MODEL / CLAUDE_MODEL      default claude-opus-4-7`)
}

function parseArgs(argv) {
  const out = {
    tab: null,
    url: null,
    outPath: null,
    maxTurns: Number(process.env.INVENTORY_MAX_TURNS ?? 45),
    headed: false,
    dryRun: false,
    help: false,
  }
  for (const raw of argv) {
    if (raw === '--help' || raw === '-h') out.help = true
    else if (raw === '--headed') out.headed = true
    else if (raw === '--dry-run') out.dryRun = true
    else if (raw.startsWith('--tab=')) out.tab = raw.slice('--tab='.length)
    else if (raw.startsWith('--url=')) out.url = raw.slice('--url='.length)
    else if (raw.startsWith('--out=')) out.outPath = raw.slice('--out='.length)
    else if (raw.startsWith('--max-turns='))
      out.maxTurns = Number(raw.slice('--max-turns='.length))
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

function buildSystemPrompt({ tab, appUrl, maxTurns }) {
  return `You are an automated UI inventory agent cataloguing the durable features of one Jira tab in a real browser.

APP
- URL under test: ${appUrl}
- Tab name: ${tab}
- Space key: ${SPACE_KEY} ("${SPACE_NAME}")
- This is real Atlassian Jira. The browser profile persists; assume you are already signed in.
- If the page shows a login screen, emit the JSON skeleton below with feature_checks=[] and notes="BLOCKED: not signed in".

TOOLS
- You have browser_* tools from a Playwright MCP. Do not invent tools.
- Always call browser_snapshot first after navigation. Refs are tied to the latest snapshot.
- Open popovers, menus, and panels to enumerate their contents, then close them.
- Do NOT perform mutating actions that you can't cleanly revert. For anything mutating you only need presence evidence; do not actually submit create/delete forms.
- Do not sign out or clear storage.

GOAL
Produce a JSON manifest describing every durable UI feature of this tab — toolbar controls, columns, cards, side panels, popovers, menus, etc. The manifest will later feed two downstream agents:
  1. A per-feature verifier (opens each feature live, produces PASS/FAIL evidence).
  2. A test-writer (emits a @playwright/test spec that asserts the feature.)

Think of the output as "what assertions should a future spec make to prove this feature exists?" Each entry must be verifiable with role+name snapshots, visible text, URL substrings, or element attributes — NOT by vibes.

METHODOLOGY
1. Navigate to the URL. Take a snapshot.
2. Scan the toolbar left-to-right, then the main content region, then any side panels.
3. For each distinct feature:
   a. Capture its ARIA role + accessible name (preferred locator).
   b. If it opens a popover/menu, click it, snapshot the contents, list the items, then close it.
   c. If it has natural defaults (e.g. "Group by Status"), record them.
4. Keep going until you've covered the visible surface. You have up to ${maxTurns} turns.
5. When done, emit EXACTLY ONE fenced \`\`\`json block with the schema below and nothing after it.

SCHEMA (match board.json exactly — same keys, same casing)
\`\`\`json
{
  "tab": "<Tab Name>",
  "url": "/jira/core/projects/{key}/<path>",
  "page_title": "<Tab> - {Space name} - Jira",
  "purpose": "<one-sentence description of what this tab is for>",
  "verified_against": {
    "space_key": "${SPACE_KEY}",
    "fixture_card": "<e.g. AUT-1 'This is a test'>",
    "capture_method": "scripts/inventory-tab.mjs (Playwright MCP, live Jira)"
  },
  "feature_checks": [
    {
      "id": "<dotted.id>",
      "feature": "<one-line description>",
      "how_to_verify": "<concrete observable steps a verifier can perform>",
      "expect": "<optional: literal expectation string>",
      "expect_url_contains": "<optional>",
      "expect_sections": ["..."],
      "expect_menu_items": ["..."],
      "expect_fields": ["..."],
      "expect_options": ["..."],
      "default_checked": "<optional>",
      "reverted_by": "<optional: steps that undo a mutating action>",
      "action_is_mutating": false,
      "notes": "<optional caveats>",
      "status": "pass" | "pass_presence_only" | "partial" | "not_executed"
    }
  ],
  "known_gaps": ["<caveat>", ...],
  "mutation_runbook": [
    { "scenario": "<name>", "steps": ["...", "..."] }
  ]
}
\`\`\`

ID CONVENTION
- dotted, lowercase, kebab-safe segments
- group by surface: \`toolbar.*\`, \`columns.*\`, \`card.*\`, \`grid.*\`, \`<panel>.*\`
- example ids from the board tab: \`page.load\`, \`toolbar.search.present\`, \`toolbar.filter.panel\`, \`card.actions_menu\`

STATUS RULES
- \`pass\`             = fully observable with live interactions.
- \`pass_presence_only\` = observed in the snapshot but not exercised (e.g. mutating submit buttons).
- \`partial\`          = partially observable (note what was missing).
- \`not_executed\`     = spec-worthy but you couldn't drive it (e.g. drag-and-drop).

OUTPUT
End with one fenced JSON block. Do not print any commentary after it. Aim for 10-25 feature_checks (enough to cover the surface, not exhaustive).`
}

function toAnthropicTools(mcpTools) {
  return mcpTools.map((t) => ({
    name: t.name,
    description: t.description ?? '',
    input_schema: t.inputSchema ?? { type: 'object', properties: {} },
  }))
}

function stringifyToolResult(result) {
  if (!result || !Array.isArray(result.content)) {
    return JSON.stringify(result ?? {})
  }
  return result.content
    .map((p) =>
      p.type === 'text' && typeof p.text === 'string'
        ? p.text
        : JSON.stringify(p),
    )
    .join('\n')
}

function extractText(content) {
  return content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
}

function extractJsonBlock(text) {
  if (!text) return null
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence ? fence[1] : text
  try {
    return JSON.parse(candidate.trim())
  } catch {
    return null
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }
  if (!args.tab) {
    console.error('Pick a tab: --calendar, --board, --list, --summary, --timeline, or --tab=<name>')
    process.exit(2)
  }
  const appUrl = args.url ?? TAB_URLS[args.tab]
  if (!appUrl) {
    console.error(`No URL for tab '${args.tab}'. Pass --url=... explicitly.`)
    process.exit(2)
  }
  const outPath =
    args.outPath ?? path.join(TABS_DIR, `${args.tab}.json`)

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTH_API_KEY
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY (or ANTH_API_KEY).')
    process.exit(1)
  }
  const model =
    process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-opus-4-7'

  await mkdir(PROFILE_DIR, { recursive: true })
  await mkdir(path.dirname(outPath), { recursive: true })

  console.log(`[inventory] tab=${args.tab}`)
  console.log(`[inventory] url=${appUrl}`)
  console.log(`[inventory] model=${model}`)
  console.log(`[inventory] out=${path.relative(PROJECT_ROOT, outPath)}${args.dryRun ? '  (DRY RUN)' : ''}`)
  console.log(`[inventory] max_turns=${args.maxTurns}  headed=${args.headed}`)

  const mcpArgs = [PLAYWRIGHT_MCP_CLI, '--user-data-dir', PROFILE_DIR]
  if (!args.headed) mcpArgs.push('--headless')
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: mcpArgs,
  })
  const mcp = new Client({ name: 'inventory-tab-agent', version: '1.0.0' })
  await mcp.connect(transport)
  const { tools: mcpTools } = await mcp.listTools()
  const tools = toAnthropicTools(mcpTools)
  const anthropic = new Anthropic({ apiKey })

  try {
    await mcp.callTool({ name: 'browser_navigate', arguments: { url: appUrl } })
  } catch (err) {
    console.error('[inventory] initial navigate failed:', err?.message ?? err)
  }

  const system = buildSystemPrompt({
    tab: args.tab,
    appUrl,
    maxTurns: args.maxTurns,
  })
  const messages = [
    {
      role: 'user',
      content: `Inventory the '${args.tab}' tab now. Explore every durable feature. When done, emit ONLY the final fenced JSON manifest.`,
    },
  ]

  let finalText = ''
  let turns = 0
  let hitBudget = false

  try {
    while (turns < args.maxTurns) {
      turns += 1
      const response = await anthropic.messages.create({
        model,
        max_tokens: 8192,
        system,
        tools,
        messages,
      })
      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn') {
        finalText = extractText(response.content)
        break
      }
      if (response.stop_reason !== 'tool_use') {
        finalText =
          extractText(response.content) ||
          `(stopped with reason: ${response.stop_reason})`
        break
      }

      const toolUses = response.content.filter((b) => b.type === 'tool_use')
      const toolResults = []
      for (const tu of toolUses) {
        process.stdout.write(`  turn ${turns}: ${tu.name}\n`)
        try {
          const result = await mcp.callTool({
            name: tu.name,
            arguments: tu.input ?? {},
          })
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: stringifyToolResult(result),
            is_error: Boolean(result?.isError),
          })
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: err instanceof Error ? err.message : String(err),
            is_error: true,
          })
        }
      }
      messages.push({ role: 'user', content: toolResults })
    }

    if (!finalText && turns >= args.maxTurns) {
      hitBudget = true
      console.log('[inventory] turn budget reached; forcing final JSON emit')
      messages.push({
        role: 'user',
        content:
          'Turn budget reached. Do NOT call any more tools. Emit ONLY the final fenced JSON manifest now, with whatever feature_checks you have so far. Add "notes":"turn budget exhausted" inside known_gaps.',
      })
      const forced = await anthropic.messages.create({
        model,
        max_tokens: 8192,
        system,
        messages,
      })
      finalText = extractText(forced.content) || '(no final text)'
    }
  } finally {
    await mcp.close().catch(() => {})
  }

  const parsed = extractJsonBlock(finalText)
  if (!parsed) {
    console.error('\n[inventory] ERROR: agent did not emit parseable JSON.')
    console.error('[inventory] raw final text (first 2000 chars):')
    console.error(finalText.slice(0, 2000))
    process.exit(1)
  }
  if (!Array.isArray(parsed.feature_checks)) {
    console.error('[inventory] ERROR: manifest has no feature_checks[] array.')
    console.error(JSON.stringify(parsed, null, 2).slice(0, 2000))
    process.exit(1)
  }

  const json = JSON.stringify(parsed, null, 2) + '\n'

  if (args.dryRun) {
    console.log('\n----- DRY RUN: generated manifest -----')
    console.log(json)
  } else {
    await writeFile(outPath, json, 'utf8')
    console.log(`\n[inventory] wrote ${parsed.feature_checks.length} feature_checks to ${path.relative(PROJECT_ROOT, outPath)}`)
  }
  console.log(`[inventory] turns=${turns}  stopped_for_budget=${hitBudget}`)
}

main().catch((err) => {
  console.error('[inventory] crashed:', err?.stack || err?.message || err)
  process.exit(1)
})
