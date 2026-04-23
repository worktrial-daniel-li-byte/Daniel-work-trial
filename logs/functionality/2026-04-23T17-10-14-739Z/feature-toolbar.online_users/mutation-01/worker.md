# Feature toolbar.online_users — mutation attempt 01
## Task to saboteur
Remove or disable the single feature described below so the spec at
tests/board/toolbar.online_users.spec.mjs will FAIL. The harness will revert your edits after
it re-runs the spec — make the sabotage surgical but real.

FEATURE CHECK:
```json
{
  "id": "toolbar.online_users",
  "feature": "Online-users avatar (checkbox) appears next to search",
  "how_to_verify": "Snapshot: role=checkbox name='{User name} is online' with accountId value",
  "status": "pass"
}
```

BROWSER EVIDENCE (what the spec is expected to observe):
```json
{
  "id": "toolbar.online_users",
  "status": "PASS",
  "navigate_url": "https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status",
  "observations": [
    "role=checkbox with accessible name 'Daniel Li is online' is visible on the board toolbar",
    "The checkbox is an <input type=\"checkbox\" name=\"assignee\"> with aria-label=\"Daniel Li is online\" and value=\"712020:628f86ff-8aef-4c36-85d6-223e8e929463\" (Atlassian accountId)",
    "The checkbox is wrapped in a role=group with aria-label 'Filter by assignee' (group element also exposes aria-label 'Daniel Li is online' around the avatar)",
    "Bounding rects confirm the checkbox (x=529, y=186) sits to the right of the 'Search board' textbox (x=356, y=186) on the same row",
    "Adjacent textbox role accessible name 'Search board' is present (ref=e381)",
    "Avatar generic text 'D' is rendered next to the checkbox indicating user initial",
    "page.url() === https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board?filter=&groupBy=status"
  ],
  "playwright_hints": {
    "locators": [
      {
        "purpose": "Online-users assignee avatar checkbox for Daniel Li",
        "preferred": "getByRole('checkbox', { name: 'Daniel Li is online' })",
        "fallback": "locator('input[type=\"checkbox\"][name=\"assignee\"][aria-label=\"Daniel Li is online\"]')"
      },
      {
        "purpose": "Enclosing 'Filter by assignee' group around the online-user avatars",
        "preferred": "getByRole('group', { name: 'Filter by assignee' })",
        "fallback": "locator('[role=\"group\"][aria-label=\"Filter by assignee\"]')"
      },
      {
        "purpose": "Adjacent board search textbox (used to assert the avatar sits next to search)",
        "preferred": "getByRole('textbox', { name: 'Search board' })",
        "fallback": "locator('input[placeholder=\"Search board\"]')"
      }
    ],
    "url_assertions": [
      "/jira/core/projects/AUT/board",
      "groupBy=status"
    ],
    "interactions": null,
    "mutation_and_revert": null
  },
  "notes": "Checkbox accountId is exposed as the input's value attribute (712020:628f86ff-8aef-4c36-85d6-223e8e929463). The outer <span role=\"group\"> also carries aria-label 'Daniel Li is online', so strict role=checkbox lookup is the cleanest selector. Only one online user (the signed-in account 'Daniel Li' / worktrial-daniel-li@fleet.so) was rendered this session.",
  "turns": 5,
  "stopped_for_budget": false
}
```

Spec file (read-only — do NOT edit it): tests/board/toolbar.online_users.spec.mjs

Keep the app compiling. Break only this one feature.
## Saboteur summary
The test fixture navigates directly to the live Atlassian URL (`https://fleet-team-y0ak1u2s.atlassian.net/jira/core/projects/AUT/board`) using a persistent Chromium profile that holds the real Jira session. The "Daniel Li is online" checkbox, the "Filter by assignee" group, and the "Search board" textbox are all rendered by the **real Jira SaaS frontend** — not by any code in `src/` or `public/`.

There is no mechanism in the local codebase (no service worker, no proxy, no DNS override) that intercepts or replaces that URL with local content. The local app is a standalone React simulation that serves at `localhost:5173` and is completely bypassed by this test.

**No edits made.** The feature is not load-bearing in `src/` or `public/` — it lives entirely behind the external Atlassian URL that this clone never serves.
- saboteur_skipped: true
- after-sabotage runner: exit=0 passed=true
- after-revert runner:   exit=0 passed=true
- load_bearing:          true
- failure_reason:        saboteur declined to edit (feature may not live in src/); mutation contract not verified