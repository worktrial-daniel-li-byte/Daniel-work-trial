export const id = 'app-shell'
export const name = 'App shell (#jira, #jira-frontend, skip-links, page-layout.root)'

export async function check({ appPage }) {
  return await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []

    if (document.body.id !== 'jira') {
      issues.push(`<body> id is "${document.body.id}", expected "jira"`)
    }

    const frontend = document.getElementById('jira-frontend')
    if (!frontend) {
      issues.push('No <div id="jira-frontend"> found')
    } else {
      // must be somewhere inside body (allow React root wrapping)
      if (!document.body.contains(frontend)) {
        issues.push('#jira-frontend is not inside <body>')
      }
    }

    const skip = document.querySelector('[data-testid="page-layout.root--skip-links-container"]')
    if (!skip) {
      issues.push('Missing [data-testid="page-layout.root--skip-links-container"]')
    } else {
      const required = [
        '_zulp1b66','_2rko12b0','_1rjcutpp','_18zrutpp','_1e0c1txw','_2lx21bp4',
        '_kqsw1n9t','_1e02v47k','_152tv47k','_bfhk1bhr','_16qs130s','_1pby1mrw',
        '_tzy4idpf','_lcxvglyw','_1digjh3g','_1mygkb7n','_18eu1wug',
      ]
      const missing = h.missingClassTokens(skip, required)
      if (missing.length) {
        issues.push('skip-links-container missing class tokens: ' + missing.join(', '))
      }

      const label = skip.querySelector('[data-testid="page-layout.root--skip-links-container--label"]')
      if (!label) {
        issues.push('Missing skip-links label span')
      } else if (!/skip to/i.test(label.textContent || '')) {
        issues.push('skip-links label text does not say "Skip to"')
      }

      const lis = Array.from(skip.querySelectorAll('ol > li'))
      if (lis.length !== 3) {
        issues.push(`skip-links expected 3 <li> children, found ${lis.length}`)
      }
      const anchors = Array.from(skip.querySelectorAll('ol > li > a'))
      if (anchors.length !== 3) {
        issues.push(`skip-links expected 3 <a> links, found ${anchors.length}`)
      }
      for (const a of anchors) {
        if (a.getAttribute('tabindex') !== '0') {
          issues.push(`skip-link <a> missing tabindex="0": ${h.describe(a)}`)
        }
        const href = a.getAttribute('href') || ''
        if (!/^#_R[A-Za-z0-9]+_$/.test(href)) {
          issues.push(`skip-link href "${href}" does not match #_R..._ shape`)
          continue
        }
        const targetId = href.slice(1)
        if (!document.getElementById(targetId)) {
          issues.push(`skip-link href ${href} has no matching element with id=${targetId}`)
        }
      }
    }

    const root = document.querySelector('#unsafe-design-system-page-layout-root[data-testid="page-layout.root"]')
    if (!root) {
      issues.push('Missing <div id="unsafe-design-system-page-layout-root" data-testid="page-layout.root">')
    } else {
      const required = [
        '_1e0c11p5','_1tke1kxc','_1lmcq9em','_yv0ei47z','_2z0516ab','_1ciragmp',
        '_12fk1aio','_12qzrxre','_1rqteala','_xkmgks3h','_jbc7rxre','_tyve1nco',
      ]
      const missing = h.missingClassTokens(root, required)
      if (missing.length) {
        issues.push('page-layout.root missing class tokens: ' + missing.join(', '))
      }
    }

    return { issues }
  })
}
