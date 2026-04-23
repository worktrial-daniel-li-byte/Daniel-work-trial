# Dispatch 20 — fresh worker

- **Before reward:** 0.4328
- **After reward:**  0.4374
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Small visual fixes in src/App.tsx. Goal: clean up floating text in the sidebar that overlaps other items.

In the current screenshot of our app, the sidebar shows some floating/stacked text labels that shouldn't be visible:
- "More actions" text appears floating between "Spaces" and the "Autoloop" item
- "Recent" and "Spaces" labels seem to appear twice (once as section header, once as floating text)

These are likely inner label spans inside more-actions buttons or aria-label spans that got exposed when we restructured.

Please:

1. Grep src/App.tsx for the literal string `More actions` — if there are any visible `<span>More actions</span>` or inline text nodes inside sidebar JSX (not inside `<span className="vh-sr">`), wrap them with `className="vh-sr"` so they don't render visibly. Keep them in the DOM.

2. For any text like "Recent" or "Spaces" that appears as a visible text node INSIDE a button in the sidebar (different from the legitimate section-header `.jira-sb-section` which says "Recent" and "Spaces" once), wrap it in vh-sr so it's hidden visually.

3. More broadly, anywhere in the sidebar JSX where the recent restructure added `<span>{label}</span>` for icon-only buttons (like more-actions / chevron), wrap the label with `className="vh-sr"` or add `style={{position:'absolute',left:-9999}}`.

4. Check specifically for these areas in the sidebar:
   - The Spaces container's more-actions "..." button (visible in screenshot between Spaces item and Autoloop)
   - The more-actions chevrons/buttons on Apps/Plans/Dashboards/Filters
   - The Recent container's more-actions

Use the existing `.vh-sr` class (already in src/App.css) for anything you wrap.

Do NOT remove any wrapper divs or data-testid attributes. Do NOT change layout CSS. Just wrap visible labels of icon-only buttons with vh-sr class.

Report what you wrapped.

## Rationale

SSIM can recover if we hide the floating labels in the sidebar that are visually out of place. This directly improves the visual match with the reference without losing pqgram. Estimated +0.01 reward.

## Worker summary

I edited `src/App.tsx` at line 2137 to wrap the text `More actions for Spaces` inside the Spaces `jira-sb-row-action-btn` with `className="vh-sr"`, hiding it visually so it no longer floats between the "Spaces" row and the "Autoloop" item. All other label spans (Recent, Apps, Plans, etc.) are inside proper nav buttons or already `sr-only`-guarded and were left untouched.
