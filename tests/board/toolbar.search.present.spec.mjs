import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Remove stale Chromium singleton-lock files left by a previous browser session
// (e.g. the MCP browser-agent) so launchPersistentContext can acquire the lock.
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const PROFILE_DIR = path.resolve(__dirname, '..', '.pw-profile-jira')
const SINGLETON_FILES = ['SingletonLock', 'SingletonSocket', 'SingletonCookie']

test.describe("toolbar.search.present — Toolbar has a 'Search board' textbox", () => {
  test.beforeAll(() => {
    for (const f of SINGLETON_FILES) {
      try { fs.unlinkSync(path.join(PROFILE_DIR, f)) } catch { /* already gone */ }
    }
  })

  test('Search board input is present in the board toolbar', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`)

    // PRIMARY load-bearing assertion – targets the exact placeholder="Search board"
    // attribute on the <input> rendered inside <div class="jira-field--search">.
    // When the saboteur removes that div from src/App.tsx this locator finds
    // nothing and the assertion fails, proving the spec is load-bearing.
    const searchInput = page.getByPlaceholder('Search board')
    await expect(searchInput).toBeVisible()

    // SECONDARY load-bearing assertion – the same input anchored to the
    // data-region="board-toolbar" container.  This is the structural double-check
    // from the evidence fallback: locator('input[placeholder="Search board"]').
    await expect(
      page.locator('[data-region="board-toolbar"] input[placeholder="Search board"]')
    ).toBeVisible()

    // Context assertion – the Group-by-Status button confirms the full toolbar
    // has rendered (does not directly test the search feature).
    await expect(page.getByRole('button', { name: 'Group by Status' })).toBeVisible()

    // Content assertion – at least one kanban column heading must be visible.
    await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()
  })
})
