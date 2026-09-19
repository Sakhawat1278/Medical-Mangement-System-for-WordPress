import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarBlank, MapPin, Users, Drop, Plus, PencilSimple, Trash,
  X, CheckCircle, Clock, Buildings, Phone, UserPlus, ArrowRight,
  FirstAid, WarningCircle, MagnifyingGlass, Funnel, Check
} from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map(g => ({ value: g, label: g }))

const STATUS_OPTIONS = [
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Camps' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'Completed', label: 'Completed' },
]

const EMPTY_CAMP = {
  name: '',
  date: '',
  time: '09:00',
  end_time: '17:00',
  location: '',
  address: '',
  target_blood_groups: [],
  capacity: 50,
  description: '',
  status: 'Upcoming',
  organizer: '',
  contact_phone: '',
}

const EMPTY_REGISTRATION = {
  name: '',
  phone: '',
  blood_group: '',
  notes: '',
}

// Status badge color config
const STATUS_CONFIG = {
  Upcoming: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Ongoing:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Completed:{ bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  Cancelled:{ bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

const BloodCamps = () => {
  const {
    user,
    bloodCamps,
    addBloodCamp,
    updateBloodCamp,
    deleteBloodCamp,
    openConfirm,
  } = useStore()

  const isAdmin   = user?.ecareRole === 'admin'
  const isPatient = user?.ecareRole === 'patient'

  // ── Modal states ──────────────────────────────────────────────────────────
  const [isAddCampOpen,     setIsAddCampOpen]     = useState(false)
  const [editingCamp,       setEditingCamp]        = useState(null)
  const [registeringCamp,   setRegisteringCamp]    = useState(null)
  const [viewingCamp,       setViewingCamp]        = useState(null)

  // ── Form states ───────────────────────────────────────────────────────────
  const [campForm,  setCampForm]  = useState({ ...EMPTY_CAMP })
  const [regForm,   setRegForm]   = useState({ ...EMPTY_REGISTRATION })
  const [saving,    setSaving]    = useState(false)
  const [regSaving, setRegSaving] = useState(false)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('all')
  const [search,       setSearch]       = useState('')

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredCamps = useMemo(() => {
    return (bloodCamps || []).filter(camp => {
      const matchStatus = statusFilter === 'all' || camp.status === statusFilter
      const q = search.toLowerCase()
      const matchSearch = !q
        || (camp.name || '').toLowerCase().includes(q)
        || (camp.location || '').toLowerCase().includes(q)
        || (camp.address || '').toLowerCase().includes(q)
      return matchStatus && matchSearch
    }).sort((a, b) => {
      // Sort: Ongoing first, then Upcoming by date, then Completed/Cancelled
      const order = { Ongoing: 0, Upcoming: 1, Completed: 2, Cancelled: 3 }
      const ao = order[a.status] ?? 4
      const bo = order[b.status] ?? 4
      if (ao !== bo) return ao - bo
      return (a.date || '').localeCompare(b.date || '')
    })
  }, [bloodCamps, statusFilter, search])

  const upcomingCount  = (bloodCamps || []).filter(c => c.status === 'Upcoming').length
  const ongoingCount   = (bloodCamps || []).filter(c => c.status === 'Ongoing').length
  const totalRegistered = (bloodCamps || []).reduce((acc, c) =>
    acc + ((c.registrations || []).length), 0)

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
    catch { return d }
  }

  const spotsLeft = (camp) => {
    const cap = parseInt(camp.capacity) || 0
    const regs = (camp.registrations || []).length
    return Math.max(0, cap - regs)
  }

  const isRegistered = (camp) => {
    if (!user?.id) return false
    return (camp.registrations || []).some(r =>
      String(r.user_id) === String(user.id) ||
      (r.phone && r.phone === user.phone)
    )
  }

  const handleBgClick = (e, closeFn) => {
    if (e.target === e.currentTarget) closeFn()
  }

  // ── Camp Modal Handlers ───────────────────────────────────────────────────
  const openAddCamp = () => {
    setCampForm({ ...EMPTY_CAMP, organizer: user?.name || '' })
    setIsAddCampOpen(true)
  }

  const openEditCamp = (camp) => {
    setEditingCamp(camp)
    setCampForm({
      name: camp.name || '',
      date: camp.date || '',
      time: camp.time || '09:00',
      end_time: camp.end_time || '17:00',
      location: camp.location || '',
      address: camp.address || '',
      target_blood_groups: camp.target_blood_groups || [],
      capacity: camp.capacity || 50,
      description: camp.description || '',
      status: camp.status || 'Upcoming',
      organizer: camp.organizer || '',
      contact_phone: camp.contact_phone || '',
    })
  }

  const closeCampModal = () => {
    setIsAddCampOpen(false)
    setEditingCamp(null)
    setCampForm({ ...EMPTY_CAMP })
  }

  const toggleTargetGroup = (group) => {
    setCampForm(f => {
      const current = f.target_blood_groups || []
      return {
        ...f,
        target_blood_groups: current.includes(group)
          ? current.filter(g => g !== group)
          : [...current, group]
      }
    })
  }

  const handleSaveCamp = async () => {
    if (!campForm.name.trim()) return toast.error('Camp name is required')
    if (!campForm.date) return toast.error('Date is required')
    if (!campForm.location.trim()) return toast.error('Location is required')

    setSaving(true)
    try {
      if (editingCamp) {
        await updateBloodCamp(editingCamp.id, campForm)
      } else {
        await addBloodCamp({ ...campForm, registrations: [], created_by: user?.name || '' })
      }
      closeCampModal()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCamp = (camp) => {
    openConfirm({
      title: 'Delete Blood Camp',
      message: `Are you sure you want to delete "${camp.name}"? All registrations will be lost.`,
      confirmLabel: 'Delete',
      confirmStyle: 'danger',
      onConfirm: () => deleteBloodCamp(camp.id),
    })
  }

  // ── Registration Modal Handlers ───────────────────────────────────────────
  const openRegisterModal = (camp) => {
    setRegisteringCamp(camp)
    setRegForm({
      name: user?.name || '',
      phone: '',
      blood_group: '',
      notes: '',
    })
  }

  const handleRegister = async () => {
    if (!regForm.name.trim()) return toast.error('Your name is required')
    if (!regForm.phone.trim()) return toast.error('Phone number is required')
    if (!regForm.blood_group) return toast.error('Please select your blood group')

    setRegSaving(true)
    try {
      const camp = registeringCamp
      const existing = camp.registrations || []
      const newReg = {
        id: `reg_${Date.now()}`,
        name: regForm.name.trim(),
        phone: regForm.phone.trim(),
        blood_group: regForm.blood_group,
        notes: regForm.notes.trim(),
        user_id: user?.id || null,
        registered_at: new Date().toISOString(),
      }
      await updateBloodCamp(camp.id, {
        ...camp,
        registrations: [...existing, newReg],
      })
      toast.success(`✅ Registered for ${camp.name}! See you there.`)
      setRegisteringCamp(null)
      setRegForm({ ...EMPTY_REGISTRATION })
    } finally {
      setRegSaving(false)
    }
  }

  // ── Input helpers ─────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #e2e8f0',
    borderRadius: '8px', fontSize: '0.875rem', color: '#1e293b',
    background: '#fff', boxSizing: 'border-box', outline: 'none',
  }

  const labelStyle = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px',
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="ecare-dashboard-page" style={{ padding: '1.5rem' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Drop size={24} weight="fill" color="#dc2626" /> Blood Donation Camps
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '4px 0 0' }}>
            {isAdmin ? 'Manage donation drives and view registrations' : 'Register for upcoming blood donation camps in your area'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddCamp}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            <Plus size={16} weight="bold" /> New Camp
          </button>
        )}
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Upcoming Camps', value: upcomingCount, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Ongoing Now', value: ongoingCount, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Total Registered', value: totalRegistered, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Total Camps', value: (bloodCamps || []).length, color: '#7c3aed', bg: '#f5f3ff' },
        ].map((stat, i) => (
          <div key={i} className="ecare-card" style={{ flex: '1 1 160px', background: stat.bg, border: `1px solid ${stat.color}22`, textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="ecare-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.875rem', background: '#f8fafc' }}>
          <MagnifyingGlass size={16} color="#94a3b8" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search camps by name or location..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: '#1e293b', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: '0.4rem 0.875rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                border: `1px solid ${statusFilter === f.value ? '#dc2626' : '#e2e8f0'}`,
                background: statusFilter === f.value ? '#dc2626' : '#fff',
                color: statusFilter === f.value ? '#fff' : '#64748b',
                cursor: 'pointer',
              }}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* ── Camps Grid ──────────────────────────────────────────────────── */}
      {filteredCamps.length === 0 ? (
        <div className="ecare-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Drop size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 600 }}>
            {search || statusFilter !== 'all' ? 'No camps match your filters' : 'No blood donation camps scheduled yet'}
          </p>
          {isAdmin && (
            <button onClick={openAddCamp} style={{ marginTop: '1rem', padding: '0.625rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
              + Create First Camp
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredCamps.map(camp => {
            const cfg = STATUS_CONFIG[camp.status] || STATUS_CONFIG.Upcoming
            const spots = spotsLeft(camp)
            const regCount = (camp.registrations || []).length
            const alreadyRegistered = isRegistered(camp)
            const canRegister = (isPatient || !isAdmin) && camp.status !== 'Completed' && camp.status !== 'Cancelled' && spots > 0

            return (
              <motion.div
                key={camp.id}
                className="ecare-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
              >
                {/* Camp Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{camp.name}</h3>
                    {camp.organizer && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Organized by: {camp.organizer}</div>
                    )}
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
                    {camp.status}
                  </span>
                </div>

                {/* Info rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                    <CalendarBlank size={14} color="#dc2626" />
                    <span>{formatDate(camp.date)} {camp.time && `· ${camp.time}`}{camp.end_time && ` – ${camp.end_time}`}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                    <MapPin size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{camp.location}{camp.address ? `, ${camp.address}` : ''}</span>
                  </div>
                  {camp.contact_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                      <Phone size={14} color="#64748b" />
                      <span>{camp.contact_phone}</span>
                    </div>
                  )}
                  {(camp.target_blood_groups || []).length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Drop size={14} color="#dc2626" />
                      {camp.target_blood_groups.map(g => (
                        <span key={g} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 700 }}>{g}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Capacity bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
                    <span><Users size={12} style={{ marginRight: 4 }} />{regCount} registered</span>
                    <span>{spots} spots left / {camp.capacity || '—'} total</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      background: spots === 0 ? '#dc2626' : spots < 10 ? '#f59e0b' : '#16a34a',
                      width: `${camp.capacity ? Math.min(100, (regCount / camp.capacity) * 100) : 0}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {camp.description && (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {camp.description}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                  {/* Admin actions */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setViewingCamp(camp)}
                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', background: '#f8fafc', color: '#64748b', fontWeight: 600 }}
                      >
                        <Users size={14} style={{ marginRight: 4 }} />
                        Registrations ({regCount})
                      </button>
                      <button onClick={() => openEditCamp(camp)} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: '#f8fafc', color: '#3b82f6' }}>
                        <PencilSimple size={14} />
                      </button>
                      <button onClick={() => handleDeleteCamp(camp)} style={{ padding: '0.5rem 0.75rem', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', background: '#fef2f2', color: '#dc2626' }}>
                        <Trash size={14} />
                      </button>
                    </>
                  )}

                  {/* Patient / Guest actions */}
                  {!isAdmin && (
                    alreadyRegistered ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>
                        <CheckCircle size={14} weight="fill" /> Already Registered
                      </div>
                    ) : canRegister ? (
                      <button
                        onClick={() => openRegisterModal(camp)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        <UserPlus size={14} /> Register Now
                      </button>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                        {spots === 0 ? '🚫 Camp Full' : camp.status === 'Completed' ? '✓ Camp Ended' : '🚫 Unavailable'}
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: Add / Edit Camp
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {(isAddCampOpen || editingCamp) && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={e => handleBgClick(e, closeCampModal)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      {editingCamp ? '✏️ Edit Blood Camp' : '➕ Create Blood Camp'}
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      {editingCamp ? 'Update camp details and settings' : 'Set up a new blood donation drive'}
                    </p>
                  </div>
                  <button onClick={closeCampModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Camp Name */}
                  <div>
                    <label style={labelStyle}>Camp Name *</label>
                    <input value={campForm.name} onChange={e => setCampForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Annual Blood Donation Drive 2026" style={inputStyle} />
                  </div>

                  {/* Date and Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Date *</label>
                      <input type="date" value={campForm.date} onChange={e => setCampForm(f => ({...f, date: e.target.value}))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Start Time</label>
                      <input type="time" value={campForm.time} onChange={e => setCampForm(f => ({...f, time: e.target.value}))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>End Time</label>
                      <input type="time" value={campForm.end_time} onChange={e => setCampForm(f => ({...f, end_time: e.target.value}))} style={inputStyle} />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label style={labelStyle}>Venue / Location *</label>
                    <input value={campForm.location} onChange={e => setCampForm(f => ({...f, location: e.target.value}))} placeholder="e.g. City Hospital Main Hall" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Full Address</label>
                    <input value={campForm.address} onChange={e => setCampForm(f => ({...f, address: e.target.value}))} placeholder="e.g. 123 Medical Street, Dhaka" style={inputStyle} />
                  </div>

                  {/* Organizer and Contact */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Organizer Name</label>
                      <input value={campForm.organizer} onChange={e => setCampForm(f => ({...f, organizer: e.target.value}))} placeholder="e.g. Blood Bank Team" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Contact Phone</label>
                      <input value={campForm.contact_phone} onChange={e => setCampForm(f => ({...f, contact_phone: e.target.value}))} placeholder="+880..." style={inputStyle} />
                    </div>
                  </div>

                  {/* Capacity and Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Max Capacity</label>
                      <input type="number" min="1" value={campForm.capacity} onChange={e => setCampForm(f => ({...f, capacity: parseInt(e.target.value) || 0}))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <CustomSelect
                        value={campForm.status}
                        onChange={v => setCampForm(f => ({...f, status: v}))}
                        options={STATUS_OPTIONS}
                        placeholder="Select status"
                      />
                    </div>
                  </div>

                  {/* Target Blood Groups */}
                  <div>
                    <label style={labelStyle}>Target Blood Groups (select all that apply)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {BLOOD_GROUPS.map(group => {
                        const selected = (campForm.target_blood_groups || []).includes(group)
                        return (
                          <button
                            key={group}
                            type="button"
                            onClick={() => toggleTargetGroup(group)}
                            style={{
                              padding: '0.375rem 0.875rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                              border: `1px solid ${selected ? '#dc2626' : '#e2e8f0'}`,
                              background: selected ? '#dc2626' : '#f8fafc',
                              color: selected ? '#fff' : '#64748b', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            {selected && <Check size={12} weight="bold" />}
                            {group}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>Leave empty to accept all blood groups</div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      value={campForm.description}
                      onChange={e => setCampForm(f => ({...f, description: e.target.value}))}
                      placeholder="Camp details, requirements, what to bring, etc."
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', background: '#f8fafc' }}>
                  <button onClick={closeCampModal} style={{ padding: '0.625rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCamp}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', background: saving ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
                  >
                    <CalendarBlank size={16} weight="bold" />
                    {saving ? 'Saving...' : editingCamp ? 'Update Camp' : 'Create Camp'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: Register for Camp
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {registeringCamp && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={e => handleBgClick(e, () => setRegisteringCamp(null))}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Drop size={18} weight="fill" /> Register for Camp
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{registeringCamp.name}</p>
                  </div>
                  <button onClick={() => setRegisteringCamp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                </div>

                {/* Camp Info Banner */}
                <div style={{ padding: '0.875rem 1.5rem', background: '#fef9c3', borderBottom: '1px solid #fef08a', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#713f12', flexWrap: 'wrap' }}>
                  <span><CalendarBlank size={13} style={{ marginRight: 4 }} />{formatDate(registeringCamp.date)} {registeringCamp.time && `at ${registeringCamp.time}`}</span>
                  <span><MapPin size={13} style={{ marginRight: 4 }} />{registeringCamp.location}</span>
                  <span><Users size={13} style={{ marginRight: 4 }} />{spotsLeft(registeringCamp)} spots left</span>
                </div>

                {/* Body */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input value={regForm.name} onChange={e => setRegForm(f => ({...f, name: e.target.value}))} placeholder="Your full name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number *</label>
                    <input value={regForm.phone} onChange={e => setRegForm(f => ({...f, phone: e.target.value}))} placeholder="+880..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Your Blood Group *</label>
                    <CustomSelect
                      value={regForm.blood_group}
                      onChange={v => setRegForm(f => ({...f, blood_group: v}))}
                      options={BLOOD_GROUP_OPTIONS}
                      placeholder="Select your blood group"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Notes / Health Conditions</label>
                    <textarea
                      value={regForm.notes}
                      onChange={e => setRegForm(f => ({...f, notes: e.target.value}))}
                      placeholder="Any relevant health info or notes..."
                      rows={2}
                      style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setRegisteringCamp(null)} style={{ padding: '0.625rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={regSaving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: regSaving ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: regSaving ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
                  >
                    <UserPlus size={16} weight="bold" />
                    {regSaving ? 'Registering...' : 'Confirm Registration'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: View Registrations (Admin)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewingCamp && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={e => handleBgClick(e, () => setViewingCamp(null))}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      <Users size={18} style={{ marginRight: 8 }} />Registrations — {viewingCamp.name}
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                      {(viewingCamp.registrations || []).length} registered / {viewingCamp.capacity} capacity
                    </p>
                  </div>
                  <button onClick={() => setViewingCamp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {(viewingCamp.registrations || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <UserPlus size={40} style={{ marginBottom: '0.5rem' }} />
                      <p>No registrations yet</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          {['#', 'Name', 'Blood Group', 'Phone', 'Notes', 'Registered'].map(h => (
                            <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingCamp.registrations || []).map((reg, idx) => (
                          <tr key={reg.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{idx + 1}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{reg.name}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 8px', fontWeight: 700, fontSize: '0.75rem' }}>{reg.blood_group}</span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{reg.phone}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.notes || '—'}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                              {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
                  <button onClick={() => setViewingCamp(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BloodCamps
