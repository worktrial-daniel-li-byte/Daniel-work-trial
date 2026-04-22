export type Card = {
  id: string
  title: string
  key: string
  priority: string
  assignee: string
}

export type Column = {
  id: string
  title: string
  cards: Card[]
}

type InitialBoardState = {
  columns: Column[]
}

const DEFAULT_BOARD_STATE: InitialBoardState = {
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      cards: [
        {
          id: 'card-fit-1',
          title: 'Ship MVP photo-to-calorie logging flow',
          key: 'FIT-1',
          priority: '↑',
          assignee: 'D',
        },
      ],
    },
    { id: 'in-progress', title: 'In Progress', cards: [] },
    { id: 'done', title: 'Done', cards: [] },
  ],
}

function cloneColumns(columns: Column[]): Column[] {
  return columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({ ...card })),
  }))
}

function isCard(value: unknown): value is Card {
  if (!value || typeof value !== 'object') {
    return false
  }

  const card = value as Partial<Card>
  return (
    typeof card.id === 'string' &&
    typeof card.title === 'string' &&
    typeof card.key === 'string' &&
    typeof card.priority === 'string' &&
    typeof card.assignee === 'string'
  )
}

function isColumn(value: unknown): value is Column {
  if (!value || typeof value !== 'object') {
    return false
  }

  const column = value as Partial<Column>
  return (
    typeof column.id === 'string' &&
    typeof column.title === 'string' &&
    Array.isArray(column.cards) &&
    column.cards.every(isCard)
  )
}

function parseInitialBoardState(value: unknown): InitialBoardState | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const state = value as Partial<InitialBoardState>
  if (!Array.isArray(state.columns) || !state.columns.every(isColumn)) {
    return null
  }

  return {
    columns: cloneColumns(state.columns),
  }
}

export function getDefaultColumns(): Column[] {
  return cloneColumns(DEFAULT_BOARD_STATE.columns)
}

export async function loadInitialColumns(): Promise<Column[]> {
  try {
    const response = await fetch('/initial-state.json', { cache: 'no-store' })
    if (!response.ok) {
      return getDefaultColumns()
    }

    const parsedState = parseInitialBoardState(await response.json())
    return parsedState ? parsedState.columns : getDefaultColumns()
  } catch {
    return getDefaultColumns()
  }
}
