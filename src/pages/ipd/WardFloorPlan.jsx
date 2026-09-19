import React, { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bed as BedIcon, User, Sparkle, Clock, CheckCircle, 
  ArrowsOutCardinal, MagnifyingGlassPlus, MagnifyingGlassMinus, 
  ArrowCounterClockwise, Heartbeat, CaretRight, Info, ShieldCheck,
  FirstAid, Armchair, Door, IdentificationBadge
} from 'phosphor-react'

// Color map according to clinical state
export const STATUS_CONFIG = {
  Available: {
    label: 'Available',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
    dot: '#10b981'
  },
  Occupied: {
    label: 'Occupied',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    badgeBg: '#fee2e2',
    badgeText: '#991b1b',
    dot: '#ef4444'
  },
  Cleaning: {
    label: 'Sanitizing',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    dot: '#f59e0b'
  },
  Reserved: {
    label: 'Reserved',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badgeBg: '#dbeafe',
    badgeText: '#1e40af',
    dot: '#3b82f6'
  },
  Maintenance: {
    label: 'Maintenance',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#e5e7eb',
    badgeBg: '#e5e7eb',
    badgeText: '#374151',
    dot: '#6b7280'
  }
}

/**
 * Architectural Bed Component (Mattress, Headboard, Dual Pillows, Blanket)
 */
const ArchitecturalBed = ({ 
  bed, 
  admission, 
  onSelect, 
  onQuickReady,
  isSelected,
  showExtra = true 
}) => {
  const status = bed.status || 'Available'
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Available
  const isOccupied = status === 'Occupied'
  const isCleaning = status === 'Cleaning'
  const isReserved = status === 'Reserved'
  const isAvailable = status === 'Available'

  const patientName = isOccupied 
    ? (admission?.patient_name || bed.current_patient_name || 'Occupied Patient')
    : isReserved 
      ? (bed.reserved_for_name || 'Reserved')
      : null

  const diagnosis = isOccupied 
    ? (admission?.diagnosis || bed.diagnosis || 'Post-Op Observation')
    : null

  const doctorName = isOccupied 
    ? (admission?.doctor_name || bed.doctor_name)
    : null

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(bed)}
      style={{
        position: 'relative',
        background: isSelected ? '#ffffff' : config.bg,
        border: `2px solid ${isSelected ? 'var(--ecare-primary, #0284c7)' : config.border}`,
        borderRadius: '12px',
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '150px',
        boxShadow: isSelected 
          ? '0 0 0 3px rgba(2, 132, 199, 0.25), 0 8px 16px -4px rgba(0, 0, 0, 0.1)' 
          : '0 2px 4px rgba(0, 0, 0, 0.04)',
        userSelect: 'none'
      }}
    >
      {/* Top Header: Bed Number & Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: config.dot,
            display: 'inline-block',
            boxShadow: `0 0 0 2px ${config.bg}`
          }} />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>
            {bed.bed_number || `Bed ${bed.id}`}
          </span>
        </div>
        <span style={{ 
          fontSize: '0.68rem', 
          fontWeight: 700, 
          padding: '2px 7px', 
          borderRadius: '999px',
          background: config.badgeBg,
          color: config.badgeText,
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          {config.label}
        </span>
      </div>

      {/* SVG Blueprint Bed Illustration */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '6px 0',
        position: 'relative'
      }}>
        <svg width="104" height="60" viewBox="0 0 104 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.06))' }}>
          {/* Bed Outer Frame */}
          <rect x="6" y="4" width="92" height="52" rx="6" fill="#f8fafc" stroke={config.color} strokeWidth="1.75" />
          
          {/* Headboard */}
          <rect x="9" y="7" width="14" height="46" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          
          {/* Dual Pillows */}
          <rect x="26" y="10" width="18" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="26" y="32" width="18" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          
          {/* Mattress Stitch Lines */}
          <line x1="47" y1="7" x2="47" y2="53" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
          
          {/* Folded Blanket / Duvet with status tint */}
          <rect x="52" y="7" width="43" height="46" rx="4" fill={config.badgeBg} stroke={config.border} strokeWidth="1" />
          <line x1="52" y1="7" x2="52" y2="53" stroke={config.color} strokeWidth="2" />
          <line x1="68" y1="7" x2="68" y2="53" stroke={config.color} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />

          {/* Medical Cross Emblem */}
          <circle cx="74" cy="30" r="8" fill="#ffffff" opacity="0.9" />
          <rect x="72.5" y="25" width="3" height="10" rx="1" fill={config.color} />
          <rect x="69" y="28.5" width="10" height="3" rx="1" fill={config.color} />
        </svg>
      </div>

      {/* Dynamic Content based on State */}
      <div style={{ fontSize: '0.72rem', minHeight: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {isOccupied && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {patientName}
            </div>
            {diagnosis && (
              <div style={{ 
                color: '#64748b', 
                fontSize: '0.67rem', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                background: '#ffffff',
                padding: '2px 5px',
                borderRadius: '4px',
                border: '1px solid #f1f5f9'
              }}>
                🩺 {diagnosis}
              </div>
            )}
          </div>
        )}

        {isAvailable && (
          <div style={{ textAlign: 'center', color: '#059669', fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle size={13} weight="bold" /> Ready for Admit
            </span>
          </div>
        )}

        {isCleaning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem' }}>
              <Sparkle size={12} weight="fill" /> Sanitizing In-Progress
            </div>
            {onQuickReady && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onQuickReady(bed.id)
                }}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)'
                }}
              >
                <CheckCircle size={11} weight="bold" /> Mark Ready
              </button>
            )}
          </div>
        )}

        {isReserved && (
          <div style={{ color: '#1d4ed8', fontSize: '0.7rem' }}>
            <div style={{ fontWeight: 600 }}>Reserved For:</div>
            <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {patientName}
            </div>
          </div>
        )}
      </div>

      {/* Bed Type & Daily Rate Tag */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderTop: '1px dashed #e2e8f0', 
        paddingTop: '5px',
        marginTop: '2px',
        fontSize: '0.66rem',
        color: '#64748b'
      }}>
        <span>{bed.bed_type || 'Standard'}</span>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>৳{Number(bed.daily_rate || 1500).toLocaleString()}/d</span>
      </div>
    </motion.div>
  )
}

/**
 * Door Swing Arc SVG Helper
 */
const DoorSwing = ({ direction = 'top-left', label }) => {
  return (
    <div style={{ position: 'relative', width: '38px', height: '38px', opacity: 0.65 }} title={label || "Door"}>
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
        <path d="M 4 34 A 30 30 0 0 1 34 4" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
        <line x1="4" y1="34" x2="34" y2="4" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="4" cy="34" r="2.5" fill="#475569" />
      </svg>
    </div>
  )
}

/**
 * Executive Deluxe Cabin (Room 414) Lounge Furniture
 */
const DeluxeLoungeFurniture = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '8px',
      background: 'rgba(241, 245, 249, 0.65)',
      borderRadius: '10px',
      padding: '10px',
      border: '1.5px dashed #cbd5e1'
    }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Private Guest Lounge
      </div>

      {/* Top 2-Seater Sofa Graphic */}
      <div style={{ position: 'relative', width: '90px', height: '34px', background: '#e2e8f0', borderRadius: '6px', border: '1.5px solid #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: '-6px', width: '80px', height: '8px', background: '#cbd5e1', borderRadius: '3px', border: '1px solid #94a3b8' }} />
        <div style={{ width: '36px', height: '22px', borderRight: '1px solid #cbd5e1' }} />
        <div style={{ width: '36px', height: '22px' }} />
        <span style={{ position: 'absolute', fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>2-Seater Sofa</span>
      </div>

      {/* Coffee Table & Armchairs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Left Armchair */}
        <div style={{ width: '26px', height: '26px', background: '#e2e8f0', borderRadius: '5px', border: '1.2px solid #94a3b8', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-3px', top: '3px', bottom: '3px', width: '4px', background: '#cbd5e1', borderRadius: '2px' }} />
        </div>

        {/* Coffee Table */}
        <div style={{ width: '36px', height: '20px', background: '#ffffff', borderRadius: '4px', border: '1.5px solid #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#f1f5f9' }} />
        </div>

        {/* Right Armchair */}
        <div style={{ width: '26px', height: '26px', background: '#e2e8f0', borderRadius: '5px', border: '1.2px solid #94a3b8', position: 'relative' }}>
          <div style={{ position: 'absolute', right: '-3px', top: '3px', bottom: '3px', width: '4px', background: '#cbd5e1', borderRadius: '2px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.65rem', color: '#64748b' }}>
        <span>📺 55" Smart TV</span>
        <span>•</span>
        <span>🚿 Attached Bath</span>
        <span>•</span>
        <span>❄️ AC</span>
      </div>
    </div>
  )
}

/**
 * Main Ward Architectural Floor Plan Blueprint
 */
export default function WardFloorPlan({
  ward,
  beds = [],
  admissions = [],
  onSelectBed,
  onQuickReadyBed,
  selectedBedId = null
}) {
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [zoomLevel, setZoomLevel] = useState(1)
  const containerRef = useRef(null)

  // Filter beds according to selection
  const filteredBeds = useMemo(() => {
    if (filterStatus === 'ALL') return beds
    return beds.filter(b => (b.status || 'Available').toLowerCase() === filterStatus.toLowerCase())
  }, [beds, filterStatus])

  // Count stats
  const stats = useMemo(() => {
    const total = beds.length
    const occupied = beds.filter(b => b.status === 'Occupied').length
    const available = beds.filter(b => (b.status || 'Available') === 'Available').length
    const cleaning = beds.filter(b => b.status === 'Cleaning').length
    const reserved = beds.filter(b => b.status === 'Reserved').length
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0
    return { total, occupied, available, cleaning, reserved, occupancyRate }
  }, [beds])

  // Map beds by room number
  const bedsByRoom = useMemo(() => {
    const map = {}
    beds.forEach(bed => {
      const roomNum = bed.room_number || '401'
      if (!map[roomNum]) map[roomNum] = []
      map[roomNum].push(bed)
    })
    return map
  }, [beds])

  // Helper to find active admission for a bed
  const getAdmissionForBed = (bedId) => {
    return admissions.find(a => String(a.bed_id) === String(bedId) && a.status === 'Admitted')
  }

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.75))
  const handleResetZoom = () => setZoomLevel(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      
      {/* Blueprint Control Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Status Filter Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setFilterStatus('ALL')}
            style={{
              background: filterStatus === 'ALL' ? '#0f172a' : '#f8fafc',
              color: filterStatus === 'ALL' ? '#ffffff' : '#64748b',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            All Beds
            <span style={{ 
              background: filterStatus === 'ALL' ? '#334155' : '#e2e8f0', 
              color: filterStatus === 'ALL' ? '#ffffff' : '#475569',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '0.7rem'
            }}>
              {stats.total}
            </span>
          </button>

          {['Available', 'Occupied', 'Cleaning', 'Reserved'].map(st => {
            const cfg = STATUS_CONFIG[st]
            const count = st === 'Available' ? stats.available : st === 'Occupied' ? stats.occupied : st === 'Cleaning' ? stats.cleaning : stats.reserved
            const isActive = filterStatus === st
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(isActive ? 'ALL' : st)}
                style={{
                  background: isActive ? cfg.badgeBg : '#ffffff',
                  color: isActive ? cfg.badgeText : '#475569',
                  border: `1.5px solid ${isActive ? cfg.color : '#e2e8f0'}`,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.dot }} />
                {cfg.label}
                <span style={{ 
                  background: isActive ? cfg.color : '#f1f5f9', 
                  color: isActive ? '#ffffff' : '#475569',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '0.7rem'
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Blueprint Zoom & Pan Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>
            Zoom: {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#334155'
            }}
          >
            <MagnifyingGlassPlus size={16} weight="bold" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#334155'
            }}
          >
            <MagnifyingGlassMinus size={16} weight="bold" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#334155'
            }}
          >
            <ArrowCounterClockwise size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Blueprint Canvas Container */}
      <div 
        ref={containerRef}
        style={{
          background: '#f8fafc',
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          borderRadius: '16px',
          border: '2px solid #cbd5e1',
          padding: '24px',
          overflowX: 'auto',
          overflowY: 'hidden',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
          position: 'relative'
        }}
      >
        {/* Blueprint Title Block (Architectural Title Box) */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          border: '1.5px solid #94a3b8',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FirstAid size={20} color="var(--ecare-primary, #0284c7)" weight="duotone" />
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {ward?.name || 'Ward 4 East (Medical-Surgical)'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                Level 4 • East Wing • Architectural CAD Plan v2.4
              </div>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            borderTop: '1px solid #e2e8f0', 
            marginTop: '6px', 
            paddingTop: '6px', 
            fontSize: '0.68rem',
            color: '#475569' 
          }}>
            <span>Occupancy: <strong>{stats.occupancyRate}%</strong></span>
            <span>Active Beds: <strong>{stats.occupied}/{stats.total}</strong></span>
          </div>
        </div>

        {/* Compass / Orientation */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          opacity: 0.6,
          zIndex: 10
        }}>
          <div style={{ width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '12px solid #ef4444' }} />
          <div style={{ width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '12px solid #64748b' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>NORTH</span>
        </div>

        {/* Scaled Blueprint Grid */}
        <div style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: '1180px',
          paddingTop: '40px',
          paddingBottom: '20px'
        }}>

          {/* MAIN WARD ARCHITECTURAL FRAME */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '4px solid #334155', // Thick exterior structural wall
            padding: '20px',
            boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.08)',
            position: 'relative'
          }}>

            {/* NORTH ROOMS ROW (Rooms 401, 402, 403, 404, 405) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {['401', '402', '403', '404', '405'].map(roomNum => {
                const roomBeds = bedsByRoom[roomNum] || []
                return (
                  <div 
                    key={roomNum}
                    style={{
                      background: '#ffffff',
                      border: '2px solid #64748b', // Structural room divider
                      borderRadius: '10px',
                      padding: '12px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: 'inset 0 0 0 1px #cbd5e1'
                    }}
                  >
                    {/* Room Tag & Door */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          background: '#0f172a', 
                          color: '#ffffff', 
                          fontWeight: 800, 
                          fontSize: '0.72rem', 
                          padding: '2px 7px', 
                          borderRadius: '4px' 
                        }}>
                          RM {roomNum}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                          Semi-Private
                        </span>
                      </div>
                      <DoorSwing direction="top-left" label={`Door Room ${roomNum}`} />
                    </div>

                    {/* Beds in this room */}
                    <div style={{ display: 'grid', gridTemplateColumns: roomBeds.length > 1 ? '1fr 1fr' : '1fr', gap: '10px' }}>
                      {roomBeds.map(bed => (
                        <ArchitecturalBed 
                          key={bed.id}
                          bed={bed}
                          admission={getAdmissionForBed(bed.id)}
                          onSelect={onSelectBed}
                          onQuickReady={onQuickReadyBed}
                          isSelected={String(selectedBedId) === String(bed.id)}
                        />
                      ))}
                      {roomBeds.length === 0 && (
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', padding: '16px' }}>
                          No beds configured
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CENTRAL CORRIDOR & NURSING STATION & AMENITIES */}
            <div style={{
              background: '#f1f5f9',
              borderTop: '3px solid #64748b',
              borderBottom: '3px solid #64748b',
              padding: '16px 20px',
              borderRadius: '6px',
              margin: '0 -4px 20px -4px',
              display: 'grid',
              gridTemplateColumns: '220px 1fr 220px',
              gap: '20px',
              alignItems: 'center',
              position: 'relative'
            }}>
              {/* Hallway Center Walking Guidance Line */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                right: '20px',
                borderTop: '1.5px dashed #94a3b8',
                zIndex: 0,
                pointerEvents: 'none'
              }} />

              {/* West Side: Clean Linen Storage & Staff Restroom */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #94a3b8',
                borderRadius: '8px',
                padding: '10px 12px',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 700, fontSize: '0.74rem' }}>
                  <ShieldCheck size={16} weight="duotone" color="#0284c7" />
                  Clean Utility & Meds
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                  Restricted Access • Automated Dispensing Cabinet
                </div>
              </div>

              {/* Central Nursing Station (Hero Component) */}
              <div style={{
                background: 'radial-gradient(ellipse at center, #ffffff 0%, #f8fafc 100%)',
                border: '2px solid #0284c7',
                borderRadius: '50px',
                padding: '12px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)',
                zIndex: 2,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 3px rgba(2, 132, 199, 0.15)'
                  }}>
                    <FirstAid size={22} weight="fill" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
                      CENTRAL NURSING STATION 4E
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Nurse In-Charge: <strong>RN Sarah Connor</strong></span>
                      <span>•</span>
                      <span>Ext: <strong>4100</strong></span>
                      <span>•</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>● Active Monitoring</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    background: '#ffffff', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '6px', 
                    padding: '4px 10px', 
                    fontSize: '0.7rem', 
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}>
                    <Heartbeat size={15} color="#ef4444" weight="bold" />
                    Telemetry Central
                  </div>
                </div>
              </div>

              {/* East Side: Elevators & Fire Exit */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #94a3b8',
                borderRadius: '8px',
                padding: '10px 12px',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.74rem', color: '#334155' }}>
                    🛗 Bed Elevators
                  </div>
                  <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>
                    EXIT
                  </span>
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                  Shafts 4E-1 & 4E-2 • Emergency Stairwell C
                </div>
              </div>
            </div>

            {/* SOUTH ROOMS ROW (Rooms 409, 410, 411, 412, and 414 Executive Deluxe Suite) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr) 1.6fr', // 414 is wider
              gap: '16px'
            }}>
              {['409', '410', '411', '412'].map(roomNum => {
                const roomBeds = bedsByRoom[roomNum] || []
                return (
                  <div 
                    key={roomNum}
                    style={{
                      background: '#ffffff',
                      border: '2px solid #64748b',
                      borderRadius: '10px',
                      padding: '12px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: 'inset 0 0 0 1px #cbd5e1'
                    }}
                  >
                    {/* Room Header & Door Swing */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          background: '#0f172a', 
                          color: '#ffffff', 
                          fontWeight: 800, 
                          fontSize: '0.72rem', 
                          padding: '2px 7px', 
                          borderRadius: '4px' 
                        }}>
                          RM {roomNum}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                          Semi-Private
                        </span>
                      </div>
                      <DoorSwing direction="top-left" label={`Door Room ${roomNum}`} />
                    </div>

                    {/* Beds Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: roomBeds.length > 1 ? '1fr 1fr' : '1fr', gap: '10px' }}>
                      {roomBeds.map(bed => (
                        <ArchitecturalBed 
                          key={bed.id}
                          bed={bed}
                          admission={getAdmissionForBed(bed.id)}
                          onSelect={onSelectBed}
                          onQuickReady={onQuickReadyBed}
                          isSelected={String(selectedBedId) === String(bed.id)}
                        />
                      ))}
                      {roomBeds.length === 0 && (
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', padding: '16px' }}>
                          No beds configured
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* ROOM 414: EXECUTIVE DELUXE CABIN / VIP SUITE */}
              {(() => {
                const room414Beds = bedsByRoom['414'] || []
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '2.5px solid #0284c7', // Highlight VIP Room
                    borderRadius: '12px',
                    padding: '14px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)'
                  }}>
                    {/* VIP Cabin Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)', 
                          color: '#ffffff', 
                          fontWeight: 800, 
                          fontSize: '0.76rem', 
                          padding: '3px 8px', 
                          borderRadius: '5px',
                          letterSpacing: '0.02em',
                          boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
                        }}>
                          CABIN 414
                        </span>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          color: '#0369a1', 
                          fontWeight: 700,
                          background: '#e0f2fe',
                          padding: '2px 8px',
                          borderRadius: '999px'
                        }}>
                          ★ Executive VIP Suite
                        </span>
                      </div>
                      <DoorSwing label="Door Suite 414" />
                    </div>

                    {/* Split View: Patient Bed on Left + Lounge Furniture on Right */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '14px', alignItems: 'stretch' }}>
                      {/* Bed */}
                      <div>
                        {room414Beds.map(bed => (
                          <ArchitecturalBed 
                            key={bed.id}
                            bed={bed}
                            admission={getAdmissionForBed(bed.id)}
                            onSelect={onSelectBed}
                            onQuickReady={onQuickReadyBed}
                            isSelected={String(selectedBedId) === String(bed.id)}
                          />
                        ))}
                        {room414Beds.length === 0 && (
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', padding: '16px' }}>
                            No VIP bed assigned
                          </div>
                        )}
                      </div>

                      {/* Lounge Furniture (Couch, Coffee Table, Armchairs, TV) */}
                      <DeluxeLoungeFurniture />
                    </div>
                  </div>
                )
              })()}
            </div>

          </div>
        </div>

      </div>

    </div>
  )
}
