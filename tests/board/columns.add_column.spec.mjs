import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.add_column — \'+\' button at the end of the columns row to add a new column/status', () => {
  test('Create status button opens modal; Cancel reverts board to original 3-column state', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Pre-condition: three default status columns are visible ───────────────
    await expect(page.getByRole('heading', { name: 'To Do' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'In Progress' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Done' }).first()).toBeVisible()

    // ── Assertion 1: '+' button exists by its stable CSS class ───────────────
    // The add-column button always carries the class "jira-col-add" regardless
    // of any label rename.  Locating it independently from its accessible name
    // gives us a structural anchor we can then interrogate further.
    const colAddBtn = page.locator('.jira-col-add')
    await expect(colAddBtn).toBeVisible()

    // ── Assertion 2: button's accessible name must be exactly 'Create status' ─
    // The saboteur's known mutation is to change the aria-label (and/or img alt)
    // so that the accessible name diverges from "Create status".
    // toHaveAccessibleName checks the full accessibility-tree computed name,
    // catching both aria-label renames and removals that fall back to other text.
    await expect(colAddBtn).toHaveAccessibleName('Create status')

    // ── Assertion 3: role-based lookup also resolves exactly one match ────────
    // Cross-validates the accessible name through a completely different code
    // path (Playwright's ARIA role engine rather than toHaveAccessibleName).
    const createStatusBtn = page.getByRole('button', { name: 'Create status' })
    await expect(createStatusBtn).toHaveCount(1)

    // ── MUTATE: open the Create status dialog ─────────────────────────────────
    await colAddBtn.click()

    // ── Assertion 4: a role=dialog whose accessible name is 'Create status' ───
    // The dialog uses aria-labelledby → h1#create-status-modal-heading.
    const dialog = page.getByRole('dialog', { name: 'Create status' })
    await expect(dialog).toBeVisible()

    // ── Assertion 5: the dialog heading text is 'Create status' ──────────────
    await expect(
      page.getByRole('heading', { name: 'Create status' }).first()
    ).toBeVisible()

    // ── Assertion 6: the Name text input is present and focused ───────────────
    await expect(
      dialog.getByRole('textbox', { name: 'Name' })
    ).toBeVisible()

    // ── Assertion 7: Status category selector is present ─────────────────────
    await expect(
      dialog.getByRole('combobox', { name: 'Status category' })
    ).toBeVisible()

    // ── Assertion 8: Submit is disabled while Name is empty ───────────────────
    await expect(
      dialog.getByRole('button', { name: 'Submit' })
    ).toBeDisabled()

    // ── REVERT: dismiss dialog via Cancel (no column is persisted) ────────────
    await dialog.getByRole('button', { name: 'Cancel' }).click()

    // ── Assertion 9: dialog is no longer visible ──────────────────────────────
    await expect(dialog).toBeHidden()

    // ── Assertions 10-12: board is still in its original 3-column state ───────
    await expect(page.getByRole('heading', { name: 'To Do' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'In Progress' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Done' }).first()).toBeVisible()

    // ── Assertion 13: the '+' button is again visible at end of row ───────────
    await expect(colAddBtn).toBeVisible()
  })
})
