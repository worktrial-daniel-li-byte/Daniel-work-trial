import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.groupby.options — Group by options', () => {
  test('Popover shows 4 radios with Status checked by default', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Pre-condition: the Group by trigger button is visible and collapsed ──
    const groupByBtn = page.getByRole('button', { name: 'Group by Status' })
    await expect(groupByBtn).toBeVisible()
    await expect(groupByBtn).toHaveAttribute('aria-expanded', 'false')

    // ── Open the Group by popover ──
    await groupByBtn.click()

    // ── The button must now report itself as expanded ──
    await expect(groupByBtn).toHaveAttribute('aria-expanded', 'true')

    // ── The radiogroup must be visible ──
    const radiogroup = page.getByRole('radiogroup', { name: 'Group by field' })
    await expect(radiogroup).toBeVisible()

    // ── Exactly 4 radio options ──
    await expect(radiogroup.getByRole('radio')).toHaveCount(4)

    // ── Each of the 4 expected options is present ──
    await expect(radiogroup.getByRole('radio', { name: 'Assignee' })).toBeVisible()
    await expect(radiogroup.getByRole('radio', { name: 'Category' })).toBeVisible()
    await expect(radiogroup.getByRole('radio', { name: 'Priority' })).toBeVisible()
    await expect(radiogroup.getByRole('radio', { name: /^Status/ })).toBeVisible()

    // ── Default selection: Status is the checked radio ──
    await expect(radiogroup.getByRole('radio', { name: /^Status/ })).toBeChecked()

    // ── Non-default radios must NOT be checked ──
    await expect(radiogroup.getByRole('radio', { name: 'Assignee' })).not.toBeChecked()
    await expect(radiogroup.getByRole('radio', { name: 'Category' })).not.toBeChecked()
    await expect(radiogroup.getByRole('radio', { name: 'Priority' })).not.toBeChecked()

    // ── Close the popover by pressing Escape (restore board to original state) ──
    await page.keyboard.press('Escape')
    await expect(groupByBtn).toHaveAttribute('aria-expanded', 'false')
  })
})
