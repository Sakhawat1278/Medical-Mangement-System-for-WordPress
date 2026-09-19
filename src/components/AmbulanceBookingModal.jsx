import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Truck, MapPin, Navigation, Clock, AlertTriangle,
  Phone, UserCog, CheckCircle, User, BriefcaseMedical, ArrowRight,
  Pencil, Save, Eye
} from 'lucide-react'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'
import CustomSelect from './CustomSelect'

// ─── Utility: get a booking field with all API variant fallbacks ────────────
const getField = (b, ...keys) => {
  for (const k of keys) {
    if (b[k] !== undefined && b[k] !== null && b[k] !== '') return b[k]
  }
  return ''
}

// ─── Read-only detail row ─────────────────────────────────────────────────────
const DetailRow = ({ icon: Icon, label, value, iconColor = '#94a3b8' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
    <div style={{
      width: '28px', height: '28px', borderRadius: '8px', background: '#f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px'
    }}>
      <Icon size={14} color={iconColor} />
    </div>
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1px' }}>{label}</div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b' }}>{value || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
    </div>
  </div>
)

const AmbulanceBookingModal = () => {
  const {
    isAmbulanceModalOpen,
    setAmbulanceModal,
    addAmbulanceBooking,
    updateAmbulanceBooking,
    editingAmbulanceBooking,
    ambulance: fleet,
    patients,
    assignAmbulance,
    user
  } = useStore()

  // Edit sub-mode: 'assign' (default for admin) or 'edit' (editing booking info)
  const [subMode, setSubMode] = useState('assign')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const patientOptions = useMemo(() => {
    return (patients || []).map(p => ({
      value: p.name || p.patientName,
      label: `${p.name || p.patientName} [#PAT-${String(p.id).slice(0, 8).toUpperCase()}]`
    }))
  }, [patients])

  // ─── Form state — used for both create and edit info modes ───────────────
  const [formData, setFormData] = useState({
    patient: '', type: 'Non-AC', location: '', dest: '',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    priority: 'Normal', phone: '', notes: ''
  })

  // ─── Assignment state ─────────────────────────────────────────────────────
  const [vehicleId, setVehicleId] = useState('')

  // Populate form when editing booking opens
  useEffect(() => {
    const b = editingAmbulanceBooking
    if (b) {
      setFormData({
        patient:  getField(b, 'patient', 'patient_name', 'patientName', 'patientname'),
        type:     getField(b, 'type', 'ambulance_type', 'ambulanceType', 'vehicleType') || 'Non-AC',
        location: getField(b, 'location', 'pickup_location', 'pickupLocation', 'pickup'),
        dest:     getField(b, 'dest', 'destination', 'drop_location', 'dropLocation'),
        time:     getField(b, 'time', 'dispatch_time', 'dispatchTime'),
        priority: getField(b, 'priority', 'urgency') || 'Normal',
        phone:    getField(b, 'phone', 'contact_phone', 'contactPhone', 'patient_phone'),
        notes:    getField(b, 'notes', 'additional_notes', 'additionalNotes'),
      })
      setVehicleId('')
      setSubMode('assign')
    } else {
      setFormData({
        patient: '', type: 'Non-AC', location: '', dest: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: 'Normal', phone: '', notes: ''
      })
      setVehicleId('')
    }
  }, [editingAmbulanceBooking, isAmbulanceModalOpen])

  // Handle patient change: auto-fill phone & dest from patient record
  const handlePatientChange = (name) => {
    const pat = (patients || []).find(p => (p.name || p.patientName) === name)
    setFormData(prev => ({
      ...prev,
      patient: name,
      dest:  pat?.address || prev.dest,
      phone: pat?.phone   || prev.phone
    }))
  }

  // Filter available fleet by type
  const availableFleet = useMemo(() => {
    const typeMatch = (vType, bType) => {
      if (bType === 'ICU' && (vType === 'ICU' || vType === 'AC')) return true
      return vType === bType
    }
    return (fleet || [])
      .filter(v => v.status === 'Available' && typeMatch(v.vehicleType || v.type, formData.type))
      .map(v => ({
        value: v.id,
        label: `${v.plate || v.license} — ${v.driverName || v.name || 'Driver'}`
      }))
  }, [fleet, formData.type])

  // ─── Submit handlers ──────────────────────────────────────────────────────
  const handleAssign = async (e) => {
    e.preventDefault()
    if (!vehicleId || isSubmitting) return
    setIsSubmitting(true)
    try {
      await assignAmbulance(editingAmbulanceBooking.id, vehicleId)
      setAmbulanceModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await updateAmbulanceBooking(editingAmbulanceBooking.id, formData)
      setAmbulanceModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const { ambulancePricing } = useStore.getState()
      const price = ambulancePricing[formData.type] || 0
      let finalData = {
        ...formData,
        status: 'Pending',
        price,
        issuedBy: user?.name || 'System'
      }
      if (vehicleId) {
        const vehicle = fleet.find(v => String(v.id) === String(vehicleId))
        if (vehicle) {
          finalData.vehiclePlate = vehicle.plate || vehicle.license
          finalData.driverName   = vehicle.driverName || vehicle.name
          finalData.status       = 'On Mission'
        }
      }
      await addAmbulanceBooking(finalData)
      setAmbulanceModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditMode = !!editingAmbulanceBooking
  const booking    = editingAmbulanceBooking
  const isAlreadyAssigned = booking?.vehiclePlate

  if (!isAmbulanceModalOpen) return null

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════════════════════════════
  if (isEditMode) {
    const priorityColors = {
      High:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
      Normal: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    }
    const pc = priorityColors[formData.priority] || priorityColors.Normal

    return (
      <Portal>
        <AnimatePresence>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAmbulanceModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{
                width: '100%', maxWidth: '620px', position: 'relative',
                padding: 0, border: 'none', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column'
              }}
            >
              {/* ── Header ── */}
              <div style={{
                padding: '1.25rem 1.5rem',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', background: 'white',
                    border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151'
                  }}>
                    <Truck size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                      Booking #{booking.id}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>
                      {subMode === 'edit' ? 'Edit booking details' : 'Assign ambulance unit to this request'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Toggle between assign and edit sub-modes */}
                  <button
                    onClick={() => setSubMode(subMode === 'assign' ? 'edit' : 'assign')}
                    title={subMode === 'assign' ? 'Edit booking details' : 'Back to assignment'}
                    style={{
                      background: subMode === 'edit' ? 'var(--ecare-primary)' : 'white',
                      border: `1px solid ${subMode === 'edit' ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                      color: subMode === 'edit' ? 'white' : '#64748b',
                      padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '5px',
                      fontSize: '0.7rem', fontWeight: 700
                    }}
                  >
                    {subMode === 'assign' ? <><Pencil size={13} /> Edit Info</> : <><Eye size={13} /> Assign View</>}
                  </button>
                  <button
                    onClick={() => setAmbulanceModal(false)}
                    style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              </div>

            {/* ── Scrollable body ── */}
            <div style={{ overflowY: 'auto', flex: 1 }}>

              {/* ── SUB-MODE: ASSIGN ─────────────────────────────────────── */}
              {subMode === 'assign' && (
                <>
                  {/* Request summary (read-only) */}
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: '1.25rem'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Patient Request Details
                      </span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 800, padding: '2px 10px', borderRadius: '20px',
                        background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, textTransform: 'uppercase'
                      }}>
                        {formData.priority || 'Normal'} Priority
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <DetailRow icon={User}      label="Patient"        value={formData.patient}   iconColor="var(--ecare-primary)" />
                      <DetailRow icon={BriefcaseMedical}  label="Type Requested" value={formData.type}      iconColor="#0ea5e9" />
                      <DetailRow icon={Phone}     label="Contact"        value={formData.phone}     iconColor="#8b5cf6" />
                      <DetailRow icon={Clock}     label="Requested Time" value={formData.time}      iconColor="#f59e0b" />
                    </div>

                    {/* Route */}
                    <div style={{
                      marginTop: '1rem', padding: '0.875rem 1rem', borderRadius: '12px',
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                        <MapPin size={14} color="var(--ecare-primary)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formData.location || '—'}
                        </span>
                      </div>
                      <ArrowRight size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                        <Navigation size={14} color="#ef4444" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formData.dest || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Notes if any */}
                    {formData.notes && (
                      <div style={{ marginTop: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.75rem', color: '#92400e' }}>
                        <strong>Note:</strong> {formData.notes}
                      </div>
                    )}

                    {/* Already assigned notice */}
                    {isAlreadyAssigned && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px',
                        background: 'var(--ecare-primary-bg)', border: '1px solid var(--ecare-primary)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                      }}>
                        <CheckCircle size={16} color="var(--ecare-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ecare-primary)' }}>
                          Currently assigned: <strong>{booking.vehiclePlate}</strong> · Driver: {booking.driverName || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Assignment form */}
                  <form onSubmit={handleAssign} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserCog size={16} color="var(--ecare-primary)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>
                        Select Available {formData.type} Unit
                      </span>
                    </div>

                    <CustomSelect
                      value={vehicleId}
                      onChange={v => setVehicleId(v)}
                      placeholder={availableFleet.length ? `Choose from ${availableFleet.length} available unit(s)…` : `No available ${formData.type} units right now`}
                      options={availableFleet}
                      isSearchable={availableFleet.length > 3}
                    />

                    {availableFleet.length === 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600, padding: '0.5rem 0.75rem', background: '#fffbeb', borderRadius: '8px' }}>
                        <AlertTriangle size={14} /> No {formData.type} ambulances available. Edit fleet status or reassign.
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button type="button" onClick={() => setAmbulanceModal(false)} className="ecare-btn-secondary"
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600 }}>
                        Cancel
                      </button>
                      <button type="submit" className="ecare-button"
                        disabled={!vehicleId || isSubmitting}
                        style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 700, opacity: (!vehicleId || isSubmitting) ? 0.55 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Truck size={16} />
                        {isSubmitting ? 'Dispatching…' : isAlreadyAssigned ? 'Reassign Unit' : 'Dispatch Unit'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ── SUB-MODE: EDIT INFO ──────────────────────────────────── */}
              {subMode === 'edit' && (
                <form onSubmit={handleEditSave} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Patient Name</label>
                      <CustomSelect
                        value={formData.patient}
                        onChange={handlePatientChange}
                        options={patientOptions}
                        isSearchable={true}
                        placeholder="Search patient or type name..."
                        onAdd={handlePatientChange}
                        addLabel="Use"
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Ambulance Type</label>
                      <CustomSelect
                        value={formData.type}
                        onChange={v => setFormData({ ...formData, type: v })}
                        options={[
                          { value: 'ICU',    label: 'ICU (AC)' },
                          { value: 'Non-AC', label: 'Standard (Non-AC)' },
                          { value: 'Freezer', label: 'Freezer Van' }
                        ]}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Pickup Location</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={16} color="var(--ecare-primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                        <input type="text" className="ecare-input" style={{ paddingLeft: '2.5rem' }} placeholder="Pickup address"
                          value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
                      </div>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Destination</label>
                      <div style={{ position: 'relative' }}>
                        <Navigation size={16} color="#ef4444" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                        <input type="text" className="ecare-input" style={{ paddingLeft: '2.5rem' }} placeholder="Hospital / clinic"
                          value={formData.dest} onChange={e => setFormData({ ...formData, dest: e.target.value })} required />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem 1.25rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Contact Phone</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                        <input type="tel" className="ecare-input" style={{ paddingLeft: '2.5rem' }} placeholder="+880..."
                          value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Dispatch Time</label>
                      <div style={{ position: 'relative' }}>
                        <Clock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                        <input type="time" className="ecare-input" style={{ paddingLeft: '2.5rem' }}
                          value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                      </div>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Priority</label>
                      <CustomSelect
                        value={formData.priority}
                        onChange={v => setFormData({ ...formData, priority: v })}
                        options={[{ value: 'Normal', label: 'Normal' }, { value: 'High', label: 'High / Emergency' }]}
                      />
                    </div>
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Notes</label>
                    <textarea
                      className="ecare-input" rows={2}
                      style={{ height: 'auto', padding: '0.625rem 0.875rem', resize: 'vertical' }}
                      placeholder="Special requirements, patient condition..."
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setSubMode('assign')} className="ecare-btn-secondary"
                      style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600 }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button"
                      disabled={isSubmitting}
                      style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 700, opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Save size={16} />
                      {isSubmitting ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE MODE — Full new dispatch form
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <Portal>
      <AnimatePresence>
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAmbulanceModal(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="ecare-card"
            style={{
              background: 'white', borderRadius: '16px', width: '100%', maxWidth: '820px',
              overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', padding: 0, border: 'none'
            }}
          >
          <div style={{
            padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#f8fafc', flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                <Truck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>New Dispatch Request</h3>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>Create a new emergency transport mission</p>
              </div>
            </div>
            <button onClick={() => setAmbulanceModal(false)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreate} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem' }}>
              <div className="ecare-form-group">
                <label className="ecare-label">Patient Name</label>
                <CustomSelect value={formData.patient} onChange={handlePatientChange} options={patientOptions}
                  isSearchable placeholder="Search patient or type name..." onAdd={handlePatientChange} addLabel="Use" />
              </div>
              <div className="ecare-form-group">
                <label className="ecare-label">Ambulance Type</label>
                <CustomSelect value={formData.type} onChange={v => setFormData({ ...formData, type: v })}
                  options={[{ value: 'ICU', label: 'ICU (AC)' }, { value: 'Non-AC', label: 'Standard (Non-AC)' }, { value: 'Freezer', label: 'Freezer Van' }]} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem' }}>
              <div className="ecare-form-group">
                <label className="ecare-label">Pickup Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} color="var(--ecare-primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <input type="text" className="ecare-input" style={{ paddingLeft: '2.75rem' }} placeholder="Current location"
                    value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
                </div>
              </div>
              <div className="ecare-form-group">
                <label className="ecare-label">Destination</label>
                <div style={{ position: 'relative' }}>
                  <Navigation size={18} color="#ef4444" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <input type="text" className="ecare-input" style={{ paddingLeft: '2.75rem' }} placeholder="Hospital / clinic address"
                    value={formData.dest} onChange={e => setFormData({ ...formData, dest: e.target.value })} required />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem 1.25rem' }}>
              <div className="ecare-form-group">
                <label className="ecare-label">Contact Phone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <input type="tel" className="ecare-input" style={{ paddingLeft: '2.75rem' }} placeholder="+880..."
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="ecare-form-group">
                <label className="ecare-label">Dispatch Time</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <input type="time" className="ecare-input" style={{ paddingLeft: '2.75rem' }}
                    value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required />
                </div>
              </div>
              <div className="ecare-form-group">
                <label className="ecare-label">Priority Level</label>
                <CustomSelect value={formData.priority} onChange={v => setFormData({ ...formData, priority: v })}
                  options={[{ value: 'Normal', label: 'Normal' }, { value: 'High', label: 'High / Emergency' }]} />
              </div>
            </div>

            {/* Optional immediate assignment */}
            <div style={{ padding: '1.15rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <UserCog size={18} color="var(--ecare-primary)" />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>
                  Assign Unit Now <span style={{ fontWeight: 500, color: '#94a3b8' }}>(optional)</span>
                </span>
              </div>
              <div className="ecare-form-group" style={{ margin: 0 }}>
                <label className="ecare-label" style={{ fontSize: '0.7rem' }}>Available {formData.type} Units</label>
                <CustomSelect value={vehicleId} onChange={v => setVehicleId(v)} placeholder="Select available ambulance..." options={availableFleet} />
                {availableFleet.length === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.65rem', color: '#ef4444', fontWeight: 600 }}>
                    <AlertTriangle size={14} /> No available units of this type currently
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="ecare-btn-secondary" onClick={() => setAmbulanceModal(false)}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600 }}>
                Discard
              </button>
              <button type="submit" className="ecare-button" disabled={isSubmitting}
                style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', fontWeight: 700, opacity: isSubmitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {vehicleId
                  ? <><Truck size={18} />{isSubmitting ? 'Dispatching…' : 'Dispatch Now'}</>
                  : (isSubmitting ? 'Creating…' : 'Confirm Request')
                }
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  )
}

export default AmbulanceBookingModal
