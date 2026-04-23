# Dispatch 04 — fresh worker
- **Target spec:**  `board/columns.create_in_column.spec.mjs`
- **Focused rerun:** 1/1 passed
- **Improved:** true
- **Worker context next dispatch:** cleared
## Task
The previous change to src/App.tsx replaced the Create button's children `<span>+</span><span>Create</span>` with plain text `"Create"` and added a `::before { content: '+' }` in src/App.css. This regressed the visual score (color dropped from 0.287 to 0.217).

Course-correct WITHOUT breaking the tests/board/columns.create_in_column.spec.mjs spec. Read both the spec and src/App.tsx first.

Strategy: restore the original children `<span>+</span><span>Create</span>` (or whatever it was — check git/HEAD via looking at src/App.css for the removed rule you added), AND also remove the `.jira-col__create::before { content: '+' }` rule you added.

To still satisfy the spec's `normalize-space(.) = "Create"` requirement, hide the `+` span from the accessible/text tree by wrapping it so its text doesn't appear in normalize-space. Options (pick whichever works):
  - Put the `+` into a `::before` on the inner span via CSS `content` (CSS-generated content is NOT part of normalize-space(.) in XPath because it's not real text), i.e. keep the span but make it empty: `<span aria-hidden="true" class="jira-col__create-icon"></span><span>Create</span>` and add `.jira-col__create-icon::before { content: '+'; }`. The empty span contributes no text.
  - Or simply set the `+` span's text via CSS `content` and leave it empty in JSX.

The key: the button's DOM text content (what normalize-space sees) must equal exactly "Create", but the visual rendering must match the original (two spans, `+` visible, same layout/colors). Verify by re-reading the spec's locator after your edit.
## Rationale
Previous fix regressed the visual score. Restore the original DOM structure of the Create button while still satisfying the spec.
## Worker summary
Edited `src/App.tsx` to restore the two-span structure (`<span aria-hidden="true" className="jira-col__create-icon"></span><span>Create</span>`) so the `+` is rendered via CSS `::before` on the empty icon span (no DOM text), and updated `src/App.css` to move the `content: '+'` from `.jira-col__create::before` to `.jira-col__create-icon::before` — the button's `normalize-space(.)` now equals exactly `"Create"` (satisfying the spec) while the visual `+` icon is preserved.