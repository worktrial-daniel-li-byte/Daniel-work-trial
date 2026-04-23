import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.save_or_reset — Save or reset view settings button appears when view differs from saved', () => {
  test('button absent initially, appears after changing Group by, removed after reverting', async ({ page }) => {
    // Navigate to the board with the default groupBy=status view.
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // Board must be loaded; wait for a known status-based column heading.
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // ── Pre-condition ────────────────────────────────────────────────────────
    // 'Save or reset view settings' must NOT exist in the DOM when the current
    // view matches the saved view (the button is fully removed, not just hidden).
    await expect(
      page.getByRole('button', { name: 'Save or reset view settings' })
    ).toHaveCount(0)

    // The 'Group by Status' button must be present before we interact.
    await expect(
      page.getByRole('button', { name: 'Group by Status' })
    ).toBeVisible()

    // ── Mutate: switch Group by from Status → Priority ───────────────────────
    await page.getByRole('button', { name: 'Group by Status' }).click()

    // The Group by popover opens; click the Priority radio.
    await page.getByRole('radio', { name: 'Priority' }).click()

    // ── Assert post-mutation state ───────────────────────────────────────────
    // URL should update to reflect the new groupBy parameter.
    await expect(page).toHaveURL(/groupBy=priority/)

    // The Group by toolbar button relabels to 'Group by Priority'.
    await expect(
      page.getByRole('button', { name: 'Group by Priority' })
    ).toBeVisible()

    // The 'Save or reset view settings' button must now appear in the toolbar.
    await expect(
      page.getByRole('button', { name: 'Save or reset view settings' })
    ).toBeVisible()

    // 'View settings' remains present alongside the new button.
    // exact:true is required — without it the locator also matches
    // 'Save or reset view settings' (substring) and strict-mode throws.
    await expect(
      page.getByRole('button', { name: 'View settings', exact: true })
    ).toBeVisible()

    // ── Revert: switch Group by back to Status ───────────────────────────────
    await page.getByRole('button', { name: 'Group by Priority' }).click()

    // Use /^Status/ regex to match 'Status Selected' (aria-name when checked)
    // or plain 'Status' — whichever the popover exposes at this moment.
    await page.getByRole('radio', { name: /^Status/ }).click()

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
