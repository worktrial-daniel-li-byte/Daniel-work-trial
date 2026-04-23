import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.more_actions — Per-column More actions menu', () => {
  test('More actions button opens menu with all expected items for In Progress column', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertion 1: The In Progress column heading is visible ───────────────
    await expect(
      page.getByRole('heading', { level: 3, name: 'In Progress' })
    ).toBeVisible()

    // Hover over the In Progress heading to surface the More actions button,
    // which may be CSS-hidden until the column header row is hovered.
    await page.getByRole('heading', { level: 3, name: 'In Progress' }).hover()

    const moreActionsBtn = page.getByRole('button', {
      name: 'More actions for column In Progress',
    })

    // ── Assertion 2: The per-column More actions trigger is present ──────────
    await expect(moreActionsBtn).toBeVisible()

    // ── OPEN the menu ────────────────────────────────────────────────────────
    await moreActionsBtn.click()

    // ── Assertion 3: The button becomes aria-expanded (menu is open) ─────────
    await expect(moreActionsBtn).toHaveAttribute('aria-expanded', 'true')

    // ── Assertion 4: The role=menu container is visible ──────────────────────
    const menu = page.getByRole('menu', {
      name: 'More actions for column In Progress',
    })
    await expect(menu).toBeVisible()

    // ── Assertions 5-9: Every expected menu item is visible ──────────────────
    // "Add agent BETA" — the BETA badge appears inline; exact name is "Add agent BETA"
    await expect(
      page.getByRole('menuitem', { name: 'Add agent BETA' })
    ).toBeVisible()

    await expect(
      page.getByRole('menuitem', { name: 'Rename status' })
    ).toBeVisible()

    // In Progress is a middle column — both directional moves are available
    await expect(
      page.getByRole('menuitem', { name: 'Move column left' })
    ).toBeVisible()

    await expect(
      page.getByRole('menuitem', { name: 'Move column right' })
    ).toBeVisible()

    await expect(
      page.getByRole('menuitem', { name: 'Delete status' })
    ).toBeVisible()

    // ── CLOSE the menu without mutating state ────────────────────────────────
    await page.keyboard.press('Escape')

    // ── Assertion 10: menu is dismissed after Escape ─────────────────────────
    await expect(menu).toHaveCount(0)
  })
})
