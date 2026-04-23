# Dispatch 12 — resumed worker

- **Before reward:** 0.3489
- **After reward:**  0.3484
- **Improved:**      false
- **Worker context next dispatch:** preserved

## Task

Goal: raise `left-nav` pqgram region score (currently 0.518) by matching the reference sidebar DOM structure more precisely. Target: 0.65+.

Step 1 — Extract the reference's sidebar subtree structure:
```bash
cd /Users/fleet/fleet-trial
python3 - <<'EOF'
import re
html = open('reference_app/html/reference.html').read()
# Find the page-layout.sidebar anchor and print a simplified tag outline of its subtree
import html.parser as hp

class Outline(hp.HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.inside = False
        self.start_depth = None
        self.lines = []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        tid = d.get('data-testid','')
        if tid == 'page-layout.sidebar':
            self.inside = True
            self.start_depth = self.depth
        if self.inside:
            pad = '  ' * (self.depth - (self.start_depth or 0))
            label = f"{tag}" + (f"#{tid}" if tid else "")
            self.lines.append(pad + label)
        self.depth += 1
    def handle_endtag(self, tag):
        self.depth -= 1
        if self.inside and self.start_depth is not None and self.depth == self.start_depth:
            self.inside = False

# HTMLParser is tricky with self-closing; instead use a simple regex-based tag walker
import html as htmllib
# Actually let me just grep for tags within the sidebar block
EOF
```

Actually simpler: run
```bash
cd /Users/fleet/fleet-trial
python3 - <<'EOF'
import re
html = open('reference_app/html/reference.html').read()
# Find the sidebar block: start at data-testid="page-layout.sidebar", count tags until balanced
m = re.search(r'<[a-z]+[^>]*data-testid="page-layout\.sidebar"[^>]*>', html)
start = m.start()
# walk forward counting opens/closes until depth=0
pos = start
depth = 0
end = None
tag_re = re.compile(r'<(/)?([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?/?>')
for mm in tag_re.finditer(html, pos):
    tag = mm.group(2).lower()
    is_close = bool(mm.group(1))
    is_self = mm.group(0).endswith('/>') or tag in ('br','img','input','hr','meta','link')
    if is_close:
        depth -= 1
        if depth == 0:
            end = mm.end()
            break
    elif not is_self:
        depth += 1
sub = html[start:end]
# Now print tag outline with depth and data-testid
d = 0
out = []
for mm in tag_re.finditer(sub):
    tag = mm.group(2).lower()
    is_close = bool(mm.group(1))
    attrs = mm.group(3) or ''
    is_self = mm.group(0).endswith('/>') or tag in ('br','img','input','hr','meta','link')
    tid_m = re.search(r'data-testid="([^"]+)"', attrs)
    tid = tid_m.group(1) if tid_m else ''
    if is_close:
        d -= 1
    else:
        pad = '  ' * d
        label = tag + (f"[{tid}]" if tid else "")
        out.append(pad + label)
        if not is_self:
            d += 1
print('\n'.join(out[:200]))
print(f"--- total nodes: {len(out)} ---")
EOF
```

Step 2 — Read our sidebar JSX in src/App.tsx (grep for `page-layout.sidebar` and look at the JSX structure).

Step 3 — Make the sidebar structure match. Specifically:
- For each nav row in the reference, note the chain: e.g. reference might have `<nav><ul><li><div><a><span><span>Text</span></span></a></div></li>...</ul></nav>`.
- In our code, each row might currently be `<a><div>...</div></a>` or similar — add missing `<ul>`/`<li>` wrapper or missing `<div>` wrappers.

Key: copy the exact tag+testid tree shape. Do NOT change visible text. Do NOT break layout — wrappers should have `display: contents` in CSS if they're new.

Constraint: keep file compilable. Only edit src/App.tsx and src/App.css.

Target: `pqgram.regions.left-nav` from 0.518 to 0.65+, `pqgram.combined` from 0.588 to ~0.62+.

## Rationale

left-nav pqgram is 0.518 — the second-lowest non-perfect region. Matching the sidebar's exact tag+testid tree shape should raise left-nav by 0.1+ and pqgram.combined by ~0.02, for ~+0.008 reward.

## Worker summary

Only pre-existing TypeScript errors — no new issues. I edited `src/App.tsx` to restructure the entire left-nav sidebar: wrapped every button's icon+label in a single `display:contents` div (giving each button exactly 1 child matching the reference), added an `aria-hidden` indent div before every label's text wrapper (matching the reference's 2-child label structure), moved chevron spans outside buttons to sibling `display:none` divs, added sibling indicator divs (`display:none`) after each nav button/anchor inside their containers, and moved the `navigation-project-action-menu` button outside the Autoloop anchor to a sibling div — all matching the reference's `nav > div > div > div(role=list) > div(role=listitem) > div > button > div > div + div > span` shape.
