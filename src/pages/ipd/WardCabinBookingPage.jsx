import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bed as BedIcon, CheckCircle, Sparkle, Clock, Calendar, 
  User, Phone, Envelope, ShieldCheck, Heartbeat, CaretRight, 
  X, Printer, Armchair, FirstAid, Buildings, Star, ArrowRight,
  Receipt, IdentificationCard, WarningCircle, Info
} from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'
import WardFloorPlan, { STATUS_CONFIG } from './WardFloorPlan'

export default function WardCabinBookingPage() {
  const {
    ipdWards = [],
    ipdBeds = [],
    ipdAdmissions = [],
    user,
    initStore,
    addIpdAdmission,
    markBedStatus
  } = useStore()

  useEffect(() => {
    initStore(true)
  }, [initStore])

  // Active Ward Tab
  const [selectedWardId, setSelectedWardId] = useState(null)
  useEffect(() => {
    if (!selectedWardId && ipdWards.length > 0) {
      setSelectedWardId(ipdWards[0].id)
    }
  }, [ipdWards, selectedWardId])

  const activeWard = useMemo(() => {
    return ipdWards.find(w => String(w.id) === String(selectedWardId)) || ipdWards[0] || null
  }, [ipdWards, selectedWardId])

  const wardBeds = useMemo(() => {
    if (!activeWard) return ipdBeds
    return ipdBeds.filter(b => String(b.ward_id) === String(activeWard.id))
  }, [ipdBeds, activeWard])

  // Selected Bed for Booking Modal
  const [targetBed, setTargetBed] = useState(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  // Booking Voucher Modal
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    patient_name: user?.name || '',
    patient_phone: user?.phone || '',
    patient_email: user?.email || '',
    patient_gender: 'Male',
    patient_age: '35',
    checkin_date: new Date().toISOString().slice(0, 10),
    stay_days: 3,
    attendant_name: '',
    attendant_phone: '',
    special_requests: 'Standard stay',
    payment_preference: 'pay_at_desk' // 'pay_at_desk' | 'advance_deposit'
  })

  // Update defaults when user object loads
  useEffect(() => {
    if (user?.name && !bookingForm.patient_name) {
      setBookingForm(prev => ({
        ...prev,
        patient_name: user.name,
        patient_phone: user.phone || prev.patient_phone,
        patient_email: user.email || prev.patient_email
      }))
    }
  }, [user])

  // Handle Bed Click from Blueprint
  const handleSelectBed = (bed) => {
    const status = bed.status || 'Available'
    if (status !== 'Available') {
      if (status === 'Occupied') {
        toast.error(`${bed.bed_number} is currently occupied by another patient. Please choose an available green bed or cabin.`)
      } else if (status === 'Cleaning') {
        toast.error(`${bed.bed_number} is currently undergoing sanitization by housekeeping.`)
      } else if (status === 'Reserved') {
        toast.error(`${bed.bed_number} is currently reserved.`)
      }
      return
    }

    setTargetBed(bed)
    setIsBookingModalOpen(true)
  }

  // Cost Calculation
  const estimatedCost = useMemo(() => {
    if (!targetBed) return { rate: 1500, days: 3, total: 4500, advance: 2000 }
    const rate = Number(targetBed.daily_rate || 1500)
    const days = Math.max(1, Number(bookingForm.stay_days) || 1)
    const total = rate * days
    const advance = Math.min(total, Math.round(total * 0.3)) // 30% advance deposit option
    return { rate, days, total, advance }
  }, [targetBed, bookingForm.stay_days])

  // Submit User Booking
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSubmitBooking = async (e) => {
    e.preventDefault()
    if (!bookingForm.patient_name.trim()) {
      toast.error('Please enter patient name.')
      return
    }
    if (!bookingForm.patient_phone.trim()) {
      toast.error('Please enter contact telephone number.')
      return
    }
    if (!targetBed) return

    setIsSubmitting(true)
    try {
      const admissionData = {
        patient_user_id: user?.id || null,
        patient_name: bookingForm.patient_name,
        patient_phone: bookingForm.patient_phone,
        patient_email: bookingForm.patient_email,
        ward_id: targetBed.ward_id || activeWard?.id,
        ward_name: activeWard?.name || 'General Ward',
        bed_id: targetBed.id,
        bed_number: targetBed.bed_number,
        room_number: targetBed.room_number || '401',
        daily_rate: estimatedCost.rate,
        admit_date: bookingForm.checkin_date,
        expected_stay_days: estimatedCost.days,
        admission_type: 'Online Reservation',
        diagnosis: `Reserved online: ${bookingForm.special_requests || 'Elective Stay'}`,
        status: 'Reserved',
        notes: `Attendant: ${bookingForm.attendant_name || 'None'} (${bookingForm.attendant_phone || 'N/A'}). Payment: ${bookingForm.payment_preference === 'advance_deposit' ? '30% Advance Deposit' : 'Pay at Hospital Desk'}.`,
        total_charges: estimatedCost.total
      }

      const res = await addIpdAdmission(admissionData)
      if (res?.success) {
        // Mark bed as Reserved
        await markBedStatus(targetBed.id, 'Reserved', `Reserved online by ${bookingForm.patient_name}`)
        
        const bookingId = res.data?.id || Math.floor(10000 + Math.random() * 90000)
        const confirmationRecord = {
          booking_id: bookingId,
          ...admissionData,
          bed_details: targetBed,
          booked_at: new Date().toISOString()
        }

        setConfirmedBooking(confirmationRecord)
        setIsBookingModalOpen(false)
        setIsVoucherModalOpen(true)
        toast.success(`Reservation Confirmed! ${targetBed.bed_number} has been held for you.`)
      } else {
        toast.error(res?.message || 'Failed to complete cabin reservation.')
      }
    } catch (err) {
      toast.error('Booking failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '24px 20px 60px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#0f172a'
    }}>
      
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '18px',
        padding: '32px 36px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 12px 30px -8px rgba(15, 23, 42, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '720px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(6px)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '12px', color: '#38bdf8' }}>
            <Sparkle size={14} weight="fill" />
            Hospital Inpatient & Deluxe Cabin Booking
          </div>
          
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Reserve Your Hospital Room or Executive Cabin
          </h1>
          
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>
            Browse our interactive live architectural floor plan below. Select an available green room or executive suite (like Cabin 414 with private lounge) to reserve directly online.
          </p>
        </div>

        {/* Decorative Watermark */}
        <div style={{ position: 'absolute', right: '-15px', bottom: '-25px', opacity: 0.08, pointerEvents: 'none' }}>
          <BedIcon size={240} weight="fill" />
        </div>
      </div>

      {/* Ward Selection Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px',
        background: '#ffffff',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
            Choose Floor / Wing:
          </span>
          {ipdWards.map(ward => {
            const isActive = String(ward.id) === String(activeWard?.id)
            const availableCount = ipdBeds.filter(b => String(b.ward_id) === String(ward.id) && (b.status || 'Available') === 'Available').length
            return (
              <button
                key={ward.id}
                onClick={() => setSelectedWardId(ward.id)}
                style={{
                  background: isActive ? 'var(--ecare-primary, #0284c7)' : '#f8fafc',
                  color: isActive ? '#ffffff' : '#334155',
                  border: `1.5px solid ${isActive ? 'var(--ecare-primary, #0284c7)' : '#cbd5e1'}`,
                  borderRadius: '999px',
                  padding: '7px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{ward.name}</span>
                <span style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#475569',
                  fontSize: '0.7rem',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  fontWeight: 800
                }}>
                  {availableCount} Available
                </span>
              </button>
            )
          })}
        </div>

        {/* User Help Cue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
          <CheckCircle size={16} weight="fill" />
          Click any <strong>Green Bed</strong> on the floor plan to book
        </div>
      </div>

      {/* Main Floor Plan Container */}
      <WardFloorPlan
        ward={activeWard}
        beds={wardBeds}
        admissions={ipdAdmissions}
        onSelectBed={handleSelectBed}
        onQuickReadyBed={null} // Public users cannot mark ready
        selectedBedId={targetBed?.id}
      />

      {/* ========================================================= */}
      {/* USER BOOKING MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isBookingModalOpen && targetBed && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsBookingModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '580px',
                  maxHeight: '92vh',
                  overflowY: 'auto',
                  boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BedIcon size={22} weight="duotone" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                        Reserve {targetBed.bed_number}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {activeWard?.name} • Room {targetBed.room_number || '401'} • ৳{Number(targetBed.daily_rate || 1500).toLocaleString()}/day
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setIsBookingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmitBooking} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Selected Room Highlights (Especially if VIP Cabin 414) */}
                  {targetBed.room_number === '414' ? (
                    <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Armchair size={28} color="#0284c7" weight="duotone" />
                      <div style={{ fontSize: '0.78rem' }}>
                        <strong style={{ color: '#0369a1' }}>Executive VIP Cabin Amenities Included:</strong>
                        <div style={{ color: '#0c4a6e', marginTop: '2px' }}>
                          Private 2-seater sofa lounge, attendant bed, attached private washroom, 55" Smart TV, and complimentary meals for patient.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.76rem', color: '#475569' }}>
                      <strong>Room Features:</strong> Multi-function hospital bed, central oxygen port, bedside IV stand, nurse call button, and attendant chair.
                    </div>
                  )}

                  {/* Patient Contact Info */}
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Patient Details
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Patient Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={bookingForm.patient_name}
                          onChange={e => setBookingForm(prev => ({ ...prev, patient_name: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 017xxxxxxxx"
                          value={bookingForm.patient_phone}
                          onChange={e => setBookingForm(prev => ({ ...prev, patient_phone: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="patient@example.com"
                          value={bookingForm.patient_email}
                          onChange={e => setBookingForm(prev => ({ ...prev, patient_email: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Gender / Age
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <select
                            value={bookingForm.patient_gender}
                            onChange={e => setBookingForm(prev => ({ ...prev, patient_gender: e.target.value }))}
                            style={{ flex: 1, padding: '8px 6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Age"
                            value={bookingForm.patient_age}
                            onChange={e => setBookingForm(prev => ({ ...prev, patient_age: e.target.value }))}
                            style={{ width: '60px', padding: '8px 6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Expected Duration */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Check-in / Admission Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingForm.checkin_date}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={e => setBookingForm(prev => ({ ...prev, checkin_date: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Expected Stay (Days) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        required
                        value={bookingForm.stay_days}
                        onChange={e => setBookingForm(prev => ({ ...prev, stay_days: Math.max(1, parseInt(e.target.value) || 1) }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  {/* Attendant / Companion Information */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Attendant / Family Contact Name & Phone
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Attendant Name"
                        value={bookingForm.attendant_name}
                        onChange={e => setBookingForm(prev => ({ ...prev, attendant_name: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                      <input
                        type="tel"
                        placeholder="Attendant Mobile"
                        value={bookingForm.attendant_phone}
                        onChange={e => setBookingForm(prev => ({ ...prev, attendant_phone: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Special Care Requests / Medical Notes
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Diabetic meal preference, Wheelchair assistance required, Post-operative recovery"
                      value={bookingForm.special_requests}
                      onChange={e => setBookingForm(prev => ({ ...prev, special_requests: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', resize: 'vertical' }}
                    />
                  </div>

                  {/* Pricing Breakdown & Payment Preference */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1.5px solid #cbd5e1', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748b' }}>Daily Bed / Cabin Rate:</span>
                      <strong>৳{estimatedCost.rate.toLocaleString()} / day</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748b' }}>Estimated Stay:</span>
                      <strong>{estimatedCost.days} Days</strong>
                    </div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Estimated Room Charges:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0284c7' }}>
                        ৳{estimatedCost.total.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Payment Preference:
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="payment_pref"
                            checked={bookingForm.payment_preference === 'pay_at_desk'}
                            onChange={() => setBookingForm(prev => ({ ...prev, payment_preference: 'pay_at_desk' }))}
                          />
                          Pay at Hospital Admission Desk
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="payment_pref"
                            checked={bookingForm.payment_preference === 'advance_deposit'}
                            onChange={() => setBookingForm(prev => ({ ...prev, payment_preference: 'advance_deposit' }))}
                          />
                          Pay 30% Advance (৳{estimatedCost.advance.toLocaleString()})
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        background: 'var(--ecare-primary, #0284c7)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 24px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                        opacity: isSubmitting ? 0.7 : 1
                      }}
                    >
                      {isSubmitting ? 'Confirming Reservation...' : 'Confirm & Reserve Cabin'}
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* BOOKING CONFIRMATION VOUCHER MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isVoucherModalOpen && confirmedBooking && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.55)',
                backdropFilter: 'blur(4px)',
                zIndex: 10001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsVoucherModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '540px',
                  maxHeight: '92vh',
                  overflowY: 'auto',
                  boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '16px 16px 0 0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={26} weight="fill" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                        Cabin Reservation Confirmed!
                      </div>
                      <div style={{ fontSize: '0.74rem', opacity: 0.9 }}>
                        Booking Reference: #{confirmedBooking.booking_id}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setIsVoucherModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Printable Voucher Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '14px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      {window.ecareConfig?.siteName || 'E-CARE HOSPITAL & MEDICAL CENTRE'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Official Inpatient Room Hold Voucher
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Patient Name:</span>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{confirmedBooking.patient_name}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Phone Number:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{confirmedBooking.patient_phone}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Reserved Cabin / Bed:</span>
                      <div style={{ fontWeight: 800, color: '#0284c7' }}>{confirmedBooking.bed_number} (RM {confirmedBooking.room_number})</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Ward / Wing:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{confirmedBooking.ward_name}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Check-in Date:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{confirmedBooking.admit_date}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Reserved Duration:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{confirmedBooking.expected_stay_days} Days</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '12px 16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', color: '#065f46', fontWeight: 600 }}>Total Estimated Charges:</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46' }}>
                        ৳{confirmedBooking.total_charges?.toLocaleString()}
                      </div>
                    </div>
                    <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px' }}>
                      BED STATUS: RESERVED
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4, background: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    ℹ️ <strong>Instructions for Admission:</strong> Please arrive at the hospital reception on your scheduled check-in date ({confirmedBooking.admit_date}) and show this voucher or state Booking Reference <strong>#{confirmedBooking.booking_id}</strong>. Housekeeping will have your cabin sanitized and prepared.
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#334155'
                      }}
                    >
                      <Printer size={16} weight="bold" />
                      Print Voucher
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVoucherModalOpen(false)}
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 20px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Done
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

    </div>
  )
}
