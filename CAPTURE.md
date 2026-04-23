# Capture harness

Plan + spawn harness that scrapes a live Atlassian Jira space into `reference_app/<tab>/` — one folder per tab, each with a cleaned post-hydration DOM, viewport + full-page screenshots, and a `meta.json` describing what landed.

Pairs with the [seed-jira harness](./SEED_JIRA.md) (write direction): capture reads from Jira; seed-jira writes back to Jira.

---

## Shape

Mirrors `mcp/loop/` and `scripts/seed-jira/`:

```
scripts/capture/
  index.mjs      Orchestrator — parses args, launches one persistent Chromium context, iterates sections
  manifest.mjs   Section catalogue — maps tab id → Jira URL, flags optional / required tabs
  worker.mjs     Sub-worker  — navigates, settles, captures DOM + PNG + meta.json for one section
```


| Stage                                             | Responsibility                                                                                                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planner** (`buildPlan` in `index.mjs`)          | Reads the manifest, applies `--only` / `--space` / `--base` filters, produces an ordered task list.                                                                                                                              |
| **Orchestrator** (`main` in `index.mjs`)          | Launches one persistent Chromium reusing `tests/.pw-profile-jira`, dispatches each task to a worker, summarises.                                                                                                                 |
| **Sub-worker** (`captureSection` in `worker.mjs`) | Gets a fresh page, navigates, waits for `domcontentloaded → networkidle → main selector → settle delay`, optionally runs a `preAction`, then dumps artefacts to disk. Never throws — failures surface as `{ ok: false, error }`. |


Unlike seed-jira, workers here are **code-driven** (no LLM). Capture is deterministic — navigate, wait, dump — so a for-loop + Playwright is the right tool.

---

## Usage

```bash
npm run capture                             # all 12 Autoloop sections
npm run capture -- board summary            # just those (positional args work too)
npm run capture -- --only=list,calendar
npm run capture -- --space=DEMO --headed    # different project, visible browser
npm run capture -- --base=https://your-org.atlassian.net --space=XYZ
npm run capture -- --out=./snapshots/2026-04-22
```

### Flags


| Flag            | Description                                            | Default                                     |
| --------------- | ------------------------------------------------------ | ------------------------------------------- |
| `--only=a,b,c`  | Which section ids to include. Same as positional args. | all sections                                |
| `--space=<key>` | Jira project key.                                      | `AUT`                                       |
| `--base=<url>`  | Jira host.                                             | `https://fleet-team-y0ak1u2s.atlassian.net` |
| `--out=<dir>`   | Output root.                                           | `reference_app/`                            |
| `--headed`      | Show the Chromium window (useful when auth is stale).  | headless                                    |


Auth is reused from `tests/.pw-profile-jira`. Run `npm run browser-login` once to populate it; every later run is passwordless.

---

## Output layout

For each captured section:

```
reference_app/
  <section-id>/
    reference.html      Post-hydration DOM of the tab (with cookie/consent banners hidden via injected CSS).
    reference.png       Viewport screenshot, 1920x1080 — matches what the reward harness compares against.
    reference.full.png  Full-page screenshot (content height) — useful for eyeballing.
    meta.json           { requested_url, final_url, http_status, doc_title, viewport, captured_at, duration_ms, drift }
```

`meta.json` is the source of truth for "did we actually capture the tab we asked for". `drift` is set when Jira redirected the requested path to something else (e.g. Forms → `/not-found`, Shortcuts → `/board`). Drifted captures don't count as `ok` in the final scorecard.

---

## Known sections

Defaults from `[manifest.mjs](./scripts/capture/manifest.mjs)` for `--space=AUT`:


| id                    | Required? | Notes                                             |
| --------------------- | --------- | ------------------------------------------------- |
| `summary`             | required  |                                                   |
| `board`               | required  | Request includes `?filter=&groupBy=status`.       |
| `list`                | required  |                                                   |
| `calendar`            | required  |                                                   |
| `timeline`            | required  |                                                   |
| `approvals`           | optional  |                                                   |
| `forms`               | optional  | Redirects to `/not-found` on plans without Forms. |
| `pages`               | optional  |                                                   |
| `attachments`         | optional  |                                                   |
| `reports`             | optional  |                                                   |
| `archived-work-items` | optional  |                                                   |
| `shortcuts`           | optional  | Aliases to `/board` on this plan.                 |


Optional sections that fail / drift don't make the whole run fail; required ones do.

---

## Drift detection

After navigation, the worker compares the requested path against the final URL (`worker.mjs`, `detectRedirectDrift`):

- Final path contains `/not-found` → `redirected_to_not_found`
- Final path doesn't include the requested tab slug → `redirected_off_tab`

This stopped the first run from silently leaving a duplicate board in `reference_app/shortcuts/` and a Jira 404 in `reference_app/forms/`.

---

## How it plays with the rest of the app

- `scripts/reward-check.mjs` compares the candidate app against a reference HTML file. The per-section folders under `reference_app/` exist so the harness can pick the right reference based on the candidate's URL path (e.g. `/board` → `reference_app/board/reference.html`). Wiring that lookup is the natural follow-up whenever the app gets URL-based routing.
- `scripts/seed-jira/` consumes the same `tests/.pw-profile-jira` profile and writes content back into the tabs that this harness reads.

---

## Usage recipes

**Recapture just the tab you're iterating on**

```bash
npm run capture -- --only=board
```

**Snapshot a different space for comparison**

```bash
npm run capture -- --space=DEMO --out=./snapshots/demo
```

**Debug an auth / settle issue**

```bash
npm run capture -- --headed --only=summary
```

**Check what changed since last capture**

```bash
git diff reference_app/board/reference.html
```

---

## Related files

- `scripts/capture/` — the harness itself.
- `reference_app/<section>/` — captured artefacts per section.
- `seed/initial-state.json` — write-direction content (see `SEED_JIRA.md`).
- `tests/.pw-profile-jira/` — persistent Chromium profile (shared with `browser-test`, `seed-jira`, `browser-login`).
- `scripts/reward-check.mjs` — consumer of `reference.html`.

