# Noise-invariance harness

You are adding "noise" to the app (markup that mimics the reference but should not
affect the reward signal). Your job is to prove the addition is reward-neutral
before keeping it. If any sub-score shifts beyond the tolerance, revert.

Do not narrate steps the user can see. Execute silently and report only the
final verdict + numbers.

## Protocol

The operator has a wrapper command that drives the full before/after cycle
around a single noise edit:

```
npm run noise -- --section <section>
```

Supported sections are any subdirectory of `reference_app/` that contains a
`reference.html` (e.g. `board`, `list`, `calendar`, `timeline`, `pages`,
`summary`, `reports`, `approvals`, `archived-work-items`, `attachments`).
Omit the flag to pick one interactively.

1. **Snapshot.** Before invoking the wrapper, stash the current state of every
  file you intend to edit (`git stash --keep-index -u -- <paths>` or copy to
   tmp). You MUST be able to restore byte-for-byte if the verdict is REVERT.
2. **Start the harness.** Run `npm run noise -- --section <section>`. The
  wrapper will:
  - Score the app against `reference_app/<section>/reference.html` (BEFORE).
  - Print `NOISE WINDOW — apply your changes now.` and pause on stdin.
  - After you press ENTER, score again (AFTER) and print the diff table.
3. **Apply noise (during the pause).** Follow the `NOISE PROMPT` section
  below verbatim. Do not improvise additions beyond what it specifies. Do
   not touch any file not named in the noise prompt. Specifically do NOT
   edit `reference_app/`**, `scripts/`**, `public/initial-state.json`, or
   `reward-artifacts/**` — those are part of the rubric.
4. **Press ENTER** once the edit is saved. The harness writes each run's
  full JSON to `reward-artifacts/<timestamp>/result.json` if you need to
   inspect details beyond the printed summary.
5. **Verdict.** The wrapper decides based on a ±0.002 tolerance per
  sub-score (`reward`, `ssim`, `text`, `color`, `pqgram`, `a11y_pqgram`,
   `class_density`):
  - All deltas within tolerance → exit 0, prints `VERDICT: KEEP`.
  - Any delta outside tolerance → exit 2, prints
  `VERDICT: REVERT — moved beyond tolerance: <keys>`.
6. **On REVERT:** restore the snapshot from step 1, then re-run
  `npm run noise -- --section <section> --yes` (the `--yes` flag skips the
   pause) to confirm you are back at the original BEFORE within tolerance.
   Do NOT try a second variant — report and stop.
7. **Hard stops.** If the wrapper fails to exit 0 or 2 (e.g. the dev server
  never comes up, or Playwright errors), abort immediately, restore the
   snapshot, and report `ABORT: <reason>`.

## Constraints

- Do not edit `scripts/`**, `reference_app/`**, `public/initial-state.json`,
or anything under `reward-artifacts/`. Those are the rubric; changing them
invalidates the comparison.
- Do not run `npm run state:load` or restart the dev server between BEFORE
and AFTER — `npm run noise` reseeds once per score on its own and the
seeded state is deterministic.
- Allowed writes for the noise step: `index.html`, `public/**`, `src/**`.
Prefer `index.html` for head-only noise.

## Reporting format

Reproduce the harness's final table plus verdict verbatim, e.g.:

```
            BEFORE     AFTER      Δ
----------------------------------------
reward       0.xxxx    0.xxxx    ±0.xxxx
ssim         0.xxxx    0.xxxx    ±0.xxxx
text         0.xxxx    0.xxxx    ±0.xxxx
color        0.xxxx    0.xxxx    ±0.xxxx
pqgram       0.xxxx    0.xxxx    ±0.xxxx
a11y_pqgram  0.xxxx    0.xxxx    ±0.xxxx
class_density 0.xxxx   0.xxxx    ±0.xxxx

VERDICT: KEEP | REVERT: <keys> | ABORT: <reason>
```

---

## NOISE PROMPT

Add realistic Jira "page chrome" noise to `index.html` so the `<head>` looks
closer to a real Atlassian-saved page, without introducing any live network
fetches or executing any scripts.

Source of truth for the exact strings: `reference_app/html/reference.html`.
Copy tags verbatim from that file. Do NOT invent values.

Include (all go in `<head>`, in roughly the reference's order):

- All `<meta name="…">` tags the reference uses, including the `ajs-*`,
`X-B3-*`, `referrer`, `apple-itunes-app`, and `theme-color` entries.
- `<link rel="shortcut icon">`, `<link rel="mask-icon">`,
`<link rel="search">`, and all `<link rel="dns-prefetch">` entries.
- The `<style nonce="">body.deferred div[id^="aui-"]{display:none}</style>`
block.
- The `<!--UIPATH_EXTENSION_ID: …-->` comment.
- The four `<style data-theme="light|dark|spacing|typography">` design-token
blocks (full custom-property definitions).
- Every `<style data-emotion="css …">` block the reference emits in the head.
- The global CSS reset `<style>html,body,p,div,h1,…{…}</style>` block.
- The `.village-*`, `.ap-*`, `.mpAUI`, `.mediaPickerPopup`, and
`.mediaPickerDropzone` style blocks.

Strictly EXCLUDE (real side effects — would break invariance):

- `<link rel="preconnect">` and `<link rel="preload">` to external hosts.
- Any `<link rel="stylesheet" href="//…cloudfront.net/…">`.
- Any `<script src="//…cloudfront.net/…">` or `<script src="chrome-extension://…">`.
- Any tag that performs a network fetch at load time to a third-party host.

Place the full `<script type="module" src="/src/main.tsx">` at the bottom of
`<body>`, after `<div id="root">` and `<div class="atlaskit-portal-container">`
— do not move it into `<head>`.

Do not modify `src/**`, `public/**`, or any other file. All edits confined to
`index.html`.