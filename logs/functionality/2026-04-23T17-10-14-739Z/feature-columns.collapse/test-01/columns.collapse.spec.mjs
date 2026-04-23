import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.collapse — Each column has a collapse toggle', () => {
  test('collapse buttons present for every status column, toggle state mutates and reverts', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertions 1-3: all three Collapse buttons are initially visible ──────
    // The notes warn that a persistent 'Collapse sidebar' button also exists;
    // the per-status accessible names keep these locators unambiguous.
    const collapseToDoBtn      = page.getByRole('button', { name: 'Collapse To Do' })
    const collapseInProgBtn    = page.getByRole('button', { name: 'Collapse In Progress' })
    const collapseDoneBtn      = page.getByRole('button', { name: 'Collapse Done' })

    await expect(collapseToDoBtn).toBeVisible()
    await expect(collapseInProgBtn).toBeVisible()
    await expect(collapseDoneBtn).toBeVisible()

    // ── Assertion 4: column headings are present before mutation ──────────────
    await expect(page.getByRole('heading', { name: 'To Do' }).first()).toBeVisible()

    // ── MUTATE: collapse the 'To Do' column ───────────────────────────────────
    await collapseToDoBtn.click()

    // ── Assertions 5-6: button toggles to 'Expand To Do'; Collapse is gone ───
    await expect(page.getByRole('button', { name: 'Expand To Do' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse To Do' })).toHaveCount(0)

    // ── Assertion 7: sibling collapse buttons are unaffected ──────────────────
    await expect(page.getByRole('button', { name: 'Collapse In Progress' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse Done' })).toBeVisible()

    // ── REVERT: expand the 'To Do' column back ────────────────────────────────
    await page.getByRole('button', { name: 'Expand To Do' }).click()

    // ── Assertions 8-9: board restored — Collapse To Do is back, Expand gone ─
    await expect(page.getByRole('button', { name: 'Collapse To Do' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand To Do' })).toHaveCount(0)

    // ── Assertion 10: all three Collapse buttons are visible again ────────────
    await expect(page.getByRole('button', { name: 'Collapse In Progress' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse Done' })).toBeVisible()
  })
})
