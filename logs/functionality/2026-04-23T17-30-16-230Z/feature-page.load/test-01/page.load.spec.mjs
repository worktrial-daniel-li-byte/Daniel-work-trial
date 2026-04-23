import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('page.load — Route renders board with Status columns when /board?groupBy=status', () => {
  test('board page loads with title and To Do / In Progress / Done columns', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`)

    // Page title must end with 'Board - Autoloop - Jira'
    await expect(page).toHaveTitle(/Board - Autoloop - Jira$/)

    // All three Status column headings (h3) must be visible
    await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'In Progress' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'Done' })).toBeVisible()

    // Active grouping indicator confirms status grouping is applied
    await expect(page.getByRole('button', { name: 'Group by Status' })).toBeVisible()

    // Space navigation marks 'Board' as the active level-2 heading tab
    await expect(page.getByRole('heading', { level: 2, name: 'Board' })).toBeVisible()
  })
})
