import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.search — Calendar search textbox filters work items on the calendar', () => {
  test('search calendar textbox is present and visible in the toolbar', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/calendar`)

    // Confirm we are on the correct calendar page
    await expect(page).toHaveURL(/\/jira\/core\/projects\/AUT\/calendar/)

    // Confirm the calendar has fully rendered (month heading visible)
    await expect(
      page.getByRole('heading', { level: 3, name: /\b\d{4}\b/ })
    ).toBeVisible()

    // Primary assertion: the 'Search calendar' textbox must be present in the toolbar
    const searchBox = page.getByRole('textbox', { name: 'Search calendar' })
    await expect(searchBox).toBeVisible()

    // Secondary assertion: the project heading confirms we are on the AUT calendar
    await expect(
      page.getByRole('heading', { level: 1, name: 'Autoloop' })
    ).toBeVisible()

    // Tertiary assertion: fallback locator (placeholder) resolves the same element
    await expect(
      page.getByPlaceholder('Search calendar')
    ).toBeVisible()
  })
})
