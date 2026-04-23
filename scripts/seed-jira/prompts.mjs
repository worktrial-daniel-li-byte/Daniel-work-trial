/**
 * Per-tab prompts for the seeding browser agent.
 *
 * Kept deliberately small: each prompt states the goal, points the agent at
 * the live Jira tab, lists its tools, and enforces an idempotent pattern
 * ("check if it already exists before creating"), since running the harness
 * twice should not duplicate data.
 */

const SHARED_RULES = `
RULES
- You are inside real Atlassian Jira. The persistent Chromium profile is already signed in.
- Use only browser_* tools from the Playwright MCP. Do not invent tools.
- Call browser_snapshot before any click so refs are fresh.
- Do not sign out, change settings, invite users, or visit billing.
- Never reset or clear storage. Never delete existing work items.
- Be idempotent: before creating an item, check whether an item with the same
  title / name / key already exists. If so, skip it — do not create a duplicate.
- If the UI does not expose a field mentioned in the items (e.g. story_points
  on Forms), just skip that field and continue.
- If a site-wide banner, upsell, or dialog blocks the target UI, close it and
  retry.
- If you hit the same error twice on the same item, skip it and move on.
- Budget your turns. Finish as many items as possible within the turn budget.

TOOLS HINT
- browser_navigate for the initial URL only (we've already navigated for you).
- browser_click + browser_fill for form interaction.
- browser_select_option for native <select> elements.
- browser_press_key for keyboard submission / escape.
- browser_evaluate only for reading URL / attributes that aren't in a snapshot.

OUTPUT
When done, emit EXACTLY ONE fenced \`\`\`json block and nothing after it:

{
  "task_id": "<the task id>",
  "status": "OK" | "PARTIAL" | "FAIL" | "BLOCKED",
  "created": [ { "name": "<item identifier>", "note": "<what you confirmed>" } ],
  "skipped": [ { "name": "<item>", "reason": "<already exists / field missing / etc.>" } ],
  "failed":  [ { "name": "<item>", "reason": "<what went wrong>" } ],
  "notes": "<one line summary>"
}

"created" must only list items you actually observed in the UI after saving
(name badge, row in a list, card title on the board, etc.).
`.trim()

/**
 * Build the system prompt for a task. The item list is passed inline so the
 * agent doesn't have to ask for it.
 */
export function buildSystemPrompt(task) {
  return `You are an automated build-out agent that fills in real Jira content.

TASK (${task.id})
- Tab: ${task.tab}
- Target URL: ${task.target_url}
- Goal: ${task.goal}

ITEMS to create (iterate in order):
\`\`\`json
${JSON.stringify(task.items, null, 2)}
\`\`\`

${SHARED_RULES}`
}

/**
 * Initial user message that bootstraps the turn loop.
 */
export function buildUserMessage(task, maxTurns) {
  return `Navigate to ${task.target_url} and start creating the items for task "${task.id}". You have up to ${maxTurns} tool-using turns. Emit the final JSON report only once all items are attempted.`
}
