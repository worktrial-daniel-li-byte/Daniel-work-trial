export const id = 'board-canvas'
export const name = 'Board canvas (columns, headers, cards)'

export async function check({ appPage }) {
  return await appPage.evaluate(() => {
    const h = window.__firaHelpers
    const issues = []

    const main = document.querySelector('[data-testid="page-layout.main"]')
    if (!main) {
      issues.push('[data-testid="page-layout.main"] missing — complete earlier prompts first')
      return { issues }
    }

    const wrappers = main.querySelectorAll('[data-testid="board.content.board-wrapper"]')
    if (wrappers.length !== 1) {
      issues.push(`expected 1 board-wrapper, found ${wrappers.length}`)
      return { issues }
    }
    const wrap = wrappers[0]
    if (wrap.getAttribute('data-auto-scrollable') !== 'true') issues.push('board-wrapper missing data-auto-scrollable="true"')

    const requiredWrapper = [
      '_zulputpp','_yyhykb7n','_1ii7kb7n','_vchhusvi','_1bsb1osq','_4t3i1osq',
      '_7ccakre2','_1reo1wug','_1tkeidpf','_1ul9idpf','_kqswh2mm','_syazi7uo',
      '_bozg1ejb','_y4ti1ejb','_1q51pxbi','_85i51ejb','_1e0c11p5','_yv0e1gqb',
    ]
    const missingWrap = h.missingClassTokens(wrap, requiredWrapper)
    if (missingWrap.length) issues.push('board-wrapper missing class tokens: ' + missingWrap.join(', '))

    const cells = Array.from(wrap.children).filter((c) => c.matches('[data-testid="board.content.cell"]'))
    if (cells.length !== 3) {
      issues.push(`expected 3 board cells, found ${cells.length}`)
    }

    const requiredCell = [
      '_v5641czr','_2rkopb1k','_1e0c11p5','_2z0514iv','_1lmc1mas','_c71l1osq',
      '_vchhusvi','_1bsbgc50','_kqswh2mm','_12ji3acm','_1cwgidpf','_1qu2nqa1',
      '_12y3yh40','_bfhk1jc5',
    ]
    const requiredHeader = [
      '_nd5lyhso','_zulp1b66','_1e0c1txw','_4cvr1h6o','_kqswh2mm','_uiztglyw',
      '_59hlidpf','_3bdqt94y','_at5wt94y','_bozgutpp','_y4tiu2gc','_1q51u2gc',
      '_85i5u2gc','_bfhk1r5y','_1s1g12b0','_5fbc12b0','_16qsina5','_1ul9idpf',
      '_1xn7grho','_tdle1wug','_1d8n1wug','_80om1qgj',
    ]
    const requiredName = [
      '_zulp1b66','_1reo15vq','_18m915vq','_11c81qyo','_1e0c1ule','_1ul9idpf',
      '_1tkeidpf','_1bto1l2s','_o5721q9c','_syazazsu','_k48p1wq8',
    ]
    const requiredScroll = [
      '_nd5l1edp','_zulp1b66','_1tkeidpf','_1e0c1txw','_2lx21bp4','_1reo15vq',
      '_18m91wug','_y4ti1b66','_bozg1b66',
    ]
    const requiredCard = [
      '_2rko1mok','_v5641hrg','_p12f1ogy','_uiztglyw','_vchhusvi','_kqswh2mm',
      '_1e0c11p5','_16qst7xp','_bfhkhp5a','_85i51b66','_syazi7uo','_tzy4kb7n',
      '_lcxvglyw','_hv3wt94y','_15jnt94y',
    ]

    let firstCellIssue = false
    cells.forEach((cell, i) => {
      if (firstCellIssue) return
      const missing = h.missingClassTokens(cell, requiredCell)
      if (missing.length) {
        issues.push(`cell[${i}] missing tokens: ${missing.join(', ')}`)
        firstCellIssue = true
        return
      }

      const header = cell.querySelector('[data-testid="board.content.cell.column-header"]')
      if (!header) {
        issues.push(`cell[${i}] missing column-header`)
        firstCellIssue = true
        return
      }
      if (header.getAttribute('draggable') !== 'true') issues.push(`cell[${i}] column-header missing draggable="true"`)
      const missingH = h.missingClassTokens(header, requiredHeader)
      if (missingH.length) issues.push(`cell[${i}] column-header missing tokens: ${missingH.join(', ')}`)

      const nm = header.querySelector('[data-testid="board.content.cell.column-header.name"]')
      if (!nm) {
        issues.push(`cell[${i}] column-header missing .name child`)
      } else {
        if (nm.getAttribute('role') !== 'heading') issues.push(`cell[${i}] name missing role="heading"`)
        if (nm.getAttribute('aria-level') !== '3') issues.push(`cell[${i}] name missing aria-level="3"`)
        if (!(nm.textContent || '').trim()) issues.push(`cell[${i}] name has empty text`)
        const missingN = h.missingClassTokens(nm, requiredName)
        if (missingN.length) issues.push(`cell[${i}] name missing tokens: ${missingN.join(', ')}`)
      }

      const editBtns = header.querySelectorAll('button')
      const hasEdit = Array.from(editBtns).some((b) => /^Edit .+ status column, edit$/.test(b.getAttribute('aria-label') || ''))
      if (!hasEdit) issues.push(`cell[${i}] missing Edit <col> status column button`)

      const scroll = cell.querySelector('[data-testid="board.content.cell.scroll-container"]')
      if (!scroll) {
        issues.push(`cell[${i}] missing scroll-container`)
      } else {
        if (scroll.getAttribute('role') !== 'list') issues.push(`cell[${i}] scroll-container missing role="list"`)
        if (scroll.getAttribute('data-vc') !== 'business-board-cards-container') issues.push(`cell[${i}] scroll-container missing data-vc`)
        if (scroll.getAttribute('data-auto-scrollable') !== 'true') issues.push(`cell[${i}] scroll-container missing data-auto-scrollable="true"`)
        const missingS = h.missingClassTokens(scroll, requiredScroll)
        if (missingS.length) issues.push(`cell[${i}] scroll-container missing tokens: ${missingS.join(', ')}`)

        const cards = scroll.querySelectorAll('[data-testid="board.content.cell.card"]')
        cards.forEach((card, ci) => {
          if (card.tagName.toLowerCase() !== 'div') issues.push(`cell[${i}] card[${ci}] must be <div>`)
          if (card.getAttribute('data-vc') !== 'business-board-card') issues.push(`cell[${i}] card[${ci}] missing data-vc="business-board-card"`)
          const missingC = h.missingClassTokens(card, requiredCard)
          if (missingC.length) issues.push(`cell[${i}] card[${ci}] missing tokens: ${missingC.join(', ')}`)
        })
      }
    })

    const createBtns = wrap.querySelectorAll('button')
    const hasCreateAfter = Array.from(createBtns).some((b) => /^Create work item after work item /.test(b.getAttribute('aria-label') || ''))
    if (!hasCreateAfter) issues.push('missing button with aria-label matching ^Create work item after work item ')

    return { issues }
  })
}
