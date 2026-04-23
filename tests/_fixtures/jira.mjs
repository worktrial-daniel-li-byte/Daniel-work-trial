// Shared Playwright Test fixture for tests that run against live Jira.
//
// Generated specs import `test` and `expect` from here instead of
// @playwright/test directly so they reuse the persistent Chromium profile at
// tests/.pw-profile-jira (shared with tests/browser-test.js and the MCP
// browser agent). The profile carries the signed-in Atlassian session,
// so specs don't need to handle login.
//
// Usage:
//   import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
//
//   test('something', async ({ page }) => {
//     await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/board`)
//     await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()
//   })

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base, chromium, expect } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const PROFILE_DIR = path.join(PROJECT_ROOT, 'tests', '.pw-profile-jira')

export const JIRA_BASE =
  process.env.JIRA_BASE_URL ||
  'https://fleet-team-y0ak1u2s.atlassian.net'

export const test = base.extend({
  // Override `context` to use a persistent (profile-backed) Chromium context.
  // This keeps auth cookies/localStorage across runs without a separate login.
  context: async ({}, use) => {
    const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
      headless: process.env.HEADLESS === '1',
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
    })
    try {
      await use(ctx)
    } finally {
      await ctx.close()
    }
  },
  // Reuse the persistent context's first page instead of opening a blank new one.
  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage())
    await use(page)
  },
})

export { expect }
