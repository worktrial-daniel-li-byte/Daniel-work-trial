import { defineConfig } from '@playwright/test'

// Playwright config for generated tests under tests/<tab>/.
//
// All tests share a persistent Chromium profile at tests/.pw-profile-jira,
// the same one mcp/test-loop (and tests/browser-test.js) use. Because a
// persistent context holds an exclusive lock on the profile directory, we
// run with a single worker.
export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/*.spec.mjs', '**/*.spec.js'],
  testIgnore: [
    '**/_fixtures/**',
    '**/reports/**',
    '**/.pw-profile-jira/**',
    'tests/browser-login.js',
    'tests/browser-test.js',
    'tests/qa-agent.js',
  ],
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.PW_REPORTER || 'list',
  timeout: Number(process.env.PW_TIMEOUT_MS || 60_000),
  expect: {
    timeout: Number(process.env.PW_EXPECT_TIMEOUT_MS || 10_000),
  },
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
  },
})
