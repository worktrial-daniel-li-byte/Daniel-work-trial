# 00 — Overview and global rules

You are aligning the Fira clone in this repo to real Jira's DOM, using
[`reference.html`](../reference.html) as the ground truth for fixed UI
surfaces. This document defines rules that apply to **every** surface
prompt in this directory.

## Repo facts

- The clone lives in [`src/App.tsx`](../src/App.tsx) and styles in
  [`src/App.css`](../src/App.css). Almost the entire UI is rendered from
  those two files.
- Entry HTML: [`index.html`](../index.html), mount: `<div id="root">`.
- Vite + React 19, no test framework yet — checks are run by scripts under
  `scripts/`.

## Goal

Full-fidelity DOM preservation on fixed surfaces. For every element inside
a target surface that exists in `reference.html`, the clone must have the
same:

- tag name
- parent → child nesting depth and order
- `data-testid`, `data-vc`, `role`, `aria-*`, `id` (by shape — see below)
- class list (including Atlassian's hashed tokens, treated as opaque
  structural markers — see below)
- inline layout `style` properties that carry layout contracts (e.g.
  CSS custom properties like `--topNavigationHeight`)

Visual output must not regress. Keep existing `jira-*` class names and CSS
rules from [`src/App.css`](../src/App.css) in addition to any reference
classes you add. The two can coexist: `className="jira-topbar _nd5l8cbt …"`.

## What to ignore from `reference.html`

These appear in the snapshot but are **not** part of the DOM contract. Do
not attempt to reproduce them:

- `<link rel="modulepreload" …>` and other preload tags in `<head>`.
- `<script nonce …>` blocks containing `window.performance.mark`,
  `window.SPA_STATE`, `window.bifrostPayloadStats`, statsig blobs,
  `parcelRequire49d7`.
- SSR comment markers like `<!--$-->` / `<!--/$-->`.
- Theme `<style>` blocks injected by `RESOURCE_THEME_PREFERENCE`.
- Content of `<script type="module">` preload entrypoints.

## Volatile runtime IDs

Jira's SSR generates IDs like `_Rhp955jal5_`, `_R2p955jal5_`,
`_Rb9955jal5_`, `_R3a9955jal5_`. Do **not** copy those literal values.
Instead:

- Preserve the fact that the element has an `id` attribute.
- Preserve the **shape**: underscore prefix, short token, underscore
  suffix. Any matching regex `^_R[a-zA-Z0-9]+_$` is acceptable.
- Preserve any references to that id (skip-link `href="#_R…_"`,
  `aria-controls`, `aria-labelledby`) as the same generated value.
- In React, you can generate these in-component with `useId()` and wrap
  the result as `` `_R${id.replace(/[^a-z0-9]/gi, '')}_` `` to satisfy
  the shape contract.

## Atlassian hashed classes

Classes like `_nd5l8cbt`, `_zulpu2gc`, `_vchhusvi` are compiled Compiled-CSS
hashes. They're visually meaningless without Atlassian's CSS bundle, but
they are part of the DOM contract. Copy them verbatim from the reference
onto the matching element. Do not try to interpret or rename them. They
can coexist with your `jira-*` classes.

## Class-list rule

The surface checks treat classes as a **superset match**: every class
token present on the reference element must also be present on the clone
element. Extra classes on the clone (e.g. your own `jira-*` styles) are
always fine. Missing required tokens fail the check.

## Attribute rule

- Attributes like `data-testid`, `data-vc`, `role`, `aria-*` must match
  exactly.
- Attributes with volatile values (`id` like `_R…_`, `href` pointing to
  a runtime id) must match the documented **shape**, not the literal
  value.
- Void elements (`<img>`, `<input>`, `<br>`) stay void.

## Where structure is allowed to differ

- Total number of child elements only has to match when the reference has
  a fixed, documented count (e.g. three board columns, seven visible tabs
  in the horizontal nav). When the reference shows a count that is
  state-driven (sidebar recent items, portal overlays), the check allows
  a range documented in the matching surface prompt.
- You do not need to reproduce the `aria-label`s or user copy from the
  reference verbatim unless a surface prompt explicitly asks for it. The
  clone's existing copy (`Autoloop`, `AUT-1`, etc.) can stay.

## Order of operations for each prompt

1. Read the prompt file end-to-end.
2. Locate the target JSX block in [`src/App.tsx`](../src/App.tsx).
3. Rewrite that block so it emits the DOM shape described.
4. Keep all existing event handlers / state references.
5. Update [`src/App.css`](../src/App.css) only as needed to keep the
   previous visual layout working on the new DOM.
6. Run:

   ```bash
   npm run check:dom -- --surface=<id>
   ```

7. Read the failure report, fix, re-run until green.

## Do-not-break list

Existing behavior that must keep working after every prompt:

- Create card (`+ Create` top-bar button, and `+ Create` per column).
- Edit card (clicking a card's Edit opens the modal).
- Delete card (both on card and inside edit modal).
- Drag a card between columns.
- Modal close on backdrop click, on `Cancel`, and on submit.
- Sidebar "Autoloop" link shows active state.
- The "Board" tab shows active state in the horizontal nav.

If any of these stop working after restructuring, the prompt is not
done — the surface check passing is necessary but not sufficient. Run
`npm run check:behavior` at the very end to confirm.
