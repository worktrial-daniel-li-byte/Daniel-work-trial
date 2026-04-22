export const id = 'project-header'
export const name = 'Project header (avatar, title, actions)'

export async function check({ appPage }) {
  return await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []

    const hn = document.querySelector('[data-testid="horizontal-nav.ui.content.horizontal-nav"]')
    if (!hn) {
      issues.push('[data-testid="horizontal-nav.ui.content.horizontal-nav"] missing — complete prompt 04 first')
      return { issues }
    }

    const header = hn.querySelector('[data-testid="horizontal-nav-header.ui.project-header.header"]')
    if (!header) {
      issues.push('[data-testid="horizontal-nav-header.ui.project-header.header"] missing inside horizontal-nav')
      return { issues }
    }

    const missingHeaderClass = h.missingClassTokens(header, ['css-twdxlp'])
    if (missingHeaderClass.length) issues.push('project header missing class: ' + missingHeaderClass.join(', '))

    const children = Array.from(header.children)
    const img = children.find((c) => c.matches('img[data-testid="navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image"]'))
    if (!img) {
      issues.push('project header missing <img data-testid=".editable-avatar.project-icon-editable--image"> as a direct child')
    } else {
      if (img.getAttribute('data-vc') !== 'editable-avatar-project') issues.push('img missing data-vc="editable-avatar-project"')
      if (img.getAttribute('alt') !== '') issues.push('img alt must be empty string')
      if (!img.getAttribute('src')) issues.push('img missing non-empty src')
      const missing = h.missingClassTokens(img, ['_2rkofajl','_vchhusvi','_4t3igktf','_1bsbgktf'])
      if (missing.length) issues.push('img missing class tokens: ' + missing.join(', '))
    }

    const readView = header.querySelector('[data-testid="horizontal-nav-header.common.ui.read-view"]')
    if (!readView) {
      issues.push('missing [data-testid="horizontal-nav-header.common.ui.read-view"]')
    } else {
      const missing = h.missingClassTokens(readView, [
        '_1reo15vq','_18m915vq','_11c81af2','_syazfrbu','_19pk12x7','_otyr12x7','_o5721q9c','_1bto1l2s',
      ])
      if (missing.length) issues.push('read-view missing class tokens: ' + missing.join(', '))
      if (!(readView.textContent || '').trim()) issues.push('read-view has empty text content')
    }

    const actions = header.querySelector('button[data-testid="navigation-project-action-menu.ui.menu-container.themed-button"]')
    if (!actions) {
      issues.push('missing <button data-testid="navigation-project-action-menu.ui.menu-container.themed-button">')
    } else {
      if (actions.getAttribute('aria-label') !== 'Actions') issues.push('action menu button aria-label must be "Actions"')
      if (actions.getAttribute('aria-expanded') !== 'false') issues.push('action menu button missing aria-expanded="false"')
      if (actions.getAttribute('aria-haspopup') !== 'true') issues.push('action menu button missing aria-haspopup="true"')
      if (actions.getAttribute('type') !== 'button') issues.push('action menu button missing type="button"')
    }

    return { issues }
  })
}
