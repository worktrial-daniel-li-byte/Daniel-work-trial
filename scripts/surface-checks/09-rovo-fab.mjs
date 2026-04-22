export const id = 'rovo-fab'
export const name = 'Rovo / bottom-right corner FAB layer'

export async function check({ appPage }) {
  return await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []

    const fabs = document.querySelectorAll('[data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"]')
    if (fabs.length !== 1) {
      issues.push(`expected 1 bottom-right-corner container, found ${fabs.length}`)
      return { issues }
    }
    const fab = fabs[0]

    const style = fab.getAttribute('style') || ''
    if (!/right:/.test(style)) issues.push('FAB inline style missing "right:"')
    if (!/bottom:/.test(style)) issues.push('FAB inline style missing "bottom:"')
    if (!/--ds-space-300/.test(style)) issues.push('FAB inline style missing --ds-space-300 reference')

    const missing = h.missingClassTokens(fab, [
      '_1reoewfl','_18m9ewfl','_kqsw1n9t','_1e0c1txw','_1pbyfjpv','_4cvresu3','_lcxvglyw',
    ])
    if (missing.length) issues.push('FAB container missing class tokens: ' + missing.join(', '))

    const main = document.querySelector('[data-testid="page-layout.main"]')
    if (main && main.contains(fab)) {
      issues.push('FAB container must NOT be a descendant of [data-testid="page-layout.main"]')
    }

    return { issues }
  })
}
