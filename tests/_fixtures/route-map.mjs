// Map from live-Jira URL paths the generated specs use to the corresponding
// tab inside the local SPA. The local app has no client-side router:
// every path is served index.html by Vite's SPA fallback, and the visible
// view is driven by `preferences.activeTab` in localStorage. So for each
// Jira path we declare which tab the app should boot into — the fixture
// seeds that into localStorage before the page loads.
//
// The pathname itself is preserved when rewriting (only the origin is
// swapped to localhost), so specs that assert `toHaveURL(/…\/calendar/)`
// keep passing.
//
// Add new entries here as you add new specs. `match` is tested against
// the URL's pathname.

export const ROUTE_MAP = [
  { id: 'board',     match: /\/jira\/core\/projects\/[^/]+\/board\b/,     tab: 'Board' },
  { id: 'list',      match: /\/jira\/core\/projects\/[^/]+\/list\b/,      tab: 'List' },
  { id: 'calendar',  match: /\/jira\/core\/projects\/[^/]+\/calendar\b/,  tab: 'Calendar' },
  { id: 'timeline',  match: /\/jira\/core\/projects\/[^/]+\/timeline\b/,  tab: 'Timeline' },
  { id: 'summary',   match: /\/jira\/core\/projects\/[^/]+\/summary\b/,   tab: 'Summary' },
  { id: 'approvals', match: /\/jira\/core\/projects\/[^/]+\/approvals\b/, tab: 'Approvals' },
  { id: 'forms',     match: /\/jira\/core\/projects\/[^/]+\/forms\b/,     tab: 'Forms' },
  { id: 'pages',     match: /\/jira\/core\/projects\/[^/]+\/pages\b/,     tab: 'Pages' },
]

// Storage contract with src/App.tsx — keep in sync if STORAGE_KEY / STORAGE_VERSION change.
export const LOCAL_STATE_STORAGE_KEY = 'jira-autoloop-v1'
export const LOCAL_STATE_STORAGE_VERSION = 2

export function findRoute(pathname) {
  return ROUTE_MAP.find((r) => r.match.test(pathname)) || null
}

// Swap the origin of `targetUrl` onto `baseUrl` (localhost) while keeping
// the pathname, search, and hash intact. Returns the matched ROUTE_MAP
// entry so the caller can seed `preferences.activeTab` in localStorage.
// If the pathname doesn't match any route, the URL is returned unchanged.
export function rewriteForLocal(targetUrl, baseUrl) {
  const t = new URL(targetUrl)
  const hit = findRoute(t.pathname)
  if (!hit) return { url: targetUrl, route: null }
  const base = new URL(baseUrl)
  const local = new URL(t.pathname + t.search + t.hash, base.origin)
  return { url: local.toString(), route: hit }
}
