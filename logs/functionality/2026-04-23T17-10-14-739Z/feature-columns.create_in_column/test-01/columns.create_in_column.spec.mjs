import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.create_in_column — Per-column inline create form', () => {
  test('Create button opens inline form with all expected fields; Escape dismisses without persisting', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertion 1: In Progress column heading is visible ───────────────────
    const inProgressHeading = page.getByRole('heading', { name: 'In Progress' }).first()
    await expect(inProgressHeading).toBeVisible()

    // Scope all column interactions to the In Progress column region.
    // The deepest div that contains the heading and the Create button is
    // obtained by filtering on the heading element.
    const inProgressColumn = page
      .locator('div')
      .filter({ has: inProgressHeading })
      .first()

    // ── Assertion 2: The per-column Create button is present before clicking ──
    const createBtn = inProgressColumn.getByRole('button', { name: 'Create', exact: true })
    await expect(createBtn).toBeVisible()

    // ── MUTATE: click Create to open the inline form ─────────────────────────
    await createBtn.click()

    // ── Assertion 3: The textarea is present and has focus ───────────────────
    const textbox = page.getByRole('textbox', { name: 'What needs to be done?' })
    await expect(textbox).toBeFocused()

    // ── Assertion 4: Instructional status text is shown inside the form ───────
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

    // ── Assertion 8: Submit (⏎ Create) button is disabled while textbox empty ─
    await expect(
      page.getByRole('button', { name: '⏎ Create' })
    ).toBeDisabled()

    // ── REVERT: press Escape to dismiss the inline form without saving ────────
    await page.keyboard.press('Escape')

    // ── Assertion 9: Textbox is gone from the DOM (form dismissed) ────────────
    await expect(textbox).toHaveCount(0)

    // ── Assertion 10: Create button reappears at the bottom of the column ─────
    await expect(
      inProgressColumn.getByRole('button', { name: 'Create', exact: true })
    ).toBeVisible()

    // ── Assertion 11: In Progress count badge is still '0' — nothing persisted ─
    // Use the proven badge pattern: text node inside the heading's parent
    // container should still read '0' (no new card was created).
    await expect(
      inProgressHeading.locator('..').getByText('0').first()
    ).toBeVisible()
  })
})
