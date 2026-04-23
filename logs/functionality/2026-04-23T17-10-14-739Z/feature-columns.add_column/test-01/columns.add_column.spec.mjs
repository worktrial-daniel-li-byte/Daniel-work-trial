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

    // ── Assertion 1: the '+' / 'Create status' button is visible at row end ──
    const createStatusBtn = page.getByRole('button', { name: 'Create status' })
    await expect(createStatusBtn).toBeVisible()

    // ── MUTATE: click the '+' button to open the dialog ──────────────────────
    await createStatusBtn.click()

    // ── Assertion 2: dialog opens with correct heading ────────────────────────
    const dialog = page.getByRole('dialog', { name: 'Create status' })
    await expect(dialog).toBeVisible()

    // ── Assertion 3: dialog heading level 1 ───────────────────────────────────
    await expect(
      page.getByRole('heading', { level: 1, name: 'Create status' })
    ).toBeVisible()

    // ── Assertion 4: Name textbox is present (required field) ─────────────────
    await expect(
      page.getByRole('textbox', { name: 'Name' })
    ).toBeVisible()

    // ── Assertion 5: Submit button is disabled until name is filled ───────────
    await expect(
      page.getByRole('button', { name: 'Submit' })
    ).toBeDisabled()

    // ── REVERT: dismiss dialog via Cancel ────────────────────────────────────
    await page.getByRole('button', { name: 'Cancel' }).click()

    // ── Assertion 6: dialog is gone ───────────────────────────────────────────
    await expect(dialog).toBeHidden()

    // ── Assertions 7-9: original 3-column state is restored ──────────────────
    await expect(page.getByRole('heading', { name: 'To Do' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'In Progress' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Done' }).first()).toBeVisible()
  })
})
