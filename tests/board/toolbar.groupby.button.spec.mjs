import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.groupby.button — Group by button reflects current grouping', () => {
  test('Group by button shows "Group by Status" and board renders status columns', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // Sanity: confirm we are on the Autoloop board view.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Autoloop' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'Board' })
    ).toBeVisible()

    // CORE assertion 1 — the Group by button must be visible and carry the
    // correct accessible name ('Group by Status') reflecting the active grouping.
    const groupByBtn = page.getByRole('button', { name: 'Group by Status' })
    await expect(groupByBtn).toBeVisible()

    // CORE assertion 2 — the visible label text inside the button reads
    // 'Group: Status' (the colon-separated format used by Jira).
    await expect(groupByBtn.getByText('Group: Status')).toBeVisible()

    // CORE assertion 3 — button is a popup trigger and is currently collapsed.
    await expect(groupByBtn).toHaveAttribute('aria-haspopup', 'true')
    await expect(groupByBtn).toHaveAttribute('aria-expanded', 'false')

    // CORE assertion 4 — board columns confirm that status grouping is active.
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 3, name: 'In Progress' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 3, name: 'Done' })
    ).toBeVisible()
  })
})
