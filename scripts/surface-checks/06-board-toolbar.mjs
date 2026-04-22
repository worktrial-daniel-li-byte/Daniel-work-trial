export const id = 'board-toolbar'
export const name = 'Board toolbar (filters, presence, group-by, search)'

export async function check({ appPage }) {
  return await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []

    const fs = document.querySelector('[data-testid="business-filters.ui.filters.assignee-filter"]')
    if (!fs) {
      issues.push('missing <fieldset data-testid="business-filters.ui.filters.assignee-filter">')
    } else {
      if (fs.tagName.toLowerCase() !== 'fieldset') {
        issues.push(`assignee-filter is <${fs.tagName.toLowerCase()}>, expected <fieldset>`)
      }
      const missing = h.missingClassTokens(fs, ['_19itidpf'])
      if (missing.length) issues.push('assignee-filter missing class tokens: ' + missing.join(', '))

      const trigger = fs.querySelector('button[data-testid="business-filters.ui.filters.trigger.button-wrapper"]')
      if (!trigger) {
        issues.push('missing <button data-testid="business-filters.ui.filters.trigger.button-wrapper">')
      } else {
        if (trigger.getAttribute('aria-expanded') !== 'false') issues.push('filter trigger missing aria-expanded="false"')
        if (trigger.getAttribute('aria-haspopup') !== 'true') issues.push('filter trigger missing aria-haspopup="true"')
        if (trigger.getAttribute('aria-label') !== '0 filters applied') issues.push('filter trigger missing aria-label="0 filters applied"')
        if (trigger.getAttribute('tabindex') !== '0') issues.push('filter trigger missing tabindex="0"')
        if (trigger.getAttribute('type') !== 'button') issues.push('filter trigger missing type="button"')
        const requiredTokens = [
          '_1qt3kjry','_1g9h1tex','_1umfuwj9','_6l8r3x59','_9se5176f','_12rallho',
          '_zk5uzt2a','_18vg2zyf','_192e1jcw','_fnp717ga','_1xjgvy9e','_1u0u14e8',
          '_17z218zq','_7n83frbu','_n2ul1jo4','_1cf1r7td','_1d7c1ag4','_nwukvy9e',
          '_fsjd4zrn','_z1i3eyly',
        ]
        const missingT = h.missingClassTokens(trigger, requiredTokens)
        if (missingT.length) issues.push('filter trigger missing class tokens: ' + missingT.join(', '))
      }

      const presences = fs.querySelectorAll('[data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar"]')
      if (presences.length < 1 || presences.length > 10) {
        issues.push(`presence avatar count ${presences.length} not in [1..10]`)
      }
    }

    const groupBy = Array.from(document.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === 'Group by Status',
    )
    if (!groupBy) issues.push('missing <button aria-label="Group by Status">')

    const search = Array.from(document.querySelectorAll('[role="search"]')).find(
      (e) => e.getAttribute('aria-label') === 'Search board',
    )
    if (!search) {
      issues.push('missing [role="search"][aria-label="Search board"]')
    } else if (!search.querySelector('input')) {
      issues.push('search board region missing <input>')
    }

    return { issues }
  })
}
