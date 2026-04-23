/**
 * Browser-verification agent: connects to @playwright/mcp, hands Claude a
 * single feature_check, and collects a structured evidence JSON blob that the
 * code worker uses to author a @playwright/test spec.
 *
 * Exports a long-lived `BrowserAgent` class so a single Playwright-MCP
 * subprocess (and its persistent profile lock) is reused across every check
 * in a run — the profile can only be held by one Chromium at a time.
 */

import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import { config, playwrightMcpCli, profileDir } from './config.mjs'
import { buildBrowserSystemPrompt } from './prompts.mjs'

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

export class BrowserAgent {
  constructor() {
    this.anthropic = new Anthropic({ apiKey: config.apiKey })
    this.mcp = null
    this.tools = null
  }

  async connect() {
    const mcpArgs = [playwrightMcpCli, '--user-data-dir', profileDir]
    if (config.headless) mcpArgs.push('--headless')
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: mcpArgs,
    })
    this.mcp = new Client({ name: 'test-loop-browser-agent', version: '1.0.0' })
    await this.mcp.connect(transport)
    const { tools } = await this.mcp.listTools()
    this.tools = toAnthropicTools(tools)
  }

  async close() {
    if (this.mcp) {
      try {
        await this.mcp.close()
      } catch {}
      this.mcp = null
    }
  }

  /**
   * Verify a single feature_check in the live browser and return its evidence.
   * Navigates to appUrl first to ensure the page is loaded.
   *
   * @param {object} opts
   * @param {object} opts.testCase       A feature_check entry from the tab JSON.
   * @param {string} opts.appUrl         Full URL to open before verifying.
   * @returns {Promise<{evidence: object, turns: number, rawFinalText: string}>}
   */
  async verifyFeature({ testCase, appUrl }) {
    if (!this.mcp) throw new Error('BrowserAgent.connect() was not called')

    try {
      await this.mcp.callTool({
        name: 'browser_navigate',
        arguments: { url: appUrl },
      })
    } catch (err) {
      console.error(
        `  [browser-agent] navigate failed: ${err?.message ?? err}`,
      )
    }

    const system = buildBrowserSystemPrompt({
      testCase,
      appUrl,
      maxTurns: config.browserAgentMaxTurns,
    })
    const messages = [
      {
        role: 'user',
        content: `Verify this feature check now. Emit ONLY the final JSON evidence block when done.`,
      },
    ]

    let finalText = ''
    let turns = 0
    let hitBudget = false

    while (turns < config.browserAgentMaxTurns) {
      turns += 1
      const response = await this.anthropic.messages.create({
        model: config.model,
        max_tokens: 4096,
        system,
        tools: this.tools,
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
        process.stdout.write(`    [${testCase.id}] ${tu.name}\n`)
        try {
          const result = await this.mcp.callTool({
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

    if (!finalText && turns >= config.browserAgentMaxTurns) {
      hitBudget = true
      messages.push({
        role: 'user',
        content:
          'Turn budget reached. Do NOT call any more tools. Emit ONLY the final JSON evidence block now. If you could not complete verification, status="PARTIAL" and note="turn budget exhausted".',
      })
      const forced = await this.anthropic.messages.create({
        model: config.model,
        max_tokens: 2048,
        system,
        messages,
      })
      finalText = extractText(forced.content) || '(no final text)'
    }

    const parsed = extractJsonBlock(finalText)
    const evidence = parsed ?? {
      id: testCase.id,
      status: 'FAIL',
      navigate_url: appUrl,
      observations: [],
      playwright_hints: { locators: [], url_assertions: [], interactions: [] },
      notes: `browser agent did not emit parseable JSON. raw: ${finalText.slice(0, 400)}`,
    }
    if (!evidence.navigate_url) evidence.navigate_url = appUrl
    evidence.turns = turns
    evidence.stopped_for_budget = hitBudget

    return { evidence, turns, rawFinalText: finalText }
  }
}
