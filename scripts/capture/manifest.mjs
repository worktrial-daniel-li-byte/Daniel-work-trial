/**
 * Capture manifest: what the harness knows how to scrape from a live Jira space.
 *
 * Each section gets its own folder under reference_app/<id>/ with:
 *   reference.html      (post-hydration DOM, cleaned)
 *   reference.png       (viewport screenshot, 1920x1080, matches reward harness)
 *   reference.full.png  (full-page screenshot, for eyeballing)
 *   meta.json           (url, title, timings, final URL after redirects, etc.)
 *
 * Sections are pulled from mcp/summary/index.json's navigation_tabs, plus a few
 * cross-cutting views (create-dialog, work-item detail) that require a pre-action.
 */

export const DEFAULT_BASE_URL = 'https://fleet-team-y0ak1u2s.atlassian.net'
export const DEFAULT_SPACE = { key: 'AUT', name: 'Autoloop' }

/**
 * Build the default section list for a given space.
 * id         → folder name under reference_app/
 * path       → URL path on the Jira host
 * title      → human label (for logs + meta.json)
 * preAction  → optional steps before capture (click create, open card, etc.)
 * optional   → if true, a 404 / missing tab does not fail the run
 */
export function buildSectionsForSpace(spaceKey = DEFAULT_SPACE.key) {
  const base = `/jira/core/projects/${spaceKey}`
  return [
    { id: 'summary', title: 'Summary', path: `${base}/summary` },
    { id: 'board', title: 'Board', path: `${base}/board?filter=&groupBy=status` },
    { id: 'list', title: 'List', path: `${base}/list` },
    { id: 'calendar', title: 'Calendar', path: `${base}/calendar` },
    { id: 'timeline', title: 'Timeline', path: `${base}/timeline` },
    { id: 'approvals', title: 'Approvals', path: `${base}/approvals`, optional: true },
    { id: 'forms', title: 'Forms', path: `${base}/forms`, optional: true },
    { id: 'pages', title: 'Pages', path: `${base}/pages`, optional: true },
    { id: 'attachments', title: 'Attachments', path: `${base}/attachments`, optional: true },
    { id: 'reports', title: 'Reports', path: `${base}/reports`, optional: true },
    {
      id: 'archived-work-items',
      title: 'Archived work items',
      path: `${base}/archived-work-items`,
      optional: true,
    },
    { id: 'shortcuts', title: 'Shortcuts', path: `${base}/shortcuts`, optional: true },
  ]
}

/**
 * Filter a section list by a comma-separated `--only=a,b,c` CLI value.
 */
export function filterSections(sections, onlySet) {
  if (!onlySet || onlySet.size === 0) return sections
  return sections.filter((s) => onlySet.has(s.id))
}
