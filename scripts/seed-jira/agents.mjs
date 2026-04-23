/**
 * Per-tab subagent definitions for the Claude Agent SDK.
 *
 * Each entry is a specialised AgentDefinition: its own prompt, model, and
 * per-agent turn budget. All share the Playwright MCP as their tool surface,
 * wired in index.mjs via `mcpServers`.
 *
 * We run these as main-thread agents (one `query()` per task, picked via
 * `options.agent = <id>`) rather than via Task delegation, so the harness
 * keeps fine-grained control over ordering, `--only` filters, and per-task
 * reports. The AgentDefinition shape still gives us the pattern-3 ergonomics
 * (declarative prompt + tools + budget per role) we were after.
 */

const PLAYWRIGHT_TOOLS = [
  'mcp__playwright__browser_navigate',
  'mcp__playwright__browser_snapshot',
  'mcp__playwright__browser_click',
  'mcp__playwright__browser_type',
  'mcp__playwright__browser_fill',
  'mcp__playwright__browser_press_key',
  'mcp__playwright__browser_select_option',
  'mcp__playwright__browser_wait_for',
  'mcp__playwright__browser_hover',
  'mcp__playwright__browser_evaluate',
  'mcp__playwright__browser_take_screenshot',
  'mcp__playwright__browser_console_messages',
  'mcp__playwright__browser_close',
  // Structured file output so each agent reports back deterministically.
  'Write',
]

const SHARED_GUIDANCE = `
You drive a real Atlassian Jira tab inside a persistent Chromium profile that
is already signed in. Use only the tools listed in your toolset; never invent
tools, never reset storage, never delete existing work items, never sign out.

Workflow
- Always call browser_snapshot before clicking; element refs are tied to the
  latest snapshot.
- Be idempotent: for each item, first check whether an item with the same
  title / name / key already exists. If so, skip rather than create.
- If a banner, upsell, or modal blocks the target UI, close it and retry once.
- If the same interaction fails twice on one item, skip it and continue.
- If a field from the spec is not exposed by the UI (e.g. story_points on a
  tab that has no such field), skip that field silently.
- Budget your turns; the harness enforces a per-agent cap.

Final report
When the task is done (or the budget is about to run out), WRITE a JSON file
to the path the user message provides, using this exact shape:

{
  "task_id": "<task id>",
  "status": "OK" | "PARTIAL" | "FAIL" | "BLOCKED",
  "created": [ { "name": "<item>", "note": "<what you observed>" } ],
  "skipped": [ { "name": "<item>", "reason": "<already existed / missing field / ...>" } ],
  "failed":  [ { "name": "<item>", "reason": "<what went wrong>" } ],
  "notes":   "<one-line summary>"
}

After writing the file, stop emitting tool calls and end your turn.
`.trim()

function buildAgent({ description, role, tabHint, maxTurns = 60, model = 'sonnet' }) {
  return {
    description,
    prompt: `${role}\n\n${tabHint}\n\n${SHARED_GUIDANCE}`,
    tools: PLAYWRIGHT_TOOLS,
    model,
    maxTurns,
    permissionMode: 'bypassPermissions',
  }
}

export const AGENTS = {
  board: buildAgent({
    description: 'Creates work items on a Jira Board tab.',
    role: 'You are a Jira Board build-out specialist. Your job is to create a batch of work items on the Autoloop Board, one per spec in the user prompt.',
    tabHint: `Tab hint — Board
- Create via the global "Create" button (top nav) or the per-column "+ Create" affordance.
- Fill Summary first, then set Status to match status_column, then open the issue to set priority, labels, due_date.
- When assignee names don't exist in the workspace, leave the field unassigned and log under skipped.
- After each create, confirm the card is visible in the target column before moving on.`,
    maxTurns: 80,
    model: 'sonnet',
  }),

  pages: buildAgent({
    description: 'Creates wiki-style pages in a Jira space.',
    role: 'You are a Jira Pages build-out specialist. Your job is to create a batch of pages in the Autoloop space, one per spec.',
    tabHint: `Tab hint — Pages
- Click "Create page" (or equivalent), fill the title, set the emoji if the UI supports it, paste the body as the first paragraph, then Publish / Save.
- Confirm the page appears in the left-hand Pages tree before moving on.`,
    maxTurns: 50,
  }),

  forms: buildAgent({
    description: 'Creates intake forms in a Jira space.',
    role: 'You are a Jira Forms build-out specialist. Your job is to create a batch of intake forms in the Autoloop space, one per spec.',
    tabHint: `Tab hint — Forms
- Use the Forms tab's form builder. For each listed field, add a single-line text input with that field as its label.
- If the Forms tab redirects to /not-found or is disabled on this plan, report BLOCKED and stop.`,
    maxTurns: 50,
  }),

  approvals: buildAgent({
    description: 'Raises approval requests on Jira work items.',
    role: 'You are a Jira Approvals build-out specialist. Your job is to open each referenced work item and raise an approval request.',
    tabHint: `Tab hint — Approvals
- Navigate to the work item (e.g. /jira/core/projects/AUT/board, then open the card).
- Use the Approvals panel on the issue side-sheet; set approvers and include the request_message as the request description.
- If approvers don't exist in the workspace, log them under skipped with a clear reason.`,
    maxTurns: 40,
  }),

  attachments: buildAgent({
    description: 'Leaves placeholder comments on work items for pending attachments.',
    role: 'You are a Jira Attachments build-out specialist. File uploads cannot be triggered from your tools, so instead you leave a structured comment on each referenced work item describing the intended attachment.',
    tabHint: `Tab hint — Attachments
- Open each referenced work item, add a comment with the provided text ("Attach <filename> (<mime>, <size> KB).").
- Do not attempt a true file upload.`,
    maxTurns: 40,
  }),
}

export const AGENT_IDS = Object.keys(AGENTS)
