import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.default_set — Default columns reflect statuses To Do, In Progress, Done (groupBy=status)', () => {
  test('three status columns visible with count badges when groupBy=status', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertions 1-3: all three status column headings are visible ──────────
    const todoHeading = page.getByRole('heading', { level: 3, name: 'To Do' })
    const inProgressHeading = page.getByRole('heading', { level: 3, name: 'In Progress' })
    const doneHeading = page.getByRole('heading', { level: 3, name: 'Done' })

    await expect(todoHeading).toBeVisible()
    await expect(inProgressHeading).toBeVisible()
    await expect(doneHeading).toBeVisible()

    // ── Assertion 4: toolbar button confirms groupBy=status is active ─────────
    await expect(
      page.getByRole('button', { name: 'Group by Status' })
    ).toBeVisible()

    // ── Assertions 5-7: each column header exposes a numeric count badge ──────
    // Badges are plain generic nodes (no accessible name) inside the column
    // header container; scope relative to the h3 parent for robustness.
    // Evidence: To Do=1, In Progress=0, Done=0.
    await expect(
      todoHeading.locator('..').getByText(/^\d+$/).first()
    ).toBeVisible()

    await expect(
      inProgressHeading.locator('..').getByText(/^\d+$/).first()
    ).toBeVisible()

    await expect(
      doneHeading.locator('..').getByText(/^\d+$/).first()
    ).toBeVisible()
  })
})
