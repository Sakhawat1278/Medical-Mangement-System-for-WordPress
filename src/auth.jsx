import React from 'react'
import { createRoot } from 'react-dom/client'
import AuthApp from './AuthApp'
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

const container = document.getElementById('ecare-auth-root')

if (container) {
  // Create Shadow Root for 100% isolation
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Inner container for React
  const inner = document.createElement('div');
  inner.id = 'ecare-shadow-inner';

  // ── Apply admin-chosen color BEFORE CSS link loads ──────────────────────
  // This overrides the hardcoded #1b3b2b fallback in index.css via inline style
  // (element inline styles always win over stylesheet rules for custom properties)
  const config = window.ecareAuthConfig || {};
  const primaryColor = config.primaryColor || '#1b3b2b';
  const palette = buildPalette(primaryColor)
  Object.entries(palette).forEach(([prop, val]) => inner.style.setProperty(prop, val))

  shadowRoot.appendChild(inner);

  // Inject bundled CSS into Shadow DOM
  // The CSS URL is passed via window.ecareAuthConfig
  if (config.cssUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.cssUrl;
    shadowRoot.appendChild(link);
  }

  createRoot(inner).render(<AuthApp />)
}
