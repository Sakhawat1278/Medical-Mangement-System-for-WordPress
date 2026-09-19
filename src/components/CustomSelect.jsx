import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretDown, MagnifyingGlass, Plus, Check, X, Lock } from 'phosphor-react'

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  style, 
  customTriggerStyle, 
  expandDirection = 'down', 
  placeholder = "Select option",
  isSearchable = false,
  isMulti = false,
  onAdd = null,
  addLabel = "Add New",
  positioning = "fixed",
  dropdownMaxHeight = "240px"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)
  const dropdownRef = useRef(null)
  const [autoIsUp, setAutoIsUp] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const selectId = useRef(`ecare-select-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const handleClickOutside = (event) => {
      const path = event.composedPath ? event.composedPath() : []
      if (containerRef.current && !path.includes(containerRef.current) && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleCloseOther = (e) => {
      if (e.detail?.sourceId !== selectId.current) {
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

  // Compute position BEFORE opening — called in the click handler
  const computePosition = () => {
    if (!containerRef.current) return
    if (positioning === 'inline') {
      setAutoIsUp(expandDirection === 'up')
      setDropdownStyle(
        expandDirection === 'up'
          ? { position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0, width: '100%', top: 'auto' }
          : { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, width: '100%', bottom: 'auto' }
      )
      return
    }
    const rect = containerRef.current.getBoundingClientRect()
    const panelHeight = 248 // matches maxHeight on the panel
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUp = spaceBelow < panelHeight + 8 && spaceAbove > spaceBelow

    setAutoIsUp(openUp)
    setDropdownStyle(
      openUp
        ? { position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, top: 'auto' }
        : { position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, bottom: 'auto' }
    )
  }

  const handleToggle = () => {
    if (!isOpen) {
      window.dispatchEvent(new CustomEvent('ecare:close-dropdowns', {
        detail: {
          sourceId: selectId.current,
          target: containerRef.current
        }
      }))
      computePosition()
      setIsOpen(true)
    } else {
      setSearchQuery('')
      setIsOpen(false)
    }
  }

  // After panel mounts, scroll selected item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const activeItem = dropdownRef.current.querySelector('.ecare-dropdown-item.active')
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }
  }, [isOpen])

  const getOptLabel = (opt) => {
    if (!opt) return ''
    if (typeof opt.label === 'string' || typeof opt.label === 'number') return String(opt.label)
    if (typeof opt.label === 'object' && opt.label) {
      if (opt.label.start && opt.label.end) return `${opt.label.start} - ${opt.label.end}`
      if (opt.label.time) return String(opt.label.time)
      if (opt.label.label) return String(opt.label.label)
    }
    if (typeof opt.value === 'string' || typeof opt.value === 'number') return String(opt.value)
    return ''
  }

  const getSelectedOptions = () => {
    if (!isMulti) {
      const matched = (options || []).find(opt => 
        String(opt.value).toLowerCase() === String(value || '').toLowerCase()
      )
      if (matched) return matched;
      if (value !== undefined && value !== null && value !== '') {
        const valLabel = typeof value === 'object' && value ? (value.start && value.end ? `${value.start} - ${value.end}` : (value.time || value.label || '')) : value
        return { value: valLabel, label: valLabel };
      }
      return null;
    }
    const valArray = Array.isArray(value) ? value.map(v => String(v).toLowerCase()) : []
    return (options || []).filter(opt => valArray.includes(String(opt.value).toLowerCase()))
  }

  const selectedOptions = getSelectedOptions()

  const getFilteredOptions = () => {
    if (!isSearchable || !searchQuery) return options

    const query = searchQuery.toLowerCase()
    const hasHeaders = options.some(opt => opt.isHeader)
    if (!hasHeaders) {
      return options.filter(opt => getOptLabel(opt).toLowerCase().includes(query))
    }

    const result = []
    let currentHeader = null
    let headerHasMatch = false
    let tempItems = []

    options.forEach(opt => {
      if (opt.isHeader) {
        if (currentHeader && (headerHasMatch || getOptLabel(currentHeader).toLowerCase().includes(query))) {
          result.push(currentHeader, ...tempItems)
        }
        currentHeader = opt
        headerHasMatch = false
        tempItems = []
      } else {
        if (getOptLabel(opt).toLowerCase().includes(query)) {
          headerHasMatch = true
          tempItems.push(opt)
        }
      }
    })

    if (currentHeader && (headerHasMatch || getOptLabel(currentHeader).toLowerCase().includes(query))) {
      result.push(currentHeader, ...tempItems)
    }

    return result
  }

  const filteredOptions = getFilteredOptions()

  const isUp = expandDirection === 'up' || autoIsUp

  const handleSelect = (val) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(val)
        ? currentValues.filter(v => v !== val)
        : [...currentValues, val]
      onChange(newValues)
    } else {
      onChange(val)
      setIsOpen(false)
    }
  }

  const removeValue = (e, val) => {
    e.stopPropagation()
    const currentValues = Array.isArray(value) ? value : []
    onChange(currentValues.filter(v => v !== val))
  }

  const handleAdd = () => {
    if (onAdd && searchQuery.trim()) {
      onAdd(searchQuery.trim())
      setSearchQuery('')
      setIsOpen(false)
    }
  }

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <div 
        className="ecare-select-trigger"
        onMouseDown={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0 0.875rem',
          // When a customTriggerStyle specifies height/padding, let that control size, otherwise default to 2.5rem (40px)
          height: (customTriggerStyle?.padding || customTriggerStyle?.height) 
            ? 'auto' 
            : (isMulti && selectedOptions.length > 0 ? 'auto' : '2.5rem'),
          minHeight: (customTriggerStyle?.padding || customTriggerStyle?.minHeight || customTriggerStyle?.height) 
            ? 'unset' 
            : '2.5rem',
          border: `1px solid ${isOpen ? 'var(--ecare-primary)' : '#e2e8f0'}`,
          borderRadius: '14px',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          color: selectedOptions ? 'var(--ecare-text-main)' : '#94a3b8',
          minWidth: '120px',
          transition: 'all 0.2s',
          backgroundColor: 'white',
          boxShadow: isOpen ? '0 0 0 3px var(--ecare-primary-bg)' : 'none',
          overflow: 'hidden',
          ...customTriggerStyle
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = 'var(--ecare-primary, #cbd5e1)'
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            const customBorderColor = customTriggerStyle?.borderColor || 
                                      customTriggerStyle?.border?.split(' ').pop() || 
                                      '#e2e8f0';
            e.currentTarget.style.borderColor = customBorderColor;
          }
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, minWidth: 0 }}>
          {isMulti ? (
            selectedOptions.length > 0 ? (
              selectedOptions.map(opt => (
                <div key={opt.value} style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--ecare-primary-bg)', 
                  color: 'var(--ecare-primary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600
                }}>
                  {getOptLabel(opt)}
                  <X size={10} weight="bold" onClick={(e) => removeValue(e, opt.value)} style={{ cursor: 'pointer' }} />
                </div>
              ))
            ) : (
              <span style={{ color: '#94a3b8' }}>{placeholder}</span>
            )
          ) : (
            <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedOptions ? getOptLabel(selectedOptions) : placeholder}
            </span>
          )}
        </div>
        <CaretDown 
          size={12} 
          weight="bold" 
          style={{ 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'currentColor',
            flexShrink: 0,
            opacity: 0.7
          }} 
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className="ecare-select-dropdown"
            initial={{ opacity: 0, y: isUp ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isUp ? 5 : -5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              ...dropdownStyle,
              minWidth: positioning === 'inline' ? 0 : '140px',
              width: positioning === 'inline' ? '100%' : 'max-content',
              maxWidth: '240px',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              zIndex: 99999,
              padding: '4px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              maxHeight: dropdownMaxHeight,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
          >
            {isSearchable && (
              <div style={{ padding: '4px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.6rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <MagnifyingGlass size={14} color="#94a3b8" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Search..."
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: '0.75rem',
                      outline: 'none',
                      width: '100%',
                      color: 'var(--ecare-text-main)'
                    }}
                  />
                </div>
              </div>
            )}

            <div className="ecare-select-options" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
              {filteredOptions.length > 0 ? (
                options.some(opt => opt.isHeader) ? (
                  // Render Grouped Options
                  filteredOptions.map((opt, idx) => {
                    if (opt.isHeader) {
                      return (
                        <div key={`header-${idx}`} style={{ 
                          padding: '0.75rem 0.75rem 0.25rem 0.75rem', 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          color: 'var(--ecare-primary)', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em',
                          backgroundColor: '#f8fafc',
                          position: 'sticky',
                          top: 0,
                          zIndex: 5
                        }}>
                          {getOptLabel(opt)}
                        </div>
                      )
                    }

                    const isSelected = isMulti 
                      ? Array.isArray(value) && value.map(v => String(v).toLowerCase()).includes(String(opt.value).toLowerCase())
                      : String(opt.value).toLowerCase() === String(value || '').toLowerCase()
                    const isDisabled = !!opt.disabled
                    
                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          if (isDisabled) return
                          handleSelect(opt.value)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`ecare-select-option ecare-dropdown-item ${isSelected ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                        style={{
                          padding: '0.5rem 0.75rem 0.5rem 1.25rem',
                          borderRadius: '6px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          transition: 'all 0.1s',
                          marginBottom: '2px',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          width: '100%',
                          boxSizing: 'border-box',
                          opacity: isDisabled ? 0.6 : 1,
                          backgroundColor: isDisabled ? '#f8fafc' : undefined,
                          color: isDisabled ? '#94a3b8' : undefined
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {opt.isBooked && <Lock size={12} weight="bold" color="#ef4444" style={{ flexShrink: 0 }} />}
                          <span>{getOptLabel(opt)}</span>
                        </div>
                        {isSelected && <Check size={14} weight="bold" color="var(--ecare-primary)" style={{ flexShrink: 0 }} />}
                      </div>
                    )
                  })
                ) : (
                  // Render Flat Options
                  filteredOptions.map((opt) => {
                    const isSelected = isMulti 
                      ? Array.isArray(value) && value.map(v => String(v).toLowerCase()).includes(String(opt.value).toLowerCase())
                      : String(opt.value).toLowerCase() === String(value || '').toLowerCase()
                    const isDisabled = !!opt.disabled
                    
                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          if (isDisabled) return
                          handleSelect(opt.value)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`ecare-select-option ecare-dropdown-item ${isSelected ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          transition: 'all 0.1s',
                          marginBottom: '2px',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          width: '100%',
                          boxSizing: 'border-box',
                          opacity: isDisabled ? 0.6 : 1,
                          backgroundColor: isDisabled ? '#f8fafc' : undefined,
                          color: isDisabled ? '#94a3b8' : undefined
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {opt.isBooked && <Lock size={12} weight="bold" color="#ef4444" style={{ flexShrink: 0 }} />}
                          <span>{getOptLabel(opt)}</span>
                        </div>
                        {isSelected && <Check size={14} weight="bold" color="var(--ecare-primary)" style={{ flexShrink: 0 }} />}
                      </div>
                    )
                  })
                )
              ) : (
                <div style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: onAdd ? '0.5rem' : 0 }}>
                    No results found
                  </div>
                  {onAdd && searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={handleAdd}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="ecare-btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.7rem',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={12} weight="bold" />
                      {addLabel} "{searchQuery}"
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomSelect
