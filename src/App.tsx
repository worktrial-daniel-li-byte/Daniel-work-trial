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

const TABS = [
  'Summary',
  'Board',
  'List',
  'Calendar',
  'Timeline',
  'Approvals',
  'Forms',
  'Pages',
  'Attachments',
  'Reports',
  'Archived work items',
  'Shortcuts',
] as const

type Tab = (typeof TABS)[number]

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

type SidebarItem = { id: SidebarItemId; label: string }

type SidebarSection = {
  id: string
  label?: string
  items: SidebarItem[]
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'top',
    items: [
      { id: 'for-you', label: 'For you' },
      { id: 'recent', label: 'Recent' },
      { id: 'starred', label: 'Starred' },
    ],
  },
  {
    id: 'mid',
    items: [
      { id: 'apps', label: 'Apps' },
      { id: 'plans', label: 'Plans' },
    ],
  },
  {
    id: 'spaces',
    label: 'Spaces',
    items: [
      { id: 'autoloop', label: 'Autoloop' },
      { id: 'more-spaces', label: 'More spaces' },
    ],
  },
  {
    id: 'rec',
    label: 'Recommended',
    items: [
      { id: 'create-roadmap', label: 'Create a roadmap' },
      { id: 'import-work', label: 'Import work' },
    ],
  },
  {
    id: 'bot',
    items: [
      { id: 'filters', label: 'Filters' },
      { id: 'dashboards', label: 'Dashboards' },
      { id: 'confluence', label: 'Confluence' },
      { id: 'goals', label: 'Goals' },
      { id: 'teams', label: 'Teams' },
      { id: 'more', label: 'More' },
    ],
  },
]

type PriorityId = 'highest' | 'high' | 'medium' | 'low' | 'lowest'

const PRIORITIES: {
  id: PriorityId
  label: string
  symbol: string
  color: string
  rank: number
}[] = [
  { id: 'highest', label: 'Highest', symbol: '⇑', color: '#c9372c', rank: 5 },
  { id: 'high', label: 'High', symbol: '↑', color: '#e34935', rank: 4 },
  { id: 'medium', label: 'Medium', symbol: '=', color: '#b38600', rank: 3 },
  { id: 'low', label: 'Low', symbol: '↓', color: '#0055cc', rank: 2 },
  { id: 'lowest', label: 'Lowest', symbol: '⇓', color: '#1f75fe', rank: 1 },
]

const PRIORITY_BY_ID = Object.fromEntries(PRIORITIES.map((p) => [p.id, p])) as Record<
  PriorityId,
  (typeof PRIORITIES)[number]
>

type User = {
  id: string
  name: string
  initials: string
  color: string
}

const USERS: User[] = [
  { id: 'fleet', name: 'Fleet', initials: 'F', color: 'linear-gradient(135deg, #8777d9, #6554c0)' },
  { id: 'alex', name: 'Alex Kim', initials: 'AK', color: 'linear-gradient(135deg, #57d9a3, #00875a)' },
  { id: 'priya', name: 'Priya Patel', initials: 'PP', color: 'linear-gradient(135deg, #ff7452, #c9372c)' },
  { id: 'jordan', name: 'Jordan Lee', initials: 'JL', color: 'linear-gradient(135deg, #ffc400, #ff8b00)' },
  { id: 'taylor', name: 'Taylor Nguyen', initials: 'TN', color: 'linear-gradient(135deg, #4c9aff, #0052cc)' },
]

const USER_BY_ID = Object.fromEntries(USERS.map((u) => [u.id, u])) as Record<string, User>

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

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    function onDown(event: MouseEvent) {
      if (!(event.target instanceof Node)) return
      if (ref.current && !ref.current.contains(event.target)) handler()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [ref, handler, enabled])
}

function Avatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' }) {
  return (
    <div
      className={size === 'sm' ? 'jira-avatar jira-avatar--sm' : 'jira-avatar'}
      style={{ background: user.color }}
      title={user.name}
      aria-label={user.name}
    >
      {user.initials}
    </div>
  )
}

function PriorityIcon({ id, withLabel = false }: { id: PriorityId; withLabel?: boolean }) {
  const priority = PRIORITY_BY_ID[id]
  return (
    <span className="jira-priority-chip" style={{ color: priority.color }}>
      <span aria-hidden>{priority.symbol}</span>
      {withLabel ? <span className="jira-priority-chip__label">{priority.label}</span> : null}
    </span>
  )
}

type PopoverProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

function Popover({ open, onClose, children, align = 'right', className }: PopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  useClickOutside(ref, onClose, open)
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      ref={ref}
      className={`jira-popover jira-popover--${align}${className ? ` ${className}` : ''}`}
      role="menu"
    >
      {children}
    </div>
  )
}

function JiraIcon() {
  return (
    <svg className="jira-mark" viewBox="0 0 32 32" width="32" height="32" aria-hidden>
      <path fill="#2684FF" d="M16 0L0 11.2V32l16-10.4V0z" />
      <path fill="url(#jiraGrad)" d="M16 0l16 11.2V32L16 21.6V0z" />
      <defs>
        <linearGradient id="jiraGrad" x1="100%" y1="0" x2="0" y2="100%">
          <stop offset="18%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

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
          <div className="jira-title-row">
            <span className="jira-project-swatch" aria-hidden />
            <h1 className="jira-project-name">Autoloop</h1>
            <div className="jira-rel">
              <button
                type="button"
                className="jira-icon-btn jira-tiny"
                aria-label="Project actions"
                onClick={() => toggleMenu('project-actions')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              <Popover open={openMenu === 'project-actions'} onClose={() => setOpenMenu(null)} align="left">
                <MenuButton onClick={() => { flash('Project settings are not implemented in this demo.'); setOpenMenu(null) }}>Project settings</MenuButton>
                <MenuButton onClick={() => { flash('Starred Autoloop.'); setOpenMenu(null) }}>Star project</MenuButton>
                <MenuButton onClick={() => { copyBoardLink(); setOpenMenu(null) }}>Copy board link</MenuButton>
              </Popover>
            </div>
          </div>
          <nav className="jira-tabs" aria-label="Project">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={tab === activeTab ? 'jira-tab is-active' : 'jira-tab'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
            <button
              type="button"
              className="jira-tab jira-tab--add"
              aria-label="Add tab"
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
                      <circle cx="10.5" cy="10.5" r="6.5" />
                      <path d="M16 16l4 4" />
                    </svg>
                  </span>
                  <input
                    ref={boardSearchRef}
                    type="search"
                    placeholder="Search board"
                    value={boardSearch}
                    onChange={(event) => setBoardSearch(event.target.value)}
                  />
                </div>
                <div className="jira-rel">
                  <button
                    type="button"
                    className={
                      activeFilterCount
                        ? 'jira-btn jira-btn--ghost jira-btn--sm is-active'
                        : 'jira-btn jira-btn--ghost jira-btn--sm'
                    }
                    onClick={() => toggleMenu('filter')}
                  >
                    Filter
                    {activeFilterCount ? (
                      <span className="jira-count-badge">{activeFilterCount}</span>
                    ) : null}
                    <svg className="jira-chevron" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5H7z" />
                    </svg>
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
                    onClick={() => toggleMenu('group')}
                  >
                    Group: {groupBy === 'status' ? 'Status' : groupBy === 'priority' ? 'Priority' : 'Assignee'}
                    <svg className="jira-chevron" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
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
                    aria-label="View options"
                    onClick={() => toggleMenu('view-options')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
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
                    aria-label="More"
                    onClick={() => toggleMenu('board-more')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
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
          <JiraIcon />
          <div className="jira-rel">
            <button
              type="button"
              className="jira-icon-btn"
              aria-label="Home"
              onClick={() => toggleMenu('home')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
              </svg>
            </button>
            <Popover open={openMenu === 'home'} onClose={() => setOpenMenu(null)} align="left" className="jira-popover--wide">
              <div className="jira-popover__title">Jump back in</div>
              {allCards.slice(-5).reverse().map((card) => (
                <MenuButton
                  key={card.id}
                  onClick={() => {
                    setActiveSidebar('autoloop')
                    setActiveTab('Board')
                    openCardDetail(card.id)
                    setOpenMenu(null)
                  }}
                >
                  <span className="jira-key">{card.key}</span>
                  <span className="jira-menu-ellipsis">{card.title}</span>
                </MenuButton>
              ))}
              {allCards.length === 0 ? <div className="jira-popover__empty">Nothing recent</div> : null}
            </Popover>
          </div>
          <div className="jira-rel">
            <button
              type="button"
              className="jira-icon-btn"
              aria-label="App switcher"
              onClick={() => toggleMenu('appswitcher')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="3" y="3" width="8" height="8" rx="1" />
                <rect x="13" y="3" width="8" height="8" rx="1" />
                <rect x="3" y="13" width="8" height="8" rx="1" />
                <rect x="13" y="13" width="8" height="8" rx="1" />
              </svg>
            </button>
            <Popover open={openMenu === 'appswitcher'} onClose={() => setOpenMenu(null)} align="left">
              <div className="jira-popover__title">Your apps</div>
              {['Jira', 'Confluence', 'Bitbucket', 'Compass', 'Trello'].map((name) => (
                <MenuButton
                  key={name}
                  selected={name === 'Jira'}
                  onClick={() => {
                    flash(`${name} opened`)
                    setOpenMenu(null)
                  }}
                >
                  {name}
                </MenuButton>
              ))}
            </Popover>
          </div>
        </div>

        <div className="jira-topbar__search jira-rel">
          <span className="jira-topbar__search-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M16 16l4 4" />
            </svg>
          </span>
          <input
            ref={topSearchRef}
            type="search"
            placeholder="Search"
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

        <div className="jira-topbar__right">
          <button
            type="button"
            className="jira-btn jira-btn--primary"
            onClick={() => openCreateForColumn(columns[0]?.id ?? 'todo')}
          >
            <span>+</span> Create
          </button>
          <button
            type="button"
            className="jira-pill jira-pill--trial"
            onClick={() => flash('Premium trial: thanks for the interest!')}
          >
            Premium trial
          </button>
          <button
            type="button"
            className="jira-icon-btn"
            aria-label="Ask Rovo"
            title="Ask Rovo"
            onClick={() => flash('Rovo says: ship it.')}
          >
            <span className="jira-rovo-spark" />
          </button>
          <div className="jira-rel">
            <button
              type="button"
              className="jira-icon-btn jira-icon-btn--badge"
              aria-label="Notifications"
              onClick={() => toggleMenu('notifications')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3a5 5 0 0 0-5 5v2.1L5.5 12v1h13v-1L17 10.1V8a5 5 0 0 0-5-5z" />
                <path d="M9.5 19a2.5 2.2 0 0 0 5 0" />
              </svg>
              {unreadCount > 0 ? <span className="jira-icon-btn__badge">{unreadCount}</span> : null}
            </button>
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
              onClick={() => toggleMenu('settings')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
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
          <div className="jira-rel">
            <button
              type="button"
              className="jira-avatar-button"
              onClick={() => toggleMenu('avatar')}
              aria-label="User menu"
            >
              <Avatar user={USER_BY_ID['fleet']} />
            </button>
            <Popover open={openMenu === 'avatar'} onClose={() => setOpenMenu(null)}>
              <div className="jira-popover__user">
                <Avatar user={USER_BY_ID['fleet']} />
                <div>
                  <div className="jira-popover__user-name">Fleet</div>
                  <div className="jira-popover__user-meta">fleet@autoloop.dev</div>
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
              <div key={section.id} className="jira-sidebar__section">
                {section.label ? <div className="jira-sidebar__label">{section.label}</div> : null}
                <ul>
                  {section.items.map((item) => {
                    const active = item.id === activeSidebar
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={active ? 'jira-sb-link is-active' : 'jira-sb-link'}
                          onClick={() => setActiveSidebar(item.id)}
                        >
                          {item.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
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
        <span className="jira-fab__ring" />
      </div>

      {toast ? <div className="jira-toast" role="status">{toast}</div> : null}
    </div>
  )
}

function MenuButton({
  children,
  onClick,
  selected,
}: {
  children: ReactNode
  onClick: () => void
  selected?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={selected ? 'jira-menu-item is-selected' : 'jira-menu-item'}
      onClick={onClick}
    >
      {children}
    </button>
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
                  {group.title}
                </button>
              )}
              <span className="jira-col__count">{group.cards.length}</span>
              {groupBy === 'status' && !disableColumnEditing ? (
                <div className="jira-rel jira-col__more">
                  <button
                    type="button"
                    className="jira-icon-btn jira-tiny"
                    aria-label="Column actions"
                    onClick={() => onOpenColumnMenu(columnMenuFor === group.key ? null : group.key)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="19" cy="12" r="1.6" />
                    </svg>
                  </button>
                  <Popover open={columnMenuFor === group.key} onClose={() => onOpenColumnMenu(null)}>
                    <MenuButton
                      onClick={() => {
                        onOpenColumnMenu(null)
                        onStartRenameColumn(group.key)
                      }}
                    >
                      Rename
                    </MenuButton>
                    <MenuButton
                      onClick={() => {
                        onOpenColumnMenu(null)
                        onDeleteColumn(group.key)
                      }}
                    >
                      Delete column
                    </MenuButton>
                  </Popover>
                </div>
              ) : null}
            </div>
            <div className="jira-col__cards">
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
                    <p className="jira-card__title">{card.title}</p>
                    <div className="jira-card__meta">
                      <span className="jira-issue-type" aria-hidden />
                      <span className="jira-key">{card.key}</span>
                      <PriorityIcon id={card.priority} />
                      <div style={{ marginLeft: 'auto' }}>
                        <Avatar user={USER_BY_ID[card.assigneeId] ?? USERS[0]} size="sm" />
                      </div>
                    </div>
                  </button>
                </article>
              ))}
              {group.cards.length === 0 ? (
                <div className="jira-col__empty">Drop cards here</div>
              ) : null}
            </div>
            {groupBy === 'status' ? (
              <button
                type="button"
                className="jira-col__create"
                onClick={() => onCreateCardForColumn(group.key)}
              >
                <span>+</span> Create
              </button>
            ) : null}
          </div>
        ))}
        {groupBy === 'status' ? (
          <button type="button" className="jira-col-add" aria-label="Add column" onClick={onAddColumn}>
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
