Problem:

"Synthetic clones often have simpler DOM structures than original apps, even when visually identical."

High-level goals

Align DOM: Match Fira's DOM to real Jira on fixed UI surfaces.
Visual Similarity: Preserve or enhance visual fidelity between clone and reference.
Verify Behavior: Ensure interactive behaviors survive alignment without regressions.
Full Autonomy: Create a process drivable by coding agents without human intervention.


Proposed Solution:

Stage 1: Clone the Frontend
Visual Similarity: Preserve or enhance visual fidelity between clone and reference.

Stage 2: Clone Functionality
Verify Behavior: Ensure interactive behaviors survive alignment without regressions.

Stage 3: Hydrate Complexity
Align DOM: Match Fira's DOM to real Jira on fixed UI surfaces.


Stage 1: Clone the Frontend

In order to have a 1:1 copy, we first need the AI to be as similar to ground truth on the frontend.

Before anything, we take two things:
1. A raw DOM snapshot of the website
2. A raw image of the website 

Here's how the process works:
1. Compare your local app to the ground truth and look for any visual differences.
2. When you spot a difference, open your local app, take a screenshot, and provide both the local screenshot and the ground truth image to the AI, along with specific instructions.
3. Visually confirm that a change was made

Agentic Reward Function Loop:
To automate this process, we use VLMs in a Verify -> Code loop with optimized reward signals to signal progress to the LLM.
[mcp/comparison.png](mcp/comparison.png)

Reward function module:

We use a subprocess instance of Claude Code using claude -p that can spawn subagents, a local instance build, the raw DOM, and raw image
https://platform.claude.com/docs/en/managed-agents/overview

On instantation:

VERIFY:
We use [scripts/reward-check.mjs](scripts/reward-check.mjs) to get the current state of the local app.
We then use the ground truth image, open a Playwright browser, and take a snapshot of the current local app.
The verify agent will then based on the image, launch a code subagent with a prompt.

CODE:
Given the instruction, the code agent implements the change instructed by the verify agent.
On completion, the verify agent reviews the code and either
1. Resumes the current change with more granular instructions
2. Continues onward to another function

Verify -> Code -> Verify -> Code ... 

Reward Functions:
We define three reward functions for visual fidelity

1. Does the layout of the page look similar to ground truth?
To create a reward signal, the naive solution is to compare pixels. However, comparing pixels with an algorithim such as Mean Squared Error rewards:
Can I generate an exact image of my UI, pixel-to-pixel rather than a fundamental understanding of design and code. Small shifts in the UI such as a frontend component being 2 pixels to the left can tank the score.

Instead, we deploy SSIM. SSIM asks: do the right *structures* show up in roughly the right places? 

Rather than comparing pixels one-by-one, it slides a small window (11x11) across both images and, at each position, compares the two patches on three perceptually meaningful axes. 
1. Luminance (are they equally bright?)
2. Contrast (do they have equally strong variation?)
3. Structure (do the pixels vary together in the same pattern?).

And takes an average of those scores.

The window looks like something similar to an 11x11 grid.

. . ██ ██ ██ ██ . . .
. ██ . . . . . ██ . .
. ██ . . . . . . . .
. . ██ ██ ██ . . . .   ← the letter S
. . . . . . ██ ██ . .
. ██ . . . . . ██ . .
. . ██ ██ ██ ██ . . .

Instead of matching exact positions, it asks. Does pixel at (3,n) have the same color/luminance pixel at (3,(n + 1))?
This captures structure even with small shifts. 


2. Is the text a 1:1 match to ground truth?

We extract `body.innerText` from both the local app and ground truth and score them with **Gestalt pattern matching** (a port of Python's `difflib.SequenceMatcher.ratio`):

1. Find the longest contiguous matching substring between the two texts.
2. Recurse into the unmatched regions on either side of that match and repeat.
3. Sum the lengths of all matched blocks (`M`).
4. Score = `2*M / (len(ref) + len(gen))` — a value in `[0, 1]`.

This asks: does the same runs of text appear at roughly the same density? Gestalt has no understanding of where text is placed. This is surfaced through SSIM.


3. Is the color scheme a 1:1 match to ground truth?

We score a **color histogram** of the page — which colors appear, and in what proportions — ignoring *where* on the page they land (SSIM already owns spatial placement).

Process:

1. Walk every visible element (`width ≥ 5px`, `height ≥ 5px`) in both ref and gen.
2. Pull `background-color` and `color` from computed styles.
3. Quantize each RGB to a 32-step bucket — `(126, 87, 200)` and `(125, 89, 201)` both collapse to `"96,64,192"`. This absorbs anti-aliasing and imperceptible hue drift.
4. Build a histogram of bucket → count for each page.
5. Score = `Σ min(ref[k], gen[k]) / max(total_ref, total_gen)` — a histogram-intersection ratio in `[0, 1]`.

The `min(...)` rewards overlap: if ref has 400 lavender elements and gen has 380, that bucket contributes 380. The `max(total)` denominator punishes both under- and over-painting — flooding the page with extra purple divs to pad the score also inflates the denominator, so gaming it is rate-limited.

This asks: *does the same palette show up in roughly the same proportions?* Placement is surfaced through SSIM; identity of text is surfaced through Gestalt; this channel isolates "are we painting with Jira's crayons."


Stage 2: Clone Functionality

For functionality, we need to create a deterministic way to verify a feature works.
To do this, we need a frontend unit test on the component. 

The manual process looks like:
Go to Jira and verify a feature exists
Code it with AI locally
Verify the code change works locally manually
Write a unit test for it locally

To automate this we create an agent for all four steps:
1. We first create a browser agent which goes through Jira and creates a report of features. It writes that to this file:
[mcp/summary/tabs/board.json](mcp/summary/tabs/board.json)

2. We then write a verify -> write loop for every feature instance in this board:
To verify, we employ a browser agent to visually recheck if the feature exists
    If the feature exists, write a deterministic unit test for it on ground truth state.
        Verify that the test passes on Jira

These tests are then passed into the reward function and the LLM generates functionality code to optimize on these unit tests. 


3. After completion of unit tests, we can pass those into our reward function to run on changes deterministically when changes are made. 


Stage 3: Hydrate Complexity

To match real Jira, we inject DOM complexity that mirrors ground truth without changing what the user sees. We drive this with a PG-Gram reward signal on the DOM and ARIA tree.

PG-Gram generalizes n-gram similarity from strings to trees — exactly the shape of our data (both DOM and ARIA are labeled, ordered trees). It walks the tree, extracts fixed-shape tuples of (ancestor labels, sibling labels), and scores two trees by how much their tuple "profiles" overlap.

Why not the alternatives:

1. Tree edit distance is O(n^3) and penalizes structural shifts globally — one wrapper `<div>` near the root cascades into an all-or-nothing signal.
2. Raw DOM diffing rewards exact-match memorization, the same failure mode we avoided with pixel MSE in Stage 1.
3. PG-Gram is linear, label-aware, and stable under local edits — small changes produce small reward changes, giving the verify → code loop a smooth gradient.

In short: PG-Gram rewards "does the tree look like Jira's in the same places?" — the SSIM philosophy applied to tree structure.

PG-Gram captures *tree shape* but misses two things real Jira is drowning in:

1. **Atomic CSS class soup.** Real Jira's compiled Emotion classes put 30+ tokens on a single `<button>`; a hand-written BEM clone sits at 2–3.
2. **Head-level chrome.** `ajs-*` metas, `X-B3-*` tracing, `dns-prefetch` links, Atlaskit design-token and Emotion `<style>` blocks, global CSS reset, `.village-*`/`.ap-*` cruft — none of it visible.

We score these separately.

**Class-density reward (CSS code-gen).** `scripts/reward-check.mjs` adds a `class_density` sub-score: walk every classed element, count tokens per `class=""`, compute `median / p90 / p99`. Reward is `min(gen.p90 / ref.p90, 1)` — ref p90 ≈ 30, so it rewards atomic-style class lists. We ignore token *shape* (hashed vs. readable); only density. Costs 5pp ceded from DOM pq-gram:

```466:472:scripts/reward-check.mjs
  const raw =
    0.50 * gatedSSIM +
    0.20 * details.text +
    0.10 * details.color +
    0.05 * pqCombined +
    0.10 * a11yPq +
    0.05 * classDensity
```

**Head-chrome noise (meta tags).** Anything the agent adds must be *reward-neutral*, or it's gaming the signal instead of mimicking Jira. So we built a before/after harness: `scripts/noise-check.mjs`, driven by `npm run noise -- --section <section>`.

Protocol (full spec in `prompts/noise-invariance.md`):

1. Score against reference (`BEFORE`).
2. Pause on stdin. Agent applies the noise edit per `NOISE PROMPT` — head tags copied verbatim from `reference_app/html/reference.html`.
3. ENTER. Score again (`AFTER`).
4. Diff seven sub-scores. If *any* moves > **±0.002**, `VERDICT: REVERT` — the edit changed the rubric. Otherwise `VERDICT: KEEP`.

What counts as head-chrome noise:

- **Include** (verbatim): all `<meta name="ajs-*|X-B3-*|referrer|apple-itunes-app|theme-color">`, `<link rel="shortcut icon|mask-icon|search|dns-prefetch">`, the four `<style data-theme="light|dark|spacing|typography">` blocks, every `<style data-emotion="css …">` block, the global CSS reset, and `.village-*/.ap-*/.mpAUI/.mediaPickerPopup` blocks.
- **Exclude** (real side effects): `<link rel="preconnect|preload">` to external hosts, `<link rel="stylesheet" href="//…cloudfront.net/…">`, any `<script src="//…cloudfront.net/…">` or `chrome-extension://…`. Anything firing a network request at load time is out.

The ±0.002 tolerance is empirical — render nondeterminism floors around 5e-4, so 2e-3 is a comfortable "this is real" cap. Together: class-density pulls the clone's p90 into real-Jira territory, and the noise harness lets the agent safely stuff the `<head>` with Atlassian chrome without touching what the user — or the reward function — can see.


Learnings:

Bottleneck:
The biggest bottleneck to increasing complexity revolves around the browser agent connected to Jira. The browser agent is important because we can't write beginning or end states onto Jira nor can we do deterministic unit tests without some sort of frontend interaction. 

If there is one area to do manually, it would tasks that involve the browser agent.

Some additional features involving the browser agent are doing a full map search of Jira and writing the feature set in one agentic pass rather than hand started. 

In-Context Rot:
Between my before and after picture, the orchestrator made 124 coding agents across five kickoffs for visual and noise similarity. 

In between kickoffs, I added a --focus flag which allowed me to pass specific instructions to the LLM. 

"After 15 focused dispatches, reward plateaued around −0.037 (ssim 0.81, text 0.54, color 0.26, content_gate 0.63)... The target of 0.85 is clearly out of reach without access to the reference HTML structure for pixel-level duplication; further small tweaks would continue oscillating around the current value."

I then kick off another run:

"Reward improved from −0.023 to 0.025 through a sequence of layout fixes (topbar repositioned above sidebar with search centered and toggle/grid/brand moved into it), icon/brand updates (Jira badge, Autoloop cloud icon), and color-palette tuning (white topbar with bottom border, near-white sidebar, subtle lavender column background, 
#F8EEFE page canvas). SSIM climbed from 0.809 → 0.829 …"

A key area for improvement is the LLM's resilience and its ability to surface novel solutions without needing its context cleared.

The question worth asking: within a single run, without wiping the orchestrator's memory, can the LLM reorient itself by reflecting on its own thought traces and arrive at the kind of novel solution it might have found with a fresh context?

My hypothesis is that this bottleneck stems from past context polluting the next-token probabilities. As the model commits further down a specific route, the latent space of possible thoughts narrows, until it eventually declares that no further solution exists.
