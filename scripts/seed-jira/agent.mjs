/**
 * Single-task browser agent.
 *
 * Mirrors the turn loop used by tests/browser-test.js but with a different
 * goal: instead of verifying an existing feature, the agent creates the
 * items described in its task spec. One task = one Claude session sharing
 * the already-connected Playwright MCP subprocess.
 */

import { buildSystemPrompt, buildUserMessage } from './prompts.mjs'

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

async function navigateTo(mcp, url, log) {
  try {
    await mcp.callTool({ name: 'browser_navigate', arguments: { url } })
  } catch (error) {
    log(`  [setup] browser_navigate failed: ${error instanceof Error ? error.message : error}`)
  }
}

export async function runSeedTask({ anthropic, model, mcp, mcpTools, task, maxTurns, log }) {
  const label = `[${task.id}] ${task.tab} (${task.items.length} item${task.items.length === 1 ? '' : 's'})`
  log(`\n=== ${label} ===`)

  await navigateTo(mcp, task.target_url, log)

  const tools = toAnthropicTools(mcpTools)
  const system = buildSystemPrompt(task)
  const messages = [{ role: 'user', content: buildUserMessage(task, maxTurns) }]
  let finalText = ''
  let turns = 0
  let budgetReached = false

  while (turns < maxTurns) {
    turns += 1
    const response = await anthropic.messages.create({
      model,
      max_tokens: 3072,
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
      finalText = extractFinalText(response.content) || `Stopped: ${response.stop_reason}`
      break
    }

    const toolUses = response.content.filter((block) => block.type === 'tool_use')
    const toolResults = []
    for (const toolUse of toolUses) {
      log(`  [${task.id} t${turns}] ${toolUse.name}`)
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

  if (!finalText && turns >= maxTurns) {
    budgetReached = true
    log(`  [${task.id}] turn budget reached; forcing final report`)
    messages.push({
      role: 'user',
      content:
        'Turn budget reached. Stop calling tools. Emit ONLY the final JSON report block from the system prompt. Items you did not finish belong under "failed" with reason "turn budget".',
    })
    const forced = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system,
      messages,
    })
    finalText = extractFinalText(forced.content) || '(no text output)'
  }

  const parsed = extractJsonBlock(finalText) || {
    task_id: task.id,
    status: 'FAIL',
    created: [],
    skipped: [],
    failed: task.items.map((it) => ({
      name: it.summary || it.name || it.title || it.work_item || 'unknown',
      reason: 'no final JSON report',
    })),
    notes: 'agent did not emit a parseable JSON block',
  }

  const summary = {
    task_id: task.id,
    tab: task.tab,
    status: parsed.status || 'FAIL',
    created_count: Array.isArray(parsed.created) ? parsed.created.length : 0,
    skipped_count: Array.isArray(parsed.skipped) ? parsed.skipped.length : 0,
    failed_count: Array.isArray(parsed.failed) ? parsed.failed.length : 0,
    turns,
    budget_reached: budgetReached,
    report: parsed,
  }

  log(
    `  [${task.id}] -> ${summary.status}  created=${summary.created_count}  skipped=${summary.skipped_count}  failed=${summary.failed_count}  turns=${turns}`,
  )
  return summary
}
