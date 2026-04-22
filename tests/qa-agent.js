import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7'
const APP_URL = process.env.APP_URL || 'http://localhost:5173'
const MAX_TURNS = Number(process.env.QA_MAX_TURNS || 60)

const TEST_CASES = [
  'Board state and user preferences persist to localStorage across a full page reload.',
  'Summary, Board, List, Calendar, Timeline, and other top tabs switch to different views.',
  'The top-bar Search and the "Search board" input both filter the visible cards by text.',
  'A Filter dropdown filters cards by assignee and by priority.',
  'A Group-by dropdown regroups cards by Status, Priority, and Assignee.',
  'Columns can be added, renamed inline, and deleted directly on the board.',
  'Clicking a card opens a detail modal showing priority, assignee, and a description field.',
  'Notifications, Settings, Avatar, Create, and Home buttons each open a working menu or dialog.',
  'Sidebar navigation highlights the active item, and switching between spaces updates the workspace.',
]

const SYSTEM_PROMPT = `You are a senior QA engineer testing a Jira-like web app called FitHub served at ${APP_URL}.

You have browser automation tools provided by a Playwright MCP server. These are the ONLY tools you may use. Do not invent tools or ask the user for help.

For each numbered test case in the user's message:
1. Use the browser tools to drive the app as a real user would.
2. Decide whether the behavior matches the description.
3. Record PASS or FAIL with 1-3 sentences of concrete evidence (what you clicked, what you observed, selector text, etc.).

Work efficiently: reuse the same page when possible, close modals between tests, and do not take redundant screenshots. If the app is unreachable, mark every test FAIL with that reason.

When every test case has been evaluated, output your final answer as a single fenced \`\`\`json block with this exact shape and nothing after it:

{
  "model": "${MODEL}",
  "app_url": "${APP_URL}",
  "results": [
    { "case": string, "status": "PASS" | "FAIL", "evidence": string }
  ],
  "summary": string
}`

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

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY. Add it to .env before running this script.')
    process.exit(1)
  }

  const anthropic = new Anthropic()

  const mcp = new Client({ name: 'fithub-qa-agent', version: '1.0.0' })
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
  })

  await mcp.connect(transport)

  const { tools: mcpTools } = await mcp.listTools()
  const tools = toAnthropicTools(mcpTools)

  const userMessage =
    `Run the following QA checklist against ${APP_URL}. ` +
    `Start by navigating to the app, then evaluate each case in order.\n\n` +
    TEST_CASES.map((testCase, index) => `${index + 1}. ${testCase}`).join('\n')

  const messages = [{ role: 'user', content: userMessage }]
  let finalText = ''
  let turns = 0

  try {
    while (turns < MAX_TURNS) {
      turns += 1

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
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
        process.stdout.write(`[tool] ${toolUse.name}\n`)
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

    if (turns >= MAX_TURNS) {
      console.error(`Stopped after reaching MAX_TURNS=${MAX_TURNS}.`)
    }
  } finally {
    await mcp.close().catch(() => {})
  }

  console.log('\n=== QA REPORT ===\n')
  console.log(finalText || '(no text output from model)')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
