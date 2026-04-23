/**
 * Planner: cuts a seed JSON into per-tab tasks that a browser agent can execute.
 *
 * One task per Jira tab — each task carries a compact spec of everything to
 * create on that page, so one agent session can iterate through its items
 * without us spending a whole Claude turn budget per card/page/form.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const DEFAULT_SEED_PATH = path.join(PROJECT_ROOT, 'seed', 'initial-state.json')
const DEFAULT_BASE_URL = 'https://fleet-team-y0ak1u2s.atlassian.net'

const ASSIGNEE_DISPLAY = {
  fleet: 'Fleet',
  alex: 'Alex Kim',
  priya: 'Priya Patel',
  jordan: 'Jordan Lee',
  taylor: 'Taylor Nguyen',
}

const PRIORITY_LABEL = {
  highest: 'Highest',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  lowest: 'Lowest',
}

/**
 * Build the canonical set of tab tasks from a parsed seed.
 * Returns objects with everything an agent needs: target URL, a short English
 * goal, and a structured `items` array it can iterate.
 */
export function buildTasks(seed, { baseUrl, spaceKey }) {
  const base = `${baseUrl.replace(/\/$/, '')}/jira/core/projects/${spaceKey}`

  const boardItems = seed.columns.flatMap((col) =>
    col.cards.map((card) => ({
      key: card.key,
      summary: card.title,
      status_column: col.title,
      priority: PRIORITY_LABEL[card.priority] || null,
      assignee: ASSIGNEE_DISPLAY[card.assigneeId] || card.assigneeId || null,
      description: card.description,
      labels: card.labels || [],
      due_date: card.dueDate || null,
      start_date: card.startDate || null,
      story_points: card.storyPoints ?? null,
    })),
  )

  const tasks = [
    {
      id: 'board',
      tab: 'Board',
      target_url: `${base}/board?filter=&groupBy=status`,
      goal: `Create ${boardItems.length} work items on the Autoloop Board. Drop each item into the status column shown by status_column, and fill the listed fields.`,
      items: boardItems,
    },
    {
      id: 'pages',
      tab: 'Pages',
      target_url: `${base}/pages`,
      goal: `Create ${seed.pages.length} new pages in the Autoloop space. Use the provided title, emoji, and paste the snippet as the first paragraph of the body. Publish each page.`,
      items: seed.pages.map((p) => ({
        title: p.title,
        emoji: p.emoji,
        body: p.snippet,
        updatedBy: ASSIGNEE_DISPLAY[p.updatedBy] || p.updatedBy,
      })),
    },
    {
      id: 'forms',
      tab: 'Forms',
      target_url: `${base}/forms`,
      goal: `Create ${seed.forms.length} intake forms in the Autoloop space. For each form, set the name, a short description, and add each listed field as a single-line text input.`,
      items: seed.forms.map((f) => ({
        name: f.name,
        description: f.description,
        fields: f.fields,
      })),
    },
    {
      id: 'approvals',
      tab: 'Approvals',
      target_url: `${base}/approvals`,
      goal: `Raise ${seed.approvals.filter((a) => a.status === 'pending').length} approval requests. Open each referenced work item, request an approval with the listed approvers, and include the approval title as the request message.`,
      items: seed.approvals
        .filter((a) => a.status === 'pending')
        .map((a) => ({
          work_item: a.cardKey,
          request_message: a.title,
          approvers: a.approvers.map((id) => ASSIGNEE_DISPLAY[id] || id),
          requested_by: ASSIGNEE_DISPLAY[a.requestedBy] || a.requestedBy,
        })),
    },
    {
      id: 'attachments',
      tab: 'Attachments',
      target_url: `${base}/attachments`,
      goal: `Open each referenced work item and add a short text comment describing the intended attachment. (File uploads cannot be triggered from the agent — use the comment to flag that the attachment belongs here.)`,
      items: seed.attachments.map((a) => ({
        work_item: a.cardKey,
        filename: a.filename,
        comment: `Attach ${a.filename} (${a.mime}, ${a.sizeKb} KB).`,
      })),
    },
  ]

  return tasks
}

/**
 * Load a seed JSON by path (defaults to ./seed/initial-state.json).
 */
export async function loadSeed(seedPath = DEFAULT_SEED_PATH) {
  const raw = await readFile(seedPath, 'utf8')
  return JSON.parse(raw)
}

export { DEFAULT_SEED_PATH, DEFAULT_BASE_URL }
