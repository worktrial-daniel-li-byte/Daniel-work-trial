import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve the persistent-profile directory relative to this spec file so we
// can remove any stale Chromium singleton-lock files that a previous session
// (e.g. the MCP browser-agent) may have left behind.  Those files prevent
// launchPersistentContext from acquiring the profile lock and cause an
// immediate error before any assertion runs.
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const PROFILE_DIR = path.resolve(__dirname, '..', '.pw-profile-jira')
const SINGLETON_FILES = ['SingletonLock', 'SingletonSocket', 'SingletonCookie']

test.describe('toolbar.search.present — Toolbar has a \'Search board\' textbox', () => {
  test.beforeAll(() => {
    for (const f of SINGLETON_FILES) {
      try { fs.unlinkSync(path.join(PROFILE_DIR, f)) } catch { /* already gone */ }
    }
  })

  test('search board textbox is visible in the board toolbar', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`)

    // Primary assertion: the 'Search board' textbox must be present and visible
    await expect(page.getByRole('textbox', { name: 'Search board' })).toBeVisible()

    // Adjacent status indicator confirms we are in the correct toolbar context
    await expect(page.getByText('Showing all work items')).toBeVisible()

    // Toolbar context: 'Group by Status' button is also present
    await expect(page.getByRole('button', { name: 'Group by Status' })).toBeVisible()

    // Board column heading confirms the full board has rendered
    await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()
  })
})
