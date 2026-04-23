import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.view_settings — View settings opens a right-side panel', () => {
  test('open panel shows heading, resize handle and close button; closing removes the panel', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // Board must be loaded before we interact with the toolbar.
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // --- Pre-condition: toggle button is visible and not yet pressed ---
    const viewSettingsBtn = page.getByRole('button', { name: 'View settings' })
    await expect(viewSettingsBtn).toBeVisible()

    // --- Open the View settings panel ---
    await viewSettingsBtn.click()

    // Button should gain aria-pressed=true after click.
    await expect(viewSettingsBtn).toHaveAttribute('aria-pressed', 'true')

    // --- Sidebar panel appears on the right side ---
    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })
    await expect(sidebar).toBeVisible()

    // Heading inside the panel.
    await expect(
      sidebar.getByRole('heading', { level: 2, name: 'View settings' })
    ).toBeVisible()

    // Resize handle.
    await expect(
      sidebar.getByRole('button', { name: 'Resize sidebar' })
    ).toBeVisible()

    // Close button scoped inside the sidebar to avoid collisions.
    const closeBtn = sidebar.getByRole('button', { name: 'Close' })
    await expect(closeBtn).toBeVisible()

    // --- Sidebar body is populated (evidence confirms panel is not empty) ---
    // 'Show fields' group with checkboxes.
    await expect(
      sidebar.getByRole('group', { name: 'Show fields' })
    ).toBeVisible()

    // Summary checkbox is always-on (disabled) — reliable sentinel that the
    // Show fields list has rendered.
    await expect(
      sidebar.getByRole('checkbox', { name: 'Summary' })
    ).toBeVisible()

    // 'Hide done work items after:' combobox defaults to 'Never'.
    await expect(
      sidebar.getByRole('combobox')
    ).toHaveValue('Never')

    // --- Revert: close the panel and verify it is removed ---
    await closeBtn.click()

    // The complementary Sidebar region must be gone from the DOM.
    await expect(
      page.getByRole('complementary', { name: 'Sidebar' })
    ).toHaveCount(0)

    // The toggle button must no longer be pressed.
    await expect(viewSettingsBtn).not.toHaveAttribute('aria-pressed', 'true')
  })
})
