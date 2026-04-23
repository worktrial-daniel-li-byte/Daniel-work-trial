import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('page.load — Calendar tab loads under AUT project with Calendar tab marked active', () => {
  test('calendar page loads with active Calendar heading and all sibling tab links visible', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/calendar`)

    // URL must contain the calendar route
    await expect(page).toHaveURL(/\/jira\/core\/projects\/AUT\/calendar/)

    // Page title must identify this as the Calendar view
    await expect(page).toHaveTitle('Calendar - Jira')

    // Locate the Space navigation container
    const spaceNav = page.getByRole('navigation', { name: 'Space navigation' })
    await expect(spaceNav).toBeVisible()

    // Active tab is rendered as a heading (level 2), not a link
    await expect(
      spaceNav.getByRole('heading', { level: 2, name: 'Calendar' })
    ).toBeVisible()

    // All sibling tabs must be present as links within the Space navigation
    await expect(spaceNav.getByRole('link', { name: 'Summary' })).toBeVisible()
    await expect(spaceNav.getByRole('link', { name: 'Board' })).toBeVisible()
    await expect(spaceNav.getByRole('link', { name: 'List' })).toBeVisible()
    await expect(spaceNav.getByRole('link', { name: 'Timeline' })).toBeVisible()
    await expect(spaceNav.getByRole('link', { name: 'Approvals' })).toBeVisible()
    await expect(spaceNav.getByRole('link', { name: 'Forms' })).toBeVisible()
    await expect(spaceNav.getByRole('link', { name: 'Docs' })).toBeVisible()

    // Project title heading must be visible
    await expect(page.getByRole('heading', { level: 1, name: 'Autoloop' })).toBeVisible()

    // Calendar month heading confirms the calendar view has fully rendered
    // Evidence: heading level=3 name='Apr 2026' visible in the calendar toolbar
    await expect(
      page.getByRole('heading', { level: 3, name: /\w{3} \d{4}/ })
    ).toBeVisible()
  })
})
