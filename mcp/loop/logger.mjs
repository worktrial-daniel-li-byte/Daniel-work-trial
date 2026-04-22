/**
 * Per-run logger for the verify→write loop.
 *
 * Writes everything under mcp/logs/<run-timestamp>/:
 *
 *   run.json               header (when started, model, app_url, config)
 *   run.md                 human-readable summary written at the end
 *   timeline.json          machine-readable timeline
 *   score-NN/              each call to score_app (verifier-initiated OR
 *                          post-dispatch)
 *     ref.png              reference screenshot
 *     gen.png              current app screenshot
 *     score.json           reward + breakdown
 *   dispatch-NN/           each dispatch_to_worker call
 *     task.md              task + rationale + worker summary + reward delta
 *
 * The dispatch-NN folder immediately precedes the score-NN folder that
 * captured its result, so you can scrub the run in order.
 */

import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function pad(n) {
  return String(n).padStart(2, "0");
}

function fmtReward(r) {
  if (typeof r !== "number" || !Number.isFinite(r)) return "n/a";
  return r.toFixed(4);
}

export class RunLogger {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.runId = new Date().toISOString().replace(/[:.]/g, "-");
    this.runDir = path.join(baseDir, this.runId);
    this.scoreCount = 0;
    this.dispatchCount = 0;
    this.timeline = [];
  }

  async init({ appUrl, model, config }) {
    await mkdir(this.runDir, { recursive: true });
    const header = {
      run_id: this.runId,
      started_at: new Date().toISOString(),
      app_url: appUrl,
      model,
      config: {
        maxDispatches: config.maxDispatches,
        maxWorkerTurns: config.maxWorkerTurns,
        targetReward: config.targetReward,
        improvementDelta: config.improvementDelta,
        maxTokens: config.maxTokens,
      },
    };
    await writeFile(
      path.join(this.runDir, "run.json"),
      JSON.stringify(header, null, 2),
    );
    this.timeline.push({
      at: new Date().toISOString(),
      type: "start",
      ...header,
    });
    return this.runDir;
  }

  async logScore(structured) {
    if (!structured) return null;
    this.scoreCount += 1;
    const dir = path.join(this.runDir, `score-${pad(this.scoreCount)}`);
    await mkdir(dir, { recursive: true });

    try {
      if (structured.ref?.screenshot) {
        await copyFile(structured.ref.screenshot, path.join(dir, "ref.png"));
      }
    } catch {}
    try {
      if (structured.gen?.screenshot) {
        await copyFile(structured.gen.screenshot, path.join(dir, "gen.png"));
      }
    } catch {}

    await writeFile(
      path.join(dir, "score.json"),
      JSON.stringify(structured, null, 2),
    );

    this.timeline.push({
      at: new Date().toISOString(),
      type: "score",
      n: this.scoreCount,
      reward: structured.reward ?? null,
      details: structured.details ?? null,
      dir: path.basename(dir),
    });
    return dir;
  }

  async logDispatch({
    task,
    rationale,
    mode,
    before,
    after,
    improved,
    workerSummary,
  }) {
    this.dispatchCount += 1;
    const dir = path.join(
      this.runDir,
      `dispatch-${pad(this.dispatchCount)}`,
    );
    await mkdir(dir, { recursive: true });

    const md = [
      `# Dispatch ${pad(this.dispatchCount)} — ${mode} worker`,
      "",
      `- **Before reward:** ${fmtReward(before)}`,
      `- **After reward:**  ${fmtReward(after)}`,
      `- **Improved:**      ${improved}`,
      `- **Worker context next dispatch:** ${improved ? "cleared" : "preserved"}`,
      "",
      "## Task",
      "",
      task ?? "(none)",
      "",
      "## Rationale",
      "",
      rationale ?? "(none)",
      "",
      "## Worker summary",
      "",
      workerSummary || "(no summary)",
      "",
    ].join("\n");
    await writeFile(path.join(dir, "task.md"), md);

    this.timeline.push({
      at: new Date().toISOString(),
      type: "dispatch",
      n: this.dispatchCount,
      mode,
      before: before ?? null,
      after: after ?? null,
      improved,
      dir: path.basename(dir),
    });
    return dir;
  }

  async finalize(summary) {
    this.timeline.push({
      at: new Date().toISOString(),
      type: "end",
      ...summary,
    });

    const md = [
      `# Verify→write run \`${this.runId}\``,
      "",
      "## Final summary",
      "",
      "```json",
      JSON.stringify(summary, null, 2),
      "```",
      "",
      "## Counts",
      "",
      `- scores logged:    ${this.scoreCount}`,
      `- dispatches logged: ${this.dispatchCount}`,
      "",
      "## Timeline",
      "",
      ...this.timeline.map((e) => {
        const { at, type, ...rest } = e;
        return `- \`${at}\` **${type}** — \`${JSON.stringify(rest)}\``;
      }),
      "",
    ].join("\n");
    await writeFile(path.join(this.runDir, "run.md"), md);
    await writeFile(
      path.join(this.runDir, "timeline.json"),
      JSON.stringify(this.timeline, null, 2),
    );
  }
}
