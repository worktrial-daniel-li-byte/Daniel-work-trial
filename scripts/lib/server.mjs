import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
}

export async function buildApp({ cwd = ROOT, stdio = 'inherit' } = {}) {
  const viteBin = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [viteBin, 'build'], { cwd, stdio })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`vite build exited with code ${code}`))
    })
  })
}

export async function serveDist({ cwd = ROOT, distDir = 'dist' } = {}) {
  const root = path.join(cwd, distDir)
  const rootStat = await stat(root).catch(() => null)
  if (!rootStat || !rootStat.isDirectory()) {
    throw new Error(`dist directory not found at ${root}. Did the build step run?`)
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x')
      let rel = decodeURIComponent(url.pathname)
      if (rel.endsWith('/')) rel += 'index.html'
      const full = path.normalize(path.join(root, rel))
      if (!full.startsWith(root)) {
        res.writeHead(403).end('Forbidden')
        return
      }
      let fileStat = await stat(full).catch(() => null)
      let target = full
      if (!fileStat || !fileStat.isFile()) {
        target = path.join(root, 'index.html')
      }
      const body = await readFile(target)
      const ext = path.extname(target).toLowerCase()
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
      res.setHeader('Cache-Control', 'no-store')
      res.end(body)
    } catch (err) {
      res.writeHead(500).end(String(err))
    }
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  const url = `http://127.0.0.1:${port}/`

  const close = () =>
    new Promise((resolve) => {
      server.closeAllConnections?.()
      server.close(() => resolve())
    })

  return { url, close }
}
