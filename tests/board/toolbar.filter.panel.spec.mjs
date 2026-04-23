import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.filter.panel — Filter popover contents', () => {
  test('popover renders all expected sections after clicking filter trigger', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // Board must be loaded before we interact with the toolbar.
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // --- Open the filter popover ---
    // Trigger label reads "0 filters applied" when no filters are active; use
    // a regex so the test is stable regardless of the active-filter count.
    const triggerBtn = page.getByRole('button', { name: /filters applied/ })
    await expect(triggerBtn).toBeVisible()
    await triggerBtn.click()

    // --- Popover chrome ---
    await expect(
      page.getByRole('heading', { level: 2, name: 'Filters' })
    ).toBeVisible()

    await expect(
      page.getByText('Clicking on the items below will filter and update your view')
    ).toBeVisible()

    // Trigger must now be aria-expanded.
    const triggerWrapper = page.locator(
      '[data-testid="business-filters.ui.filters.trigger.button-wrapper"]'
    )
    await expect(triggerWrapper).toHaveAttribute('aria-expanded', 'true')

    // --- Quick-filter section ---
    await expect(
      page.getByRole('button', { name: 'Assigned to me' })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Due this week' })
    ).toBeVisible()

    // --- Date range section ---
    await expect(
      page.getByRole('heading', { level: 3, name: 'Date range' })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Start date, Open calendar' })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Due date, Open calendar' })
    ).toBeVisible()

    // --- Assignee section ---
    await expect(
      page.getByRole('heading', { level: 3, name: 'Assignee' })
    ).toBeVisible()

    // First avatar in the grid; use .first() in case the name appears elsewhere.
    await expect(
      page.getByRole('button', { name: 'Daniel Li' }).first()
    ).toBeVisible()

    // Overflow button confirms the full avatar grid rendered.
    await expect(
      page.getByRole('button', { name: 'More options for assignee' })
    ).toBeVisible()

    // --- Category section ---
    await expect(
      page.getByRole('heading', { level: 3, name: 'Category' })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'No category' })
    ).toBeVisible()

    // --- Created section ---
    await expect(
      page.getByRole('heading', { level: 3, name: 'Created' })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'From, Open calendar' }).first()
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'To, Open calendar' }).first()
    ).toBeVisible()

    // --- Labels section ---
    await expect(
      page.getByRole('heading', { level: 3, name: 'Labels' })
    ).toBeVisible()

    // "No label" is the stable entry from the spec; project labels may vary.
    await expect(
      page.getByRole('button', { name: 'No label' })
    ).toBeVisible()

    // --- Priority section — exactly 5 options in canonical order ---
    await expect(
      page.getByRole('heading', { level: 3, name: 'Priority' })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Highest', exact: true })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'High', exact: true })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Medium', exact: true })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Low', exact: true })
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Lowest', exact: true })
    ).toBeVisible()

    // URL must remain on the board view (popover is non-navigating).
    await expect(page).toHaveURL(/\/jira\/core\/projects\/AUT\/board/)
  })
})
