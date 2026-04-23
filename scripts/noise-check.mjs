import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runReward } from './reward-check.mjs'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '..')
const REF_ROOT = path.join(ROOT, 'reference_app')

// Noise must be reward-neutral. Anything drifting more than this per sub-score
// is a real change, not noise, and triggers REVERT. Empirical floor on the
// reward pipeline's render nondeterminism is ~5e-4; 2e-3 is a comfortable cap.
const TOLERANCE = 0.002

const METRIC_KEYS = [
  'reward',
  'ssim',
  'text',
  'color',
  'pqgram',
  'a11y_pqgram',
  'class_density',
]

function listSections() {
  return fs
    .readdirSync(REF_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(REF_ROOT, name, 'reference.html')))
    .sort()
}

function parseArgs(argv) {
  let section = null
  let nonInteractive = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--section' || a === '-s') section = argv[++i]
    else if (a === '--yes' || a === '-y') nonInteractive = true
    else if (!a.startsWith('-')) section = a
  }
  if (section) section = section.replace(/^\/+/, '').trim()
  return { section, nonInteractive }
}

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    return await new Promise((resolve) => rl.question(question, resolve))
  } finally {
    rl.close()
  }
}

async function resolveSection(cliSection) {
  const sections = listSections()
  if (cliSection) {
    if (!sections.includes(cliSection)) {
      console.error(
        `Unknown section: "${cliSection}". Available: ${sections.join(', ')}`,
      )
      process.exit(1)
    }
    return cliSection
  }
  console.log('Pick a section to score against:')
  sections.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s}`))
  const answer = (await ask('\nChoice (number or name): ')).trim().replace(/^\/+/, '')
  if (/^\d+$/.test(answer)) {
    const idx = Number(answer) - 1
    if (idx < 0 || idx >= sections.length) {
      console.error('Out of range.')
      process.exit(1)
    }
    return sections[idx]
  }
  if (!sections.includes(answer)) {
    console.error(`Unknown section "${answer}". Available: ${sections.join(', ')}`)
    process.exit(1)
  }
  return answer
}

function extractMetrics(result) {
  return {
    reward: result.reward,
    ssim: result.details.ssim,
    text: result.details.text,
    color: result.details.color,
    pqgram: result.details.pqgram.combined,
    a11y_pqgram: result.details.a11y_pqgram,
    class_density: result.details.class_density.score,
  }
}

function fmt(n) {
  if (!Number.isFinite(n)) return ' NaN   '
  const s = (n >= 0 ? ' ' : '') + n.toFixed(4)
  return s.padStart(8)
}

function fmtDelta(n) {
  const sign = n > 0 ? '+' : (n < 0 ? '-' : ' ')
  return sign + Math.abs(n).toFixed(4)
}

function printTable(before, after) {
  const header = '            BEFORE     AFTER      Δ'
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const k of METRIC_KEYS) {
    const b = before[k]
    const a = after[k]
    const d = a - b
    const flag = Math.abs(d) > TOLERANCE ? '  *' : ''
    console.log(`${k.padEnd(12)} ${fmt(b)}  ${fmt(a)}  ${fmtDelta(d)}${flag}`)
  }
}

async function scoreOnce(refHtml, phase) {
  console.log(`\n— running reward (${phase}) —`)
  const result = await runReward({ refHtml })
  const metrics = extractMetrics(result)
  console.log(`  reward ${metrics.reward.toFixed(4)}  ssim ${metrics.ssim.toFixed(4)}  text ${metrics.text.toFixed(4)}  color ${metrics.color.toFixed(4)}  pqgram ${metrics.pqgram.toFixed(4)}  a11y ${metrics.a11y_pqgram.toFixed(4)}  class_dens ${metrics.class_density.toFixed(4)}`)
  return metrics
}

async function main() {
  const { section: cliSection, nonInteractive } = parseArgs(process.argv.slice(2))
  const section = await resolveSection(cliSection)
  const refHtml = path.join(REF_ROOT, section, 'reference.html')

  console.log(`\nSection: ${section}`)
  console.log(`Reference: ${path.relative(ROOT, refHtml)}`)
  console.log(`Tolerance per sub-score: ±${TOLERANCE}`)

  const before = await scoreOnce(refHtml, 'BEFORE')

  console.log('\n' + '='.repeat(64))
  console.log('NOISE WINDOW — apply your changes now.')
  console.log('')
  console.log('  Follow the "NOISE PROMPT" block at the bottom of')
  console.log('  prompts/noise-invariance.md. Edits should be confined to')
  console.log('  head-level markup (index.html) unless that prompt says')
  console.log('  otherwise. Do NOT touch reference_app/**, scripts/**,')
  console.log('  or fixtures between the two scores.')
  console.log('='.repeat(64))

  if (!nonInteractive) {
    await ask('\nPress ENTER once your noise is applied to re-score… ')
  } else {
    console.log('\n--yes passed: skipping pause, re-scoring immediately.')
  }

  const after = await scoreOnce(refHtml, 'AFTER')

  console.log('\n' + '='.repeat(64))
  printTable(before, after)
  console.log('')

  const violations = METRIC_KEYS
    .map((k) => ({ k, delta: after[k] - before[k] }))
    .filter((m) => Math.abs(m.delta) > TOLERANCE)

  if (violations.length === 0) {
    console.log(`VERDICT: KEEP — all sub-scores within ±${TOLERANCE}. Noise is reward-neutral.`)
    process.exit(0)
  } else {
    const names = violations.map((v) => `${v.k} (${fmtDelta(v.delta)})`).join(', ')
    console.log(`VERDICT: REVERT — moved beyond tolerance: ${names}`)
    console.log('The noise you applied is NOT reward-neutral. Revert it and try a smaller addition.')
    process.exit(2)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
