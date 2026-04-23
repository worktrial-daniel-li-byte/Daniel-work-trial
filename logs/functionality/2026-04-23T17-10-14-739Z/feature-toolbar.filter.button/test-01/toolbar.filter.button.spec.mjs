import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.filter.button — Filter button shows active count', () => {
  test('Filter button is visible with default "0 filters applied" accessible name', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // PRIMARY: board has loaded – the "To Do" column heading must be visible,
    // confirming we are on the board and not a login / error page.
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // CORE assertion 1: the filter trigger button must be visible and its
    // accessible name must exactly match "0 filters applied" (default state).
    await expect(
      page.getByRole('button', { name: '0 filters applied' })
    ).toBeVisible()

    // CORE assertion 2: the same button matched by the general regex
    // /^\d+ filters applied$/ – guards against any numeric count, not just 0.
    await expect(
      page.getByRole('button', { name: /^\d+ filters applied$/ })
    ).toBeVisible()

    // SUPPLEMENTARY: fallback locator via data-testid as observed in evidence.
    await expect(
      page.getByTestId('business-filters.ui.filters.trigger.button-wrapper')
    ).toBeVisible()

    // SUPPLEMENTARY: the button must act as a popup trigger (aria-haspopup)
    // but start collapsed (aria-expanded="false").
    const filterBtn = page.getByRole('button', { name: /^\d+ filters applied$/ })
    await expect(filterBtn).toHaveAttribute('aria-haspopup', 'true')
    await expect(filterBtn).toHaveAttribute('aria-expanded', 'false')
  })
})
