import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Drop, Heart, FirstAid, CheckCircle, Warning, 
  Calendar, Phone, Envelope, User, MapPin, X, ArrowRight, ShieldCheck, Clock
} from 'phosphor-react'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const COMPATIBILITY = {
  'O-': { givesTo: 'Everyone (Universal RBC)', receivesFrom: 'O-' },
  'O+': { givesTo: 'O+, A+, B+, AB+', receivesFrom: 'O+, O-' },
  'A-': { givesTo: 'A-, A+, AB-, AB+', receivesFrom: 'A-, O-' },
  'A+': { givesTo: 'A+, AB+', receivesFrom: 'A+, A-, O+, O-' },
  'B-': { givesTo: 'B-, B+, AB-, AB+', receivesFrom: 'B-, O-' },
  'B+': { givesTo: 'B+, AB+', receivesFrom: 'B+, B-, O+, O-' },
  'AB-': { givesTo: 'AB-, AB+', receivesFrom: 'AB-, A-, B-, O-' },
  'AB+': { givesTo: 'AB+ Only', receivesFrom: 'Everyone (Universal Recipient)' },
}

const BloodBankPublicStandalone = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL')

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
    <div style={{ fontFamily: 'inherit', color: '#1e293b', width: '100%', padding: '1rem 0 4rem' }}>
      {/* ─── Hero Header ─────────────────────────────────────────── */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '24px',
          padding: '3rem 2rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', opacity: 0.08, pointerEvents: 'none' }}>
          <Drop size={320} weight="fill" color="#ffffff" />
        </div>

        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '6px 14px', 
            borderRadius: '99px',
            color: '#fca5a5',
            fontSize: '0.8125rem',
            fontWeight: 700,
            marginBottom: '1rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            24/7 Live Blood Bank Network
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0 0 1rem', lineHeight: 1.2, color: '#ffffff' }}>
            Give the Gift of Life. <br />
            <span style={{ color: '#f87171' }}>Every Drop Counts.</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#94a3b8', margin: '0 0 2rem', lineHeight: 1.6, maxWidth: '640px' }}>
            Check verified real-time blood stock across hospital reserves, join our compassionate community of registered life savers, or request emergency units with immediate priority dispatch.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsDonorModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.5)',
                transition: 'all 0.2s'
              }}
            >
              <Heart size={20} weight="fill" />
              Register as Blood Donor
            </button>

            <button
              onClick={() => setIsRequestModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s'
              }}
            >
              <FirstAid size={20} weight="bold" />
              Request Emergency Blood
            </button>
          </div>
        </div>
      </div>

      {/* ─── Live Stock Section ──────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Drop size={22} weight="fill" color="#ef4444" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Real-Time Blood Availability
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              Verified medical reserves stored under regulated cold chain refrigeration
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Verified Stock:</span>
            <span style={{ 
              background: '#fee2e2', 
              color: '#dc2626', 
              padding: '6px 14px', 
              borderRadius: '99px', 
              fontSize: '0.9rem', 
              fontWeight: 800 
            }}>
              {totalAvailable} Units Available
            </span>
          </div>
        </div>

        {/* 8 Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {BLOOD_GROUPS.map((group) => {
            const count = stockByGroup[group] || 0
            const compat = COMPATIBILITY[group]
            const isCritical = count === 0
            const isLow = count > 0 && count <= 3
            const isSafe = count > 3

            let statusLabel = 'Adequate'
            let statusColor = '#10b981'
            let statusBg = '#dcfce7'
            if (isCritical) {
              statusLabel = 'Critical Need'
              statusColor = '#ef4444'
              statusBg = '#fee2e2'
            } else if (isLow) {
              statusLabel = 'Low Supply'
              statusColor = '#f59e0b'
              statusBg = '#fef3c7'
            }

            return (
              <motion.div
                key={group}
                whileHover={{ y: -4, boxShadow: '0 12px 25px -8px rgba(0,0,0,0.1)' }}
                style={{
                  background: '#ffffff',
                  border: isCritical ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 4px 6px -2px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 900, 
                    color: '#dc2626', 
                    lineHeight: 1,
                    letterSpacing: '-0.02em'
                  }}>
                    {group}
                  </div>
                  <span style={{ 
                    background: statusBg, 
                    color: statusColor, 
                    fontSize: '0.725rem', 
                    fontWeight: 800, 
                    padding: '4px 10px', 
                    borderRadius: '99px',
                    textTransform: 'uppercase'
                  }}>
                    {statusLabel}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>
                    {count} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Bags Available</span>
                  </div>
                  <div style={{ 
                    marginTop: '6px', 
                    width: '100%', 
                    height: '6px', 
                    background: '#f1f5f9', 
                    borderRadius: '99px', 
                    overflow: 'hidden' 
                  }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(100, (count / 10) * 100)}%`,
                        background: statusColor,
                        borderRadius: '99px',
                        transition: 'width 0.4s'
                      }} 
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong style={{ color: '#334155' }}>Can Give To:</strong> {compat.givesTo}
                  </div>
                  <div>
                    <strong style={{ color: '#334155' }}>Can Receive:</strong> {compat.receivesFrom}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => {
                      setDonorForm(prev => ({ ...prev, blood_group: group }))
                      setIsDonorModalOpen(true)
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Donate {group}
                  </button>
                  <button
                    onClick={() => {
                      setRequestForm(prev => ({ ...prev, blood_group: group }))
                      setIsRequestModalOpen(true)
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#dc2626',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Request
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ─── Donation FAQs & Criteria ────────────────────────────── */}
      <div style={{ 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '20px', 
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', marginBottom: '8px' }}>
            <ShieldCheck size={24} weight="fill" color="#10b981" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Who Can Safely Donate?</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Donating blood is safe, sterile, and takes only 15 minutes. Volunteers must be between 18-65 years old, weigh at least 50 kg (110 lbs), and be in good general health without acute infection.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', marginBottom: '8px' }}>
            <Clock size={24} weight="fill" color="#3b82f6" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Donation Frequency</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Whole blood can be donated every 56 days (8 weeks). Platelet donation can be performed up to 24 times a year. Your body replenishes blood volume within 24-48 hours.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', marginBottom: '8px' }}>
            <FirstAid size={24} weight="fill" color="#ef4444" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Emergency Dispatch Protocol</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            All emergency blood requests placed on this portal trigger immediate alerts to our clinical blood bank technician on duty for rapid cross-matching and courier transfer.
          </p>
        </div>
      </div>

      {/* ─── Modal 1: Register as Donor ──────────────────────────── */}
      <AnimatePresence>
        {isDonorModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDonorModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ 
                width: '100%', maxWidth: '540px', maxHeight: '90vh', position: 'relative', 
                background: '#ffffff', borderRadius: '20px',
                padding: 0, border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1
              }}
            >
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Register as Blood Donor</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Join our volunteer life saver network</p>
                  </div>
                </div>
                <button onClick={() => setIsDonorModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={20} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleDonorSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      value={donorForm.name}
                      onChange={e => setDonorForm({ ...donorForm, name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. +880 1700-000000"
                      value={donorForm.phone}
                      onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="donor@example.com"
                      value={donorForm.email}
                      onChange={e => setDonorForm({ ...donorForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Blood Group *</label>
                    <select 
                      value={donorForm.blood_group}
                      onChange={e => setDonorForm({ ...donorForm, blood_group: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#fff' }}
                    >
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Gender</label>
                    <select 
                      value={donorForm.gender}
                      onChange={e => setDonorForm({ ...donorForm, gender: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#fff' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Age (18-65)</label>
                    <input 
                      type="number" 
                      min="18"
                      max="65"
                      placeholder="e.g. 28"
                      value={donorForm.age}
                      onChange={e => setDonorForm({ ...donorForm, age: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Weight (kg) *</label>
                    <input 
                      type="number" 
                      required
                      min="40"
                      placeholder="Min 50"
                      value={donorForm.weight}
                      onChange={e => setDonorForm({ ...donorForm, weight: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>City / Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dhaka, Central"
                      value={donorForm.city}
                      onChange={e => setDonorForm({ ...donorForm, city: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Last Donation Date</label>
                    <input 
                      type="date" 
                      value={donorForm.last_donation_date}
                      onChange={e => setDonorForm({ ...donorForm, last_donation_date: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Health Screening Confirmation</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '6px' }}>
                    <input 
                      type="checkbox" 
                      checked={donorForm.has_tattoo === 'No'} 
                      onChange={e => setDonorForm({ ...donorForm, has_tattoo: e.target.checked ? 'No' : 'Yes' })}
                    />
                    I have not had any tattoos or body piercings in the last 6 months.
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={donorForm.has_illness === 'No'} 
                      onChange={e => setDonorForm({ ...donorForm, has_illness: e.target.checked ? 'No' : 'Yes' })}
                    />
                    I am not currently taking heavy antibiotics or suffering from transmissible illness.
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsDonorModalOpen(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingDonor}
                    style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {submittingDonor ? 'Registering...' : 'Register as Donor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal 2: Request Emergency Blood ────────────────────── */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ 
                width: '100%', maxWidth: '540px', maxHeight: '90vh', position: 'relative', 
                background: '#ffffff', borderRadius: '20px',
                padding: 0, border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1
              }}
            >
              <div style={{ padding: '1.25rem 1.5rem', background: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FirstAid size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>Emergency Blood Request</h3>
                    <p style={{ fontSize: '0.75rem', color: '#b91c1c', margin: 0 }}>Direct requisition to on-duty blood bank team</p>
                  </div>
                </div>
                <button onClick={() => setIsRequestModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={20} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleRequestSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Patient Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Patient Full Name"
                      value={requestForm.patient_name}
                      onChange={e => setRequestForm({ ...requestForm, patient_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
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
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Hospital / Clinic *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Hospital & Ward / Bed"
                      value={requestForm.hospital_name}
                      onChange={e => setRequestForm({ ...requestForm, hospital_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Requester (Doctor / Relative)</label>
                    <input 
                      type="text" 
                      placeholder="Your Name"
                      value={requestForm.requester_name}
                      onChange={e => setRequestForm({ ...requestForm, requester_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Blood Group *</label>
                    <select 
                      value={requestForm.blood_group}
                      onChange={e => setRequestForm({ ...requestForm, blood_group: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#fff' }}
                    >
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Component</label>
                    <select 
                      value={requestForm.component}
                      onChange={e => setRequestForm({ ...requestForm, component: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#fff' }}
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
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Urgency Level *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {['Emergency', 'Urgent', 'Normal'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setRequestForm({ ...requestForm, urgency: lvl })}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: requestForm.urgency === lvl ? '2px solid #ef4444' : '1px solid #cbd5e1',
                          background: requestForm.urgency === lvl ? '#fee2e2' : '#fff',
                          color: requestForm.urgency === lvl ? '#dc2626' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          cursor: 'pointer'
                        }}
                      >
                        {lvl === 'Emergency' ? '🚨 Immediate (STAT)' : lvl === 'Urgent' ? '⚡ Within 4 Hrs' : '📅 Routine'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Clinical Notes / Diagnosis</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Scheduled for orthopedic surgery at 3 PM, severe trauma, cross-match required"
                    value={requestForm.notes}
                    onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsRequestModalOpen(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingRequest}
                    style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {submittingRequest ? 'Submitting...' : 'Dispatch Request'}
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
