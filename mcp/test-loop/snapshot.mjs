/**
 * Revert tool for the saboteur mutation check.
 *
 * The harness owns revert — we don't trust the saboteur agent to undo its
 * own edits cleanly. Before the saboteur runs, `snapshotSources()` copies
 * src/ and public/ to a sibling directory under os.tmpdir(). After the
 * mutation run, `restoreSources()` wipes the live dirs and restores them
 * from the snapshot — including handling files the saboteur added, deleted,
 * or renamed.
 *
 * Implementation uses `cp -a` / `rm -rf` shelled via spawn. We could do this
 * in pure Node, but cp -a preserves symlinks, permissions, and timestamps
 * (important for Vite HMR file-watching) in one syscall-efficient pass.
 */

import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

function run(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d) => (stdout += d.toString('utf8')))
    child.stderr?.on('data', (d) => (stderr += d.toString('utf8')))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else
        reject(
          new Error(
            `${command} ${args.join(' ')} exited ${code}\n${stderr || stdout}`,
          ),
        )
    })
  })
}

async function pathExists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

/**
 * Snapshot the given directory names (relative to `repoRoot`) into a temp dir.
 *
 * @param {object} opts
 * @param {string} opts.repoRoot   Absolute path to repo root.
 * @param {string[]} opts.dirs     Relative dir names to snapshot (e.g. ['src','public']).
 * @param {string} [opts.label]    Optional label baked into the tempdir name.
 * @returns {Promise<{tempDir: string, dirs: string[], restore: () => Promise<void>, cleanup: () => Promise<void>}>}
 */
export async function snapshotSources({ repoRoot, dirs, label = 'snapshot' }) {
  const tempBase = await mkdtemp(
    path.join(os.tmpdir(), `test-loop-${label}-`),
  )

  const snapshotted = []
  for (const rel of dirs) {
    const src = path.resolve(repoRoot, rel)
    if (!(await pathExists(src))) continue
    const dest = path.join(tempBase, rel)
    await mkdir(path.dirname(dest), { recursive: true })
    // cp -a: archive mode (recursive, preserve attrs, follow symlinks sanely).
    await run('cp', ['-a', src, dest])
    snapshotted.push(rel)
  }

  const restore = async () => {
    for (const rel of snapshotted) {
      const liveDir = path.resolve(repoRoot, rel)
      const snap = path.join(tempBase, rel)
      // Wipe live dir so files the saboteur added/renamed disappear, then
      // restore the snapshot over the cleared path.
      await rm(liveDir, { recursive: true, force: true })
      await mkdir(path.dirname(liveDir), { recursive: true })
      await run('cp', ['-a', snap, liveDir])
    }
  }

  const cleanup = async () => {
    await rm(tempBase, { recursive: true, force: true })
  }

  return { tempDir: tempBase, dirs: snapshotted, restore, cleanup }
}
