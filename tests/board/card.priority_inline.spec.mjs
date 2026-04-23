import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('card.priority_inline — Priority icon opens inline priority picker', () => {
  test('clicking Priority: High button opens Edit priority dialog with 5 options, High selected; Escape closes it', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertion 1: board loaded — To Do column heading is visible ───────────
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // ── Assertion 2: AUT-1 card priority button is present and not expanded ───
    const priorityBtn = page.getByRole('button', { name: 'Priority: High' })
    await expect(priorityBtn).toBeVisible()
    await expect(priorityBtn).toHaveAttribute('aria-expanded', 'false')

    // ── Interaction: click the priority icon ──────────────────────────────────
    await priorityBtn.click()

    // ── Assertion 3: 'Edit priority' dialog is visible after click ────────────
    const dialog = page.getByRole('dialog', { name: 'Edit priority' })
    await expect(dialog).toBeVisible()

    // ── Assertion 4: priority button is now in expanded state ─────────────────
    await expect(priorityBtn).toHaveAttribute('aria-expanded', 'true')

    // ── Assertion 5: dialog contains a listbox ────────────────────────────────
    const listbox = dialog.getByRole('listbox')
    await expect(listbox).toBeVisible()

    // ── Assertion 6: listbox has exactly 5 options in the expected order ──────
    const options = dialog.getByRole('option')
    await expect(options).toHaveCount(5)
    await expect(options).toHaveText([
      'Highest',
      'High',
      'Medium',
      'Low',
      'Lowest',
    ])

    // ── Assertion 7: 'High' option is aria-selected=true (current priority) ───
    // exact:true is required — without it the locator also matches 'Highest'
    // (substring), causing a strict-mode violation.
    await expect(
      dialog.getByRole('option', { name: 'High', exact: true })
    ).toHaveAttribute('aria-selected', 'true')

    // ── Assertion 8: the other four options are NOT selected ──────────────────
    // 'Low' also needs exact:true because 'Lowest' contains 'Low' as a prefix.
    await expect(
      dialog.getByRole('option', { name: 'Highest', exact: true })
    ).toHaveAttribute('aria-selected', 'false')
    await expect(
      dialog.getByRole('option', { name: 'Medium', exact: true })
    ).toHaveAttribute('aria-selected', 'false')
    await expect(
      dialog.getByRole('option', { name: 'Low', exact: true })
    ).toHaveAttribute('aria-selected', 'false')
    await expect(
      dialog.getByRole('option', { name: 'Lowest', exact: true })
    ).toHaveAttribute('aria-selected', 'false')

    // ── Assertion 9: 'Change priority' combobox is present and expanded ───────
    await expect(
      dialog.getByRole('combobox', { name: 'Change priority' })
    ).toBeVisible()

    // ── Revert: press Escape to dismiss the popover ───────────────────────────
    await page.keyboard.press('Escape')

    // ── Assertion 10: 'Edit priority' dialog is gone after Escape ─────────────
    await expect(dialog).toHaveCount(0)

    // ── Assertion 11: priority button returns to non-expanded state ───────────
    await expect(priorityBtn).toHaveAttribute('aria-expanded', 'false')
  })
})
