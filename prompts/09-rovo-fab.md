# 09 — Rovo / bottom-right FAB region

Align the bottom-right corner layout controller (Rovo floating action
surface) with real Jira.

Surface id: `rovo-fab`

## Target in the clone

[`src/App.tsx`](../src/App.tsx) — the trailing
`<div className="jira-fab" role="presentation" title="Rovo">`
around lines 523–525.

## Reference structure

```startLine:endLine:reference.html
<div data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"
     style="right:calc(0px + var(--ds-space-300, 24px));bottom:calc(var(--ds-space-300, 24px) + 0px)"
     class="_1reoewfl _18m9ewfl _kqsw1n9t _1e0c1txw _1pbyfjpv _4cvresu3 _lcxvglyw">
  <!-- rovo FAB, fullscreen/AI helper buttons, feedback prompts -->
</div>
```

Other surrounding elements in this region include:

- `<button data-testid="platform-ai-button">` (not required; optional).
- `<button data-testid="platform.ui.fullscreen-button.fullscreen-button">` (optional).
- `<button data-testid="experiment-one-button-icon">` (optional).

## Must-preserve contract

- Exactly one `<div data-testid="layout-controller.ui.bottom-right-corner.container.styled-container">`.
- Inline `style` includes **both** `right:` and `bottom:` declarations
  referencing `var(--ds-space-300, 24px)`.
- Required class tokens present on this container.
- Container is a descendant of `document.body` but **outside** the
  `page-layout.main` region (real Jira floats it at document level).

## Class tokens required

`_1reoewfl _18m9ewfl _kqsw1n9t _1e0c1txw _1pbyfjpv _4cvresu3 _lcxvglyw`

Keep the existing `jira-fab` class alongside.

## Behavior to preserve

- The `Rovo` visual affordance stays; the existing `<span className="jira-fab__ring">` child can live inside the new container.
- Do not attach the FAB inside the board surface — it must be a sibling
  of `page-layout.main` (or mounted directly to `document.body`).

## Ignore list

- The optional `platform-ai-button`, `fullscreen-button`,
  `experiment-one-button-icon` testids — not required by the check.
- The inner presentation of the ring / icon.

## Verification

- Exactly one `[data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"]` exists on the page.
- Its inline `style` attribute contains both `right:` and `bottom:` and
  references `--ds-space-300`.
- All required class tokens are present.
- It is NOT a descendant of `[data-testid="page-layout.main"]`.
