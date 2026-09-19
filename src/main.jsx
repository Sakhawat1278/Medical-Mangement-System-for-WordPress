import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ── Shared helper: compute derived palette from a single hex color ──────────
function buildPalette(hex) {
  const adjust = (h, amt) => {
    const col = h.startsWith('#') ? h.slice(1) : h
    const num = parseInt(col, 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amt))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
    return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, '0')}`
  }
  return {
    '--ecare-primary':        hex,
    '--ecare-primary-hover':  adjust(hex, -25),
    '--ecare-primary-light':  adjust(hex, 45),
    '--ecare-primary-bg':     `${hex}12`,
    '--ecare-primary-border': `${hex}25`,
    '--ecare-primary-shadow': `${hex}15`,
    '--ecare-primary-v2':     adjust(hex, -40),
    '--ecare-primary-v3':     adjust(hex, 30),
    '--ecare-primary-v4':     adjust(hex, -15),
  }
}

const rootElement = document.getElementById('ecare-admin-root');

if (rootElement) {
  // 1. Create a Shadow Root
  const shadowRoot = rootElement.attachShadow({ mode: 'open' });

  // 2. Create a container for React
  const reactContainer = document.createElement('div');
  reactContainer.id = 'ecare-shadow-inner';
  reactContainer.classList.add('ecare-admin-mode');

  // 3. Apply admin-chosen color IMMEDIATELY via inline style before CSS link loads
  //    Inline styles on the element always take precedence over stylesheet rules,
  //    so this overrides the hardcoded #1b3b2b fallback in index.css.
  const primaryColor = window.ecareConfig?.settings?.primaryColor || window.ecareConfig?.primaryColor || '#1b3b2b';
  const palette = buildPalette(primaryColor)
  Object.entries(palette).forEach(([prop, val]) => reactContainer.style.setProperty(prop, val))

  shadowRoot.appendChild(reactContainer);

  // 4. Inject CSS into Shadow DOM (after element is added, so inline styles already set)
  if (window.ecareConfig && window.ecareConfig.cssUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = window.ecareConfig.cssUrl;
    shadowRoot.appendChild(link);
  }



  // 6. Render React
  ReactDOM.createRoot(reactContainer).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
