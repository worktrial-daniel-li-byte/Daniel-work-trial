import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const ARTIFACT_DIR = path.join(PROJECT_ROOT, 'test-artifacts')

const DEFAULT_APP_URL = 'http://localhost:5173'
const DEFAULT_TEST_DIR = 'tests'

// ── Dev server lifecycle (mirrors scripts/reward-check.mjs) ──────────────────

function waitForPort(host, port, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect({ host, port }, () => { sock.end(); resolve() })
      sock.on('error', () => {
        sock.destroy()
        if (Date.now() > deadline) return reject(new Error(`port ${port} never came up`))
        setTimeout(tryOnce, 300)
      })
    }
    tryOnce()
  })
}

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const sock = net.connect({ host, port }, () => { sock.end(); resolve(true) })
    sock.on('error', () => { sock.destroy(); resolve(false) })
  })
}

async function ensureDevServer({ appUrl, autoStart, loadState }) {
  const u = new URL(appUrl)
  const host = u.hostname
  const port = Number(u.port || (u.protocol === 'https:' ? 443 : 80))
  if (await isPortOpen(host, port)) {
    return { started: false, stop: async () => {} }
  }
  if (!autoStart) {
    throw new Error(`Nothing listening on ${host}:${port} and autoStart=false`)
  }

  if (loadState) {
    await new Promise((resolve, reject) => {
      const p = spawn('npm', ['run', 'state:load'], { cwd: PROJECT_ROOT, stdio: 'inherit' })
      p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`state:load exited ${code}`))))
      p.on('error', reject)
    })
  }

  const child = spawn('npm', ['run', 'dev', '--', '--port', String(port), '--host', host], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', (d) => process.stderr.write(`[dev] ${d}`))
  child.stderr.on('data', (d) => process.stderr.write(`[dev] ${d}`))

  await waitForPort(host, port, 45000)
  await new Promise((r) => setTimeout(r, 500))
  return {
    started: true,
    stop: async () => {
      child.kill('SIGTERM')
      await new Promise((r) => setTimeout(r, 300))
      if (!child.killed) child.kill('SIGKILL')
    },
  }
}

// ── Playwright runner ────────────────────────────────────────────────────────

function runPlaywright({ testTarget, jiraBase, jsonOutPath, extraArgs, headed }) {
  return new Promise((resolve, reject) => {
    const args = ['playwright', 'test', testTarget, '--reporter=json']
    if (headed) args.push('--headed')
    for (const a of extraArgs) args.push(a)

    const env = {
      ...process.env,
      JIRA_BASE_URL: jiraBase,
      // Tests using the persistent profile accept HEADLESS=1 to run without UI.
      HEADLESS: headed ? '0' : '1',
      PW_REPORTER: 'json',
      PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOutPath,
    }

    const child = spawn('npx', args, { cwd: PROJECT_ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdoutBuf = ''
    let stderrBuf = ''
    child.stdout.on('data', (d) => { stdoutBuf += d.toString(); process.stderr.write(`[pw] ${d}`) })
    child.stderr.on('data', (d) => { stderrBuf += d.toString(); process.stderr.write(`[pw:err] ${d}`) })
    child.on('error', reject)
    child.on('exit', (code) => resolve({ exitCode: code ?? -1, stdout: stdoutBuf, stderr: stderrBuf }))
  })
}

// ── JSON report → flat summary ───────────────────────────────────────────────

function flattenSuites(suite, acc = []) {
  if (!suite) return acc
  const specs = suite.specs || []
  for (const spec of specs) {
    for (const t of spec.tests || []) {
      const result = (t.results || [])[t.results.length - 1] || {}
      acc.push({
        file: suite.file || spec.file,
        title: spec.title,
        project: t.projectName,
        status: result.status,
        ok: spec.ok,
        duration_ms: result.duration,
        error: result.error ? (result.error.message || String(result.error)) : null,
      })
    }
  }
  for (const sub of suite.suites || []) flattenSuites(sub, acc)
  return acc
}

function summarizeReport(report) {
  const all = []
  for (const s of report.suites || []) flattenSuites(s, all)
  const counts = { total: all.length, passed: 0, failed: 0, skipped: 0, flaky: 0, timedOut: 0 }
  for (const t of all) {
    if (t.status === 'passed') counts.passed++
    else if (t.status === 'failed') counts.failed++
    else if (t.status === 'skipped') counts.skipped++
    else if (t.status === 'timedOut') counts.timedOut++
    else if (t.status === 'flaky') counts.flaky++
  }
  return { counts, tests: all }
}

// ── Public helper ────────────────────────────────────────────────────────────

export async function runTests({
  appUrl = DEFAULT_APP_URL,
  testDir = DEFAULT_TEST_DIR,
  artifactDir = ARTIFACT_DIR,
  autoStart = true,
  loadState = true,
  headed = false,
  extraArgs = [],
} = {}) {
  const runStamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = path.join(artifactDir, runStamp)
  await mkdir(outDir, { recursive: true })
  const jsonOutPath = path.join(outDir, 'playwright.json')

  const server = await ensureDevServer({ appUrl, autoStart, loadState })
  try {
    const { exitCode, stdout, stderr } = await runPlaywright({
      testTarget: testDir,
      jiraBase: appUrl,
      jsonOutPath,
      extraArgs,
      headed,
    })

    let report = null
    try {
      report = JSON.parse(await readFile(jsonOutPath, 'utf8'))
    } catch {
      // Fallback: Playwright writes the JSON report to stdout when
      // PLAYWRIGHT_JSON_OUTPUT_NAME is ignored. Try parsing stdout.
      const start = stdout.indexOf('{')
      if (start >= 0) {
        try { report = JSON.parse(stdout.slice(start)) } catch {}
      }
    }

    const summary = report
      ? summarizeReport(report)
      : { counts: { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0, timedOut: 0 }, tests: [] }

    const result = {
      app_url: appUrl,
      test_dir: testDir,
      started_at: new Date().toISOString(),
      exit_code: exitCode,
      counts: summary.counts,
      tests: summary.tests,
      artifact_dir: outDir,
    }
    await writeFile(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2))
    if (report) {
      await writeFile(path.join(outDir, 'playwright.json'), JSON.stringify(report, null, 2))
    } else {
      await writeFile(path.join(outDir, 'playwright.stdout.txt'), stdout)
      await writeFile(path.join(outDir, 'playwright.stderr.txt'), stderr)
    }
    return result
  } finally {
    await server.stop().catch(() => {})
  }
}

// ── CLI entry point ──────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    appUrl: DEFAULT_APP_URL,
    testDir: DEFAULT_TEST_DIR,
    autoStart: true,
    loadState: true,
    headed: false,
    extraArgs: [],
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--app-url') args.appUrl = argv[++i]
    else if (a === '--dir' || a === '--test-dir') args.testDir = argv[++i]
    else if (a === '--no-autostart') args.autoStart = false
    else if (a === '--no-load-state') args.loadState = false
    else if (a === '--headed') args.headed = true
    else if (a === '--grep') { args.extraArgs.push('--grep', argv[++i]) }
    else if (a === '--') { args.extraArgs.push(...argv.slice(i + 1)); i = argv.length }
    else if (a.startsWith('--')) args.extraArgs.push(a)
    else args.testDir = a
  }
  return args
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2))
  runTests(args)
    .then((result) => {
      const { counts, tests, exit_code, artifact_dir } = result
      console.log('')
      console.log('=== TEST RESULTS ===')
      console.log(`app url       ${result.app_url}`)
      console.log(`test dir      ${result.test_dir}`)
      console.log(`total         ${counts.total}`)
      console.log(`  passed      ${counts.passed}`)
      console.log(`  failed      ${counts.failed}`)
      console.log(`  skipped     ${counts.skipped}`)
      console.log(`  flaky       ${counts.flaky}`)
      console.log(`  timed out   ${counts.timedOut}`)
      console.log('')
      for (const t of tests) {
        const marker = t.status === 'passed' ? 'PASS' : t.status === 'skipped' ? 'SKIP' : 'FAIL'
        const rel = t.file ? path.relative(PROJECT_ROOT, t.file) : ''
        console.log(`  [${marker}] ${rel} — ${t.title}`)
        if (t.error) {
          const firstLine = String(t.error).split('\n')[0]
          console.log(`         ${firstLine}`)
        }
      }
      console.log('')
      console.log(`artifacts: ${artifact_dir}`)
      process.exit(exit_code === 0 ? 0 : 1)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
