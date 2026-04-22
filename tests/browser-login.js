#!/usr/bin/env node
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline'
import { chromium } from 'playwright-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const PROFILE_DIR = path.join(PROJECT_ROOT, 'tests', '.pw-profile-jira')

const DEFAULT_URL =
  process.env.APP_URL ||
  'https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status'

const urlArg = process.argv.slice(2).find((a) => !a.startsWith('--')) || DEFAULT_URL

async function main() {
  await mkdir(PROFILE_DIR, { recursive: true })
  console.log(`Opening Chromium with persistent profile at: ${PROFILE_DIR}`)
  console.log(`Navigating to: ${urlArg}`)
  console.log('Sign into Atlassian in the window, then press Enter here to save the session and exit.')

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
  })
  const page = ctx.pages()[0] || (await ctx.newPage())
  await page.goto(urlArg, { waitUntil: 'domcontentloaded' }).catch((err) => {
    console.warn('Initial navigation warning:', err.message)
  })

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  await new Promise((resolve) => rl.question('\nPress Enter when signed in... ', resolve))
  rl.close()

  await ctx.close()
  console.log('Session saved. You can now run: npm run browser-test -- --board')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
