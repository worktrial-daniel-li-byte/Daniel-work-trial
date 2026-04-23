import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.filter.button — Filter button shows active count', () => {
  test('Filter button aria-label is exactly "0 filters applied" in default state', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // Sanity: board has loaded — "To Do" column heading must be present.
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // CORE assertion 1 — CSS attribute selector.
    // This targets the raw DOM attribute value and cannot be satisfied by any
    // accessible-name fallback (text content, title, aria-labelledby, etc.).
    // Fails as soon as aria-label is changed to anything other than
    // "<digit(s)> filters applied".
    await expect(
      page.locator('button[aria-label$=" filters applied"]')
    ).toBeVisible()

    // CORE assertion 2 — exact attribute value on the specific filter button.
    // Anchored to data-testid so we're asserting on the exact element the
    // feature produces, not a sibling or ancestor with a similar label.
    const filterBtn = page.locator(
      '[data-testid="business-filters.ui.filters.trigger.button-wrapper"]'
    )
    await expect(filterBtn).toBeVisible()
    await expect(filterBtn).toHaveAttribute('aria-label', '0 filters applied')

    // CORE assertion 3 — regex variant of the attribute assertion.
    // Verifies the numeric-count pattern without being brittle about the digit.
    await expect(filterBtn).toHaveAttribute('aria-label', /^\d+ filters applied$/)

    // SUPPLEMENTARY — popup-trigger state must be present.
    await expect(filterBtn).toHaveAttribute('aria-haspopup', 'true')
    await expect(filterBtn).toHaveAttribute('aria-expanded', 'false')
  })
})
