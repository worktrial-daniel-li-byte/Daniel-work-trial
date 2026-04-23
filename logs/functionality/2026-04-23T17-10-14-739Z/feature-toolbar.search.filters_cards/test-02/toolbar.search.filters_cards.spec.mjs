import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'

// Route: /jira/core/projects/AUT/board?filter=&groupBy=status
// Evidence: toolbar.search.filters_cards — "Typing in 'Search board' filters cards and persists in URL"
//
// Page-snapshot evidence shows the column count badge is a generic (div/span) element
// that is the immediate following-sibling of the h3 heading inside each column header:
//   generic:
//     heading "To Do" [level=3]
//     generic: "0"          ← count badge; no specific CSS class in real Jira DOM

test.describe('toolbar.search.filters_cards — Typing in Search board filters cards and persists in URL', () => {
  test('fill zzznomatch → URL filter, zero counts, empty state; Clear filters → original state', async ({ page }) => {
    const BOARD_URL = '/jira/core/projects/AUT/board?filter=&groupBy=status'

    // ── 1. NAVIGATE & assert initial state ──────────────────────────────────
    await page.goto(`${JIRA_BASE}${BOARD_URL}`)

    // Search input must be present
    const searchInput = page.getByRole('textbox', { name: 'Search board' })
    await expect(searchInput).toBeVisible()

    // To Do column must be visible (evidence: initial count=1)
    await expect(page.getByRole('heading', { level: 3, name: 'To Do' })).toBeVisible()

    // ── 2. MUTATE — fill search with a term that matches nothing ─────────────
    await searchInput.click()
    await searchInput.fill('zzznomatch')

    // ── 3. ASSERT post-mutation state ────────────────────────────────────────

    // 3a. URL must carry the encoded filter parameter
    await expect(page).toHaveURL(
      /filter=\(summary%20~%20%27zzznomatch\*%27%20OR%20description%20~%20%27zzznomatch\*%27\)/,
    )

    // 3b. Column count badges show 0.
    // From the error-context page snapshot the badge is the first following-sibling
    // of the h3 inside each column header (no stable CSS class in the real Jira DOM).
    //   generic: { heading "To Do" [level=3], generic "0" }
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' }).locator('xpath=following-sibling::*[1]'),
    ).toHaveText('0')
    await expect(
      page.getByRole('heading', { level: 3, name: 'In Progress' }).locator('xpath=following-sibling::*[1]'),
    ).toHaveText('0')
    await expect(
      page.getByRole('heading', { level: 3, name: 'Done' }).locator('xpath=following-sibling::*[1]'),
    ).toHaveText('0')

    // 3c. Empty-state heading "No search results" (level 2)
    await expect(
      page.getByRole('heading', { level: 2, name: 'No search results' }),
    ).toBeVisible()

    // 3d. Empty-state subtitle paragraph
    await expect(
      page.getByText('Try a different word, phrase or filter.'),
    ).toBeVisible()

    // 3e. "Clear filters" button inside the empty state
    const clearFiltersBtn = page.getByRole('button', { name: 'Clear filters' })
    await expect(clearFiltersBtn).toBeVisible()

    // 3f. Status region (role=status) reflects filtered state
    // Snapshot: status [ref=e433]: "Showing filtered work items"
    await expect(page.getByRole('status')).toContainText('Showing filtered work items')

    // ── 4. REVERT — click Clear filters ──────────────────────────────────────
    await clearFiltersBtn.click()

    // ── 5. ASSERT original state restored ────────────────────────────────────

    // 5a. URL must revert to the unfiltered form (filter= with empty value)
    await expect(page).toHaveURL(/filter=&groupBy=status/)

    // 5b. To Do column count restored to 1 (evidence: initial count = 1)
    await expect(
      page.getByRole('heading', { level: 3, name: 'To Do' }).locator('xpath=following-sibling::*[1]'),
    ).toHaveText('1')

    // 5c. Empty state heading is gone
    await expect(
      page.getByRole('heading', { level: 2, name: 'No search results' }),
    ).not.toBeVisible()
  })
})
