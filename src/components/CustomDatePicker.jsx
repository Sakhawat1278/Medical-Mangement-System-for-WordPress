import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarBlank, CaretLeft, CaretRight } from 'phosphor-react'
import CustomSelect from './CustomSelect'

const CustomDatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  expandDirection = 'down', 
  style, 
  disabled = false, 
  isDateAvailable, 
  customTriggerStyle 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [calendarStyle, setCalendarStyle] = useState({})
  const containerRef = useRef(null)
  
  const getValidDate = (val) => {
    if (!val) return new Date()
    if (typeof val === 'string') {
      const parts = val.split('-').map(Number)
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2])
      }
    }
    const d = new Date(val)
    return isNaN(d.getTime()) ? new Date() : d
  }
  
  const initialDate = getValidDate(value)
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth())
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear())

  useEffect(() => {
    if (value) {
      const d = getValidDate(value)
      setCurrentMonth(d.getMonth())
      setCurrentYear(d.getFullYear())
    }
  }, [value])

  const datePickerId = useRef(`ecare-datepicker-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const handleClickOutside = (event) => {
      const path = event.composedPath ? event.composedPath() : []
      if (containerRef.current && !path.includes(containerRef.current) && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleCloseOther = (e) => {
      if (e.detail?.sourceId !== datePickerId.current) {
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

  const [autoIsUp, setAutoIsUp] = useState(false)
  const isUp = expandDirection === 'up' || autoIsUp

  const computePosition = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const panelHeight = 320
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUp = spaceBelow < panelHeight + 8 && spaceAbove > spaceBelow

    setAutoIsUp(openUp)
    setCalendarStyle(
      openUp
        ? { position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: rect.left, width: '280px', top: 'auto' }
        : { position: 'fixed', top: rect.bottom + 4, left: rect.left, width: '280px', bottom: 'auto' }
    )
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const handlePrevMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDateSelect = (day) => {
    const m = (currentMonth + 1).toString().padStart(2, '0')
    const d = day.toString().padStart(2, '0')
    onChange(`${currentYear}-${m}-${d}`)
    setIsOpen(false)
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const normalizedValue = value ? String(value).trim().slice(0, 10) : ''

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* TRIGGER */}
      <button 
        type="button"
        className="ecare-datepicker-trigger"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled) {
            if (!isOpen) {
              window.dispatchEvent(new CustomEvent('ecare:close-dropdowns', {
                detail: {
                  sourceId: datePickerId.current,
                  target: containerRef.current
                }
              }))
              computePosition()
              setIsOpen(true)
            } else {
              setIsOpen(false)
            }
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0 1.25rem',
          height: '2.5rem',
          border: `1px solid ${isOpen ? 'var(--ecare-primary)' : '#e2e8f0'}`,
          borderRadius: '14px',
          cursor: disabled ? 'default' : 'pointer',
          fontSize: '0.8125rem',
          color: value ? 'var(--ecare-text-main)' : '#94a3b8',
          transition: 'all 0.2s',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          boxShadow: isOpen ? '0 0 0 3px var(--ecare-primary-bg)' : 'none',
          textAlign: 'left',
          outline: 'none',
          opacity: disabled ? 0.7 : 1,
          ...customTriggerStyle
        }}
        onMouseEnter={(e) => {
          if (!isOpen && !disabled) e.currentTarget.style.borderColor = 'var(--ecare-primary, #cbd5e1)'
        }}
        onMouseLeave={(e) => {
          if (!isOpen && !disabled) e.currentTarget.style.borderColor = '#e2e8f0'
        }}
      >
        <span style={{ fontWeight: 500 }}>{value || placeholder}</span>
        <CalendarBlank size={14} weight="bold" color="#64748b" style={{ flexShrink: 0 }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isUp ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isUp ? 5 : -5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              ...calendarStyle,
              minWidth: '280px',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              zIndex: 10000,
              padding: '0.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button 
                type="button" 
                onClick={handlePrevMonth}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b', marginRight: '0.25rem' }}
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', minWidth: 0 }}>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  color: 'var(--ecare-text-main)',
                  padding: '0 0.15rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {monthNames[currentMonth]}
                </span>
                
                <CustomSelect 
                  value={currentYear}
                  onChange={(val) => setCurrentYear(Number(val))}
                  options={Array.from({ length: 120 }, (_, i) => {
                    const y = new Date().getFullYear() - 100 + i;
                    return { value: y, label: y.toString() }
                  })}
                  style={{ width: '72px' }}
                  customTriggerStyle={{ 
                    border: 'none', 
                    padding: '0.25rem 0.2rem 0.25rem 0.4rem', 
                    background: 'transparent',
                    boxShadow: 'none',
                    minWidth: 'unset'
                  }}
                />
              </div>

              <button 
                type="button" 
                onClick={handleNextMonth}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#64748b', marginLeft: '0.25rem' }}
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>

            <div className="ecare-keep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '0.5rem' }}>
              {dayNames.map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>{day}</div>
              ))}
            </div>

            <div className="ecare-keep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`} />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const m = (currentMonth + 1).toString().padStart(2, '0')
                const d = day.toString().padStart(2, '0')
                const dateString = `${currentYear}-${m}-${d}`
                
                const isSelected = normalizedValue === dateString
                const isToday = todayStr === dateString
                const isPast = dateString < todayStr
                
                // Check availability
                const isAvailable = isDateAvailable ? (!isPast && isDateAvailable(dateString)) : !isPast;
                
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => isAvailable && handleDateSelect(day)}
                    title={
                      isSelected 
                        ? 'Selected date' 
                        : isPast 
                          ? 'Past date' 
                          : isAvailable 
                            ? 'Available for booking' 
                            : 'Doctor is not available on this date'
                    }
                    style={{
                      height: '32px', 
                      width: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative',
                      border: isSelected 
                        ? 'none' 
                        : (isToday ? '1.5px solid var(--ecare-primary)' : (isAvailable && isDateAvailable ? '1px solid #dcfce7' : '1px solid transparent')), 
                      borderRadius: '8px', 
                      fontSize: '0.8125rem', 
                      fontWeight: isSelected ? 800 : (isAvailable ? 600 : 400),
                      cursor: isAvailable ? 'pointer' : 'not-allowed', 
                      backgroundColor: isSelected 
                        ? 'var(--ecare-primary)' 
                        : (isAvailable && isDateAvailable ? '#f0fdf4' : (isAvailable ? 'transparent' : '#f8fafc')),
                      color: isSelected 
                        ? 'white' 
                        : (isAvailable ? (isDateAvailable ? '#15803d' : 'var(--ecare-text-main)') : '#cbd5e1'),
                      opacity: isAvailable ? 1 : 0.4,
                      pointerEvents: isAvailable ? 'auto' : 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
                      textDecoration: (!isAvailable && !isPast && isDateAvailable) ? 'line-through' : 'none'
                    }}
                  >
                    <span>{day}</span>
                    {isDateAvailable && isAvailable && !isSelected && (
                      <span style={{ 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        background: '#10b981', 
                        position: 'absolute', 
                        bottom: '3px' 
                      }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend / Status indicator */}
            {isDateAvailable && (
              <div style={{
                marginTop: '0.65rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: '0.25rem',
                paddingRight: '0.25rem',
                fontSize: '0.68rem',
                color: '#64748b'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: '#15803d' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                  Doctor Available
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#94a3b8' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#cbd5e1' }} />
                  Unavailable / Off
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomDatePicker
