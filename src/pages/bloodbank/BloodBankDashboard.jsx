import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Drop, Heart, FirstAid, WarningCircle, CheckCircle, 
  Clock, Plus, ArrowRight, ArrowUpRight, UserPlus, X, Thermometer, Info
} from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

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
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
            Blood Bank Management
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ecare-text-muted)', margin: '3px 0 0 0' }}>
            Real-time blood reserves, volunteer donor network, and clinical dispatch
          </p>
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
            <span>{isPatient ? "Volunteer as Donor" : "Register Donor"}</span>
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
          title="Total Blood Bags" 
          value={stats.totalAvailable} 
          icon={Drop} 
          color="#ef4444" 
          trend="In Stock"
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
          title="Pending Requests" 
          value={stats.pendingRequests} 
          icon={FirstAid} 
          color={stats.pendingRequests > 0 ? '#dc2626' : 'var(--ecare-primary-v3)'} 
          trend={stats.pendingRequests > 0 ? `${stats.pendingRequests} urgent` : "All Clear"}
          delay={0.3}
        />
        <StatCard 
          title="Expiring in 7 Days" 
          value={stats.expiringCount} 
          icon={WarningCircle} 
          color={stats.expiringCount > 0 ? '#f59e0b' : 'var(--ecare-primary-v4)'} 
          trend={stats.expiringCount > 0 ? "QC Alert" : "Safe"}
          delay={0.4}
        />
      </div>

      {/* ─── Blood Group Inventory Grid (Clean & Harmonious) ──────── */}
      <div className="ecare-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
              Blood Group Stock Availability
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '2px 0 0 0' }}>
              Real-time reserves across standard ABO and Rh blood types
            </p>
          </div>
          <span 
            onClick={() => setActivePage('blood-inventory')}
            style={{ fontSize: '0.8125rem', color: 'var(--ecare-primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Manage All Bags <ArrowRight size={14} weight="bold" />
          </span>
        </div>

        {/* 4x2 Grid on desktop, 2x4 on tablet */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
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
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.875rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', 
                  background: isCritical ? '#fee2e2' : 'white',
                  border: isCritical ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  color: isCritical ? '#dc2626' : 'var(--ecare-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 800, marginBottom: '6px'
                }}>
                  {group}
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                  {count} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Bags</span>
                </div>

                <div style={{ 
                  marginTop: '6px', 
                  fontSize: '0.675rem', 
                  fontWeight: 700, 
                  color: isCritical ? '#dc2626' : (isLow ? '#d97706' : '#16a34a'),
                  background: isCritical ? '#fee2e2' : (isLow ? '#fef3c7' : '#dcfce7'),
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {isCritical ? 'Empty' : (isLow ? 'Low Stock' : 'Adequate')}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBagForm(prev => ({ ...prev, blood_group: group }))
                    setIsAddBagModalOpen(true)
                  }}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '4px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  + Add
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Two-Column Section (Matches ecare-dashboard-grid-2col) ── */}
      <div className="ecare-dashboard-grid-2col" style={{ marginBottom: '1.5rem' }}>
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

                  {!isPatient ? (
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
                  ) : (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#fef3c7',
                      color: '#d97706',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      {req.status || 'Pending'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
                      <select 
                        className="ecare-input" 
                        value={bagForm.blood_group} 
                        onChange={e => setBagForm({ ...bagForm, blood_group: e.target.value })}
                        style={{ height: '38px' }}
                      >
                        {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Component Type</label>
                      <select 
                        className="ecare-input" 
                        value={bagForm.component} 
                        onChange={e => handleComponentChange(e.target.value)}
                        style={{ height: '38px' }}
                      >
                        <option value="Whole Blood">Whole Blood (35 Days)</option>
                        <option value="Packed RBC">Packed RBC (42 Days)</option>
                        <option value="Platelets">Platelets (5 Days)</option>
                        <option value="Fresh Frozen Plasma">Fresh Frozen Plasma (365 Days)</option>
                      </select>
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
                      <select 
                        className="ecare-input" 
                        value={donorForm.blood_group} 
                        onChange={e => setDonorForm({ ...donorForm, blood_group: e.target.value })}
                        style={{ height: '38px' }}
                      >
                        {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Gender</label>
                      <select 
                        className="ecare-input" 
                        value={donorForm.gender} 
                        onChange={e => setDonorForm({ ...donorForm, gender: e.target.value })}
                        style={{ height: '38px' }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
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
                  width: '100%', maxWidth: '500px', maxHeight: '90vh', position: 'relative', 
                  padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', background: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FirstAid size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>Create Blood Requisition</h3>
                      <p style={{ fontSize: '0.72rem', color: '#b91c1c', margin: 0 }}>Place emergency or surgical blood request</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsAddRequestModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleCreateRequest} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                        placeholder="e.g. ICU Bed 4"
                        value={requestForm.hospital_name} 
                        onChange={e => setRequestForm({ ...requestForm, hospital_name: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Blood Group *</label>
                      <select 
                        className="ecare-input" 
                        value={requestForm.blood_group} 
                        onChange={e => setRequestForm({ ...requestForm, blood_group: e.target.value })}
                        style={{ height: '38px' }}
                      >
                        {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Units (Bags)</label>
                      <input 
                        type="number" 
                        min="1"
                        max="10"
                        className="ecare-input" 
                        value={requestForm.units_required} 
                        onChange={e => setRequestForm({ ...requestForm, units_required: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Urgency</label>
                      <select 
                        className="ecare-input" 
                        value={requestForm.urgency} 
                        onChange={e => setRequestForm({ ...requestForm, urgency: e.target.value })}
                        style={{ height: '38px' }}
                      >
                        <option value="Emergency">Emergency (STAT)</option>
                        <option value="Urgent">Urgent (Within 4h)</option>
                        <option value="Normal">Routine (Scheduled)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddRequestModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem', background: '#dc2626', width: 'auto' }}>
                      Submit Requisition
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
