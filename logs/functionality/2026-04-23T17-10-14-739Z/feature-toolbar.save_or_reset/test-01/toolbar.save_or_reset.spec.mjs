import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.save_or_reset — Save or reset view settings button appears when view differs from saved', () => {
  test('button absent initially, appears after changing Group by, removed after reverting', async ({ page }) => {
    // Navigate to the board with the default groupBy=status view.
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // Board must be loaded; wait for a known column heading.
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // ── Pre-condition ────────────────────────────────────────────────────────
    // 'Save or reset view settings' must NOT exist in the DOM when the current
    // view matches the saved view (the button is fully removed, not just hidden).
    await expect(
      page.getByRole('button', { name: 'Save or reset view settings' })
    ).toHaveCount(0)

    // 'View settings' and 'More actions' are always present as anchors.
    await expect(
      page.getByRole('button', { name: 'View settings' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'More actions' }).last()
    ).toBeVisible()

    // ── Mutate: switch Group by from Status → Priority ───────────────────────
    await page.getByRole('button', { name: 'Group by Status' }).click()

    // The Group by popover opens with a radiogroup; Priority radio is available.
    const radioGroup = page.getByRole('radiogroup', { name: 'Group by field' })
    await expect(radioGroup).toBeVisible()
    await expect(
      radioGroup.getByRole('radio', { name: 'Priority' })
    ).toBeVisible()

    await radioGroup.getByRole('radio', { name: 'Priority' }).click()

    // ── Assert post-mutation state ───────────────────────────────────────────
    // URL should update to reflect the new groupBy parameter.
    await expect(page).toHaveURL(/groupBy=priority/)

    // The board re-renders with priority-based column headings.
    await expect(
      page.getByRole('heading', { level: 3, name: 'Medium' })
    ).toBeVisible()

    // The Group by toolbar button relabels to 'Group by Priority'.
    await expect(
      page.getByRole('button', { name: 'Group by Priority' })
    ).toBeVisible()

    // The 'Save or reset view settings' button must now appear in the toolbar.
    const saveOrResetBtn = page.getByRole('button', {
      name: 'Save or reset view settings',
    })
    await expect(saveOrResetBtn).toBeVisible()

    // Verify toolbar order: View settings → Save or reset → More actions.
    // We confirm 'View settings' is still present alongside the new button.
    await expect(
      page.getByRole('button', { name: 'View settings' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'More actions' }).last()
    ).toBeVisible()

    // ── Revert: switch Group by back to Status ───────────────────────────────
    await page.getByRole('button', { name: 'Group by Priority' }).click()

    // Popover re-opens; use a regex to match 'Status Selected' (when checked) or
    // plain 'Status', matching the accessible name in both states.
    const statusRadio = page.getByRole('radio', { name: /^Status/ })
    await expect(statusRadio).toBeVisible()
    await statusRadio.click()

    // ── Assert reverted state ────────────────────────────────────────────────
    // URL should revert to groupBy=status.
    await expect(page).toHaveURL(/groupBy=status/)

    // The 'Save or reset view settings' button must be completely removed from
    // the DOM — use toHaveCount(0), not toBeHidden(), per evidence notes.
    await expect(
      page.getByRole('button', { name: 'Save or reset view settings' })
    ).toHaveCount(0)

    // The Group by toolbar button should relabel back to 'Group by Status'.
    await expect(
      page.getByRole('button', { name: 'Group by Status' })
    ).toBeVisible()
  })
})
