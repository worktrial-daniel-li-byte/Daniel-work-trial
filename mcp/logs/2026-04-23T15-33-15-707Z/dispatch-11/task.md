# Dispatch 11 — fresh worker

- **Before reward:** 0.3484
- **After reward:**  0.3489
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Goal: raise pqgram region scores in `left-nav`, `top-nav`, `board-canvas`, `horizontal-nav`, and `project-header` (all currently 0.50–0.58). pqgram is Dice multiset similarity of (p=2, q=3) tuples of `tag#data-testid` labels between reference and generated DOM.

Step 1 — Enumerate the reference's data-testid values in each region. Run:
```bash
cd /Users/fleet/fleet-trial
python3 - <<'EOF'
import re
html = open('reference_app/html/reference.html').read()
# Find all data-testid values
for m in re.finditer(r'data-testid="([^"]+)"', html):
    print(m.group(1))
EOF
```
This prints every data-testid in the reference. Sort and unique: `| sort -u`.

Step 2 — Enumerate our data-testid values in src/App.tsx:
```bash
grep -oE 'data-testid="[^"]+"' src/App.tsx | sort -u
```

Step 3 — Compute the DIFF: testids in reference NOT in ours. For each missing testid, locate where it belongs in the reference (read the surrounding lines of reference.html to see which anchor subtree it's in) and add it to the matching place in src/App.tsx.

Prioritize testids under these anchors (these are the low-scoring regions):
- `page-layout.sidebar` subtree (left-nav)
- `page-layout.top-nav` subtree (top-nav)
- `board.content.board-wrapper` subtree (board-canvas)
- `horizontal-nav.ui.content.horizontal-nav` subtree (horizontal-nav)
- `horizontal-nav-header.ui.project-header.header` subtree (project-header)

For each missing testid:
- Identify the tag in the reference (e.g. `div`, `button`, `a`, `span`).
- Find the corresponding JSX element in src/App.tsx (by nearby text or role) and add the exact `data-testid="..."` attribute to it.
- If we don't have an element there at all, wrap the nearest existing element with a `<div data-testid="...">` wrapper.

CONSTRAINT: Do NOT change visible text (text score is currently 0.87, don't break it). Do NOT remove sr-only spans. Do NOT move the skip-links. Only add attributes and add tiny wrapper divs.

Goal: pqgram.combined rises from 0.583 to 0.65+. 

Check src/App.tsx compiles via `npm run build` or by reading for obvious syntax errors. If the file is big, focus on adding ~10 most impactful missing data-testids this turn (the ones that appear highest in the reference's subtrees).

## Rationale

pqgram is 0.583 with weight 0.20. Missing data-testid values on matching tags are the documented lever. Adding even 10 correct testids in the low-scoring regions can raise pqgram.combined 0.05+ (worth +0.02 reward).

## Worker summary

All 11 missing testids are now present. Added `data-testid="page-layout.main"` to the `<main>` element, added `<section data-testid="page-layout.aside">` after it, added `issue-create-restore`, `shared-layout.ui.global.command-palette-container`, and `command-palette-integration.ui.container` divs before the layout-controller, added two `triggered-message-validator-hidden` spans near the end, and populated `page-layout.banner` with the cookie-consent buttons (`preferences-button`, `only-necessary-button`, `accept-all-button`, `experiment-one-button-icon`) — all in `src/App.tsx`.
