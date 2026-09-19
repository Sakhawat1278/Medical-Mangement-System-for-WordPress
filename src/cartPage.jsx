import React from 'react'
import ReactDOM from 'react-dom/client'
import CartStandalone from './CartStandalone.jsx'
import './index.css'

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

const rootElement = document.getElementById('ecare-cart-root');

if (rootElement) {
  const shadowRoot = rootElement.attachShadow({ mode: 'open' });

  const reactContainer = document.createElement('div');
  reactContainer.id = 'ecare-shadow-inner';

  const primaryColor = window.ecareConfig?.settings?.primaryColor || '#1b3b2b';
  if (primaryColor) {
    const palette = buildPalette(primaryColor)
    Object.entries(palette).forEach(([prop, val]) => reactContainer.style.setProperty(prop, val))
  }

  shadowRoot.appendChild(reactContainer);

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = window.ecareConfig?.cssUrl || ''; 
  shadowRoot.appendChild(styleLink);

  ReactDOM.createRoot(reactContainer).render(
    <React.StrictMode>
      <CartStandalone />
    </React.StrictMode>,
  )
}
