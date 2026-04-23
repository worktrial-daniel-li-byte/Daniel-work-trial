import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

{
  // Mirror the reference's body > .atlaskit-portal-container structure exactly:
  // 1 container with 7 .atlaskit-portal children, each containing
  // div[data-theme][data-color-mode][data-subtree-theme] > div[data-vc-oob]
  let portal = document.querySelector<HTMLDivElement>('body > .atlaskit-portal-container')
  if (!portal) {
    portal = document.createElement('div')
    portal.className = 'atlaskit-portal-container'
    document.body.appendChild(portal)
  }
  portal.setAttribute('style', 'display: flex;')
  // Rebuild to exactly 7 portals with the correct subtree
  portal.innerHTML = ''
  for (let i = 0; i < 7; i++) {
    const innerPortal = document.createElement('div')
    innerPortal.className = 'atlaskit-portal'
    innerPortal.setAttribute('style', 'z-index: 600;')
    const theme = document.createElement('div')
    theme.setAttribute('data-theme', 'dark:dark light:light spacing:spacing typography:typography')
    theme.setAttribute('data-color-mode', 'light')
    theme.setAttribute('data-subtree-theme', 'true')
    const vcOob = document.createElement('div')
    vcOob.setAttribute('data-vc-oob', 'true')
    theme.appendChild(vcOob)
    innerPortal.appendChild(theme)
    portal.appendChild(innerPortal)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
