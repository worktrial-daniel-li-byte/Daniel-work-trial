#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { launchBrowser } from './lib/browser.mjs'
import { buildApp, serveDist } from './lib/server.mjs'
import { formatReport } from './lib/assert.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function parseArgs(argv) {
  const args = { appUrl: null, skipBuild: false, headed: false }
  for (const a of argv.slice(2)) {
    if (a.startsWith('--app-url=')) args.appUrl = a.slice('--app-url='.length)
    else if (a === '--headed') args.headed = true
    else if (a === '--skip-build') args.skipBuild = true
  }
  return args
}

async function waitForCount(page, selector, expected, timeout = 4000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const n = await page.locator(selector).count()
    if (n === expected) return true
    await page.waitForTimeout(50)
  }
  return false
}

const CARD_SEL = '[data-testid="board.content.cell.card"], .jira-card'
const COLUMN_SEL = '[data-testid="board.content.cell"], .jira-col'
const DIALOG_SEL = '[role="dialog"][aria-labelledby="card-dialog-title"]'

async function clickTopBarCreate(page) {
  const byTestId = page.locator('[data-testid="atlassian-navigation--create-button"]')
  if (await byTestId.count() > 0) {
    await byTestId.first().click()
    return
  }
  const handle = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const inTopbar = buttons.filter((b) => {
      const txt = (b.textContent || '').trim()
      if (!/^\+?\s*create$/i.test(txt)) return false
      return !b.closest('.jira-col, [data-testid="board.content.cell"], [role="dialog"]')
    })
    return inTopbar[0] || null
  })
  const el = handle.asElement()
  if (!el) throw new Error('no top-bar Create button found')
  await el.click()
}

const SCENARIOS = [
  {
    id: 'create-card',
    name: 'Create card via top-bar Create button',
    async run(page) {
      const issues = []
      const before = await page.locator(CARD_SEL).count()

      try {
        await clickTopBarCreate(page)
      } catch (err) {
        issues.push(err.message)
        return { issues }
      }

      const dialog = page.locator(DIALOG_SEL)
      await dialog.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
      if (await dialog.count() === 0) {
        issues.push('composer dialog did not appear after clicking Create')
        return { issues }
      }

      const titleInput = dialog.locator('input').first()
      await titleInput.fill('Behavior test card')
      await dialog.locator('button[type="submit"]').click()

      const appeared = await waitForCount(page, CARD_SEL, before + 1, 3000)
      if (!appeared) issues.push('new card did not appear after submitting create form')

      const found = await page.getByText('Behavior test card', { exact: true }).first().count()
      if (!found) issues.push('card with submitted title not found in DOM')
      return { issues }
    },
  },

  {
    id: 'edit-card',
    name: 'Edit existing card changes its title',
    async run(page) {
      const issues = []
      const card = page.locator(CARD_SEL).first()
      if (await card.count() === 0) {
        issues.push('no card to edit')
        return { issues }
      }
      const editBtn = card.getByRole('button', { name: /^Edit/ })
      if (await editBtn.count() === 0) {
        issues.push('no Edit button found on first card')
        return { issues }
      }
      await editBtn.first().click()
      const dialog = page.locator(DIALOG_SEL)
      await dialog.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
      if (await dialog.count() === 0) {
        issues.push('edit dialog did not appear after clicking Edit')
        return { issues }
      }
      const titleInput = dialog.locator('input').first()
      await titleInput.fill('Edited via behavior check')
      await dialog.locator('button[type="submit"]').click()
      await page.waitForTimeout(150)
      const count = await page.getByText('Edited via behavior check', { exact: true }).first().count()
      if (!count) issues.push('edited title not found in DOM')
      return { issues }
    },
  },

  {
    id: 'delete-card',
    name: 'Delete card removes it from the board',
    async run(page) {
      const issues = []
      const cards = page.locator(CARD_SEL)
      const before = await cards.count()
      if (before === 0) {
        issues.push('no cards to delete')
        return { issues }
      }
      const deleteBtn = cards.first().getByRole('button', { name: /^Delete/ })
      if (await deleteBtn.count() === 0) {
        issues.push('no Delete button on first card')
        return { issues }
      }
      await deleteBtn.first().click()
      const ok = await waitForCount(page, CARD_SEL, before - 1, 3000)
      if (!ok) issues.push('card count did not decrement after delete')
      return { issues }
    },
  },

  {
    id: 'modal-backdrop-close',
    name: 'Clicking backdrop closes the composer',
    async run(page) {
      const issues = []
      try {
        await clickTopBarCreate(page)
      } catch (err) {
        issues.push(err.message)
        return { issues }
      }
      const dialog = page.locator(DIALOG_SEL)
      await dialog.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {})
      if (await dialog.count() === 0) {
        issues.push('dialog never appeared')
        return { issues }
      }
      // Click on the backdrop at the outer edge of viewport, outside dialog bbox.
      const dialogBox = await dialog.first().boundingBox()
      const viewport = page.viewportSize() || { width: 1280, height: 720 }
      let x = 5, y = 5
      if (dialogBox) {
        if (dialogBox.x > 20) {
          x = Math.max(2, dialogBox.x / 2)
          y = Math.max(2, dialogBox.y / 2)
        } else {
          x = Math.min(viewport.width - 2, dialogBox.x + dialogBox.width + 20)
          y = Math.min(viewport.height - 2, dialogBox.y + dialogBox.height + 20)
        }
      }
      await page.mouse.click(x, y)
      await page.waitForTimeout(200)
      if (await dialog.count() > 0 && await dialog.first().isVisible().catch(() => false)) {
        issues.push('backdrop click did not close the dialog')
        const cancel = dialog.getByRole('button', { name: 'Cancel' })
        if (await cancel.count()) await cancel.first().click()
      }
      return { issues }
    },
  },

  {
    id: 'drag-between-columns',
    name: 'Drag a card from To Do to In Progress',
    async run(page) {
      const issues = []
      const srcCard = page.locator(CARD_SEL).first()
      if (await srcCard.count() === 0) {
        issues.push('no card to drag; skipping')
        return { issues }
      }
      const columns = page.locator(COLUMN_SEL)
      if (await columns.count() < 2) {
        issues.push('need at least 2 columns to drag between')
        return { issues }
      }
      const target = columns.nth(1)
      try {
        await srcCard.dragTo(target)
      } catch (err) {
        issues.push(`dragTo failed: ${err.message}`)
        return { issues }
      }
      await page.waitForTimeout(200)
      const targetCardCount = await target.locator(CARD_SEL).count()
      if (targetCardCount < 1) issues.push('target column has no cards after drag')
      return { issues }
    },
  },
]

async function main() {
  const args = parseArgs(process.argv)
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

  console.log(`> launching browser (headless=${!args.headed})`)
  const browser = await launchBrowser({ headless: !args.headed })
  const results = []
  for (const s of SCENARIOS) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    page.on('pageerror', (err) => console.warn(`[${s.id} pageerror] ${err.message}`))
    try {
      await page.goto(appUrl, { waitUntil: 'networkidle' })
      await page.waitForSelector('#root *', { timeout: 10000 }).catch(() => {})
      const { issues } = await s.run(page)
      results.push({ id: s.id, name: s.name, issues })
    } catch (err) {
      results.push({ id: s.id, name: s.name, issues: [`threw: ${err.message}`] })
    } finally {
      await ctx.close()
    }
  }
  await browser.close()
  if (stopServer) await stopServer()

  const { text, failed } = formatReport(results)
  console.log('\nBehavior regression report')
  console.log('--------------------------')
  console.log(text)

  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(err.stack || err.message || err)
  process.exit(2)
})
