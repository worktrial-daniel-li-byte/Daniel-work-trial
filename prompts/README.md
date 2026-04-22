# Fira DOM Alignment Prompts

These prompts make the Fira clone's DOM match real Jira's DOM
([`reference.html`](../reference.html)) one stable surface at a time. Each
prompt is a self-contained instruction set an agent can execute without
seeing the other prompts.

## How to use

1. Feed the prompts to an agent in order, one at a time.
2. After each prompt, run the matching surface check:

   ```bash
   npm run check:dom -- --surface=<id>
   ```

   or check all surfaces at once:

   ```bash
   npm run check:dom
   ```

3. Only move to the next prompt when the current surface passes.
4. After the last prompt, run the behavior regression suite:

   ```bash
   npm run check:behavior
   ```

## Order

| #  | Prompt                                    | Surface                                                    | Check id         |
| -- | ----------------------------------------- | ---------------------------------------------------------- | ---------------- |
| 00 | [`00-overview.md`](./00-overview.md)      | Global rules and ignore list                               | —                |
| 01 | [`01-app-shell.md`](./01-app-shell.md)    | `#jira`, `#jira-frontend`, skip-links, `page-layout.root`  | `app-shell`      |
| 02 | [`02-top-nav.md`](./02-top-nav.md)        | `page-layout.top-nav` + atlassian-navigation               | `top-nav`        |
| 03 | [`03-left-nav.md`](./03-left-nav.md)      | `page-layout.sidebar` + project side nav                   | `left-nav`       |
| 04 | [`04-horizontal-nav.md`](./04-horizontal-nav.md) | `horizontal-nav.ui.content.horizontal-nav` tab strip | `horizontal-nav` |
| 05 | [`05-project-header.md`](./05-project-header.md) | `horizontal-nav-header.ui.project-header.header`     | `project-header` |
| 06 | [`06-board-toolbar.md`](./06-board-toolbar.md)  | `business-filters.*` + presence + group-by controls   | `board-toolbar`  |
| 07 | [`07-board-canvas.md`](./07-board-canvas.md)    | `board.content.board-wrapper` + cells + cards         | `board-canvas`   |
| 08 | [`08-modal-portal.md`](./08-modal-portal.md)    | `atlaskit-portal-container` overlay layer             | `modal-portal`   |
| 09 | [`09-rovo-fab.md`](./09-rovo-fab.md)            | `layout-controller.ui.bottom-right-corner` FAB area   | `rovo-fab`       |

## Ground rules (always read `00-overview.md` first)

- Preserve tags, nesting, `data-testid`, `role`, `aria-*`, `id` shape, and
  class lists exactly as they appear in `reference.html` for the target
  surface.
- Ignore the noise called out in `00-overview.md` (preload tags, perf
  scripts, SSR comments, volatile runtime IDs).
- Do not change existing state/handlers in
  [`src/App.tsx`](../src/App.tsx). Only restructure the JSX.
- If a structural change would break a feature (drag/drop, composer modal,
  card CRUD), wire the new wrappers around the old handlers — don't remove
  the handlers.
