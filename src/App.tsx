import { type DragEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  getDefaultColumns,
  loadInitialColumns,
  type Card,
  type Column,
} from './state/boardState'

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

const SIDEBAR_LINKS = [
  { group: 'top', items: ['For you', 'Recent', 'Starred'] },
  { group: 'mid', items: ['Apps', 'Plans'] },
  { group: 'spaces', label: 'Spaces', items: ['FitHub', 'More spaces'] },
  { group: 'rec', label: 'Recommended', items: ['Create a roadmap', 'Import work'] },
  { group: 'bot', items: ['Filters', 'Dashboards', 'Confluence', 'Goals', 'Teams', 'More'] },
] as const

type ComposerState =
  | {
      mode: 'create'
      columnId: string
      cardId: null
      title: string
      key: string
    }
  | {
      mode: 'edit'
      columnId: string
      cardId: string
      title: string
      key: string
    }
  | null

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
  const [columns, setColumns] = useState<Column[]>(() => getDefaultColumns())
  const [isInitialStateReady, setIsInitialStateReady] = useState(false)
  const [composer, setComposer] = useState<ComposerState>(null)
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; fromColumnId: string } | null>(null)
  const [dropColumnId, setDropColumnId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    void loadInitialColumns().then((loadedColumns) => {
      if (isMounted) {
        setColumns(loadedColumns)
        setIsInitialStateReady(true)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const nextIssueKey = useMemo(() => {
    const maxNumber = columns
      .flatMap((column) => column.cards)
      .map((card) => Number(card.key.replace(/^FIT-/, '')))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0)

    return `FIT-${maxNumber + 1}`
  }, [columns])

  if (!isInitialStateReady) {
    return <div className="jira-app">Loading board...</div>
  }

  function openCreateCard(columnId: string) {
    setComposer({
      mode: 'create',
      columnId,
      cardId: null,
      title: '',
      key: nextIssueKey,
    })
  }

  function openEditCard(columnId: string, card: Card) {
    setComposer({
      mode: 'edit',
      columnId,
      cardId: card.id,
      title: card.title,
      key: card.key,
    })
  }

  function closeComposer() {
    setComposer(null)
  }

  function handleComposerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!composer) return

    const title = composer.title.trim()
    const key = composer.key.trim() || nextIssueKey

    if (!title) {
      return
    }

    setColumns((currentColumns) =>
      currentColumns.map((column) => {
        if (column.id !== composer.columnId) {
          return column
        }

        if (composer.mode === 'create') {
          return {
            ...column,
            cards: [
              ...column.cards,
              {
                id: `card-${crypto.randomUUID()}`,
                title,
                key,
                priority: '=',
                assignee: 'F',
              },
            ],
          }
        }

        return {
          ...column,
          cards: column.cards.map((card) =>
            card.id === composer.cardId
              ? {
                  ...card,
                  title,
                  key,
                }
              : card,
          ),
        }
      }),
    )

    closeComposer()
  }

  function deleteCard(columnId: string, cardId: string) {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId
          ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) }
          : column,
      ),
    )

    setComposer((currentComposer) =>
      currentComposer?.mode === 'edit' && currentComposer.cardId === cardId ? null : currentComposer,
    )
  }

  function handleDragStart(columnId: string, cardId: string) {
    setDraggedCard({ fromColumnId: columnId, cardId })
    setDropColumnId(columnId)
  }

  function handleDragOver(event: DragEvent<HTMLElement>, columnId: string) {
    event.preventDefault()
    if (dropColumnId !== columnId) {
      setDropColumnId(columnId)
    }
  }

  function moveCard(toColumnId: string) {
    if (!draggedCard) return

    const { cardId, fromColumnId } = draggedCard
    if (fromColumnId === toColumnId) {
      setDropColumnId(null)
      return
    }

    setColumns((currentColumns) => {
      const sourceColumn = currentColumns.find((column) => column.id === fromColumnId)
      const movedCard = sourceColumn?.cards.find((card) => card.id === cardId)

      if (!sourceColumn || !movedCard) {
        return currentColumns
      }

      return currentColumns.map((column) => {
        if (column.id === fromColumnId) {
          return {
            ...column,
            cards: column.cards.filter((card) => card.id !== cardId),
          }
        }

        if (column.id === toColumnId) {
          return {
            ...column,
            cards: [...column.cards, movedCard],
          }
        }

        return column
      })
    })

    setDraggedCard(null)
    setDropColumnId(null)
  }

  function handleDragEnd() {
    setDraggedCard(null)
    setDropColumnId(null)
  }

  return (
    <div className="jira-app">
      <header className="jira-topbar">
        <div className="jira-topbar__left">
          <JiraIcon />
          <button type="button" className="jira-icon-btn" aria-label="Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
            </svg>
          </button>
        </div>
        <div className="jira-topbar__search">
          <span className="jira-topbar__search-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M16 16l4 4" />
            </svg>
          </span>
          <input type="search" placeholder="Search" className="jira-search-input" readOnly tabIndex={-1} />
        </div>
        <div className="jira-topbar__right">
          <button type="button" className="jira-btn jira-btn--primary" onClick={() => openCreateCard(columns[0].id)}>
            <span>+</span> Create
          </button>
          <button type="button" className="jira-pill jira-pill--trial">
            Premium trial
          </button>
          <button type="button" className="jira-icon-btn" aria-label="Ask Rovo" title="Ask Rovo">
            <span className="jira-rovo-spark" />
          </button>
          <button type="button" className="jira-icon-btn" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 3a5 5 0 0 0-5 5v2.1L5.5 12v1h13v-1L17 10.1V8a5 5 0 0 0-5-5z" />
              <path d="M9.5 19a2.5 2.2 0 0 0 5 0" />
            </svg>
          </button>
          <button type="button" className="jira-icon-btn" aria-label="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </button>
          <div className="jira-avatar" aria-label="User menu">
            F
          </div>
        </div>
      </header>

      <div className="jira-body">
        <aside className="jira-sidebar">
          <div className="jira-sidebar__scroll">
            {SIDEBAR_LINKS.map((section) => (
              <div key={section.group} className="jira-sidebar__section">
                {'label' in section && section.label ? (
                  <div className="jira-sidebar__label">{section.label}</div>
                ) : null}
                <ul>
                  {section.items.map((item) => {
                    const active = item === 'FitHub'
                    return (
                      <li key={item}>
                        <a
                          className={active ? 'jira-sb-link is-active' : 'jira-sb-link'}
                          href="#"
                          onClick={(e) => e.preventDefault()}
                        >
                          {item}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <main className="jira-workspace">
          <div className="jira-project-top">
            <div className="jira-title-row">
              <span className="jira-project-swatch" aria-hidden />
              <h1 className="jira-project-name">FitHub</h1>
              <button type="button" className="jira-icon-btn jira-tiny" aria-label="Project actions">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
            </div>
            <nav className="jira-tabs" aria-label="Project">
              {TABS.map((t) => (
                <a
                  key={t}
                  className={t === 'Board' ? 'jira-tab is-active' : 'jira-tab'}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  {t}
                </a>
              ))}
              <button type="button" className="jira-tab jira-tab--add" aria-label="Add tab">
                +
              </button>
            </nav>
            <div className="jira-board-bar">
              <div className="jira-board-bar__left">
                <div className="jira-field jira-field--search">
                  <span className="jira-field__icon" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="10.5" cy="10.5" r="6.5" />
                      <path d="M16 16l4 4" />
                    </svg>
                  </span>
                  <input type="search" placeholder="Search board" readOnly tabIndex={-1} />
                </div>
                <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm">
                  Filter
                  <svg className="jira-chevron" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10l5 5 5-5H7z" />
                  </svg>
                </button>
              </div>
              <div className="jira-board-bar__right">
                <button type="button" className="jira-btn jira-btn--ghost jira-btn--sm">
                  Group: Status
                </button>
                <button type="button" className="jira-icon-btn" aria-label="View options">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                  </svg>
                </button>
                <button type="button" className="jira-icon-btn" aria-label="More">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
                    <circle cx="5" cy="12" r="1.6" />
                    <circle cx="12" cy="12" r="1.6" />
                    <circle cx="19" cy="12" r="1.6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="jira-board-canvas">
            <div className="jira-columns">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className={dropColumnId === column.id ? 'jira-col is-drop-target' : 'jira-col'}
                  onDragOver={(event) => handleDragOver(event, column.id)}
                  onDrop={() => moveCard(column.id)}
                >
                  <div className="jira-col__head">
                    <span className="jira-col__title">{column.title}</span>
                    <span className="jira-col__count">{column.cards.length}</span>
                  </div>
                  <div className="jira-col__cards">
                    {column.cards.map((card) => (
                      <article
                        key={card.id}
                        className="jira-card"
                        draggable
                        onDragStart={() => handleDragStart(column.id, card.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="jira-card__actions">
                          <button
                            type="button"
                            className="jira-card__action"
                            onClick={() => openEditCard(column.id, card)}
                            aria-label={`Edit ${card.title}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="jira-card__action jira-card__action--danger"
                            onClick={() => deleteCard(column.id, card.id)}
                            aria-label={`Delete ${card.title}`}
                          >
                            Delete
                          </button>
                        </div>
                        <p className="jira-card__title">{card.title}</p>
                        <div className="jira-card__meta">
                          <span className="jira-issue-type" aria-hidden />
                          <span className="jira-key">{card.key}</span>
                          <span className="jira-priority" title="Medium priority" aria-label="Priority">
                            {card.priority}
                          </span>
                          <div className="jira-avatar jira-avatar--sm" aria-hidden>
                            {card.assignee}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  <button type="button" className="jira-col__create" onClick={() => openCreateCard(column.id)}>
                    <span>+</span> Create
                  </button>
                </div>
              ))}
              <button type="button" className="jira-col-add" aria-label="Add column">
                <span>+</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {composer ? (
        <div className="jira-modal-backdrop" onClick={closeComposer}>
          <div className="jira-modal" role="dialog" aria-modal="true" aria-labelledby="card-dialog-title" onClick={(event) => event.stopPropagation()}>
            <form className="jira-modal__form" onSubmit={handleComposerSubmit}>
              <div className="jira-modal__header">
                <h2 id="card-dialog-title" className="jira-modal__title">
                  {composer.mode === 'create' ? 'Create card' : 'Edit card'}
                </h2>
                <button type="button" className="jira-icon-btn" onClick={closeComposer} aria-label="Close dialog">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <label className="jira-form-field">
                <span>Summary</span>
                <input
                  autoFocus
                  value={composer.title}
                  onChange={(event) => setComposer({ ...composer, title: event.target.value })}
                  placeholder="What needs to get done?"
                />
              </label>

              <label className="jira-form-field">
                <span>Issue key</span>
                <input
                  value={composer.key}
                  onChange={(event) => setComposer({ ...composer, key: event.target.value.toUpperCase() })}
                  placeholder="FIT-16"
                />
              </label>

              <div className="jira-modal__footer">
                {composer.mode === 'edit' ? (
                  <button
                    type="button"
                    className="jira-btn jira-btn--danger"
                    onClick={() => deleteCard(composer.columnId, composer.cardId)}
                  >
                    Delete
                  </button>
                ) : (
                  <span />
                )}
                <div className="jira-modal__footer-actions">
                  <button type="button" className="jira-btn jira-btn--ghost" onClick={closeComposer}>
                    Cancel
                  </button>
                  <button type="submit" className="jira-btn jira-btn--primary" disabled={!composer.title.trim()}>
                    {composer.mode === 'create' ? 'Create' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="jira-fab" role="presentation" title="Rovo">
        <span className="jira-fab__ring" />
      </div>
    </div>
  )
}
