import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.add_column — \'+\' button at the end of the columns row to add a new column/status', () => {
  test('Create status button opens modal; Cancel reverts board to original 3-column state', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Pre-condition: three default status columns are visible ──────────────
    await expect(page.getByRole('heading', { name: 'To Do' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'In Progress' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Done' }).first()).toBeVisible()

    // ── Assertion 1: locate the '+' button via its structural DOM signature ───
    // The button is icon-only; the evidence shows it contains an <img> whose
    // alt attribute IS "Create status".  Using this CSS selector as the primary
    // anchor means the test fails if the img alt text is changed — a rename
    // that `getByRole('button', { name: … })` alone would not catch when the
    // aria-label override is altered but the img alt is left intact (or vice
    // versa).
    const createStatusBtn = page.locator('button:has(img[alt="Create status"])')
    await expect(createStatusBtn).toHaveCount(1)
    await expect(createStatusBtn).toBeVisible()

    // ── Assertion 2: button's COMPUTED accessible name must be 'Create status' ─
    // toHaveAccessibleName checks the accessibility-tree value (aria-label,
    // aria-labelledby, or alt-text fallback chain in that priority order).
    // If the aria-label is renamed to e.g. "Add column" it overrides the img
    // alt and this assertion fails, making the test load-bearing against
    // either mutation path.
    await expect(createStatusBtn).toHaveAccessibleName('Create status')

    // ── MUTATE: click the '+' button to open the dialog ──────────────────────
    await createStatusBtn.click()

    // ── Assertion 3: a role=dialog with accessible name 'Create status' opens ─
    const dialog = page.getByRole('dialog', { name: 'Create status' })
    await expect(dialog).toBeVisible()

    // ── Assertion 4: dialog heading level=1 is 'Create status' ───────────────
    await expect(
      dialog.getByRole('heading', { level: 1, name: 'Create status' })
    ).toBeVisible()

    // ── Assertion 5: required 'Name' textbox is present inside the dialog ─────
    await expect(
      dialog.getByRole('textbox', { name: 'Name' })
    ).toBeVisible()

    // ── Assertion 6: 'Status category' combobox is visible (defaults to To do)─
    await expect(
      dialog.getByRole('combobox', { name: 'Status category' })
    ).toBeVisible()

    // ── Assertion 7: Submit button is disabled when Name is empty ─────────────
    await expect(
      dialog.getByRole('button', { name: 'Submit' })
    ).toBeDisabled()

    // ── REVERT: dismiss the dialog without persisting any change ─────────────
    await dialog.getByRole('button', { name: 'Cancel' }).click()

    // ── Assertion 8: dialog is completely removed from the page ──────────────
    await expect(dialog).toBeHidden()

    // ── Assertions 9-11: original 3-column state is restored ─────────────────
    await expect(page.getByRole('heading', { name: 'To Do' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'In Progress' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Done' }).first()).toBeVisible()

    // ── Assertion 12: the '+' Create status button is visible again ───────────
    await expect(createStatusBtn).toBeVisible()
  })
})
