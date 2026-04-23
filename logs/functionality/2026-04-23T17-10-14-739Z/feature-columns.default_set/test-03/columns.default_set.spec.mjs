import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('columns.default_set — Default columns reflect statuses To Do, In Progress, Done (groupBy=status)', () => {
  test('three status columns visible as level-3 headings with count badges when groupBy=status', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // Column headers are rendered as div[role="heading"][aria-level="3"].
    // Playwright's getByRole { level: N } filter is unreliable for ARIA-role
    // headings (non-native elements), so we locate by name only and then
    // explicitly assert the aria-level attribute — that is what the saboteur
    // changes and what the feature actually requires.
    const todoHeading      = page.getByRole('heading', { name: 'To Do' }).first()
    const inProgressHeading = page.getByRole('heading', { name: 'In Progress' }).first()
    const doneHeading      = page.getByRole('heading', { name: 'Done' }).first()

    // ── Assertions 1-3: all three column headings are present and visible ─────
    await expect(todoHeading).toBeVisible()
    await expect(inProgressHeading).toBeVisible()
    await expect(doneHeading).toBeVisible()

    // ── Assertions 4-6: each heading MUST carry aria-level="3" ───────────────
    // This is the defining DOM surface of the feature ("Level-3 headings").
    // An aria-level regression (e.g. 3→2) must fail the spec.
    await expect(todoHeading).toHaveAttribute('aria-level', '3')
    await expect(inProgressHeading).toHaveAttribute('aria-level', '3')
    await expect(doneHeading).toHaveAttribute('aria-level', '3')

    // ── Assertion 7: toolbar confirms groupBy=status is active ────────────────
    await expect(
      page.getByRole('button', { name: 'Group by Status' })
    ).toBeVisible()

    // ── Assertions 8-10: each column header exposes a numeric count badge ─────
    // Badges are numeric text nodes inside the heading container.  Scope via
    // the immediate parent (display:contents headings have no layout box of
    // their own) so getByText can traverse into the heading's subtree.
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
