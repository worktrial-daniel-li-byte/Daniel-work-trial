import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react'

export type PriorityId = 'highest' | 'high' | 'medium' | 'low' | 'lowest'

export type Priority = {
  id: PriorityId
  label: string
  symbol: string
  color: string
  rank: number
}

export const PRIORITIES: Priority[] = [
  { id: 'highest', label: 'Highest', symbol: '⇑', color: '#c9372c', rank: 5 },
  { id: 'high', label: 'High', symbol: '↑', color: '#e34935', rank: 4 },
  { id: 'medium', label: 'Medium', symbol: '=', color: '#b38600', rank: 3 },
  { id: 'low', label: 'Low', symbol: '↓', color: '#0055cc', rank: 2 },
  { id: 'lowest', label: 'Lowest', symbol: '⇓', color: '#1f75fe', rank: 1 },
]

export const PRIORITY_BY_ID = Object.fromEntries(
  PRIORITIES.map((p) => [p.id, p]),
) as Record<PriorityId, Priority>

export type User = {
  id: string
  name: string
  initials: string
  color: string
}

export const USERS: User[] = [
  { id: 'fleet', name: 'Daniel Li', initials: 'DL', color: '#8F7EE7' },
  { id: 'alex', name: 'Alex Kim', initials: 'AK', color: 'linear-gradient(135deg, #57d9a3, #00875a)' },
  { id: 'priya', name: 'Priya Patel', initials: 'PP', color: 'linear-gradient(135deg, #ff7452, #c9372c)' },
  { id: 'jordan', name: 'Jordan Lee', initials: 'JL', color: 'linear-gradient(135deg, #ffc400, #ff8b00)' },
  { id: 'taylor', name: 'Taylor Nguyen', initials: 'TN', color: 'linear-gradient(135deg, #4c9aff, #0052cc)' },
]

export const USER_BY_ID = Object.fromEntries(USERS.map((u) => [u.id, u])) as Record<string, User>

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
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

export function Avatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' }) {
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

export function PriorityIcon({ id, withLabel = false }: { id: PriorityId; withLabel?: boolean }) {
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
  ariaLabel?: string
}

export function Popover({ open, onClose, children, align = 'right', className, ariaLabel }: PopoverProps) {
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
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

export function MenuButton({
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

export function JiraIcon() {
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
