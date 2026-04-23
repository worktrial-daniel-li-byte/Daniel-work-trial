# Feature toolbar.online_users — attempt 01

## Task to worker

Write a new @playwright/test spec at tests/board/toolbar.online_users.spec.mjs that verifies the
feature check below.

FEATURE CHECK (verbatim from mcp/summary/tabs/*.json):
```json
{
  "id": "toolbar.online_users",
  "feature": "Online-users avatar (checkbox) appears next to search",
  "how_to_verify": "Snapshot: role=checkbox name='{User name} is online' with accountId value",
  "status": "pass"
}
```

BROWSER-AGENT EVIDENCE (verbatim):
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

Requirements:
  - File to write: tests/board/toolbar.online_users.spec.mjs
  - At least 2 expect() assertions.
  - Import { test, expect, JIRA_BASE } from '../_fixtures/jira.mjs'
  - Use the navigate_url from evidence (strip the scheme+host if it
    matches JIRA_BASE and concatenate, otherwise use the full URL).
  - For mutating features, mutate → assert post-state → revert → assert original state.

## Worker summary

The file `tests/board/toolbar.online_users.spec.mjs` has been written with four `expect()` assertions: (1) the `role=checkbox` named `"Daniel Li is online"` is visible, (2) it carries the exact Atlassian accountId as its `value` attribute, (3) the enclosing `role=group` named `"Filter by assignee"` is visible, and (4) the adjacent `"Search board"` textbox is present on the same toolbar row — all derived directly from the browser-agent evidence.

## Runner

- exit code: 0
- assertions counted: 4
- passed: true
