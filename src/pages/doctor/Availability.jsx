import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Plus, Trash, CheckCircle, XCircle, Info } from 'phosphor-react'
import useStore from '../../store/useStore'
import api, { apiOp } from '../../utils/api'
import toast from 'react-hot-toast'

const Availability = () => {
  const { user, doctorAvailability } = useStore()
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [duration, setDuration] = useState(30)
  
  const [slots, setSlots] = useState({
    'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 
    'Friday': [], 'Saturday': [], 'Sunday': []
  })

  const [dayStatus, setDayStatus] = useState({
    'Monday': 'Active', 'Tuesday': 'Active', 'Wednesday': 'Active', 'Thursday': 'Active', 
    'Friday': 'Active', 'Saturday': 'Active', 'Sunday': 'Active'
  })

  // Initialize from database using render-time key synchronization
  const [prevInitKey, setPrevInitKey] = useState('')
  const currentInitKey = `${user?.id || ''}_${(doctorAvailability || []).length}`

  if (currentInitKey !== prevInitKey) {
    setPrevInitKey(currentInitKey)
    if (doctorAvailability && user?.id) {
      const myAvail = doctorAvailability.filter(a => parseInt(a.doctor_id) === parseInt(user.id))
      
      const newSlots = {
        'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 
        'Friday': [], 'Saturday': [], 'Sunday': []
      }
      
      const newDayStatus = {
        'Monday': 'Active', 'Tuesday': 'Active', 'Wednesday': 'Active', 'Thursday': 'Active', 
        'Friday': 'Active', 'Saturday': 'Active', 'Sunday': 'Active'
      }

      myAvail.forEach(a => {
        if (newSlots[a.day]) {
          try {
            newSlots[a.day] = typeof a.slots === 'string' ? JSON.parse(a.slots) : (a.slots || [])
            newDayStatus[a.day] = a.status || 'Active'
          } catch (e) {
            console.error('JSON Parse error for slots:', e)
          }
        }
      })
      
      const durationRecord = myAvail.find(a => a.duration)
      if (durationRecord) {
        setDuration(Number(durationRecord.duration))
      }

      setSlots(newSlots)
      setDayStatus(newDayStatus)
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const calculateEndTime = (startTime, dur) => {
    if (!startTime) return '09:00'
    const [hours, minutes] = startTime.split(':').map(Number)
    const date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes + dur)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const handleAddSlot = () => {
    const daySlots = slots[selectedDay] || []
    let start = '09:00'
    
    if (daySlots.length > 0) {
      const lastSlot = daySlots[daySlots.length - 1]
      start = lastSlot.end
    }

    const end = calculateEndTime(start, duration)
    setSlots(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), { start, end, status: 'Active' }]
    }))
  }

  const handleRemoveSlot = (index) => {
    setSlots(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter((_, i) => i !== index)
    }))
  }

  const handleSlotChange = (index, field, value) => {
    setSlots(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((slot, i) => {
        if (i === index) {
          const updated = { ...slot, [field]: value }
          if (field === 'start') {
            updated.end = calculateEndTime(value, duration)
          }
          return updated
        }
        return slot
      })
    }))
  }

  const handleToggleStatus = (index) => {
    setSlots(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((slot, i) => 
        i === index ? { ...slot, status: slot.status === 'Active' ? 'Inactive' : 'Active' } : slot
      )
    }))
  }

  // When duration changes, update all existing slots' end times and slide contiguous slots
  const handleDurationChange = (newDuration) => {
    setDuration(newDuration)
    setSlots(prev => {
      const next = { ...prev }
      let overallChanged = false
      
      Object.keys(next).forEach(day => {
        const daySlots = [...(next[day] || [])]
        if (daySlots.length === 0) return

        let lastOldEnd = null
        let lastNewEnd = null
        let dayChanged = false

        const updatedDay = daySlots.map((slot, i) => {
          let newStart = slot.start
          
          // If this slot was chained to the previous one, slide it
          if (i > 0 && slot.start === lastOldEnd) {
            newStart = lastNewEnd
          }

          const newEnd = calculateEndTime(newStart, newDuration)
          
          // Store original end for the next iteration's check
          lastOldEnd = slot.end
          lastNewEnd = newEnd

          if (newStart !== slot.start || newEnd !== slot.end) {
            dayChanged = true
            return { ...slot, start: newStart, end: newEnd }
          }
          return slot
        })

        if (dayChanged) {
          next[day] = updatedDay
          overallChanged = true
        }
      })
      
      return overallChanged ? next : prev
    })
  }

  const handleSaveAll = async () => {
    const loadingToast = toast.loading('Saving availability...')
    
    try {
      const promises = Object.entries(slots).map(([day, daySlots]) => {
        const payload = {
          doctor_id: user.id,
          day,
          slots: JSON.stringify(daySlots),
          duration,
          status: dayStatus[day] || 'Active'
        }

        const existing = (doctorAvailability || []).find(a => 
          parseInt(a.doctor_id) === parseInt(user.id) && a.day === day
        )

        if (existing) {
          return apiOp(() => api.put('doctor-availability/' + existing.id, payload))
        } else {
          return apiOp(() => api.post('doctor-availability', payload))
        }
      })

      await Promise.all(promises)
      toast.success('All settings saved successfully!', { id: loadingToast })
      useStore.getState().initStore(true)
    } catch (error) {
      console.error('Save all failed:', error)
      toast.error('Failed to save settings', { id: loadingToast })
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}
    >
      <div className="ecare-card" style={{ padding: 'clamp(1rem, 4vw, 2rem)', borderRadius: '14px' }}>
        {/* Header: Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ 
            width: '44px', height: '44px', borderRadius: '12px', background: 'var(--ecare-primary-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)',
            flexShrink: 0
          }}>
            <Calendar size={22} weight="duotone" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>My Availability</h2>
            <p style={{ color: 'var(--ecare-text-muted)', fontSize: '0.8rem', marginTop: '2px', marginBottom: 0 }}>Configure your consultation days and time slots.</p>
          </div>
        </div>

        {/* Session Duration — sits on its own row, scrolls horizontally on very narrow screens */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.625rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', overflowX: 'auto' }}>
          <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Session Duration</div>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            {[15, 30, 45, 60].map(d => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: duration === d ? 'var(--ecare-primary)' : '#e2e8f0',
                  background: duration === d ? 'var(--ecare-primary)' : 'white',
                  color: duration === d ? 'white' : 'var(--ecare-text-main)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        {/* Body: Day selector + Slot manager — 250px fixed + 1fr on desktop, stacks on mobile */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start' }}>
          {/* Day Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '0 0 250px', minWidth: 0 }}>
            {days.map(day => {
              const isActive = dayStatus[day] === 'Active'
              const isSelected = selectedDay === day
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: 'none',
                    textAlign: 'left',
                    background: isSelected ? 'var(--ecare-primary)' : '#f8fafc',
                    color: isSelected ? 'white' : (isActive ? 'var(--ecare-text-main)' : '#94a3b8'),
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: isActive ? 1 : 0.7
                  }}
                >
                  <span style={{ textDecoration: isActive ? 'none' : 'line-through', textDecorationColor: isSelected ? 'rgba(255,255,255,0.4)' : '#fca5a5' }}>{day}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isActive && (
                      <span style={{ 
                        fontSize: '0.625rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#fee2e2', 
                        color: isSelected ? 'white' : '#ef4444' 
                      }}>OFF</span>
                    )}
                    <div style={{ 
                      width: '6px', height: '6px', borderRadius: '50%', 
                      background: slots[day]?.length > 0 ? (isSelected ? 'white' : 'var(--ecare-primary)') : 'transparent' 
                    }} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Slot Manager */}
          <div className="ecare-card" style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', padding: 'clamp(1rem, 3vw, 1.5rem)', borderRadius: '14px', flex: '1 1 300px', minWidth: 0 }}>
            {/* Header row: title + toggle + Add Slot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 'clamp(0.9rem, 3vw, 1.125rem)', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0, whiteSpace: 'nowrap' }}>
                  Slots for {selectedDay}
                </h3>
                
                {/* Toggle switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: dayStatus[selectedDay] === 'Active' ? 'var(--ecare-primary)' : '#64748b', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
                    {dayStatus[selectedDay] === 'Active' ? 'Available' : 'Unavailable'}
                  </span>
                  <div 
                    onClick={() => setDayStatus(p => ({ ...p, [selectedDay]: p[selectedDay] === 'Active' ? 'Inactive' : 'Active' }))}
                    style={{
                      width: '44px', height: '24px', borderRadius: '999px',
                      background: dayStatus[selectedDay] === 'Active' ? 'var(--ecare-primary)' : '#cbd5e1',
                      padding: '3px', cursor: 'pointer', transition: 'all 0.2s ease-in-out',
                      display: 'flex', alignItems: 'center', flexShrink: 0,
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: dayStatus[selectedDay] === 'Active' ? 'translateX(20px)' : 'translateX(0)'
                    }} />
                  </div>
                </div>
              </div>

              <button 
                className="ecare-button" 
                onClick={handleAddSlot}
                disabled={dayStatus[selectedDay] !== 'Active'}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  padding: '0.5rem 1rem', fontSize: '0.8125rem',
                  flexShrink: 0, width: 'fit-content',
                  opacity: dayStatus[selectedDay] === 'Active' ? 1 : 0.5,
                  pointerEvents: dayStatus[selectedDay] === 'Active' ? 'auto' : 'none'
                }}
              >
                <Plus size={16} weight="bold" /> Add Slot
              </button>
            </div>

            {dayStatus[selectedDay] !== 'Active' && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', 
                background: '#fef2f2', border: '1px solid #fee2e2', 
                padding: '1rem', borderRadius: '12px', color: '#991b1b', 
                fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem'
              }}>
                <XCircle size={20} weight="fill" color="#ef4444" />
                <span>You have marked {selectedDay} as unavailable. Patients cannot book appointments on this day.</span>
              </div>
            )}

            <div style={{ 
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
              opacity: dayStatus[selectedDay] === 'Active' ? 1 : 0.5,
              pointerEvents: dayStatus[selectedDay] === 'Active' ? 'auto' : 'none'
            }}>
              {slots[selectedDay]?.length > 0 ? slots[selectedDay].map((slot, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
                    background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Time inputs row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--ecare-text-muted)', flexShrink: 0 }}><Clock size={16} /></div>
                    <input 
                      type="time" 
                      value={slot.start} 
                      onChange={(e) => handleSlotChange(i, 'start', e.target.value)}
                      className="ecare-input" 
                      style={{ width: 'auto', minWidth: '80px', flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }} 
                    />
                    <span style={{ color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.8rem' }}>to</span>
                    <input 
                      type="time" 
                      value={slot.end} 
                      onChange={(e) => handleSlotChange(i, 'end', e.target.value)}
                      className="ecare-input" 
                      style={{ width: 'auto', minWidth: '80px', flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }} 
                    />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <button 
                      onClick={() => handleToggleStatus(i)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.25rem', 
                        padding: '0.35rem 0.6rem', borderRadius: '8px', border: 'none',
                        background: slot.status === 'Active' ? 'var(--ecare-primary-bg)' : '#f1f5f9',
                        color: slot.status === 'Active' ? 'var(--ecare-primary)' : '#64748b',
                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      {slot.status === 'Active' ? <CheckCircle size={13} weight="fill" /> : <XCircle size={13} weight="fill" />}
                      {slot.status}
                    </button>
                    <button 
                      onClick={() => handleRemoveSlot(i)}
                      style={{ 
                        width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                        background: '#fee2e2', color: '#ef4444', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--ecare-text-muted)' }}>
                  <Info size={40} weight="duotone" style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0 }}>No slots configured for this day.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Patients won't be able to book sessions on {selectedDay}.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="ecare-button" 
            style={{ padding: '0.75rem 2rem', width: 'fit-content' }}
            onClick={handleSaveAll}
          >
            Save All Settings
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default Availability
