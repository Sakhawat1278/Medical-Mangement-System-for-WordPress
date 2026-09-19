import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CaretDown, Check } from 'phosphor-react'

const CustomTimePicker = ({ value, onChange, placeholder = "Select time", style, customTriggerStyle, expandDirection = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const dropdownRef = useRef(null)

  // Generate hours (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  // Generate minutes (0-55, step 5)
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))
  const periods = ['AM', 'PM']

  // Parse current value
  const parseValue = (val) => {
    if (!val) return { h: '09', m: '00', p: 'AM' }
    const match = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (match) return { h: match[1].padStart(2, '0'), m: match[2], p: match[3].toUpperCase() }
    
    // Support 24-hour format conversion
    const match24 = val.match(/^(\d{1,2}):(\d{2})$/)
    if (match24) {
      let hours24 = parseInt(match24[1], 10)
      const mins = match24[2]
      let period = 'AM'
      if (hours24 >= 12) {
        period = 'PM'
        if (hours24 > 12) hours24 -= 12
      }
      if (hours24 === 0) hours24 = 12
      return { h: hours24.toString().padStart(2, '0'), m: mins, p: period }
    }
    return { h: '09', m: '00', p: 'AM' }
  }

  const { h, m, p } = parseValue(value)
  const pickerId = useRef(`ecare-timepicker-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const handleClickOutside = (event) => {
      const path = event.composedPath ? event.composedPath() : []
      if (containerRef.current && !path.includes(containerRef.current) && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleCloseOther = (e) => {
      if (e.detail?.sourceId !== pickerId.current) {
        if (containerRef.current && e.detail?.target && containerRef.current.contains(e.detail.target)) {
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

  const handleSelect = (type, val) => {
    let newH = h, newM = m, newP = p
    if (type === 'h') newH = val
    if (type === 'm') newM = val
    if (type === 'p') newP = val
    
    onChange(`${newH}:${newM} ${newP}`)
  }

  const [dropdownStyle, setDropdownStyle] = useState({})
  const [autoIsUp, setAutoIsUp] = useState(false)
  const isUp = expandDirection === 'up' || autoIsUp

  const computePosition = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const panelHeight = 240
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUp = expandDirection === 'up' || (expandDirection !== 'down' && spaceBelow < panelHeight + 8 && spaceAbove > spaceBelow)

    setAutoIsUp(openUp)
    const leftPos = Math.max(8, Math.min(rect.left, window.innerWidth - 248))

    setDropdownStyle(
      openUp
        ? { position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: leftPos, minWidth: '240px', width: '240px', top: 'auto' }
        : { position: 'fixed', top: rect.bottom + 4, left: leftPos, minWidth: '240px', width: '240px', bottom: 'auto' }
    )
  }

  const handleToggle = (e) => {
    e?.stopPropagation()
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('ecare:close-dropdowns', {
        detail: {
          sourceId: pickerId.current,
          target: containerRef.current
        }
      }))
      computePosition()
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 999 : 'auto', ...style }}>
      <div 
        className="ecare-timepicker-trigger"
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0.875rem',
          height: (customTriggerStyle?.padding || customTriggerStyle?.height) ? 'auto' : '2.5rem',
          minHeight: (customTriggerStyle?.padding || customTriggerStyle?.minHeight || customTriggerStyle?.height) ? 'unset' : '2.5rem',
          border: `1px solid ${isOpen ? 'var(--ecare-primary)' : '#e2e8f0'}`,
          borderRadius: '14px',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          backgroundColor: 'white',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 3px var(--ecare-primary-bg)' : 'none',
          boxSizing: 'border-box',
          ...customTriggerStyle
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = 'var(--ecare-primary, #cbd5e1)'
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = '#e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: value ? 'var(--ecare-text-main)' : '#94a3b8', whiteSpace: 'nowrap', minWidth: 0 }}>
          <Clock size={14} weight="bold" style={{ color: '#64748b', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{value || placeholder}</span>
        </div>
        <CaretDown size={12} weight="bold" style={{ color: '#64748b', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: '4px' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isUp ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isUp ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            style={{
              ...dropdownStyle,
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f1f5f9',
              zIndex: 10000,
              padding: '12px',
              display: 'flex',
              gap: '8px'
            }}
          >
            {/* Hours Column */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Hours</div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '0 4px' }} className="ecare-custom-scroll">
                {hours.map(hour => (
                  <div 
                    key={hour} 
                    onClick={() => handleSelect('h', hour)}
                    style={{
                      padding: '6px 0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: h === hour ? 700 : 500,
                      background: h === hour ? 'var(--ecare-primary-bg)' : 'transparent', color: h === hour ? 'var(--ecare-primary)' : 'var(--ecare-text-main)',
                      marginBottom: '2px', transition: 'all 0.1s'
                    }}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Min</div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '0 4px' }} className="ecare-custom-scroll">
                {minutes.map(min => (
                  <div 
                    key={min} 
                    onClick={() => handleSelect('m', min)}
                    style={{
                      padding: '6px 0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: m === min ? 700 : 500,
                      background: m === min ? 'var(--ecare-primary-bg)' : 'transparent', color: m === min ? 'var(--ecare-primary)' : 'var(--ecare-text-main)',
                      marginBottom: '2px', transition: 'all 0.1s'
                    }}
                  >
                    {min}
                  </div>
                ))}
              </div>
            </div>

            {/* Period Column */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Period</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {periods.map(period => (
                  <div 
                    key={period} 
                    onClick={() => handleSelect('p', period)}
                    style={{
                      padding: '8px 0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: p === period ? 700 : 500,
                      background: p === period ? 'var(--ecare-primary-bg)' : 'transparent', color: p === period ? 'var(--ecare-primary)' : 'var(--ecare-text-main)',
                      transition: 'all 0.1s'
                    }}
                  >
                    {period}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomTimePicker
