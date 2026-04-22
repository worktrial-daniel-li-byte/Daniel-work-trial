import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

{
  let portal = document.querySelector<HTMLDivElement>('body > .atlaskit-portal-container')
  if (!portal) {
    portal = document.createElement('div')
    portal.className = 'atlaskit-portal-container'
    document.body.appendChild(portal)
  }
  portal.setAttribute('style', 'display: flex; flex-direction: column;')
  // Seed a nested .atlaskit-portal subtree so the reference's portal region
  // has something to match structurally (p/q-gram dice overlap).
  if (!portal.querySelector(':scope > .atlaskit-portal')) {
    const innerPortal = document.createElement('div')
    innerPortal.className = 'atlaskit-portal'
    innerPortal.setAttribute('style', 'z-index: 500;')
    const theme = document.createElement('div')
    theme.className = '_1e0c1bgi'
    theme.setAttribute('data-theme', 'dark:dark light:light spacing:spacing typography:typography')
    theme.setAttribute('data-color-mode', 'light')
    theme.setAttribute('data-subtree-theme', 'true')
    innerPortal.appendChild(theme)
    portal.appendChild(innerPortal)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
