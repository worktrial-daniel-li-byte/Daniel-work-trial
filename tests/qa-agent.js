import 'dotenv/config'
import path from 'node:path'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const PLAYWRIGHT_MCP_CLI = path.join(PROJECT_ROOT, 'node_modules', '@playwright', 'mcp', 'cli.js')
const REPORT_DIR = path.join(PROJECT_ROOT, 'tests', 'reports')

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7'
const APP_URL = process.env.APP_URL || 'http://localhost:5173'
const MAX_TURNS_PER_CASE = Number(process.env.QA_MAX_TURNS_PER_CASE || 45)

const TEST_CASES = [
  {
    id: 'TC-01',
    name: 'Board and preferences persist to localStorage',
    category: 'Persistence',
    severity: 'high',
    description:
      'The board state (columns, cards) and user preferences (active tab, active sidebar item, group-by, filters) must survive a full page reload, not just a soft re-render.',
    acceptance_criteria: [
      'Creating a new card and reloading the page shows the new card.',
      'Deleting a card and reloading does not bring the card back.',
      'Renaming a column and reloading preserves the new column name.',
      'Switching the active top tab (e.g. to List) and reloading keeps that tab active.',
      'Switching the Group-by value and reloading preserves the selected grouping.',
      'Data is actually written to window.localStorage (verify a relevant key exists after a write).',
    ],
  },
  {
    id: 'TC-02',
    name: 'Top tabs switch views',
    category: 'Navigation',
    severity: 'medium',
    description:
      'The top tab row (Summary, Board, List, Calendar, Timeline, Approvals, Forms, Pages, Attachments, Reports, Archived work items, Shortcuts) must switch the main workspace content.',
    acceptance_criteria: [
      'Clicking each tab updates the active indicator to that tab.',
      'The rendered main content changes between tabs (not just the title).',
      'Summary, Board, and List render distinct non-placeholder content (stats, kanban, table).',
      'Placeholder tabs are acceptable only if they explicitly state the tab is not implemented; otherwise they are a FAIL for that sub-check.',
      'Switching tabs does not throw console errors.',
    ],
  },
  {
    id: 'TC-03',
    name: 'Top-bar Search and Search board both filter cards',
    category: 'Search',
    severity: 'high',
    description:
      'Both the global top-bar "Search" input AND the in-board "Search board" input must filter the visible board cards by title or key.',
    acceptance_criteria: [
      'Typing a substring of a card title into the in-board "Search board" input reduces visible cards to matches only.',
      'Clearing the in-board search restores all cards.',
      'Typing a substring into the top-bar "Search" input ALSO reduces the visible cards on the board to matches only. Opening a suggestion dropdown instead of filtering is a FAIL for this sub-check.',
      'Search is case-insensitive.',
    ],
  },
  {
    id: 'TC-04',
    name: 'Filter dropdown by assignee and priority',
    category: 'Filtering',
    severity: 'medium',
    description:
      'A Filter control must let the user filter visible cards by assignee and by priority independently and in combination.',
    acceptance_criteria: [
      'Selecting a single assignee shows only that assignee\'s cards.',
      'Selecting a single priority shows only cards of that priority.',
      'Selecting an assignee AND a priority shows only cards matching both.',
      'Clearing the filter restores all cards.',
      'The filter state is reflected in the UI (badge, checkmark, or pill).',
    ],
  },
  {
    id: 'TC-05',
    name: 'Group-by dropdown (Status / Priority / Assignee)',
    category: 'Grouping',
    severity: 'medium',
    description:
      'A Group-by control must regroup the board columns by Status, Priority, or Assignee.',
    acceptance_criteria: [
      'Default grouping is Status and shows To Do / In Progress / Done (or the user-defined statuses).',
      'Selecting Priority replaces columns with priority buckets (e.g. Highest..Lowest).',
      'Selecting Assignee replaces columns with one column per unique assignee present.',
      'Cards appear in the correct bucket for the selected grouping.',
      'Switching back to Status restores the original columns and card placement.',
    ],
  },
  {
    id: 'TC-06',
    name: 'Add, rename, and delete columns inline',
    category: 'Board CRUD',
    severity: 'high',
    description:
      'Users must be able to add a new column, rename a column inline, and delete a column, all without leaving the board.',
    acceptance_criteria: [
      'Adding a column produces a new empty column immediately visible on the board.',
      'Renaming: clicking or double-clicking the column title reveals an inline input; typing a new name and pressing Enter persists it.',
      'Deleting a column removes it from the board.',
      'Deleting a column that contains cards either blocks the action with a clear message, or removes the cards along with the column - either behavior is acceptable IF it is consistent and does not orphan cards or crash.',
      'All three operations persist across reload (ties in with TC-01).',
    ],
  },
  {
    id: 'TC-07',
    name: 'Card detail modal with priority, assignee, description',
    category: 'Card detail',
    severity: 'high',
    description:
      'Clicking a card must open a detail modal exposing at minimum the title, priority, assignee, and a description field that can be edited.',
    acceptance_criteria: [
      'Clicking the body of a card opens a modal/dialog (role="dialog") rather than triggering edit/delete directly.',
      'The modal shows the card title and key.',
      'The modal shows a priority control (select, buttons, or pills) with the current priority selected.',
      'The modal shows an assignee control with the current assignee selected.',
      'The modal shows a description field (textarea or contenteditable) that accepts free text.',
      'Editing the description and closing the modal persists the change (visible on reopen).',
      'Closing the modal (X or backdrop click or Escape) returns to the board.',
    ],
  },
  {
    id: 'TC-08',
    name: 'Top-bar menus (Notifications, Settings, Avatar, Create, Home)',
    category: 'Top bar',
    severity: 'medium',
    description:
      'Each of these top-bar controls must do something functional, not be a dead button.',
    acceptance_criteria: [
      'Home opens a menu or navigates to a home view.',
      'Create opens a create-issue dialog with at least title and status fields, and submitting adds a card to the board.',
      'Notifications opens a menu listing notifications, with a way to mark them read or clear them.',
      'Settings opens a menu with at least one actionable item (e.g. theme, clear data, shortcuts).',
      'Avatar opens a user menu showing profile info and a sign out / account action.',
      'Each menu closes on outside click or Escape.',
    ],
  },
  {
    id: 'TC-09',
    name: 'Sidebar active item and space switching',
    category: 'Sidebar',
    severity: 'low',
    description:
      'The sidebar must highlight the active item, and clicking items under Spaces must change the workspace content.',
    acceptance_criteria: [
      'On load, exactly one sidebar item is visually marked active.',
      'Clicking a different sidebar item moves the active style to it.',
      'Clicking a Space (e.g. FitHub, More spaces, Dashboards) updates the main workspace content, not just the active highlight.',
      'Navigating between spaces and back preserves board state.',
    ],
  },
  {
    id: 'TC-10',
    name: 'No console errors during the suite',
    category: 'Hygiene',
    severity: 'low',
    description:
      'While driving the board through its basic interactions, verify no uncaught exceptions or React warnings appear in the console.',
    acceptance_criteria: [
      'Interacting with the board (open/close a card, click through a few tabs) does not log uncaught exceptions.',
      'No React "Warning: ..." errors about keys, hooks, or controlled inputs.',
      'Network requests made by the app return 2xx/3xx (ignoring analytics).',
    ],
  },
]

function buildSystemPrompt(testCase) {
  return `You are a senior QA engineer running ONE focused test against a Jira-like web app called FitHub served at ${APP_URL}.

TOOLS
- You have browser automation tools from a Playwright MCP server. These are the ONLY tools you may use.
- Do not invent tools, ask the user for help, or assume any tool not listed.

CONTEXT ISOLATION
- You are ONE of several independent QA sessions. Only evaluate the single test case in the user message. Do NOT reference other test cases.
- The browser has been reset for you: the app is loaded fresh at ${APP_URL} with localStorage/sessionStorage cleared. Start from the current page state.

METHODOLOGY
1. Drive the app like a real user: click, type, keyboard navigate via the browser_* tools.
2. Use browser_evaluate / browser_run_code ONLY to verify invisible state (localStorage contents, console errors) or as a last-resort read - never as a substitute for UI interaction.
3. For EACH acceptance criterion, collect direct evidence from observation (aria snapshot, visible text, screenshot). Do not mark a criterion met because related code "probably" exists.
4. If a click or interaction fails twice, do not brute-force it a third time. Record the failure and move on.
5. You have at most ${MAX_TURNS_PER_CASE} tool-using turns. Budget accordingly.

SCORING
- "PASS" = every acceptance criterion is met.
- "PARTIAL" = at least one criterion passes AND at least one fails.
- "FAIL" = no criteria pass, or the feature is entirely missing/broken.
- Per-criterion status is "pass" or "fail" (lowercase).

OUTPUT
When you are finished, emit EXACTLY ONE fenced \`\`\`json block with the following shape and nothing after it. No other JSON blocks earlier in the conversation.

{
  "id": "${testCase.id}",
  "status": "PASS" | "PARTIAL" | "FAIL",
  "criteria": [
    { "criterion": string, "status": "pass" | "fail", "evidence": string }
  ],
  "reproduction_steps": string[],
  "expected": string,
  "actual": string,
  "suggested_fix": string,
  "console_errors": string[],
  "notes": string
}

The "criteria" array MUST contain one entry per acceptance criterion in the test case, in the same order.`
}

function buildUserMessage(testCase) {
  return [
    `Evaluate this single test case:`,
    '```json',
    JSON.stringify(testCase, null, 2),
    '```',
    '',
    'Begin. When done, emit only the final JSON result block.',
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
  if (!result || !Array.isArray(result.content)) {
    return JSON.stringify(result ?? {})
  }

  return result.content
    .map((part) => {
      if (part.type === 'text' && typeof part.text === 'string') {
        return part.text
      }

      return JSON.stringify(part)
    })
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

async function resetBrowserState(mcp) {
  await mcp.callTool({
    name: 'browser_navigate',
    arguments: { url: APP_URL },
  })

  try {
    await mcp.callTool({
      name: 'browser_evaluate',
      arguments: {
        function:
          '() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} return true; }',
      },
    })
  } catch {
    // Older MCP servers use a different tool name / schema; best-effort reset.
  }

  await mcp.callTool({
    name: 'browser_navigate',
    arguments: { url: APP_URL },
  })
}

async function runSingleCase(anthropic, tools, mcp, testCase) {
  const label = `[${testCase.id}] ${testCase.name}`
  console.log(`\n=== ${label} ===`)

  await resetBrowserState(mcp)

  const messages = [{ role: 'user', content: buildUserMessage(testCase) }]
  const system = buildSystemPrompt(testCase)
  let finalText = ''
  let turns = 0
  let stoppedForBudget = false

  while (turns < MAX_TURNS_PER_CASE) {
    turns += 1

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
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
        'Turn budget reached. Do not call any more tools. Output ONLY the final JSON result described in the system prompt based on what you have observed. Mark any un-evaluated criteria as "fail" with evidence "Not evaluated: turn budget exhausted."',
    })
    const forced = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages,
    })
    finalText = extractFinalText(forced.content) || '(no text output from model)'
  }

  const parsed = extractJsonBlock(finalText)
  const enriched = {
    id: testCase.id,
    name: testCase.name,
    category: testCase.category,
    severity: testCase.severity,
    description: testCase.description,
    status: parsed?.status ?? 'FAIL',
    criteria:
      parsed?.criteria && Array.isArray(parsed.criteria)
        ? parsed.criteria
        : testCase.acceptance_criteria.map((criterion) => ({
            criterion,
            status: 'fail',
            evidence: 'No parsable result produced by model.',
          })),
    reproduction_steps: parsed?.reproduction_steps ?? [],
    expected: parsed?.expected ?? '',
    actual: parsed?.actual ?? '',
    suggested_fix: parsed?.suggested_fix ?? '',
    console_errors: parsed?.console_errors ?? [],
    notes: parsed?.notes ?? '',
    turns,
    stopped_for_budget: stoppedForBudget,
    raw: parsed ? undefined : finalText,
  }

  console.log(`  [${testCase.id}] -> ${enriched.status}`)
  return enriched
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTH_API_KEY
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY (or ANTH_API_KEY) in environment. Add it to .env before running this script.')
    process.exit(1)
  }

  const anthropic = new Anthropic({ apiKey })

  const mcp = new Client({ name: 'fithub-qa-agent', version: '2.0.0' })
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [PLAYWRIGHT_MCP_CLI, '--headless', '--isolated'],
  })

  await mcp.connect(transport)

  const { tools: mcpTools } = await mcp.listTools()
  const tools = toAnthropicTools(mcpTools)

  const startedAt = new Date().toISOString()
  const results = []

  try {
    for (const testCase of TEST_CASES) {
      try {
        const result = await runSingleCase(anthropic, tools, mcp, testCase)
        results.push(result)
      } catch (error) {
        console.error(`  [${testCase.id}] session error:`, error)
        results.push({
          id: testCase.id,
          name: testCase.name,
          category: testCase.category,
          severity: testCase.severity,
          description: testCase.description,
          status: 'FAIL',
          criteria: testCase.acceptance_criteria.map((criterion) => ({
            criterion,
            status: 'fail',
            evidence: `Session error: ${error instanceof Error ? error.message : String(error)}`,
          })),
          reproduction_steps: [],
          expected: '',
          actual: '',
          suggested_fix: '',
          console_errors: [],
          notes: 'Session crashed before producing a result.',
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
    (acc, result) => {
      const bucket = result.status === 'PASS' ? 'pass' : result.status === 'PARTIAL' ? 'partial' : 'fail'
      acc[bucket] += 1
      return acc
    },
    { pass: 0, partial: 0, fail: 0 },
  )

  const overall = tally.fail > 0 ? 'red' : tally.partial > 0 ? 'yellow' : 'green'

  const report = {
    model: MODEL,
    app_url: APP_URL,
    started_at: startedAt,
    finished_at: finishedAt,
    results,
    summary: {
      pass: tally.pass,
      partial: tally.partial,
      fail: tally.fail,
      overall,
    },
  }

  await mkdir(REPORT_DIR, { recursive: true })
  const reportPath = path.join(REPORT_DIR, `qa-report-${startedAt.replace(/[:.]/g, '-')}.json`)
  await writeFile(reportPath, JSON.stringify(report, null, 2))

  console.log('\n=== QA REPORT ===\n')
  console.log(JSON.stringify(report, null, 2))
  console.log(`\nReport written to ${path.relative(PROJECT_ROOT, reportPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
