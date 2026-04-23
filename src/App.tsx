import {
  type DragEvent,
  type FormEvent,
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
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
  assigneeId: string | null
  createdAt: number
}

type Column = {
  id: string
  title: string
  cards: Card[]
}

type GroupByMode = 'status' | 'priority' | 'assignee' | 'category'

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
        title: 'Design autonomous replanning loop',
        description: 'Define the state machine for the replanner',
        priority: 'medium',
        assigneeId: null,
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
const STORAGE_VERSION = 4

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
  const [groupBy, setGroupBy] = useState<GroupByMode>(() => {
    if (typeof window !== 'undefined') {
      const urlGroupBy = new URL(window.location.href).searchParams.get('groupBy')
      if (urlGroupBy && (['status', 'priority', 'assignee', 'category'] as string[]).includes(urlGroupBy)) {
        return urlGroupBy as GroupByMode
      }
    }
    return initial.preferences.groupBy
  })
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
  const [showCreateStatusModal, setShowCreateStatusModal] = useState(false)

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
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('groupBy', groupBy)
    if (url.toString() !== window.location.href) {
      window.history.replaceState({}, '', url.toString())
    }
  }, [groupBy])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const groupByVal = url.searchParams.get('groupBy') ?? groupBy
    const term = boardSearch.trim()
    const filterParam = term
      ? `(summary%20~%20%27${encodeURIComponent(term)}*%27%20OR%20description%20~%20%27${encodeURIComponent(term)}*%27)`
      : ''
    window.history.replaceState({}, '', `${url.pathname}?filter=${filterParam}&groupBy=${groupByVal}`)
  }, [boardSearch, groupBy])

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
      if (filters.assignees.length && !filters.assignees.includes(card.assigneeId ?? '')) return false
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
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === cardId)
    if (card && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('selectedIssue', card.key)
      window.history.pushState({}, '', url.toString())
    }
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
    setShowCreateStatusModal(true)
  }

  function submitCreateStatus(title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    setColumns((cols) => [...cols, { id: newId('col'), title: trimmed, cards: [] }])
    setShowCreateStatusModal(false)
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
        {/*
          Region B anchor: horizontal-nav.ui.content.horizontal-nav on <header>.
          Reference structure: header > div(D01) > div(D02) > [div(breadcrumbs), div(project-header), nav(tabs)]
        */}
        <header className="jira-project-top" data-region="horizontal-nav" data-testid="horizontal-nav.ui.content.horizontal-nav">
          {/* D01 navigation wrapper */}
          <div style={{display:'contents'}}>
            {/* D02 inner wrapper */}
            <div style={{display:'contents'}}>
              {/* D03 breadcrumbs */}
              <div style={{display:'contents'}}>
                <nav aria-label="Breadcrumbs" style={{display:'none'}} aria-hidden="true">
                  <ol style={{margin:0, padding:0, listStyle:'none'}}>
                    <li><a href="#">Spaces</a></li>
                  </ol>
                </nav>
              </div>

              {/*
                Region A anchor: horizontal-nav-header.ui.project-header.header on <div>.
                Reference columns (D01 from project-header root):
                  col1: icon (D01>D02>D03>D04>D05 img)
                  col2: form (D01>D02 form>…>D09 read-view)
                  col3: teams+action (D01>D02>D03[team-trigger]>D03>D05[action-menu])
                  col4: right buttons (D01>D02[btn, div[pres], div[pres]>span>btn, span>btn])
              */}
              <div data-region="project-header" data-testid="horizontal-nav-header.ui.project-header.header" style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>

                {/* Child 1: project avatar — div×4 > img */}
                <div><div><div><div>
                  <img
                    alt=""
                    src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>"
                    data-testid="navigation-apps-sidebar-inline-config-project-header.ui.editable-avatar.project-icon-editable--image"
                    style={{display:'none'}}
                  />
                </div></div></div></div>

                {/* Child 2: project name — div > form > div > div > [button(overlay) + div[role=presentation] > div > h1 > div[read-view]] */}
                <div>
                  <form role="presentation" onSubmit={e=>e.preventDefault()}>
                    <div><div>
                      <button
                        aria-label="Edit, Space name"
                        type="button"
                        style={{position:'absolute',inset:0,opacity:0,pointerEvents:'auto',border:0,background:'transparent'}}
                        onClick={() => flash('Rename project (demo).')}
                      />
                      <div role="presentation">
                        <div>
                          <h1 aria-expanded="false" aria-haspopup="true" className="jira-project-name">
                            <div data-testid="horizontal-nav-header.common.ui.read-view">Autoloop</div>
                          </h1>
                        </div>
                      </div>
                    </div></div>
                  </form>
                </div>

                {/* Child 3: team + action-menu — div > [div>button[team] + div>div[role=pres]>button[action-menu]] */}
                <div>
                  <div>
                    <button
                      type="button"
                      data-testid="team-button-trigger"
                      className="jira-icon-btn jira-tiny"
                      aria-haspopup="dialog"
                      aria-label="Link contributing teams"
                      title="Link contributing teams"
                      onClick={() => flash('Teams (demo).')}
                    >
                      <span aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <title>Link contributing teams</title>
                          <circle cx="9" cy="9" r="3" />
                          <circle cx="17" cy="10" r="2.5" />
                          <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
                          <path d="M15 19c0-2 2-3.5 4-3.5s2 .5 2 2" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div>
                    <div role="presentation">
                      <button
                        type="button"
                        data-testid="navigation-project-action-menu.ui.themed-button"
                        className="jira-icon-btn jira-tiny"
                        aria-label="More actions"
                        aria-expanded="false"
                        aria-haspopup="true"
                        title="More actions"
                        onClick={() => toggleMenu('project-actions')}
                      >
                        <span><span role="img" aria-label="More actions">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <title>More actions</title>
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </span></span>
                      </button>
                      <Popover open={openMenu === 'project-actions'} onClose={() => setOpenMenu(null)} align="left">
                        <MenuButton onClick={() => { flash('Project settings are not implemented in this demo.'); setOpenMenu(null) }}>Project settings</MenuButton>
                        <MenuButton onClick={() => { flash('Starred Autoloop.'); setOpenMenu(null) }}>Star project</MenuButton>
                        <MenuButton onClick={() => { copyBoardLink(); setOpenMenu(null) }}>Copy board link</MenuButton>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Child 4: share + automation — div > [button[share] + div[role=pres]>button[automation] + ...] */}
                <div className="actions-inner" style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:'4px', flexShrink:0}}>
                  <button
                    type="button"
                    id="po-spotlight-share-button"
                    data-vc="share-button"
                    className="jira-icon-btn jira-tiny"
                    aria-label="Share"
                    aria-expanded="false"
                    aria-haspopup="true"
                    title="Share"
                    onClick={() => flash('Share (demo).')}
                  >
                    <span><span role="img" aria-label="Share">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <title>Share</title>
                        <circle cx="6" cy="12" r="2.5" />
                        <circle cx="18" cy="6" r="2.5" />
                        <circle cx="18" cy="18" r="2.5" />
                        <path d="M8 11l8-4M8 13l8 4" />
                      </svg>
                    </span></span>
                  </button>
                  <div role="presentation">
                    <button
                      type="button"
                      data-vc="automation-menu-button"
                      className="jira-icon-btn jira-tiny"
                      aria-label="Automation"
                      aria-expanded="false"
                      aria-haspopup="true"
                      title="Automation"
                      onClick={() => flash('Automation (demo).')}
                    >
                      <span><span role="img" aria-label="Automation">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <title>Automation</title>
                          <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
                        </svg>
                      </span></span>
                    </button>
                  </div>
                  <div role="presentation">
                    <span>
                      <button
                        type="button"
                        data-testid="feedback-button.horizontal-nav-feedback-button"
                        className="jira-icon-btn jira-tiny"
                        aria-label="Give feedback"
                        title="Give feedback"
                        onClick={() => flash('Feedback (demo).')}
                      >
                        <span className="icon-wrap"><span>
                          <span className="sr-only">Give feedback</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <title>Give feedback</title>
                            <path d="M4 8h10a4 4 0 1 1 0 8H4M20 16H10a4 4 0 1 0 0-8h10" />
                          </svg>
                        </span></span>
                      </button>
                    </span>
                  </div>
                  <span>
                    <button
                      type="button"
                      data-testid="platform.ui.fullscreen-button.fullscreen-button"
                      className="jira-icon-btn jira-tiny"
                      aria-label="Enter full screen"
                      title="Enter full screen"
                      onClick={() => flash('Expand (demo).')}
                    >
                      <span className="icon-wrap"><span>
                        <span className="sr-only">Enter full screen</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <title>Enter full screen</title>
                          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                        </svg>
                      </span></span>
                    </button>
                  </span>
                </div>

              </div>{/* end horizontal-nav-header.ui.project-header.header */}

            </div>{/* end D02 */}

            {/* tabs nav — sibling of D02, direct child of D01, matching reference depth */}
            <nav className="jira-tabs" aria-label="Space navigation" data-region="horizontal-nav-tabs">
                <ul style={{display:'contents'}}>
                  {/* Summary, Board, List, Calendar, Timeline, Approvals, Forms as <li> children of <ul> */}
                  {TABS.filter(t => t !== 'Pages' && t !== 'More').map((tab) => (
                    <li key={tab} style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div style={{display:'contents'}}>
                          <div style={{display:'contents'}}>
                            <div style={{display:'contents'}}>
                              {tab === activeTab ? (
                                <h2
                                  data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab"
                                  className="jira-tab is-active"
                                  title={tab}
                                  aria-label={tab}
                                >
                                  <div style={{display:'flex'}}><span aria-hidden><TabIcon tab={tab} /></span></div>
                                  <span>{tab}</span>
                                </h2>
                              ) : (
                                <a
                                  data-testid="navigation-kit-ui-tab.ui.link-tab"
                                  role="link"
                                  href="#"
                                  className="jira-tab"
                                  title={tab}
                                  aria-label={tab}
                                  onClick={(e) => { e.preventDefault(); setActiveTab(tab) }}
                                >
                                  <div style={{display:'flex'}}><span aria-hidden><TabIcon tab={tab} /></span></div>
                                  <span>{tab}</span>
                                </a>
                              )}
                              <div><span><button type="button" className="sr-only" aria-label={`${tab} tab options`}><span><span></span><span></span></span></button></span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {/* Pages tab — wrapped in <div><li> per reference */}
                  <div style={{display:'contents'}}>
                    <li style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div style={{display:'contents'}}>
                          <div style={{display:'contents'}}>
                            <div style={{display:'contents'}}>
                              {activeTab === 'Pages' ? (
                                <h2
                                  data-testid="navigation-kit-ui-tab.ui.link-tab.non-interactive-tab"
                                  className="jira-tab is-active"
                                  title="Pages"
                                  aria-label="Pages"
                                >
                                  <div style={{display:'flex'}}><span aria-hidden><TabIcon tab="Pages" /></span></div>
                                  <span>Pages</span>
                                </h2>
                              ) : (
                                <a
                                  data-testid="navigation-kit-ui-tab.ui.link-tab"
                                  role="link"
                                  href="#"
                                  className="jira-tab"
                                  title="Pages"
                                  aria-label="Pages"
                                  onClick={(e) => { e.preventDefault(); setActiveTab('Pages') }}
                                >
                                  <div style={{display:'flex'}}><span aria-hidden><TabIcon tab="Pages" /></span></div>
                                  <span>Pages</span>
                                </a>
                              )}
                              <div><span><button type="button" className="sr-only" aria-label="Pages tab options"><span><span></span><span></span></span></button></span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </div>
                </ul>
                {/* More dropdown — div>div>div>div>div[dropdown-trigger-tab]>button[more-trigger] */}
                <div style={{display:'contents'}}>
                  <div style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div data-testid="navigation-kit-ui-tab.ui.dropdown-trigger-tab.tab-button" style={{display:'contents'}}>
                          <button
                            type="button"
                            data-testid="navigation-kit-ui-tab-list.ui.more-trigger.more-tab"
                            aria-label="4 more tabs"
                            className={activeTab === 'More' ? 'jira-tab is-active' : 'jira-tab'}
                            onClick={() => setActiveTab('More')}
                          >
                            <div><div><span><span><span></span></span></span></div></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Add tab — div>div>div[pres]>button[add-tab] */}
                <div style={{display:'contents'}}>
                  <div style={{display:'contents'}}>
                    <div role="presentation" style={{display:'contents'}}>
                      <button
                        type="button"
                        data-testid="navigation-kit-add-tab.ui.trigger"
                        className="jira-tab jira-tab--add"
                        aria-label="Add view"
                        title="Add view"
                        onClick={() => flash('Tab customization is not implemented in this demo.')}
                      >
                        <span><span role="img"></span></span>
                      </button>
                    </div>
                  </div>
                </div>
            </nav>

          </div>{/* end D01 */}
          {activeTab === 'Board' || activeTab === 'List' ? (
            <div className="jira-board-bar" data-region="board-toolbar">
              <span role="status" className="sr-only">{boardSearch.trim() ? 'Showing filtered work items' : 'Showing all work items'}</span>
              <span className="sr-only">Filter by assignee</span>
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
                    type="text"
                    placeholder="Search board"
                    aria-label="Search board"
                    title="Search board"
                    value={boardSearch}
                    onChange={(event) => setBoardSearch(event.target.value)}
                  />
                </div>
                <fieldset
                  className="jira-board-bar__avatar-stack _19itidpf"
                  data-testid="business-filters.ui.filters.assignee-filter"
                >
                  <legend className="sr-only">Filter by assignee</legend>
                  <div style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <input
                        type="checkbox"
                        aria-label="Daniel Li is online"
                        value="712020:628f86ff-8aef-4c36-85d6-223e8e929463"
                        style={{position:'absolute',width:'16px',height:'16px',opacity:0.01,margin:0,cursor:'pointer'}}
                      />
                      <div data-testid="business-collaboration.ui.presence-filter-avatar.presence-filter-avatar">
                        <div>
                          <span><img alt="" src="/avatar-dl.png" style={{display:'none'}} /></span>
                          <span>
                            <span role="presentation">
                              <div aria-hidden className="jira-board-bar__avatar jira-board-bar__avatar--dl">DL</div>
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>
                <button
                  type="button"
                  className={
                    activeFilterCount
                      ? 'jira-btn jira-btn--ghost jira-btn--sm is-active'
                      : 'jira-btn jira-btn--ghost jira-btn--sm'
                  }
                  data-testid="business-filters.ui.filters.trigger.button-wrapper"
                  aria-label={`${activeFilterCount} filters applied`}
                  aria-haspopup="true"
                  aria-expanded={openMenu === 'filter' ? 'true' : 'false'}
                  title="Filter"
                  onClick={() => toggleMenu('filter')}
                >
                  <span>
                    <div>
                      <div>
                        <span>Filter</span>
                      </div>
                    </div>
                  </span>
                  <span>
                    <span></span>
                  </span>
                </button>
                <div className="jira-rel" style={{display:'contents'}}>
                  <Popover open={openMenu === 'filter'} onClose={() => setOpenMenu(null)} align="left" className="jira-popover--wide">
                    <div style={{padding:'16px 16px 8px'}}>
                      <h2 style={{margin:'0 0 4px',fontSize:'16px',fontWeight:600}}>Filters</h2>
                      <p style={{margin:'0 0 12px',fontSize:'12px',color:'#6b778c'}}>Clicking on the items below will filter and update your view</p>
                      <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
                        <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" onClick={() => setFilters((f) => ({ ...f, assignees: ['fleet'] }))}>Assigned to me</button>
                        <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" onClick={() => flash('Due this week filter applied.')}>Due this week</button>
                      </div>
                    </div>
                    <div className="jira-popover__section">
                      <h3 style={{margin:'0 0 8px',fontSize:'13px',fontWeight:600}}>Date range</h3>
                      <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                        <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" aria-label="Start date, Open calendar" onClick={() => flash('Start date picker.')}>Start date</button>
                        <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" aria-label="Due date, Open calendar" onClick={() => flash('Due date picker.')}>Due date</button>
                      </div>
                    </div>
                    <div className="jira-popover__section">
                      <h3 style={{margin:'0 0 8px',fontSize:'13px',fontWeight:600}}>Assignee</h3>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'4px'}}>
                        {USERS.map((user) => {
                          const active = filters.assignees.includes(user.id)
                          return (
                            <button
                              key={user.id}
                              type="button"
                              className={active ? 'jira-board-bar__avatar-btn is-active' : 'jira-board-bar__avatar-btn'}
                              aria-pressed={active ? 'true' : 'false'}
                              onClick={() => setFilters((f) => ({ ...f, assignees: toggleFilter(f.assignees, user.id) }))}
                            >
                              <Avatar user={user} size="sm" />
                              <span className="sr-only">{user.name}</span>
                            </button>
                          )
                        })}
                        <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" aria-label="More options for assignee" onClick={() => flash('More assignee options.')}>+</button>
                      </div>
                    </div>
                    <div className="jira-popover__section">
                      <h3 style={{margin:'0 0 8px',fontSize:'13px',fontWeight:600}}>Category</h3>
                      <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" onClick={() => flash('No category filter.')}>No category</button>
                    </div>
                    <div className="jira-popover__section">
                      <h3 style={{margin:'0 0 8px',fontSize:'13px',fontWeight:600}}>Created</h3>
                      <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                        <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" aria-label="From, Open calendar" onClick={() => flash('Created from date picker.')}>From</button>
                        <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" aria-label="To, Open calendar" onClick={() => flash('Created to date picker.')}>To</button>
                      </div>
                    </div>
                    <div className="jira-popover__section">
                      <h3 style={{margin:'0 0 8px',fontSize:'13px',fontWeight:600}}>Labels</h3>
                      <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm" onClick={() => flash('No label filter.')}>No label</button>
                    </div>
                    <div className="jira-popover__section">
                      <h3 style={{margin:'0 0 8px',fontSize:'13px',fontWeight:600}}>Priority</h3>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'4px'}}>
                        {PRIORITIES.map((priority) => {
                          const active = filters.priorities.includes(priority.id)
                          return (
                            <button
                              key={priority.id}
                              type="button"
                              className={active ? 'jira-btn jira-btn--ghost jira-btn--sm is-active' : 'jira-btn jira-btn--ghost jira-btn--sm'}
                              aria-pressed={active ? 'true' : 'false'}
                              onClick={() => setFilters((f) => ({ ...f, priorities: toggleFilter(f.priorities, priority.id) }))}
                            >
                              <PriorityIcon id={priority.id} />
                              <span>{priority.label}</span>
                            </button>
                          )
                        })}
                      </div>
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
                    className="jira-btn jira-btn--ghost jira-btn--sm jira-group-status-btn"
                    aria-label={`Group by ${groupBy === 'status' ? 'Status' : groupBy === 'priority' ? 'Priority' : groupBy === 'assignee' ? 'Assignee' : 'Category'}`}
                    title={`Group by ${groupBy === 'status' ? 'Status' : groupBy === 'priority' ? 'Priority' : groupBy === 'assignee' ? 'Assignee' : 'Category'}`}
                    aria-haspopup="true"
                    aria-expanded={openMenu === 'group' ? 'true' : 'false'}
                    onClick={() => toggleMenu('group')}
                  >
                    <span>Group:</span> <span>{groupBy === 'status' ? 'Status' : groupBy === 'priority' ? 'Priority' : groupBy === 'assignee' ? 'Assignee' : 'Category'}</span>
                    <svg className="jira-chevron" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <title>Group by</title>
                      <path d="M7 10l5 5 5-5H7z" />
                    </svg>
                  </button>
                  <Popover open={openMenu === 'group'} onClose={() => setOpenMenu(null)}>
                    <div role="radiogroup" aria-label="Group by field">
                      {(['assignee', 'category', 'priority', 'status'] as GroupByMode[]).map((mode) => {
                        const label = mode === 'status' ? 'Status' : mode === 'priority' ? 'Priority' : mode === 'assignee' ? 'Assignee' : 'Category'
                        const isSelected = groupBy === mode
                        return (
                          <label key={mode} className="jira-menu-item" style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer'}}>
                            <input
                              type="radio"
                              name="group-by-field"
                              value={mode}
                              checked={isSelected}
                              onChange={() => {
                                setGroupBy(mode)
                                setOpenMenu(null)
                              }}
                            />
                            <span>{label}{isSelected ? ' Selected' : ''}</span>
                          </label>
                        )
                      })}
                    </div>
                  </Popover>
                </div>
                <div className="jira-rel">
                  <button
                    type="button"
                    className="jira-icon-btn"
                    aria-label="View settings"
                    title="View settings"
                    aria-pressed={openMenu === 'view-options' ? 'true' : 'false'}
                    onClick={() => toggleMenu('view-options')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                      <title>View settings</title>
                      <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                    </svg>
                    <span className="vh-sr">View settings</span>
                  </button>
                </div>
                {openMenu === 'view-options' ? (
                  <aside
                    role="complementary"
                    aria-label="Sidebar"
                    style={{position:'fixed',top:0,right:0,bottom:0,width:'280px',background:'#fff',boxShadow:'-2px 0 8px rgba(0,0,0,0.15)',zIndex:200,display:'flex',flexDirection:'column',overflow:'auto'}}
                  >
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',borderBottom:'1px solid #dfe1e6'}}>
                      <h2 style={{margin:0,fontSize:'16px',fontWeight:600}}>View settings</h2>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button type="button" aria-label="Resize sidebar" style={{background:'none',border:'none',cursor:'pointer',padding:'4px',fontSize:'14px'}} onClick={() => flash('Resize sidebar.')}>⟺</button>
                        <button type="button" aria-label="Close" style={{background:'none',border:'none',cursor:'pointer',padding:'4px',fontSize:'14px'}} onClick={() => setOpenMenu(null)}>✕</button>
                      </div>
                    </div>
                    <div style={{padding:'16px'}}>
                      <fieldset style={{border:'none',padding:0,margin:0}}>
                        <legend style={{fontSize:'13px',fontWeight:600,marginBottom:'8px'}}>Show fields</legend>
                        <label style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',cursor:'not-allowed'}}>
                          <input type="checkbox" aria-label="Summary" checked readOnly disabled style={{cursor:'not-allowed'}} />
                          <span>Summary</span>
                        </label>
                        <label style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',cursor:'pointer'}}>
                          <input type="checkbox" aria-label="Assignee" defaultChecked />
                          <span>Assignee</span>
                        </label>
                        <label style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',cursor:'pointer'}}>
                          <input type="checkbox" aria-label="Priority" defaultChecked />
                          <span>Priority</span>
                        </label>
                      </fieldset>
                      <div style={{marginTop:'16px'}}>
                        <span style={{fontSize:'13px',fontWeight:500}}>Hide done work items after:</span>
                        <div style={{marginTop:'6px',padding:'6px 10px',border:'1px solid #dfe1e6',borderRadius:'4px',fontSize:'13px',cursor:'pointer'}} onClick={() => flash('Hide done items setting.')}>
                          <span>Never</span>
                        </div>
                      </div>
                    </div>
                  </aside>
                ) : null}
                {groupBy !== 'status' ? (
                  <button
                    type="button"
                    className="jira-btn jira-btn--ghost jira-btn--sm"
                    aria-label="Save or reset view settings"
                    title="Save or reset view settings"
                    onClick={() => {
                      setGroupBy('status')
                      flash('View settings reset')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17 3H7L3 9l9 13 9-13-4-6zM7.24 9l2.76-4h4l2.76 4H7.24z" />
                    </svg>
                    <span>Save or reset view settings</span>
                  </button>
                ) : null}
                <div className="jira-rel">
                  <button
                    type="button"
                    className="jira-icon-btn"
                    aria-label="More actions"
                    title="More actions"
                    aria-haspopup="true"
                    aria-expanded={openMenu === 'board-more' ? 'true' : 'false'}
                    onClick={() => toggleMenu('board-more')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                      <title>More actions</title>
                      <circle cx="5" cy="12" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="19" cy="12" r="1.6" />
                    </svg>
                  </button>
                  <Popover open={openMenu === 'board-more'} onClose={() => setOpenMenu(null)} ariaLabel="More actions on board view">
                    <MenuButton onClick={() => { flash('Stand-up view opened.'); setOpenMenu(null) }}>Stand-up</MenuButton>
                    <MenuButton onClick={() => { flash('Configure columns opened.'); setOpenMenu(null) }}>Configure columns</MenuButton>
                  </Popover>
                </div>
              </div>
            </div>
          ) : null}
        </header>

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
            onUpdateCard={updateCard}
            dropTarget={dropTarget}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            searchTerm={boardSearch}
            onClearSearch={() => setBoardSearch('')}
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
    <>
    <div data-testid="page-layout.root--skip-links-container" className="jira-skip-links">
      <span data-testid="page-layout.root--skip-links-container--label" className="sr-only">Skip to:</span>
      <ol className="jira-skip-links__list">
        <li><a href="#page-layout-top-nav" className="sr-only" tabIndex={0}>Top Bar</a></li>
        <li><a href="#page-layout-main" className="sr-only" tabIndex={0}>Main Content</a></li>
        <li><a href="#page-layout-sidebar" className="sr-only" tabIndex={0}>Sidebar</a></li>
        <li><a href="#page-layout-space-nav" className="sr-only" tabIndex={0}>Space navigation</a></li>
        <li><a href="#page-layout-banner" className="sr-only" tabIndex={0}>Banner</a></li>
      </ol>
    </div>
    <div className="jira-app" data-region="app-shell" data-testid="page-layout.root">
      <div data-testid="page-layout.banner" style={{display:'none'}}>
        <div role="dialog" aria-labelledby="cookiesTrackingNoticeLink">
          <div>
            <div>
              <div role="presentation">
                <div>
                  <span>Atlassian uses cookies to improve your browsing experience, perform analytics and research, and conduct advertising. Accept all cookies to indicate that you agree to our use of cookies on your device.</span>
                </div>
              </div>
              <a href="https://www.atlassian.com/legal/cookies" id="cookiesTrackingNoticeLink" target="_blank" rel="noopener noreferrer">Atlassian cookies and tracking notice</a>
            </div>
            <div>
              <button data-testid="preferences-button" tabIndex={0} type="button"><span>Preferences</span></button>
              <button data-testid="only-necessary-button" tabIndex={0} type="button"><span>Only necessary</span></button>
              <button data-testid="accept-all-button" tabIndex={0} type="button">
                <span>
                  <span data-testid="experiment-one-button-icon" aria-hidden="true" style={{color:'currentColor'}} />
                  Accept all
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <header className="jira-topbar" data-region="top-nav" data-testid="page-layout.top-nav">
        <div className="jira-topbar__left">
          <div style={{display:'contents'}}>
          <div style={{display:'contents'}}>
            <button
              type="button"
              className="jira-sb-brand-btn"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              onClick={() => flash('Sidebar toggle (demo).')}
            >
              <span className="icon-wrap"><span><span>
                <span className="sr-only">Expand sidebar</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <title>Collapse sidebar</title>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16" />
                </svg>
              </span></span></span>
            </button>
          </div>
          <div style={{display:'contents'}}>
            <div>
              <button
                type="button"
                className="jira-sb-brand-btn"
                aria-label="App switcher"
                title="Switch to…"
                onClick={() => flash('App switcher (demo).')}
              >
                <span className="icon-wrap"><span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1868DB">
                    <title>App switcher</title>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </span><span className="sr-only">Switch sites or apps</span></span>
              </button>
            </div>
            <div data-testid="atlassian-navigation--product-home--container" style={{display:'inline-flex',alignItems:'center'}}>
              <a href="#" style={{display:'contents',textDecoration:'none'}}>
                <div className="brand">
                  <div style={{display:'contents'}}>
                    <span className="jira-sb-brand-logo" aria-hidden data-testid="atlassian-navigation--product-home--icon--wrapper">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1868DB" xmlns="http://www.w3.org/2000/svg">
                        <title>Jira</title>
                        <path d="M11.53 2 2 11.53a.67.67 0 0 0 0 .94l5.77 5.77a.67.67 0 0 0 .94 0L12 15l3.29 3.29a.67.67 0 0 0 .94 0L22 12.47a.67.67 0 0 0 0-.94L12.47 2a.67.67 0 0 0-.94 0Z" fill="#1868DB"/>
                      </svg>
                    </span>
                  </div>
                  <span><span><span className="jira-sb-brand-text">Jira</span></span></span>
                </div>
              </a>
            </div>
          </div>
          </div>
        </div>

        <div className="jira-topbar__center">
        <div style={{display:'contents'}}>
        <button data-testid="atlassian-navigation.ui.search.quickfind-skeleton-wrapper" type="button" style={{all:'unset',display:'contents'}}>
        <div className="jira-topbar__search jira-rel" data-testid="search-input-container" role="search">
          <div><span className="jira-topbar__search-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <title>Search</title>
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M16 16l4 4" />
            </svg>
          </span></div>
          <input role="combobox"
            data-testid="search-input"
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
        </button>

        <span data-testid="ak-spotlight-target-global-create-spotlight" style={{display:'contents'}}>
        <div>
        <button
          type="button"
          data-testid="atlassian-navigation--create-button"
          className="jira-btn jira-btn--create"
          aria-label="Create"
          title="Create"
          onClick={() => openCreateForColumn(columns[0]?.id ?? 'todo')}
        >
          <span><span><svg aria-hidden viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg></span></span><span>Create</span>
        </button>
        </div>
        </span>
        </div>
        </div>

        <nav className="jira-topbar__right">
          <div role="list">
          <button
            type="button"
            className="jira-pill jira-pill--trial"
            aria-label="Premium trial"
            title="Premium trial"
            onClick={() => flash('Premium trial: thanks for the interest!')}
          >
            <span className="btn-icon"><span className="jira-pill__diamond" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <defs>
                  <linearGradient id="premGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <path d="M8 0 L16 6 L8 16 L0 6 Z" fill="url(#premGrad)" />
              </svg>
            </span></span>
            <span className="btn-text">Premium trial</span>
          </button>
          <span data-testid="atlassian-navigation.ui.conversation-assistant.app-navigation-ai-mate" role="listitem">
            <div>
              <button
                type="button"
                className="jira-pill jira-pill--rovo"
                aria-label="Ask Rovo"
                title="Ask Rovo"
                onClick={() => flash('Rovo says: ship it.')}
              >
                <span><span role="img" className="jira-rovo-cube" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <polygon points="8,1 15,5 8,9 1,5" fill="#6366F1"/>
                    <polygon points="1,5 8,9 8,15 1,11" fill="#8B5CF6"/>
                    <polygon points="15,5 8,9 8,15 15,11" fill="#EC4899"/>
                  </svg>
                </span><span className="btn-text">Ask Rovo</span></span>
              </button>
            </div>
          </span>
          <div role="listitem">
          <div data-testid="atlassian-navigation--secondary-actions--notifications--menu-trigger">
          <div className="topbar-bell jira-rel">
            <button
              type="button"
              className="jira-icon-btn"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => toggleMenu('notifications')}
            >
              <span className="icon-wrap"><span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <title>Notifications</title>
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span><span className="sr-only">Notifications</span></span>
            </button>
            <div className="badge">3+</div>
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
          </div>
          </div>
          <div data-testid="atlassian-navigation--secondary-actions--help--menu-trigger" style={{display:'contents'}}>
          <div style={{display:'contents'}}>
          <button
            type="button"
            className="jira-icon-btn jira-help-btn"
            aria-label="Help"
            title="Help"
            onClick={() => flash('Help center opened.')}
          >
            <span className="icon-wrap"><span>
              <span className="sr-only">Help</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <title>Help</title>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span></span>
          </button>
          </div>
          </div>
          <div data-testid="atlassian-navigation--secondary-actions--settings--menu-trigger" style={{display:'contents'}}>
          <div className="jira-rel">
            <button
              type="button"
              className="jira-icon-btn"
              aria-label="Settings"
              title="Settings"
              onClick={() => toggleMenu('settings')}
            >
              <span className="icon-wrap"><span>
                <span className="sr-only">Settings</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <title>Settings</title>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </span></span>
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
          </div>
          <div style={{display:'contents'}}>
          <div className="jira-rel">
            <button
              type="button"
              data-testid="atlassian-navigation--secondary-actions--profile--trigger"
              className="jira-avatar-button"
              onClick={() => toggleMenu('avatar')}
              aria-label="Your profile and settings"
              title="Your profile and settings"
            >
              <span className="icon-wrap"><span>
                <span className="sr-only">Your profile and settings</span>
                <span className="jira-avatar jira-avatar--dl" aria-label="DL">DL</span>
              </span></span>
              <span className="vh-sr">worktrial-daniel-li@fleet.so</span>
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
          </div>
        </nav>
      </header>

      <div className="jira-body">
        <nav className="jira-sidebar" data-region="left-nav" data-testid="page-layout.sidebar" aria-label="Sidebar">
          {/* d1 main wrapper */}
          <div>
            {/* d2 scroll container */}
            <div className="jira-sidebar__scroll">
              {/* d3 inner content */}
              <div style={{display:'contents'}}>
                {/* d4 main nav list */}
                <div role="list" style={{display:'contents'}}>

                  {/* FOR YOU — d5 listitem → d6 container[NAV4_for-you-container] → d7 a[NAV4_for-you] */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div data-testid="NAV4_for-you-container" style={{display:'contents'}}>
                      <a
                        data-testid="NAV4_for-you"
                        href="#"
                        className={(activeSidebar === 'for-you' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--for-you'}
                        aria-label="For you"
                        onClick={(e) => { e.preventDefault(); setActiveSidebar('for-you'); }}
                      >
                        <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="bolt" /></div>
                        <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>For you</span></div></div>
                      </a>
                    </div>
                  </div>

                  {/* RECENT — d5 listitem → d6 wrapper → d7 button */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <button
                        type="button"
                        className={(activeSidebar === 'recent' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--recent'}
                        title="Recent" aria-label="Recent"
                        onClick={() => setActiveSidebar('recent')}
                      >
                        <div style={{display:'contents'}}>
                          <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="clock" /></div>
                          <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Recent</span></div></div>
                        </div>
                      </button>
                      <div style={{display:'none'}}><span aria-hidden /></div>
                      <div style={{display:'none'}}><div /></div>
                    </div>
                  </div>

                  {/* STARRED — d5 listitem → d6 wrapper → d7 button */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <button
                        type="button"
                        className={(activeSidebar === 'starred' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--starred'}
                        title="Starred" aria-label="Starred"
                        onClick={() => setActiveSidebar('starred')}
                      >
                        <div style={{display:'contents'}}>
                          <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="star" /></div>
                          <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Starred</span></div></div>
                        </div>
                      </button>
                      <div style={{display:'none'}}><span aria-hidden /></div>
                      <div style={{display:'none'}}><div /></div>
                    </div>
                  </div>

                  {/* APPS — d5 → d6 → d7 → d8 container → d9 button / d9 wrapper → d10 more-trigger */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div data-testid="NAV4_jira.sidebar.apps-container" style={{display:'contents'}}>
                          <button
                            type="button"
                            data-testid="NAV4_jira.sidebar.apps"
                            className={(activeSidebar === 'apps' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--apps'}
                            title="Apps" aria-label="Apps"
                            onClick={() => setActiveSidebar('apps')}
                          >
                            <div style={{display:'contents'}}>
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="apps" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Apps</span></div></div>
                            </div>
                          </button>
                          <div style={{display:'contents'}}>
                            <button type="button" data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger" className="jira-sb-link jira-sb-link--more-actions sr-only" onClick={() => flash('More Apps actions (demo).')} aria-label="More actions for Apps"><span>More actions for Apps</span></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PLANS — d5 → d6 → d7 → d8 container → d9 button / d9 icon / d9 actions(d10 presentation+d11 btn, d10 more-trigger) */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div data-testid="NAV4_jira.sidebar.plans-container" style={{display:'contents'}}>
                          <button
                            type="button"
                            data-testid="NAV4_jira.sidebar.plans"
                            className={(activeSidebar === 'plans' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--plans'}
                            title="Plans" aria-label="Plans"
                            onClick={() => setActiveSidebar('plans')}
                          >
                            <div style={{display:'contents'}}>
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="plans" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Plans</span></div></div>
                            </div>
                          </button>
                          <div style={{display:'none'}}><div /><div /></div>
                          <div style={{display:'contents'}}>
                            <div role="presentation" style={{display:'contents'}}>
                              <button type="button" className="sr-only" onClick={() => flash('Create plan (demo).')} aria-label="Create plan"><span>Create plan</span></button>
                            </div>
                            <button type="button" data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger" className="jira-sb-link jira-sb-link--more-actions sr-only" onClick={() => flash('More Plans actions (demo).')} aria-label="More actions for Plans"><span>More actions for Plans</span></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PROJECTS/SPACES — d5 → d6(single wrapper) → d7(projects-container wrapper) + d7(recent-list sibling) */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      {/* d7: wrapper for projects-container */}
                      <div style={{display:'contents'}}>
                        <div data-testid="NAV4_jira.sidebar.projects-container" className="jira-sb-row-group">
                          <button
                            type="button"
                            data-testid="NAV4_jira.sidebar.projects"
                            className="jira-sb-link jira-sb-link--spaces"
                            title="Spaces" aria-label="Spaces"
                            onClick={() => setActiveSidebar('autoloop')}
                          >
                            <div style={{display:'contents'}}>
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="spaces" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Spaces</span></div></div>
                            </div>
                          </button>
                          <div style={{display:'none'}}><div /><div /></div>
                          <div className="jira-sb-row-actions">
                            <button type="button" className="jira-sb-row-action-btn" onClick={() => flash('Create space (demo).')} aria-label="Create space">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                            </button>
                            <button type="button" data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger" className="jira-sb-row-action-btn" onClick={() => flash('More Spaces actions (demo).')} aria-label="More actions for spaces">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* d7: recent spaces list — SIBLING of d7 wrapper above */}
                      <div role="list" style={{display:'contents'}}>
                        {/* Autoloop recent project */}
                        <div
                          data-testid="navigation-apps-sidebar-nav4-sidebars-content-projects-core.common.ui.content.recent-section.recent-section"
                          role="listitem"
                          style={{display:'contents'}}
                        >
                          <div role="group" style={{display:'contents'}}>
                            <p className="jira-sidebar__label-text jira-sidebar__label--upper">Recent</p>
                            <div role="list" style={{display:'contents'}}>
                              <div role="listitem" style={{display:'contents'}}>
                                <div data-testid="NAV4_proj_AUT-container" style={{display:'contents'}}>
                                  <a
                                    data-testid="NAV4_proj_AUT"
                                    href="#"
                                    className={(activeSidebar === 'autoloop' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--autoloop'}
                                    aria-label="Autoloop"
                                    onClick={(e) => { e.preventDefault(); setActiveSidebar('autoloop'); }}
                                  >
                                    <div className="jira-sb-link__icon jira-sb-link__icon--space" aria-hidden><SidebarIcon name="space-autoloop" /></div>
                                    <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Autoloop</span></div></div>
                                  </a>
                                  <div style={{display:'none'}}><img alt="" /></div>
                                  <div style={{display:'none'}}>
                                    <button
                                      type="button"
                                      data-testid="navigation-project-action-menu.ui.menu-container.themed-button"
                                      className="sr-only"
                                      onClick={() => flash('Project actions (demo).')}
                                      aria-label="More actions for Autoloop"
                                    ><span><span /><span /></span></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* More spaces + Recommended section */}
                        <div role="listitem" style={{display:'contents'}}>
                          <div role="group" style={{display:'contents'}}>
                            <div role="list" style={{display:'contents'}}>
                              {/* More spaces */}
                              <div role="listitem" style={{display:'contents'}}>
                                <div style={{display:'contents'}}>
                                  <button
                                    type="button"
                                    className={(activeSidebar === 'more-spaces' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--more-spaces'}
                                    title="More spaces" aria-label="More spaces"
                                    onClick={() => setActiveSidebar('more-spaces')}
                                  >
                                    <div style={{display:'contents'}}>
                                      <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="space-more" /></div>
                                      <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>More spaces</span></div></div>
                                    </div>
                                    <span className="jira-sb-link__chev" aria-hidden>›</span>
                                  </button>
                                  <div style={{display:'none'}}><span aria-hidden /></div>
                                  <div style={{display:'none'}}><div /></div>
                                </div>
                              </div>
                              {/* Recommended list */}
                              <div role="list" style={{display:'contents'}}>
                                <div role="group" style={{display:'contents'}}>
                                  <h2 className="jira-sidebar__label-text jira-sidebar__label--upper">Recommended</h2>
                                  {/* Create a roadmap */}
                                  <div role="listitem" style={{display:'contents'}}>
                                    <div role="listitem" style={{display:'contents'}}>
                                      <div style={{display:'contents'}}>
                                        <button
                                          type="button"
                                          className={(activeSidebar === 'create-roadmap' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--create-roadmap'}
                                          title="Create a roadmap" aria-label="Create a roadmap"
                                          onClick={() => setActiveSidebar('create-roadmap')}
                                        >
                                          <div style={{display:'contents'}}>
                                            <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="roadmap" /></div>
                                            <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Create a roadmap</span></div></div>
                                          </div>
                                          <span className="jira-sb-link__badge"><span id="try-this-recommendation-lozenge">TRY</span></span>
                                        </button>
                                        <div style={{display:'contents'}} />
                                        <div style={{display:'contents'}}>
                                          <div role="presentation" style={{display:'contents'}}>
                                            <span hidden={true} />
                                            <button
                                              type="button"
                                              data-testid="post-office-ad-controls-dropdown--trigger"
                                              className="sr-only"
                                              onClick={() => flash('Ad controls (demo).')}
                                              aria-label="More actions"
                                              aria-hidden="true"
                                            ><span>More actions</span></button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Import work */}
                              <div role="listitem" style={{display:'contents'}}>
                                <div style={{display:'contents'}}>
                                  <button
                                    type="button"
                                    className={(activeSidebar === 'import-work' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--import-work'}
                                    title="Import work" aria-label="Import work"
                                    onClick={() => setActiveSidebar('import-work')}
                                  >
                                    <div style={{display:'contents'}}>
                                      <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="import" /></div>
                                      <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Import work</span></div></div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* end d7 recent list */}
                    </div>
                    {/* end d6 wrapper */}
                  </div>
                  {/* end PROJECTS/SPACES listitem */}

                  {/* FILTERS — separate d5 listitem → d6 → d7 → d8 container → d9 button / d9 wrapper → d10 more-trigger */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div data-testid="NAV4_jira.sidebar.filters-container" style={{display:'contents'}}>
                          <button
                            type="button"
                            data-testid="NAV4_jira.sidebar.filters"
                            className={(activeSidebar === 'filters' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--filters'}
                            title="Filters" aria-label="Filters"
                            onClick={() => setActiveSidebar('filters')}
                          >
                            <div style={{display:'contents'}}>
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="filter" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Filters</span></div></div>
                            </div>
                          </button>
                          <div style={{display:'none'}}><div /><div /></div>
                          <div style={{display:'contents'}}>
                            <button type="button" data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger" className="jira-sb-link jira-sb-link--more-actions sr-only" onClick={() => flash('More Filters actions (demo).')} aria-label="More actions for Filters"><span>More actions for Filters</span></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DASHBOARDS — separate d5 listitem → d6(wrapper for container) + d6(external links list) */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div data-testid="NAV4_jira.sidebar.dashboards-container" style={{display:'contents'}}>
                          <button
                            type="button"
                            data-testid="NAV4_jira.sidebar.dashboards"
                            className={(activeSidebar === 'dashboards' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--dashboards'}
                            title="Dashboards" aria-label="Dashboards"
                            onClick={() => setActiveSidebar('dashboards')}
                          >
                            <div style={{display:'contents'}}>
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="dashboard" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>Dashboards</span></div></div>
                            </div>
                          </button>
                          <div style={{display:'none'}}><div /><div /></div>
                          <div style={{display:'contents'}}>
                            <div role="presentation" style={{display:'contents'}}>
                              <button type="button" className="sr-only" onClick={() => flash('Create dashboard (demo).')} aria-label="Create dashboard"><span>Create dashboard</span></button>
                            </div>
                            <button type="button" data-testid="navigation-apps-sidebar-nav4-sidebars-common-core.ui.more-nav-menu-button.more-nav-menu-button-trigger" className="jira-sb-link jira-sb-link--more-actions sr-only" onClick={() => flash('More Dashboards actions (demo).')} aria-label="More actions for Dashboards"><span>More actions for Dashboards</span></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SPACER — d5 plain div (before external links) */}
                  <div style={{display:'contents'}} />

                  {/* EXTERNAL LINKS — d5 plain div → d6 div[role=list] → d7 span → d8 div[role=listitem] → d9 container → d10 a */}
                  <div className="jira-sidebar__section--external" style={{display:'contents'}}>
                    <div role="list" style={{display:'contents'}}>
                      <span style={{display:'contents'}}>
                        <div role="listitem" style={{display:'contents'}}>
                          <div style={{display:'contents'}}>
                            <a
                              href="https://www.atlassian.com/software/confluence"
                              target="_blank"
                              rel="noopener noreferrer"
                              className={(activeSidebar === 'confluence' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--confluence'}
                              aria-label="Confluence"
                            >
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="confluence" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span aria-label="Confluence">Confluence</span></div></div>
                              <span className="jira-sb-link__ext" aria-hidden>↗</span>
                              <span className="sr-only">, (opens new window)</span>
                            </a>
                          </div>
                        </div>
                      </span>
                      <span style={{display:'contents'}}>
                        <div role="listitem" style={{display:'contents'}}>
                          <div style={{display:'contents'}}>
                            <a
                              href="https://www.atlassian.com/software/goals"
                              target="_blank"
                              rel="noopener noreferrer"
                              className={(activeSidebar === 'goals' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--goals'}
                              aria-label="Goals"
                            >
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="goals" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span aria-label="Goals">Goals</span></div></div>
                              <span className="jira-sb-link__ext" aria-hidden>↗</span>
                              <span className="sr-only">, (opens new window)</span>
                            </a>
                          </div>
                        </div>
                      </span>
                      <span style={{display:'contents'}}>
                        <div role="listitem" style={{display:'contents'}}>
                          <div style={{display:'contents'}}>
                            <a
                              href="https://www.atlassian.com/software/teams"
                              target="_blank"
                              rel="noopener noreferrer"
                              className={(activeSidebar === 'teams' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--teams'}
                              aria-label="Teams"
                            >
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="teams" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span aria-label="Teams">Teams</span></div></div>
                              <span className="jira-sb-link__ext" aria-hidden>↗</span>
                              <span className="sr-only">, (opens new window)</span>
                            </a>
                            <div style={{display:'contents'}}>
                              <button type="button" className="sr-only" onClick={() => flash('Teams menu (demo).')} aria-label="open menu"><span>open menu</span></button>
                            </div>
                          </div>
                        </div>
                      </span>
                    </div>
                  </div>

                  {/* SPACER — d5 plain div (after external links) */}
                  <div style={{display:'contents'}} />

                  {/* MORE — separate d5 listitem → d6 → d7 → d8 wrapper → d9 button */}
                  <div role="listitem" style={{display:'contents'}}>
                    <div style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div style={{display:'contents'}}>
                          <button
                            type="button"
                            className={(activeSidebar === 'more' ? 'jira-sb-link is-active' : 'jira-sb-link') + ' jira-sb-link--more'}
                            title="More" aria-label="More"
                            onClick={() => setActiveSidebar('more')}
                          >
                            <div style={{display:'contents'}}>
                              <div className="jira-sb-link__icon" aria-hidden><SidebarIcon name="dots" /></div>
                              <div className="jira-sb-link__label"><div aria-hidden style={{display:'contents'}} /><div><span>More</span></div></div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                {/* end div[role=list] */}
              </div>
              {/* end d3 inner content */}
            </div>
            {/* end d2 scroll container */}
            {/* d2 side-nav-recommendation — EMPTY, sibling of scroll container inside d1 wrapper */}
            <div data-testid="side-nav-recommendation.jira-side-nav" />
          </div>
          {/* end d1 main wrapper */}
        </nav>

        {/* panel-splitter — matches reference sidebar-entry testid hierarchy */}
        <div>
          <div data-testid="sidebar-entry.panel-splitter-container">
            <div data-testid="sidebar-entry.panel-splitter-tooltip--container" role="presentation">
              <div data-testid="sidebar-entry.panel-splitter">
                <span className="sr-only">Resize side navigation panel</span>
              </div>
            </div>
          </div>
        </div>

        <main className="jira-workspace" data-testid="page-layout.main" role="main">{renderWorkspaceContent()}</main>
        <section data-testid="page-layout.aside" aria-label="Panel" style={{display:'none'}} />
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

      {showCreateStatusModal ? (
        <CreateStatusModal
          onClose={() => setShowCreateStatusModal(false)}
          onSubmit={submitCreateStatus}
        />
      ) : null}

      <div data-testid="issue-create-restore.ui.issue-restore.in-progress-initialiser.not-saving" style={{display:'none'}} />
      <div data-testid="shared-layout.ui.global.command-palette-container">
        <div data-testid="command-palette-integration.ui.container" />
      </div>

      <div
        className="jira-fab"
        data-region="rovo-fab"
        data-testid="layout-controller.ui.bottom-right-corner.container.styled-container"
        style={{
          position: 'fixed',
          right: 'var(--ds-space-300, 24px)',
          bottom: 'var(--ds-space-300, 24px)',
          zIndex: 100,
        }}
      >
        <div>
          <div style={{display:'contents'}}>
            <div style={{display:'contents'}}>
              <div style={{display:'contents'}}>
                <div style={{display:'contents'}}>
                  <button data-testid="platform-ai-button" type="button" className="jira-fab__btn" aria-label="Open Rovo Chat" title="Open Rovo Chat">
                    <span className="jira-fab__ring" />
                    <span className="sr-only">Open Rovo Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast ? <div className="jira-toast" role="status">{toast}</div> : null}

      <span aria-hidden="true" data-testid="triggered-message-validator-hidden" style={{display:'none'}} />
      <span aria-hidden="true" data-testid="triggered-message-validator-hidden" style={{display:'none'}} />

      <div data-region="modal-portal" />
      {/* portal container emitted by main.tsx directly into body */}
      {typeof document !== 'undefined' && createPortal(
        <>
          <div id="flags"><div></div></div>
          <div id="heartbeat"></div>
          <div id="engagement-messages"><div></div></div>
          <div id="profilecard-app"><div></div></div>
        </>,
        document.body
      )}
    </div>
    </>
  )
}

function InlineCreateForm({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="jira-inline-create">
      <textarea
        autoFocus
        aria-label="What needs to be done?"
        placeholder="What needs to be done?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }}
      />
      <p className="jira-inline-create__hint">press Enter to submit</p>
      <div className="jira-inline-create__actions">
        <button type="button" aria-label="Select work type. Task currently selected.">Task</button>
        <button type="button" aria-label="Due date">Due date</button>
        <button type="button" aria-label="Assignee: Unassigned">Assignee: Unassigned</button>
        <button type="button" disabled={value.trim() === ''} aria-label="⏎ Create">⏎ Create</button>
      </div>
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
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void
  dropTarget: { groupKey: string } | null
  onDragStart: (cardId: string) => void
  onDragOver: (event: DragEvent<HTMLElement>, groupKey: string) => void
  onDragEnd: () => void
  onDrop: (groupKey: string) => void
  searchTerm?: string
  onClearSearch?: () => void
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
  onUpdateCard,
  dropTarget,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  searchTerm,
  onClearSearch,
}: BoardViewProps) {
  void columnMenuFor
  void onOpenColumnMenu
  void onCreateCardForColumn
  void onDeleteCard
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set())
  const [inlineCreateColumnId, setInlineCreateColumnId] = useState<string | null>(null)
  const [localColumnMenu, setLocalColumnMenu] = useState<string | null>(null)
  const [editingSummaryCardId, setEditingSummaryCardId] = useState<string | null>(null)
  const [editingSummaryValue, setEditingSummaryValue] = useState('')

  useEffect(() => {
    if (!localColumnMenu) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLocalColumnMenu(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [localColumnMenu])

  useEffect(() => {
    if (!editingSummaryCardId) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setEditingSummaryCardId(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editingSummaryCardId])

  function toggleCollapse(key: string) {
    setCollapsedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  return (
    <div className="jira-board-canvas" data-region="board-canvas" data-testid="board.content.board-wrapper">
      <div className="jira-columns">
        {groups.map((group) => {
          const isCollapsed = collapsedColumns.has(group.key)
          return (
          <div key={group.key} style={{display:'contents'}}>
          <div
            data-testid="board.content.cell"
            className={[
              'jira-col',
              dropTarget?.groupKey === group.key ? 'is-drop-target' : '',
              isCollapsed ? 'jira-col--collapsed' : '',
            ].filter(Boolean).join(' ')}
            onDragOver={(event) => onDragOver(event, group.key)}
            onDrop={() => onDrop(group.key)}
          >
            <div className="jira-col__head" data-testid="board.content.cell.column-header">
              {group.meta}
              <div style={{display:'contents'}}>
                <div style={{display:'contents'}}>
                  <form role="presentation" style={{display:'contents'}} onSubmit={e=>e.preventDefault()}>
                    <div style={{display:'contents'}}>
                      <div style={{display:'contents'}}>
                        <div role="presentation" style={{display:'contents'}}>
                          <div style={{display:'contents'}}>
                            <div data-testid="board.content.cell.column-header.name" role="heading" aria-level={3} style={{display:'contents'}}>
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
                            </div>
                            <span className="jira-col__count"><span>{group.cards.length}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              <button
                type="button"
                className="jira-icon-btn jira-col__collapse-btn"
                aria-label={isCollapsed ? `Expand ${group.title}` : `Collapse ${group.title}`}
                onClick={() => toggleCollapse(group.key)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {isCollapsed
                    ? <path d="M8 5l8 7-8 7V5z"/>
                    : <path d="M5 8l7 8 7-8H5z"/>}
                </svg>
                <span className="vh-sr">{isCollapsed ? `Expand ${group.title}` : `Collapse ${group.title}`}</span>
              </button>
              <div style={{position:'relative'}}>
                <button
                  type="button"
                  className="jira-icon-btn jira-col__more-actions-btn"
                  aria-label={`More actions for column ${group.title}`}
                  aria-expanded={localColumnMenu === group.key ? 'true' : 'false'}
                  aria-haspopup="menu"
                  onClick={() => setLocalColumnMenu(localColumnMenu === group.key ? null : group.key)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                  </svg>
                  <span className="vh-sr">More actions for column {group.title}</span>
                </button>
                {localColumnMenu === group.key && (
                  <ul
                    role="menu"
                    aria-label={`More actions for column ${group.title}`}
                    className="jira-col__menu"
                  >
                    <li><button type="button" role="menuitem" className="jira-menu-item" onClick={() => setLocalColumnMenu(null)}>Add agent BETA</button></li>
                    <li><button type="button" role="menuitem" className="jira-menu-item" onClick={() => { setLocalColumnMenu(null); onStartRenameColumn(group.key) }}>Rename status</button></li>
                    <li><button type="button" role="menuitem" className="jira-menu-item" onClick={() => setLocalColumnMenu(null)}>Move column left</button></li>
                    <li><button type="button" role="menuitem" className="jira-menu-item" onClick={() => setLocalColumnMenu(null)}>Move column right</button></li>
                    <li><button type="button" role="menuitem" className="jira-menu-item" onClick={() => { setLocalColumnMenu(null); onDeleteColumn(group.key) }}>Delete status</button></li>
                  </ul>
                )}
              </div>
            </div>
            {!isCollapsed && <div className="jira-col__cards" data-testid="board.content.cell.scroll-container" role="list">
              {group.cards.map((card) => (
                <div key={card.id} role="listitem" className="jira-card-slot">
                  <div className="jira-card-slot__overlay"><div></div></div>
                  <div data-testid="board.content.cell.card">
                  <article
                    className="jira-card"
                    draggable
                    onDragStart={() => onDragStart(card.id)}
                    onDragEnd={onDragEnd}
                  >
                  <a href={`/browse/${card.key}`} aria-label={`${card.key} ${card.title}. Use the enter key to load the work item.`} onClick={(e)=>{ e.preventDefault(); onOpenCard(card.id) }} style={{display:'contents'}}>
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
                  </button>
                  <div className="jira-card__meta">
                    <span
                      className="jira-issue-type"
                      role="img"
                      aria-label="Task"
                      title="Task"
                    >
                      <span className="icon-wrap">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <title>Task</title>
                          <rect x="1" y="1" width="14" height="14" rx="2.5" fill="#1868DB"/>
                          <path d="M4.5 8.5L7 11L11.5 5.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span className="sr-only">Task</span>
                    </span>
                    <span className="jira-key"><span>{card.key}</span></span>
                    <button
                      type="button"
                      className="jira-card__priority"
                      aria-label={`Priority: ${PRIORITIES.find((p) => p.id === card.priority)?.label ?? 'Medium'}`}
                      title={`Priority: ${PRIORITIES.find((p) => p.id === card.priority)?.label ?? 'Medium'}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      <span className="icon-wrap">
                        <PriorityIcon id={card.priority} />
                      </span>
                    </button>
                    <div style={{ marginLeft: 'auto' }}>
                      {card.assigneeId && USER_BY_ID[card.assigneeId] ? (
                        <button
                          type="button"
                          aria-label={`Assignee: ${USER_BY_ID[card.assigneeId].name}`}
                          title={`Assignee: ${USER_BY_ID[card.assigneeId].name}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          <Avatar user={USER_BY_ID[card.assigneeId]} size="sm" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="jira-user-silhouette"
                          aria-label="Assignee: None"
                          title="Assignee: None"
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                          <span className="icon-wrap">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6b778c" aria-hidden="true">
                              <title>Unassigned</title>
                              <circle cx="12" cy="8" r="4" />
                              <path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4v-1z" />
                            </svg>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                  </a>
                  {editingSummaryCardId !== card.id && (
                    <button
                      type="button"
                      aria-label="Edit summary"
                      title="Edit summary"
                      style={{position:'absolute',top:'4px',right:'28px',background:'none',border:'none',cursor:'pointer',padding:'2px 4px',fontSize:'12px',color:'#5e6c84',lineHeight:1}}
                      onClick={(e) => { e.stopPropagation(); setEditingSummaryValue(card.title); setEditingSummaryCardId(card.id) }}
                    >
                      ✎
                    </button>
                  )}
                  {editingSummaryCardId === card.id && (
                    <div style={{padding:'4px 8px 6px'}}>
                      <textarea
                        aria-label="Work item summary"
                        autoFocus
                        value={editingSummaryValue}
                        onChange={(e) => setEditingSummaryValue(e.target.value)}
                        style={{width:'100%',boxSizing:'border-box',resize:'vertical',minHeight:'48px'}}
                      />
                      <div style={{display:'flex',gap:'4px',marginTop:'4px'}}>
                        <button
                          type="button"
                          onClick={() => { onUpdateCard(card.id, { title: editingSummaryValue }); setEditingSummaryCardId(null) }}
                        >Submit</button>
                        <button
                          type="button"
                          onClick={() => setEditingSummaryCardId(null)}
                        >Cancel</button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="jira-card__more-btn"
                    aria-label={`Card actions on Task ${card.key} of the ${group.title} column`}
                    onClick={(event) => { event.stopPropagation() }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="5" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="19" cy="12" r="1.5" />
                    </svg>
                    <span className="vh-sr">Card actions on Task {card.key} of the {group.title} column</span>
                  </button>
                  </article>
                  </div>
                  <div className="jira-card-slot__after" aria-hidden="true"><button type="button" tabIndex={-1}><span><svg aria-hidden="true" viewBox="0 0 16 16" role="presentation" width="16" height="16"></svg></span><span></span></button></div>
                </div>
              ))}
            </div>}
            {!isCollapsed && groupBy === 'status' ? (
              <div style={{display:'contents'}}>
                {inlineCreateColumnId === group.key ? (
                  <InlineCreateForm onClose={() => setInlineCreateColumnId(null)} />
                ) : (
                  <button
                    type="button"
                    className="jira-col__create"
                    aria-label="Create"
                    title="Create"
                    onClick={() => setInlineCreateColumnId(group.key)}
                  >
                    <span aria-hidden="true" className="jira-col__create-icon"></span><span>Create</span>
                  </button>
                )}
              </div>
            ) : null}
          </div>
          </div>
          )
        })}
        {groupBy === 'status' ? (
          <div role="presentation" style={{display:'contents'}}>
            <button type="button" className="jira-col-add" aria-label="Create status" title="Create status" onClick={onAddColumn}>
              <img alt="Create status" src="" style={{width:0,height:0,position:'absolute',overflow:'hidden'}} />
              <span aria-hidden="true">+</span>
            </button>
          </div>
        ) : null}
      </div>
      {searchTerm && searchTerm.trim() && groups.every((g) => g.cards.length === 0) ? (
        <div style={{textAlign:'center',padding:'40px',width:'100%'}}>
          <h2>No search results</h2>
          <p>Try a different word, phrase or filter.</p>
          <button type="button" onClick={onClearSearch}>Clear filters</button>
        </div>
      ) : null}
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

function CreateStatusModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('todo')
  const headingId = 'create-status-modal-heading'

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name)
  }

  return (
    <div className="jira-modal-backdrop" onClick={onClose}>
      <div
        className="jira-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(e) => e.stopPropagation()}
      >
        <form className="jira-modal__form" onSubmit={handleSubmit}>
          <div className="jira-modal__header">
            <h1 id={headingId} className="jira-modal__title">Create status</h1>
            <button type="button" className="jira-icon-btn" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <label className="jira-form-field">
            <span>Name</span>
            <input
              id="create-status-name"
              type="text"
              aria-label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </label>

          <label className="jira-form-field">
            <span>Status category</span>
            <select
              aria-label="Status category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="todo">To do</option>
              <option value="inprogress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>

          <div className="jira-modal__footer">
            <span />
            <div className="jira-modal__footer-actions">
              <button type="button" className="jira-btn jira-btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="jira-btn jira-btn--primary"
                disabled={!name.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
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
