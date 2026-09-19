import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Dropdown = ({ trigger, items, align = 'right', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const dropdownId = useRef(`ecare-dropdown-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const handleClickOutside = (event) => {
      const path = event.composedPath ? event.composedPath() : []
      if (dropdownRef.current && !path.includes(dropdownRef.current) && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleCloseOther = (e) => {
      if (e.detail?.sourceId !== dropdownId.current) {
        if (dropdownRef.current && e.detail?.target && dropdownRef.current.contains(e.detail.target)) {
          return
        }
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('ecare:close-dropdowns', handleCloseOther)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('ecare:close-dropdowns', handleCloseOther)
    }
  }, [])

  const handleToggle = (e) => {
    e?.stopPropagation()
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('ecare:close-dropdowns', {
        detail: {
          sourceId: dropdownId.current,
          target: dropdownRef.current
        }
      }))
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <div className={`ecare-dropdown ${className}`.trim()} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }} ref={dropdownRef}>
      <div className="ecare-dropdown-trigger" onClick={handleToggle} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, width: '100%' }}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ecare-dropdown-menu"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              [align === 'right' ? 'right' : 'left']: 0,
              minWidth: '200px',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              zIndex: 1000,
              padding: '0.5rem',
              overflow: 'hidden'
            }}
          >
            {items.map((item, index) => (
              <div key={index} className="ecare-dropdown-item-wrapper">
                {item.type === 'divider' ? (
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                ) : (
                  <button
                    onClick={() => {
                      item.onClick?.()
                      setIsOpen(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.1s',
                      color: item.danger ? '#ef4444' : undefined
                    }}
                    className={`ecare-dropdown-item ${item.isActive ? 'active' : ''}`}
                  >
                    {item.icon && <span style={{ display: 'flex', color: item.danger ? '#ef4444' : '#94a3b8' }}>{item.icon}</span>}
                    {item.label}
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dropdown
