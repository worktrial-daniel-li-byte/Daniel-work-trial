import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const REF_HTML = path.join(PROJECT_ROOT, 'reference_app', 'html', 'reference.html')
const OUT_DIR = path.join(PROJECT_ROOT, 'reward-artifacts', 'design-tokens')

const VIEWPORT_W = 1920
const VIEWPORT_H = 1080

const HIDE_BANNER = `
<style data-injected="extract-tokens">
  #page-layout\\.banner, [data-testid="page-layout.banner"] { display: none !important; }
  :root { --bannerHeight: 0 !important; }
  #unsafe-design-system-page-layout-root { --n_bnrM: 0 !important; }
</style>
`

// Named probe points (x, y in 1920x1080) chosen from the reference screenshot to hit each region.
const PROBES = [
  { name: 'topbar', x: 960, y: 28 },
  { name: 'topbar_search_bg', x: 960, y: 40 },
  { name: 'sidebar', x: 120, y: 500 },
  { name: 'sidebar_active', x: 120, y: 305 }, // "Autoloop" highlighted
  { name: 'project_title_row', x: 500, y: 130 },
  { name: 'tabs_row', x: 500, y: 170 },
  { name: 'board_bar', x: 500, y: 220 },
  { name: 'workspace_bg', x: 1700, y: 900 }, // open area below cards
  { name: 'column_bg', x: 340, y: 450 },
  { name: 'column_header', x: 340, y: 275 },
  { name: 'card_bg', x: 340, y: 340 },
  { name: 'create_button_primary', x: 1640, y: 28 }, // "+ Create" in topbar
  { name: 'body_text', x: 500, y: 130 },
]

async function prepare() {
  const raw = await readFile(REF_HTML, 'utf8')
  const patched = raw.includes('</head>')
    ? raw.replace('</head>', `${HIDE_BANNER}</head>`)
    : HIDE_BANNER + raw
  await mkdir(OUT_DIR, { recursive: true })
  const tmp = path.join(OUT_DIR, 'reference-prepared.html')
  await writeFile(tmp, patched)
  return tmp
}

function toHex(rgbStr) {
  if (!rgbStr) return null
  const m = rgbStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/)
  if (!m) return rgbStr
  const [, r, g, b, a] = m
  const hex = '#' + [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
  if (a !== undefined && Number(a) < 1) return `${hex} @${a}`
  return hex
}

async function main() {
  const preparedPath = await prepare()

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
    deviceScaleFactor: 1,
    javaScriptEnabled: false,
  })
  const page = await ctx.newPage()
  await page.goto(`file://${preparedPath}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)

  const result = await page.evaluate((probes) => {
    function describe(el, depth = 0) {
      if (!el) return null
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        testid: el.getAttribute('data-testid'),
        text: (el.innerText || '').slice(0, 60),
        class: (el.className && typeof el.className === 'string' ? el.className.slice(0, 120) : ''),
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        bg: cs.backgroundColor,
        color: cs.color,
        borderColor: cs.borderColor,
        borderWidth: cs.borderWidth,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        font: `${cs.fontFamily} | ${cs.fontSize} / ${cs.lineHeight} / ${cs.fontWeight}`,
        letterSpacing: cs.letterSpacing,
        _depth: depth,
      }
    }

    // Walk up from an elementFromPoint until we find a node with an opaque bg or definite text color
    function opaqueBgWalk(el) {
      let cur = el
      while (cur && cur !== document.documentElement) {
        const cs = getComputedStyle(cur)
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
          return cur
        }
        cur = cur.parentElement
      }
      return el
    }

    const out = { probes: {} }
    for (const p of probes) {
      const el = document.elementFromPoint(p.x, p.y)
      const bgEl = opaqueBgWalk(el)
      out.probes[p.name] = {
        at: p,
        hit: describe(el),
        opaqueParent: describe(bgEl),
      }
    }

    // also extract body / common text styles
    out.body = describe(document.body)
    out.h1 = describe(document.querySelector('h1'))
    out.h2 = describe(document.querySelector('h2'))
    out.firstButton = describe(document.querySelector('button'))

    // Find the primary blue "Create" button by text
    const createBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      /^\s*\+?\s*create\s*$/i.test(b.innerText || ''),
    )
    out.createBtn = describe(createBtn)

    // Column heading ("TO DO", "IN PROGRESS", "DONE") — pull first one by text
    const allEls = Array.from(document.querySelectorAll('div, span, h2, h3, h4'))
    const colHeading = allEls.find((el) => /^(to do|in progress|done)$/i.test((el.innerText || '').trim()))
    out.columnHeading = describe(colHeading)

    // A card: look for an element containing a key like "AUT-"
    const cardCandidate = Array.from(document.querySelectorAll('[role="button"], a, article, div')).find((el) =>
      /AUT-\d+/.test(el.innerText || ''),
    )
    out.cardCandidate = describe(cardCandidate)

    return out
  }, PROBES)

  await page.screenshot({ path: path.join(OUT_DIR, 'annotated.png'), fullPage: false })

  // Add hex equivalents
  function annotate(obj) {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(annotate)
    const copy = {}
    for (const [k, v] of Object.entries(obj)) {
      copy[k] = annotate(v)
      if (/^(bg|color|borderColor)$/.test(k) && typeof v === 'string') {
        copy[k + '_hex'] = toHex(v)
      }
    }
    return copy
  }

  const annotated = annotate(result)
  const jsonPath = path.join(OUT_DIR, 'tokens.json')
  await writeFile(jsonPath, JSON.stringify(annotated, null, 2))
  console.log(`Wrote ${jsonPath}`)
  console.log('\n=== HIGHLIGHTS ===')
  for (const [name, info] of Object.entries(annotated.probes)) {
    const bg = info.opaqueParent?.bg_hex || info.hit?.bg_hex
    const color = info.hit?.color_hex
    const tag = info.hit?.tag + (info.hit?.testid ? `[data-testid=${info.hit.testid}]` : '')
    console.log(`${name.padEnd(22)} bg=${bg || '-'}  color=${color || '-'}  (${tag})`)
  }
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
