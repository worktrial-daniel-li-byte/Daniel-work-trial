# 01 — App shell

Align the outermost DOM scaffolding of the app so the Fira clone boots
into the same document landmarks real Jira does.

Surface id: `app-shell`

Before you start, read [`00-overview.md`](./00-overview.md).

## Target in the clone

- [`index.html`](../index.html) — the document `<body>` and `#root` wrapper.
- [`src/App.tsx`](../src/App.tsx) — the outer `<div className="jira-app">`
  and top-level siblings (topbar, body, modal backdrop, FAB).

Today the clone renders `<body><div id="root"><div class="jira-app">…`,
skipping every wrapper real Jira puts in between.

## Reference structure (from [`reference.html`](../reference.html))

Cited anchors (line numbers approximate, since the reference is minified
onto a few very long lines):

```startLine:endLine:reference.html
<body id="jira" style="background-color: var(--ds-surface, #fff); color: var(--ds-text, #292a2e);">
  <div id="jira-frontend">
    <!-- theme <style> blocks — ignore content, but allow their presence -->
    <div data-testid="page-layout.root--skip-links-container" class="_zulp1b66 …">
      <span data-testid="page-layout.root--skip-links-container--label" class="…">Skip to:</span>
      <ol class="…">
        <li><a href="#_R…_" tabindex="0" class="…">Top Bar</a></li>
        <li><a href="#_R…_" tabindex="0" class="…">Space navigation</a></li>
        <li><a href="#_R…_" tabindex="0" class="…">Content</a></li>
      </ol>
    </div>
    <div id="unsafe-design-system-page-layout-root" data-testid="page-layout.root" class="…">
      <!-- top-nav <header>, banner, sidebar <nav>, main <div>, aside <section> children -->
    </div>
  </div>
</body>
```

## Must-preserve contract

- `document.body` must have `id="jira"`.
- First child of `<body>` must be `<div id="jira-frontend">`.
- Inside `#jira-frontend`, in order:
  1. Zero or more `<style>` blocks (content ignored by check).
  2. `<div data-testid="page-layout.root--skip-links-container">` containing:
     - `<span data-testid="page-layout.root--skip-links-container--label">` with text `Skip to:`.
     - `<ol>` with exactly three `<li>` children, each containing an `<a>`
       with `tabindex="0"` and `href` matching the pattern `^#_R[a-zA-Z0-9]+_$`.
  3. `<div id="unsafe-design-system-page-layout-root" data-testid="page-layout.root">`.
- The existing `<div id="root">` from [`index.html`](../index.html) is fine
  to keep as an outer wrapper for React mounting, but `#jira-frontend` and
  everything below must render inside it.

## Class lists to mirror verbatim (from reference)

Copy these class lists onto the matching elements. Also keep any existing
`jira-*` classes so styles continue to apply.

- `page-layout.root--skip-links-container` →
  `_zulp1b66 _2rko12b0 _1rjcutpp _18zrutpp _1e0c1txw _2lx21bp4 _kqsw1n9t _1e02v47k _152tv47k _bfhk1bhr _16qs130s _1pby1mrw _tzy4idpf _lcxvglyw _1digjh3g _1mygkb7n _18eu1wug`
- skip-links `<ol>` →
  `_zulp1b66 _1e0c1txw _2lx21bp4 _1x8w11lx _2mzuglyw _1pfhze3t _bozgze3t`
- skip-links `<li>` → `_1pfhze3t`
- `page-layout.root` →
  `_1e0c11p5 _1tke1kxc _1lmcq9em _yv0ei47z _2z0516ab _1ciragmp _12fk1aio _12qzrxre _1rqteala _xkmgks3h _jbc7rxre _tyve1nco`

Class token order on the element does not matter to the check, only
presence.

## Volatile bits to preserve by shape only

- Skip-link `href`: three distinct values matching `^#_R[a-zA-Z0-9]+_$`,
  each pointing to the matching slot `id` (`top-nav`, `sidebar`, `main`).
- `id` on top-nav / sidebar / main: matches `^_R[a-zA-Z0-9]+_$`.

## Ignore list for this surface

- Theme `<style>` blocks and CSS variable declarations inside
  `#jira-frontend` (content).
- Preload `<link>`, `<script>`, and `<meta>` tags in `<head>` not already
  present in [`index.html`](../index.html).
- SSR comment markers.

## Do-not-break

- React root must still mount into `#root`. One clean way: keep
  `index.html` as-is, and in [`src/App.tsx`](../src/App.tsx) render an
  outer wrapper that sets `document.body.id` in an effect and emits
  `#jira-frontend` → skip-links → `page-layout.root` as JSX around the
  current body content.

## Verification

The surface check will assert:

- `document.body.id === 'jira'`.
- `document.body.firstElementChild.id === 'jira-frontend'`.
- `document.querySelector('[data-testid="page-layout.root--skip-links-container"]')` exists with the required class tokens and contains exactly 3 `li > a` nodes, each `href` matching `^#_R[A-Za-z0-9]+_$`.
- `document.querySelector('#unsafe-design-system-page-layout-root[data-testid="page-layout.root"]')` exists with the required class tokens.
- Skip-link `href`s resolve to existing elements with matching `id`s.
