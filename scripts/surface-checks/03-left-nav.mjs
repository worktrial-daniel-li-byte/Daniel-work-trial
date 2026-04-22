export const id = 'left-nav'
export const name = 'Left nav (page-layout.sidebar)'

export async function check({ appPage }) {
  return await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []

    const navs = h.all('nav[data-testid="page-layout.sidebar"]')
    if (navs.length !== 1) {
      issues.push(`expected 1 <nav data-testid="page-layout.sidebar">, found ${navs.length}`)
      return { issues }
    }
    const nav = navs[0]

    if (nav.tagName.toLowerCase() !== 'nav') {
      issues.push(`sidebar is <${nav.tagName.toLowerCase()}>, expected <nav>`)
    }
    if (!h.attrEq(nav, 'aria-label', 'Sidebar')) issues.push('sidebar missing aria-label="Sidebar"')
    if (!h.attrEq(nav, 'data-layout-slot', 'true')) issues.push('sidebar missing data-layout-slot="true"')
    if (!h.attrMatches(nav, 'id', /^_R[A-Za-z0-9]+_$/)) {
      issues.push(`sidebar id "${nav.getAttribute('id')}" does not match ^_R..._$`)
    }

    const style = nav.getAttribute('style') || ''
    if (!style.includes('--n_sNvw')) {
      issues.push('sidebar inline style missing --n_sNvw')
    }

    const required = [
      '_nd5l1b6c','_191wglyw','_t51zglyw','_bfhk1bhr','_16qs130s','_vchhusvi',
      '_4t3ieqxy','_152timx3','_kqsw1if8','_1bsb1ego','_1pbycs5v','_14b5hc79',
      '_qilnk0mc','_p5clia51','_4ap3vuon','_scbpglyw','_1e0cglyw','_dm2518uv',
      '_15yekb7n','_65m41mrw',
    ]
    const missing = h.missingClassTokens(nav, required)
    if (missing.length) {
      issues.push('sidebar <nav> missing class tokens: ' + missing.join(', '))
    }

    if (!nav.querySelector('[data-testid="side-nav-recommendation.jira-side-nav"]')) {
      issues.push('sidebar missing [data-testid="side-nav-recommendation.jira-side-nav"]')
    }
    if (!nav.querySelector('[data-testid="sidebar-entry.panel-splitter-container"]')) {
      issues.push('sidebar missing [data-testid="sidebar-entry.panel-splitter-container"]')
    }
    const splitter = nav.querySelector('[data-testid="sidebar-entry.panel-splitter"]')
    if (!splitter) {
      issues.push('sidebar missing [data-testid="sidebar-entry.panel-splitter"]')
    } else if (splitter.getAttribute('draggable') !== 'true') {
      issues.push('[data-testid="sidebar-entry.panel-splitter"] missing draggable="true"')
    }
    const tooltip = nav.querySelector('[data-testid="sidebar-entry.panel-splitter-tooltip--container"]')
    if (!tooltip) {
      issues.push('sidebar missing [data-testid="sidebar-entry.panel-splitter-tooltip--container"]')
    } else if (tooltip.getAttribute('role') !== 'presentation') {
      issues.push('[data-testid="sidebar-entry.panel-splitter-tooltip--container"] missing role="presentation"')
    }

    const moreBtns = nav.querySelectorAll('button[data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger"]')
    if (moreBtns.length < 1 || moreBtns.length > 10) {
      issues.push(`sidebar more-nav-menu-button-trigger count ${moreBtns.length} not in [1..10]`)
    } else {
      const sample = moreBtns[0]
      if (sample.getAttribute('aria-haspopup') !== 'true') issues.push('more-nav-menu-button-trigger missing aria-haspopup="true"')
      if (sample.getAttribute('aria-expanded') !== 'false') issues.push('more-nav-menu-button-trigger missing aria-expanded="false"')
    }

    return { issues }
  })
}
