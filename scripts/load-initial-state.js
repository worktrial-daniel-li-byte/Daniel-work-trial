import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const defaultSourcePath = path.join(projectRoot, 'fixtures', 'initial-state.json')
const targetPath = path.join(projectRoot, 'public', 'initial-state.json')

function resolveSourcePath(inputPath) {
  if (!inputPath) {
    return defaultSourcePath
  }

  return path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath)
}

function isValidStateShape(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.columns)) {
    return false
  }

  return value.columns.every((column) => {
    if (!column || typeof column !== 'object' || !Array.isArray(column.cards)) {
      return false
    }

    return (
      typeof column.id === 'string' &&
      typeof column.title === 'string' &&
      column.cards.every(
        (card) =>
          card &&
          typeof card === 'object' &&
          typeof card.id === 'string' &&
          typeof card.title === 'string' &&
          typeof card.key === 'string' &&
          typeof card.priority === 'string' &&
          typeof card.assignee === 'string',
      )
    )
  })
}

async function main() {
  const sourcePath = resolveSourcePath(process.argv[2])
  const sourceContents = await readFile(sourcePath, 'utf8')
  const parsedState = JSON.parse(sourceContents)

  if (!isValidStateShape(parsedState)) {
    throw new Error('Initial state JSON must be an object with a columns array.')
  }

  await mkdir(path.dirname(targetPath), { recursive: true })
  await writeFile(targetPath, `${JSON.stringify(parsedState, null, 2)}\n`)

  const relativeSource = path.relative(projectRoot, sourcePath) || path.basename(sourcePath)
  const relativeTarget = path.relative(projectRoot, targetPath)
  console.log(`Loaded initial state from ${relativeSource} to ${relativeTarget}.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
