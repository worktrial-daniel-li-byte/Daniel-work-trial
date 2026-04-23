import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

// The exact accessible name Jira gives the AUT-1 card link.
const CARD_LINK_NAME_RE = /^AUT-1 Design autonomous replanning loop/
const ORIGINAL_SUMMARY = 'Design autonomous replanning loop'

test.describe('card.edit_summary — Inline Edit summary pencil opens an in-card editor', () => {
  test('clicking Edit summary shows focused textbox with Submit/Cancel; Escape cancels and preserves original summary', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // ── Assertion 1: board is loaded (To Do column heading visible) ───────────
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // ── Assertion 2: AUT-1 card link is present in the To Do column ──────────
    const cardLink = page.getByRole('link', { name: CARD_LINK_NAME_RE })
    await expect(cardLink).toBeVisible()

    // ── Assertion 3: Edit summary pencil button is present on the card ───────
    const editBtn = page.getByRole('button', { name: 'Edit summary' })
    await expect(editBtn).toBeVisible()

    // ── Interaction: click the Edit summary button ────────────────────────────
    await editBtn.click()

    // ── Assertion 4: an in-card textbox with the right accessible name appears
    const textbox = page.getByRole('textbox', { name: 'Work item summary' })
    await expect(textbox).toBeVisible()

    // ── Assertion 5: the textbox is focused after clicking Edit summary ───────
    await expect(textbox).toBeFocused()

    // ── Assertion 6: the textbox is pre-filled with the current summary ───────
    await expect(textbox).toHaveValue(ORIGINAL_SUMMARY)

    // ── Assertion 7: Submit (✓) button is visible ─────────────────────────────
    await expect(
      page.getByRole('button', { name: 'Submit' })
    ).toBeVisible()

    // ── Assertion 8: Cancel (X) button is visible ─────────────────────────────
    await expect(
      page.getByRole('button', { name: 'Cancel' })
    ).toBeVisible()

    // ── Revert: press Escape to cancel the edit ───────────────────────────────
    await page.keyboard.press('Escape')

    // ── Assertion 9: textbox, Submit and Cancel are removed from the DOM ──────
    await expect(textbox).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Submit' })
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Cancel' })
    ).toHaveCount(0)

    // ── Assertion 10: original card link with unchanged summary is visible ────
    await expect(
      page.getByRole('link', { name: CARD_LINK_NAME_RE })
    ).toBeVisible()

    // ── Assertion 11: Edit summary pencil button is available again ───────────
    await expect(
      page.getByRole('button', { name: 'Edit summary' })
    ).toBeVisible()
  })
})
