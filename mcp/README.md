# MCP harness

This folder contains two agent harnesses that talk to MCP servers:

- `npm run browser-test` — a Jira-facing QA agent that drives a real browser
through a Playwright MCP and scores feature checks.
- `npm run mcp:loop` — the verify→write loop. A verifier agent scores the
local app against a reference screenshot, dispatches edits to a worker
agent, and iterates.

Both are Node scripts that use Anthropic's API plus `@modelcontextprotocol/sdk`.

## One-time setup

```bash
npm install
npm run mcp:setup
```

`mcp:setup` installs deps (if needed) and pulls the Playwright Chromium build
that `browser-test` drives.

Create a `.env` at the repo root with:

```bash
ANTHROPIC_API_KEY=sk-ant-...
# Optional overrides
# ANTHROPIC_MODEL=claude-opus-4-7
# CLAUDE_MODEL=claude-opus-4-7
```

---

## `npm run browser-test`

Runs a Claude-backed QA agent against a Jira tab fixture. The agent uses only
`browser_*` tools exposed by `@playwright/mcp` and emits a single JSON result
per feature check. A scorecard is written to `tests/reports/`.

### Picking a tab

Exactly one tab fixture must be selected. Both npm-flag and explicit-arg
forms work:

```bash
npm run browser-test --board
npm run browser-test -- --board
npm run browser-test -- --tab=list
```

Available tabs: `board`, `list`, `summary`, `calendar`, `timeline`.
Each maps to a fixture under `mcp/summary/tabs/<tab>.json` and a Jira URL.

### Other flags

```bash
npm run browser-test -- --board --only=feat.board.create-issue,feat.board.drag
npm run browser-test -- --board --skip-presence-only
npm run browser-test -- --json=./some/other.json --url=https://...
```

- `--only=id1,id2` — run just these `feature_checks` ids.
- `--skip-presence-only` — drop checks whose fixture `status` is
`pass_presence_only`.
- `--json` / `--url` — bypass the tab map entirely.

### Environment


| Var                        | Default           | Notes                                      |
| -------------------------- | ----------------- | ------------------------------------------ |
| `ANTHROPIC_API_KEY`        | —                 | Required. `ANTH_API_KEY` is also accepted. |
| `ANTHROPIC_MODEL`          | `claude-opus-4-7` | Model used to drive the browser.           |
| `APP_URL`                  | tab default       | Fallback URL if no `--url` / tab is given. |
| `HEADLESS`                 | unset (headed)    | Set to `1` for headless Chromium.          |
| `BOARD_MAX_TURNS_PER_CASE` | `30`              | Tool-use turns per feature check.          |


### Auth

The browser uses a persistent Chromium profile at
`tests/.pw-profile-jira/`. On the first run, sign into Atlassian once; every
later run reuses that session. Do **not** delete the profile between runs
unless you want to re-auth.

If a case lands on a login screen, the agent marks it `BLOCKED` and stops
rather than thrashing.

### Output

- Progress prints per case: `[<id>] <tool>` lines, then `-> PASS|PARTIAL|FAIL|BLOCKED`.
- Final scorecard prints to stdout.
- Full JSON report: `tests/reports/board-report-<timestamp>.json`.

---

## `npm run mcp:loop`

Runs the two-agent verify→write loop against a running copy of the app.

1. The **verifier** calls `score_app`, compares the app screenshot to the
  reference, and dispatches a focused change request.
2. The **worker** receives the dispatch, edits files via MCP tools
  (`read_file`, `write_file`, `replace_in_file`, `list_dir`), and reports
   back.
3. The orchestrator re-scores. If reward improved, worker context is reset
  for the next dispatch; otherwise it is preserved so the worker can retry
   with full memory.

The MCP server backing both agents is `mcp/server/index.mjs`; it is launched
automatically over stdio by the loop.

### Usage

First start the app in another terminal:

```bash
npm run dev
```

Then run the loop:

```bash
npm run mcp:loop
npm run mcp:loop -- http://localhost:5173
npm run mcp:loop -- http://localhost:5173 "Focus on the sidebar spacing."
npm run mcp:loop -- http://localhost:5173 --focus=pqgram
```

Positional args:

1. `appUrl` — defaults to `http://localhost:5173`.
2. `extraGuidance` — free-text instruction injected into the verifier's
  kickoff message.

Flags:

- `--focus=<sub>` — prioritize one sub-score this run. One of
`pqgram`, `ssim`, `text`, `color`. Stacks on top of `extraGuidance`.
- `--help` / `-h`.

### Environment

Defined in `mcp/loop/config.mjs`:


| Var                                  | Default           | Purpose                                                                                                 |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` / `ANTH_API_KEY` | —                 | Required.                                                                                               |
| `CLAUDE_MODEL`                       | `claude-opus-4-7` | Model for both agents.                                                                                  |
| `MAX_DISPATCHES`                     | `30`              | Hard cap on verifier → worker dispatches.                                                               |
| `MAX_WORKER_TURNS`                   | `40`              | Tool-use turns per worker dispatch.                                                                     |
| `TARGET_REWARD`                      | `0.85`            | Stop once reward meets or exceeds this.                                                                 |
| `IMPROVEMENT_DELTA`                  | `0.005`           | Minimum reward gain counted as progress.                                                                |
| `MAX_TOKENS`                         | `32768`           | Anthropic `max_tokens` per turn. Large enough to hold a full-file rewrite tool call without truncation. |


### Writable paths

The MCP server whitelists writes to: `src/`, `public/`, `reward-artifacts/`,
`prompts/`. Anything outside that tree is rejected. Reads are denied for
`.env`, `.git/`, and `node_modules/`.

### Output

- Live progress prints to stdout: discovered tools, per-dispatch rewards,
summary block.
- Full run log: `mcp/logs/<run-id>/` (JSON trace, system prompts, screenshots
pulled in via `score_app`). The path prints at startup and again at the end.

### Related one-shots

- `npm run mcp:server` — run the MCP server alone over stdio (useful to
attach from Cursor or a debugger using `mcp/mcp.json.example`).
- `npm run mcp:agent` — one-shot Claude scoring agent (no worker, no loop).

---

## The reward signal

Every time the verifier calls `score_app` (or you run `npm run reward`
directly), the harness compares **your running app** to a saved snapshot of
the **real Jira page** and produces a single number. That number is the
reward the loop is trying to maximize.

### What actually happens

1. A headless Chromium opens two pages side by side:
  - **Reference**: `reference_app/html/reference.html`, a saved copy of a
   real Jira board. Loaded with JavaScript disabled (the static HTML is the
   ground truth) and with the cookie banner CSS'd out of the way.
  - **Candidate**: your app at `appUrl` (default `http://localhost:5173`).
  If nothing is listening there, the harness runs `npm run dev` for you.
2. Both pages render at **1920×1080**. The harness takes a screenshot, walks
  the DOM, pulls the Chrome accessibility tree via CDP, and collects: visible
   text, visible colors, the DOM tree structure, the a11y role tree, and a
   histogram of class-tokens-per-element.
3. Six similarity scores are computed, each in `[0, 1]` (1 = identical).
4. Those six are mixed into one number in `[-1, 1]`. Higher is better.

### The six sub-scores


| Sub-score       | Range | What it measures                                                                                                                                                                                                                                                    | How to move it                                                                                                                                       |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ssim`          | 0–1   | **Visual similarity** of the two screenshots, downsized to 256×256. Rewards things being in the right place at roughly the right size and color.                                                                                                                    | Fix layout, sizing, and dominant colors. Fine typography and borders barely move it.                                                                 |
| `text`          | 0–1   | **Text similarity.** A difflib-style sequence match over the visible text of each page (case-insensitive).                                                                                                                                                          | Make sure the same labels, headers, issue titles, menu items, etc. actually render.                                                                  |
| `color`         | 0–1   | **Color palette overlap.** Quantizes every visible background/foreground color into 32-step RGB buckets and measures histogram intersection.                                                                                                                        | Get the brand colors, backgrounds, and accents into the DOM. Exact shades don't have to match — they just have to land in the same bucket.           |
| `pqgram`        | 0–1   | **DOM tree similarity** using pq-grams (p=2, q=3). Compares small (ancestor, sibling) label tuples where each label is `tag` or `tag#data-testid`. Computed both whole-page and inside ~9 named regions (`app-shell`, `top-nav`, `left-nav`, `board-canvas`, etc.). | Emit the same `data-testid` anchors the reference uses, inside the same kind of tag, nested at roughly the same depth. Class names do **not** count. |
| `a11y_pqgram`   | 0–1   | **Accessibility-tree similarity** using the same pq-gram Dice metric on role labels (`role` / `heading#level`). Pulled from Chrome's computed a11y tree; `generic`/`none` nodes are pruned so div-soup contributes zero mass.                                       | Use semantic tags (`<nav>`, `<main>`, `<button>`, `<fieldset>`, `<h1..h6>`) and proper `role="…"` values. Wrapper `<div>`s don't help.               |
| `class_density` | 0–1   | **Class-token density.** Counts class tokens per classed element and compares `p90` to the reference. Atlaskit's Compiled CSS emits ~30–50 atomic classes per button/input; hand-written BEM sits at 2–3. Shape of the tokens (hashed vs. readable) is ignored.     | Adopt an atomic / utility CSS system (Compiled, Tailwind, Vanilla Extract atomic). More utility classes per element → higher score.                  |


### How they combine

```text
content     = max(text, color)
contentGate = 0.2 + 0.8 * content     # in [0.2, 1.0]
gatedSSIM   = ssim * contentGate

raw    = 0.50 * gatedSSIM
       + 0.20 * text
       + 0.10 * color
       + 0.05 * pqgram.combined       # 0.5*whole + 0.5*mean(present regions)
       + 0.10 * a11y_pqgram
       + 0.05 * class_density

reward = 2 * raw - 1                  # rescale [0,1] → [-1, 1]
```

The **content gate** is the important trick: if the page has no real content
(blank text and colors), visual similarity gets multiplied down to 20% of its
value. A mostly-empty page that happens to share background color with Jira
cannot score well — it has to show real stuff.

Roughly:

- `reward ≈ -1` → nothing matches.
- `reward ≈ 0`  → halfway there.
- `reward ≥ 0.85` → the loop's default stop target (`TARGET_REWARD`).
- `reward = 1` → pixel- and DOM-identical to the reference (never actually
reached in practice).

### Where to look when debugging a score

Each run of `score_app` / `npm run reward` writes everything to
`reward-artifacts/<timestamp>/`:

- `board.png` — screenshot of the reference page.
- `app.png` — screenshot of your app.
- `result.json` — the reward, every sub-score, per-region pq-gram values,
and the `class_density` p90 / median for both sides.
- `ref.a11y.json` / `gen.a11y.json` — the pruned accessibility trees fed
into `a11y_pqgram`. Useful for spotting whole missing landmarks
(`main`, `navigation`, `search`, etc.) on the candidate side.

A region that shows `0.0000` under `details.pqgram.regions` means the
reference has a `data-testid` anchor your DOM is missing entirely — fix
those first, they're the biggest wins.

`class_density.score` near zero while `pqgram` is healthy means the DOM
structure is right but the app is still styled with hand-written CSS —
it can only go up by adopting an atomic/utility CSS pipeline. Conversely,
a high `class_density` with a low `pqgram` means lots of utility classes
on the wrong shape of tree.

### Running it by hand

```bash
npm run reward                              # scores http://localhost:5173
npm run reward -- --app-url http://localhost:4173
npm run reward -- --no-autostart            # expect dev server already up
```

