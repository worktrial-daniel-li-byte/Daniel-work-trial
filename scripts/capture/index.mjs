#!/usr/bin/env node
/**
 * Space capture harness (plan + spawn).
 *
 * Mirrors the verify→write loop under mcp/loop/ in spirit:
 *
 *   Planner     (this file, buildPlan):
 *     Reads the section manifest and any CLI filters, produces an ordered
 *     list of capture tasks (sections to visit, URL to request, etc.).
 *
 *   Orchestrator (this file, main):
 *     Launches one persistent Chromium context (reusing the existing auth
 *     profile at tests/.pw-profile-jira), then dispatches each planned
 *     task to a sub-worker in sequence. Failures on optional sections are
 *     tolerated; required sections surface as a non-zero exit.
 *
 *   Worker       (./worker.mjs, captureSection):
 *     Gets one task + a fresh page, navigates, settles, runs any pre-capture
 *     interactions, then dumps reference.html / reference.png / meta.json
 *     under reference_app/<section-id>/.
 *
 * Usage:
 *   npm run capture                          # all known Autoloop sections
 *   npm run capture -- --only=board,list     # just those sections
 *   npm run capture -- --space=XYZ           # different Jira project key
 *   npm run capture -- --base=https://...    # different Jira host
 *   npm run capture -- --headed              # show the browser (auth debug)
 *   npm run capture -- --out=reference_app   # change output root
 */

import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

import {
  DEFAULT_BASE_URL,
  DEFAULT_SPACE,
  buildSectionsForSpace,
  filterSections,
} from './manifest.mjs'
import { captureSection } from './worker.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const PROFILE_DIR = path.join(PROJECT_ROOT, 'tests', '.pw-profile-jira')
const DEFAULT_OUT_ROOT = path.join(PROJECT_ROOT, 'reference_app')

function parseArgs(argv) {
  const out = {
    space: DEFAULT_SPACE.key,
    base: DEFAULT_BASE_URL,
    only: null,
    headed: false,
    outRoot: DEFAULT_OUT_ROOT,
    help: false,
  }
  const positional = []
  for (const raw of argv) {
    if (raw === '--help' || raw === '-h') out.help = true
    else if (raw === '--headed') out.headed = true
    else if (raw.startsWith('--space=')) out.space = raw.slice('--space='.length)
    else if (raw.startsWith('--base=')) out.base = raw.slice('--base='.length).replace(/\/$/, '')
    else if (raw.startsWith('--out=')) out.outRoot = path.resolve(raw.slice('--out='.length))
    else if (raw.startsWith('--only=')) {
      out.only = new Set(
        raw
          .slice('--only='.length)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      )
    } else if (raw.startsWith('--')) {
      console.error(`unknown flag: ${raw}`)
      process.exit(2)
    } else positional.push(raw)
  }
  if (!out.only && positional.length > 0) {
    out.only = new Set(positional)
  }
  return out
}

function printHelp() {
  console.log(
    [
      'Usage: npm run capture -- [section ...] [flags]',
      '',
      'Flags:',
      '  --space=<key>    Jira project key  (default: AUT)',
      '  --base=<url>     Jira host         (default: https://fleet-team-y0ak1u2s.atlassian.net)',
      '  --only=a,b,c     Only these section ids (same as positional args)',
      '  --out=<dir>      Output root (default: reference_app/)',
      '  --headed         Show the browser window (useful when auth is stale)',
      '',
      'Example:',
      '  npm run capture -- --only=board,summary',
      '  npm run capture -- board summary',
      '  npm run capture -- --space=DEMO --headed',
    ].join('\n'),
  )
}

function buildPlan({ space, base, only }) {
  const sections = filterSections(buildSectionsForSpace(space), only).map((s) => ({
    ...s,
    url: `${base}${s.path}`,
  }))
  return { space, base, sections }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const plan = buildPlan({ space: args.space, base: args.base, only: args.only })
  if (plan.sections.length === 0) {
    console.error('Plan is empty. Check --only=… filter against manifest ids.')
    process.exit(2)
  }

  await mkdir(args.outRoot, { recursive: true })
  await mkdir(PROFILE_DIR, { recursive: true })

  console.log(
    `Capture harness  space=${plan.space}  base=${plan.base}  out=${path.relative(
      PROJECT_ROOT,
      args.outRoot,
    )}  headed=${args.headed}`,
  )
  console.log(`Plan: ${plan.sections.length} section(s)`)
  for (const s of plan.sections) {
    console.log(`  • ${s.id.padEnd(22)} ${s.path}${s.optional ? '  (optional)' : ''}`)
  }
  console.log('')

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !args.headed,
    viewport: { width: 1920, height: 1080 },
  })

  const log = (msg) => console.log(msg)
  const results = []
  try {
    for (const section of plan.sections) {
      const r = await captureSection({
        context,
        section,
        outRoot: args.outRoot,
        log,
      })
      results.push(r)
    }
  } finally {
    await context.close().catch(() => {})
  }

  const ok = results.filter((r) => r.ok)
  const drifted = results.filter((r) => !r.ok && r.drift)
  const failed = results.filter((r) => !r.ok && !r.drift && !r.optional)
  const skipped = results.filter((r) => !r.ok && !r.drift && r.optional)

  console.log('\n──── summary ────')
  console.log(`captured: ${ok.length}/${results.length}`)
  for (const r of ok) {
    console.log(`  ✓ ${r.id.padEnd(22)} ${r.finalUrl}`)
  }
  if (drifted.length) {
    console.log(`drifted (captured but tab redirected): ${drifted.length}`)
    for (const r of drifted) {
      console.log(`  ~ ${r.id.padEnd(22)} ${r.error}  → ${r.finalUrl}`)
    }
  }
  if (skipped.length) {
    console.log(`optional misses: ${skipped.length}`)
    for (const r of skipped) console.log(`  · ${r.id.padEnd(22)} ${r.error}`)
  }
  if (failed.length) {
    console.log(`failures: ${failed.length}`)
    for (const r of failed) console.log(`  ✗ ${r.id.padEnd(22)} ${r.error}`)
  }

  const rel = path.relative(PROJECT_ROOT, args.outRoot)
  console.log(`\nArtifacts under: ${rel}/<section-id>/{reference.html,reference.png,meta.json}`)

  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('capture harness crashed:', err?.stack || err?.message || err)
  process.exit(1)
})
