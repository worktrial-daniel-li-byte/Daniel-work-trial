export const id = 'top-nav'
export const name = 'Top nav (page-layout.top-nav + atlassian-navigation)'

export async function check({ appPage }) {
  return await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []

    const headers = h.all('header[data-testid="page-layout.top-nav"]')
    if (headers.length !== 1) {
      issues.push(`expected 1 <header data-testid="page-layout.top-nav">, found ${headers.length}`)
      return { issues }
    }
    const header = headers[0]

    if (header.tagName.toLowerCase() !== 'header') {
      issues.push(`top-nav is <${header.tagName.toLowerCase()}>, expected <header>`)
    }
    if (header.getAttribute('data-layout-slot') !== 'true') {
      issues.push('top-nav missing data-layout-slot="true"')
    }
    if (!h.attrMatches(header, 'id', /^_R[A-Za-z0-9]+_$/)) {
      issues.push(`top-nav id "${header.getAttribute('id')}" does not match ^_R..._$`)
    }

    const required = [
      '_nd5l8cbt','_zulpu2gc','_18zrze3t','_179rglyw','_1e0c11p5','_yv0e1mfv',
      '_4cvr1h6o','_bfhkvuon','_vchhusvi','_4t3i1dgc','_152t1nws','_kqsw1if8',
      '_1pby11wp','_d6vu1bgi','_1j8b18ax','_lcxv1wug','_aetrb3bt','_18postnw',
      '_1gufidpf','_1czdidpf','_g0nf3tht','_1beue4h9','_uaeunqa1','_1cte1l7x',
      '_pdlmutpp','_1rqt16a9','_jh1g18ax',
    ]
    const missing = h.missingClassTokens(header, required)
    if (missing.length) {
      issues.push('top-nav header missing class tokens: ' + missing.join(', '))
    }

    const styles = header.querySelectorAll('style')
    const styleText = Array.from(styles).map((s) => s.textContent || '').join('\n')
    if (!styleText.includes('--topNavigationHeight')) {
      issues.push('top-nav missing inline <style> declaring --topNavigationHeight')
    }

    const required_testids = [
      { sel: '[data-testid="atlassian-navigation--product-home--container"]', tag: null },
      { sel: '[data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper"]', tag: 'button' },
      { sel: '[data-testid="atlassian-navigation--create-button"]', tag: 'button' },
      { sel: '[data-testid="atlassian-navigation.ui.conversation-assistant.app-navigation-ai-mate"]', tag: null },
      { sel: '[data-testid="atlassian-navigation--secondary-actions--notifications--menu-trigger"]', tag: null },
      { sel: '[data-testid="atlassian-navigation--secondary-actions--help--menu-trigger"]', tag: null },
      { sel: '[data-testid="atlassian-navigation--secondary-actions--settings--menu-trigger"]', tag: null },
      { sel: '[data-testid="atlassian-navigation--secondary-actions--profile--trigger"]', tag: 'button' },
    ]
    for (const { sel, tag } of required_testids) {
      const el = header.querySelector(sel)
      if (!el) {
        issues.push('top-nav missing ' + sel)
        continue
      }
      if (tag && el.tagName.toLowerCase() !== tag) {
        issues.push(`${sel} is <${el.tagName.toLowerCase()}>, expected <${tag}>`)
      }
    }

    const profile = header.querySelector('[data-testid="atlassian-navigation--secondary-actions--profile--trigger"]')
    if (profile) {
      if (!h.attrEq(profile, 'aria-haspopup', 'true')) issues.push('profile trigger missing aria-haspopup="true"')
      if (!h.attrEq(profile, 'aria-expanded', 'false')) issues.push('profile trigger missing aria-expanded="false"')
      if (!profile.getAttribute('aria-controls')) issues.push('profile trigger missing aria-controls')
    }

    return { issues }
  })
}
