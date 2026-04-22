# 04 — Horizontal project navigation (tabs)

Align the project-level tab strip (Summary, Board, List, …) with Jira's
horizontal navigation.

Surface id: `horizontal-nav`

## Target in the clone

[`src/App.tsx`](../src/App.tsx) — the `<nav className="jira-tabs">` block
and its sibling project title row, currently around lines 331–357.

This prompt covers **only the tab list**. The project title/header inside
the horizontal nav is covered by prompt
[`05-project-header.md`](./05-project-header.md).

## Reference structure

The horizontal nav is a `<header>` that contains the project header plus a
row of tabs:

```startLine:endLine:reference.html
<header id="ak-project-view-navigation"
        data-testid="horizontal-nav.ui.content.horizontal-nav"
        data-ssr-placeholder="project-view-navigation">
  <div data-testid="horizontal-nav-header.ui.project-header.header">…</div>

  <!-- tab list -->
  <a data-testid="navigation-kit-ui-tab.ui.link-tab" role="link"
     href="/jira/core/projects/AUT/summary" draggable="false" tabindex="0">…Summary…</a>
  <h2 data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab"
      aria-current="page" data-delegated-focus-ring="true">…Board…</h2>
  <a data-testid="navigation-kit-ui-tab.ui.link-tab" role="link"
     href="/jira/core/projects/AUT/list" …>…List…</a>
  <a … href="/jira/core/projects/AUT/calendar" …>Calendar</a>
  <a … href="/jira/core/projects/AUT/timeline" …>Timeline</a>
  <a … href="/jira/core/projects/AUT/approvals" …>Approvals</a>
  <a … href="/jira/core/projects/AUT/form" …>Forms</a>
  <a … href="/jira/core/projects/AUT/pages" …>Pages</a>

  <div data-testid="navigation-kit-ui-tab.ui.dropdown-trigger-tab.tab-button">
    <button data-testid="navigation-kit-ui-tab-list.ui.more-trigger.more-tab"
            aria-expanded="false" aria-haspopup="true" aria-label="4 more tabs">…</button>
  </div>

  <button data-testid="navigation-kit-add-tab.ui.trigger"
          aria-expanded="false" aria-haspopup="true" name="Add to navigation">+</button>

  <button data-testid="feedback-button.horizontal-nav-feedback-button" …>…</button>
</header>
```

## Must-preserve contract

- Outer tag: `<header id="ak-project-view-navigation" data-testid="horizontal-nav.ui.content.horizontal-nav" data-ssr-placeholder="project-view-navigation">`.
- Exactly one **non-interactive** tab: `<h2 data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab" aria-current="page">`. This represents the currently active tab (`Board` in the clone).
- **Seven** `<a data-testid="navigation-kit-ui-tab.ui.link-tab" role="link" draggable="false" tabindex="0">` tabs, one each for (in order): Summary, List, Calendar, Timeline, Approvals, Forms, Pages. `href` values must match the pattern
  `^/jira/core/projects/[A-Z]+/(summary|list|calendar|timeline|approvals|form|pages)$`.
- One `<div data-testid="navigation-kit-ui-tab.ui.dropdown-trigger-tab.tab-button">` wrapping a `<button data-testid="navigation-kit-ui-tab-list.ui.more-trigger.more-tab" aria-expanded="false" aria-haspopup="true">`.
- One `<button data-testid="navigation-kit-add-tab.ui.trigger">`.
- One `<button data-testid="feedback-button.horizontal-nav-feedback-button">`.
- The whole `<header>` must be a descendant of
  `[data-testid="page-layout.main"]`.

## Active tab handling

The clone currently marks `Board` as active via `className`. To match the
reference, emit `Board` as an `<h2 data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab" aria-current="page">` inside the tab list. When the active tab switches at runtime, toggle which tab renders as the `<h2>` vs an `<a>`.

Your clone's current `TABS` array contains 12 entries. Put the first
seven (excluding the active `Board`) as `<a>` tabs in the positions
listed above (re-label if needed, the check only asserts `href` patterns
and counts). The remaining five overflow into the "4 more tabs"
dropdown — that just needs the trigger button to exist; the menu content
isn't part of the check.

## Class tokens to mirror

Every `<a data-testid="navigation-kit-ui-tab.ui.link-tab">` must include
at least these tokens:

`_19pkidpf _2hwxidpf _otyridpf _18u0idpf _zulp1b66 _1e0c1txw _1q51pxbi _y4ti1dlk _85i5pxbi _bozg12x7 _k48p1wq8 _1wybdlk8 _1dyz4jg8 _o5721q9c _4t3izwfg _vchhusvi _1ul91ris _syazsi2i _4cvr1h6o`

The active `<h2>` must include:

`_19pkidpf _2hwxidpf _otyridpf _18u0idpf _zulp1b66 _1e0c1txw _syaz1351`

Your existing `jira-tab` / `jira-tab--active` classes can coexist with
the reference tokens.

## Ignore list

- The giant trailing hashed-class suffix strings on tab anchors (the
  superset check only demands the tokens listed above).
- Any `<svg>` inside the tab; not required by the check.
- The `<span>` text span wrapper around each tab's label.

## Do-not-break

- Tab click handlers (`(e) => e.preventDefault()`) stay.
- Visual: keep the current `jira-tab` bar styling; the reference tokens
  are purely structural here.

## Verification

The surface check will assert:

- `[data-testid="page-layout.main"] [data-testid="horizontal-nav.ui.content.horizontal-nav"]`
  exists and is a `<header>` with `id="ak-project-view-navigation"` and
  `data-ssr-placeholder="project-view-navigation"`.
- `[data-testid="navigation-kit-ui-tab.ui.link-tab"]` matches **7** elements,
  all `<a>` tags with `role="link"`, `tabindex="0"`, `draggable="false"`,
  and `href` matching the path pattern above.
- `[data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab"]`
  matches **1** element, an `<h2>` with `aria-current="page"`.
- `[data-testid="navigation-kit-ui-tab-list.ui.more-trigger.more-tab"]`
  matches **1** element, a `<button>` with `aria-expanded="false"` and
  `aria-haspopup="true"`.
- `[data-testid="navigation-kit-add-tab.ui.trigger"]` matches **1**
  `<button>`.
- `[data-testid="feedback-button.horizontal-nav-feedback-button"]`
  matches **1** `<button>`.
