# 08 — Modal / portal layer

Align how overlays (dialogs, dropdowns) mount so the clone has the same
portal surface Jira does.

Surface id: `modal-portal`

## Target in the clone

[`src/App.tsx`](../src/App.tsx) — the `composer` modal, currently rendered
inline as `<div className="jira-modal-backdrop"><div className="jira-modal" role="dialog">…</div></div>` around lines 463–521.

## Reference structure

Jira uses a document-level portal container at the end of `<body>`:

```startLine:endLine:reference.html
<div class="atlaskit-portal-container" style="display: flex;">
  <div class="atlaskit-portal" style="z-index: 600;">
    <div data-theme="dark:dark light:light spacing:spacing typography:typography"
         data-color-mode="light"
         data-subtree-theme="true"
         class="_1e0c1bgi">
      <!-- portal body: dialog / dropdown contents -->
    </div>
  </div>
  <div class="atlaskit-portal" style="z-index: 600;">…</div>
  <!-- …more portals as needed… -->
</div>
```

Each `atlaskit-portal` owns one overlay layer (dialogs, tooltips,
dropdowns). The `atlaskit-portal-container` exists even when empty.

## Must-preserve contract

- Exactly one `<div class="atlaskit-portal-container">` at the bottom of
  `<body>` (last or second-to-last child), independent of whether a
  modal is open.
- When a modal is open, one or more `<div class="atlaskit-portal" style="z-index: …">` children exist inside the container.
- Each `atlaskit-portal` has a direct child `<div data-theme="dark:dark light:light spacing:spacing typography:typography" data-color-mode="light" data-subtree-theme="true" class="_1e0c1bgi">` that wraps the overlay body.
- The existing composer modal (`role="dialog"`, `aria-modal="true"`,
  `aria-labelledby="card-dialog-title"`) must be rendered inside that
  theme wrapper when open, not inline next to the board.

## Implementation hint

Use React's `createPortal` to move the dialog into a dedicated
`.atlaskit-portal-container` node mounted on `document.body`. The
container can be created once in a `useEffect` (or rendered as a
top-level sibling and styled with `display: flex`). The dialog itself
stays a `role="dialog"` with `aria-modal="true"` as today.

Sketch:

```tsx
function PortalRoot({ children }: { children: React.ReactNode }) {
  const container = useMemo(() => {
    let el = document.querySelector('.atlaskit-portal-container') as HTMLDivElement | null
    if (!el) {
      el = document.createElement('div')
      el.className = 'atlaskit-portal-container'
      el.style.display = 'flex'
      document.body.appendChild(el)
    }
    return el
  }, [])
  return createPortal(
    <div className="atlaskit-portal" style={{ zIndex: 600 }}>
      <div
        data-theme="dark:dark light:light spacing:spacing typography:typography"
        data-color-mode="light"
        data-subtree-theme="true"
        className="_1e0c1bgi"
      >
        {children}
      </div>
    </div>,
    container,
  )
}
```

Then wrap the existing `composer` markup in `<PortalRoot>…</PortalRoot>`.

## Class / attribute contracts

- Portal container: tag `<div>`, `class="atlaskit-portal-container"`,
  inline `style` including `display: flex`.
- Portal layer: tag `<div>`, `class="atlaskit-portal"`, inline `style`
  including `z-index: 600`.
- Theme wrapper: tag `<div>`, attributes
  `data-theme="dark:dark light:light spacing:spacing typography:typography"`,
  `data-color-mode="light"`, `data-subtree-theme="true"`, class
  `_1e0c1bgi`.

## Do-not-break

- Modal still opens via `openCreateCard` / `openEditCard`.
- Backdrop click still closes. The existing `<div className="jira-modal-backdrop" onClick={closeComposer}>` wrapper can live inside the theme wrapper instead of directly inside `.jira-app`.
- `closeComposer`, `handleComposerSubmit`, `deleteCard` still wired.
- `autoFocus` on the summary input continues to work.

## Ignore list

- The exact number of `atlaskit-portal` children (Jira spawns more for
  tooltips; the check allows 0..N when no modal is open, and ≥1 when
  one is).

## Verification

The surface check will run in two states:

**State A — no modal:**

- `document.body > .atlaskit-portal-container` exists (last or
  second-to-last child) with inline `display: flex`.
- Zero or more `.atlaskit-portal` descendants are acceptable.

**State B — modal open (check opens one by clicking `+ Create`):**

- Inside `.atlaskit-portal-container` there is at least one
  `.atlaskit-portal` with inline `style` including `z-index: 600`.
- Each `.atlaskit-portal` contains a `div._1e0c1bgi` with the required
  `data-theme`, `data-color-mode`, `data-subtree-theme` attributes.
- A `[role="dialog"][aria-modal="true"][aria-labelledby="card-dialog-title"]`
  is a descendant of that theme wrapper (not of `.jira-app`).
