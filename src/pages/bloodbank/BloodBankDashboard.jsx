import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Drop, Heart, FirstAid, WarningCircle, CheckCircle, 
  Clock, Plus, ArrowRight, ArrowUpRight, ShieldCheck, Thermometer, UserPlus, FileText, Trash, X
} from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const COMPATIBILITY = {
  'O-': { givesTo: 'Universal Red Cell Donor', receivesFrom: 'O- only' },
  'O+': { givesTo: 'O+, A+, B+, AB+', receivesFrom: 'O+, O-' },
  'A-': { givesTo: 'A-, A+, AB-, AB+', receivesFrom: 'A-, O-' },
  'A+': { givesTo: 'A+, AB+', receivesFrom: 'A+, A-, O+, O-' },
  'B-': { givesTo: 'B-, B+, AB-, AB+', receivesFrom: 'B-, O-' },
  'B+': { givesTo: 'B+, AB+', receivesFrom: 'B+, B-, O+, O-' },
  'AB-': { givesTo: 'AB-, AB+', receivesFrom: 'AB-, A-, B-, O-' },
  'AB+': { givesTo: 'AB+ only', receivesFrom: 'Universal Recipient (All groups)' },
}

const StatCard = ({ title, value, subtext, icon: Icon, color, trend, delay, onClick }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    whileHover={onClick ? { y: -2, borderColor: color } : {}}
    onClick={onClick}
    className="ecare-card"
    style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      padding: '1.25rem',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <div style={{ 
        width: '42px', 
        height: '42px', 
        borderRadius: '10px', 
        background: `${color}15`, 
        color: color, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Icon size={22} weight="duotone" />
      </div>
      {trend && (
        <span style={{ 
          fontSize: '0.725rem', 
          fontWeight: 700, 
          color: color, 
          background: `${color}15`, 
          padding: '2px 8px', 
          borderRadius: '99px' 
        }}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>{title}</div>
      <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.65rem', fontWeight: 800, marginTop: '2px', lineHeight: 1.1 }}>
        {value}
      </div>
      {subtext && (
        <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>{subtext}</div>
      )}
    </div>
  </motion.div>
)

const BloodBankDashboard = () => {
  const { 
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

  const [isAddBagModalOpen, setIsAddBagModalOpen] = useState(false)
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false)
  const [isAddRequestModalOpen, setIsAddRequestModalOpen] = useState(false)
  const [selectedBagForDispense, setSelectedBagForDispense] = useState(null)

  // Form states
  const [bagForm, setBagForm] = useState({
    bag_number: `BLD-${Math.floor(10000 + Math.random() * 90000)}`,
    blood_group: 'O+',
    component: 'Whole Blood',
    volume: 450,
    storage_location: 'Fridge A - Shelf 1',
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
    name: '',
    blood_group: 'O+',
    contact_number: '',
    email: '',
    gender: 'Male',
    age: '',
    weight: '',
    health_status: 'Healthy & Cleared',
    status: 'Eligible',
    last_donation_date: new Date().toISOString().split('T')[0]
  })

  const [requestForm, setRequestForm] = useState({
    requester_name: '',
    patient_name: '',
    hospital_name: 'General Ward / Surgery',
    contact_phone: '',
    blood_group: 'O+',
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

    // Stock by group
    const byGroup = {}
    BLOOD_GROUPS.forEach(g => byGroup[g] = 0)
    availableBags.forEach(b => {
      if (b.blood_group) {
        byGroup[b.blood_group] = (byGroup[b.blood_group] || 0) + 1
      }
    })

    // Low / Critical groups (<3 is low, 0 is critical)
    const criticalGroups = BLOOD_GROUPS.filter(g => byGroup[g] === 0)
    const lowGroups = BLOOD_GROUPS.filter(g => byGroup[g] > 0 && byGroup[g] <= 2)

    // Expiring within 7 days
    const now = new Date().getTime()
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000)
    const expiringBags = availableBags.filter(b => {
      if (!b.expiry_date) return false
      const exp = new Date(b.expiry_date).getTime()
      return exp <= sevenDaysFromNow
    })

    // Components distribution
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
      criticalGroupsCount: criticalGroups.length,
      byGroup,
      criticalGroups,
      lowGroups,
      expiringBags,
      recentPendingRequests: pendingRequests.slice(0, 5),
      componentCounts
    }
  }, [bloodInventory, bloodDonors, bloodRequests])

  // Component change auto expiry helper
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
      storage_location: 'Fridge A - Shelf 1',
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
      total_donations: 1,
      created_at: new Date().toISOString()
    })
    setIsAddDonorModalOpen(false)
    setDonorForm({
      name: '',
      blood_group: 'O+',
      contact_number: '',
      email: '',
      gender: 'Male',
      age: '',
      weight: '',
      health_status: 'Healthy & Cleared',
      status: 'Eligible',
      last_donation_date: new Date().toISOString().split('T')[0]
    })
  }

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    if (!requestForm.patient_name || !requestForm.hospital_name) {
      toast.error('Patient Name and Hospital are required')
      return
    }

    await addBloodRequest({
      ...requestForm,
      status: 'Pending',
      request_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    })
    setIsAddRequestModalOpen(false)
    setRequestForm({
      requester_name: '',
      patient_name: '',
      hospital_name: 'General Ward / Surgery',
      contact_phone: '',
      blood_group: 'O+',
      component: 'Whole Blood',
      units_required: 1,
      urgency: 'Urgent',
      notes: ''
    })
  }

  const handleQuickFulfill = (req) => {
    // Find matching bag
    const matchingBag = (bloodInventory || []).find(b => 
      b.status === 'Available' && 
      b.blood_group === req.blood_group && 
      (b.component === req.component || !req.component)
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
      toast.error(`No available ${req.blood_group} bags in inventory! Please procure or collect first.`)
    }
  }

  return (
    <div className="ecare-page-slide ecare-dashboard" style={{ paddingBottom: '3rem' }}>
      {/* ─── Top Control Header ────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: '#fee2e2', color: '#dc2626', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <Drop size={20} weight="fill" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>
              Blood Bank Command Center
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--ecare-text-muted)' }}>
            Real-time cold chain inventory, volunteer donor registry, and emergency hospital requisitions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsAddRequestModalOpen(true)}
            className="ecare-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 1rem', borderRadius: '10px' }}
          >
            <FirstAid size={16} weight="bold" color="#dc2626" />
            <span>Emergency Request</span>
          </button>

          <button 
            onClick={() => setIsAddDonorModalOpen(true)}
            className="ecare-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 1rem', borderRadius: '10px' }}
          >
            <UserPlus size={16} weight="bold" />
            <span>Register Donor</span>
          </button>

          <button 
            onClick={() => setIsAddBagModalOpen(true)}
            className="ecare-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 1.15rem', borderRadius: '10px' }}
          >
            <Plus size={16} weight="bold" />
            <span>Add Blood Bag</span>
          </button>
        </div>
      </div>

      {/* ─── Metric Stat Cards ─────────────────────────────────────── */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2, marginBottom: '1.5rem' }}>
        <StatCard 
          title="Total Blood Bags" 
          value={stats.totalAvailable} 
          subtext="Available across all fridges"
          icon={Drop} 
          color="#ef4444" 
          trend="Live Stock"
          delay={0.1}
          onClick={() => setActivePage('blood-inventory')}
        />
        <StatCard 
          title="Registered Donors" 
          value={stats.totalDonors} 
          subtext="Volunteer life-savers network"
          icon={Heart} 
          color="#10b981" 
          trend="Active"
          delay={0.15}
          onClick={() => setActivePage('blood-donors')}
        />
        <StatCard 
          title="Pending Requests" 
          value={stats.pendingRequests} 
          subtext={stats.pendingRequests > 0 ? 'Requires clinical dispatch' : 'All requisitions fulfilled'}
          icon={FirstAid} 
          color={stats.pendingRequests > 0 ? '#dc2626' : '#64748b'} 
          trend={stats.pendingRequests > 0 ? 'ACTION NEEDED' : 'Clear'}
          delay={0.2}
          onClick={() => setActivePage('blood-requests')}
        />
        <StatCard 
          title="Expiring in 7 Days" 
          value={stats.expiringCount} 
          subtext={stats.expiringCount > 0 ? 'Quality control priority' : 'No near-expiry units'}
          icon={WarningCircle} 
          color={stats.expiringCount > 0 ? '#f59e0b' : '#0ea5e9'} 
          trend={stats.expiringCount > 0 ? 'Review Bags' : 'Stable'}
          delay={0.25}
        />
      </div>

      {/* ─── Live Blood Group Capacity Matrix ──────────────────────── */}
      <div className="ecare-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--ecare-text-main)' }}>
              Blood Group Inventory Matrix
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--ecare-text-muted)' }}>
              Real-time capacity tracking against benchmark target of 10 units per group
            </p>
          </div>
          <button 
            onClick={() => setActivePage('blood-inventory')} 
            style={{ 
              fontSize: '0.8rem', 
              color: 'var(--ecare-primary)', 
              fontWeight: 700, 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Manage All Bags <ArrowRight size={14} weight="bold" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          {BLOOD_GROUPS.map((group) => {
            const count = stats.byGroup[group] || 0
            const compat = COMPATIBILITY[group]
            const isCritical = count === 0
            const isLow = count > 0 && count <= 2
            const target = 10
            const pct = Math.min(100, Math.round((count / target) * 100))

            let badgeBg = '#dcfce7'
            let badgeColor = '#16a34a'
            let badgeText = 'Adequate'

            if (isCritical) {
              badgeBg = '#fee2e2'
              badgeColor = '#dc2626'
              badgeText = 'Empty'
            } else if (isLow) {
              badgeBg = '#fef3c7'
              badgeColor = '#d97706'
              badgeText = 'Low Reserve'
            }

            return (
              <div 
                key={group}
                style={{
                  background: '#f8fafc',
                  border: isCritical ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: 900, 
                    color: '#dc2626', 
                    lineHeight: 1 
                  }}>
                    {group}
                  </div>
                  <span style={{ 
                    background: badgeBg, 
                    color: badgeColor, 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {badgeText}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                      {count} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Bags</span>
                    </span>
                    <span style={{ fontSize: '0.725rem', fontWeight: 600, color: '#94a3b8' }}>
                      {pct}% Target
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: badgeColor, borderRadius: '99px', transition: 'width 0.4s' }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.725rem', color: '#64748b', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                  <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={compat.givesTo}>
                    <strong>Gives:</strong> {compat.givesTo}
                  </div>
                  <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={compat.receivesFrom}>
                    <strong>Receives:</strong> {compat.receivesFrom}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setBagForm(prev => ({ ...prev, blood_group: group }))
                    setIsAddBagModalOpen(true)
                  }}
                  style={{
                    marginTop: 'auto',
                    padding: '6px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={12} weight="bold" /> Add {group} Bag
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Two-Column Section: Expiring Alerts & Urgent Requests ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Panel: Expiring Units */}
        <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WarningCircle size={20} weight="fill" color="#f59e0b" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Near-Expiry Quality Control (≤ 7 Days)
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>
              {stats.expiringBags.length} Bags
            </span>
          </div>

          {stats.expiringBags.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              <CheckCircle size={32} weight="duotone" color="#10b981" style={{ margin: '0 auto 8px', display: 'block' }} />
              All blood stock is well within safe expiration limits.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px' }}>
              {stats.expiringBags.map(bag => {
                const daysLeft = Math.ceil((new Date(bag.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                const isPast = daysLeft < 0
                return (
                  <div 
                    key={bag.id} 
                    style={{ 
                      padding: '10px 12px', 
                      background: isPast ? '#fef2f2' : '#fffbeb', 
                      border: isPast ? '1px solid #fca5a5' : '1px solid #fde68a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#dc2626', fontSize: '0.9rem' }}>{bag.blood_group}</strong>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>#{bag.bag_number}</span>
                        <span style={{ fontSize: '0.725rem', color: '#64748b' }}>({bag.component || 'Whole Blood'})</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isPast ? '#dc2626' : '#b45309', marginTop: '2px', fontWeight: 600 }}>
                        {isPast ? `Expired on ${bag.expiry_date}` : `Expires in ${daysLeft} days (${bag.expiry_date})`} • {bag.storage_location || 'Cold Fridge'}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        updateBloodBag(bag.id, { ...bag, status: isPast ? 'Discarded' : 'Dispensed' })
                        toast.success(`Bag #${bag.bag_number} marked as ${isPast ? 'Discarded' : 'Dispensed'}`)
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: isPast ? '#fee2e2' : '#fef3c7',
                        border: 'none',
                        color: isPast ? '#dc2626' : '#92400e',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isPast ? 'Discard' : 'Dispense'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Pending Emergency Requests */}
        <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FirstAid size={20} weight="fill" color="#dc2626" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Pending Hospital Requisitions
              </h3>
            </div>
            <button 
              onClick={() => setActivePage('blood-requests')}
              style={{ fontSize: '0.75rem', color: 'var(--ecare-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All ({stats.pendingRequests})
            </button>
          </div>

          {stats.recentPendingRequests.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              <CheckCircle size={32} weight="duotone" color="#10b981" style={{ margin: '0 auto 8px', display: 'block' }} />
              No pending blood requisitions. All clinical demands are met.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px' }}>
              {stats.recentPendingRequests.map(req => (
                <div 
                  key={req.id}
                  style={{
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#dc2626', fontSize: '0.95rem' }}>{req.blood_group}</strong>
                      <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1e293b' }}>
                        {req.patient_name} ({req.units_required || 1} Units)
                      </span>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        color: req.urgency === 'Emergency' ? '#dc2626' : '#ca8a04',
                        background: req.urgency === 'Emergency' ? '#fee2e2' : '#fef9c3',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {req.urgency || 'Normal'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px' }}>
                      {req.hospital_name || 'Hospital Unit'} • Req Date: {req.request_date || 'Today'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickFulfill(req)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'var(--ecare-primary)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Fulfill Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Component Inventory Breakdown ─────────────────────────── */}
      <div className="ecare-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--ecare-text-main)' }}>
          Blood Components Reserve Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {Object.entries(stats.componentCounts).map(([compName, compCount]) => (
            <div key={compName} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{compName}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
                {compCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>Units</span>
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
                  <button onClick={() => setIsAddBagModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
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
                      <label className="ecare-label">Expiry Date (Auto-calculated)</label>
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
                        placeholder="e.g. Fridge B - Shelf 2"
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
                      Serology Screened: Negative for HIV 1/2, Hep B, Hep C, and Syphilis
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddBagModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem' }}>
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
                  <button onClick={() => setIsAddDonorModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Eligibility Status</label>
                      <select 
                        className="ecare-input" 
                        value={donorForm.status} 
                        onChange={e => setDonorForm({ ...donorForm, status: e.target.value })}
                        style={{ height: '38px' }}
                      >
                        <option value="Eligible">Eligible</option>
                        <option value="Deferred">Deferred (Temporary)</option>
                        <option value="Ineligible">Ineligible</option>
                      </select>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Last Donation Date</label>
                      <input 
                        type="date" 
                        className="ecare-input" 
                        value={donorForm.last_donation_date} 
                        onChange={e => setDonorForm({ ...donorForm, last_donation_date: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddDonorModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem' }}>
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
                  <button onClick={() => setIsAddRequestModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
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

                  <div className="ecare-form-group">
                    <label className="ecare-label">Component Needed</label>
                    <select 
                      className="ecare-input" 
                      value={requestForm.component} 
                      onChange={e => setRequestForm({ ...requestForm, component: e.target.value })}
                      style={{ height: '38px' }}
                    >
                      <option value="Whole Blood">Whole Blood</option>
                      <option value="Packed RBC">Packed RBC</option>
                      <option value="Platelets">Platelets</option>
                      <option value="Fresh Frozen Plasma">Fresh Frozen Plasma</option>
                    </select>
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Clinical Indication / Notes</label>
                    <textarea 
                      rows={2}
                      className="ecare-input" 
                      placeholder="e.g. Major orthopedic surgery, hemoglobin 6.8 g/dL"
                      value={requestForm.notes} 
                      onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddRequestModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem', background: '#dc2626' }}>
                      Submit Requisition
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  )
}

export default BloodBankDashboard
