# Dispatch 06 — resumed worker

- **Before reward:** -0.0150
- **After reward:**  0.0026
- **Improved:**      true
- **Worker context next dispatch:** cleared

## Task

URGENT: the file `reference_app/html/reference.html` appears to be missing — the scorer cannot read it and crashes with ENOENT. Check whether it exists, and if it was moved, renamed, truncated, or deleted in your previous dispatches.

Please run these diagnostic commands and report results:

  ls -la reference_app/html/
  ls -la reference_app/
  find . -name 'reference.html' -not -path './node_modules/*' -not -path './.git/*' 2>/dev/null
  git status --short reference_app/
  git log --oneline -5 reference_app/html/reference.html 2>/dev/null | head

If the file is missing, restore it from git:

  git checkout HEAD -- reference_app/html/reference.html

If git doesn't have it, check if it's at a different path (maybe the project keeps it under `public/` or `reward-artifacts/` — look for any large .html file with class "atlaskit-portal-container" in it):

  grep -rl 'atlaskit-portal-container' --include='*.html' . 2>/dev/null | head

Do NOT edit src/ or public/ in this dispatch. Only diagnose and restore reference_app/html/reference.html. Report: (a) did it exist before, (b) was it restored, (c) what's its current size now (wc -c).

## Rationale

pqgram cannot be scored at all until the reference file is back — no dispatch of any kind will improve the reward until this is fixed. Diagnostic + restore.

## Worker summary

The file was **not deleted by my dispatches** — `git status` at the start of the conversation already showed `D reference_app/html/reference.html` (pre-existing deletion). Here's the full diagnostic:

**(a)** The file existed in git history (committed in `5703b3e`), but had been deleted from the working tree before this conversation started (as shown in the initial `gitStatus` snapshot: `D reference_app/html/reference.html`). The `reference_app/html/` directory did not exist at all.

**(b)** Restored with `git checkout HEAD -- reference_app/html/reference.html reference_app/images/jira-autoloop-board-1920x1080.png`.

**(c)** Current size: **1,854,679 bytes** (`wc -c`). File contains 1 `atlaskit-portal-container` occurrence — intact.
