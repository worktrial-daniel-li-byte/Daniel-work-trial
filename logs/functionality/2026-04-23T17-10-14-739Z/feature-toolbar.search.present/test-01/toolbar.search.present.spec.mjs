import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.search.present — Toolbar has a \'Search board\' textbox', () => {
  test('search board textbox is visible in the board toolbar', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`)

    // Primary assertion: the 'Search board' textbox must be present and visible
    await expect(page.getByRole('textbox', { name: 'Search board' })).toBeVisible()

    // Adjacent status indicator confirms we are in the board toolbar context
    await expect(page.getByText('Showing all work items')).toBeVisible()

    // Toolbar context: 'Group by Status' button is also present
    await expect(page.getByRole('button', { name: 'Group by Status' })).toBeVisible()

    // Board column heading confirms the full board has rendered
    await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()
  })
})
