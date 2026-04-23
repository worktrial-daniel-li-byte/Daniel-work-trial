/**
 * Single-section capture worker.
 *
 * Think of this as the "sub browser agent" spawned per section. It's purely
 * code-driven (no LLM): the task is deterministic — navigate, let the SPA
 * settle, run any pre-capture actions, then dump DOM + PNG + meta to disk.
 *
 * The orchestrator shares one persistent Chromium context across workers and
 * hands each worker a fresh page so captures are isolated but don't re-auth.
 */

import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

const VIEWPORT = { width: 1920, height: 1080 }

/**
 * Hide common cookie/consent banners so captured DOM matches what the reward
 * harness expects to see. We only inject CSS (no clicks) so login/hydration
 * stays untouched.
 */
const HIDE_NOISE_CSS = `
  [id*="onetrust" i], [class*="onetrust" i],
  [id*="cookie" i][class*="banner" i],
  [aria-label*="cookie" i][role="dialog"],
  [data-testid*="cookie" i] {
    display: none !important;
  }
`

/**
 * Wait for the Jira SPA to hydrate. Heuristic: networkidle + presence of
 * the project header + a short settle delay so lazy chunks land.
 */
async function settle(page, { settleMs = 1500, timeout = 30_000 } = {}) {
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {})
  await page
    .waitForSelector('[data-testid*="project"], main, [role="main"]', { timeout })
    .catch(() => {})
  await page.waitForTimeout(settleMs)
}

async function safeWriteJson(filePath, value) {
  await writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

/**
 * Returns true when the SPA redirected us somewhere that doesn't look like
 * the requested tab. Jira silently bounces missing tabs to /not-found or to
 * another tab (e.g. shortcuts → board), and we don't want those caches to
 * masquerade as the real thing.
 */
function detectRedirectDrift(section, finalUrl) {
  if (!finalUrl) return null
  let finalPath
  try {
    finalPath = new URL(finalUrl).pathname
  } catch {
    return null
  }
  if (finalPath.includes('/not-found')) {
    return 'redirected_to_not_found'
  }
  // Extract the last segment of the requested path ("summary", "board", ...)
  const requested = section.path.split('?')[0].split('/').filter(Boolean).pop()
  if (requested && !finalPath.toLowerCase().includes(requested.toLowerCase())) {
    return `redirected_off_tab (final=${finalPath})`
  }
  return null
}

/**
 * Capture one section. Resolves with a per-section report; never throws —
 * failures are reported as `{ ok: false, error }`.
 */
export async function captureSection({ context, section, outRoot, log }) {
  const startedAt = Date.now()
  const outDir = path.join(outRoot, section.id)
  await mkdir(outDir, { recursive: true })

  const page = await context.newPage()
  await page.setViewportSize(VIEWPORT)
  await page.addStyleTag({ content: HIDE_NOISE_CSS }).catch(() => {})

  const urlFull = section.url
  let navStatus = null
  let finalUrl = null
  let docTitle = null
  let errorMessage = null

  try {
    log(`→ ${section.id}: ${urlFull}`)
    const response = await page.goto(urlFull, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    navStatus = response?.status() ?? null

    if (section.preAction) {
      log(`   pre-action: ${section.preAction.description || 'custom'}`)
      await section.preAction(page).catch((err) => {
        log(`   pre-action warning: ${err?.message || err}`)
      })
    }

    await settle(page)
    // Re-inject after any late-mounting Atlassian UI.
    await page.addStyleTag({ content: HIDE_NOISE_CSS }).catch(() => {})

    finalUrl = page.url()
    docTitle = await page.title().catch(() => null)

    const drift = detectRedirectDrift(section, finalUrl)

    const html = await page.content()
    await writeFile(path.join(outDir, 'reference.html'), html, 'utf8')

    await page.screenshot({ path: path.join(outDir, 'reference.png'), fullPage: false })
    await page.screenshot({ path: path.join(outDir, 'reference.full.png'), fullPage: true })

    await safeWriteJson(path.join(outDir, 'meta.json'), {
      id: section.id,
      title: section.title,
      requested_url: urlFull,
      final_url: finalUrl,
      http_status: navStatus,
      doc_title: docTitle,
      viewport: VIEWPORT,
      captured_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      drift: drift || null,
    })

    if (drift) {
      log(`   drift ${drift}`)
      return {
        ok: false,
        drift: true,
        id: section.id,
        outDir,
        finalUrl,
        status: navStatus,
        error: drift,
        optional: Boolean(section.optional),
      }
    }
    log(`   ok  (${docTitle || 'no <title>'}, ${Date.now() - startedAt}ms)`)
    return {
      ok: true,
      id: section.id,
      outDir,
      finalUrl,
      status: navStatus,
      durationMs: Date.now() - startedAt,
    }
  } catch (err) {
    errorMessage = err?.message || String(err)
    log(`   FAIL ${errorMessage}`)
    await safeWriteJson(path.join(outDir, 'meta.json'), {
      id: section.id,
      title: section.title,
      requested_url: urlFull,
      final_url: finalUrl,
      http_status: navStatus,
      doc_title: docTitle,
      viewport: VIEWPORT,
      captured_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      error: errorMessage,
    }).catch(() => {})
    return {
      ok: false,
      id: section.id,
      outDir,
      error: errorMessage,
      optional: Boolean(section.optional),
    }
  } finally {
    await page.close().catch(() => {})
  }
}
