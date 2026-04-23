# Testing Startup

When testing this app, load the initial board state before starting the dev server or interacting with the UI.

Run `npm run state:load` to load the default fixture from `fixtures/initial-state.json`.

Run `npm run state:load -- ./path/to/fixture.json` to load a different test fixture into `public/initial-state.json`.

Do not edit `public/initial-state.json` by hand for tests. Use the CLI loader instead.

# Noise-invariance harness (`npm run noise`)

`npm run noise` is a wrapper around `npm run reward` that proves a proposed
"noise" edit (markup added to mimic the real reference page) is reward-neutral
before you keep it.

## Usage

```
npm run noise -- --section <name>   # score a specific section
npm run noise                        # interactive section picker
npm run noise -- --section board --yes   # skip the pause (used to re-verify after a revert)
```

`<name>` is any subdirectory of `reference_app/` that contains `reference.html`:
`approvals`, `archived-work-items`, `attachments`, `board`, `calendar`, `html`,
`list`, `pages`, `reports`, `summary`, `timeline`.

## Flow

1. Scores the app against `reference_app/<section>/reference.html` → BEFORE.
2. Prints `NOISE WINDOW — apply your changes now.` and blocks on stdin.
3. After ENTER, scores again against the same reference → AFTER.
4. Prints a BEFORE / AFTER / Δ table across every sub-score (`reward`, `ssim`,
  `text`, `color`, `pqgram`, `a11y_pqgram`, `class_density`).
5. Exits `0` with `VERDICT: KEEP` iff every sub-score stayed within `±0.002`;
  otherwise exits `2` with `VERDICT: REVERT — moved beyond tolerance: <keys>`.

Both score runs write full JSON to `reward-artifacts/<timestamp>/result.json`.

## What counts as noise

Noise is markup the reference emits but that the scorer's structural and
content metrics ignore — primarily head-level `<meta>`, `<link>` (non-loading),
`<style>` token blocks, and similar chrome. Anything that fetches over the
network, executes JS, or changes rendered layout/color on the main surface is
NOT noise and will fail the invariance check.

The canonical noise edit is described in `prompts/noise-invariance.md`. That
file also contains the agent-facing protocol for driving this harness
end-to-end (snapshot → run wrapper → apply noise → press ENTER → keep or
revert on verdict).

## Rubric files — do not edit between BEFORE and AFTER

`scripts/**`, `reference_app/**`, `public/initial-state.json`, and
`reward-artifacts/**` are part of the rubric. Touching them between the two
scores invalidates the comparison.