#!/usr/bin/env node
/**
 * MCP stdio server for the verify→write loop.
 *
 * Tools:
 *   - score_app            — runs the JS reward function in scripts/reward-check.mjs
 *                            and returns reward + breakdown + both screenshots as
 *                            inline images (so Claude can see them).
 *   - get_reward_config    — static metadata (viewport, weights, etc.).
 *   - read_file            — read a file inside the repo.
 *   - write_file           — overwrite a file inside the repo (whitelisted dirs).
 *   - replace_in_file      — surgical find-and-replace inside a file (whitelisted dirs).
 *   - list_dir             — list a directory inside the repo.
 */

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { runReward } from "../../scripts/reward-check.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const defaultRefHtml = path.join(
  repoRoot,
  "reference_app",
  "html",
  "reference.html",
);

// Writes are only allowed inside these directories (relative to repoRoot).
const WRITE_ALLOWLIST = ["src", "public", "reward-artifacts", "prompts"];
// Reads disallow these entirely.
const READ_DENYLIST = [".env", ".git", "node_modules"];

function resolveRepoPath(p) {
  const abs = path.resolve(repoRoot, p);
  const rel = path.relative(repoRoot, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path ${p} is outside the repo`);
  }
  return { abs, rel };
}

function assertReadable(rel) {
  for (const deny of READ_DENYLIST) {
    if (rel === deny || rel.startsWith(`${deny}/`)) {
      throw new Error(`Read denied: ${rel} is in deny-list`);
    }
  }
}

function assertWritable(rel) {
  const ok = WRITE_ALLOWLIST.some(
    (dir) => rel === dir || rel.startsWith(`${dir}/`),
  );
  if (!ok) {
    throw new Error(
      `Write denied: ${rel} is not inside one of [${WRITE_ALLOWLIST.join(", ")}]`,
    );
  }
}

const server = new McpServer(
  { name: "reward-mcp-server", version: "0.3.0" },
  {
    capabilities: { tools: {} },
    instructions:
      "Tools for a verify→write loop. Call score_app after each edit to see reward + screenshots. " +
      "Use read_file / write_file / list_dir to inspect and modify source under src/, public/, prompts/. " +
      "Reward is in [-1, 1]; higher is better.",
  },
);

// ── score_app ───────────────────────────────────────────────────────────────

server.registerTool(
  "score_app",
  {
    title: "Score app against reference",
    description:
      "Run the reward function. Returns the numeric reward plus four sub-scores " +
      "(ssim, text, color, pqgram) and attaches both the reference screenshot and " +
      "the current app screenshot as images so you can compare them visually. " +
      "pqgram includes a per-region breakdown (app-shell, top-nav, left-nav, " +
      "horizontal-nav, project-header, board-toolbar, board-canvas, modal-portal, " +
      "rovo-fab) that measures how closely the DOM tree under each data-testid " +
      "anchor matches the reference. " +
      "If the dev server isn't running yet, it will be auto-started.",
    inputSchema: {
      app_url: z
        .string()
        .optional()
        .describe("URL of the running app. Defaults to http://localhost:5173."),
      ref_html: z
        .string()
        .optional()
        .describe(
          "Path (absolute or relative to repo) to a reference HTML file. " +
            "Defaults to reference_app/html/reference.html.",
        ),
      settle_ms: z
        .number()
        .int()
        .min(0)
        .max(10000)
        .optional()
        .describe("Extra wait after load to let layout settle (default 500ms)."),
      auto_start: z
        .boolean()
        .optional()
        .describe("Auto-start `npm run dev` if nothing is on the port (default true)."),
      include_screenshots: z
        .boolean()
        .optional()
        .describe("Attach both screenshots as inline images (default true)."),
    },
  },
  async ({
    app_url,
    ref_html,
    settle_ms,
    auto_start,
    include_screenshots,
  }) => {
    try {
      const refHtml = ref_html
        ? resolveRepoPath(ref_html).abs
        : defaultRefHtml;

      const result = await runReward({
        appUrl: app_url,
        refHtml,
        settleMs: settle_ms,
        autoStart: auto_start ?? true,
      });

      const summary = {
        reward: result.reward,
        details: result.details,
        ref: result.ref,
        gen: result.gen,
      };

      const pqHint =
        "pqgram measures how closely your DOM's tag/testid hierarchy matches the " +
        "reference (Augsten pq-grams over tag+data-testid labels). " +
        "details.pqgram.regions[id]=0 means the reference has that region but your " +
        "DOM is missing the matching [data-testid] anchor — e.g. region 'top-nav' " +
        "needs <header data-testid=\"page-layout.top-nav\">. " +
        "To raise pqgram: (a) emit the reference's data-testid values verbatim on " +
        "the matching elements, and (b) mirror its wrapper-div nesting depth. " +
        "Class-name hashes don't matter here — only tag + data-testid do.";

      const content = [
        { type: "text", text: JSON.stringify(summary, null, 2) },
        { type: "text", text: pqHint },
      ];

      if (include_screenshots !== false) {
        try {
          const [refBuf, genBuf] = await Promise.all([
            readFile(result.ref.screenshot),
            readFile(result.gen.screenshot),
          ]);
          content.push(
            { type: "text", text: "Reference (target) screenshot:" },
            {
              type: "image",
              data: refBuf.toString("base64"),
              mimeType: "image/png",
            },
            { type: "text", text: "Current app screenshot:" },
            {
              type: "image",
              data: genBuf.toString("base64"),
              mimeType: "image/png",
            },
          );
        } catch (err) {
          content.push({
            type: "text",
            text: `(could not attach screenshots: ${err.message})`,
          });
        }
      }

      return { content, structuredContent: summary };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `score_app failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`,
          },
        ],
      };
    }
  },
);

// ── get_reward_config ───────────────────────────────────────────────────────

server.registerTool(
  "get_reward_config",
  {
    title: "Get reward config",
    description:
      "Return static info about the reward function: viewport, weights, write-allowlist, and repo root.",
    inputSchema: {},
  },
  async () => {
    const info = {
      repo_root: repoRoot,
      viewport: { width: 1920, height: 1080 },
      weights: { ssim: 0.5, text: 0.2, color: 0.1, pqgram: 0.2 },
      content_gate:
        "0.2 + 0.8 * max(text, color) — gates SSIM so blank pages can't hack reward",
      reward_formula:
        "raw = 0.50*gated_ssim + 0.20*text + 0.10*color + 0.20*pqgram; reward = 2*raw - 1",
      sub_scores: {
        ssim: "Visual similarity of the two 256x256 screenshots (mssim).",
        text: "Gestalt pattern similarity of document.body.innerText only. " +
          "Attribute text (aria-label, alt, title, placeholder) and CSS " +
          "::before/::after content do NOT count. To move this, change " +
          "visible JSX copy.",
        color: "Palette-histogram similarity of backgroundColor + color " +
          "(getComputedStyle) on visible, non-tiny elements.",
        pqgram:
          "Structural DOM similarity (Augsten pq-grams, Dice over multisets). " +
          "Node label = lowercase tag + optional `#data-testid`. " +
          `Params p=2, q=3. Excludes script/style/noscript/link/meta/template. ` +
          "Reported as {whole, regions, combined}: 'whole' compares the full " +
          "body tree; 'regions' compares the subtree under each testid anchor; " +
          "'combined' = 0.5*whole + 0.5*mean(present regions) and is what " +
          "feeds into reward. To move pqgram, emit the same data-testid " +
          "values and wrapper-div hierarchy the reference uses.",
      },
      pqgram_regions: [
        { id: "app-shell",      testid: "page-layout.root" },
        { id: "top-nav",        testid: "page-layout.top-nav" },
        { id: "left-nav",       testid: "page-layout.sidebar" },
        { id: "horizontal-nav", testid: "horizontal-nav.ui.content.horizontal-nav" },
        { id: "project-header", testid: "horizontal-nav-header.ui.project-header.header" },
        { id: "board-toolbar",  testid: "business-filters.ui.filters.assignee-filter" },
        { id: "board-canvas",   testid: "board.content.board-wrapper" },
        { id: "modal-portal",   selector: "body > .atlaskit-portal-container" },
        { id: "rovo-fab",       testid: "layout-controller.ui.bottom-right-corner.container.styled-container" },
      ],
      pqgram_scoring_rules:
        "A region present on ref + missing on gen scores 0. A region absent " +
        "from ref is skipped (not averaged in).",
      reward_range: [-1, 1],
      default_ref_html: defaultRefHtml,
      write_allowlist: WRITE_ALLOWLIST,
      read_denylist: READ_DENYLIST,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      structuredContent: info,
    };
  },
);

// ── read_file ───────────────────────────────────────────────────────────────

server.registerTool(
  "read_file",
  {
    title: "Read a repo file",
    description:
      "Read a UTF-8 text file inside the repo. Path is absolute or repo-relative. " +
      ".env, .git, and node_modules are blocked.",
    inputSchema: {
      path: z.string().describe("Repo-relative or absolute file path."),
      max_bytes: z
        .number()
        .int()
        .min(1)
        .max(1_000_000)
        .optional()
        .describe("Truncate output to this many bytes (default 200_000)."),
    },
  },
  async ({ path: p, max_bytes }) => {
    try {
      const { abs, rel } = resolveRepoPath(p);
      assertReadable(rel);
      const buf = await readFile(abs);
      const limit = max_bytes ?? 200_000;
      const truncated = buf.length > limit;
      const text = buf.slice(0, limit).toString("utf8");
      return {
        content: [
          {
            type: "text",
            text: truncated
              ? `${text}\n\n… [truncated at ${limit} of ${buf.length} bytes] …`
              : text,
          },
        ],
        structuredContent: { path: rel, bytes: buf.length, truncated },
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `read_file failed: ${err.message}` }],
      };
    }
  },
);

// ── write_file ──────────────────────────────────────────────────────────────

server.registerTool(
  "write_file",
  {
    title: "Write a repo file",
    description:
      "Overwrite (or create) a UTF-8 text file inside the repo. " +
      `Writes are restricted to [${WRITE_ALLOWLIST.join(", ")}]. ` +
      "Creates parent directories as needed. Vite HMR picks up src/ changes automatically.",
    inputSchema: {
      path: z.string().describe("Repo-relative or absolute file path."),
      contents: z.string().describe("Full new contents of the file."),
    },
  },
  async ({ path: p, contents }) => {
    try {
      const { abs, rel } = resolveRepoPath(p);
      assertWritable(rel);
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, contents, "utf8");
      return {
        content: [
          { type: "text", text: `Wrote ${rel} (${contents.length} chars)` },
        ],
        structuredContent: { path: rel, bytes: Buffer.byteLength(contents) },
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `write_file failed: ${err.message}` }],
      };
    }
  },
);

// ── replace_in_file ─────────────────────────────────────────────────────────

server.registerTool(
  "replace_in_file",
  {
    title: "Surgically edit a file",
    description:
      "Replace exactly one occurrence of old_string with new_string in a file. " +
      "Prefer this over write_file for targeted changes — it is much smaller, so " +
      "it is far less likely to be truncated by max_tokens limits. " +
      `Writes restricted to [${WRITE_ALLOWLIST.join(", ")}]. ` +
      "old_string must appear exactly once in the file (include enough surrounding " +
      "context to make it unique). Set replace_all=true to replace every occurrence.",
    inputSchema: {
      path: z.string().describe("Repo-relative or absolute file path."),
      old_string: z
        .string()
        .describe(
          "Exact substring to find. Must match EXACTLY including whitespace and indentation.",
        ),
      new_string: z.string().describe("String to insert in place of old_string."),
      replace_all: z
        .boolean()
        .optional()
        .describe("If true, replaces every occurrence instead of requiring uniqueness."),
    },
  },
  async ({ path: p, old_string, new_string, replace_all }) => {
    try {
      const { abs, rel } = resolveRepoPath(p);
      assertWritable(rel);
      const original = await readFile(abs, "utf8");

      if (old_string === new_string) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "replace_in_file failed: old_string and new_string are identical (no-op).",
            },
          ],
        };
      }

      let count = 0;
      let idx = 0;
      while ((idx = original.indexOf(old_string, idx)) !== -1) {
        count += 1;
        idx += old_string.length || 1;
      }

      if (count === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                `replace_in_file failed: old_string not found in ${rel}. ` +
                "Read the file and copy the exact substring (whitespace matters).",
            },
          ],
        };
      }
      if (count > 1 && !replace_all) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text:
                `replace_in_file failed: old_string matches ${count} times in ${rel}. ` +
                "Include more surrounding context to make it unique, or pass replace_all=true.",
            },
          ],
        };
      }

      const updated = replace_all
        ? original.split(old_string).join(new_string)
        : original.replace(old_string, new_string);

      await writeFile(abs, updated, "utf8");

      return {
        content: [
          {
            type: "text",
            text:
              `Patched ${rel}: ${count} replacement${count === 1 ? "" : "s"} ` +
              `(${original.length} → ${updated.length} chars).`,
          },
        ],
        structuredContent: {
          path: rel,
          replacements: count,
          bytes_before: Buffer.byteLength(original),
          bytes_after: Buffer.byteLength(updated),
        },
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          { type: "text", text: `replace_in_file failed: ${err.message}` },
        ],
      };
    }
  },
);

// ── list_dir ────────────────────────────────────────────────────────────────

server.registerTool(
  "list_dir",
  {
    title: "List a repo directory",
    description: "List entries in a repo directory (non-recursive).",
    inputSchema: {
      path: z
        .string()
        .optional()
        .describe("Repo-relative or absolute directory. Defaults to repo root."),
    },
  },
  async ({ path: p }) => {
    try {
      const { abs, rel } = resolveRepoPath(p ?? ".");
      assertReadable(rel || ".");
      const entries = await readdir(abs, { withFileTypes: true });
      const items = await Promise.all(
        entries
          .filter((e) => !READ_DENYLIST.includes(e.name))
          .map(async (e) => {
            const childAbs = path.join(abs, e.name);
            let size = null;
            try {
              if (e.isFile()) size = (await stat(childAbs)).size;
            } catch {}
            return {
              name: e.name,
              type: e.isDirectory() ? "dir" : e.isFile() ? "file" : "other",
              size,
            };
          }),
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ path: rel || ".", entries: items }, null, 2),
          },
        ],
        structuredContent: { path: rel || ".", entries: items },
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `list_dir failed: ${err.message}` }],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
