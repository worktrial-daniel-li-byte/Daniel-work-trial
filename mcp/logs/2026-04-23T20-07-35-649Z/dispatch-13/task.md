# Dispatch 13 — resumed worker

- **Before reward:** 0.3449
- **After reward:**  0.3928
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

Modify src/App.tsx to mirror the reference's DOM wrapper structure for the horizontal-nav region (the Summary/Board/List/... tabs row) and the board-toolbar region (the row with Search board / assignee / Filter / Group:Status).

## Part A: horizontal-nav tabs

Find the tabs list in the JSX (Summary, Board, List, Calendar, Timeline, Approvals, Forms, Pages, More). It's probably rendered as something like `<a>` or `<button>` wrapped in a `<li>` or directly in the nav. The reference uses this nesting per tab:

    <li>
      <div>
        <div>
          <div>
            <div>
              <a data-testid="navigation-kit-ui-tab.ui.link-tab" role="link">
                <div><span>{iconOrNull}</span></div>
                <span>{tabLabel}</span>
              </a>
              <div><span><button><span><span></span><span></span></span></button></span></div>
            </div>
          </div>
        </div>
      </div>
    </li>

For the CURRENT/active tab (Board), it's the same but use `<h2 data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab">` instead of `<a>`.

Update each tab item so that each tab is wrapped in `li > div > div > div > div > a (or h2 for active)` with the `data-testid` values exactly as above. Keep ALL existing text (the tab labels like "Summary", "Board", etc.) and existing SVG icons as children — just wrap them deeper.

Also, at the END of the tabs list, add these two trigger items (they exist in the ref):

    <div><div><div><div>
      <div data-testid="navigation-kit-ui-tab.ui.dropdown-trigger-tab.tab-button">
        <button data-testid="navigation-kit-ui-tab-list.ui.more-trigger.more-tab">
          <div><div><span><span><span></span></span></span></div></div>
        </button>
      </div>
    </div></div></div></div>

    <div><div><div role="presentation">
      <button data-testid="navigation-kit-add-tab.ui.trigger">
        <span><span role="img"></span></span>
      </button>
    </div></div></div>

Place these right after the `<ul>` of tabs but still inside the nav (sibling divs of the ul). If "More 4" and "+" already exist as tabs in the current JSX, REMOVE those existing implementations and replace them with the two blocks above.

## Part B: board-toolbar

Find the board toolbar row (the row above the columns with "Search board" input and "Filter" button). Restructure the wrappers so that the fieldset for the assignee filter follows this exact pattern:

    <fieldset data-testid="business-filters.ui.filters.assignee-filter">
      <legend>{/* any visually hidden label text */}</legend>
      <div>
        <div>
          <input type="checkbox" />
          <div data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">
            <div>
              <span><img /* the existing DL avatar img or a placeholder */ /></span>
              <span>
                <span role="presentation">
                  <div>{/* the "DL" text or letter */}</div>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </fieldset>

And the Filter button should be a sibling AFTER the fieldset:

    <button data-testid="business-filters.ui.filters.trigger.button-wrapper">
      <span>
        <div><div><span>Filter</span></div></div>
      </span>
      <span><span></span></span>
    </button>

KEEP all existing classNames and visible text. Wrap existing elements; don't recreate them from scratch if they already have styling. If the existing fieldset and button have different structure, restructure only the OUTER layers to match.

Run `npm run build` to catch syntax errors, but ignore any pre-existing TS errors about unused vars. Report what you changed.

## Rationale

pqgram horizontal-nav=0.53 and board-toolbar=0.56 will rise when we mirror the reference's exact wrapper-div nesting and add the `navigation-kit-ui-tab.ui.link-tab` data-testid values. This is 0.20 × (average region gain) to the reward.

## Worker summary

The structure is correctly updated. Here's what I changed in `src/App.tsx`:

**Part A — horizontal-nav tabs:**
1. Each `<a>` / `<h2>` tab's inner content changed from `span.icon>span + span.text>span` to `div>span (icon) + span (label)` — matching the reference's `a > div > span` + `a > span` pattern.
2. Moved the tab-options `<button>` **outside** the `<a>`/`<h2>` as a sibling `<div><span><button><span><span/><span/></span></button></span></div>`.
3. Pages tab now also renders as `<h2 data-testid="...non-interactive-tab">` when active, same as other tabs.
4. The "More" trigger gained one extra wrapper `<div>` (now `div>div>div>div>div[dropdown-trigger]>button[more-trigger]` matching the 4-deep reference nesting).
5. The "Add tab" button content changed from bare `+` text to `<span><span role="img"></span></span>`.

**Part B — board-toolbar:**
1. Removed the `<label>` wrapper around `<input>` + `<div[presence-filter-avatar]>` — they are now direct siblings inside `fieldset > div > div`.
2. Restructured the `div[presence-filter-avatar]` interior to `div > (span>img) + (span > span[role="presentation"] > div)`.
3. The Filter `<button>` moved out of its `<div className="jira-rel">` wrapper (now a direct sibling of the fieldset), with inner content restructured to `span>div>div>span("Filter") + span>span` matching the reference.
