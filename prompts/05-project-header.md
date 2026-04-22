# 05 — Project header (Autoloop title + actions)

Align the project header row (avatar, project name, action menu) inside
the horizontal nav to match Jira's `horizontal-nav-header.ui.project-header`.

Surface id: `project-header`

## Target in the clone

[`src/App.tsx`](../src/App.tsx) — the `<div className="jira-title-row">`
block with the project swatch, name, and trailing icon button, currently
around lines 332–342.

## Reference structure

```startLine:endLine:reference.html
<div data-testid="horizontal-nav-header.ui.project-header.header" class="css-twdxlp">
  <img data-testid="navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image"
       data-vc="editable-avatar-project"
       src="…project/avatar/… (runtime url)"
       alt=""
       class="_2rkofajl _vchhusvi _4t3igktf _1bsbgktf" />

  <div data-testid="horizontal-nav-header.common.ui.read-view"
       class="_1reo15vq _18m915vq _11c81af2 _syazfrbu _19pk12x7 _otyr12x7 _o5721q9c _1bto1l2s">
    <!-- project title, e.g. "Autoloop" -->
  </div>

  <button data-testid="navigation-project-action-menu.ui.menu-container.themed-button"
          aria-label="Actions"
          aria-expanded="false" aria-haspopup="true" type="button">…</button>
</div>
```

The header is the first child of `[data-testid="horizontal-nav.ui.content.horizontal-nav"]`,
before the tab list.

## Must-preserve contract

- Outer: `<div data-testid="horizontal-nav-header.ui.project-header.header">`.
- First child: `<img data-testid="navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image" data-vc="editable-avatar-project" alt="">`.
  - `src` attribute must be present (value can be your own avatar asset
    or a placeholder data URL — check asserts presence + non-empty).
  - `alt=""` exactly (matches reference).
- Second child: `<div data-testid="horizontal-nav-header.common.ui.read-view">`
  containing the project title text (`Autoloop` is fine).
- Third child: `<button data-testid="navigation-project-action-menu.ui.menu-container.themed-button" aria-label="Actions" aria-expanded="false" aria-haspopup="true" type="button">`.
- The three children appear in that order. Additional wrapper `<span>`s
  around the title are allowed.
- The header is a direct descendant of `[data-testid="horizontal-nav.ui.content.horizontal-nav"]`.

## Class tokens required

- Header wrapper: `css-twdxlp`.
- `<img>`: `_2rkofajl _vchhusvi _4t3igktf _1bsbgktf`.
- Read-view `<div>`: `_1reo15vq _18m915vq _11c81af2 _syazfrbu _19pk12x7 _otyr12x7 _o5721q9c _1bto1l2s`.

Your existing `jira-project-swatch`, `jira-project-name`, `jira-title-row`
classes can stay on the wrapping elements for styling.

## Behavior to preserve

The clone's current "Project actions" icon button (`aria-label="Project actions"`)
becomes this `<button aria-label="Actions">`. Replace the aria-label and keep
the existing `onClick`/`type="button"` if any.

The project swatch in the clone is today a `<span>` gradient. Replace
with the `<img>` described above so the reference contract is met. The
`src` can be any placeholder (e.g. a local SVG data URL) — the check
only asserts presence.

## Ignore list

- The runtime Atlassian avatar URL — use your own.
- Other decorative spans inside the read-view.

## Verification

- One `[data-testid="horizontal-nav-header.ui.project-header.header"]` exists and is a descendant of `[data-testid="horizontal-nav.ui.content.horizontal-nav"]`.
- Its first element child is `<img data-testid="navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image" data-vc="editable-avatar-project" alt="">` with a non-empty `src`.
- `[data-testid="horizontal-nav-header.common.ui.read-view"]` exists inside the header and contains non-empty text.
- `[data-testid="navigation-project-action-menu.ui.menu-container.themed-button"]` exists inside the header as a `<button>` with `aria-label="Actions"`, `aria-expanded="false"`, `aria-haspopup="true"`, `type="button"`.
- All class tokens listed above are present on their respective nodes.
