import React, { useState, useEffect, useMemo } from 'react'
import {
  MapPin, Navigation, Clock, Phone, AlertTriangle,
  CheckCircle, Users, Timer, Activity, Van, Ambulance, Snowflake
} from 'lucide-react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'

/* ─── Design tokens (mirrors InstantBooking style) ───────────────────────── */
const C = {
  dark:   '#1a1a2e',
  border: '#e5e7eb',
  muted:  '#6b7280',
  faint:  '#9ca3af',
  bg:     '#f9fafb',
  cta:    '#1a3333',
  green:  '#16a34a',
  red:    '#e11d48',
}

const inputSt = {
  width: '100%', height: '40px',
  border: `1px solid ${C.border}`, borderRadius: '4px',
  padding: '0 12px', fontSize: '13px', color: C.dark,
  outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: 'inherit',
}
const iconInputSt = {
  ...inputSt,
  paddingLeft: '36px',
}
const labelSt = {
  display: 'block', fontSize: '10px', fontWeight: 700,
  letterSpacing: '0.08em', color: C.muted,
  textTransform: 'uppercase', marginBottom: '6px',
}
const secHead = {
  fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: C.dark, margin: 0,
}
const ctaBtn = (active) => ({
  width: '100%', height: '44px', border: 'none', borderRadius: '4px',
  background: active ? C.cta : C.border,
  color: active ? '#fff' : C.faint,
  fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: active ? 'pointer' : 'not-allowed',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  transition: 'background 0.2s',
})

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

/* ─── Icon input wrapper ─────────────────────────────────────────────────── */
const IconInput = ({ icon: Icon, iconColor = C.muted, ...props }) => (
  <div style={{ position: 'relative' }}>
    <Icon
      size={15}
      color={iconColor}
      style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
    />
    <input style={iconInputSt} {...props} />
  </div>
)

/* ─── Main component ─────────────────────────────────────────────────────── */
const AmbulanceRequest = () => {
  const {
    user: currentUser,
    patients,
    addAmbulanceBooking,
    ambulancePricing,
    setActivePage,
  } = useStore()

  const termsLink = window.ecareConfig?.settings?.termsUrl || window.ecareConfig?.termsUrl || '#'
  const privacyLink = window.ecareConfig?.settings?.privacyUrl || window.ecareConfig?.privacyUrl || '#'

  const vw = useWindowWidth()
  const isMobile  = vw < 640
  const isTablet  = vw >= 640 && vw < 1024
  const isDesktop = vw >= 1024

  /* Pre-fill from patient record */
  const patientRecord = useMemo(() => {
    if (!patients || !currentUser?.id) return null
    return patients.find(
      p => String(p.user_id) === String(currentUser.id) || p.email === currentUser.email
    )
  }, [patients, currentUser])

  /* form state */
  const [ambulanceType, setAmbulanceType] = useState('Non-AC')
  const [location,      setLocation]      = useState('')
  const [destination,   setDestination]   = useState('')
  const [dispatchTime,  setDispatchTime]  = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  })
  const [phone,         setPhone]         = useState('')
  const [notes,         setNotes]         = useState('')
  const [priority,      setPriority]      = useState('Normal')
  const [agreed,        setAgreed]        = useState(false)

  /* UI state */
  const [isSubmitting,   setIsSubmitting]   = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingRef,     setBookingRef]     = useState('')

  /* Pre-fill phone & address once patient record loads */
  useEffect(() => {
    if (patientRecord) {
      if (!phone)    setPhone(patientRecord.phone    || '')
      if (!location) setLocation(patientRecord.address || '')
    }
  }, [patientRecord])

  /* Ambulance type options */
  const typeOptions = [
    {
      id: 'Non-AC',
      label: 'Standard (Non-AC)',
      desc: 'Regular non-AC transport',
      Icon: Van,
      price: ambulancePricing?.['Non-AC'] || 2500,
    },
    {
      id: 'ICU',
      label: 'ICU (AC)',
      desc: 'Life support with AC',
      Icon: Ambulance,
      price: ambulancePricing?.['ICU'] || 5000,
    },
    {
      id: 'Freezer',
      label: 'Freezer Van',
      desc: 'Mortuary / cooler van',
      Icon: Snowflake,
      price: ambulancePricing?.['Freezer'] || 6000,
    },
  ]

  /* Highlight stats */
  const stats = [
    { Icon: Timer,      iconColor: C.green,     iconBg: '#dcfce7', stat: '24/7',  desc: 'Always Available'  },
    { Icon: Users,      iconColor: '#4f6ef7',   iconBg: '#eff2fe', stat: '100%',  desc: 'Trained Crew'      },
    { Icon: Activity,   iconColor: C.red,       iconBg: '#ffe4e6', stat: 'Oxygen', desc: 'Oxygen Equipped'   },
  ]

  const handleSubmit = async () => {
    if (!agreed) { toast.error('Please agree to the Terms and Privacy Policy'); return }
    if (!location.trim())     { toast.error('Pickup location is required'); return }
    if (!destination.trim())  { toast.error('Destination is required'); return }
    if (!phone.trim())        { toast.error('Contact phone is required'); return }
    if (!dispatchTime.trim()) { toast.error('Dispatch time is required'); return }

    setIsSubmitting(true)
    try {
      const ref = `DIS-${Math.floor(1000 + Math.random() * 9000)}`
      const payload = {
        id:             ref,
        patient:        currentUser?.name || 'Patient',
        patient_user_id: currentUser?.id  || null,
        type:           ambulanceType,
        location,
        dest:           destination,
        time:           dispatchTime,
        phone,
        priority,
        notes,
        status:         'Pending',
        price:          ambulancePricing?.[ambulanceType] || 0,
        issuedBy:       currentUser?.name || 'Patient',
      }

      const res = await addAmbulanceBooking(payload)
      if (res) {
        setBookingRef(ref)
        setBookingSuccess(true)
      } else {
        toast.error('Failed to submit request. Please try again.')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ── Success screen ───────────────────────────────────────────────────── */
  if (bookingSuccess) {
    const portalUrl   = window.ecareConfig?.portalUrl || (window.location.origin + '/ecare-portal')
    const sep         = portalUrl.includes('?') ? '&' : '?'
    const bookingsUrl = portalUrl + sep + 'ecare_page=ambulance-bookings'
    const dashUrl     = portalUrl + sep + 'ecare_page=dashboard'

    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '460px', width: '100%' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={36} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.dark, margin: '0 0 0.5rem' }}>
            Ambulance Requested!
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.6, margin: '0 0 1.5rem', fontSize: '13px' }}>
            Your transport request has been logged and assigned. Our dispatch unit will call you shortly on the provided phone number.
          </p>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            color: C.cta,
            letterSpacing: '0.08em',
            marginBottom: '2rem'
          }}>
            Reference: {bookingRef}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { window.location.href = bookingsUrl }}
              style={{ background: C.cta, color: '#fff', border: 'none', borderRadius: '4px', padding: '11px 28px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              View My Requests
            </button>
            <button
              onClick={() => { window.location.href = dashUrl }}
              style={{ background: '#fff', color: C.dark, border: `1px solid ${C.border}`, borderRadius: '4px', padding: '11px 28px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Main form ────────────────────────────────────────────────────────── */
  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: isMobile ? '1rem' : '1.25rem 0', fontFamily: 'inherit' }}>

      {/* ─── Mobile: stats ABOVE form ─── */}
      {isMobile && (
        <>
          <p style={{ ...secHead, fontSize: '11px', marginBottom: '12px' }}>Why Choose E-CARE Ambulance?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {stats.map(({ Icon, iconColor, iconBg, stat, desc }) => (
              <div key={desc} style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px 6px', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                  <Icon size={16} color={iconColor} strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: C.dark, lineHeight: 1.1 }}>{stat}</div>
                <div style={{ fontSize: '8px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>{desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{
        display: isDesktop || isTablet ? 'grid' : 'block',
        gridTemplateColumns: isDesktop ? '1fr 340px' : isTablet ? '1fr 280px' : undefined,
        gap: isDesktop ? '40px' : '28px',
        alignItems: 'start',
      }}>

        {/* ══ LEFT COLUMN — Form ══ */}
        <div>
          <h2 style={{ ...secHead, fontSize: '13px', marginBottom: '20px' }}>Request Details</h2>

          {/* Ambulance Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelSt}>Ambulance Type <span style={{ color: C.red }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '6px' : '8px', marginTop: '4px' }}>
              {typeOptions.map(opt => {
                const isActive = ambulanceType === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAmbulanceType(opt.id)}
                    style={{
                      padding: isMobile ? '8px 4px' : '12px 10px',
                      border: `1.5px solid ${isActive ? '#1a3333' : C.border}`,
                      borderRadius: '6px',
                      background: isActive ? '#f0fdf4' : '#fff',
                      cursor: 'pointer',
                      textAlign: isMobile ? 'center' : 'left',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      outline: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMobile ? 'center' : 'stretch',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#9ca3af' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = C.border }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', height: isMobile ? '16px' : '20px', marginBottom: '4px', color: isActive ? C.cta : C.muted }}>
                      <opt.Icon size={isMobile ? 16 : 20} strokeWidth={2.2} />
                    </div>
                    <div style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: 800, color: isActive ? C.cta : C.dark, letterSpacing: '0.01em', lineHeight: 1.2 }}>{opt.label}</div>
                    <div style={{ fontSize: isMobile ? '7.5px' : '9px', color: C.faint, marginTop: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.2 }}>{opt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pickup & Destination */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelSt}>Pickup Location <span style={{ color: C.red }}>*</span></label>
              <IconInput
                icon={MapPin}
                iconColor="var(--ecare-primary, #1b3b2b)"
                placeholder="Your current address"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label style={labelSt}>Destination <span style={{ color: C.red }}>*</span></label>
              <IconInput
                icon={Navigation}
                iconColor={C.red}
                placeholder="Hospital / target address"
                value={destination}
                onChange={e => setDestination(e.target.value)}
              />
            </div>
          </div>

          {/* Time & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelSt}>Dispatch Time <span style={{ color: C.red }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Clock
                  size={15}
                  color={C.muted}
                  style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}
                />
                <input
                  type="time"
                  value={dispatchTime}
                  onChange={e => setDispatchTime(e.target.value)}
                  style={{ ...iconInputSt, cursor: 'pointer', colorScheme: 'light' }}
                />
              </div>
            </div>
            <div>
              <label style={labelSt}>Contact Phone <span style={{ color: C.red }}>*</span></label>
              <IconInput
                icon={Phone}
                iconColor="var(--ecare-primary, #1b3b2b)"
                placeholder="Your contact number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                type="tel"
              />
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelSt}>Priority Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              {[
                { id: 'Normal', label: 'Normal', sub: 'Scheduled transport' },
                { id: 'High',   label: '🚨 Emergency', sub: 'Urgent / life-threatening' },
              ].map(opt => {
                const isActive = priority === opt.id
                const borderColor = opt.id === 'High' ? '#fca5a5' : '#d1d5db'
                const activeBg    = opt.id === 'High' ? '#fff1f2' : '#f9fafb'
                const activeColor = opt.id === 'High' ? C.red : C.dark
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPriority(opt.id)}
                    style={{
                      padding: '10px 12px',
                      border: `1.5px solid ${isActive ? borderColor : C.border}`,
                      borderRadius: '6px',
                      background: isActive ? activeBg : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#9ca3af' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = C.border }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 800, color: isActive ? activeColor : C.dark }}>{opt.label}</div>
                    <div style={{ fontSize: '9px', color: C.faint, marginTop: '1px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '6px' }}>
            <label style={labelSt}>Additional Notes</label>
            <textarea
              rows={3}
              style={{ ...inputSt, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.5 }}
              placeholder="e.g. Patient condition, floor number, special requirements..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <p style={{ fontSize: '10px', color: C.faint, margin: '0 0 24px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Optional — include any details that may help dispatch
          </p>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div style={{ marginTop: isMobile ? '4px' : 0 }}>

          {/* Why E-CARE stats — tablet & desktop */}
          {!isMobile && (
            <>
              <p style={{ ...secHead, fontSize: '11px', marginBottom: '12px' }}>Why Choose E-CARE Ambulance?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
                {stats.map(({ Icon, iconColor, iconBg, stat, desc }) => (
                  <div key={desc} style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px 8px', textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <Icon size={18} color={iconColor} strokeWidth={2.5} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: C.dark, lineHeight: 1.1 }}>{stat}</div>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Right card — confirm */}
          <div style={{ marginBottom: '10px' }}>

            {/* Request summary */}
            <p style={{ ...secHead, fontSize: '10px', marginBottom: '12px' }}>Request Summary</p>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '18px' }}>
              <div style={{ padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151' }}>
                  Ambulance Request
                </span>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, fontWeight: 600 }}>Type</span>
                  <span style={{ fontSize: '12px', color: C.dark, fontWeight: 700 }}>
                    {typeOptions.find(t => t.id === ambulanceType)?.label || ambulanceType}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, fontWeight: 600 }}>Priority</span>
                  <span style={{ fontSize: '12px', color: priority === 'High' ? C.red : C.dark, fontWeight: 700 }}>
                    {priority === 'High' ? '🚨 Emergency' : 'Normal'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, fontWeight: 600 }}>Status</span>
                  <span style={{ fontSize: '12px', color: C.green, fontWeight: 700 }}>Pending Dispatch</span>
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, background: C.bg, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={14} color="#d97706" />
                <span style={{ fontSize: '10px', color: '#92400e', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Payment will be collected post-service or on invoice.
                </span>
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '14px' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: C.cta, flexShrink: 0 }}
              />
              <span style={{ fontSize: '10px', color: C.muted, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                Agree to{' '}<a href={termsLink} target={termsLink !== '#' ? "_blank" : undefined} rel={termsLink !== '#' ? "noopener noreferrer" : undefined} style={{ color: '#4f6ef7', fontWeight: 700 }}>Terms</a>{' '}and{' '}<a href={privacyLink} target={privacyLink !== '#' ? "_blank" : undefined} rel={privacyLink !== '#' ? "noopener noreferrer" : undefined} style={{ color: '#4f6ef7', fontWeight: 700 }}>Privacy Policy</a>
              </span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={ctaBtn(agreed && !isSubmitting)}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AmbulanceRequest
