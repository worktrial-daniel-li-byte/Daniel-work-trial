import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import ssimModule from 'ssim.js'
const ssim = ssimModule.default ?? ssimModule.ssim ?? ssimModule

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const REF_HTML = path.join(PROJECT_ROOT, 'reference_app', 'html', 'reference.html')
const ARTIFACT_DIR = path.join(PROJECT_ROOT, 'reward-artifacts')

const VIEWPORT_W = 1920
const VIEWPORT_H = 1080
const SSIM_SIZE = 256
const DEFAULT_APP_URL = 'http://localhost:5173'
const MEANINGFUL_TAGS = [
  'h1','h2','h3','h4','h5','h6','p','a','button','input',
  'img','nav','header','footer','main','section','article',
  'li','td','th','label','span','textarea','select',
]

// pq-gram params (Augsten, Böhlen, Gamper 2005). Tuned for raw DOM wrapper
// matching — small p/q give denser overlap on a densely-nested tree.
const PQGRAM_P = 2
const PQGRAM_Q = 3

// Region anchors are CSS selectors matching a single subtree in both the
// reference and the candidate. Pulled from scripts/surface-checks/. Missing
// on gen but present on ref → score 0. Missing on ref → region is skipped.
const REGIONS = [
  { id: 'app-shell',       selector: '[data-testid="page-layout.root"]' },
  { id: 'top-nav',         selector: '[data-testid="page-layout.top-nav"]' },
  { id: 'left-nav',        selector: '[data-testid="page-layout.sidebar"]' },
  { id: 'horizontal-nav',  selector: '[data-testid="horizontal-nav.ui.content.horizontal-nav"]' },
  { id: 'project-header',  selector: '[data-testid="horizontal-nav-header.ui.project-header.header"]' },
  { id: 'board-toolbar',   selector: '[data-testid="business-filters.ui.filters.assignee-filter"]' },
  { id: 'board-canvas',    selector: '[data-testid="board.content.board-wrapper"]' },
  { id: 'modal-portal',    selector: 'body > .atlaskit-portal-container' },
  { id: 'rovo-fab',        selector: '[data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"]' },
]

// ── DOM extraction ────────────────────────────────────────────────────────────

function extractDomInPage(tagsList) {
  const meaningfulTags = new Set(tagsList)
  const blocks = []
  const colors = []
  const els = document.querySelectorAll('*')
  for (const el of els) {
    const rect = el.getBoundingClientRect()
    if (rect.width < 5 || rect.height < 5) continue
    const tag = el.tagName.toLowerCase()
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' ||
        parseFloat(style.opacity) === 0) continue
    if (rect.width >= 10 && rect.height >= 10) {
      const bg = style.backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (m) colors.push([parseInt(m[1]), parseInt(m[2]), parseInt(m[3])])
      }
      const fg = style.color
      if (fg) {
        const m = fg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (m) colors.push([parseInt(m[1]), parseInt(m[2]), parseInt(m[3])])
      }
    }
    if (rect.width >= window.innerWidth * 0.99 && rect.height >= window.innerHeight * 0.99) continue
    const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent'
    const hasBorder = style.borderWidth && style.borderWidth !== '0px'
    let directText = ''
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) directText += node.textContent
    }
    directText = directText.trim()
    if (meaningfulTags.has(tag) || directText.length > 0 || hasBg || hasBorder) {
      blocks.push({ tag, x: rect.x, y: rect.y, w: rect.width, h: rect.height })
    }
  }
  return {
    text: document.body ? document.body.innerText.trim() : '',
    blocks,
    colors,
  }
}

// ── Text similarity (port of difflib.SequenceMatcher.ratio) ───────────────────
// Gestalt pattern matching: recursively find the longest matching substring and
// sum match lengths. ratio = 2*M / (len(a)+len(b)).

function matchingBlocks(a, b, alo, ahi, blo, bhi, acc) {
  let bestI = alo, bestJ = blo, bestSize = 0
  const bIndex = new Map()
  for (let j = blo; j < bhi; j++) {
    const ch = b[j]
    if (!bIndex.has(ch)) bIndex.set(ch, [])
    bIndex.get(ch).push(j)
  }
  let j2len = new Map()
  for (let i = alo; i < ahi; i++) {
    const newJ2len = new Map()
    const js = bIndex.get(a[i])
    if (js) {
      for (const j of js) {
        if (j < blo) continue
        if (j >= bhi) break
        const k = (j2len.get(j - 1) ?? 0) + 1
        newJ2len.set(j, k)
        if (k > bestSize) { bestI = i - k + 1; bestJ = j - k + 1; bestSize = k }
      }
    }
    j2len = newJ2len
  }
  if (bestSize === 0) return
  matchingBlocks(a, b, alo, bestI, blo, bestJ, acc)
  acc.push(bestSize)
  matchingBlocks(a, b, bestI + bestSize, ahi, bestJ + bestSize, bhi, acc)
}

function sequenceRatio(a, b) {
  if (!a && !b) return 1
  if (!a || !b) return 0
  const lenA = a.length, lenB = b.length
  const acc = []
  matchingBlocks(a, b, 0, lenA, 0, lenB, acc)
  const matches = acc.reduce((s, n) => s + n, 0)
  return (2 * matches) / (lenA + lenB)
}

function textSimilarity(ref, gen) {
  return sequenceRatio(ref.toLowerCase(), gen.toLowerCase())
}

// ── Color palette similarity (port of color_palette_similarity) ───────────────

function quantizeRGB([r, g, b], step = 32) {
  return `${Math.floor(r / step) * step},${Math.floor(g / step) * step},${Math.floor(b / step) * step}`
}

function histogram(colors) {
  const h = new Map()
  for (const c of colors) {
    const k = quantizeRGB(c)
    h.set(k, (h.get(k) ?? 0) + 1)
  }
  return h
}

function colorPaletteSimilarity(refColors, genColors) {
  if (!refColors.length && !genColors.length) return 1
  if (!refColors.length || !genColors.length) return 0
  const refH = histogram(refColors)
  const genH = histogram(genColors)
  const keys = new Set([...refH.keys(), ...genH.keys()])
  let intersection = 0
  for (const k of keys) intersection += Math.min(refH.get(k) ?? 0, genH.get(k) ?? 0)
  const total = Math.max(
    [...refH.values()].reduce((s, n) => s + n, 0),
    [...genH.values()].reduce((s, n) => s + n, 0),
  )
  return total > 0 ? intersection / total : 0
}

// ── pq-grams (Augsten et al. 2005) ────────────────────────────────────────────
// Tree similarity via multiset overlap of (p-ancestor, q-sibling) label tuples.
// Extraction runs in-page so we never ship the DOM across the boundary.

function extractPqGramsInPage({ regions, p, q }) {
  const EXCLUDE = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META', 'TEMPLATE'])
  const SEP = '\x1f'
  const STAR = '*'

  const labelFor = (el) => {
    const tag = el.tagName.toLowerCase()
    const testid = el.getAttribute('data-testid')
    return testid ? `${tag}#${testid}` : tag
  }

  const gramsFor = (root) => {
    if (!root) return null
    const out = []
    const visit = (el, stem) => {
      const lbl = labelFor(el)
      const newStem = stem.length >= p ? stem.slice(1).concat([lbl]) : stem.concat([lbl])
      const effStem = newStem.length < p
        ? new Array(p - newStem.length).fill(STAR).concat(newStem)
        : newStem

      const kids = []
      for (const c of el.children) {
        if (!EXCLUDE.has(c.tagName)) kids.push(c)
      }

      if (kids.length === 0) {
        out.push(effStem.concat(new Array(q).fill(STAR)).join(SEP))
        return
      }

      const childLabels = kids.map(labelFor)
      const padded = new Array(q - 1).fill(STAR)
        .concat(childLabels)
        .concat(new Array(q - 1).fill(STAR))
      for (let i = 0; i <= padded.length - q; i++) {
        out.push(effStem.concat(padded.slice(i, i + q)).join(SEP))
      }
      for (const k of kids) visit(k, newStem)
    }
    visit(root, [])
    return out
  }

  const whole = gramsFor(document.body || document.documentElement)
  const regionGrams = {}
  for (const r of regions) {
    const el = document.querySelector(r.selector)
    regionGrams[r.id] = el ? gramsFor(el) : null
  }
  return { whole, regions: regionGrams }
}

function pqgramDiceSimilarity(a, b) {
  if (a == null && b == null) return 1
  if (a == null || b == null) return 0
  if (a.length === 0 && b.length === 0) return 1
  if (a.length === 0 || b.length === 0) return 0
  const ca = new Map(), cb = new Map()
  for (const g of a) ca.set(g, (ca.get(g) ?? 0) + 1)
  for (const g of b) cb.set(g, (cb.get(g) ?? 0) + 1)
  let inter = 0
  for (const [g, n] of ca) {
    const m = cb.get(g)
    if (m) inter += Math.min(n, m)
  }
  return (2 * inter) / (a.length + b.length)
}

// Combine whole + per-region similarities into a single scalar in [0,1].
// Weight: 50% whole structure, 50% mean of present regions. If no regions
// are present on the reference, fall back to the whole score.
function combinePqGram(whole, regions) {
  const present = Object.values(regions).filter((v) => typeof v === 'number')
  if (present.length === 0) return whole
  const meanRegion = present.reduce((s, v) => s + v, 0) / present.length
  return 0.5 * whole + 0.5 * meanRegion
}

// ── Screenshot → 256x256 RGBA pixel buffer ────────────────────────────────────

function decodePNG(buf) {
  return new Promise((resolve, reject) => {
    new PNG().parse(buf, (err, png) => (err ? reject(err) : resolve(png)))
  })
}

function resizeNearestRGBA(src, srcW, srcH, dstW, dstH) {
  const out = new Uint8ClampedArray(dstW * dstH * 4)
  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(srcH - 1, Math.floor((y * srcH) / dstH))
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(srcW - 1, Math.floor((x * srcW) / dstW))
      const si = (sy * srcW + sx) * 4
      const di = (y * dstW + x) * 4
      out[di] = src[si]
      out[di + 1] = src[si + 1]
      out[di + 2] = src[si + 2]
      out[di + 3] = 255
    }
  }
  return out
}

async function pngToSSIMInput(pngBuf) {
  const png = await decodePNG(pngBuf)
  const resized = resizeNearestRGBA(png.data, png.width, png.height, SSIM_SIZE, SSIM_SIZE)
  return { width: SSIM_SIZE, height: SSIM_SIZE, data: resized }
}

function visualSimilarity(refImg, genImg) {
  const { mssim } = ssim(refImg, genImg)
  return mssim
}

// ── Reward combination (mirror of compute_reward_from_info) ───────────────────

function computeReward(refInfo, genInfo) {
  const pqRegions = {}
  for (const r of REGIONS) {
    const refG = refInfo.pqgrams.regions[r.id]
    const genG = genInfo.pqgrams.regions[r.id]
    if (refG == null) continue
    pqRegions[r.id] = genG == null ? 0 : pqgramDiceSimilarity(refG, genG)
  }
  const pqWhole = pqgramDiceSimilarity(refInfo.pqgrams.whole, genInfo.pqgrams.whole)
  const pqCombined = combinePqGram(pqWhole, pqRegions)

  const details = {
    ssim: visualSimilarity(refInfo.image, genInfo.image),
    text: textSimilarity(refInfo.text, genInfo.text),
    color: colorPaletteSimilarity(refInfo.colors, genInfo.colors),
    pqgram: { whole: pqWhole, regions: pqRegions, combined: pqCombined },
  }
  const content = Math.max(details.text, details.color)
  const contentGate = 0.2 + 0.8 * content
  const gatedSSIM = details.ssim * contentGate
  const raw =
    0.50 * gatedSSIM +
    0.20 * details.text +
    0.10 * details.color +
    0.20 * pqCombined
  const reward = 2 * raw - 1
  return { reward, details: { ...details, content_gate: contentGate } }
}

// ── Dev server lifecycle ──────────────────────────────────────────────────────

function waitForPort(host, port, timeoutMs = 30000) {
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
  if (await isPortOpen(host, port)) return { started: false, stop: async () => {} }
  if (!autoStart) throw new Error(`Nothing listening on ${host}:${port} and autoStart=false`)

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

// ── Page → info ───────────────────────────────────────────────────────────────

async function gotoAndSettle(page, target, { settleMs = 500, networkidleMs = 6000 } = {}) {
  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 })
  try { await page.waitForLoadState('networkidle', { timeout: networkidleMs }) } catch {}
  await page.waitForTimeout(settleMs)
}

async function extractInfoFromPage(page, screenshotPath) {
  const dom = await page.evaluate(extractDomInPage, MEANINGFUL_TAGS)
  dom.pqgrams = await page.evaluate(extractPqGramsInPage, {
    regions: REGIONS,
    p: PQGRAM_P,
    q: PQGRAM_Q,
  })
  const screenshot = await page.screenshot({ fullPage: false, type: 'png' })
  if (screenshotPath) {
    await mkdir(path.dirname(screenshotPath), { recursive: true })
    await writeFile(screenshotPath, screenshot)
  }
  dom.image = await pngToSSIMInput(screenshot)
  return dom
}

// ── Public helper ─────────────────────────────────────────────────────────────

// CSS injected into the reference HTML to match the "Accept all" state:
// hides the Atlassian cookie banner and zeros out its reserved 105px.
const HIDE_COOKIE_BANNER_CSS = `
<style data-injected="reward-check">
  #page-layout\\.banner, [data-testid="page-layout.banner"] { display: none !important; }
  :root { --bannerHeight: 0 !important; }
  #unsafe-design-system-page-layout-root { --n_bnrM: 0 !important; }
</style>
`

async function prepareReferenceHtml(refHtml, outDir) {
  const raw = await readFile(refHtml, 'utf8')
  const patched = raw.includes('</head>')
    ? raw.replace('</head>', `${HIDE_COOKIE_BANNER_CSS}</head>`)
    : HIDE_COOKIE_BANNER_CSS + raw
  await mkdir(outDir, { recursive: true })
  const tmpPath = path.join(outDir, 'reference-prepared.html')
  await writeFile(tmpPath, patched)
  return tmpPath
}

export async function runReward({
  appUrl = DEFAULT_APP_URL,
  refHtml = REF_HTML,
  artifactDir = ARTIFACT_DIR,
  autoStart = true,
  loadState = true,
  settleMs = 500,
} = {}) {
  const runStamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = path.join(artifactDir, runStamp)
  const refShotPath = path.join(outDir, 'board.png')
  const genShotPath = path.join(outDir, 'app.png')

  const server = await ensureDevServer({ appUrl, autoStart, loadState })
  const browser = await chromium.launch({ headless: true })
  try {
    // Reference is a static saved-page snapshot. Its inline scripts try to
    // hydrate a live Jira SPA, fail without CDN/auth, and wipe the pre-rendered
    // DOM. Disable JS on the reference context to preserve the static render.
    const refContext = await browser.newContext({
      viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
      deviceScaleFactor: 1,
      javaScriptEnabled: false,
    })
    const preparedRefPath = await prepareReferenceHtml(refHtml, outDir)
    const refPage = await refContext.newPage()
    await gotoAndSettle(refPage, `file://${preparedRefPath}`, { settleMs })
    const refInfo = await extractInfoFromPage(refPage, refShotPath)
    await refContext.close()

    const genContext = await browser.newContext({
      viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
      deviceScaleFactor: 1,
    })
    const genPage = await genContext.newPage()
    await gotoAndSettle(genPage, appUrl, { settleMs })
    const genInfo = await extractInfoFromPage(genPage, genShotPath)
    await genContext.close()

    const { reward, details } = computeReward(refInfo, genInfo)

    const result = {
      reward,
      details,
      ref: {
        url: `file://${path.resolve(refHtml)}`,
        text_len: refInfo.text.length,
        blocks: refInfo.blocks.length,
        colors: refInfo.colors.length,
        screenshot: refShotPath,
      },
      gen: {
        url: appUrl,
        text_len: genInfo.text.length,
        blocks: genInfo.blocks.length,
        colors: genInfo.colors.length,
        screenshot: genShotPath,
      },
    }
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2))
    return result
  } finally {
    await browser.close().catch(() => {})
    await server.stop().catch(() => {})
  }
}

// ── CLI entry point ───────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { appUrl: DEFAULT_APP_URL, autoStart: true, loadState: true }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--app-url') args.appUrl = argv[++i]
    else if (a === '--ref-html') args.refHtml = argv[++i]
    else if (a === '--no-autostart') args.autoStart = false
    else if (a === '--no-load-state') args.loadState = false
    else if (a === '--settle-ms') args.settleMs = Number(argv[++i])
  }
  return args
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2))
  runReward(args)
    .then((result) => {
      const { reward, details } = result
      const fmt = (n) => n.toFixed(4)
      console.log('')
      console.log('=== REWARD ===')
      console.log(`reward        ${fmt(reward)}   (range: [-1, 1])`)
      console.log(`  ssim        ${fmt(details.ssim)}`)
      console.log(`  text        ${fmt(details.text)}`)
      console.log(`  color       ${fmt(details.color)}`)
      console.log(`  pqgram      ${fmt(details.pqgram.combined)}  (whole ${fmt(details.pqgram.whole)})`)
      for (const [id, v] of Object.entries(details.pqgram.regions)) {
        console.log(`    ${id.padEnd(16)} ${fmt(v)}`)
      }
      console.log(`  content_gate${fmt(details.content_gate).padStart(13)}`)
      console.log('')
      console.log(`ref screenshot: ${result.ref.screenshot}`)
      console.log(`gen screenshot: ${result.gen.screenshot}`)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
