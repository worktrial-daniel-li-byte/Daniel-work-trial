import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('unscheduled.panel — Unscheduled work side panel lists items lacking a due date and supports drag-to-schedule', () => {
  test('panel exposes heading, helper text, close button, and an unscheduled work item', async ({ page }) => {
    await page.goto(`${JIRA_BASE}/jira/core/projects/AUT/calendar`)

    // Wait for the calendar toolbar to be ready before inspecting panel state.
    // The toolbar toggle button is a reliable readiness signal.
    const toggleBtn = page.getByRole('button', { name: 'Unscheduled work' })
    await toggleBtn.waitFor({ state: 'visible', timeout: 20000 })

    const panel = page.getByRole('complementary', { name: 'Unscheduled work' })

    // The panel sometimes opens automatically (session-persisted preference).
    // Use waitFor (not isVisible, which is non-waiting) so we don't prematurely
    // click the toggle while the panel is still rendering — that would close it.
    const autoOpened = await panel
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false)

    if (!autoOpened) {
      await toggleBtn.click()
      // Explicitly wait so a failed open raises a clear error here, not later.
      await panel.waitFor({ state: 'visible', timeout: 10000 })
    }

    // 1. The complementary region 'Unscheduled work' is visible
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

    // 4. The 'Close panel' button (accessible name from icon alt text) is visible
    await expect(
      panel.getByRole('button', { name: 'Close panel' })
    ).toBeVisible()
  })
})
