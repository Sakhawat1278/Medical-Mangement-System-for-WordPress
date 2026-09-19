import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Drop, Heart, FirstAid, CheckCircle, Warning, 
  Calendar, Phone, Envelope, User, MapPin, X, ArrowRight, ShieldCheck, Clock, Check
} from 'phosphor-react'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const COMPATIBILITY = {
  'O-': { givesTo: 'Universal Red Cell Donor (Everyone)', receivesFrom: 'O- only' },
  'O+': { givesTo: 'O+, A+, B+, AB+', receivesFrom: 'O+, O-' },
  'A-': { givesTo: 'A-, A+, AB-, AB+', receivesFrom: 'A-, O-' },
  'A+': { givesTo: 'A+, AB+', receivesFrom: 'A+, A-, O+, O-' },
  'B-': { givesTo: 'B-, B+, AB-, AB+', receivesFrom: 'B-, O-' },
  'B+': { givesTo: 'B+, AB+', receivesFrom: 'B+, B-, O+, O-' },
  'AB-': { givesTo: 'AB-, AB+', receivesFrom: 'AB-, A-, B-, O-' },
  'AB+': { givesTo: 'AB+ only', receivesFrom: 'Universal Recipient (All groups)' },
}

const BloodBankPublicStandalone = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [activeGroupFilter, setActiveGroupFilter] = useState('ALL')

  // Form states
  const [donorForm, setDonorForm] = useState({
    name: '',
    phone: '',
    email: '',
    blood_group: 'O+',
    gender: 'Male',
    age: '',
    weight: '',
    city: '',
    last_donation_date: '',
    has_tattoo: 'No',
    has_illness: 'No'
  })

  const [requestForm, setRequestForm] = useState({
    requester_name: '',
    patient_name: '',
    hospital_name: '',
    phone: '',
    blood_group: 'O+',
    component: 'Whole Blood',
    units_required: 1,
    urgency: 'Emergency',
    notes: ''
  })

  const [submittingDonor, setSubmittingDonor] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Fetch live inventory
  const fetchStock = async () => {
    try {
      const baseUrl = window.ecareConfig?.apiUrl || '/wp-json/ecare/v1/'
      const res = await fetch(`${baseUrl}blood-inventory`, {
        headers: {
          'X-WP-Nonce': window.ecareConfig?.nonce || ''
        }
      })
      if (res.ok) {
        const data = await res.json()
        setInventory(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.warn('Failed to fetch blood stock', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStock()
  }, [])

  // Stock counts by blood group
  const stockByGroup = useMemo(() => {
    const counts = {}
    BLOOD_GROUPS.forEach(g => counts[g] = 0)
    inventory.forEach(bag => {
      if (bag.status === 'Available' && bag.blood_group) {
        counts[bag.blood_group] = (counts[bag.blood_group] || 0) + 1
      }
    })
    return counts
  }, [inventory])

  const totalAvailable = useMemo(() => {
    return Object.values(stockByGroup).reduce((a, b) => a + b, 0)
  }, [stockByGroup])

  const filteredGroups = useMemo(() => {
    if (activeGroupFilter === 'ALL') return BLOOD_GROUPS
    return BLOOD_GROUPS.filter(g => g.startsWith(activeGroupFilter))
  }, [activeGroupFilter])

  const handleDonorSubmit = async (e) => {
    e.preventDefault()
    if (!donorForm.name || !donorForm.phone || !donorForm.blood_group) {
      toast.error('Please complete all required fields')
      return
    }

    if (Number(donorForm.weight) < 50) {
      toast.error('Donor weight must be at least 50 kg for safe donation.')
      return
    }

    setSubmittingDonor(true)
    try {
      const baseUrl = window.ecareConfig?.apiUrl || '/wp-json/ecare/v1/'
      const res = await fetch(`${baseUrl}blood-donors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.ecareConfig?.nonce || ''
        },
        body: JSON.stringify({
          ...donorForm,
          contact_number: donorForm.phone,
          health_status: donorForm.has_illness === 'Yes' ? 'Pending Review' : 'Healthy',
          status: 'Eligible',
          created_at: new Date().toISOString()
        })
      })

      if (res.ok) {
        toast.success('Thank you! You are successfully registered as a volunteer donor.')
        setIsDonorModalOpen(false)
        setDonorForm({
          name: '', phone: '', email: '', blood_group: 'O+', gender: 'Male', age: '', weight: '', city: '', last_donation_date: '', has_tattoo: 'No', has_illness: 'No'
        })
      } else {
        toast.error('Registration failed. Please try again or contact the clinic.')
      }
    } catch (err) {
      toast.error('Network error during registration')
    } finally {
      setSubmittingDonor(false)
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    if (!requestForm.patient_name || !requestForm.phone || !requestForm.hospital_name) {
      toast.error('Please complete patient and hospital details')
      return
    }

    setSubmittingRequest(true)
    try {
      const baseUrl = window.ecareConfig?.apiUrl || '/wp-json/ecare/v1/'
      const res = await fetch(`${baseUrl}blood-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.ecareConfig?.nonce || ''
        },
        body: JSON.stringify({
          requester_name: requestForm.requester_name || requestForm.patient_name,
          patient_name: requestForm.patient_name,
          hospital_name: requestForm.hospital_name,
          contact_phone: requestForm.phone,
          blood_group: requestForm.blood_group,
          component: requestForm.component,
          units_required: Number(requestForm.units_required) || 1,
          urgency: requestForm.urgency,
          notes: requestForm.notes,
          status: 'Pending',
          request_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        })
      })

      if (res.ok) {
        toast.success('Emergency Blood Request dispatched! Our blood bank staff will contact you immediately.')
        setIsRequestModalOpen(false)
        setRequestForm({
          requester_name: '', patient_name: '', hospital_name: '', phone: '', blood_group: 'O+', component: 'Whole Blood', units_required: 1, urgency: 'Emergency', notes: ''
        })
      } else {
        toast.error('Failed to submit request. Please call our emergency helpline.')
      }
    } catch (err) {
      toast.error('Network error. Please call clinic directly.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <div style={{ 
      fontFamily: 'inherit', 
      color: '#0f172a', 
      width: '100%', 
      boxSizing: 'border-box',
      padding: '1.25rem 0'
    }}>
      {/* ─── Clean Medical Hero Section (Consistent with E-CARE templates) ─── */}
      <div 
        style={{ 
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: 'clamp(1.5rem, 3vw, 2.5rem)',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '680px' }}>
            {/* Clinical tag */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#fee2e2', 
              color: '#dc2626',
              padding: '3px 10px', 
              borderRadius: '99px',
              fontSize: '0.725rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.875rem'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
              24/7 Verified Blood Bank & Requisition Portal
            </div>

            <h1 style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 2.15rem)', 
              fontWeight: 800, 
              color: '#0f172a', 
              margin: '0 0 0.75rem', 
              lineHeight: 1.25,
              letterSpacing: '-0.02em'
            }}>
              Blood Bank Inventory & Emergency Transfusion
            </h1>

            <p style={{ 
              fontSize: '0.9375rem', 
              color: '#64748b', 
              margin: '0 0 1.5rem', 
              lineHeight: 1.6 
            }}>
              Check verified clinical reserves stored under certified cold-chain refrigeration, join our compassionate network of volunteer donors, or dispatch emergency hospital requisitions with priority clearance.
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsDonorModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <Heart size={16} weight="fill" />
                Register as Blood Donor
              </button>

              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <FirstAid size={16} weight="bold" color="#dc2626" />
                Request Emergency Blood
              </button>
            </div>
          </div>

          {/* Quick Reserve Stat Card */}
          <div style={{ 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '1.25rem 1.5rem',
            minWidth: '220px',
            flexShrink: 0
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Blood Stock
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', marginTop: '4px', lineHeight: 1 }}>
              {totalAvailable} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#dc2626' }}>Bags</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={14} weight="bold" /> Tested & Available
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '10px', paddingTop: '10px', fontSize: '0.7rem', color: '#94a3b8' }}>
              Storage Temp: 2°C to 6°C
            </div>
          </div>
        </div>

        {/* Trust Badges Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
            <ShieldCheck size={18} weight="fill" color="#16a34a" />
            <span>100% Serology Cleared</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
            <Clock size={18} weight="fill" color="#2563eb" />
            <span>Instant Emergency Dispatch</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
            <Heart size={18} weight="fill" color="#dc2626" />
            <span>Voluntary & Safe Donation</span>
          </div>
        </div>
      </div>

      {/* ─── Blood Inventory Section ─────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Live Blood Group Availability
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
              Real-time inventory levels categorized by ABO and Rhesus classification
            </p>
          </div>

          {/* Clean Segmented Filter */}
          <div style={{ 
            display: 'flex', 
            background: '#f1f5f9', 
            padding: '3px', 
            borderRadius: '8px',
            gap: '2px'
          }}>
            {['ALL', 'O', 'A', 'B', 'AB'].map(filterKey => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setActiveGroupFilter(filterKey)}
                style={{
                  border: 'none',
                  background: activeGroupFilter === filterKey ? '#ffffff' : 'transparent',
                  color: activeGroupFilter === filterKey ? '#0f172a' : '#64748b',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: activeGroupFilter === filterKey ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {filterKey === 'ALL' ? 'All Groups' : `${filterKey} Types`}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '1rem' }}>
          {filteredGroups.map(group => {
            const count = stockByGroup[group] || 0
            const compat = COMPATIBILITY[group]
            const isCritical = count === 0
            const isLow = count > 0 && count <= 2
            const isAdequate = count > 2

            let statusColor = '#16a34a'
            let statusBg = '#dcfce7'
            let statusText = 'Adequate'

            if (isCritical) {
              statusColor = '#dc2626'
              statusBg = '#fee2e2'
              statusText = 'Shortage'
            } else if (isLow) {
              statusColor = '#d97706'
              statusBg = '#fef3c7'
              statusText = 'Low Reserve'
            }

            return (
              <div 
                key={group}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '10px', 
                    background: '#fee2e2', color: '#dc2626',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', fontWeight: 900
                  }}>
                    {group}
                  </div>
                  <span style={{ 
                    background: statusBg, 
                    color: statusColor, 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    padding: '3px 8px', 
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {statusText}
                  </span>
                </div>

                {/* Count */}
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
                    {count} <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Bags Available</span>
                  </div>
                  <div style={{ height: '5px', width: '100%', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', marginTop: '6px' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (count / 8) * 100)}%`, background: statusColor, borderRadius: '99px' }} />
                  </div>
                </div>

                {/* Compatibility */}
                <div style={{ fontSize: '0.725rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <div style={{ marginBottom: '3px' }}>
                    <strong style={{ color: '#334155' }}>Gives To:</strong> {compat.givesTo}
                  </div>
                  <div>
                    <strong style={{ color: '#334155' }}>Receives From:</strong> {compat.receivesFrom}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDonorForm(prev => ({ ...prev, blood_group: group }))
                      setIsDonorModalOpen(true)
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    Donate {group}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestForm(prev => ({ ...prev, blood_group: group }))
                      setIsRequestModalOpen(true)
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#dc2626',
                      cursor: 'pointer'
                    }}
                  >
                    Request
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Clinical FAQs & Donation Guidelines ───────────────────── */}
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '16px', 
        padding: '1.75rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={20} weight="fill" color="#16a34a" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Who Can Donate?</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Volunteers aged 18 to 65 weighing at least 50 kg (110 lbs) in good general health. A quick mini-physical and hemoglobin check is conducted prior to collection.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Clock size={20} weight="fill" color="#2563eb" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Donation Frequency</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Whole blood may be safely donated every 56 days (8 weeks). Your body naturally replenishes fluids within 24 to 48 hours, and red cells within a few weeks.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FirstAid size={20} weight="fill" color="#dc2626" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Emergency Transfusions</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Urgent hospital requests receive priority processing with immediate cross-matching and specialized cold courier delivery directly to clinical ICUs.
          </p>
        </div>
      </div>

      {/* ─── MODAL 1: REGISTER AS DONOR ──────────────────────────── */}
      <AnimatePresence>
        {isDonorModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDonorModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              style={{ 
                width: '100%', maxWidth: '500px', maxHeight: '90vh', position: 'relative', 
                background: '#ffffff', borderRadius: '16px',
                padding: 0, border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1
              }}
            >
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={18} weight="fill" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Register as Volunteer Donor</h3>
                    <p style={{ fontSize: '0.725rem', color: '#64748b', margin: 0 }}>Enroll in our verified donor directory</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsDonorModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={18} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleDonorSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      value={donorForm.name}
                      onChange={e => setDonorForm({ ...donorForm, name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+880 1700-000000"
                      value={donorForm.phone}
                      onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="donor@example.com"
                      value={donorForm.email}
                      onChange={e => setDonorForm({ ...donorForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Blood Group *</label>
                    <select 
                      value={donorForm.blood_group}
                      onChange={e => setDonorForm({ ...donorForm, blood_group: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', background: '#fff' }}
                    >
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Gender</label>
                    <select 
                      value={donorForm.gender}
                      onChange={e => setDonorForm({ ...donorForm, gender: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', background: '#fff' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Age (18-65)</label>
                    <input 
                      type="number" 
                      min="18"
                      max="65"
                      placeholder="28"
                      value={donorForm.age}
                      onChange={e => setDonorForm({ ...donorForm, age: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Weight (kg) *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Min 50"
                      value={donorForm.weight}
                      onChange={e => setDonorForm({ ...donorForm, weight: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Location / City</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Central City"
                      value={donorForm.city}
                      onChange={e => setDonorForm({ ...donorForm, city: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Last Donation Date</label>
                    <input 
                      type="date" 
                      value={donorForm.last_donation_date}
                      onChange={e => setDonorForm({ ...donorForm, last_donation_date: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsDonorModalOpen(false)}
                    style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingDonor}
                    style={{ flex: 2, padding: '9px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}
                  >
                    {submittingDonor ? 'Enrolling...' : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: REQUEST EMERGENCY BLOOD ────────────────────── */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              style={{ 
                width: '100%', maxWidth: '500px', maxHeight: '90vh', position: 'relative', 
                background: '#ffffff', borderRadius: '16px',
                padding: 0, border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1
              }}
            >
              <div style={{ padding: '1.25rem 1.5rem', background: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FirstAid size={18} weight="fill" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>Emergency Blood Request</h3>
                    <p style={{ fontSize: '0.725rem', color: '#b91c1c', margin: 0 }}>Requisition to on-duty blood bank laboratory</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsRequestModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={18} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleRequestSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Patient Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Patient Full Name"
                      value={requestForm.patient_name}
                      onChange={e => setRequestForm({ ...requestForm, patient_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Contact Phone *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="Attendant Phone"
                      value={requestForm.phone}
                      onChange={e => setRequestForm({ ...requestForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Hospital / Clinic *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. City Hospital, Bed 12"
                      value={requestForm.hospital_name}
                      onChange={e => setRequestForm({ ...requestForm, hospital_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Requester (Doctor / Relative)</label>
                    <input 
                      type="text" 
                      placeholder="Your Name"
                      value={requestForm.requester_name}
                      onChange={e => setRequestForm({ ...requestForm, requester_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Blood Group *</label>
                    <select 
                      value={requestForm.blood_group}
                      onChange={e => setRequestForm({ ...requestForm, blood_group: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', background: '#fff' }}
                    >
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Component</label>
                    <select 
                      value={requestForm.component}
                      onChange={e => setRequestForm({ ...requestForm, component: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', background: '#fff' }}
                    >
                      <option value="Whole Blood">Whole Blood</option>
                      <option value="Packed RBC">Packed RBC</option>
                      <option value="Platelets">Platelets</option>
                      <option value="Fresh Frozen Plasma">Plasma (FFP)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Units (Bags)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="10"
                      value={requestForm.units_required}
                      onChange={e => setRequestForm({ ...requestForm, units_required: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Urgency Priority *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    {['Emergency', 'Urgent', 'Normal'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setRequestForm({ ...requestForm, urgency: lvl })}
                        style={{
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: requestForm.urgency === lvl ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                          background: requestForm.urgency === lvl ? '#fee2e2' : '#ffffff',
                          color: requestForm.urgency === lvl ? '#991b1b' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {lvl === 'Emergency' ? '🚨 STAT (Immediate)' : lvl === 'Urgent' ? '⚡ Within 4 Hrs' : '📅 Routine'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Diagnosis / Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Scheduled for emergency surgery, cross-match required"
                    value={requestForm.notes}
                    onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsRequestModalOpen(false)}
                    style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingRequest}
                    style={{ flex: 2, padding: '9px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}
                  >
                    {submittingRequest ? 'Dispatching...' : 'Dispatch Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BloodBankPublicStandalone
