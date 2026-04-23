import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.search.present — Toolbar has a \'Search board\' textbox', () => {
  test('Search board textbox is visible in the board filter toolbar', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`)

    // Primary assertion: the accessible textbox must be visible in the toolbar
    await expect(page.getByRole('textbox', { name: 'Search board' })).toBeVisible()

    // Fallback attribute check: the same element is reachable via its placeholder
    await expect(page.getByPlaceholder('Search board')).toBeVisible()

    // Confirm the adjacent status text that sits next to the search input
    await expect(page.getByText('Showing all work items')).toBeVisible()

    // Confirm the surrounding toolbar context: Filter button is present
    await expect(page.getByRole('button', { name: /Filter/i })).toBeVisible()
  })
})
