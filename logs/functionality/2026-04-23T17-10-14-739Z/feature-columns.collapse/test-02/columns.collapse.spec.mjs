import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.collapse — Each column has a collapse toggle', () => {
  test('collapse buttons present for every status column, toggle state mutates and reverts', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // The Collapse buttons live in the DOM but are CSS-hidden until their
    // column header row is hovered.  Hover each heading (a descendant of the
    // header row) to trigger the ancestor :hover state and reveal the buttons
    // before asserting visibility.  Per-status accessible names ensure we
    // never accidentally target the persistent 'Collapse sidebar' button.
    const todoHeading   = page.getByRole('heading', { name: 'To Do' }).first()
    const inProgHeading = page.getByRole('heading', { name: 'In Progress' }).first()
    const doneHeading   = page.getByRole('heading', { name: 'Done' }).first()

    // ── Assertions 1-3: Collapse button visible per column (revealed by hover) ─
    await todoHeading.hover()
    await expect(page.getByRole('button', { name: 'Collapse To Do' })).toBeVisible()

    await inProgHeading.hover()
    await expect(page.getByRole('button', { name: 'Collapse In Progress' })).toBeVisible()

    await doneHeading.hover()
    await expect(page.getByRole('button', { name: 'Collapse Done' })).toBeVisible()

    // ── MUTATE: hover 'To Do' header, then click its collapse toggle ──────────
    await todoHeading.hover()
    await page.getByRole('button', { name: 'Collapse To Do' }).click()

    // ── Assertions 4-5: toggle flips to 'Expand To Do'; Collapse is gone ──────
    // Collapsed-column headers are always shown, so Expand To Do is visible
    // without an additional hover.
    await expect(page.getByRole('button', { name: 'Expand To Do' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse To Do' })).toHaveCount(0)

    // ── REVERT: click 'Expand To Do' to restore the column ───────────────────
    await page.getByRole('button', { name: 'Expand To Do' }).click()

    // ── Assertions 6-7: board restored — Collapse To Do back, Expand To Do gone
    // Re-hover the heading to reveal the now-restored Collapse button.
    await todoHeading.hover()
    await expect(page.getByRole('button', { name: 'Collapse To Do' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand To Do' })).toHaveCount(0)
  })
})
