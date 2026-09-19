import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Drop, Heart, FirstAid, WarningCircle, CheckCircle, 
  Clock, Plus, ArrowRight, ArrowUpRight, UserPlus, X, Thermometer, Info
} from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map(g => ({ value: g, label: g }))

const COMPONENT_OPTIONS = [
  { value: 'Whole Blood', label: 'Whole Blood (35 Days)' },
  { value: 'Packed RBC', label: 'Packed RBC (42 Days)' },
  { value: 'Platelets', label: 'Platelets (5 Days)' },
  { value: 'Fresh Frozen Plasma', label: 'Fresh Frozen Plasma (365 Days)' }
]

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
]

const URGENCY_OPTIONS = [
  { value: 'Emergency', label: 'Emergency (STAT / Immediate)' },
  { value: 'Urgent', label: 'Urgent (Within 4 Hours)' },
  { value: 'Normal', label: 'Routine (Scheduled Procedure)' }
]

// Standard E-CARE Stat Card
const StatCard = ({ title, value, icon: Icon, trend, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ borderColor: 'var(--ecare-primary)' }}
    className="ecare-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ 
        color: color, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} weight="duotone" />
      </div>
      {trend && (
        <div style={{ color: 'var(--ecare-primary)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          {trend} <ArrowUpRight size={12} weight="bold" style={{ marginLeft: '2px' }} />
        </div>
      )}
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)

const BloodBankDashboard = () => {
  const { 
    user,
    bloodInventory, 
    bloodDonors, 
    bloodRequests, 
    addBloodBag, 
    addBloodDonor, 
    addBloodRequest, 
    updateBloodBag, 
    updateBloodRequest, 
    setActivePage 
  } = useStore()

  const isPatient = user?.ecareRole === 'patient'

  const [isAddBagModalOpen, setIsAddBagModalOpen] = useState(false)
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false)
  const [isAddRequestModalOpen, setIsAddRequestModalOpen] = useState(false)

  // Forms
  const [bagForm, setBagForm] = useState({
    bag_number: `BLD-${Math.floor(10000 + Math.random() * 90000)}`,
    blood_group: 'O+',
    component: 'Whole Blood',
    volume: 450,
    storage_location: 'Cold Storage Room 1 - Rack A',
    collection_date: new Date().toISOString().split('T')[0],
    expiry_date: (() => {
      const d = new Date()
      d.setDate(d.getDate() + 35)
      return d.toISOString().split('T')[0]
    })(),
    status: 'Available',
    donor_name: '',
    tested_negative: true,
    notes: ''
  })

  const [donorForm, setDonorForm] = useState({
    name: isPatient ? (user?.name || '') : '',
    blood_group: isPatient ? (user?.blood_group || user?.bloodGroup || 'O+') : 'O+',
    contact_number: isPatient ? (user?.phone || '') : '',
    email: isPatient ? (user?.email || '') : '',
    gender: 'Male',
    age: '',
    weight: '',
    health_status: 'Healthy & Cleared',
    status: 'Eligible',
    last_donation_date: new Date().toISOString().split('T')[0]
  })

  const [requestForm, setRequestForm] = useState({
    requester_name: isPatient ? (user?.name || '') : '',
    patient_name: isPatient ? (user?.name || '') : '',
    hospital_name: '',
    contact_phone: isPatient ? (user?.phone || '') : '',
    blood_group: isPatient ? (user?.blood_group || user?.bloodGroup || 'O+') : 'O+',
    component: 'Whole Blood',
    units_required: 1,
    urgency: 'Urgent',
    notes: ''
  })

  // Calculations
  const stats = useMemo(() => {
    const safeBags = Array.isArray(bloodInventory) ? bloodInventory : []
    const safeDonors = Array.isArray(bloodDonors) ? bloodDonors : []
    const safeRequests = Array.isArray(bloodRequests) ? bloodRequests : []

    const availableBags = safeBags.filter(b => b.status === 'Available')
    const pendingRequests = safeRequests.filter(r => r.status === 'Pending')

    const byGroup = {}
    BLOOD_GROUPS.forEach(g => byGroup[g] = 0)
    availableBags.forEach(b => {
      if (b.blood_group) {
        byGroup[b.blood_group] = (byGroup[b.blood_group] || 0) + 1
      }
    })

    const now = new Date().getTime()
    const sevenDays = now + (7 * 24 * 60 * 60 * 1000)
    const expiringBags = availableBags.filter(b => {
      if (!b.expiry_date) return false
      const exp = new Date(b.expiry_date).getTime()
      return exp <= sevenDays
    })

    const componentCounts = {
      'Whole Blood': 0,
      'Packed RBC': 0,
      'Platelets': 0,
      'Fresh Frozen Plasma': 0
    }
    availableBags.forEach(b => {
      const c = b.component || 'Whole Blood'
      if (componentCounts[c] !== undefined) componentCounts[c]++
      else componentCounts['Whole Blood']++
    })

    return {
      totalAvailable: availableBags.length,
      totalDonors: safeDonors.length,
      pendingRequests: pendingRequests.length,
      expiringCount: expiringBags.length,
      byGroup,
      expiringBags,
      recentPendingRequests: pendingRequests.slice(0, 5),
      componentCounts
    }
  }, [bloodInventory, bloodDonors, bloodRequests])

  const patientRequests = useMemo(() => {
    if (!isPatient) return []
    const uid = String(user?.id || '')
    const uname = String(user?.name || '').toLowerCase()
    return (bloodRequests || []).filter(r => 
      (r.patient_user_id && String(r.patient_user_id) === uid) ||
      (r.user_id && String(r.user_id) === uid) ||
      (r.patient_name && String(r.patient_name).toLowerCase() === uname) ||
      (r.requester_name && String(r.requester_name).toLowerCase() === uname)
    )
  }, [isPatient, bloodRequests, user])

  const patientDonorProfile = useMemo(() => {
    if (!isPatient) return null
    const uid = String(user?.id || '')
    const uname = String(user?.name || '').toLowerCase()
    const uemail = String(user?.email || '').toLowerCase()
    return (bloodDonors || []).find(d => 
      (d.patient_user_id && String(d.patient_user_id) === uid) ||
      (d.user_id && String(d.user_id) === uid) ||
      (d.email && String(d.email).toLowerCase() === uemail) ||
      (d.name && String(d.name).toLowerCase() === uname)
    )
  }, [isPatient, bloodDonors, user])

  const handleComponentChange = (comp) => {
    const d = new Date(bagForm.collection_date || new Date())
    let days = 35
    let vol = 450
    if (comp === 'Platelets') { days = 5; vol = 50 }
    else if (comp === 'Packed RBC') { days = 42; vol = 250 }
    else if (comp === 'Fresh Frozen Plasma') { days = 365; vol = 200 }
    else if (comp === 'Whole Blood') { days = 35; vol = 450 }
    
    d.setDate(d.getDate() + days)
    setBagForm(prev => ({
      ...prev,
      component: comp,
      volume: vol,
      expiry_date: d.toISOString().split('T')[0]
    }))
  }

  const handleCreateBag = async (e) => {
    e.preventDefault()
    if (!bagForm.bag_number || !bagForm.blood_group) {
      toast.error('Please enter Bag Number and Blood Group')
      return
    }

    await addBloodBag({
      ...bagForm,
      created_at: new Date().toISOString()
    })
    setIsAddBagModalOpen(false)
    setBagForm({
      bag_number: `BLD-${Math.floor(10000 + Math.random() * 90000)}`,
      blood_group: 'O+',
      component: 'Whole Blood',
      volume: 450,
      storage_location: 'Cold Storage Room 1 - Rack A',
      collection_date: new Date().toISOString().split('T')[0],
      expiry_date: (() => {
        const d = new Date()
        d.setDate(d.getDate() + 35)
        return d.toISOString().split('T')[0]
      })(),
      status: 'Available',
      donor_name: '',
      tested_negative: true,
      notes: ''
    })
  }

  const handleCreateDonor = async (e) => {
    e.preventDefault()
    if (!donorForm.name || !donorForm.contact_number) {
      toast.error('Please complete donor name and phone')
      return
    }

    await addBloodDonor({
      ...donorForm,
      patient_user_id: user?.id || null,
      total_donations: 1,
      created_at: new Date().toISOString()
    })
    setIsAddDonorModalOpen(false)
    setDonorForm({
      name: isPatient ? (user?.name || '') : '',
      blood_group: isPatient ? (user?.blood_group || user?.bloodGroup || 'O+') : 'O+',
      contact_number: isPatient ? (user?.phone || '') : '',
      email: isPatient ? (user?.email || '') : '',
      gender: 'Male',
      age: '',
      weight: '',
      health_status: 'Healthy & Cleared',
      status: 'Eligible',
      last_donation_date: new Date().toISOString().split('T')[0]
    })
    toast.success('Donor registered successfully!')
  }

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    if (!requestForm.patient_name || !requestForm.hospital_name) {
      toast.error('Patient Name and Hospital are required')
      return
    }

    await addBloodRequest({
      ...requestForm,
      patient_user_id: user?.id || null,
      status: 'Pending',
      request_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    })
    setIsAddRequestModalOpen(false)
    setRequestForm({
      requester_name: isPatient ? (user?.name || '') : '',
      patient_name: isPatient ? (user?.name || '') : '',
      hospital_name: '',
      contact_phone: isPatient ? (user?.phone || '') : '',
      blood_group: isPatient ? (user?.blood_group || user?.bloodGroup || 'O+') : 'O+',
      component: 'Whole Blood',
      units_required: 1,
      urgency: 'Urgent',
      notes: ''
    })
    toast.success('Blood requisition submitted successfully!')
  }

  const handleQuickFulfill = (req) => {
    const matchingBag = (bloodInventory || []).find(b => 
      b.status === 'Available' && 
      b.blood_group === req.blood_group
    )

    if (matchingBag) {
      updateBloodBag(matchingBag.id, { 
        ...matchingBag, 
        status: 'Dispensed', 
        dispensed_to: req.patient_name,
        dispensed_at: new Date().toISOString() 
      })
      updateBloodRequest(req.id, { 
        ...req, 
        status: 'Fulfilled', 
        fulfilled_bag_id: matchingBag.bag_number,
        fulfilled_at: new Date().toISOString() 
      })
      toast.success(`Request fulfilled! Dispensed bag #${matchingBag.bag_number} to ${req.patient_name}`)
    } else {
      toast.error(`No available ${req.blood_group} units in inventory!`)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="ecare-dashboard-page"
      style={{ paddingBottom: '3rem' }}
    >
      {/* ─── Top Control Header (Consistent with E-CARE action rows) ── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
            {isPatient ? "Blood Bank & Donor Network" : "Blood Bank Management"}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={() => setIsAddRequestModalOpen(true)}
            className="ecare-btn-secondary"
            style={{ 
              width: 'auto', 
              minWidth: 'auto', 
              height: '38px', 
              padding: '0 1rem', 
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FirstAid size={16} weight="bold" color="#dc2626" />
            <span>{isPatient ? "Request Blood" : "Emergency Request"}</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsAddDonorModalOpen(true)}
            className="ecare-btn-secondary"
            style={{ 
              width: 'auto', 
              minWidth: 'auto', 
              height: '38px', 
              padding: '0 1rem', 
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <UserPlus size={16} weight="bold" />
            <span>{isPatient ? (patientDonorProfile ? "My Donor Profile" : "Volunteer as Donor") : "Register Donor"}</span>
          </button>

          {!isPatient && (
            <button 
              type="button"
              onClick={() => setIsAddBagModalOpen(true)}
              className="ecare-button"
              style={{ 
                width: 'auto', 
                minWidth: 'auto', 
                height: '38px', 
                padding: '0 1.25rem', 
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={16} weight="bold" />
              <span>Add Blood Bag</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Metric Stat Cards ─────────────────────────────────────── */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2, marginBottom: '1.5rem' }}>
        <StatCard 
          title={isPatient ? "Available Blood Units" : "Total Blood Bags"} 
          value={stats.totalAvailable} 
          icon={Drop} 
          color="#ef4444" 
          trend={isPatient ? "In Cold Storage" : "In Stock"}
          delay={0.1}
        />
        <StatCard 
          title="Registered Donors" 
          value={stats.totalDonors} 
          icon={Heart} 
          color="var(--ecare-primary)" 
          trend="Volunteers"
          delay={0.2}
        />
        <StatCard 
          title={isPatient ? "My Blood Requisitions" : "Pending Requests"} 
          value={isPatient ? patientRequests.length : stats.pendingRequests} 
          icon={FirstAid} 
          color={isPatient ? (patientRequests.length > 0 ? '#2563eb' : 'var(--ecare-primary-v3)') : (stats.pendingRequests > 0 ? '#dc2626' : 'var(--ecare-primary-v3)')} 
          trend={isPatient ? (patientRequests.some(r => r.status === 'Pending') ? 'Under Review' : 'All Clear') : (stats.pendingRequests > 0 ? `${stats.pendingRequests} urgent` : "All Clear")}
          delay={0.3}
        />
        <StatCard 
          title={isPatient ? "My Donor Status" : "Expiring in 7 Days"} 
          value={isPatient ? (patientDonorProfile ? (patientDonorProfile.status || 'Eligible') : 'Not Registered') : stats.expiringCount} 
          icon={isPatient ? UserPlus : WarningCircle} 
          color={isPatient ? (patientDonorProfile ? '#10b981' : '#f59e0b') : (stats.expiringCount > 0 ? '#f59e0b' : 'var(--ecare-primary-v4)')} 
          trend={isPatient ? (patientDonorProfile ? `${patientDonorProfile.blood_group} Volunteer` : 'Join Network') : (stats.expiringCount > 0 ? "QC Alert" : "Safe")}
          delay={0.4}
        />
      </div>

      {/* ─── Blood Group Inventory Grid (Clean & Compact) ────────── */}
      <div className="ecare-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
              Blood Group Stock Availability
            </h3>
          </div>
          <span 
            onClick={() => setActivePage(isPatient ? 'blood-requests' : 'blood-inventory')}
            style={{ fontSize: '0.75rem', color: 'var(--ecare-primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {isPatient ? "Request Blood Units" : "Manage All Bags"} <ArrowRight size={13} weight="bold" />
          </span>
        </div>

        {/* Responsive Compact Grid: 4 columns on desktop, 2 columns on mobile */}
        <div className="ecare-blood-group-grid">
          {BLOOD_GROUPS.map((group) => {
            const count = stats.byGroup[group] || 0
            const isSafe = count >= 4
            const isLow = count > 0 && count < 4
            const isCritical = count === 0

            return (
              <div 
                key={group}
                style={{
                  background: '#f8fafc',
                  border: isCritical ? '1px solid #fee2e2' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.625rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ 
                  width: '30px', height: '30px', borderRadius: '50%', 
                  background: isCritical ? '#fee2e2' : 'white',
                  border: isCritical ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  color: isCritical ? '#dc2626' : 'var(--ecare-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 800, marginBottom: '4px'
                }}>
                  {group}
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                  {count} <span style={{ fontSize: '0.675rem', fontWeight: 500, color: '#64748b' }}>Bags</span>
                </div>

                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '0.625rem', 
                  fontWeight: 700, 
                  color: isCritical ? '#dc2626' : (isLow ? '#d97706' : '#16a34a'),
                  background: isCritical ? '#fee2e2' : (isLow ? '#fef3c7' : '#dcfce7'),
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  {isCritical ? 'Empty' : (isLow ? 'Low Stock' : 'Adequate')}
                </div>

                {isPatient ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRequestForm(prev => ({ ...prev, blood_group: group }))
                      setIsAddRequestModalOpen(true)
                    }}
                    style={{
                      marginTop: '6px',
                      width: '100%',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      background: isCritical ? '#fee2e2' : '#f0fdf4',
                      border: isCritical ? '1px solid #fecaca' : '1px solid #bbf7d0',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: isCritical ? '#dc2626' : '#166534',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <FirstAid size={11} weight="bold" /> Request {group}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBagForm(prev => ({ ...prev, blood_group: group }))
                      setIsAddBagModalOpen(true)
                    }}
                    style={{
                      marginTop: '6px',
                      width: '100%',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + Add
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Two-Column Section (Matches ecare-dashboard-grid-2col) ── */}
      <div className="ecare-dashboard-grid-2col" style={{ marginBottom: '1.5rem' }}>
        {isPatient ? (
          <>
            {/* Left Panel: Patient's Own Requisitions */}
            <div className="ecare-card" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FirstAid size={18} weight="fill" color="#dc2626" />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
                    My Blood Requisitions
                  </h3>
                </div>
                <span 
                  onClick={() => setActivePage('blood-requests')}
                  style={{ fontSize: '0.8125rem', color: 'var(--ecare-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  View All ({patientRequests.length})
                </span>
              </div>

              {patientRequests.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', color: '#94a3b8', textAlign: 'center' }}>
                  <FirstAid size={32} weight="duotone" color="#2563eb" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>No Active Blood Requests</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', maxWidth: '300px' }}>
                    Need blood units for an upcoming surgery, dialysis, or emergency care?
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddRequestModalOpen(true)}
                    className="ecare-button"
                    style={{ marginTop: '12px', width: 'auto', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Request Blood Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', overflowY: 'auto', maxHeight: '250px' }}>
                  {patientRequests.map(req => (
                    <div 
                      key={req.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.9rem' }}>{req.blood_group}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1e293b' }}>
                            {req.units_required || 1} Unit ({req.component || 'Whole Blood'})
                          </span>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            color: req.urgency === 'Emergency' ? '#dc2626' : '#d97706',
                            background: req.urgency === 'Emergency' ? '#fee2e2' : '#fef3c7',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {req.urgency || 'Urgent'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                          {req.hospital_name || 'Hospital'} • Requested: {req.request_date || 'Today'}
                        </div>
                      </div>

                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: req.status === 'Fulfilled' ? '#dcfce7' : (req.status === 'Cancelled' ? '#f1f5f9' : '#fef3c7'),
                        color: req.status === 'Fulfilled' ? '#166534' : (req.status === 'Cancelled' ? '#64748b' : '#b45309'),
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>
                        {req.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel: Volunteer Donor Hub & Status */}
            <div className="ecare-card" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={18} weight="fill" color="#e11d48" />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
                    Volunteer Donor Network
                  </h3>
                </div>
                <span 
                  onClick={() => setActivePage('blood-donors')}
                  style={{ fontSize: '0.8125rem', color: 'var(--ecare-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Donor Directory <ArrowRight size={14} weight="bold" />
                </span>
              </div>

              {patientDonorProfile ? (
                <div style={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', 
                  borderRadius: '12px', 
                  padding: '1.25rem',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Verified Donor Profile
                      </span>
                      <span style={{ 
                        background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', fontWeight: 800, 
                        padding: '2px 8px', borderRadius: '4px', border: '1px solid #86efac' 
                      }}>
                        {patientDonorProfile.status || 'Eligible'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                      <div style={{ 
                        width: '46px', height: '46px', borderRadius: '50%', background: '#dc2626', 
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', fontWeight: 900, boxShadow: '0 2px 4px rgba(220,38,38,0.2)'
                      }}>
                        {patientDonorProfile.blood_group || 'O+'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#14532d' }}>
                          {patientDonorProfile.name || user?.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                          {patientDonorProfile.total_donations || 1} lifetime donations • {patientDonorProfile.city || 'Local Area'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #dcfce7', fontSize: '0.75rem', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Thank you for being a registered lifesaver!</span>
                    <button
                      type="button"
                      onClick={() => setActivePage('blood-donors')}
                      style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', 
                  borderRadius: '12px', 
                  padding: '1.25rem',
                  border: '1px solid #fecdd3',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#9f1239' }}>
                      Be a Lifesaver in Our Community
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#881337', marginTop: '4px', lineHeight: 1.4 }}>
                      One blood donation can save up to 3 lives. Volunteer donors receive health screenings and direct priority care.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} weight="bold" color="#10b981" /> Age 18–65 years
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} weight="bold" color="#10b981" /> Weight ≥ 50 kg
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} weight="bold" color="#10b981" /> Good health
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={13} weight="bold" color="#10b981" /> 90 days interval
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddDonorModalOpen(true)}
                    className="ecare-button"
                    style={{ marginTop: '12px', width: '100%', padding: '7px 12px', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Volunteer as Blood Donor
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Left Panel: Near-Expiry QC */}
            <div className="ecare-card" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WarningCircle size={18} weight="fill" color="#f59e0b" />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
                    Near-Expiry QC (≤ 7 Days)
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>
                  {stats.expiringBags.length} Units
                </span>
              </div>

              {stats.expiringBags.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', color: '#94a3b8', textAlign: 'center' }}>
                  <CheckCircle size={32} weight="duotone" color="#10b981" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ecare-text-main)' }}>Stock Condition Optimal</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>All blood units are safely within preservation limits.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', overflowY: 'auto', maxHeight: '250px' }}>
                  {stats.expiringBags.map(bag => {
                    const daysLeft = Math.ceil((new Date(bag.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    const isPast = daysLeft < 0
                    return (
                      <div 
                        key={bag.id}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '10px',
                          background: isPast ? '#fef2f2' : '#f8fafc',
                          border: isPast ? '1px solid #fecaca' : '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.9rem' }}>{bag.blood_group}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>#{bag.bag_number}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({bag.component || 'Whole Blood'})</span>
                          </div>
                          <div style={{ fontSize: '0.725rem', color: isPast ? '#dc2626' : '#d97706', marginTop: '2px', fontWeight: 600 }}>
                            {isPast ? `Expired on ${bag.expiry_date}` : `Expires in ${daysLeft} days (${bag.expiry_date})`}
                          </div>
                        </div>

                        {!isPatient && (
                          <button
                            type="button"
                            onClick={() => {
                              updateBloodBag(bag.id, { ...bag, status: isPast ? 'Discarded' : 'Dispensed' })
                              toast.success(`Bag #${bag.bag_number} marked as ${isPast ? 'Discarded' : 'Dispensed'}`)
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              color: isPast ? '#dc2626' : '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            {isPast ? 'Discard' : 'Dispense'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right Panel: Pending Hospital Requisitions */}
            <div className="ecare-card" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FirstAid size={18} weight="fill" color="#dc2626" />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
                    Pending Hospital Requisitions
                  </h3>
                </div>
                <span 
                  onClick={() => setActivePage('blood-requests')}
                  style={{ fontSize: '0.8125rem', color: 'var(--ecare-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  View All ({stats.pendingRequests})
                </span>
              </div>

              {stats.recentPendingRequests.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', color: '#94a3b8', textAlign: 'center' }}>
                  <CheckCircle size={32} weight="duotone" color="#10b981" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ecare-text-main)' }}>No Pending Requisitions</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>All clinical blood demands have been fulfilled.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', overflowY: 'auto', maxHeight: '250px' }}>
                  {stats.recentPendingRequests.map(req => (
                    <div 
                      key={req.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.9rem' }}>{req.blood_group}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#1e293b' }}>
                            {req.patient_name || req.requester_name} ({req.units_required || 1} Unit)
                          </span>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            color: req.urgency === 'Emergency' ? '#dc2626' : '#d97706',
                            background: req.urgency === 'Emergency' ? '#fee2e2' : '#fef3c7',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {req.urgency || 'Urgent'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                          {req.hospital_name || 'Hospital Unit'} • Req: {req.request_date || 'Today'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickFulfill(req)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          background: 'var(--ecare-primary)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Fulfill
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Blood Components Reserve Breakdown ─────────────────────── */}
      <div className="ecare-card" style={{ padding: '1.25rem', borderRadius: '14px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
            Blood Components Reserve Breakdown
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '2px 0 0 0' }}>
            Inventory categorized by biological component
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Object.entries(stats.componentCounts).map(([name, count]) => (
            <div 
              key={name}
              style={{ 
                padding: '1rem', 
                background: '#f8fafc', 
                borderRadius: '10px', 
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ecare-text-muted)' }}>{name}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ecare-text-main)', marginTop: '2px' }}>
                  {count} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>Bags</span>
                </div>
              </div>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626'
              }}>
                <Drop size={18} weight="duotone" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL 1: ADD BLOOD BAG ────────────────────────────────── */}
      <Portal>
        <AnimatePresence>
          {isAddBagModalOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsAddBagModalOpen(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="ecare-card"
                style={{ 
                  width: '100%', maxWidth: '520px', maxHeight: '90vh', position: 'relative', 
                  padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Drop size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Log New Blood Bag</h3>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>Register collected unit into cold chain inventory</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsAddBagModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleCreateBag} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Bag Barcode / Number *</label>
                      <input 
                        type="text" 
                        required 
                        className="ecare-input" 
                        value={bagForm.bag_number} 
                        onChange={e => setBagForm({ ...bagForm, bag_number: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Blood Group *</label>
                      <CustomSelect 
                        value={bagForm.blood_group} 
                        onChange={val => setBagForm({ ...bagForm, blood_group: val })}
                        options={BLOOD_GROUP_OPTIONS}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Component Type</label>
                      <CustomSelect 
                        value={bagForm.component} 
                        onChange={val => handleComponentChange(val)}
                        options={COMPONENT_OPTIONS}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Volume (mL)</label>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        value={bagForm.volume} 
                        onChange={e => setBagForm({ ...bagForm, volume: Number(e.target.value) })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Collection Date</label>
                      <input 
                        type="date" 
                        className="ecare-input" 
                        value={bagForm.collection_date} 
                        onChange={e => setBagForm({ ...bagForm, collection_date: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Expiry Date</label>
                      <input 
                        type="date" 
                        className="ecare-input" 
                        value={bagForm.expiry_date} 
                        onChange={e => setBagForm({ ...bagForm, expiry_date: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Storage Location / Unit</label>
                      <input 
                        type="text" 
                        className="ecare-input" 
                        value={bagForm.storage_location} 
                        onChange={e => setBagForm({ ...bagForm, storage_location: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Donor Name (Optional)</label>
                      <input 
                        type="text" 
                        className="ecare-input" 
                        placeholder="Registered donor name"
                        value={bagForm.donor_name} 
                        onChange={e => setBagForm({ ...bagForm, donor_name: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={bagForm.tested_negative} 
                        onChange={e => setBagForm({ ...bagForm, tested_negative: e.target.checked })} 
                      />
                      Screened & Certified Negative for HIV 1/2, Hep B, Hep C, Syphilis
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddBagModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem', width: 'auto' }}>
                      Save Blood Bag
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* ─── MODAL 2: REGISTER DONOR ──────────────────────────────── */}
      <Portal>
        <AnimatePresence>
          {isAddDonorModalOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsAddDonorModalOpen(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="ecare-card"
                style={{ 
                  width: '100%', maxWidth: '500px', maxHeight: '90vh', position: 'relative', 
                  padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Heart size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Register Blood Donor</h3>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>Enroll volunteer donor into directory</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsAddDonorModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleCreateDonor} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="ecare-form-group">
                    <label className="ecare-label">Donor Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      className="ecare-input" 
                      placeholder="e.g. David Rahman"
                      value={donorForm.name} 
                      onChange={e => setDonorForm({ ...donorForm, name: e.target.value })} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Phone Number *</label>
                      <input 
                        type="tel" 
                        required 
                        className="ecare-input" 
                        placeholder="+880..."
                        value={donorForm.contact_number} 
                        onChange={e => setDonorForm({ ...donorForm, contact_number: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Blood Group *</label>
                      <CustomSelect 
                        value={donorForm.blood_group} 
                        onChange={val => setDonorForm({ ...donorForm, blood_group: val })}
                        options={BLOOD_GROUP_OPTIONS}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Gender</label>
                      <CustomSelect 
                        value={donorForm.gender} 
                        onChange={val => setDonorForm({ ...donorForm, gender: val })}
                        options={GENDER_OPTIONS}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Age</label>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        placeholder="18-65"
                        value={donorForm.age} 
                        onChange={e => setDonorForm({ ...donorForm, age: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Weight (kg)</label>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        placeholder="Min 50"
                        value={donorForm.weight} 
                        onChange={e => setDonorForm({ ...donorForm, weight: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddDonorModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem', width: 'auto' }}>
                      Save Donor
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* ─── MODAL 3: EMERGENCY BLOOD REQUEST ──────────────────────── */}
      <Portal>
        <AnimatePresence>
          {isAddRequestModalOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsAddRequestModalOpen(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="ecare-card"
                style={{ 
                  width: '100%', maxWidth: '520px', maxHeight: '90vh', position: 'relative', 
                  padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FirstAid size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Create Blood Requisition</h3>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>Place emergency or surgical blood request</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsAddRequestModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleCreateRequest} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Patient Name *</label>
                      <input 
                        type="text" 
                        required 
                        className="ecare-input" 
                        placeholder="Patient Full Name"
                        value={requestForm.patient_name} 
                        onChange={e => setRequestForm({ ...requestForm, patient_name: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Hospital / Ward *</label>
                      <input 
                        type="text" 
                        required 
                        className="ecare-input" 
                        placeholder="e.g. ICU Bed 4, City Hospital"
                        value={requestForm.hospital_name} 
                        onChange={e => setRequestForm({ ...requestForm, hospital_name: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Blood Group *</label>
                      <CustomSelect 
                        value={requestForm.blood_group} 
                        onChange={val => setRequestForm({ ...requestForm, blood_group: val })}
                        options={BLOOD_GROUP_OPTIONS}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Units (Bags) *</label>
                      <input 
                        type="number" 
                        min="1"
                        max="10"
                        required
                        className="ecare-input" 
                        value={requestForm.units_required} 
                        onChange={e => setRequestForm({ ...requestForm, units_required: Math.max(1, Number(e.target.value)) })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Component Type</label>
                      <CustomSelect 
                        value={requestForm.component} 
                        onChange={val => setRequestForm({ ...requestForm, component: val })}
                        options={COMPONENT_OPTIONS}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Urgency Priority</label>
                      <CustomSelect 
                        value={requestForm.urgency} 
                        onChange={val => setRequestForm({ ...requestForm, urgency: val })}
                        options={URGENCY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Contact Phone</label>
                    <input 
                      type="tel" 
                      className="ecare-input" 
                      placeholder="e.g. +880 1700-000000"
                      value={requestForm.contact_phone} 
                      onChange={e => setRequestForm({ ...requestForm, contact_phone: e.target.value })} 
                    />
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Clinical Indication / Diagnosis Notes</label>
                    <textarea 
                      rows={2}
                      className="ecare-input" 
                      placeholder="e.g. Scheduled emergency surgery at 4 PM, Hb 7.2 g/dL"
                      value={requestForm.notes} 
                      onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" onClick={() => setIsAddRequestModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem', width: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <FirstAid size={16} weight="bold" /> Submit Requisition
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </motion.div>
  )
}

export default BloodBankDashboard
