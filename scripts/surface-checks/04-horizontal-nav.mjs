export const id = 'horizontal-nav'
export const name = 'Horizontal project navigation (tabs)'

export async function check({ appPage }) {
  return await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []

    const main = document.querySelector('[data-testid="page-layout.main"]')
    if (!main) {
      issues.push('[data-testid="page-layout.main"] missing — complete prompt 01/02 first')
      return { issues }
    }

    const headers = main.querySelectorAll('header[data-testid="horizontal-nav.ui.content.horizontal-nav"]')
    if (headers.length !== 1) {
      issues.push(`expected 1 horizontal-nav <header>, found ${headers.length}`)
      return { issues }
    }
    const nav = headers[0]

    if (nav.id !== 'ak-project-view-navigation') {
      issues.push(`horizontal-nav id "${nav.id}" !== "ak-project-view-navigation"`)
    }
    if (nav.getAttribute('data-ssr-placeholder') !== 'project-view-navigation') {
      issues.push('horizontal-nav missing data-ssr-placeholder="project-view-navigation"')
    }

    const tabs = nav.querySelectorAll('[data-testid="navigation-kit-ui-tab.ui.link-tab"]')
    const activeTabs = nav.querySelectorAll('[data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab"]')

    if (tabs.length !== 7) {
      issues.push(`expected 7 link-tabs, found ${tabs.length}`)
    }
    if (activeTabs.length !== 1) {
      issues.push(`expected 1 non-interactive (active) tab, found ${activeTabs.length}`)
    }

    const active = activeTabs[0]
    if (active) {
      if (active.tagName.toLowerCase() !== 'h2') {
        issues.push(`active tab is <${active.tagName.toLowerCase()}>, expected <h2>`)
      }
      if (active.getAttribute('aria-current') !== 'page') {
        issues.push('active tab missing aria-current="page"')
      }
    }

    const hrefPattern = /^\/jira\/core\/projects\/[A-Z]+\/(summary|list|calendar|timeline|approvals|form|pages)$/
    for (const tab of tabs) {
      if (tab.tagName.toLowerCase() !== 'a') {
        issues.push(`link-tab is <${tab.tagName.toLowerCase()}>, expected <a>`)
        continue
      }
      if (tab.getAttribute('role') !== 'link') issues.push('link-tab missing role="link"')
      if (tab.getAttribute('tabindex') !== '0') issues.push('link-tab missing tabindex="0"')
      if (tab.getAttribute('draggable') !== 'false') issues.push('link-tab missing draggable="false"')
      const href = tab.getAttribute('href') || ''
      if (!hrefPattern.test(href)) {
        issues.push(`link-tab href "${href}" does not match expected pattern`)
      }
    }

    const moreWrap = nav.querySelector('[data-testid="navigation-kit-ui-tab.ui.dropdown-trigger-tab.tab-button"]')
    if (!moreWrap) issues.push('missing [data-testid="navigation-kit-ui-tab.ui.dropdown-trigger-tab.tab-button"] wrapper')

    const moreBtn = nav.querySelector('button[data-testid="navigation-kit-ui-tab-list.ui.more-trigger.more-tab"]')
    if (!moreBtn) {
      issues.push('missing <button data-testid="navigation-kit-ui-tab-list.ui.more-trigger.more-tab">')
    } else {
      if (moreBtn.getAttribute('aria-expanded') !== 'false') issues.push('more-trigger missing aria-expanded="false"')
      if (moreBtn.getAttribute('aria-haspopup') !== 'true') issues.push('more-trigger missing aria-haspopup="true"')
    }

    const addBtn = nav.querySelector('button[data-testid="navigation-kit-add-tab.ui.trigger"]')
    if (!addBtn) issues.push('missing <button data-testid="navigation-kit-add-tab.ui.trigger">')

    const feedback = nav.querySelector('button[data-testid="feedback-button.horizontal-nav-feedback-button"]')
    if (!feedback) issues.push('missing <button data-testid="feedback-button.horizontal-nav-feedback-button">')

    const requiredTab = [
      '_19pkidpf','_2hwxidpf','_otyridpf','_18u0idpf','_zulp1b66','_1e0c1txw',
      '_1q51pxbi','_y4ti1dlk','_85i5pxbi','_bozg12x7','_k48p1wq8','_1wybdlk8',
      '_1dyz4jg8','_o5721q9c','_4t3izwfg','_vchhusvi','_1ul91ris','_syazsi2i','_4cvr1h6o',
    ]
    for (const tab of tabs) {
      const missing = h.missingClassTokens(tab, requiredTab)
      if (missing.length) {
        issues.push(`link-tab [href="${tab.getAttribute('href')}"] missing tokens: ${missing.join(', ')}`)
        break
      }
    }
    if (active) {
      const requiredActive = [
        '_19pkidpf','_2hwxidpf','_otyridpf','_18u0idpf','_zulp1b66','_1e0c1txw','_syaz1351',
      ]
      const missingActive = h.missingClassTokens(active, requiredActive)
      if (missingActive.length) {
        issues.push('active tab missing tokens: ' + missingActive.join(', '))
      }
    }

    return { issues }
  })
}
