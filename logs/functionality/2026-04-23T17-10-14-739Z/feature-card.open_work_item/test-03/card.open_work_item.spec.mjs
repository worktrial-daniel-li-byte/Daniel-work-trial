import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

// The exact accessible name Jira gives the card link.
const CARD_LINK_NAME =
  'AUT-1 Design autonomous replanning loop. Use the enter key to load the work item.'

test.describe('card.open_work_item — Clicking the card opens the work item', () => {
  test('AUT-1 card is a role=link with href=/browse/AUT-1; clicking it opens the work-item dialog', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertion 1: board has loaded (To Do column heading visible) ──────────
    await expect(
      page.getByRole('heading', { name: 'To Do' }).first()
    ).toBeVisible()

    // ── Primary locator: the card MUST be discoverable as role=link ───────────
    // An <a> without href loses its implicit ARIA role="link", so
    // getByRole('link') will return 0 matches if href is removed.
    const cardLink = page.getByRole('link', { name: CARD_LINK_NAME })

    // ── Assertion 2: exactly one such role=link exists on the board ───────────
    // toHaveCount uses Playwright's retrying expect so it re-polls; it will
    // immediately report 0 (and fail) if the element lost its link role.
    await expect(cardLink).toHaveCount(1)

    // ── Assertion 3: the link is visible ─────────────────────────────────────
    await expect(cardLink).toBeVisible()

    // ── Assertion 4: the link carries href="/browse/AUT-1" ───────────────────
    // This is the primary DOM surface of the feature.  If href is removed the
    // element loses role=link (so assertion 2 already fires), but this check
    // explicitly names the attribute value the feature must produce.
    await expect(cardLink).toHaveAttribute('href', '/browse/AUT-1')

    // ── Assertion 5: the accessible name is exact (KEY + summary + prompt) ───
    // Validates the full aria-label, not just a partial match.
    await expect(cardLink).toHaveAttribute(
      'aria-label',
      CARD_LINK_NAME
    )

    // ── Guard: no work-item dialog should be open before the click ────────────
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // ── Interaction: click the role=link element ──────────────────────────────
    await cardLink.click()

    // ── Assertion 6: URL gains selectedIssue=AUT-1 after the click ───────────
    await expect(page).toHaveURL(/[?&]selectedIssue=AUT-1/)

    // ── Assertion 7: the work-item dialog becomes visible ─────────────────────
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // ── Assertion 8: dialog title matches the card summary ───────────────────
    await expect(
      dialog.getByText('Design autonomous replanning loop')
    ).toBeVisible()

    // ── Assertion 9: dialog body contains the description text ────────────────
    await expect(
      dialog.getByText('Define the state machine for the replanner')
    ).toBeVisible()

    // ── Assertion 10: dialog exposes a close affordance ───────────────────────
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible()
  })
})
