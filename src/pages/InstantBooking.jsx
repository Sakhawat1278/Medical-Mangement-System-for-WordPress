import React, { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ShieldCheck, ClipboardText, Users,
  UploadSimple, X, FileText, Lock, Globe, CheckCircle,
  CreditCard, DeviceMobile, Bank, Money, Wallet, Phone
} from 'phosphor-react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import api from '../utils/api'
import AuthApp from '../AuthApp'
import { Portal } from '../utils/portal'

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  dark:   '#1a1a2e',
  border: '#e5e7eb',
  muted:  '#6b7280',
  faint:  '#9ca3af',
  bg:     '#f9fafb',
  cta:    '#1a3333',
  blue:   '#4f6ef7',
  green:  '#16a34a',
  red:    '#e11d48',
}

/* Shared static styles */
const inputSt = {
  width: '100%', height: '40px',
  border: `1px solid ${C.border}`, borderRadius: '4px',
  padding: '0 12px', fontSize: '13px', color: C.dark,
  outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: 'inherit',
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

/* Breakpoints: mobile < 640, tablet 640-1023, desktop >= 1024 */

/* ─── Payment summary card (reused in both steps) ─────────────────────── */
const PaymentSummary = ({ currencySymbol, fee, discountAmount, totalPayable }) => (
  <div style={{ border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
    <div style={{ padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
      <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151' }}>
        Payment Summary
      </span>
    </div>
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, fontWeight: 600 }}>Consultancy Fee</span>
        <span style={{ fontSize: '13px', color: C.dark, fontWeight: 500 }}>{currencySymbol} {fee.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, fontWeight: 600 }}>Coupon Discount</span>
        <span style={{ fontSize: '13px', color: C.dark, fontWeight: 500 }}>- {currencySymbol} {discountAmount.toFixed(2)}</span>
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderTop: `2px solid ${C.border}`, marginTop: '13px' }}>
      <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.dark }}>Total Payable</span>
      <span style={{ fontSize: '22px', fontWeight: 800, color: C.dark, letterSpacing: '-0.01em' }}>{currencySymbol} {totalPayable.toFixed(2)}</span>
    </div>
  </div>
)

/* ─── Main component ─────────────────────────────────────────────────────── */
const InstantBooking = () => {
  const {
    user: currentUser, currencySymbol, instantCallFee,
    paymentGateways, specialities, doctorList,
    addAppointment, setActivePage, validatePromoCode, uploadFile, addToCart
  } = useStore()

  const termsLink = window.ecareConfig?.settings?.termsUrl || window.ecareConfig?.termsUrl || '#'
  const privacyLink = window.ecareConfig?.settings?.privacyUrl || window.ecareConfig?.privacyUrl || '#'

  const vw = useWindowWidth()
  const isMobile  = vw < 640
  const isTablet  = vw >= 640 && vw < 1024
  const isDesktop = vw >= 1024

  /* form state */
  const [contactNumber, setContactNumber] = useState('')
  const [reason,        setReason]        = useState('')
  const [specialty,     setSpecialty]     = useState('General')
  const [promoCode,     setPromoCode]     = useState('')
  const [appliedPromo,  setAppliedPromo]  = useState(null)
  const [attachments,   setAttachments]   = useState([])
  const [isUploading,   setIsUploading]   = useState(false)
  const [isDragging,    setIsDragging]    = useState(false)
  const [agreed,        setAgreed]        = useState(false)

  const fileInputRef = useRef(null)
  const pollingRef = useRef(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookedAppointmentId, setBookedAppointmentId] = useState(null)
  const [liveAppt, setLiveAppt] = useState(null)

  /* ── Filter specialties based strictly on active instant-call doctors ──── */
  const instantActiveDoctors = useMemo(() => {
    return (doctorList || []).filter(doc => {
      const isInstant = doc.instantCallStatus === 'Active' || doc.instant_call_status === 'Active' || doc.instantCall === true
      const isDocActive = doc.status !== 'Inactive' && doc.status !== 'Pending'
      return isInstant && isDocActive
    })
  }, [doctorList])

  const specialtyList = useMemo(() => {
    if (!instantActiveDoctors || instantActiveDoctors.length === 0) {
      return []
    }

    const rawSpecsSet = new Set()
    let hasGeneral = false

    const extractDoctorSpecialties = (doctor) => {
      if (!doctor) return []
      const raw = doctor.specialization || doctor.specialty || doctor.speciality || doctor.specialities || []
      if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean)
      if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (!trimmed) return []
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean)
          } catch (e) {}
        }
        return trimmed.split(/,\s*/).map(s => s.trim()).filter(Boolean)
      }
      return []
    }

    instantActiveDoctors.forEach(doc => {
      const docSpecs = extractDoctorSpecialties(doc)
      if (docSpecs.length === 0) {
        hasGeneral = true
      } else {
        docSpecs.forEach(spec => {
          const lower = spec.toLowerCase()
          if (lower === 'general' || lower === 'general physician' || lower === 'general practice' || lower === 'general medicine') {
            hasGeneral = true
          } else {
            rawSpecsSet.add(spec)
          }
        })
      }
    })

    const list = []
    if (hasGeneral) {
      list.push({ value: 'General', label: 'General Physician' })
    }

    Array.from(rawSpecsSet).forEach(specName => {
      const matched = (specialities || []).find(s => s.name?.toLowerCase() === specName.toLowerCase())
      const displayName = matched ? matched.name : specName
      if (!list.some(item => item.value.toLowerCase() === displayName.toLowerCase())) {
        list.push({ value: displayName, label: displayName })
      }
    })

    return list
  }, [instantActiveDoctors, specialities])

  /* Auto-select specialty: from ?specialty= URL query param or fallback to first available */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const specParam = params.get('specialty')?.trim()

    if (specialtyList.length > 0) {
      if (specParam && specialtyList.some(s => s.value.toLowerCase() === specParam.toLowerCase())) {
        const match = specialtyList.find(s => s.value.toLowerCase() === specParam.toLowerCase())
        setSpecialty(match.value)
      } else if (!specialtyList.some(s => s.value === specialty)) {
        setSpecialty(specialtyList[0].value)
      }
    }
  }, [specialtyList])

  const fee            = parseFloat(instantCallFee || 0)
  const discountAmount = appliedPromo
    ? (appliedPromo.discount_type === 'percentage'
        ? fee * parseFloat(appliedPromo.discount_amount) / 100
        : parseFloat(appliedPromo.discount_amount))
    : 0
  const totalPayable = Math.max(0, fee - discountAmount)

  /* handlers */
  const handleApplyPromo = async () => {
    if (!promoCode) return
    const promo = await validatePromoCode(promoCode)
    setAppliedPromo(promo || null)
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setIsUploading(true)
    const uploaded = await uploadFile(file)
    if (uploaded) { setAttachments(p => [...p, uploaded.url]); toast.success('Document attached') }
    setIsUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const executeInstantBooking = async () => {
    setIsSubmitting(true)
    try {
      const isWcEnabled = !!(window.ecareConfig?.woocommerceEnabled || useStore.getState().woocommerceEnabled)

      if (isWcEnabled && totalPayable > 0) {
        toast.loading('Redirecting to secure payment...', { id: 'ecare-instant-call' })
        const res = await api.post('checkout/woocommerce', {
          cart: [{
            id: 'instant_doctor_call',
            type: 'instant_doctor_call',
            name: `Instant Consultation: ${specialty} Doctor`,
            price: totalPayable,
            originalPrice: fee,
            specialty,
            reason,
            contactNumber,
            attachedFiles: attachments,
            promo_code: appliedPromo?.code || null,
            appliedPromo: appliedPromo || null,
            discount_amount: discountAmount
          }],
          itemForms: {
            instant_doctor_call: {
              specialty,
              reason,
              attachedFiles: attachments
            }
          },
          contactNumber,
          totalPayable,
          subtotal: fee,
          discountAmount,
          appliedPromo
        })
        toast.dismiss('ecare-instant-call')
        if (res.data?.success && res.data?.checkout_url) {
          window.location.href = res.data.checkout_url
          return
        } else if (res.data?.success && res.data?.completed) {
          toast.success('Instant call broadcast started!')
          const apptId = res.data?.booking_id || res.data?.id
          if (apptId) {
            setBookedAppointmentId(apptId)
            setBookingSuccess(true)
          }
          return
        }
      }

      // Direct instant appointment scheduling
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

      const res = await addAppointment({
        doctorName: 'Pending Broadcast',
        date: dateStr,
        time: timeStr,
        specialty: specialty || 'General',
        service: 'Instant Virtual Consultation',
        mode: 'Instant Call',
        status: 'Pending',
        paymentStatus: totalPayable > 0 ? 'Unpaid' : 'Paid',
        promo_code: appliedPromo?.code || null,
        discount_amount: discountAmount || 0,
        reason: reason || '',
        attachments: attachments.length > 0 ? (Array.isArray(attachments) ? JSON.stringify(attachments) : attachments) : '',
        contactNumber: contactNumber || ''
      })

      toast.success('Instant consultation requested! Connecting with available doctors...')
      const apptId = res?.id || res?.data?.id
      if (apptId) {
        setBookedAppointmentId(apptId)
        setBookingSuccess(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to start instant call')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinue = () => {
    if (specialtyList.length === 0) {
      toast.error('No doctors are currently online in Instant Call mode.')
      return
    }
    if (!contactNumber.trim()) {
      toast.error('Please enter your contact number')
      return
    }
    if (!agreed) {
      toast.error('Please agree to the Terms and Privacy Policy')
      return
    }
    if (!currentUser?.id) {
      setIsAuthModalOpen(true)
      return
    }
    executeInstantBooking()
  }

  const handleAuthSuccess = (data) => {
    setIsAuthModalOpen(false)
    const authUser = data?.user || (data?.user_id ? { id: data.user_id, name: data.name || data.display_name || 'User' } : null)
    if (authUser) {
      useStore.setState({ user: authUser })
      if (window.ecareConfig) window.ecareConfig.user = authUser
      if (window.ecareAuthConfig) window.ecareAuthConfig.user = authUser
      toast.success(`Welcome back, ${authUser.name || 'User'}!`)
      setTimeout(() => {
        executeInstantBooking()
      }, 300)
    }
  }

  /* ── Live status polling ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!bookingSuccess || !bookedAppointmentId) return
    const TERMINAL = ['Completed', 'Cancelled', 'Expired']

    const poll = async () => {
      try {
        const res = await api.get(`appointments/${bookedAppointmentId}`)
        const appt = res.data
        setLiveAppt(appt)
        if (TERMINAL.includes(appt?.status)) {
          clearInterval(pollingRef.current)
        }
      } catch (e) {
        console.error('Polling error', e)
      }
    }

    poll()
    pollingRef.current = setInterval(poll, 5000)
    return () => clearInterval(pollingRef.current)
  }, [bookingSuccess, bookedAppointmentId, setLiveAppt])

  /* ── Booking success – live tracker ─────────────────────────────────── */
  if (bookingSuccess) {
    const status = liveAppt?.status || 'Query'
    const doctorName = liveAppt?.doctorName && liveAppt.doctorName !== 'Pending Broadcast'
      ? liveAppt.doctorName : null

    const STAGES = [
      {
        key: 'Query',
        label: 'Broadcasting',
        desc: 'Your request is being sent to available doctors',
        color: '#f59e0b',
        bg: '#fffbeb',
        border: '#fde68a',
      },
      {
        key: 'Active',
        label: 'Doctor Accepted',
        desc: doctorName ? `Dr. ${doctorName} is ready for your call` : 'A doctor has accepted your request',
        color: '#10b981',
        bg: '#f0fdf4',
        border: '#bbf7d0',
      },
      {
        key: 'Completed',
        label: 'Consultation Done',
        desc: 'Your session has been completed',
        color: '#6366f1',
        bg: '#eef2ff',
        border: '#c7d2fe',
      },
    ]

    const stageIdx = status === 'Active' ? 1 : status === 'Completed' ? 2 : 0
    const isCancelled = ['Cancelled', 'Expired'].includes(status)
    const isActive    = status === 'Active'
    const isCompleted = status === 'Completed'
    const TERMINAL    = ['Completed', 'Cancelled', 'Expired']
    const isPolling   = !TERMINAL.includes(status)

    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '520px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {isCancelled ? (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <X size={32} color="#ef4444" weight="bold" />
              </div>
            ) : isCompleted ? (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle size={36} color={C.green} weight="fill" />
              </div>
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', position: 'relative' }}>
                {isActive ? (
                  <Globe size={34} color="#10b981" weight="duotone" />
                ) : (
                  <>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      border: '3px solid #f59e0b',
                      borderTopColor: 'transparent',
                      animation: 'ecare-spin 1s linear infinite'
                    }} />
                    <ClipboardText size={30} color="#f59e0b" weight="duotone" />
                  </>
                )}
              </div>
            )}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.dark, margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>
              {isCancelled ? 'Request Cancelled' : isCompleted ? 'Consultation Complete' : isActive ? 'Doctor Ready!' : 'Searching for a Doctor…'}
            </h2>
            <p style={{ color: C.muted, fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
              {isCancelled
                ? `Your booking was ${status.toLowerCase()}. Please try again.`
                : isCompleted
                ? 'Thank you for using E-CARE. Your consultation has been recorded.'
                : isActive
                ? `Dr. ${doctorName || 'your doctor'} has accepted. You can now join the call.`
                : `Broadcasting to ${specialty || 'General'} specialists — checking every 5 seconds…`
              }
            </p>
          </div>

          {!isCancelled && (
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {STAGES.map((stage, i) => {
                const isDone    = stageIdx > i
                const isCurrent = stageIdx === i
                return (
                  <div key={stage.key} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? stage.color : isCurrent ? stage.bg : '#f3f4f6',
                        border: `2px solid ${isDone || isCurrent ? stage.color : C.border}`,
                        transition: 'all 0.4s ease',
                        boxShadow: isCurrent ? `0 0 0 4px ${stage.color}25` : 'none',
                        position: 'relative',
                      }}>
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : isCurrent && isPolling ? (
                          <div style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: stage.color,
                            animation: 'ecare-pulse 1.2s ease-in-out infinite',
                          }} />
                        ) : (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.border }} />
                        )}
                      </div>
                      {i < STAGES.length - 1 && (
                        <div style={{
                          width: '2px', height: '36px', marginTop: '2px',
                          background: isDone ? stage.color : '#e5e7eb',
                          transition: 'background 0.4s ease',
                          borderRadius: '2px',
                        }} />
                      )}
                    </div>
                    <div style={{ paddingTop: '4px', flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: '0 0 3px',
                        fontSize: '13px', fontWeight: 700,
                        color: isDone || isCurrent ? stage.color : C.muted,
                        letterSpacing: '0.02em',
                      }}>
                        {stage.label}
                        {isCurrent && isPolling && (
                          <span style={{ fontSize: '10px', fontWeight: 500, color: C.muted, marginLeft: '8px' }}>— Live</span>
                        )}
                        {isDone && <span style={{ fontSize: '10px', fontWeight: 500, color: stage.color, marginLeft: '8px' }}>✓</span>}
                      </p>
                      <p style={{ margin: 0, fontSize: '11.5px', color: C.faint, lineHeight: 1.5 }}>{stage.desc}</p>
                      {i < STAGES.length - 1 && <div style={{ height: '20px' }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '8px', marginBottom: '1.5rem',
            background: isCancelled ? '#fee2e2' : STAGES[Math.min(stageIdx, 2)].bg,
            border: `1px solid ${isCancelled ? '#fca5a5' : STAGES[Math.min(stageIdx, 2)].border}`,
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isCancelled ? '#ef4444' : STAGES[Math.min(stageIdx, 2)].color,
              animation: isPolling ? 'ecare-pulse 1.2s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isCancelled ? '#ef4444' : STAGES[Math.min(stageIdx, 2)].color }}>
              {status}
            </span>
            {isPolling && <span style={{ fontSize: '11px', color: C.muted }}>· auto-refreshing</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isActive && (
              <button
                onClick={() => setActivePage?.('dashboard')}
                style={{ width: '100%', padding: '13px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 14px #10b98140' }}
              >
                🎥 Join Video Consultation
              </button>
            )}
            <button
              onClick={() => {
                if (window.location.href.includes('dashboard')) setActivePage('dashboard')
                else window.location.href = window.ecareConfig?.dashboardUrl || '/dashboard'
              }}
              style={{ width: '100%', padding: '11px', background: isActive ? 'transparent' : C.cta, color: isActive ? C.muted : '#fff', border: isActive ? `1px solid ${C.border}` : 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            >
              {isCompleted ? 'View Dashboard' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
        <style>{`
          @keyframes ecare-spin { to { transform: rotate(360deg); } }
          @keyframes ecare-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
        `}</style>
      </div>
    )
  }



  /* ── Step 1 – Main form ──────────────────────────────────────────────── */
  /* Stat boxes data */
  const stats = [
    { Icon: ClipboardText, iconColor: '#4f6ef7', iconBg: '#eff2fe', stat: '100%', desc: 'Valid Prescription' },
    { Icon: Users,         iconColor: '#16a34a', iconBg: '#dcfce7', stat: '40+',  desc: 'Expert Doctors'     },
    { Icon: ShieldCheck,   iconColor: '#e11d48', iconBg: '#ffe4e6', stat: '100%', desc: 'Secure & Private'   },
  ]

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: isMobile ? '1rem' : '1.25rem 0', fontFamily: 'inherit' }}>

      {/*
        ── Two-column on desktop/tablet, single-column on mobile
           On mobile: right column content appears ABOVE left column (why consult + specialty + promo)
           then below comes the form fields + payment summary + continue
      */}

      {/* ─── Mobile: show "Why Consult" + right card ABOVE the form ─── */}
      {isMobile && (
        <>
          {/* WHY CONSULT */}
          <p style={{ ...secHead, fontSize: '11px', marginBottom: '12px' }}>Why Consult with Meditaj Doctor?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {stats.map(({ Icon, iconColor, iconBg, stat, desc }) => (
              <div key={desc} style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px 6px', textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                  <Icon size={16} color={iconColor} weight="fill" />
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
        gridTemplateColumns: isDesktop ? '1fr 360px' : isTablet ? '1fr 300px' : undefined,
        gap: isDesktop ? '40px' : '28px',
        alignItems: 'start',
      }}>

        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════ */}
        <div>
          <h2 style={{ ...secHead, fontSize: '13px', marginBottom: '20px' }}>Request Information</h2>

          {/* Contact Number */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelSt}>Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" style={inputSt} placeholder="e.g., 01XXXXXXXXX" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelSt}>Reason</label>
            <input type="text" style={inputSt} placeholder="e.g., Fever, Headache" value={reason} onChange={e => setReason(e.target.value)} />
          </div>

          {/* Documents */}
          <div style={{ marginBottom: '6px' }}>
            <label style={labelSt}>Documents <span style={{ color: C.green }}>or</span> Prescriptions</label>
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `1.5px dashed ${isDragging ? C.blue : '#d0d5dd'}`, borderRadius: '6px', minHeight: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', background: isDragging ? '#eff2fe' : '#fafafa', transition: 'all 0.2s' }}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0])} />
              {isUploading ? (
                <span style={{ color: C.muted, fontSize: '12px' }}>Uploading…</span>
              ) : attachments.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px' }}>
                  {attachments.map((_, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#e0e7ff', borderRadius: '4px', fontSize: '11px', color: '#4f46e5' }}>
                      <FileText size={13} /> File {idx + 1}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <UploadSimple size={16} color={C.faint} />
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.faint }}>No Files Uploaded Yet</span>
                </>
              )}
            </div>
          </div>
          <p style={{ fontSize: '10px', color: C.faint, margin: '0 0 24px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Max file size 2MB (Optional)
          </p>

          {/* Payment summary – on mobile show AFTER right card (handled below), on tablet/desktop show here */}
          {!isMobile && (
            <PaymentSummary currencySymbol={currencySymbol} fee={fee} discountAmount={discountAmount} totalPayable={totalPayable} />
          )}
        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════ */}
        <div style={{ marginTop: isMobile ? '4px' : 0 }}>

          {/* WHY CONSULT – tablet & desktop only (mobile shown above) */}
          {!isMobile && (
            <>
              <p style={{ ...secHead, fontSize: '11px', marginBottom: '12px' }}>Why Consult with Meditaj Doctor?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
                {stats.map(({ Icon, iconColor, iconBg, stat, desc }) => (
                  <div key={desc} style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px 8px', textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <Icon size={18} color={iconColor} weight="fill" />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: C.dark, lineHeight: 1.1 }}>{stat}</div>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Main right card */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: isMobile ? '16px' : '20px', marginBottom: '10px' }}>

            {/* Available Specialty */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelSt}>Available Specialty</label>
              {specialtyList.length === 0 ? (
                <div style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  color: '#9a3412',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#c2410c' }}>
                    <Phone size={16} color="#ea580c" />
                    <span>No Clinicians Live for Instant Calls</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#7c2d12' }}>
                    Doctors currently have instant consultation mode turned off. You can book a regular scheduled appointment with our specialists or check back shortly.
                  </p>
                  <a
                    href={window.ecareConfig?.siteUrl ? `${window.ecareConfig.siteUrl.replace(/\/$/, '')}/ecare-doctors` : '/ecare-doctors'}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '2px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#c2410c',
                      textDecoration: 'underline'
                    }}
                  >
                    Browse All Available Doctors &rarr;
                  </a>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  {specialtyList.map(item => {
                    const isActive = specialty === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSpecialty(item.value)}
                        style={{
                          height: '36px',
                          padding: '0 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: `1px solid ${isActive ? '#93c5fd' : '#e5e7eb'}`,
                          background: isActive ? '#eff6ff' : '#ffffff',
                          color: isActive ? '#1e40af' : '#4b5563',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Promo Code */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelSt}>Promo Code</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" style={{ ...inputSt, flex: 1 }} placeholder="Enter code" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} disabled={!!appliedPromo} />
                {!appliedPromo ? (
                  <button onClick={handleApplyPromo} style={{ flexShrink: 0, padding: '0 16px', height: '40px', background: C.cta, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Apply</button>
                ) : (
                  <button onClick={() => { setAppliedPromo(null); setPromoCode('') }} style={{ flexShrink: 0, padding: '0 12px', height: '40px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Remove</button>
                )}
              </div>
              {appliedPromo && <p style={{ margin: '6px 0 0', fontSize: '11px', color: C.green, fontWeight: 600 }}>✓ Promo &quot;{appliedPromo.code}&quot; applied!</p>}
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '14px' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: C.cta, flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: C.muted, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                Agree to{' '}<a href={termsLink} target={termsLink !== '#' ? "_blank" : undefined} rel={termsLink !== '#' ? "noopener noreferrer" : undefined} style={{ color: C.blue, fontWeight: 700 }}>Terms</a>{' '}and{' '}<a href={privacyLink} target={privacyLink !== '#' ? "_blank" : undefined} rel={privacyLink !== '#' ? "noopener noreferrer" : undefined} style={{ color: C.blue, fontWeight: 700 }}>Privacy Policy</a>
              </span>
            </label>

            {/* Continue */}
            <button 
              onClick={handleContinue} 
              disabled={!agreed || specialtyList.length === 0 || isSubmitting}
              style={{
                ...ctaBtn(agreed && specialtyList.length > 0 && !isSubmitting),
                cursor: isSubmitting ? 'wait' : (!agreed || specialtyList.length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Connecting...' : !currentUser?.id ? 'Login to Continue' : 'Connect with Doctor'} <ArrowRight size={13} />
            </button>
          </div>

          {/* Secure Connection footer */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '9px', color: C.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Secure Connection</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={11} color={C.green} weight="fill" />
                <span style={{ fontSize: '10px', fontWeight: 800, color: C.green, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Verified Doctor App</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[Globe, Globe].map((Icon, i) => (
                <div key={i} style={{ width: '26px', height: '26px', border: `1px solid ${C.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} color={C.faint} />
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary on mobile – shown BELOW the right card */}
          {isMobile && (
            <div style={{ marginTop: '16px' }}>
              <PaymentSummary currencySymbol={currencySymbol} fee={fee} discountAmount={discountAmount} totalPayable={totalPayable} />
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal Portal */}
      <Portal>
        <AnimatePresence>
          {isAuthModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAuthModalOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.3)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 99999
                }}
              />
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 100000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  pointerEvents: 'none'
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="ecare-card"
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '480px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    pointerEvents: 'auto',
                    border: 'none',
                    padding: 0
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(false)}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: '#f1f5f9',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                  >
                    <X size={16} weight="bold" color="#64748b" />
                  </button>
                  <AuthApp onSuccess={handleAuthSuccess} popupMode />
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>

    </div>
  )
}

export default InstantBooking
