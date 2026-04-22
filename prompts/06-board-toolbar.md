# 06 — Board toolbar (filters, presence, group-by)

Align the toolbar above the board — search/filter/assignee/group-by — to
match Jira's board toolbar.

Surface id: `board-toolbar`

## Target in the clone

[`src/App.tsx`](../src/App.tsx) — the `<div className="jira-board-bar">`
block, currently around lines 358–393.

## Reference structure

Cited elements (the board toolbar is between the horizontal nav
`<header>` and the `board-wrapper`):

```startLine:endLine:reference.html
<!-- Filters region -->
<fieldset data-testid="business-filters.ui.filters.assignee-filter" class="_19itidpf">
  <button data-testid="business-filters.ui.filters.trigger.button-wrapper"
          aria-expanded="false" aria-haspopup="true" aria-label="0 filters applied"
          tabindex="0" type="button"
          class="_1qt3kjry … css-1psnbih">…</button>
  <!-- assignee presence avatars -->
  <div data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar"
       aria-label="Daniel Li is online">…</div>
</fieldset>

<!-- Group by + search -->
<button aria-label="Group by Status" …>Group by Status</button>
<div role="search" aria-label="Search board">…</div>
```

## Must-preserve contract

- `<fieldset data-testid="business-filters.ui.filters.assignee-filter">` contains:
  - `<button data-testid="business-filters.ui.filters.trigger.button-wrapper" aria-expanded="false" aria-haspopup="true" aria-label="0 filters applied" tabindex="0" type="button">`.
  - At least one `<div data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">` (can be 1..N; acceptable range 1–10).
- A button in the toolbar with `aria-label="Group by Status"`. (Its inner
  text content can stay as today's `Group: Status`.)
- A search wrapper with `role="search"` and `aria-label="Search board"`,
  containing an `<input>`.

## Class tokens

- `<fieldset>` required token: `_19itidpf`.
- `<button data-testid="business-filters.ui.filters.trigger.button-wrapper">` required tokens:
  `_1qt3kjry _1g9h1tex _1umfuwj9 _6l8r3x59 _9se5176f _12rallho _zk5uzt2a _18vg2zyf _192e1jcw _fnp717ga _1xjgvy9e _1u0u14e8 _17z218zq _7n83frbu _n2ul1jo4 _1cf1r7td _1d7c1ag4 _nwukvy9e _fsjd4zrn _z1i3eyly`
  (plus `css-1psnbih`).

## Behavior to preserve

- The existing `<input type="search" placeholder="Search board" readOnly tabIndex={-1}>` must remain functional (non-interactive stub is fine).
- The `Filter` button and `Group: Status` button in the clone become the
  `trigger.button-wrapper` and `Group by Status` buttons respectively.
  Do not remove them.

## Ignore list

- The `class="css-1psnbih"` value on the filter button is fine to vary; the
  required hashed tokens above are what the check asserts.
- The number of presence avatars (check allows 1–10).

## Verification

- `[data-testid="business-filters.ui.filters.assignee-filter"]` exists and
  is a `<fieldset>` with class token `_19itidpf`.
- Inside it, `[data-testid="business-filters.ui.filters.trigger.button-wrapper"]`
  exists as a `<button>` with `aria-expanded="false"`, `aria-haspopup="true"`,
  `aria-label="0 filters applied"`, `tabindex="0"`, `type="button"`.
- `[data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar"]`
  count is between 1 and 10.
- A `<button>` with `aria-label="Group by Status"` exists inside the
  toolbar.
- A `[role="search"][aria-label="Search board"]` exists inside the
  toolbar and has an `<input>` descendant.
