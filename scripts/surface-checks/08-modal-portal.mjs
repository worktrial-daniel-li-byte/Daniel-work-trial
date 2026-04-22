export const id = 'modal-portal'
export const name = 'Modal / portal layer (atlaskit-portal-container)'

export async function check({ appPage }) {
  const closedIssues = await appPage.evaluate(() => {
    const issues = []
    const container = document.querySelector('body > .atlaskit-portal-container')
    if (!container) {
      issues.push('document.body missing direct-child .atlaskit-portal-container')
      return { issues }
    }
    const style = container.getAttribute('style') || ''
    if (!style.includes('display:') || !/display:\s*flex/.test(style)) {
      issues.push('.atlaskit-portal-container inline style missing "display: flex"')
    }
    return { issues }
  })

  const opened = await appPage.evaluate(async () => {
    const createBtn = document.querySelector('[data-testid="atlassian-navigation--create-button"]')
      || Array.from(document.querySelectorAll('button')).find((b) => /create/i.test(b.textContent || ''))
    if (!createBtn) return { opened: false, reason: 'no Create button found' }
    createBtn.click()
    return { opened: true }
  })

  if (!opened.opened) {
    closedIssues.issues.push(`could not open modal: ${opened.reason || 'unknown'}`)
    return closedIssues
  }

  await appPage.waitForTimeout(100)

  const modalIssues = await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []
    const container = document.querySelector('body > .atlaskit-portal-container')
    if (!container) {
      issues.push('.atlaskit-portal-container missing after opening modal')
      return { issues }
    }
    const portals = container.querySelectorAll(':scope > .atlaskit-portal')
    if (portals.length < 1) {
      issues.push('no .atlaskit-portal children inside container after opening modal')
      return { issues }
    }

    let dialogFound = false
    for (const p of portals) {
      const ps = p.getAttribute('style') || ''
      if (!/z-index:\s*600/.test(ps)) issues.push('.atlaskit-portal missing inline style z-index: 600')

      const theme = p.querySelector(':scope > div._1e0c1bgi')
      if (!theme) {
        issues.push('.atlaskit-portal missing direct child div._1e0c1bgi')
        continue
      }
      if (theme.getAttribute('data-theme') !== 'dark:dark light:light spacing:spacing typography:typography') {
        issues.push('theme wrapper missing expected data-theme value')
      }
      if (theme.getAttribute('data-color-mode') !== 'light') issues.push('theme wrapper missing data-color-mode="light"')
      if (theme.getAttribute('data-subtree-theme') !== 'true') issues.push('theme wrapper missing data-subtree-theme="true"')

      const dlg = theme.querySelector('[role="dialog"][aria-modal="true"][aria-labelledby="card-dialog-title"]')
      if (dlg) dialogFound = true
    }

    if (!dialogFound) issues.push('composer dialog not found inside any portal theme wrapper')

    const closeBtn = document.querySelector('[aria-label="Close dialog"]')
    if (closeBtn) closeBtn.click()

    return { issues }
  })

  return { issues: [...closedIssues.issues, ...modalIssues.issues] }
}
