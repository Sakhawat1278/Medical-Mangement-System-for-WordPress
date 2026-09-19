import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, UserCog, CalendarCheck, Hourglass, CheckCircle,
  XCircle, MapPin, Phone, IdCard, ShieldCheck, Eye, X, Check, File,
  Navigation, UserPlus, AlertTriangle, Clock, Plus, Trash, Search, Timer, Mail,
  Upload, Camera, User, Settings, BriefcaseMedical
} from 'lucide-react'
import CustomSelect from '../components/CustomSelect'
import CustomDatePicker from '../components/CustomDatePicker'
import DataTable from '../components/DataTable'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'
import useAuth from '../hooks/useAuth'
import toast from 'react-hot-toast'
import AmbulanceBookingPage from './AmbulanceRequest'

const getInitials = (name) => {
  if (!name) return 'AM'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'AM'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Shared Components ─────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ borderColor: 'var(--ecare-primary)' }}
    className="ecare-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)

const Badge = ({ variant = 'default', children }) => {
  const styles = {
    default: { bg: '#f1f5f9', color: '#64748b' },
    success: { bg: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)' },
    warning: { bg: '#fffbeb', color: '#d97706' },
    danger:  { bg: '#fef2f2', color: '#ef4444' },
    primary: { bg: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)' },
  }
  const s = styles[variant]
  return (
    <span style={{
      padding: '4px 10px', borderRadius: '9999px', fontSize: '0.7rem',
      fontWeight: 700, background: s.bg, color: s.color, textTransform: 'uppercase',
    }}>
      {children}
    </span>
  )
}

const InputGroup = ({ label, children, required }) => (
  <div className="ecare-form-group">
    <label className="ecare-label">
      {required && <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>}
      {label}
    </label>
    {children}
  </div>
)

const DisplayGroup = ({ label, children }) => (
  <div className="ecare-form-group">
    <label className="ecare-label">{label}</label>
    <div style={{
      padding: '0.625rem 0.875rem', borderRadius: '12px', background: '#f8fafc',
      border: '1px solid #e2e8f0', fontSize: '0.875rem', color: 'var(--ecare-text-main)',
      minHeight: '42px', display: 'flex', alignItems: 'center',
    }}>
      {children || <span style={{ color: '#94a3b8' }}>Not provided</span>}
    </div>
  </div>
)

// ─── Register Ambulance Tab ────────────────────────────────────────────────
const RegisterAmbulance = () => {
  const { registerAmbulance, updateAmbulance, setActivePage, editingAmbulance, setEditingAmbulance } = useStore()

  const [form, setForm] = useState({
    vehicleType: 'ICU',
    plate: '',
    vehicleModel: '',
    engineNumber: '',
    chassisNumber: '',
    insuranceExpiry: '',
    fitnessExpiry: '',
    driverName: '',
    driverEmail: '',
    driverPhone: '',
    driverLicense: '',
    driverNid: '',
    driverExperience: '',
    driverBloodGroup: '',
    driverAddress: '',
    driverPhoto: '',
    status: 'Available',
  })

  useEffect(() => {
    if (editingAmbulance) {
      const normalized = {
        ...form,
        ...editingAmbulance,
        driverPhone:      editingAmbulance.driverPhone      || editingAmbulance.driver_phone      || editingAmbulance.driverphone,
        driverEmail:      editingAmbulance.driverEmail      || editingAmbulance.driver_email      || editingAmbulance.driveremail,
        driverLicense:    editingAmbulance.driverLicense    || editingAmbulance.driver_license    || editingAmbulance.driverlicense,
        driverNid:        editingAmbulance.driverNid        || editingAmbulance.driver_nid        || editingAmbulance.drivernid,
        driverExperience: editingAmbulance.driverExperience || editingAmbulance.driver_experience || editingAmbulance.driverexperience,
        driverBloodGroup: editingAmbulance.driverBloodGroup || editingAmbulance.driver_blood_group || editingAmbulance.driverbloodgroup,
        driverAddress:    editingAmbulance.driverAddress    || editingAmbulance.driver_address    || editingAmbulance.driveraddress,
        driverPhoto:      editingAmbulance.driverPhoto      || editingAmbulance.driver_photo      || editingAmbulance.driverphoto,
        vehicleType:      editingAmbulance.vehicleType      || editingAmbulance.vehicle_type      || editingAmbulance.vehicletype,
        vehicleModel:     editingAmbulance.vehicleModel     || editingAmbulance.vehicle_model     || editingAmbulance.vehiclemodel,
        engineNumber:     editingAmbulance.engineNumber     || editingAmbulance.engine_number     || editingAmbulance.enginenumber,
        chassisNumber:    editingAmbulance.chassisNumber    || editingAmbulance.chassis_number    || editingAmbulance.chassisnumber,
        insuranceExpiry:  editingAmbulance.insuranceExpiry  || editingAmbulance.insurance_expiry  || editingAmbulance.insuranceexpiry,
        fitnessExpiry:    editingAmbulance.fitnessExpiry    || editingAmbulance.fitness_expiry    || editingAmbulance.fitnessexpiry,
      }
      setForm(normalized)
    }
    return () => setEditingAmbulance(null)
  }, [editingAmbulance])

  const handleMediaUpload = () => {
    if (window.wp && window.wp.media) {
      const frame = window.wp.media({
        title: 'Select Driver Photo',
        button: { text: 'Use this photo' },
        multiple: false,
      })
      frame.on('select', () => {
        const attachment = frame.state().get('selection').first().toJSON()
        setForm({ ...form, driverPhoto: attachment.url })
      })
      frame.open()
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = e.target.files?.[0]
        if (file) {
          try {
            const result = await useStore.getState().uploadFile(file, 'public')
            if (result?.url) {
              setForm({ ...form, driverPhoto: result.url })
              toast.success('Photo uploaded successfully')
            }
          } catch (err) {
            toast.error('Failed to upload photo')
          }
        }
      }
      input.click()
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const payload = {
        ...form,
        driverPhoto: form.driverPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.driverName.replace(/\s/g, '')}`,
      }
      const ambulanceId = editingAmbulance?.id || form.id
      let res
      if (ambulanceId) {
        res = await updateAmbulance(ambulanceId, payload)
      } else {
        res = await registerAmbulance(payload)
      }
      if (res) {
        setEditingAmbulance(null)
        if (form.status === 'Pending') {
          setActivePage('ambulance-pending')
        } else {
          setActivePage('ambulance-list')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      vehicleType: 'ICU', plate: '', vehicleModel: '', engineNumber: '', chassisNumber: '',
      insuranceExpiry: '', fitnessExpiry: '', driverName: '', driverEmail: '',
      driverPhone: '', driverLicense: '', driverNid: '', driverExperience: '',
      driverBloodGroup: '', driverAddress: '', driverPhoto: '', status: 'Available',
    })
    setEditingAmbulance(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>
            {editingAmbulance ? 'Edit Ambulance Unit' : 'Register New Ambulance'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ecare-text-muted)' }}>
            {editingAmbulance ? `Modifying record for ${editingAmbulance.plate}` : 'Onboard a new vehicle and driver to your active fleet'}
          </p>
        </div>
        {editingAmbulance && (
          <button
            onClick={() => { setEditingAmbulance(null); setActivePage('ambulance-list') }}
            className="ecare-btn-secondary"
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8125rem' }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Vehicle Info */}
        <div className="ecare-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ecare-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} /> Vehicle Specifications
          </h3>
          <div className="ecare-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <InputGroup label="Ambulance Type" required>
              <CustomSelect
                value={form.vehicleType}
                onChange={v => setForm({ ...form, vehicleType: v })}
                options={[
                  { value: 'ICU', label: 'ICU (AC)' },
                  { value: 'Non-AC', label: 'Non-AC Standard' },
                  { value: 'Freezer', label: 'Freezer Van' },
                ]}
              />
            </InputGroup>
            <InputGroup label="Vehicle Plate Number" required>
              <input
                type="text" className="ecare-input" placeholder="e.g. Dhaka-Metro-1234"
                value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} required
              />
            </InputGroup>
            <InputGroup label="Vehicle Model">
              <input
                type="text" className="ecare-input" placeholder="e.g. Toyota Hiace 2022"
                value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })}
              />
            </InputGroup>
            <InputGroup label="Engine Number">
              <input
                type="text" className="ecare-input" placeholder="Engine serial"
                value={form.engineNumber} onChange={e => setForm({ ...form, engineNumber: e.target.value })}
              />
            </InputGroup>
            <InputGroup label="Chassis Number">
              <input
                type="text" className="ecare-input" placeholder="Chassis serial"
                value={form.chassisNumber} onChange={e => setForm({ ...form, chassisNumber: e.target.value })}
              />
            </InputGroup>
            <InputGroup label="Operational Status" required>
              <CustomSelect
                value={form.status}
                onChange={v => setForm({ ...form, status: v })}
                options={[
                  { value: 'Available', label: 'Available' },
                  { value: 'Maintenance', label: 'In Maintenance' },
                  { value: 'Pending', label: 'Pending Approval' },
                ]}
              />
            </InputGroup>
          </div>
          <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '1.25rem' }}>
            <InputGroup label="Insurance Expiry Date">
              <CustomDatePicker value={form.insuranceExpiry} onChange={v => setForm({ ...form, insuranceExpiry: v })} placeholder="Select date" />
            </InputGroup>
            <InputGroup label="Fitness Certificate Expiry">
              <CustomDatePicker value={form.fitnessExpiry} onChange={v => setForm({ ...form, fitnessExpiry: v })} placeholder="Select date" />
            </InputGroup>
          </div>
        </div>

        {/* Driver Info */}
        <div className="ecare-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCog size={20} /> Driver Credentials
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                onClick={handleMediaUpload}
                style={{
                  width: '42px', height: '42px', borderRadius: '50%', background: '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0', transition: 'all 0.2s',
                }}
              >
                {form.driverPhoto ? (
                  <img src={form.driverPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={20} color="#94a3b8" />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profile Photo</span>
                <button
                  type="button"
                  onClick={handleMediaUpload}
                  className="ecare-btn-secondary"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.2rem 0.75rem', fontSize: '0.7rem', borderRadius: '9999px',
                    cursor: 'pointer', border: '1px solid #e2e8f0',
                  }}
                >
                  <Upload size={12} /> Upload
                </button>
              </div>
            </div>
          </div>

          <div className="ecare-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <InputGroup label="Full Name" required>
              <input
                type="text" className="ecare-input" placeholder="Driver name"
                value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} required
              />
            </InputGroup>
            <InputGroup label="Contact Phone" required>
              <input
                type="tel" className="ecare-input" placeholder="+880..."
                value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} required
              />
            </InputGroup>
            <InputGroup label="Email Address">
              <input
                type="email" className="ecare-input" placeholder="driver@example.com"
                value={form.driverEmail} onChange={e => setForm({ ...form, driverEmail: e.target.value })}
              />
            </InputGroup>
            <InputGroup label="Driving License No" required>
              <input
                type="text" className="ecare-input" placeholder="License Number"
                value={form.driverLicense} onChange={e => setForm({ ...form, driverLicense: e.target.value })} required
              />
            </InputGroup>
            <InputGroup label="NID Number" required>
              <input
                type="text" className="ecare-input" placeholder="NID Number"
                value={form.driverNid} onChange={e => setForm({ ...form, driverNid: e.target.value })} required
              />
            </InputGroup>
            <InputGroup label="Years of Experience">
              <input
                type="number" className="ecare-input" placeholder="e.g. 5"
                value={form.driverExperience} onChange={e => setForm({ ...form, driverExperience: e.target.value })}
              />
            </InputGroup>
            <InputGroup label="Blood Group">
              <CustomSelect
                value={form.driverBloodGroup}
                onChange={v => setForm({ ...form, driverBloodGroup: v })}
                options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => ({ value: g, label: g }))}
                placeholder="Select group"
              />
            </InputGroup>
            <InputGroup label="Present Address">
              <input
                type="text" className="ecare-input" placeholder="Street address, city"
                value={form.driverAddress} onChange={e => setForm({ ...form, driverAddress: e.target.value })}
              />
            </InputGroup>
          </div>
        </div>


        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={resetForm}
            className="ecare-btn-secondary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}
          >
            {editingAmbulance ? 'Cancel Edit' : 'Reset Form'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="ecare-button"
            style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 700, opacity: isSubmitting ? 0.7 : 1, whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}
          >
            {isSubmitting
              ? (editingAmbulance ? 'Saving Changes...' : 'Processing...')
              : (editingAmbulance ? 'Save Changes' : 'Register & Onboard Unit')}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── Booking Requests Tab ──────────────────────────────────────────────────
const BookingRequests = () => {
  const { openConfirm, ambulanceBookings: bookings, updateAmbulanceBooking, deleteAmbulanceBooking, bulkDelete, setAmbulanceModal } = useStore()
  const { canAccess, isPatient } = useAuth()

  const handleDelete = (id) => {
    openConfirm({
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this ambulance dispatch request?',
      confirmText: 'Yes, Cancel',
      onConfirm: () => deleteAmbulanceBooking(id),
    })
  }

  const handleBulkDelete = (selectedIds) => bulkDelete('ambulance-bookings', selectedIds)

  const handleStatusChange = (id, newStatus) => {
    updateAmbulanceBooking(id, { status: newStatus })
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (val) => <span style={{ fontWeight: 700, color: 'var(--ecare-primary)', fontSize: '0.75rem' }}>#DIS-{String(val).slice(0, 8).toUpperCase()}</span>,
    },
    {
      key: 'patient',
      label: 'Patient Details',
      render: (val, row) => {
        const name = val || row.patient_name || row.patientName || 'Unknown'
        const phone = row.phone || row.contact_phone || ''
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'var(--ecare-primary-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
            }}>
              {(name).split(' ')[0]?.[0] || '?'}{(name).split(' ')[1]?.[0] || ''}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{name}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                {row.type || 'N/A'} · {phone || 'No phone'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'assignment',
      label: 'Assigned Unit',
      render: (_, row) => row.vehiclePlate ? (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Truck size={14} /> {row.vehiclePlate}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{row.driverName || '—'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>Awaiting Assignment</span>
          {!isPatient && canAccess('ambulance_dispatch') && (
            <button
              onClick={() => setAmbulanceModal(true, row)}
              style={{
                padding: '2px 10px', borderRadius: '20px', border: '1px solid var(--ecare-primary)',
                background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
              }}
            >
              Assign
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (_, row) => {
        const from = row.location || row.pickup_location || '—'
        const to   = row.dest || row.destination || '—'
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.78rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={11} color="var(--ecare-primary)" />
              <span style={{ fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{from}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={11} color="#ef4444" />
              <span style={{ fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{to}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => {
        const getBgColor   = (s) => s === 'Pending' ? '#fffbeb' : s === 'On Mission' ? '#f0f9ff' : 'var(--ecare-primary-bg)'
        const getTextColor = (s) => s === 'Pending' ? '#b45309' : s === 'On Mission' ? '#0ea5e9' : 'var(--ecare-primary)'

        if (isPatient) {
          return (
            <span style={{
              background: getBgColor(val), color: getTextColor(val),
              padding: '0.3rem 0.6rem', borderRadius: '9999px',
              fontSize: '0.75rem', fontWeight: 700, display: 'inline-block',
            }}>
              {val}
            </span>
          )
        }
        return (
          <div style={{ width: '130px' }}>
            <CustomSelect
              value={val}
              onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
              options={[
                { value: 'Pending',    label: 'Pending' },
                { value: 'On Mission', label: 'On Mission' },
                { value: 'Completed',  label: 'Completed' },
              ]}
              customTriggerStyle={{
                background: getBgColor(val), color: getTextColor(val),
                border: 'none', padding: '0.3rem 0.6rem', borderRadius: '9999px',
                fontSize: '0.75rem', fontWeight: 700, minWidth: 'unset', boxShadow: 'none',
              }}
            />
          </div>
        )
      },
    },
    {
      key: 'issuedBy',
      label: 'Issued By',
      render: (val, row) => {
        const by = val || row.issued_by || row.created_by || 'System'
        return <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-primary)' }}>{by}</span>
      },
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}
    >
      {isPatient && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', background: '#dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0,
          }}>
            <CalendarCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px' }}>
              Need to change, reschedule, or cancel a booking?
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.4 }}>
              For patient safety and schedule synchronization, booked services cannot be modified directly online.
              Please contact {window.ecareConfig?.siteName || 'E-CARE'} clinic administration at{' '}
              <strong>{window.ecareConfig?.sitePhone || '+1 (800) 555-0199'}</strong> or email{' '}
              <strong>{window.ecareConfig?.siteEmail || 'support@e-care.com'}</strong> for assistance.
            </p>
          </div>
        </div>
      )}

      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Total Missions"  value={bookings.length} icon={Truck} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Active Now"      value={bookings.filter(b => b.status === 'On Mission').length} icon={Clock} color="#0ea5e9" delay={0.2} />
        <StatCard title="Completed"       value={bookings.filter(b => b.status === 'Completed').length} icon={CheckCircle} color="var(--ecare-primary)" delay={0.3} />
        <StatCard title="Emergency"       value={bookings.filter(b => b.type === 'Emergency' || b.priority === 'High').length} icon={AlertTriangle} color="#ef4444" delay={0.4} />
      </div>

      <DataTable
        data={bookings}
        columns={columns}
        searchPlaceholder="Search by ID, patient or location..."
        title="Active Dispatch Requests"
        onDelete={isPatient ? null : (canAccess('ambulance_dispatch') ? handleDelete : null)}
        onBulkDelete={isPatient ? null : (canAccess('ambulance_dispatch') ? handleBulkDelete : null)}
        onEdit={isPatient ? null : (canAccess('ambulance_dispatch') ? (row) => setAmbulanceModal(true, row) : null)}
        onAdd={isPatient ? null : (canAccess('ambulance_dispatch') ? () => setAmbulanceModal(true) : null)}
        addLabel={isPatient ? null : (canAccess('ambulance_dispatch') ? 'Create Dispatch' : null)}
        hideAdd={isPatient}
      />
    </motion.div>
  )
}

// ─── Pending Approvals Tab ─────────────────────────────────────────────────
const PendingApprovals = () => {
  const { openConfirm, pendingAmbulanceDrivers: pendingDrivers, updateAmbulance, deleteAmbulance } = useStore()
  const { canAccess } = useAuth()
  const [selectedDriver, setSelectedDriver] = useState(null)

  const handleReject = (driver) => {
    openConfirm({
      title: 'Reject Application',
      message: `Are you sure you want to reject the application for ${driver.driverName || driver.name}?`,
      onConfirm: async () => {
        await deleteAmbulance(driver.id)
      },
    })
  }

  const handleApprove = (driver) => {
    openConfirm({
      title: 'Approve Driver',
      message: `Are you sure you want to approve ${driver.driverName || driver.name}? They will be added to the active dispatch fleet.`,
      onConfirm: async () => {
        await updateAmbulance(driver.id, { status: 'Available' })
      },
    })
  }

  const columns = [
    {
      key: 'id',
      label: 'Driver ID',
      render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ecare-primary)' }}>#AMB-{String(val).slice(0, 8).toUpperCase()}</span>,
    },
    {
      key: 'driverName',
      label: 'Driver Details',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: 'var(--ecare-primary-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {(row.driverPhoto || row.photo || row.driver_photo) ? (
              <img src={row.driverPhoto || row.photo || row.driver_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.875rem' }}>
                {getInitials(val)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--ecare-text-main)' }}>{val}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)' }}>License: {row.driverLicense}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact Information',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-main)', fontSize: '0.75rem' }}>
            <Phone size={12} color="#94a3b8" /> {row.driverPhone}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-muted)', fontSize: '0.75rem' }}>
            <Mail size={12} color="#94a3b8" /> {row.driverEmail}
          </div>
        </div>
      ),
    },
    {
      key: 'driverExperience',
      label: 'Experience',
      render: (val) => <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--ecare-primary)' }}>{val} yrs</span>,
    },
    {
      key: 'actions',
      label: 'Decision',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedDriver(row)}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="View Details"
          >
            <Eye size={18} />
          </button>
          {canAccess('ambulance_approve') && (
            <>
              <button
                onClick={() => handleApprove(row)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Approve"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => handleReject(row)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Reject"
              >
                <XCircle size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Total Applications" value={pendingDrivers.length} icon={UserPlus}    color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Pending Review"     value={pendingDrivers.length} icon={Hourglass}   color="#f59e0b"             delay={0.2} />
        <StatCard title="Verified Today"     value="0"                     icon={ShieldCheck}  color="var(--ecare-primary)" delay={0.3} />
        <StatCard title="Rejections"         value="0"                     icon={XCircle}     color="#ef4444"             delay={0.4} />
      </div>

      <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--ecare-accent)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-accent)' }}>
          <IdCard size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>Fleet Driver Verification</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: 0 }}>Review license and certifications for new ambulance dispatchers</p>
        </div>
      </div>

      <DataTable
        data={pendingDrivers}
        columns={columns}
        searchPlaceholder="Search by name or license..."
        title={`Pending Verifications (${pendingDrivers.length})`}
      />

      <Portal>
        <AnimatePresence>
          {selectedDriver && (
            <>
              <motion.div
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDriver(null)}
                style={{ 
                  position: 'fixed', 
                  inset: 0, 
                  background: 'rgba(15, 23, 42, 0.3)', 
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 2000 
                }}
              />
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                pointerEvents: 'none'
              }}>
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="ecare-card"
                  style={{ 
                    width: '100%', 
                    maxWidth: '850px', 
                    maxHeight: '90vh', 
                    pointerEvents: 'auto',
                    position: 'relative', 
                    padding: 0, 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflow: 'hidden', 
                    background: 'white',
                    borderRadius: '16px'
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {(selectedDriver.driverPhoto || selectedDriver.photo || selectedDriver.driver_photo) ? (
                          <img src={selectedDriver.driverPhoto || selectedDriver.photo || selectedDriver.driver_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#374151', fontWeight: 800, fontSize: '0.875rem' }}>{getInitials(selectedDriver.driverName)}</span>
                        )}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                          Review Application: {selectedDriver.driverName}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>Application pending review</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedDriver(null)} 
                      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} className="ecare-scrollbar">
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="ecare-card" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ecare-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <IdCard size={18} /> Driver Identity & Contact
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <DisplayGroup label="Full Name">{selectedDriver.driverName}</DisplayGroup>
                            <DisplayGroup label="License Number">{selectedDriver.driverLicense}</DisplayGroup>
                            <DisplayGroup label="Contact Phone">{selectedDriver.driverPhone}</DisplayGroup>
                            <DisplayGroup label="Email Address">{selectedDriver.driverEmail}</DisplayGroup>
                            <DisplayGroup label="NID Number">{selectedDriver.driverNid}</DisplayGroup>
                            <DisplayGroup label="Years of Experience">{selectedDriver.driverExperience}</DisplayGroup>
                            <DisplayGroup label="Blood Group">{selectedDriver.driverBloodGroup}</DisplayGroup>
                            <DisplayGroup label="Present Address">{selectedDriver.driverAddress}</DisplayGroup>
                          </div>
                        </div>
                        <div className="ecare-card" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ecare-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Truck size={18} /> Vehicle Specifications
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <DisplayGroup label="Ambulance Type">{selectedDriver.vehicleType}</DisplayGroup>
                            <DisplayGroup label="Plate Number">{selectedDriver.plate}</DisplayGroup>
                            <DisplayGroup label="Vehicle Model">{selectedDriver.vehicleModel}</DisplayGroup>
                            <DisplayGroup label="Engine Number">{selectedDriver.engineNumber}</DisplayGroup>
                            <DisplayGroup label="Chassis Number">{selectedDriver.chassisNumber}</DisplayGroup>
                          </div>
                        </div>
                      </div>

                      <div className="ecare-card" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ecare-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <File size={18} /> Verification Documents
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {(() => {
                            let docs = []
                            if (selectedDriver.documents) {
                              try {
                                docs = typeof selectedDriver.documents === 'string' ? JSON.parse(selectedDriver.documents) : selectedDriver.documents
                              } catch (e) {
                                docs = []
                              }
                            }
                            if (!Array.isArray(docs)) docs = []
                            
                            if (docs.length === 0) {
                              return (
                                <div style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                                  <File size={28} color="#94a3b8" style={{ marginBottom: '0.25rem', opacity: 0.5 }} />
                                  <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>No verification documents uploaded</div>
                                </div>
                              )
                            }

                            return docs.map((doc, idx) => (
                              <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                  <File size={20} color="var(--ecare-primary)" style={{ flexShrink: 0 }} />
                                  <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                    {doc.name || `document_${idx + 1}.pdf`}
                                  </div>
                                </div>
                                {doc.data && (
                                  <a
                                    href={doc.data}
                                    download={doc.name || `document_${idx + 1}.pdf`}
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      color: 'var(--ecare-primary)',
                                      textDecoration: 'none',
                                      background: 'var(--ecare-primary-bg)',
                                      padding: '4px 10px',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    Download
                                  </a>
                                )}
                              </div>
                            ))
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  {canAccess('ambulance_approve') && (
                    <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => handleReject(selectedDriver)}
                        className="ecare-btn-secondary"
                        style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', color: '#ef4444', borderColor: '#fca5a5' }}
                      >
                        Reject Application
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedDriver)}
                        className="ecare-button"
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <CheckCircle size={18} /> Approve & Activate
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </motion.div>
  )
}

// ─── Fleet Inventory Tab ───────────────────────────────────────────────────
const FleetInventory = () => {
  const { openConfirm, ambulance: fleet, deleteAmbulance, bulkDelete, setActivePage, setEditingAmbulance } = useStore()
  const { canAccess } = useAuth()

  const handleDelete = (id) => {
    openConfirm({
      title: 'Remove Unit',
      message: 'Are you sure you want to decommission this ambulance unit? This will remove it from the active fleet.',
      confirmText: 'Yes, Decommission',
      onConfirm: () => deleteAmbulance(id),
    })
  }

  const handleBulkDelete = (selectedIds) => bulkDelete('ambulance', selectedIds)

  const handleEdit = (row) => {
    setEditingAmbulance(row)
    setActivePage('ambulance-register')
  }

  const columns = [
    {
      key: 'id',
      label: 'Ambulance ID',
      render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ecare-primary)' }}>#AMB-{String(val).slice(0, 8).toUpperCase()}</span>,
    },
    {
      key: 'plate',
      label: 'Vehicle Identity',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--ecare-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)' }}>
            <Truck size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontWeight: 800, color: 'var(--ecare-text-main)', fontSize: '0.85rem' }}>{val}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--ecare-primary)', background: 'var(--ecare-primary-bg)', padding: '1px 5px', borderRadius: '4px' }}>{row.vehicleType}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>{row.vehicleModel || 'Standard'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'driverName',
      label: 'Assigned Operator',
      render: (val, row) => {
        const phone = row.driverPhone || row.driver_phone || 'N/A'
        const photo = row.driverPhoto || row.driver_photo
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1.5px solid #fff', boxShadow: '0 0 0 1px #e2e8f0' }}>
              {photo ? (
                <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.8125rem' }}>{getInitials(val)}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{val}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                <Phone size={10} color="var(--ecare-primary)" /> {phone}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Operational Status',
      render: (val) => {
        const getStyle = (s) => {
          if (s === 'Available')   return { bg: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', border: 'var(--ecare-primary)', icon: <CheckCircle size={12} /> }
          if (s === 'On Mission')  return { bg: '#eff6ff', color: '#2563eb', border: '#3b82f6', icon: <Timer size={12} /> }
          if (s === 'Maintenance') return { bg: '#fff7ed', color: '#d97706', border: '#f59e0b', icon: <AlertTriangle size={12} /> }
          return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', icon: null }
        }
        const style = getStyle(val)
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: style.bg, color: style.color, fontSize: '0.65rem', fontWeight: 800, border: `1px solid ${style.border}40`, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {style.icon} {val}
          </div>
        )
      },
    },
    {
      key: 'compliance',
      label: 'Compliance Tracker',
      render: (_, row) => {
        const insurance = row.insuranceExpiry || row.insurance_expiry || 'N/A'
        const fitness   = row.fitnessExpiry   || row.fitness_expiry   || 'N/A'
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minWidth: '180px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Insurance</span>
              <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="var(--ecare-primary)" /> {insurance}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Fitness</span>
              <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BriefcaseMedical size={12} color="#0ea5e9" /> {fitness}
              </div>
            </div>
          </div>
        )
      },
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Total Fleet"  value={fleet.length}                                        icon={Truck}       color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Available"    value={fleet.filter(v => v.status === 'Available').length}   icon={CheckCircle} color="var(--ecare-primary)" delay={0.2} />
        <StatCard title="On Mission"   value={fleet.filter(v => v.status === 'On Mission').length}  icon={Timer}       color="#0ea5e9"              delay={0.3} />
        <StatCard title="Maintenance"  value={fleet.filter(v => v.status === 'Maintenance').length} icon={AlertTriangle} color="#d97706"             delay={0.4} />
      </div>

      <DataTable
        data={fleet}
        columns={columns}
        searchPlaceholder="Search by plate, driver or type..."
        title="Fleet Inventory"
        onDelete={canAccess('ambulance_fleet') ? handleDelete : null}
        onBulkDelete={canAccess('ambulance_fleet') ? handleBulkDelete : null}
        onEdit={canAccess('ambulance_fleet') ? handleEdit : null}
        onAdd={canAccess('ambulance_fleet') ? () => setActivePage('ambulance-register') : null}
        addLabel={canAccess('ambulance_fleet') ? 'Register Unit' : null}
      />
    </motion.div>
  )
}

// ─── Main Module Wrapper ───────────────────────────────────────────────────
const AmbulanceService = ({ view = 'bookings' }) => {
  const { canAccess } = useAuth()

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="wait">
        {view === 'bookings' && <BookingRequests key="bookings" />}
        {view === 'list'     && <FleetInventory key="list" />}
        {view === 'create'   && <AmbulanceBookingPage key="create" />}
        {canAccess('ambulance_fleet')   && view === 'register' && <RegisterAmbulance key="register" />}
        {canAccess('ambulance_approve') && view === 'pending'  && <PendingApprovals key="pending" />}
      </AnimatePresence>
    </div>
  )
}

export default AmbulanceService
