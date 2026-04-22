import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const REF_HTML = path.join(PROJECT_ROOT, 'reference_app', 'html', 'reference.html')
const OUT_DIR = path.join(PROJECT_ROOT, 'reward-artifacts', 'color-diff')
const APP_URL = 'http://localhost:5173'

const VIEWPORT_W = 1920
const VIEWPORT_H = 1080
const MEANINGFUL_TAGS = new Set([
  'h1','h2','h3','h4','h5','h6','p','a','button','input',
  'img','nav','header','footer','main','section','article',
  'li','td','th','label','span','textarea','select',
])

const HIDE_BANNER = `
<style data-injected="diff-colors">
  #page-layout\\.banner, [data-testid="page-layout.banner"] { display: none !important; }
  :root { --bannerHeight: 0 !important; }
  #unsafe-design-system-page-layout-root { --n_bnrM: 0 !important; }
</style>
`

function extractColorsInPage() {
  const items = [] // each: { role: 'bg'|'fg', rgb: [r,g,b], tag, text }
  const els = document.querySelectorAll('*')
  for (const el of els) {
    const rect = el.getBoundingClientRect()
    if (rect.width < 10 || rect.height < 10) continue
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) continue
    const snippet = (el.innerText || '').replace(/\s+/g, ' ').slice(0, 40)
    const bg = style.backgroundColor
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (m) items.push({ role: 'bg', rgb: [+m[1], +m[2], +m[3]], tag: el.tagName.toLowerCase(), text: snippet })
    }
    const fg = style.color
    if (fg) {
      const m = fg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (m) items.push({ role: 'fg', rgb: [+m[1], +m[2], +m[3]], tag: el.tagName.toLowerCase(), text: snippet })
    }
  }
  return items
}

function binKey([r, g, b], step = 32) {
  return `${Math.floor(r / step) * step},${Math.floor(g / step) * step},${Math.floor(b / step) * step}`
}
function binToHex(key) {
  const [r, g, b] = key.split(',').map(Number)
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
}

async function collect(page) {
  await page.waitForTimeout(300)
  return await page.evaluate(extractColorsInPage)
}

async function prepareRef() {
  const raw = await readFile(REF_HTML, 'utf8')
  const patched = raw.includes('</head>')
    ? raw.replace('</head>', `${HIDE_BANNER}</head>`)
    : HIDE_BANNER + raw
  await mkdir(OUT_DIR, { recursive: true })
  const tmp = path.join(OUT_DIR, 'reference-prepared.html')
  await writeFile(tmp, patched)
  return tmp
}

async function main() {
  const refPath = await prepareRef()
  const browser = await chromium.launch()

  const refCtx = await browser.newContext({ viewport: { width: VIEWPORT_W, height: VIEWPORT_H }, deviceScaleFactor: 1, javaScriptEnabled: false })
  const refPage = await refCtx.newPage()
  await refPage.goto(`file://${refPath}`, { waitUntil: 'domcontentloaded' })
  const refItems = await collect(refPage)
  await refCtx.close()

  const appCtx = await browser.newContext({ viewport: { width: VIEWPORT_W, height: VIEWPORT_H }, deviceScaleFactor: 1 })
  const appPage = await appCtx.newPage()
  await appPage.goto(APP_URL, { waitUntil: 'domcontentloaded' })
  try { await appPage.waitForLoadState('networkidle', { timeout: 3000 }) } catch {}
  const appItems = await collect(appPage)
  await appCtx.close()

  await browser.close()

  const refBins = new Map()
  const appBins = new Map()
  for (const it of refItems) {
    const k = binKey(it.rgb)
    if (!refBins.has(k)) refBins.set(k, { count: 0, samples: [] })
    const bin = refBins.get(k)
    bin.count++
    if (bin.samples.length < 3) bin.samples.push(`${it.role}:${it.tag}:"${it.text}"`)
  }
  for (const it of appItems) {
    const k = binKey(it.rgb)
    if (!appBins.has(k)) appBins.set(k, { count: 0, samples: [] })
    const bin = appBins.get(k)
    bin.count++
    if (bin.samples.length < 3) bin.samples.push(`${it.role}:${it.tag}:"${it.text}"`)
  }

  const refTotal = [...refBins.values()].reduce((s, b) => s + b.count, 0)
  const appTotal = [...appBins.values()].reduce((s, b) => s + b.count, 0)

  const allKeys = new Set([...refBins.keys(), ...appBins.keys()])
  const rows = []
  let intersection = 0
  for (const k of allKeys) {
    const rc = refBins.get(k)?.count ?? 0
    const ac = appBins.get(k)?.count ?? 0
    intersection += Math.min(rc, ac)
    const delta = ac - rc // positive = app has excess, negative = app missing
    rows.push({
      bin: k,
      hex: binToHex(k),
      ref: rc,
      app: ac,
      delta,
      refSamples: refBins.get(k)?.samples ?? [],
      appSamples: appBins.get(k)?.samples ?? [],
    })
  }
  const total = Math.max(refTotal, appTotal)
  const score = total > 0 ? intersection / total : 0

  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  console.log(`ref total: ${refTotal}, app total: ${appTotal}`)
  console.log(`color similarity: ${score.toFixed(4)}`)
  console.log(`\n== Top 25 bins by |delta| ==`)
  console.log(`${'hex'.padEnd(10)} ${'ref'.padStart(6)} ${'app'.padStart(6)} ${'Δ'.padStart(7)}  samples`)
  for (const r of rows.slice(0, 25)) {
    const sampleStr = r.delta < 0
      ? r.refSamples.slice(0, 2).join(' | ')
      : r.appSamples.slice(0, 2).join(' | ')
    console.log(`${r.hex.padEnd(10)} ${String(r.ref).padStart(6)} ${String(r.app).padStart(6)} ${String(r.delta).padStart(7)}  ${sampleStr}`)
  }

  await writeFile(path.join(OUT_DIR, 'diff.json'), JSON.stringify({ refTotal, appTotal, score, rows }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
