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
import {
  LOCAL_STATE_STORAGE_KEY,
  LOCAL_STATE_STORAGE_VERSION,
  rewriteForLocal,
} from './route-map.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const PROFILE_DIR = path.join(PROJECT_ROOT, 'tests', '.pw-profile-jira')

export const JIRA_BASE =
  process.env.JIRA_BASE_URL ||
  'https://fleet-team-y0ak1u2s.atlassian.net'

// When JIRA_BASE points at localhost we translate Jira paths through
// tests/_fixtures/route-map.mjs and seed localStorage so the SPA boots on
// the right tab. Against the live tenant we leave URLs untouched.
const IS_LOCAL_BASE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(JIRA_BASE)

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
    if (IS_LOCAL_BASE) installLocalRouteShim(page)
    await use(page)
  },
})

// Wrap `page.goto` so the existing specs (which hard-code Jira paths) can
// run unchanged against the local SPA. For any URL whose pathname matches
// the ROUTE_MAP we: (1) rewrite to the equivalent local URL, preserving
// search/hash; (2) addInitScript to upsert `preferences.activeTab` in
// localStorage so the app's useState-based tab selector boots onto the
// matching view.
function installLocalRouteShim(page) {
  const origGoto = page.goto.bind(page)
  page.goto = async (url, opts) => {
    const { url: rewritten, route } = rewriteForLocal(url, JIRA_BASE)
    if (!route) return origGoto(rewritten, opts)
    await page.addInitScript(
      ({ key, version, tab }) => {
        try {
          const raw = window.localStorage.getItem(key)
          const parsed = raw ? JSON.parse(raw) : { version }
          const prefs = (parsed && parsed.preferences) || {}
          prefs.activeTab = tab
          parsed.preferences = prefs
          parsed.version = version
          window.localStorage.setItem(key, JSON.stringify(parsed))
        } catch {
          // Best-effort: if localStorage is unavailable the spec will
          // surface the real failure downstream.
        }
      },
      {
        key: LOCAL_STATE_STORAGE_KEY,
        version: LOCAL_STATE_STORAGE_VERSION,
        tab: route.tab,
      },
    )
    return origGoto(rewritten, opts)
  }
}

export { expect }
