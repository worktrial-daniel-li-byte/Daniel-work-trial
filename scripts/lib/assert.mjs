// Lightweight assertion helpers. Each returns an array of issue strings;
// empty array means pass. Helpers run inside Playwright's browser via
// page.evaluate, so they are re-declared as plain JS strings there; these
// here are for Node-side use to format / aggregate results.

export function fail(issues, msg) {
  if (typeof msg === 'string') issues.push(msg)
  else if (Array.isArray(msg)) issues.push(...msg)
}

export function header(title) {
  return `\n=== ${title} ===`
}

export function formatReport(results) {
  const lines = []
  let ok = 0
  let failed = 0
  for (const r of results) {
    if (r.skipped) {
      lines.push(`  -  ${r.id.padEnd(18)} skipped (${r.reason || 'n/a'})`)
      continue
    }
    if (r.issues.length === 0) {
      ok++
      lines.push(`  \u2713  ${r.id.padEnd(18)} ${r.name}`)
    } else {
      failed++
      lines.push(`  \u2717  ${r.id.padEnd(18)} ${r.name}`)
      for (const issue of r.issues) {
        lines.push(`        - ${issue}`)
      }
    }
  }
  lines.push('')
  lines.push(`  ${ok} passed, ${failed} failed`)
  return { text: lines.join('\n'), ok, failed }
}
