import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('page.load — Route renders board with Status columns when /board?groupBy=status', () => {
  test('board page loads with title and To Do / In Progress / Done column headings', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`)

    // Title must end with 'Board - Autoloop - Jira'
    await expect(page).toHaveTitle(/Board - Autoloop - Jira$/)

    // All three status column headings (level-3) must be visible
    await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'In Progress' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'Done' })).toBeVisible()

    // The space title and the Group-by control confirm full board render
    await expect(page.getByRole('heading', { level: 1, name: 'Autoloop' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Group by Status' })).toBeVisible()
  })
})
