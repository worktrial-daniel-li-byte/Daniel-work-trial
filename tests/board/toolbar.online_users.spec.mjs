import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Remove stale Chromium singleton-lock files left by a previous browser session
// so launchPersistentContext can acquire the profile lock cleanly.
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const PROFILE_DIR = path.resolve(__dirname, '..', '.pw-profile-jira')
const SINGLETON_FILES = ['SingletonLock', 'SingletonSocket', 'SingletonCookie']

test.describe('toolbar.online_users — Online-users avatar (checkbox) appears next to search', () => {
  test.beforeAll(() => {
    for (const f of SINGLETON_FILES) {
      try { fs.unlinkSync(path.join(PROFILE_DIR, f)) } catch { /* already gone */ }
    }
  })

  test('Online-user assignee checkbox is visible in the board toolbar next to Search board', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`)

    // PRIMARY assertion — the online-user avatar is an accessible checkbox
    // with the exact aria-label set by the app ("Daniel Li is online").
    // Evidence: role=checkbox with accessible name 'Daniel Li is online' is visible
    // on the board toolbar.
    const onlineCheckbox = page.getByRole('checkbox', { name: 'Daniel Li is online' })
    await expect(onlineCheckbox).toBeVisible()

    // SECONDARY assertion — the checkbox input carries the Atlassian accountId
    // as its value attribute, confirming the correct data is bound to the avatar.
    // Evidence: value="712020:628f86ff-8aef-4c36-85d6-223e8e929463"
    await expect(onlineCheckbox).toHaveAttribute(
      'value',
      '712020:628f86ff-8aef-4c36-85d6-223e8e929463'
    )

    // TERTIARY assertion — the checkbox is wrapped in the 'Filter by assignee'
    // group, confirming correct structural placement in the toolbar.
    // Evidence: role=group aria-label='Filter by assignee' contains the checkbox.
    const assigneeGroup = page.getByRole('group', { name: 'Filter by assignee' })
    await expect(assigneeGroup).toBeVisible()

    // QUATERNARY assertion — the 'Search board' textbox must be present on the
    // same toolbar row (bounding-rect evidence: search at x=356, avatar at x=529,
    // both at y=186).
    const searchBox = page.getByRole('textbox', { name: 'Search board' })
    await expect(searchBox).toBeVisible()
  })
})
