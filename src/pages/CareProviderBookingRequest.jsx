import React, { useState, useEffect, useMemo } from 'react'
import {
  User, MapPin, Calendar, Clock, Phone, Warning,
  CheckCircle, ArrowLeft, ShieldCheck, Heartbeat, NotePencil,
  Info, CalendarBlank, FileText, Check, Shield, Package, CaretDown
} from 'phosphor-react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import CustomDatePicker from '../components/CustomDatePicker'
import CustomTimePicker from '../components/CustomTimePicker'
import CustomSelect from '../components/CustomSelect'
import { formatPaymentMethod } from '../utils/formatters'

// Import care provider type images
import cgNurse from '../assets/cg_nurse.png'
import cgSeniorCare from '../assets/cg_senior_care.png'
import cgNanny from '../assets/cg_nanny.png'
import cgPhysiotherapist from '../assets/cg_physiotherapist.png'

/* ─── Responsive hook ────────────────────────────────────────────────────── */
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

/* ─── Styles & Design Tokens ─────────────────────────────────────────────── */
const C = {
  dark:   'var(--ecare-text-main, #1e293b)',
  border: '#e2e8f0',
  muted:  'var(--ecare-text-muted, #64748b)',
  faint:  '#94a3b8',
  bg:     '#f8fafc',
  cta:    'var(--ecare-primary, #1b3b2b)',
  green:  '#10b981',
  red:    '#ef4444',
  amber:  '#f59e0b',
}

const inputSt = {
  width: '100%',
  height: '42px',
  border: `1.5px solid ${C.border}`,
  borderRadius: '10px',
  padding: '0 12px',
  fontSize: '13px',
  color: C.dark,
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
}

const labelSt = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: C.muted,
  textTransform: 'uppercase',
  marginBottom: '6px',
}

const secHead = {
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: C.dark,
  margin: 0,
}

const ctaBtn = (active) => ({
  width: '100%',
  height: '46px',
  border: 'none',
  borderRadius: '12px',
  background: active ? 'var(--ecare-primary)' : '#cbd5e1',
  color: active ? '#fff' : '#94a3b8',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: active ? 'pointer' : 'not-allowed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'all 0.2s',
  boxShadow: active ? '0 4px 12px var(--ecare-primary-shadow)' : 'none',
})

const CareProviderBookingRequest = () => {
  const {
    user: currentUser,
    patients,
    careProviders,
    providerTypes,
    servicePricing,
    paymentGateways,
    addCareProviderBooking,
    addTransaction,
    setActivePage,
    addToCart
  } = useStore()

  const vw = useWindowWidth()
  const isMobile  = vw < 640
  const isTablet  = vw >= 640 && vw < 1024
  const isDesktop = vw >= 1024

  /* Find patient record */
  const patientRecord = useMemo(() => {
    if (!patients || !currentUser?.id) return null
    return patients.find(
      p => String(p.user_id) === String(currentUser.id) || p.email === currentUser.email
    )
  }, [patients, currentUser])

  /* Care Provider Types Definition (Loaded dynamically from store) */
  const careProviderTypesList = useMemo(() => {
    const types = (providerTypes && providerTypes.length > 0) 
      ? providerTypes 
      : ['Nurse', 'Senior care', 'Nanny', 'Physiotherapist'];
      
    return types.map(type => {
      const typeStr = (typeof type === 'object' && type !== null) ? (type.name || type.label || JSON.stringify(type)) : String(type);
      let image = cgNurse;
      const lower = typeStr.toLowerCase();
      if (lower.includes('nurse')) image = cgNurse;
      else if (lower.includes('senior')) image = cgSeniorCare;
      else if (lower.includes('nanny')) image = cgNanny;
      else if (lower.includes('physio')) image = cgPhysiotherapist;
      else image = cgNurse; // default fallback image
      return { 
        id: (typeof type === 'object' && type !== null) ? type.id : typeStr,
        name: typeStr, 
        image 
      };
    });
  }, [providerTypes])

  /* Filter Flow Selection State */
  const [selectedType, setSelectedType] = useState(null)
  const [selectedPackage, setSelectedPackage] = useState(null)

  /* Get selected type object from config to map packages */
  const selectedTypeObj = useMemo(() => {
    if (!selectedType) return null
    return (providerTypes || []).find(type => {
      const typeStr = (typeof type === 'object' && type !== null) ? (type.name || type.label) : String(type);
      return typeStr === selectedType;
    });
  }, [selectedType, providerTypes])

  /* Packages Definition with dynamic config from settings */
  const packages = useMemo(() => {
    let list = servicePricing || [];
    if (selectedTypeObj) {
      list = list.filter(p => String(p.typeId) === String(selectedTypeObj.id) || String(p.providerTypeId) === String(selectedTypeObj.id))
    }
    if (list.length > 0) {
      return list.map((p, idx) => ({
        id: p.id || `pricing-${idx}`,
        label: p.name && p.duration ? `${p.name} (${p.duration})` : (p.duration || 'Plan'),
        price: Number(p.price || 0)
      }))
    }
    return [
      { id: 'daily-12', label: 'Daily (12 Hours)', price: 1700 },
      { id: 'daily-24', label: 'Daily (24 Hours)', price: 2200 },
      { id: 'monthly-12', label: 'Monthly (12 Hours)', price: 30000 },
      { id: 'monthly-24-1', label: 'Monthly (24 Hours)', price: 50000 },
      { id: 'monthly-24-2', label: 'Monthly (24 Hours)', price: 75000 }
    ]
  }, [servicePricing, selectedTypeObj])

  const [activeView, setActiveView] = useState('list') // 'list' or 'single-booking'
  const [selectedProvider, setSelectedProvider] = useState(null)

  const [selectedProviderName, setSelectedProviderName] = useState('')
  const [selectedDuration, setSelectedDuration] = useState('')
  const [price, setPrice] = useState(0)
  
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0])
  const [bookingTime, setBookingTime] = useState('09:00 AM')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [agreed, setAgreed] = useState(false)

  /* UI state */
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  // Pre-fill location from patient record once loaded
  useEffect(() => {
    if (patientRecord && patientRecord.address && !location) {
      setLocation(patientRecord.address)
    }
  }, [patientRecord])

  // Handle care provider type change: reset selection
  const handleTypeSelect = (type) => {
    setSelectedType(type)
    setSelectedPackage(null)
    setSelectedProviderName('')
  }

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg)
    setSelectedDuration(pkg.label)
    setPrice(pkg.price)
    setSelectedProviderName('')
  }

  // Filter care providers matching selected type and selected package
  const filteredCaregivers = useMemo(() => {
    let list = careProviders || []

    // 1. Filter by selected type
    if (selectedType) {
      list = list.filter(cp => {
        const spec = (cp.type || cp.speciality || '').toLowerCase()
        const sel = selectedType.toLowerCase()
        return spec.includes(sel) || sel.includes(spec)
      })
    }

    // 2. Filter by selected package
    if (selectedPackage) {
      list = list.filter(cp => {
        if (!cp.packages) return false
        
        let cpPackages = []
        if (Array.isArray(cp.packages)) {
          cpPackages = cp.packages
        } else if (typeof cp.packages === 'string') {
          try {
            const parsed = JSON.parse(cp.packages)
            cpPackages = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            try {
              const cleaned = JSON.parse(JSON.parse(cp.packages))
              cpPackages = Array.isArray(cleaned) ? cleaned : []
            } catch (err) {
              cpPackages = []
            }
          }
        }

        return cpPackages.some(pkgId => String(pkgId) === String(selectedPackage.id))
      })
    }

    return list
  }, [careProviders, selectedType, selectedPackage])

  const gatewayOptions = useMemo(() => {
    return Object.entries(paymentGateways || {})
      .filter(([_, gateway]) => gateway.enabled)
      .map(([key, gateway]) => ({ value: formatPaymentMethod(gateway.name || key), label: formatPaymentMethod(gateway.name || key) }))
  }, [paymentGateways])

  const handleAddToCart = () => {
    if (!selectedType) {
      toast.error('Please select a care provider type first')
      return
    }
    if (!selectedPackage) {
      toast.error('Please select a service package first')
      return
    }

    const careItemId = `care_provider_${String(selectedType).toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedPackage.id}`
    addToCart({
      id: careItemId,
      type: 'care_provider',
      name: `${selectedType} Home Care Service`,
      price: Number(price || 0),
      providerType: selectedType,
      packageId: selectedPackage.id,
      providerName: selectedProviderName || ''
    })
    setActivePage('cart')
    if (!window.location.href.includes('wp-admin') && !window.location.href.includes('admin.php')) {
      window.location.href = (window.ecareConfig?.siteUrl || '') + '/ecare-cart'
    }
  }

  const handleAddToCartFromSingle = () => {
    if (!selectedType) {
      toast.error('Please select a care provider type first')
      return
    }
    if (!selectedPackage) {
      toast.error('Please select a service package first')
      return
    }
    if (!bookingDate) {
      toast.error('Please select a booking date')
      return
    }
    if (!location.trim()) {
      toast.error('Please provide a booking location/address')
      return
    }

    const careItemId = `care_provider_${String(selectedType).toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedPackage.id}`
    addToCart({
      id: careItemId,
      type: 'care_provider',
      name: `${selectedType} Home Care Service`,
      price: Number(price || 0),
      providerType: selectedType,
      packageId: selectedPackage.id,
      providerName: selectedProviderName || '',
      bookingDate: bookingDate,
      bookingTime: bookingTime,
      location: location,
      notes: notes
    })
    
    toast.success('Care booking added to cart!')
    setActivePage('cart')
    if (!window.location.href.includes('wp-admin') && !window.location.href.includes('admin.php')) {
      window.location.href = (window.ecareConfig?.siteUrl || '') + '/ecare-cart'
    }
  }

  /* ── Success screen ───────────────────────────────────────────────────── */
  if (bookingSuccess) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%', background: '#fff', padding: '2.5rem', borderRadius: '16px', border: `1px solid ${C.border}`, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--ecare-primary)' }}>
            <CheckCircle size={40} weight="fill" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.dark, margin: '0 0 0.5rem' }}>
            Care Request Scheduled!
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.6, margin: '0 0 1.5rem', fontSize: '14px' }}>
            Your home care provider booking request has been successfully recorded. An invoice has been generated. Our coordination team will follow up shortly.
          </p>
          <div style={{
            display: 'inline-block',
            padding: '8px 18px',
            background: 'var(--ecare-primary-bg)',
            border: `1px solid var(--ecare-primary-border)`,
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--ecare-primary)',
            textTransform: 'uppercase',
            marginBottom: '2rem'
          }}>
            Booking Reference: #CAR-{String(bookingRef).slice(0, 8).toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActivePage('care-bookings')}
              style={{ background: 'var(--ecare-primary)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 12px var(--ecare-primary-shadow)' }}
            >
              View My Bookings
            </button>
            <button
              onClick={() => setActivePage('payment-invoices')}
              style={{ background: '#fff', color: C.dark, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px 24px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              View Invoices
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 'var(--ecare-container-width, 1200px)',
      margin: '0 auto',
      padding: isMobile ? '1rem' : '1.25rem 0',
      boxSizing: 'border-box',
      fontFamily: 'inherit'
    }}>
      {activeView === 'list' ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
            
            {/* Care Provider Type Selector */}
            <div>
              <h3 style={{ ...secHead, fontSize: '12px', marginBottom: '1rem', color: 'var(--ecare-primary)' }}>Select Care Provider Type</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '1rem' }}>
                {careProviderTypesList.map(t => {
                  const isSelected = selectedType === t.name
                  return (
                    <div
                      key={t.name}
                      onClick={() => handleTypeSelect(t.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid var(--ecare-primary)' : '1.5px solid #e2e8f0',
                        background: isSelected ? 'var(--ecare-primary-bg)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 12px var(--ecare-primary-shadow)' : 'none'
                      }}
                    >
                      <img
                        src={t.image}
                        alt={t.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{t.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {selectedType && (
              <>
                <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: 0 }} />

                {/* Package Selector */}
                <div>
                  <h3 style={{ ...secHead, fontSize: '12px', marginBottom: '1rem', color: 'var(--ecare-primary)' }}>Select Package</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '0.75rem' }}>
                    {packages.map(p => {
                      const isSelected = selectedPackage?.id === p.id
                      return (
                        <div
                          key={p.id}
                          onClick={() => handlePackageSelect(p)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: isSelected ? '1.5px solid var(--ecare-primary)' : '1.5px solid #e2e8f0',
                            background: isSelected ? 'var(--ecare-primary-bg)' : '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minHeight: '72px',
                            boxShadow: isSelected ? '0 4px 12px var(--ecare-primary-shadow)' : 'none'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>{p.label}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                            <span style={{ fontSize: '9px', color: '#94a3b8' }}>Total</span>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ecare-primary)' }}>৳{p.price}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {selectedType && selectedPackage && (
              <>
                <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: 0 }} />

                {/* Available Care Providers Matching Filter */}
                <div>
                  <h3 style={{ ...secHead, fontSize: '12px', marginBottom: '1rem', color: 'var(--ecare-primary)' }}>Select Care Provider</h3>
                  {filteredCaregivers.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {filteredCaregivers.map(cg => {
                        const bioWords = (cg.bio || cg.description || '').trim().split(/\s+/).filter(Boolean)
                        const expertise = bioWords.length > 0
                          ? bioWords.slice(0, 6).join(' ') + (bioWords.length > 6 ? '...' : '')
                          : null
                        const expVal = String(cg.exp || cg.experience || '3+')
                        const expDisplay = expVal.toLowerCase().includes('year') ? expVal : `${expVal} Years`
                        return (
                          <div
                            key={cg.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              borderRadius: '12px',
                              border: '1.5px solid #e2e8f0',
                              background: '#fff',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                              overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ecare-primary)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0' }}
                          >
                            <div style={{ padding: '14px 14px 10px', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <img
                                  src={cg.photo || cg.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cg.name}`}
                                  alt={cg.name}
                                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', background: '#f1f5f9', flexShrink: 0 }}
                                />
                                <div style={{ minWidth: 0 }}>
                                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cg.name}</h4>
                                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--ecare-primary)', fontWeight: 600 }}>{cg.type || cg.speciality || 'Care Provider'}</p>
                                </div>
                              </div>
                              {expertise && (
                                <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#64748b', lineHeight: 1.4, fontStyle: 'italic' }}>"{expertise}"</p>
                              )}
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', borderRadius: '6px', padding: '3px 8px' }}>
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Exp:</span>
                                <span style={{ fontSize: '10px', color: '#1e293b', fontWeight: 700 }}>{expDisplay}</span>
                              </div>
                            </div>
                            <div style={{ padding: '0 14px 12px' }}>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation()
                                  setSelectedProviderName(cg.name)
                                  setSelectedProvider(cg)
                                  setActiveView('single-booking')
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'var(--ecare-primary)'
                                  e.currentTarget.style.color = '#fff'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'var(--ecare-primary-bg)'
                                  e.currentTarget.style.color = 'var(--ecare-primary)'
                                }}
                                style={{
                                  width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
                                  background: 'var(--ecare-primary-bg)',
                                  color: 'var(--ecare-primary)',
                                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                  letterSpacing: '0.04em', transition: 'all 0.2s'
                                }}
                              >
                                Book Now
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <Info size={32} color="#64748b" style={{ marginBottom: '8px', opacity: 0.7 }} />
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No {selectedType}s are registered or active right now. You can proceed with "Any Available Provider".</p>
                    </div>
                  )}
                </div>
              </>
            )}
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header & Back Button */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => {
                setActiveView('list')
                setSelectedProvider(null)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--ecare-primary)',
                fontSize: '12px',
                fontWeight: 700,
                padding: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <ArrowLeft size={16} weight="bold" />
              Back to Care Providers
            </button>
          </div>

          {/* Profile & Scheduling Split Pane */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1.2fr 1.8fr' : '1fr',
            gap: '1.5rem',
            alignItems: 'start'
          }}>
            {/* Left Side: Profile Information */}
            <div style={{
              background: '#fff',
              border: `1.5px solid ${C.border}`,
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={selectedProvider?.photo || selectedProvider?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProvider?.name}`}
                    alt={selectedProvider?.name}
                    style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', background: '#f1f5f9', border: '3px solid var(--ecare-primary-border)' }}
                  />
                  <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '14px', height: '14px', borderRadius: '50%', background: C.green, border: '2.5px solid #fff' }} />
                </div>
                <h3 style={{ margin: '12px 0 4px', fontSize: '18px', fontWeight: 800, color: C.dark }}>{selectedProvider?.name}</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', padding: '4px 10px', borderRadius: '20px' }}>
                    {selectedProvider?.type || selectedProvider?.speciality || 'Care Provider'}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '20px' }}>
                    {(selectedProvider?.exp || selectedProvider?.experience || '3').toString().toLowerCase().includes('year') ? (selectedProvider?.exp || selectedProvider?.experience) : `${selectedProvider?.exp || selectedProvider?.experience || '3'} Years`} Exp
                  </span>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1.25rem' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Professional Summary</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{selectedProvider?.bio || selectedProvider?.description || 'Experienced and highly trained professional dedicated to providing compassionate, high-quality home care services.'}"
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem', background: 'var(--ecare-primary-bg)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ecare-primary)' }}>
                  <ShieldCheck size={18} weight="bold" />
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Verified Provider</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                  This provider is background checked, license-verified, and meets our strict service quality standards.
                </div>
              </div>
            </div>

            {/* Right Side: Scheduling Form */}
            <div style={{
              background: '#fff',
              border: `1.5px solid ${C.border}`,
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ ...secHead, fontSize: '13px', marginBottom: '1.25rem', color: 'var(--ecare-primary)' }}>Enter Booking Details</h3>

              {/* Package Summary */}
              <div style={{
                background: '#f8fafc',
                border: `1.5px solid ${C.border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected Package</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: C.dark, marginTop: '2px' }}>{selectedPackage?.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Rate</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ecare-primary)', marginTop: '2px' }}>৳{selectedPackage?.price}</div>
                </div>
              </div>

              {/* Date & Time Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelSt}>Booking Date</label>
                  <CustomDatePicker
                    value={bookingDate}
                    onChange={(val) => setBookingDate(val)}
                  />
                </div>
                <div>
                  <label style={labelSt}>Start Time</label>
                  <CustomTimePicker
                    value={bookingTime}
                    onChange={(val) => setBookingTime(val)}
                  />
                </div>
              </div>

              {/* Location Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelSt}>Location / Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} color={C.muted} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter full home address"
                    style={{ ...inputSt, paddingLeft: '36px' }}
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelSt}>Special Notes / Requests</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific requests or requirements (e.g. language preferences, diet instructions)"
                  style={{ ...inputSt, height: '80px', padding: '10px 12px', resize: 'none' }}
                />
              </div>
              <button
                disabled={isSubmitting}
                onClick={handleAddToCartFromSingle}
                style={ctaBtn(!isSubmitting)}
              >
                {isSubmitting ? 'Processing...' : `Confirm & Go to Checkout`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CareProviderBookingRequest
