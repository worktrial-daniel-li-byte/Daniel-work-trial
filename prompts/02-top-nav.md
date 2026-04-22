# 02 — Top nav

Align the global top bar so it matches real Jira's `atlassian-navigation`.
This is the highest-traffic surface; get it right first after the app shell.

Surface id: `top-nav`

## Target in the clone

[`src/App.tsx`](../src/App.tsx) — the `<header className="jira-topbar">`
block (currently around lines 255–299).

## Reference structure

The reference top-nav is a `<header>` with `data-testid="page-layout.top-nav"`.
It contains, in order:

1. **Product home** — container `<div data-testid="atlassian-navigation--product-home--container">`
   with an inner icon wrapper `<span data-testid="atlassian-navigation--product-home--icon--wrapper">`
   and a trailing `Jira` product label.
2. **Quick-find / search** — `<button data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper">`
   whose descendant has `<div role="search" data-testid="search-input-container">`
   and inside that an `<input>` / clickable wrapper with
   `data-testid="search-input"`.
3. **Primary actions (right side), in order:**
   - `<button data-testid="atlassian-navigation--create-button">` — the blue "Create" button.
   - `<span role="listitem" data-testid="atlassian-navigation.ui.conversation-assistant.app-navigation-ai-mate">` — the Ask Rovo chip.
   - `<div data-testid="atlassian-navigation--secondary-actions--notifications--menu-trigger" data-vc="atlassian-navigation-notifications">` — bell icon.
   - `<div data-testid="atlassian-navigation--secondary-actions--help--menu-trigger" data-vc="atlassian-navigation-help">` — help icon.
   - `<div data-testid="atlassian-navigation--secondary-actions--settings--menu-trigger" data-vc="atlassian-navigation-settings">` — settings gear.
   - `<button data-testid="atlassian-navigation--secondary-actions--profile--trigger" aria-controls="atlassian-navigation--secondary-actions--profile--content" aria-expanded="false" aria-haspopup="true">` — avatar menu.

The whole thing is wrapped in:

```startLine:endLine:reference.html
<header id="_R…_" data-layout-slot="true"
        data-testid="page-layout.top-nav"
        class="_nd5l8cbt _zulpu2gc … _jh1g18ax">
  <style>#unsafe-design-system-page-layout-root { --n_tNvM: 56px }</style>
  <style>:root { --topNavigationHeight: 56px }</style>
  <!-- body of nav: product home, search, actions -->
</header>
```

## Must-preserve contract

- Outer element is `<header>` (not `<div>`).
- `<header>` has `data-testid="page-layout.top-nav"` and
  `data-layout-slot="true"` and an `id` matching `^_R[a-zA-Z0-9]+_$`.
- Inline child `<style>` blocks that declare
  `--n_tNvM: 56px` and `--topNavigationHeight: 56px` must be present
  (they establish the layout height contract).
- Every `data-testid` and `data-vc` listed above must be present on an
  element with the same tag name as in the reference (`button`, `div`,
  `span`, `a`, as appropriate).
- Ordering: product home → search → (create, Ask Rovo, notifications,
  help, settings, profile). Other decorative nodes between them are OK.

## Class lists to mirror (minimum required tokens)

Apply these onto the matching element. Keep existing `jira-*` classes too.

- `<header data-testid="page-layout.top-nav">`:
  `_nd5l8cbt _zulpu2gc _18zrze3t _179rglyw _1e0c11p5 _yv0e1mfv _4cvr1h6o _bfhkvuon _vchhusvi _4t3i1dgc _152t1nws _kqsw1if8 _1pby11wp _d6vu1bgi _1j8b18ax _lcxv1wug _aetrb3bt _18postnw _1gufidpf _1czdidpf _g0nf3tht _1beue4h9 _uaeunqa1 _1cte1l7x _pdlmutpp _1rqt16a9 _jh1g18ax`

For the child nodes inside, minimum required class tokens are fewer; the
surface check only demands the tokens you see in the reference snippet for
each data-testid target.

## Volatile bits to preserve by shape

- `<header id>` matches `^_R[a-zA-Z0-9]+_$`. This must equal the id
  referenced by skip-link #1 from prompt 01.

## Ignore list for this surface

- The giant hashed-class strings on inner decorative nodes beyond what's
  listed above (they're mostly visual).
- `window.SPA_STATE` and other inline `<script>` blocks that follow the
  `<header>`.
- `<span aria-hidden="true">` svg-wrapping spans — presence optional.
- The literal "Jira" product-label text can stay as today's clone output.

## Do-not-break

- The existing top-bar buttons in [`src/App.tsx`](../src/App.tsx) (Home,
  Create, Premium trial, Rovo, Notifications, Settings, Avatar) already
  have `aria-label`s and on-click handlers. Move them into the new
  Atlassian-style wrappers, don't delete them. The `Create` button must
  still call `openCreateCard(columns[0].id)`.

## Verification

The surface check will assert, inside `<body>`:

- Exactly one `<header data-testid="page-layout.top-nav">` exists with
  `data-layout-slot="true"` and `id` matching `^_R[A-Za-z0-9]+_$`.
- That header's required class tokens are all present.
- At least one inline `<style>` descendant contains the string
  `--topNavigationHeight` with value `56px`.
- Each of the following selectors returns at least one node *inside* the
  top-nav header:

  ```
  [data-testid="atlassian-navigation--product-home--container"]
  [data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper"]
  [data-testid="atlassian-navigation--create-button"]
  [data-testid="atlassian-navigation.ui.conversation-assistant.app-navigation-ai-mate"]
  [data-testid="atlassian-navigation--secondary-actions--notifications--menu-trigger"]
  [data-testid="atlassian-navigation--secondary-actions--help--menu-trigger"]
  [data-testid="atlassian-navigation--secondary-actions--settings--menu-trigger"]
  [data-testid="atlassian-navigation--secondary-actions--profile--trigger"]
  ```

- The `create-button` is a `<button>`, `search.quickfind-skeleton-wrapper`
  is a `<button>`, `profile--trigger` is a `<button>` with
  `aria-expanded`, `aria-haspopup="true"`, and `aria-controls`.
