import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('card.open_work_item — Clicking the card opens the work item', () => {
  test('AUT-1 card is a role=link with href=/browse/AUT-1 and clicking it opens the work-item dialog', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertion 1: board loaded — To Do column heading present ──────────────
    await expect(
      page.getByRole('heading', { name: 'To Do' }).first()
    ).toBeVisible()

    // ── Assertion 2: the card anchor has href="/browse/AUT-1" ─────────────────
    // Uses a CSS attribute selector so the locator itself cannot resolve when
    // href is absent — this is the exact DOM surface the feature produces.
    const cardAnchor = page.locator('a[href="/browse/AUT-1"]')
    await expect(cardAnchor).toBeVisible()

    // ── Assertion 3: href value is exactly /browse/AUT-1 ─────────────────────
    // Explicit attribute check: fails the instant href is removed or changed.
    await expect(cardAnchor).toHaveAttribute('href', '/browse/AUT-1')

    // ── Assertion 4: the anchor carries the required aria-label ──────────────
    // This is the accessible name Jira uses for keyboard/screen-reader users.
    await expect(cardAnchor).toHaveAttribute(
      'aria-label',
      'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.'
    )

    // ── Assertion 5: the element is accessible as role=link ──────────────────
    // An <a> without href loses its implicit link role; this confirms the role
    // is present (which requires href to be set on the element).
    await expect(
      page.getByRole('link', {
        name: 'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.',
      })
    ).toBeVisible()

    // ── Interaction: click the card link ──────────────────────────────────────
    await cardAnchor.click()

    // ── Assertion 6: URL gains the selectedIssue=AUT-1 query param ───────────
    await expect(page).toHaveURL(/selectedIssue=AUT-1/)

    // ── Assertion 7: work-item dialog appears ─────────────────────────────────
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // ── Assertion 8: dialog contains the work item summary text ───────────────
    await expect(
      dialog.getByText('Design autonomous replanning loop')
    ).toBeVisible()

    // ── Assertion 9: dialog shows the description recorded by the browser agent
    await expect(
      dialog.getByText('Define the state machine for the replanner')
    ).toBeVisible()

    // ── Assertion 10: dialog exposes a Close button ───────────────────────────
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible()
  })
})
