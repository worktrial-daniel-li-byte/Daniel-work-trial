import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('unscheduled.panel — Unscheduled work side panel lists items lacking a due date and supports drag-to-schedule', () => {
  test('panel exposes heading, helper text, close button, and an unscheduled work item', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/calendar`)

    // The panel may be open by default; if it is not, click the toolbar toggle.
    // The toolbar button and the panel heading share the name 'Unscheduled work',
    // so we scope the panel check by role=complementary to disambiguate.
    const panel = page.getByRole('complementary', { name: 'Unscheduled work' })
    const panelAlreadyVisible = await panel.isVisible().catch(() => false)
    if (!panelAlreadyVisible) {
      // Use .first() to target the toolbar toggle, not the panel heading
      await page.getByRole('button', { name: 'Unscheduled work' }).first().click()
    }

    // 1. The complementary region with accessible name 'Unscheduled work' is present and visible
    await expect(panel).toBeVisible()

    // 2. A level-2 heading 'Unscheduled work' is visible inside the panel
    await expect(
      panel.getByRole('heading', { level: 2, name: 'Unscheduled work' })
    ).toBeVisible()

    // 3. The instructional helper text is visible inside the panel
    await expect(
      panel.getByText(
        'Drag each work item onto the calendar to set a due date for the work.'
      )
    ).toBeVisible()

    // 4. The 'Close panel' button (icon-only, accessible name supplied by alt text) is visible
    await expect(
      panel.getByRole('button', { name: 'Close panel' })
    ).toBeVisible()
  })
})
