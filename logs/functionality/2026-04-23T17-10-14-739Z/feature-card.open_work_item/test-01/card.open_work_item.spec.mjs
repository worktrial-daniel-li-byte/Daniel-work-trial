import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('card.open_work_item — Clicking the card opens the work item', () => {
  test('clicking AUT-1 card link opens a work-item dialog and appends selectedIssue=AUT-1 to the URL', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertion 1: the To Do column heading is visible (board loaded) ───────
    await expect(
      page.getByRole('heading', { name: 'To Do' }).first()
    ).toBeVisible()

    // ── Assertion 2: the AUT-1 card link is visible on the board ─────────────
    const cardLink = page.getByRole('link', {
      name: 'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.',
    })
    await expect(cardLink).toBeVisible()

    // ── Interaction: click the card link ──────────────────────────────────────
    await cardLink.click()

    // ── Assertion 3: URL gains the selectedIssue=AUT-1 query param ───────────
    await expect(page).toHaveURL(/selectedIssue=AUT-1/)

    // ── Assertion 4: a dialog appears after the click ─────────────────────────
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // ── Assertion 5: dialog contains the work item summary ───────────────────
    await expect(dialog.getByText('Design autonomous replanning loop')).toBeVisible()

    // ── Assertion 6: dialog contains the description text recorded by agent ──
    await expect(
      dialog.getByText('Define the state machine for the replanner')
    ).toBeVisible()

    // ── Assertion 7: dialog exposes a Close button ────────────────────────────
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible()

    // ── Assertion 8: status chip 'To Do' is shown inside the dialog ──────────
    await expect(dialog.getByText('To Do')).toBeVisible()
  })
})
