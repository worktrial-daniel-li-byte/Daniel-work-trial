import {
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './App.css'
import {
  Avatar,
  MenuButton,
  Popover,
  PRIORITIES,
  PriorityIcon,
  type PriorityId,
  USER_BY_ID,
  USERS,
} from './designSystem'

const TABS = [
  'Summary',
  'Board',
  'List',
  'Calendar',
  'Timeline',
  'Approvals',
  'Forms',
  'Pages',
  'More',
] as const

type Tab = (typeof TABS)[number]

function TabIcon({ tab }: { tab: Tab }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (tab) {
    case 'Summary':
      return (
        <svg {...common}>
          <title>Summary</title>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      )
    case 'Board':
      return (
        <svg {...common}>
          <title>Board</title>
          <rect x="3" y="4" width="7" height="16" rx="1.5" />
          <rect x="14" y="4" width="7" height="10" rx="1.5" />
        </svg>
      )
    case 'List':
      return (
        <svg {...common}>
          <title>List</title>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="4" cy="6" r="1" fill="currentColor" />
          <circle cx="4" cy="12" r="1" fill="currentColor" />
          <circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>
      )
    case 'Calendar':
      return (
        <svg {...common}>
          <title>Calendar</title>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      )
    case 'Timeline':
      return (
        <svg {...common}>
          <title>Timeline</title>
          <path d="M10 7h9M5 12h14M10 17h9" />
          <circle cx="7" cy="7" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </svg>
      )
    case 'Approvals':
      return (
        <svg {...common}>
          <title>Approvals</title>
          <path d="M5 12l4 4 10-10" />
        </svg>
      )
    case 'Forms':
      return (
        <svg {...common}>
          <title>Forms</title>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
    case 'Pages':
      return (
        <svg {...common}>
          <title>Pages</title>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4" />
        </svg>
      )
    default:
      return null
  }
}

type SidebarItemId =
  | 'for-you'
  | 'recent'
  | 'starred'
  | 'apps'
  | 'plans'
  | 'autoloop'
  | 'more-spaces'
  | 'create-roadmap'
  | 'import-work'
  | 'filters'
  | 'dashboards'
  | 'confluence'
  | 'goals'
  | 'teams'
  | 'more'

type SidebarIconName =
  | 'bolt'
  | 'clock'
  | 'star'
  | 'apps'
  | 'plans'
  | 'spaces'
  | 'roadmap'
  | 'import'
  | 'filter'
  | 'dashboard'
  | 'confluence'
  | 'goals'
  | 'teams'
  | 'dots'
  | 'space-autoloop'
  | 'space-more'

type SidebarItem = {
  id: SidebarItemId
  label: string
  icon: SidebarIconName
  chevron?: boolean
  badge?: string
  external?: boolean
  spaceSwatch?: boolean
}

type SidebarSection = {
  id: string
  label?: string
  labelUppercase?: boolean
  labelAction?: { label: string; message: string }
  labelMore?: boolean
  divider?: boolean
  items: SidebarItem[]
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'top',
    items: [
      { id: 'for-you', label: 'For you', icon: 'bolt' },
      { id: 'recent', label: 'Recent', icon: 'clock', chevron: true },
      { id: 'starred', label: 'Starred', icon: 'star', chevron: true },
    ],
  },
  {
    id: 'mid',
    items: [
      { id: 'apps', label: 'Apps', icon: 'apps' },
      { id: 'plans', label: 'Plans', icon: 'plans' },
    ],
  },
  {
    id: 'spaces',
    label: 'Spaces',
    labelAction: { label: 'Add space', message: 'Create space (demo).' },
    labelMore: true,
    items: [],
  },
  {
    id: 'spaces-recent',
    label: 'Recent',
    labelUppercase: true,
    items: [
      { id: 'autoloop', label: 'Autoloop', icon: 'space-autoloop', spaceSwatch: true },
      { id: 'more-spaces', label: 'More spaces', icon: 'space-more', chevron: true },
    ],
  },
  {
    id: 'rec',
    label: 'Recommended',
    labelUppercase: true,
    items: [
      { id: 'create-roadmap', label: 'Create a roadmap', icon: 'roadmap', badge: 'TRY' },
      { id: 'import-work', label: 'Import work', icon: 'import' },
    ],
  },
  {
    id: 'utils',
    items: [
      { id: 'filters', label: 'Filters', icon: 'filter' },
      { id: 'dashboards', label: 'Dashboards', icon: 'dashboard' },
    ],
  },
  {
    id: 'ext',
    divider: true,
    items: [
      { id: 'confluence', label: 'Confluence', icon: 'confluence', external: true },
      { id: 'goals', label: 'Goals', icon: 'goals', external: true },
      { id: 'teams', label: 'Teams', icon: 'teams', external: true },
    ],
  },
  {
    id: 'bot',
    items: [{ id: 'more', label: 'More', icon: 'dots' }],
  },
]

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'bolt':
      return (
        <svg {...common}>
          <title>For you</title>
          <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <title>Recent</title>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <title>Starred</title>
          <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />
        </svg>
      )
    case 'apps':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <title>Apps</title>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'plans':
      return (
        <svg {...common}>
          <title>Plans</title>
          <path d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      )
    case 'spaces':
      return (
        <svg {...common}>
          <title>Spaces</title>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
        </svg>
      )
    case 'roadmap':
      return (
        <svg {...common}>
          <title>Create a roadmap</title>
          <rect x="3" y="6" width="10" height="3" rx="1" />
          <rect x="7" y="11" width="12" height="3" rx="1" />
          <rect x="5" y="16" width="8" height="3" rx="1" />
        </svg>
      )
    case 'import':
      return (
        <svg {...common}>
          <title>Import work</title>
          <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
        </svg>
      )
    case 'filter':
      return (
        <svg {...common}>
          <title>Filters</title>
          <path d="M3 5h18l-7 9v5l-4-2v-3L3 5z" />
        </svg>
      )
    case 'dashboard':
      return (
        <svg {...common}>
          <title>Dashboards</title>
          <rect x="3" y="3" width="8" height="10" rx="1" />
          <rect x="13" y="3" width="8" height="6" rx="1" />
          <rect x="13" y="11" width="8" height="10" rx="1" />
          <rect x="3" y="15" width="8" height="6" rx="1" />
        </svg>
      )
    case 'confluence':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <title>Confluence</title>
          <path d="M3 17c3-5 7-5 10-2s6 2 8-1l-2-2c-1 1-3 1-5-1-4-3-9-3-12 3l1 3z" />
        </svg>
      )
    case 'goals':
      return (
        <svg {...common}>
          <title>Goals</title>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'teams':
      return (
        <svg {...common}>
          <title>Teams</title>
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
          <path d="M15 20c0-2 2-3.5 4-3.5s2 .5 2 2" />
        </svg>
      )
    case 'dots':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <title>More</title>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      )
    case 'space-autoloop':
      return (
        <span className="jira-sb-swatch jira-sb-swatch--blue" aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 19a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 17.8 9.1 4 4 0 0 1 17 17H6.5z" fill="white"/>
          </svg>
        </span>
      )
    case 'space-more':
      return (
        <svg {...common}>
          <title>More spaces</title>
          <circle cx="12" cy="12" r="8" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      )
    default:
      return null
  }
}

type Card = {
  id: string
  key: string
  title: string
  description: string
  priority: PriorityId
  assigneeId: string
  createdAt: number
}

type Column = {
  id: string
  title: string
  cards: Card[]
}

type GroupByMode = 'status' | 'priority' | 'assignee'

type Filters = {
  assignees: string[]
  priorities: PriorityId[]
}

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      {
        id: 'card-aut-1',
        key: 'AUT-1',
        title: 'This is a test',
        description: '',
        priority: 'medium',
        assigneeId: 'fleet',
        createdAt: Date.now(),
      },
    ],
  },
  { id: 'in-progress', title: 'In Progress', cards: [] },
  { id: 'done', title: 'Done', cards: [] },
]

type Notification = {
  id: string
  who: string
  action: string
  target: string
  time: string
  read: boolean
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', who: 'Alex Kim', action: 'mentioned you on', target: 'AUT-1', time: '12m', read: false },
  { id: 'n2', who: 'Priya Patel', action: 'assigned', target: 'AUT-2', time: '1h', read: false },
  { id: 'n3', who: 'Jordan Lee', action: 'commented on', target: 'AUT-1', time: 'Yesterday', read: true },
]

type AppState = {
  version: number
  columns: Column[]
  notifications: Notification[]
  preferences: {
    groupBy: GroupByMode
    filters: Filters
    activeSidebar: SidebarItemId
    activeTab: Tab
  }
}

const STORAGE_KEY = 'jira-autoloop-v1'
const STORAGE_VERSION = 1

function loadState(): AppState {
  const fallback: AppState = {
    version: STORAGE_VERSION,
    columns: INITIAL_COLUMNS,
    notifications: INITIAL_NOTIFICATIONS,
    preferences: {
      groupBy: 'status',
      filters: { assignees: [], priorities: [] },
      activeSidebar: 'autoloop',
      activeTab: 'Board',
    },
  }

  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as AppState
    if (parsed?.version !== STORAGE_VERSION) return fallback
    return {
      ...fallback,
      ...parsed,
      preferences: { ...fallback.preferences, ...parsed.preferences },
    }
  } catch {
    return fallback
  }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function nextIssueKey(columns: Column[]) {
  const maxNumber = columns
    .flatMap((column) => column.cards)
    .map((card) => Number(card.key.replace(/^AUT-/, '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0)
  return `AUT-${maxNumber + 1}`
}

type ComposerState =
  | {
      mode: 'create'
      columnId: string
      draft: Omit<Card, 'id' | 'createdAt'>
    }
  | {
      mode: 'edit'
      columnId: string
      cardId: string
      draft: Omit<Card, 'id' | 'createdAt'>
    }
  | null

type MenuId =
  | 'notifications'
  | 'settings'
  | 'avatar'
  | 'home'
  | 'appswitcher'
  | 'filter'
  | 'group'
  | 'view-options'
  | 'board-more'
  | 'project-actions'

export default function App() {
  const initial = useMemo(loadState, [])
  const [columns, setColumns] = useState<Column[]>(initial.columns)
  const [notifications, setNotifications] = useState<Notification[]>(initial.notifications)
  const [groupBy, setGroupBy] = useState<GroupByMode>(initial.preferences.groupBy)
  const [filters, setFilters] = useState<Filters>(initial.preferences.filters)
  const [activeSidebar, setActiveSidebar] = useState<SidebarItemId>(initial.preferences.activeSidebar)
  const [activeTab, setActiveTab] = useState<Tab>(initial.preferences.activeTab)

  const [composer, setComposer] = useState<ComposerState>(null)
  const [cardDetailId, setCardDetailId] = useState<string | null>(null)
  const [boardSearch, setBoardSearch] = useState('')
  const [topSearch, setTopSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null)
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null)
  const [columnMenuFor, setColumnMenuFor] = useState<string | null>(null)
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; fromColumnId: string } | null>(
    null,
  )
  const [dropTarget, setDropTarget] = useState<{ groupKey: string } | null>(null)
  const [showTopSearchResults, setShowTopSearchResults] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const topSearchRef = useRef<HTMLInputElement | null>(null)
  const boardSearchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    saveState({
      version: STORAGE_VERSION,
      columns,
      notifications,
      preferences: { groupBy, filters, activeSidebar, activeTab },
    })
  }, [columns, notifications, groupBy, filters, activeSidebar, activeTab])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(id)
  }, [toast])

  const flash = useCallback((message: string) => setToast(message), [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const inEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (event.key === 'Escape') {
        setOpenMenu(null)
        setComposer(null)
        setCardDetailId(null)
        setColumnMenuFor(null)
        setRenamingColumnId(null)
        setShowTopSearchResults(false)
        return
      }

      if (inEditable) return

      if (event.key === '/') {
        event.preventDefault()
        topSearchRef.current?.focus()
      } else if (event.key.toLowerCase() === 'c') {
        event.preventDefault()
        openCreateForColumn(columns[0]?.id ?? 'todo')
      } else if (event.key.toLowerCase() === 'b') {
        setActiveTab('Board')
      } else if (event.key.toLowerCase() === 'l') {
        setActiveTab('List')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns])

  const allCards = useMemo(() => columns.flatMap((c) => c.cards), [columns])

  const filteredCards = useMemo(() => {
    const q = boardSearch.trim().toLowerCase()
    return allCards.filter((card) => {
      if (filters.assignees.length && !filters.assignees.includes(card.assigneeId)) return false
      if (filters.priorities.length && !filters.priorities.includes(card.priority)) return false
      if (q) {
        const haystack = `${card.title} ${card.key}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [allCards, filters, boardSearch])

  const filteredCardIds = useMemo(() => new Set(filteredCards.map((c) => c.id)), [filteredCards])

  type Group = { key: string; title: string; cards: Card[]; meta?: ReactNode }

  const groups: Group[] = useMemo(() => {
    if (groupBy === 'status') {
      return columns.map((column) => ({
        key: column.id,
        title: column.title,
        cards: column.cards.filter((c) => filteredCardIds.has(c.id)),
      }))
    }
    if (groupBy === 'priority') {
      return PRIORITIES.map((priority) => ({
        key: priority.id,
        title: priority.label,
        cards: filteredCards.filter((c) => c.priority === priority.id),
        meta: <PriorityIcon id={priority.id} />,
      }))
    }
    return USERS.map((user) => ({
      key: user.id,
      title: user.name,
      cards: filteredCards.filter((c) => c.assigneeId === user.id),
      meta: <Avatar user={user} size="sm" />,
    }))
  }, [groupBy, columns, filteredCards, filteredCardIds])

  const topSearchResults = useMemo(() => {
    const q = topSearch.trim().toLowerCase()
    if (!q) return []
    return allCards
      .filter((c) => `${c.title} ${c.key}`.toLowerCase().includes(q))
      .slice(0, 6)
  }, [topSearch, allCards])

  const unreadCount = notifications.filter((n) => !n.read).length

  function findCardLocation(cardId: string) {
    for (const column of columns) {
      const card = column.cards.find((c) => c.id === cardId)
      if (card) return { column, card }
    }
    return null
  }

  function openCreateForColumn(columnId: string) {
    setComposer({
      mode: 'create',
      columnId,
      draft: {
        key: nextIssueKey(columns),
        title: '',
        description: '',
        priority: 'medium',
        assigneeId: USERS[0].id,
      },
    })
  }

  function openCardDetail(cardId: string) {
    setCardDetailId(cardId)
  }

  function closeComposer() {
    setComposer(null)
  }

  function saveComposer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!composer) return
    const title = composer.draft.title.trim()
    if (!title) return
    const key = composer.draft.key.trim() || nextIssueKey(columns)

    setColumns((cols) =>
      cols.map((col) => {
        if (col.id !== composer.columnId) return col
        if (composer.mode === 'create') {
          return {
            ...col,
            cards: [
              ...col.cards,
              {
                ...composer.draft,
                title,
                key,
                id: newId('card'),
                createdAt: Date.now(),
              },
            ],
          }
        }
        return {
          ...col,
          cards: col.cards.map((card) =>
            card.id === composer.cardId
              ? {
                  ...card,
                  ...composer.draft,
                  title,
                  key,
                }
              : card,
          ),
        }
      }),
    )
    if (composer.mode === 'create') flash(`Created ${key}`)
    closeComposer()
  }

  function updateCard(cardId: string, updates: Partial<Card>) {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        cards: col.cards.map((card) => (card.id === cardId ? { ...card, ...updates } : card)),
      })),
    )
  }

  function moveCardToColumn(cardId: string, toColumnId: string) {
    setColumns((cols) => {
      let moved: Card | null = null
      const withoutCard = cols.map((col) => {
        const found = col.cards.find((c) => c.id === cardId)
        if (found) moved = found
        return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
      })
      if (!moved) return cols
      return withoutCard.map((col) =>
        col.id === toColumnId ? { ...col, cards: [...col.cards, moved as Card] } : col,
      )
    })
  }

  function deleteCard(cardId: string) {
    const location = findCardLocation(cardId)
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    )
    setCardDetailId((current) => (current === cardId ? null : current))
    setComposer((current) =>
      current?.mode === 'edit' && current.cardId === cardId ? null : current,
    )
    if (location) flash(`Deleted ${location.card.key}`)
  }

  function addColumn() {
    const title = window.prompt('New column name')?.trim()
    if (!title) return
    setColumns((cols) => [...cols, { id: newId('col'), title, cards: [] }])
  }

  function renameColumn(columnId: string, title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    setColumns((cols) => cols.map((col) => (col.id === columnId ? { ...col, title: trimmed } : col)))
  }

  function deleteColumn(columnId: string) {
    const column = columns.find((c) => c.id === columnId)
    if (!column) return
    if (column.cards.length) {
      const confirmed = window.confirm(
        `Delete ${column.title}? ${column.cards.length} card(s) will be removed.`,
      )
      if (!confirmed) return
    }
    setColumns((cols) => cols.filter((c) => c.id !== columnId))
    flash(`Deleted ${column.title}`)
  }

  function handleDragStart(cardId: string) {
    const location = findCardLocation(cardId)
    setDraggedCard({ fromColumnId: location?.column.id ?? '', cardId })
    setDropTarget(null)
  }

  function handleDragEnd() {
    setDraggedCard(null)
    setDropTarget(null)
  }

  function handleDragOver(event: DragEvent<HTMLElement>, groupKey: string) {
    event.preventDefault()
    if (dropTarget?.groupKey !== groupKey) setDropTarget({ groupKey })
  }

  function handleDrop(groupKey: string) {
    if (!draggedCard) return
    const { cardId } = draggedCard
    if (groupBy === 'status') {
      moveCardToColumn(cardId, groupKey)
    } else if (groupBy === 'priority') {
      updateCard(cardId, { priority: groupKey as PriorityId })
    } else {
      updateCard(cardId, { assigneeId: groupKey })
    }
    handleDragEnd()
  }

  function toggleNotificationsRead() {
    setNotifications((items) => items.map((n) => ({ ...n, read: true })))
  }

  function toggleFilter<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  }

  const activeFilterCount = filters.assignees.length + filters.priorities.length

  const detailCard = cardDetailId ? findCardLocation(cardDetailId) : null

  const disableColumnEditing = groupBy !== 'status'

  function toggleMenu(id: MenuId) {
    setOpenMenu((current) => (current === id ? null : id))
  }

  function renderWorkspaceContent() {
    if (activeSidebar !== 'autoloop') {
      return (
        <SpaceholderPage
          title={SIDEBAR_SECTIONS.flatMap((s) => s.items).find((i) => i.id === activeSidebar)?.label ?? 'Coming soon'}
          onBack={() => setActiveSidebar('autoloop')}
        />
      )
    }

    return (
      <>
        <div className="jira-project-top">
          <div className="jira-eyebrow"><span><span>Spaces</span></span></div>
          <div className="jira-title-row">
            <span className="jira-project-swatch" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 19a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 17.8 9.1 4 4 0 0 1 17 17H6.5z" fill="white"/>
              </svg>
            </span>
            <h1 className="jira-project-name">Autoloop</h1>
            <button
              type="button"
              className="jira-icon-btn jira-tiny"
              aria-label="Give access"
              title="Give access"
              onClick={() => flash('Members (demo).')}
            >
              <span className="sr-only">Give people access</span>
              <span className="icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <title>Give people access</title>
                  <circle cx="9" cy="9" r="3" />
                  <circle cx="17" cy="10" r="2.5" />
                  <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
                  <path d="M15 19c0-2 2-3.5 4-3.5s2 .5 2 2" />
                </svg>
              </span>
            </button>
            <div className="jira-rel">
              <button
                type="button"
                className="jira-icon-btn jira-tiny"
                aria-label="More actions"
                title="More actions"
                onClick={() => toggleMenu('project-actions')}
              >
                <span className="sr-only">More project actions</span>
                <span className="icon-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <title>More actions</title>
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </span>
              </button>
              <Popover open={openMenu === 'project-actions'} onClose={() => setOpenMenu(null)} align="left">
                <MenuButton onClick={() => { flash('Project settings are not implemented in this demo.'); setOpenMenu(null) }}>Project settings</MenuButton>
                <MenuButton onClick={() => { flash('Starred Autoloop.'); setOpenMenu(null) }}>Star project</MenuButton>
                <MenuButton onClick={() => { copyBoardLink(); setOpenMenu(null) }}>Copy board link</MenuButton>
              </Popover>
            </div>
            <div className="jira-title-row__spacer" />
            <div className="actions-inner" style={{ display: 'contents' }}>
            <button type="button" className="jira-icon-btn jira-tiny" aria-label="Share" title="Share" onClick={() => flash('Share (demo).')}>
              <span className="sr-only">Share board</span>
              <span className="icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <title>Share</title>
                  <circle cx="6" cy="12" r="2.5" />
                  <circle cx="18" cy="6" r="2.5" />
                  <circle cx="18" cy="18" r="2.5" />
                  <path d="M8 11l8-4M8 13l8 4" />
                </svg>
              </span>
            </button>
            <button type="button" className="jira-icon-btn jira-tiny" aria-label="Automation" title="Automation" onClick={() => flash('Automations (demo).')}>
              <span className="sr-only">Automation rules</span>
              <span className="icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <title>Automation</title>
                  <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
                </svg>
              </span>
            </button>
            <button type="button" className="jira-icon-btn jira-tiny" aria-label="Integrations" title="Integrations" onClick={() => flash('Integrations (demo).')}>
              <span className="sr-only">Integrations</span>
              <span className="icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <title>Integrations</title>
                  <path d="M4 8h10a4 4 0 1 1 0 8H4M20 16H10a4 4 0 1 0 0-8h10" />
                </svg>
              </span>
            </button>
            <button type="button" className="jira-icon-btn jira-tiny" aria-label="Enter full screen" title="Enter full screen" onClick={() => flash('Expand (demo).')}>
              <span className="sr-only">Enter full screen</span>
              <span className="icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <title>Enter full screen</title>
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
              </span>
            </button>
            </div>
          </div>
          <nav className="jira-tabs" aria-label="Project">
            <div className="tab-list-inner" style={{ display: 'contents' }}>
            {TABS.map((tab) => (
              <span key={tab} className="tab-wrapper" style={{ display: 'contents' }}>
              <button
                type="button"
                className={tab === activeTab ? 'jira-tab is-active' : 'jira-tab'}
                title={tab}
                aria-label={tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab !== 'More' ? (
                  <span className="jira-tab__icon tab-icon" aria-hidden>
                    <span className="icon-wrap">
                      <TabIcon tab={tab} />
                    </span>
                  </span>
                ) : null}
                <span className="tab-text"><span>{tab}</span></span>
                {tab === 'More' ? <span className="jira-tab__pill"><span><span>4</span></span></span> : null}
              </button>
              </span>
            ))}
            </div>
            <button
              type="button"
              className="jira-tab jira-tab--add"
              aria-label="Add view"
              title="Add view"
              onClick={() => flash('Tab customization is not implemented in this demo.')}
            >
              +
            </button>
          </nav>
          {activeTab === 'Board' || activeTab === 'List' ? (
            <div className="jira-board-bar">
              <div className="jira-board-bar__left">
                <div className="jira-field jira-field--search">
                  <span className="jira-field__icon" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <title>Search</title>
                      <circle cx="10.5" cy="10.5" r="6.5" />
                      <path d="M16 16l4 4" />
                    </svg>
                  </span>
                  <input
                    ref={boardSearchRef}
                    type="search"
                    placeholder="Search board"
                    aria-label="Search this board"
                    title="Search this board"
                    value={boardSearch}
                    onChange={(event) => setBoardSearch(event.target.value)}
                  />
                </div>
                <span
                  className="jira-board-bar__avatar-stack"
                  role="img"
                  aria-label="Assigned members"
                  title="1 member assigned"
                >
                  <span><span className="jira-board-bar__avatar jira-board-bar__avatar--pink" aria-hidden /></span>
                  <span><span className="jira-board-bar__avatar jira-board-bar__avatar--dl">DL</span></span>
                  <span className="sr-only">Assignees: DL</span>
                </span>
                <div className="jira-rel">
                  <button
                    type="button"
                    className={
                      activeFilterCount
                        ? 'jira-btn jira-btn--ghost jira-btn--sm is-active'
                        : 'jira-btn jira-btn--ghost jira-btn--sm'
                    }
                    aria-label="Filter"
                    title="Filter"
                    onClick={() => toggleMenu('filter')}
                  >
                    <span className="filter-icon" aria-hidden />
                    <span>Filter</span>
                    {activeFilterCount ? (
                      <span className="jira-count-badge">{activeFilterCount}</span>
                    ) : null}
                    <span>
                      <svg className="jira-chevron" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <title>Filter</title>
                        <path d="M7 10l5 5 5-5H7z" />
                      </svg>
                    </span>
                  </button>
                  <Popover open={openMenu === 'filter'} onClose={() => setOpenMenu(null)} align="left" className="jira-popover--wide">
                    <div className="jira-popover__section">
                      <div className="jira-popover__title">Assignee</div>
                      {USERS.map((user) => {
                        const active = filters.assignees.includes(user.id)
                        return (
                          <label key={user.id} className="jira-popover__option">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() =>
                                setFilters((f) => ({ ...f, assignees: toggleFilter(f.assignees, user.id) }))
                              }
                            />
                            <Avatar user={user} size="sm" />
                            <span>{user.name}</span>
                          </label>
                        )
                      })}
                    </div>
                    <div className="jira-popover__section">
                      <div className="jira-popover__title">Priority</div>
                      {PRIORITIES.map((priority) => {
                        const active = filters.priorities.includes(priority.id)
                        return (
                          <label key={priority.id} className="jira-popover__option">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() =>
                                setFilters((f) => ({
                                  ...f,
                                  priorities: toggleFilter(f.priorities, priority.id),
                                }))
                              }
                            />
                            <PriorityIcon id={priority.id} withLabel />
                          </label>
                        )
                      })}
                    </div>
                    <div className="jira-popover__footer">
                      <button
                        type="button"
                        className="jira-btn jira-btn--ghost jira-btn--sm"
                        onClick={() => setFilters({ assignees: [], priorities: [] })}
                      >
                        Clear all
                      </button>
                    </div>
                  </Popover>
                </div>
              </div>
              <div className="jira-board-bar__right">
                <div className="jira-rel">
                  <button
                    type="button"
                    className="jira-btn jira-btn--ghost jira-btn--sm"
                    aria-label="Group by"
                    title="Group by"
                    onClick={() => toggleMenu('group')}
                  >
                    <span>Group:</span> <span>{groupBy === 'status' ? 'Status' : groupBy === 'priority' ? 'Priority' : 'Assignee'}</span>
                    <svg className="jira-chevron" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <title>Group by</title>
                      <path d="M7 10l5 5 5-5H7z" />
                    </svg>
                  </button>
                  <Popover open={openMenu === 'group'} onClose={() => setOpenMenu(null)}>
                    {(['status', 'priority', 'assignee'] as GroupByMode[]).map((mode) => (
                      <MenuButton
                        key={mode}
                        selected={groupBy === mode}
                        onClick={() => {
                          setGroupBy(mode)
                          setOpenMenu(null)
                        }}
                      >
                        {mode === 'status' ? 'Status' : mode === 'priority' ? 'Priority' : 'Assignee'}
                      </MenuButton>
                    ))}
                  </Popover>
                </div>
                <div className="jira-rel">
                  <button
                    type="button"
                    className="jira-icon-btn"
                    aria-label="Board settings"
                    title="Board settings"
                    onClick={() => toggleMenu('view-options')}
                  >
                    <span className="sr-only">Board settings</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                      <title>Board settings</title>
                      <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                    </svg>
                  </button>
                  <Popover open={openMenu === 'view-options'} onClose={() => setOpenMenu(null)}>
                    <MenuButton
                      selected={activeTab === 'Board'}
                      onClick={() => {
                        setActiveTab('Board')
                        setOpenMenu(null)
                      }}
                    >
                      Board
                    </MenuButton>
                    <MenuButton
                      selected={activeTab === 'List'}
                      onClick={() => {
                        setActiveTab('List')
                        setOpenMenu(null)
                      }}
                    >
                      List
                    </MenuButton>
                  </Popover>
                </div>
                <div className="jira-rel">
                  <button
                    type="button"
                    className="jira-icon-btn"
                    aria-label="More board actions"
                    title="More board actions"
                    onClick={() => toggleMenu('board-more')}
                  >
                    <span className="sr-only">More</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                      <title>More board actions</title>
                      <circle cx="5" cy="12" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="19" cy="12" r="1.6" />
                    </svg>
                  </button>
                  <Popover open={openMenu === 'board-more'} onClose={() => setOpenMenu(null)}>
                    <MenuButton onClick={() => { resetBoard(); setOpenMenu(null) }}>Reset sample data</MenuButton>
                    <MenuButton onClick={() => { exportBoard(); setOpenMenu(null) }}>Export as JSON</MenuButton>
                    <MenuButton
                      onClick={() => {
                        setFilters({ assignees: [], priorities: [] })
                        setBoardSearch('')
                        setGroupBy('status')
                        setOpenMenu(null)
                        flash('View reset')
                      }}
                    >
                      Reset view
                    </MenuButton>
                  </Popover>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {activeTab === 'Board' ? (
          <BoardView
            groups={groups}
            groupBy={groupBy}
            disableColumnEditing={disableColumnEditing}
            renamingColumnId={renamingColumnId}
            onStartRenameColumn={(id) => setRenamingColumnId(id)}
            onRenameColumn={(id, title) => {
              renameColumn(id, title)
              setRenamingColumnId(null)
            }}
            onCancelRenameColumn={() => setRenamingColumnId(null)}
            columnMenuFor={columnMenuFor}
            onOpenColumnMenu={setColumnMenuFor}
            onDeleteColumn={deleteColumn}
            onAddColumn={addColumn}
            onOpenCard={openCardDetail}
            onDeleteCard={deleteCard}
            onCreateCardForColumn={openCreateForColumn}
            onEditCardShortcut={(card) => {
              const location = findCardLocation(card.id)
              if (!location) return
              setComposer({
                mode: 'edit',
                columnId: location.column.id,
                cardId: card.id,
                draft: {
                  key: card.key,
                  title: card.title,
                  description: card.description,
                  priority: card.priority,
                  assigneeId: card.assigneeId,
                },
              })
            }}
            dropTarget={dropTarget}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ) : null}

        {activeTab === 'List' ? (
          <ListView
            cards={filteredCards}
            columns={columns}
            onOpenCard={openCardDetail}
            onUpdateCard={updateCard}
            onDeleteCard={deleteCard}
            onMoveCard={moveCardToColumn}
          />
        ) : null}

        {activeTab === 'Summary' ? (
          <SummaryView columns={columns} filteredCards={allCards} onJumpToBoard={() => setActiveTab('Board')} />
        ) : null}

        {activeTab !== 'Board' && activeTab !== 'List' && activeTab !== 'Summary' ? (
          <PlaceholderTab tab={activeTab} onGoToBoard={() => setActiveTab('Board')} />
        ) : null}
      </>
    )
  }

  function resetBoard() {
    if (!window.confirm('Reset board to sample data? This removes all your cards.')) return
    setColumns(INITIAL_COLUMNS)
    setNotifications(INITIAL_NOTIFICATIONS)
    setFilters({ assignees: [], priorities: [] })
    setBoardSearch('')
    setGroupBy('status')
    flash('Board reset')
  }

  function exportBoard() {
    const blob = new Blob([JSON.stringify({ columns }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'autoloop-board.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function copyBoardLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      flash('Board link copied')
    } catch {
      flash('Could not copy link')
    }
  }

  return (
    <div className="jira-app">
      <header className="jira-topbar">
        <div className="jira-topbar__left">
          <button
            type="button"
            className="jira-sb-brand-btn"
            aria-label="Expand sidebar"
            title="Expand sidebar"
            onClick={() => flash('Sidebar toggle (demo).')}
          >
            <span className="sr-only">Collapse sidebar</span>
            <span className="icon-wrap"><span><span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <title>Collapse sidebar</title>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
              </svg>
            </span></span></span>
          </button>
          <button
            type="button"
            className="jira-sb-brand-btn"
            aria-label="App switcher"
            title="Switch to…"
            onClick={() => flash('App switcher (demo).')}
          >
            <span className="sr-only">App switcher</span>
            <span className="icon-wrap"><span><span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <title>App switcher</title>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span></span></span>
          </button>
          <div className="brand">
            <span className="brand-logo">
              <span className="jira-sb-brand-logo" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <title>Jira</title>
                  <path d="M11.53 2 2 11.53a.67.67 0 0 0 0 .94l5.77 5.77a.67.67 0 0 0 .94 0L12 15l3.29 3.29a.67.67 0 0 0 .94 0L22 12.47a.67.67 0 0 0 0-.94L12.47 2a.67.67 0 0 0-.94 0Z"/>
                </svg>
              </span>
            </span>
            <span className="brand-name"><span><span className="jira-sb-brand-text"><span><span>Jira</span></span></span></span></span>
          </div>
        </div>

        <div className="jira-topbar__center">
        <div className="jira-topbar__search jira-rel">
          <span className="jira-topbar__search-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <title>Search</title>
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M16 16l4 4" />
            </svg>
          </span>
          <input
            ref={topSearchRef}
            type="search"
            placeholder="Search"
            aria-label="Search"
            title="Search"
            className="jira-search-input"
            value={topSearch}
            onFocus={() => setShowTopSearchResults(true)}
            onChange={(event) => {
              setTopSearch(event.target.value)
              setShowTopSearchResults(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setShowTopSearchResults(false)
              if (event.key === 'Enter' && topSearchResults[0]) {
                openCardDetail(topSearchResults[0].id)
                setShowTopSearchResults(false)
              }
            }}
          />
          {showTopSearchResults && topSearch.trim() ? (
            <Popover
              open
              onClose={() => setShowTopSearchResults(false)}
              align="left"
              className="jira-popover--wide jira-popover--full"
            >
              {topSearchResults.length === 0 ? (
                <div className="jira-popover__empty">No matches</div>
              ) : (
                topSearchResults.map((card) => (
                  <MenuButton
                    key={card.id}
                    onClick={() => {
                      setActiveSidebar('autoloop')
                      setActiveTab('Board')
                      openCardDetail(card.id)
                      setShowTopSearchResults(false)
                    }}
                  >
                    <span className="jira-key">{card.key}</span>
                    <span className="jira-menu-ellipsis">{card.title}</span>
                  </MenuButton>
                ))
              )}
            </Popover>
          ) : null}
        </div>

        <button
          type="button"
          className="jira-btn jira-btn--create"
          aria-label="Create"
          title="Create"
          onClick={() => openCreateForColumn(columns[0]?.id ?? 'todo')}
        >
          <span><span aria-hidden>+</span></span> <span><span>Create</span></span>
        </button>
        </div>

        <div className="jira-topbar__right">
          <button
            type="button"
            className="jira-pill jira-pill--trial"
            aria-label="Premium trial"
            title="Premium trial"
            onClick={() => flash('Premium trial: thanks for the interest!')}
          >
            <span className="btn-icon"><span className="jira-pill__diamond" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="premGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6554c0" />
                    <stop offset="50%" stopColor="#8777d9" />
                    <stop offset="100%" stopColor="#b3a4f1" />
                  </linearGradient>
                </defs>
                <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="url(#premGrad)" />
              </svg>
            </span></span>
            <span className="btn-text">Premium trial</span>
          </button>
          <button
            type="button"
            className="jira-pill jira-pill--rovo"
            aria-label="Ask Rovo"
            title="Ask Rovo"
            onClick={() => flash('Rovo says: ship it.')}
          >
            <span className="btn-icon"><span className="jira-rovo-cube" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="rovoA" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff5630" />
                    <stop offset="50%" stopColor="#ffab00" />
                    <stop offset="100%" stopColor="#ff7452" />
                  </linearGradient>
                  <linearGradient id="rovoB" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0065ff" />
                    <stop offset="100%" stopColor="#4c9aff" />
                  </linearGradient>
                  <linearGradient id="rovoC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#36b37e" />
                    <stop offset="100%" stopColor="#00b8d9" />
                  </linearGradient>
                </defs>
                <path d="M12 2 L22 7 L12 12 L2 7 Z" fill="url(#rovoA)" />
                <path d="M12 12 L22 7 L22 17 L12 22 Z" fill="url(#rovoB)" />
                <path d="M12 12 L2 7 L2 17 L12 22 Z" fill="url(#rovoC)" />
              </svg>
            </span></span>
            <span className="btn-text"><span>Ask Rovo</span></span>
          </button>
          <div className="jira-rel topbar-bell">
            <button
              type="button"
              className="jira-icon-btn"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => toggleMenu('notifications')}
            >
              <span className="sr-only">Notifications</span>
              <span className="icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <title>Notifications</title>
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
            </button>
            <span className="badge">3+</span>
            <Popover open={openMenu === 'notifications'} onClose={() => setOpenMenu(null)} className="jira-popover--wide">
              <div className="jira-popover__header">
                <span>Notifications</span>
                <button
                  type="button"
                  className="jira-link-btn"
                  onClick={() => {
                    toggleNotificationsRead()
                  }}
                >
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="jira-popover__empty">You're all caught up</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={
                      notification.read ? 'jira-notification' : 'jira-notification is-unread'
                    }
                  >
                    <div className="jira-notification__dot" />
                    <div>
                      <div>
                        <strong>{notification.who}</strong> {notification.action}{' '}
                        <a
                          href="#"
                          onClick={(event) => {
                            event.preventDefault()
                            const card = allCards.find((c) => c.key === notification.target)
                            if (card) {
                              openCardDetail(card.id)
                              setOpenMenu(null)
                            }
                          }}
                        >
                          {notification.target}
                        </a>
                      </div>
                      <div className="jira-notification__time">{notification.time}</div>
                    </div>
                  </div>
                ))
              )}
            </Popover>
          </div>
          <div className="jira-rel">
            <button
              type="button"
              className="jira-icon-btn"
              aria-label="Settings"
              title="Settings"
              onClick={() => toggleMenu('settings')}
            >
              <span className="sr-only">Settings</span>
              <span className="icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <title>Settings</title>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </span>
            </button>
            <Popover open={openMenu === 'settings'} onClose={() => setOpenMenu(null)}>
              <MenuButton onClick={() => { flash('Personal settings opened.'); setOpenMenu(null) }}>Personal settings</MenuButton>
              <MenuButton onClick={() => { flash('Theme: System'); setOpenMenu(null) }}>Theme</MenuButton>
              <MenuButton onClick={() => { flash('Keyboard shortcuts: / search, c create, b board, l list'); setOpenMenu(null) }}>
                Keyboard shortcuts
              </MenuButton>
              <div className="jira-popover__divider" />
              <MenuButton
                onClick={() => {
                  if (window.confirm('Clear all local data?')) {
                    window.localStorage.removeItem(STORAGE_KEY)
                    window.location.reload()
                  }
                }}
              >
                Clear local data
              </MenuButton>
            </Popover>
          </div>
          <button
            type="button"
            className="jira-icon-btn jira-help-btn"
            aria-label="Help"
            title="Help"
            onClick={() => flash('Help center opened.')}
          >
            <span className="sr-only">Help</span>
            <span className="icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <title>Help</title>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </button>
          <div className="jira-rel">
            <button
              type="button"
              className="jira-avatar-button"
              onClick={() => toggleMenu('avatar')}
              aria-label="Your profile and settings"
              title="Your profile and settings"
            >
              <span className="sr-only">Your profile and settings (D L)</span>
              <span className="icon-wrap">
                <span className="jira-avatar jira-avatar--dl" aria-label="DL">DL</span>
              </span>
            </button>
            <Popover open={openMenu === 'avatar'} onClose={() => setOpenMenu(null)}>
              <div className="jira-popover__user">
                <span className="jira-avatar jira-avatar--dl">DL</span>
                <div>
                  <div className="jira-popover__user-name">DL</div>
                  <div className="jira-popover__user-meta">dl@autoloop.dev</div>
                </div>
              </div>
              <div className="jira-popover__divider" />
              <MenuButton onClick={() => { flash('Profile opened.'); setOpenMenu(null) }}>Profile</MenuButton>
              <MenuButton onClick={() => { flash('Account opened.'); setOpenMenu(null) }}>Account</MenuButton>
              <MenuButton onClick={() => { flash('Signed out (demo).'); setOpenMenu(null) }}>Sign out</MenuButton>
            </Popover>
          </div>
        </div>
      </header>

      <div className="jira-body">
        <aside className="jira-sidebar">
          <div className="jira-sidebar__scroll">
            {SIDEBAR_SECTIONS.map((section) => (
              <div
                key={section.id}
                className={
                  section.divider
                    ? 'jira-sidebar__section jira-sidebar__section--divider'
                    : 'jira-sidebar__section'
                }
              >
                {section.label ? (
                  <div
                    className={
                      section.labelUppercase
                        ? 'jira-sidebar__label jira-sidebar__label--upper'
                        : 'jira-sidebar__label'
                    }
                  >
                    <div className="sidebar-row-inner" style={{ display: 'contents' }}>
                    <span className="jira-sidebar__label-text"><span><span>{section.label}</span></span></span>
                    {section.labelAction ? (
                      <button
                        type="button"
                        className="jira-sidebar__label-action"
                        aria-label={section.labelAction.label}
                        title={section.labelAction.label}
                        onClick={() => flash(section.labelAction!.message)}
                      >
                        <span className="sr-only">{section.labelAction.label}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <title>Add space</title>
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    ) : null}
                    {section.labelMore ? (
                      <button
                        type="button"
                        className="jira-sidebar__label-action"
                        aria-label="More options"
                        title="More options"
                        onClick={() => flash('More space actions (demo).')}
                      >
                        <span className="sr-only">More options</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <title>More options</title>
                          <circle cx="5" cy="12" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="19" cy="12" r="1.6" />
                        </svg>
                      </button>
                    ) : null}
                    </div>
                  </div>
                ) : null}
                {section.items.length > 0 ? (
                  <ul>
                    {section.items.map((item) => {
                      const active = item.id === activeSidebar
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={
                              active
                                ? 'jira-sb-link is-active'
                                : 'jira-sb-link'
                            }
                            title={item.label}
                            aria-label={item.label}
                            onClick={() => setActiveSidebar(item.id)}
                          >
                            <span className="jira-sb-link__icon" aria-hidden>
                              <SidebarIcon name={item.icon} />
                            </span>
                            <span className="jira-sb-link__label"><span><span>{item.label}</span></span></span>
                            {item.badge ? (
                              <span className="jira-sb-link__badge">{item.badge}</span>
                            ) : null}
                            {item.external ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 'auto', opacity: 0.6 }}>
                                <title>Opens in new tab</title>
                                <path d="M7 17 17 7" />
                                <path d="M7 7h10v10" />
                              </svg>
                            ) : null}
                            {item.chevron ? (
                              <span className="jira-sb-link__chev" aria-hidden>
                                <span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <title>Expand</title>
                                    <path d="M9 6l6 6-6 6" />
                                  </svg>
                                </span>
                              </span>
                            ) : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </aside>

        <main className="jira-workspace">{renderWorkspaceContent()}</main>
      </div>

      {composer ? (
        <ComposerDialog
          composer={composer}
          setComposer={setComposer}
          onClose={closeComposer}
          onSubmit={saveComposer}
          onDelete={(columnId, cardId) => {
            deleteCard(cardId)
            void columnId
          }}
          columns={columns}
        />
      ) : null}

      {detailCard ? (
        <CardDetailDialog
          card={detailCard.card}
          column={detailCard.column}
          columns={columns}
          onClose={() => setCardDetailId(null)}
          onUpdate={(updates) => updateCard(detailCard.card.id, updates)}
          onMove={(toColumnId) => moveCardToColumn(detailCard.card.id, toColumnId)}
          onDelete={() => deleteCard(detailCard.card.id)}
        />
      ) : null}

      <div className="jira-fab" role="presentation" title="Rovo">
        <span><span><span><span className="jira-fab__ring" /></span></span></span>
      </div>

      {toast ? <div className="jira-toast" role="status">{toast}</div> : null}
    </div>
  )
}

type BoardViewProps = {
  groups: { key: string; title: string; cards: Card[]; meta?: ReactNode }[]
  groupBy: GroupByMode
  disableColumnEditing: boolean
  renamingColumnId: string | null
  onStartRenameColumn: (id: string) => void
  onRenameColumn: (id: string, title: string) => void
  onCancelRenameColumn: () => void
  columnMenuFor: string | null
  onOpenColumnMenu: (id: string | null) => void
  onDeleteColumn: (id: string) => void
  onAddColumn: () => void
  onOpenCard: (cardId: string) => void
  onDeleteCard: (cardId: string) => void
  onCreateCardForColumn: (columnId: string) => void
  onEditCardShortcut: (card: Card) => void
  dropTarget: { groupKey: string } | null
  onDragStart: (cardId: string) => void
  onDragOver: (event: DragEvent<HTMLElement>, groupKey: string) => void
  onDragEnd: () => void
  onDrop: (groupKey: string) => void
}

function BoardView({
  groups,
  groupBy,
  disableColumnEditing,
  renamingColumnId,
  onStartRenameColumn,
  onRenameColumn,
  onCancelRenameColumn,
  columnMenuFor,
  onOpenColumnMenu,
  onDeleteColumn,
  onAddColumn,
  onOpenCard,
  onDeleteCard,
  onCreateCardForColumn,
  onEditCardShortcut,
  dropTarget,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: BoardViewProps) {
  void onDeleteColumn
  void columnMenuFor
  void onOpenColumnMenu
  return (
    <div className="jira-board-canvas">
      <div className="jira-columns">
        {groups.map((group) => (
          <div
            key={group.key}
            className={dropTarget?.groupKey === group.key ? 'jira-col is-drop-target' : 'jira-col'}
            onDragOver={(event) => onDragOver(event, group.key)}
            onDrop={() => onDrop(group.key)}
          >
            <div className="jira-col__head">
              {group.meta}
              {groupBy === 'status' && renamingColumnId === group.key ? (
                <input
                  autoFocus
                  className="jira-col__rename"
                  defaultValue={group.title}
                  onBlur={(event) => onRenameColumn(group.key, event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onRenameColumn(group.key, event.currentTarget.value)
                    if (event.key === 'Escape') onCancelRenameColumn()
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="jira-col__title-btn"
                  onClick={() => {
                    if (!disableColumnEditing && groupBy === 'status') onStartRenameColumn(group.key)
                  }}
                  title={disableColumnEditing ? group.title : 'Click to rename'}
                >
                  <span className="col-label">{group.title}</span>
                </button>
              )}
              <span className="jira-col__count"><span>{group.cards.length}</span></span>
            </div>
            <div className="jira-col__cards">
              <div className="col-inner" style={{ display: 'contents' }}>
              {group.cards.map((card) => (
                <article
                  key={card.id}
                  className="jira-card"
                  draggable
                  onDragStart={() => onDragStart(card.id)}
                  onDragEnd={onDragEnd}
                >
                  <div className="jira-card__actions">
                    <button
                      type="button"
                      className="jira-card__action"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEditCardShortcut(card)
                      }}
                      aria-label={`Edit ${card.title}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="jira-card__action jira-card__action--danger"
                      onClick={(event) => {
                        event.stopPropagation()
                        if (window.confirm(`Delete ${card.key}?`)) onDeleteCard(card.id)
                      }}
                      aria-label={`Delete ${card.title}`}
                    >
                      Delete
                    </button>
                  </div>
                  <button
                    type="button"
                    className="jira-card__open"
                    onClick={() => onOpenCard(card.id)}
                  >
                    <p className="jira-card__title"><span><span>{card.title}</span></span></p>
                    <div className="jira-card__meta">
                      <span
                        className="jira-issue-type"
                        role="img"
                        aria-label="Task"
                        title="Task"
                      >
                        <span className="icon-wrap">
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <title>Task</title>
                            <path d="M3 8.5l3 3 7-7" />
                          </svg>
                        </span>
                        <span className="sr-only">Task</span>
                      </span>
                      <span className="jira-key"><span>{card.key}</span></span>
                      <span
                        className="jira-card__priority"
                        role="img"
                        aria-label={`${PRIORITIES.find((p) => p.id === card.priority)?.label ?? 'Medium'} priority`}
                        title={`${PRIORITIES.find((p) => p.id === card.priority)?.label ?? 'Medium'} priority`}
                      >
                        <span className="icon-wrap">
                          <PriorityIcon id={card.priority} />
                        </span>
                        <span className="sr-only">
                          Priority: {PRIORITIES.find((p) => p.id === card.priority)?.label ?? 'Medium'}
                        </span>
                      </span>
                      <div style={{ marginLeft: 'auto' }}>
                        <span
                          className="jira-user-silhouette"
                          role="img"
                          aria-label="Unassigned"
                          title="Unassigned"
                        >
                          <span className="icon-wrap">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6b778c" aria-hidden="true">
                              <title>Unassigned</title>
                              <circle cx="12" cy="8" r="4" />
                              <path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4v-1z" />
                            </svg>
                          </span>
                          <span className="sr-only">Unassigned</span>
                        </span>
                      </div>
                    </div>
                  </button>
                </article>
              ))}
              {groupBy === 'status' ? (
                <button
                  type="button"
                  className="jira-col__create"
                  aria-label="Create issue"
                  title="Create issue"
                  onClick={() => onCreateCardForColumn(group.key)}
                >
                  <span><span>+</span></span> <span><span>Create</span></span>
                </button>
              ) : null}
              </div>
            </div>
          </div>
        ))}
        {groupBy === 'status' ? (
          <button type="button" className="jira-col-add" aria-label="Create column" title="Create column" onClick={onAddColumn}>
            <span className="sr-only">Create column</span>
            <span>+</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ListView({
  cards,
  columns,
  onOpenCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
}: {
  cards: Card[]
  columns: Column[]
  onOpenCard: (cardId: string) => void
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void
  onDeleteCard: (cardId: string) => void
  onMoveCard: (cardId: string, toColumnId: string) => void
}) {
  function columnOf(cardId: string) {
    return columns.find((col) => col.cards.some((c) => c.id === cardId))
  }

  return (
    <div className="jira-list">
      <div className="jira-list__scroll">
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Summary</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={6} className="jira-list__empty">
                  No cards match the current filters.
                </td>
              </tr>
            ) : (
              cards.map((card) => {
                const column = columnOf(card.id)
                return (
                  <tr key={card.id}>
                    <td>
                      <button type="button" className="jira-link-btn" onClick={() => onOpenCard(card.id)}>
                        {card.key}
                      </button>
                    </td>
                    <td>
                      <button type="button" className="jira-link-btn" onClick={() => onOpenCard(card.id)}>
                        {card.title}
                      </button>
                    </td>
                    <td>
                      <select
                        value={column?.id ?? ''}
                        onChange={(event) => onMoveCard(card.id, event.target.value)}
                      >
                        {columns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={card.priority}
                        onChange={(event) =>
                          onUpdateCard(card.id, { priority: event.target.value as PriorityId })
                        }
                      >
                        {PRIORITIES.map((priority) => (
                          <option key={priority.id} value={priority.id}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={card.assigneeId}
                        onChange={(event) => onUpdateCard(card.id, { assigneeId: event.target.value })}
                      >
                        {USERS.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="jira-link-btn jira-link-btn--danger"
                        onClick={() => {
                          if (window.confirm(`Delete ${card.key}?`)) onDeleteCard(card.id)
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryView({
  columns,
  filteredCards,
  onJumpToBoard,
}: {
  columns: Column[]
  filteredCards: Card[]
  onJumpToBoard: () => void
}) {
  const totalCards = filteredCards.length
  const byPriority = PRIORITIES.map((priority) => ({
    priority,
    count: filteredCards.filter((c) => c.priority === priority.id).length,
  }))
  const byAssignee = USERS.map((user) => ({
    user,
    count: filteredCards.filter((c) => c.assigneeId === user.id).length,
  })).filter((row) => row.count > 0)

  return (
    <div className="jira-summary">
      <div className="jira-summary__cards">
        {columns.map((column) => {
          const share = totalCards === 0 ? 0 : Math.round((column.cards.length / totalCards) * 100)
          return (
            <div key={column.id} className="jira-summary__stat">
              <div className="jira-summary__stat-title">{column.title}</div>
              <div className="jira-summary__stat-value">{column.cards.length}</div>
              <div className="jira-summary__bar">
                <span style={{ width: `${share}%` }} />
              </div>
              <div className="jira-summary__stat-meta">{share}% of total</div>
            </div>
          )
        })}
      </div>

      <div className="jira-summary__grid">
        <div className="jira-summary__panel">
          <div className="jira-summary__panel-title">Priority breakdown</div>
          <ul className="jira-summary__list">
            {byPriority.map((row) => (
              <li key={row.priority.id}>
                <PriorityIcon id={row.priority.id} withLabel />
                <span className="jira-summary__list-count">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="jira-summary__panel">
          <div className="jira-summary__panel-title">Team workload</div>
          <ul className="jira-summary__list">
            {byAssignee.length === 0 ? (
              <li className="jira-summary__empty">No cards assigned</li>
            ) : (
              byAssignee.map((row) => (
                <li key={row.user.id}>
                  <Avatar user={row.user} size="sm" />
                  <span>{row.user.name}</span>
                  <span className="jira-summary__list-count">{row.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <button type="button" className="jira-btn jira-btn--primary" onClick={onJumpToBoard}>
        Open board
      </button>
    </div>
  )
}

function PlaceholderTab({ tab, onGoToBoard }: { tab: Tab; onGoToBoard: () => void }) {
  return (
    <div className="jira-placeholder">
      <h2>{tab}</h2>
      <p>The {tab} view is not implemented in this demo.</p>
      <button type="button" className="jira-btn jira-btn--primary" onClick={onGoToBoard}>
        Back to board
      </button>
    </div>
  )
}

function SpaceholderPage({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="jira-placeholder">
      <h2>{title}</h2>
      <p>{title} is a placeholder space in this demo. Pick Autoloop on the left to return to the board.</p>
      <button type="button" className="jira-btn jira-btn--primary" onClick={onBack}>
        Go to Autoloop
      </button>
    </div>
  )
}

function ComposerDialog({
  composer,
  setComposer,
  onClose,
  onSubmit,
  onDelete,
  columns,
}: {
  composer: Exclude<ComposerState, null>
  setComposer: (composer: ComposerState) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete: (columnId: string, cardId: string) => void
  columns: Column[]
}) {
  function updateDraft(updates: Partial<Omit<Card, 'id' | 'createdAt'>>) {
    setComposer({ ...composer, draft: { ...composer.draft, ...updates } })
  }

  return (
    <div className="jira-modal-backdrop" onClick={onClose}>
      <div className="jira-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <form className="jira-modal__form" onSubmit={onSubmit}>
          <div className="jira-modal__header">
            <h2 className="jira-modal__title">
              {composer.mode === 'create' ? 'Create issue' : `Edit ${composer.draft.key}`}
            </h2>
            <button type="button" className="jira-icon-btn" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <label className="jira-form-field">
            <span>Status</span>
            <select
              value={composer.columnId}
              onChange={(event) => setComposer({ ...composer, columnId: event.target.value })}
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </select>
          </label>

          <label className="jira-form-field">
            <span>Summary</span>
            <input
              autoFocus
              value={composer.draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="What needs to get done?"
            />
          </label>

          <label className="jira-form-field">
            <span>Description</span>
            <textarea
              value={composer.draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              placeholder="Add more detail…"
              rows={4}
            />
          </label>

          <div className="jira-form-grid">
            <label className="jira-form-field">
              <span>Priority</span>
              <select
                value={composer.draft.priority}
                onChange={(event) => updateDraft({ priority: event.target.value as PriorityId })}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="jira-form-field">
              <span>Assignee</span>
              <select
                value={composer.draft.assigneeId}
                onChange={(event) => updateDraft({ assigneeId: event.target.value })}
              >
                {USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="jira-form-field">
              <span>Issue key</span>
              <input
                value={composer.draft.key}
                onChange={(event) => updateDraft({ key: event.target.value.toUpperCase() })}
                placeholder="AUT-2"
              />
            </label>
          </div>

          <div className="jira-modal__footer">
            {composer.mode === 'edit' ? (
              <button
                type="button"
                className="jira-btn jira-btn--danger"
                onClick={() => onDelete(composer.columnId, composer.cardId)}
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="jira-modal__footer-actions">
              <button type="button" className="jira-btn jira-btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="jira-btn jira-btn--primary" disabled={!composer.draft.title.trim()}>
                {composer.mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function CardDetailDialog({
  card,
  column,
  columns,
  onClose,
  onUpdate,
  onMove,
  onDelete,
}: {
  card: Card
  column: Column
  columns: Column[]
  onClose: () => void
  onUpdate: (updates: Partial<Card>) => void
  onMove: (toColumnId: string) => void
  onDelete: () => void
}) {
  const [titleDraft, setTitleDraft] = useState(card.title)
  const [descriptionDraft, setDescriptionDraft] = useState(card.description)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)

  useEffect(() => {
    setTitleDraft(card.title)
    setDescriptionDraft(card.description)
  }, [card.id, card.title, card.description])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="jira-modal-backdrop" onClick={onClose}>
      <div
        className="jira-modal jira-modal--wide"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="jira-modal__header">
          <div className="jira-modal__breadcrumb">
            <span className="jira-issue-type" aria-hidden />
            <span className="jira-key">{card.key}</span>
          </div>
          <button type="button" className="jira-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="jira-detail">
          <div className="jira-detail__main">
            {editingTitle ? (
              <input
                className="jira-detail__title-input"
                autoFocus
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={() => {
                  const trimmed = titleDraft.trim()
                  if (trimmed && trimmed !== card.title) onUpdate({ title: trimmed })
                  setEditingTitle(false)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                  if (event.key === 'Escape') {
                    setTitleDraft(card.title)
                    setEditingTitle(false)
                  }
                }}
              />
            ) : (
              <h2 className="jira-detail__title" onClick={() => setEditingTitle(true)}>
                {card.title}
              </h2>
            )}

            <div className="jira-detail__section">
              <div className="jira-detail__label">Description</div>
              {editingDescription ? (
                <textarea
                  autoFocus
                  rows={6}
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  onBlur={() => {
                    if (descriptionDraft !== card.description) onUpdate({ description: descriptionDraft })
                    setEditingDescription(false)
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="jira-detail__description"
                  onClick={() => setEditingDescription(true)}
                >
                  {card.description ? card.description : <span className="jira-detail__placeholder">Add a description…</span>}
                </button>
              )}
            </div>
          </div>

          <aside className="jira-detail__sidebar">
            <div className="jira-detail__field">
              <div className="jira-detail__label">Status</div>
              <select value={column.id} onChange={(event) => onMove(event.target.value)}>
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="jira-detail__field">
              <div className="jira-detail__label">Priority</div>
              <select
                value={card.priority}
                onChange={(event) => onUpdate({ priority: event.target.value as PriorityId })}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="jira-detail__field">
              <div className="jira-detail__label">Assignee</div>
              <select
                value={card.assigneeId}
                onChange={(event) => onUpdate({ assigneeId: event.target.value })}
              >
                {USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="jira-detail__field">
              <div className="jira-detail__label">Created</div>
              <div>{new Date(card.createdAt).toLocaleString()}</div>
            </div>
            <button
              type="button"
              className="jira-btn jira-btn--danger"
              onClick={() => {
                if (window.confirm(`Delete ${card.key}?`)) onDelete()
              }}
            >
              Delete issue
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
