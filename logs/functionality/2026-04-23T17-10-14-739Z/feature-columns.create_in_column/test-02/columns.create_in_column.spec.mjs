import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.create_in_column — Per-column inline create form', () => {
  test('Create button opens inline form with all expected fields; Escape dismisses without persisting', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertion 1: In Progress column heading is visible ───────────────────
    const inProgressHeading = page.getByRole('heading', { level: 3, name: 'In Progress' })
    await expect(inProgressHeading).toBeVisible()

    // Scope the column by walking UP from the heading to the nearest ancestor
    // that contains a "Create" button.  Using `div.filter({ has: heading }).first()`
    // selects the outermost page-wrapper div (which also contains the top-nav
    // "Create" button), causing strict-mode failures.  The ancestor XPath picks
    // [1] = the CLOSEST ancestor, i.e. the column div itself.
    const inProgressColumn = inProgressHeading
      .locator('xpath=ancestor::*[.//button[normalize-space(.)="Create"]][1]')

    // ── Assertion 2: The per-column Create button is present before clicking ──
    const createBtn = inProgressColumn.getByRole('button', { name: 'Create', exact: true })
    await expect(createBtn).toBeVisible()

    // ── MUTATE: click Create to open the inline form ─────────────────────────
    await createBtn.click()

    // ── Assertion 3: The textarea is present and receives focus ──────────────
    const textbox = page.getByRole('textbox', { name: 'What needs to be done?' })
    await expect(textbox).toBeFocused()

    // ── Assertion 4: Instructional status text appears inside the form ────────
    await expect(
      page.getByText(/press Enter to submit/)
    ).toBeVisible()

    // ── Assertion 5: Work type selector is visible inside the form ────────────
    await expect(
      page.getByRole('button', { name: /Select work type\. Task currently selected\./ })
    ).toBeVisible()

    // ── Assertion 6: Due date picker is visible inside the form ───────────────
    await expect(
      page.getByRole('button', { name: 'Due date' })
    ).toBeVisible()

    // ── Assertion 7: Assignee selector is visible inside the form ─────────────
    await expect(
      page.getByRole('button', { name: 'Assignee: Unassigned' })
    ).toBeVisible()

    // ── Assertion 8: Submit button is disabled while the textbox is empty ─────
    await expect(
      page.getByRole('button', { name: '⏎ Create' })
    ).toBeDisabled()

    // ── REVERT: press Escape to dismiss the form without saving ───────────────
    await page.keyboard.press('Escape')

    // ── Assertion 9: Textbox is removed from the DOM after Escape ─────────────
    await expect(textbox).toHaveCount(0)

    // ── Assertion 10: The Create button reappears at the bottom of the column ──
    await expect(createBtn).toBeVisible()

    // ── Assertion 11: In Progress count badge is still '0' — nothing persisted ─
    // The count badge is a numeric text node in the heading's parent container.
    await expect(
      inProgressHeading.locator('..').getByText('0').first()
    ).toBeVisible()
  })
})
