# Seed Jira harness

Plan + spawn harness that reads `[seed/initial-state.json](./seed/initial-state.json)` and drives a Claude + Playwright-MCP browser agent to create the content inside your real Atlassian Jira instance.

Pairs with the [capture harness](./scripts/capture/) (read direction): capture scrapes a live Jira tab into `reference_app/<tab>/`; seed-jira writes seed content back into a live Jira tab.

---

## Shape

Mirrors `mcp/loop/` and `scripts/capture/`:

```
scripts/seed-jira/
  index.mjs      Orchestrator — parses args, launches Playwright MCP, iterates tasks
  plan.mjs       Planner    — cuts seed JSON into per-tab tasks (board / pages / forms / approvals / attachments)
  agent.mjs      Sub-agent  — Claude turn loop per task, using browser_* tools
  prompts.mjs    System + user prompts with idempotency + safety rules
```


| Stage            | Responsibility                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planner**      | Reads `seed/initial-state.json`. For each supported tab, emits one task with a `goal` string and an `items` array an agent can iterate.                                                                             |
| **Orchestrator** | Starts one Playwright MCP subprocess reusing `tests/.pw-profile-jira` (already signed into Atlassian). Dispatches tasks to sub-agents in sequence. Writes a timestamped report to `tests/reports/seed-jira-*.json`. |
| **Sub-agent**    | Claude session with `browser_`* tools. Follows the rules in `prompts.mjs`: idempotent, no destructive actions, emit a final JSON report (`created` / `skipped` / `failed`).                                         |


---

## Usage

```bash
npm run seed-jira                              # dry-run: print the plan, don't touch Jira
npm run seed-jira -- --execute --headed        # drive board + pages, show the browser
npm run seed-jira -- --execute --only=board    # just one task
npm run seed-jira -- --execute --only=pages,approvals
npm run seed-jira -- --seed=path/to.json --space=DEMO --base=https://your-org.atlassian.net
```

### Flags


| Flag                  | Description                                         | Default                                     |
| --------------------- | --------------------------------------------------- | ------------------------------------------- |
| `--execute` / `--run` | Actually launch the agent and mutate Jira.          | off (dry-run)                               |
| `--dry-run`           | Print the plan and exit.                            | on                                          |
| `--only=a,b,c`        | Which task ids to include. See "Known tasks" below. | `board,pages`                               |
| `--seed=<path>`       | Seed JSON path.                                     | `seed/initial-state.json`                   |
| `--space=<key>`       | Jira project key.                                   | `AUT`                                       |
| `--base=<url>`        | Jira host.                                          | `https://fleet-team-y0ak1u2s.atlassian.net` |
| `--headed`            | Show the Chromium window.                           | headless                                    |
| `--max-turns=<n>`     | Per-task tool-turn budget for the agent.            | 60 (override with `SEED_MAX_TURNS`)         |


### Environment

- `ANTHROPIC_API_KEY` or `ANTH_API_KEY` (required when `--execute`)
- `ANTHROPIC_MODEL` (default: `claude-opus-4-7`)
- `SEED_MAX_TURNS` (optional)

Auth for the browser side is reused from `tests/.pw-profile-jira`. Run `npm run browser-login` once to populate it; every later run is passwordless.

---

## Known tasks


| id            | Jira tab    | What the agent does                                                                                                                            |
| ------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `board`       | Board       | Create each card in the seed's `columns[].cards`, filling summary / description / priority / assignee / labels / due date.                     |
| `pages`       | Pages       | Create one page per `seed.pages` entry (title, emoji, snippet as body) and publish.                                                            |
| `forms`       | Forms       | Create each form in `seed.forms` with its fields as single-line text inputs. *(Redirects to `/not-found` on plans without the Forms feature.)* |
| `approvals`   | Approvals   | Open each referenced work item and raise an approval request.                                                                                  |
| `attachments` | Attachments | Open each referenced work item and leave a comment describing the attachment. (True file uploads can't be triggered from the MCP.)             |


---

## Safety model

- **Default is dry-run.** Nothing mutates until `--execute` is passed.
- Sub-agents are told to be idempotent: check for an existing item with the same key / title / name before creating a new one.
- Hard rules in the prompt: no sign-out, no storage reset, no deleting existing work items, no navigating to billing.
- The orchestrator writes a full JSON report after every run to `tests/reports/seed-jira-*.json` (args, start/end, per-task `created / skipped / failed` lists).

---

## Known limitations (from first live run)

Captured from `tests/reports/seed-jira-2026-04-23T00-54-36-695Z.json`:

1. **Jira's issue modal is turn-hungry.** One card's worth of field edits (priority + labels + due date) burned all 60 turns. Bulk-creating 11 cards in one agent session doesn't fit.
2. **Idempotency can latch onto an existing row.** Seed keys `AUT-1..AUT-N` collide with real keys Jira assigns. On the first run the agent correctly found `AUT-1` already existed, updated it, and treated that as done.
3. **Seed assignee ids aren't Atlassian users.** `fleet`, `alex`, `priya`, etc. map to our in-app `USER_BY_ID` table, not to Atlassian accounts — the agent skips the field rather than guessing a real user.
4. `**browser_evaluate` / `browser_run_code` heavy traffic** = aria refs didn't map cleanly to some Jira inputs and the agent fell back to executing JS directly. Increases cost without guaranteeing progress.

### Tuning options when things don't finish

- **Restructure the planner** so each card is its own task (11 agent sessions, ~15 turns each) instead of one task of 11 items. Losses on one item don't starve the rest.
- **Trim the seed** to `title + description + status_column` and fill priority / labels / dates as a second pass.
- **Swap Board for REST** — `POST /rest/api/3/issue` creates all 11 cards in seconds; keep the agent pattern for tabs where the UI is the only option (Pages, Forms, Approvals).

---

## Related files

- `seed/initial-state.json` — canonical source of content: columns, notifications, approvals, forms, pages, attachments, reports.
- `scripts/capture/` — the read-direction counterpart; scrapes live Jira tabs into `reference_app/<tab>/`.
- `tests/browser-test.js` — QA-verify agent this harness is modelled on.
- `tests/.pw-profile-jira/` — persistent Chromium profile shared by capture, browser-test, and seed-jira.
- `tests/reports/seed-jira-*.json` — timestamped run reports.

