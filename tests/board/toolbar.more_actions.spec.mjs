import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

test.describe('toolbar.more_actions — Board-level More actions menu', () => {
  test('clicking More actions toolbar button opens menu with Stand-up and Configure columns items', async ({ page }) => {
    await page.goto(
      `${JIRA_BASE}/jira/core/projects/AUT/board?filter=&groupBy=status`
    )

    // Board must be loaded before interacting with the toolbar.
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' })
    ).toBeVisible()

    // There are two buttons named 'More actions' on the page; the board-level
    // toolbar button is the second occurrence (index 1).  The first belongs to
    // the space header row and opens an unrelated menu.
    const moreActionsBtn = page.getByRole('button', {
      name: 'More actions',
      exact: true,
    }).nth(1)

    // Button must be visible before we click it.
    await expect(moreActionsBtn).toBeVisible()

    // Ensure any previously open instance of this menu is fully hidden first.
    await page
      .getByRole('menu', { name: 'More actions on board view' })
      .waitFor({ state: 'hidden' })
      .catch(() => {})

    // --- Open the menu ---
    await moreActionsBtn.click()

    // Button aria-expanded should become true after click.
    await expect(moreActionsBtn).toHaveAttribute('aria-expanded', 'true')

    // The menu container itself must be visible.
    const menu = page.getByRole('menu', { name: 'More actions on board view' })
    await expect(menu).toBeVisible()

    // --- Assert both expected menu items are present ---
    await expect(
      page.getByRole('menuitem', { name: 'Stand-up' })
    ).toBeVisible()

    await expect(
      page.getByRole('menuitem', { name: 'Configure columns' })
    ).toBeVisible()

    // Exactly 2 menu items should be present (as observed by browser agent).
    await expect(menu.getByRole('menuitem')).toHaveCount(2)

    // --- Close the menu by pressing Escape so the board is back to original state ---
    await page.keyboard.press('Escape')

    await expect(menu).toBeHidden()
    await expect(moreActionsBtn).not.toHaveAttribute('aria-expanded', 'true')
  })
})
