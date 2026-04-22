#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readdir } from 'node:fs/promises'
import { launchBrowser } from './lib/browser.mjs'
import { buildApp, serveDist } from './lib/server.mjs'
import { PAGE_HELPERS_SCRIPT } from './lib/page-helpers.mjs'
import { formatReport } from './lib/assert.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CHECKS_DIR = path.join(__dirname, 'surface-checks')

function parseArgs(argv) {
  const args = { surface: null, appUrl: null, headed: false, skipBuild: false }
  for (const a of argv.slice(2)) {
    if (a.startsWith('--surface=')) args.surface = a.slice('--surface='.length)
    else if (a.startsWith('--app-url=')) args.appUrl = a.slice('--app-url='.length)
    else if (a === '--headed') args.headed = true
    else if (a === '--skip-build') args.skipBuild = true
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

function printUsage() {
  console.log(`Usage: node scripts/check-dom.mjs [options]

Options:
  --surface=<id>   Run only one surface check (e.g. --surface=top-nav)
  --app-url=<url>  Use a running app at this URL instead of building
  --skip-build     Skip vite build (use existing dist/)
  --headed         Launch browser with a visible window (debugging)
  -h, --help       Show this help
`)
}

async function loadChecks() {
  const files = (await readdir(CHECKS_DIR)).filter((f) => f.endsWith('.mjs')).sort()
  const checks = []
  for (const f of files) {
    const mod = await import(path.join(CHECKS_DIR, f))
    if (!mod.id || !mod.check) continue
    checks.push({ id: mod.id, name: mod.name || mod.id, run: mod.check, file: f })
  }
  return checks
}

async function main() {
  const args = parseArgs(process.argv)
  if (args.help) {
    printUsage()
    return 0
  }

  let appUrl = args.appUrl
  let stopServer = null

  if (!appUrl) {
    if (!args.skipBuild) {
      console.log('> vite build')
      await buildApp({ cwd: ROOT })
    }
    console.log('> serving dist/ on ephemeral port')
    const srv = await serveDist({ cwd: ROOT })
    appUrl = srv.url
    stopServer = srv.close
  }

  const checks = await loadChecks()
  const filtered = args.surface ? checks.filter((c) => c.id === args.surface) : checks
  if (args.surface && filtered.length === 0) {
    console.error(`Unknown surface id "${args.surface}". Available:`)
    for (const c of checks) console.error(`  - ${c.id}`)
    if (stopServer) await stopServer()
    return 2
  }

  console.log(`> launching browser (headless=${!args.headed})`)
  const browser = await launchBrowser({ headless: !args.headed })
  const ctx = await browser.newContext()
  await ctx.addInitScript({ content: PAGE_HELPERS_SCRIPT })

  const appPage = await ctx.newPage()
  appPage.on('pageerror', (err) => console.warn(`[app pageerror] ${err.message}`))
  try {
    console.log(`> navigating to app: ${appUrl}`)
    await appPage.goto(appUrl, { waitUntil: 'networkidle' })
    await appPage.waitForSelector('#root *', { timeout: 10000 }).catch(() => {})
  } catch (err) {
    console.error(`Failed to load app at ${appUrl}: ${err.message}`)
    await browser.close()
    if (stopServer) await stopServer()
    return 2
  }

  const results = []
  for (const c of filtered) {
    try {
      const { issues } = await c.run({ appPage })
      results.push({ id: c.id, name: c.name, issues })
    } catch (err) {
      results.push({ id: c.id, name: c.name, issues: [`check threw: ${err.message}`] })
    }
  }

  await browser.close()
  if (stopServer) await stopServer()

  const { text, ok, failed } = formatReport(results)
  console.log('\nSurface DOM alignment report')
  console.log('----------------------------')
  console.log(text)

  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(err.stack || err.message || err)
  process.exit(2)
})
