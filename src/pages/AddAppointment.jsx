import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, Clock, User, UserSquare, Heartbeat, NotePencil, 
  CheckCircle, ArrowLeft, CreditCard, ShieldCheck,
  CaretLeft, CaretRight, Lock
} from 'phosphor-react'
import useStore from '../store/useStore'
import CustomDatePicker from '../components/CustomDatePicker'
import CustomSelect from '../components/CustomSelect'
import CustomTimePicker from '../components/CustomTimePicker'
import toast from 'react-hot-toast'
import { formatPaymentMethod } from '../utils/formatters'

const normalizeScheduleStatus = (status = '') => String(status).trim().toLowerCase()
const blocksSchedule = (appt) => !['cancelled', 'expired', 'refunded', 'closed'].includes(normalizeScheduleStatus(appt?.status))
const parseMinutes = (value = '') => {
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const basic = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (basic) return Number(basic[1]) * 60 + Number(basic[2])
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!ampm) return null
  let hours = Number(ampm[1]) % 12
  if (ampm[3].toUpperCase() === 'PM') hours += 12
  return hours * 60 + Number(ampm[2])
}
const getTimeRange = (value = '') => {
  const [startRaw, endRaw] = String(value).split('-').map(part => part.trim())
  const start = parseMinutes(startRaw)
  if (start === null) return null
  const parsedEnd = endRaw ? parseMinutes(endRaw) : null
  return { start, end: parsedEnd && parsedEnd > start ? parsedEnd : start + 60 }
}
const overlaps = (first, second) => {
  const a = getTimeRange(first)
  const b = getTimeRange(second)
  if (!a || !b) return String(first).trim() === String(second).trim()
  return a.start < b.end && b.start < a.end
}

const InputGroup = ({ label, required, children, helper }) => (
  <div className="ecare-form-group" style={{ marginBottom: '1.25rem' }}>
    <label className="ecare-label" style={{ marginBottom: '8px', fontSize: '0.8125rem', fontWeight: 600 }}>
      {required && <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>}
      {label}
    </label>
    {children}
    {helper && <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>{helper}</p>}
  </div>
)

const AddAppointment = () => {
  const { 
    setActivePage,
    addAppointment, 
    updateAppointment, 
    editingAppointment, 
    setEditingAppointment,
    patients,
    doctorList,
    specialities,
    services: allServices,
    appointments,
    transactions,
    updateTransaction,
    user,
    paymentGateways,
    consultationModes,
    doctorAvailability
  } = useStore()
  
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: '',
    time: '',
    specialty: [],
    service: [],
    mode: 'In-Person',
    paymentStatus: 'Pending',
    paymentMethod: 'Cash',
    status: 'Pending',
    notes: '',
    paidAmount: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize data for edit mode
  useEffect(() => {
    if (editingAppointment) {
      const parseList = (val) => {
        if (!val) return []
        return typeof val === 'string' ? val.split(', ') : (Array.isArray(val) ? val : [])
      }

      setFormData({
        patientName: editingAppointment.patientName || '',
        doctorName: editingAppointment.doctorName || '',
        date: editingAppointment.date || '',
        time: editingAppointment.time || '',
        specialty: parseList(editingAppointment.specialty),
        service: parseList(editingAppointment.service),
        mode: editingAppointment.mode || 'In-Person',
        paymentStatus: editingAppointment.paymentStatus || 'Pending',
        paymentMethod: editingAppointment.paymentMethod || 'Cash',
        status: editingAppointment.status || 'Pending',
        notes: editingAppointment.notes || '',
        paidAmount: editingAppointment.paidAmount || ''
      })
    }
  }, [editingAppointment])

  const availableServices = useMemo(() => {
    if (!formData.specialty || formData.specialty.length === 0) return []
    const selectedSpecialties = Array.isArray(formData.specialty) ? formData.specialty : [formData.specialty]
    const grouped = []
    selectedSpecialties.forEach(spec => {
      const specServices = allServices.filter(s => s.speciality === spec && s.status === 'Active')
      if (specServices.length > 0) {
        grouped.push({ label: spec, isHeader: true })
        specServices.forEach(s => {
          grouped.push({ value: s.name, label: s.name })
        })
      }
    })
    return grouped
  }, [allServices, formData.specialty])

  const gatewayOptions = Object.entries(paymentGateways || {})
    .filter(([_, gateway]) => gateway.enabled)
    .map(([key, gateway]) => ({ value: formatPaymentMethod(gateway.name || key), label: formatPaymentMethod(gateway.name || key) }))

  const handleInputChange = (field, value) => {
    if (field === 'paidAmount') {
      const num = Number(value)
      if (num > totalPrice) {
        toast.error(`Amount cannot exceed total ৳${totalPrice}`)
        return
      }
    }
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      if (field === 'paymentStatus' && value === 'Paid') {
        newData.paidAmount = totalPrice
      }
      if (field === 'specialty') {
        const selectedSpecs = Array.isArray(value) ? value : [value]
        newData.service = prev.service.filter(svcName => {
          const svc = allServices.find(s => s.name === svcName)
          return svc && selectedSpecs.includes(svc.speciality)
        })
      }
      return newData
    })
  }

  const followupStatus = useMemo(() => {
    if (!formData.patientName || !formData.doctorName || editingAppointment) return null
    const selectedDoctor = doctorList.find(d => d.name === formData.doctorName)
    if (!selectedDoctor) return null
    const lastAppt = (appointments || [])
      .filter(a => a.patientName === formData.patientName && a.doctorName === formData.doctorName && a.paymentStatus === 'Paid')
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    if (!lastAppt) return null
    const diffTime = Math.abs(new Date() - new Date(lastAppt.date))
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const maxFollowupDays = Number(selectedDoctor.followUpDays) || 7
    if (diffDays <= maxFollowupDays) {
      return { daysLeft: maxFollowupDays - diffDays, cost: Number(selectedDoctor.followUpCost) || 0 }
    }
    return null
  }, [formData.patientName, formData.doctorName, doctorList, appointments, editingAppointment])

  const totalPrice = useMemo(() => {
    const servicesSum = (formData.service || []).reduce((sum, serviceName) => {
      const svc = allServices.find(s => s.name === serviceName)
      return sum + (Number(svc?.price) || 0)
    }, 0)

    if (followupStatus) {
      return (Number(followupStatus.cost) || 0) + servicesSum
    }
    return servicesSum
  }, [formData.service, allServices, followupStatus])

  const remainingAmount = useMemo(() => {
    const total = totalPrice
    const paid = Number(formData.paidAmount) || 0
    return Math.max(0, total - paid)
  }, [totalPrice, formData.paidAmount])

  const isCreditValid = useMemo(() => {
    if (!editingAppointment || !editingAppointment.rebookCreditFrom) return false;
    
    const parseList = (val) => {
      if (!val) return []
      return typeof val === 'string' ? val.split(', ') : (Array.isArray(val) ? val : [])
    }
    const origSpecs = parseList(editingAppointment.specialty)
    const origSvcs = parseList(editingAppointment.service)

    const chosenSpecs = Array.isArray(formData.specialty) ? formData.specialty : [formData.specialty]
    const chosenSvcs = Array.isArray(formData.service) ? formData.service : [formData.service]

    const hasNewSpecialty = chosenSpecs.some(s => s && !origSpecs.includes(s));
    const hasNewService = chosenSvcs.some(s => s && !origSvcs.includes(s));

    return !hasNewSpecialty && !hasNewService;
  }, [editingAppointment, formData.specialty, formData.service]);

  const selectedDoctor = useMemo(() => {
    if (!formData.doctorName) return null
    return (doctorList || []).find(d => d.name === formData.doctorName)
  }, [formData.doctorName, doctorList])

  const conflictingAppointment = useMemo(() => {
    if (!selectedDoctor || !formData.date || !formData.time) return null
    return (appointments || []).find(appt => {
      if (editingAppointment?.id && String(appt.id) === String(editingAppointment.id)) return false
      if (!blocksSchedule(appt)) return false
      if (appt.date !== formData.date) return false
      const docMatch = (selectedDoctor.name && appt.doctorName && appt.doctorName.trim().toLowerCase() === selectedDoctor.name.trim().toLowerCase()) ||
                       (selectedDoctor.id && parseInt(appt.doctor_id) === parseInt(selectedDoctor.id)) ||
                       (selectedDoctor.user_id && parseInt(appt.doctor_id) === parseInt(selectedDoctor.user_id)) ||
                       (selectedDoctor.user_id && parseInt(appt.doctor_user_id || appt.doctorUserId) === parseInt(selectedDoctor.user_id))
      if (!docMatch) return false
      return overlaps(appt.time, formData.time)
    }) || null
  }, [appointments, editingAppointment, formData.date, formData.time, selectedDoctor])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    if (conflictingAppointment) {
      toast.error(`This doctor already has an appointment at ${conflictingAppointment.time} on ${conflictingAppointment.date}.`)
      return
    }
    
    // Comprehensive Validation
    const requiredFields = [
      { key: 'patientName', label: 'Patient Name' },
      { key: 'doctorName', label: 'Doctor Name' },
      { key: 'date', label: 'Appointment Date' },
      { key: 'time', label: 'Appointment Time' },
      { key: 'specialty', label: 'Specialty' },
      { key: 'service', label: 'Services' },
      { key: 'mode', label: 'Visit Mode' },
      { key: 'status', label: 'Appointment Status' },
      { key: 'paymentStatus', label: 'Payment Status' },
      { key: 'paymentMethod', label: 'Payment Method' }
    ];

    const missing = requiredFields.filter(f => {
      const val = formData[f.key];
      if (Array.isArray(val)) return val.length === 0;
      return !val;
    });

    if (missing.length > 0) {
      toast.error(`Required: ${missing.map(m => m.label).join(', ')}`, {
        icon: '⚠️',
        style: { 
          borderRadius: '12px',
          background: '#fffbeb',
          color: '#92400e',
          border: '1px solid #fde68a',
          fontWeight: 700,
          fontSize: '0.8125rem'
        }
      });
      return;
    }

    if (conflictingAppointment) {
      toast.error(`This doctor is already booked on ${conflictingAppointment.date} at ${conflictingAppointment.time}. Please choose another slot.`, {
        icon: '🔒',
        style: {
          borderRadius: '12px',
          background: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
          fontWeight: 700,
          fontSize: '0.8125rem'
        }
      });
      return;
    }

    setIsSubmitting(true)
    try {
      const { addTransaction, addManualVerification, updateTransaction, transactions } = useStore.getState()
      
      let finalPaymentStatus = formData.paymentStatus
      let finalPaidAmount = formData.paymentStatus === 'Paid' ? totalPrice : (Number(formData.paidAmount) || 0)
      
      const isRebooking = editingAppointment && editingAppointment.rebookCreditFrom
      const useCredit = isRebooking && isCreditValid

      if (useCredit) {
        finalPaymentStatus = 'Paid'
        finalPaidAmount = totalPrice
      }

      const appointmentData = {
        ...formData,
        specialty: Array.isArray(formData.specialty) ? formData.specialty.join(', ') : formData.specialty,
        service: Array.isArray(formData.service) ? formData.service.join(', ') : formData.service,
        price: totalPrice,
        paymentStatus: finalPaymentStatus,
        paidAmount: finalPaidAmount,
        rebookCreditUsed: useCredit ? true : undefined,
        rebookCreditFrom: isRebooking ? editingAppointment.rebookCreditFrom : undefined,
        issuedBy: user?.name || 'System'
      }

      let success = false
      let res = null
      if (editingAppointment && editingAppointment.id) {
        success = await updateAppointment(editingAppointment.id, appointmentData)
        res = editingAppointment
      } else {
        res = await addAppointment(appointmentData)
        success = !!res
      }

      if (success) {
        const bookingId = res.id || res;
        
        // Mark original credit as used in original appointment
        if (useCredit) {
          await updateAppointment(editingAppointment.rebookCreditFrom, {
            refundStatus: 'credit_used'
          });
        }
        
        // Prevent duplicate transactions: Find if one already exists for this appointment
        const existingTxn = editingAppointment && editingAppointment.id
          ? (transactions || []).find(t => String(t.appointmentId || t.appointment_id) === String(editingAppointment.id))
          : null;

        const txnData = {
          appointmentId: bookingId,
          patientName: formData.patientName,
          category: 'Appointment',
          description: useCredit 
            ? `Rebooked session using credit from missed booking #${editingAppointment.rebookCreditFrom}` 
            : `Booking for ${Array.isArray(formData.service) ? formData.service.join(', ') : formData.service}`,
          amount: totalPrice,
          paidAmount: finalPaidAmount,
          status: finalPaymentStatus,
          method: useCredit ? 'Credit' : formData.paymentMethod,
          date: formData.date || new Date().toISOString().split('T')[0]
        };

        if (existingTxn) {
          await updateTransaction(existingTxn.id, txnData)
        } else {
          await addTransaction(txnData)
        }

        if (formData.paymentStatus === 'Under Verify' && !existingTxn) {
          addManualVerification({
            patientName: formData.patientName,
            method: formData.paymentMethod,
            amount: totalPrice,
            trxId: `VER-${Math.floor(100000 + Math.random() * 900000)}`,
            senderNumber: 'Manual entry',
            linkedTxn: bookingId
          })
        }

        // --- TELEMEDICINE AUTO-CREATION LOOP ---
        if (formData.mode === 'Video Consult') {
          const { createTelemedRoom, patients, doctorList } = useStore.getState();
          const patientObj = (patients || []).find(p => p.name === formData.patientName);
          const doctorObj = (doctorList || []).find(d => d.name === formData.doctorName);

          const patientUserId = patientObj?.user_id;
          const doctorUserId = doctorObj?.user_id;

          if (patientUserId && doctorUserId) {
            await createTelemedRoom({
              appointment_id: bookingId,
              doctor_id: doctorUserId,
              patient_id: patientUserId,
              status: 'Active',
              type: 'Video Consult'
            });
          } else {
            toast.error('Appointment saved, but the video room is waiting for linked patient and doctor accounts.')
          }
        }
        
        toast.success(editingAppointment ? 'Appointment updated' : 'Appointment finalized')
        setEditingAppointment(null)
        setActivePage('appointments')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to process appointment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const patientOptions = (patients || []).map(p => ({ value: p.name, label: `${p.name} [#PAT-${String(p.id).slice(0, 8).toUpperCase()}]` }))

  const doctorScheds = useMemo(() => {
    if (!selectedDoctor) return []
    return (doctorAvailability || []).filter(a => 
      parseInt(a.doctor_id) === parseInt(selectedDoctor.user_id) || 
      parseInt(a.doctor_id) === parseInt(selectedDoctor.id)
    )
  }, [selectedDoctor, doctorAvailability])

  const availableDates = useMemo(() => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayNum = d.getDate()
      const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const fullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      
      const hasAvailability = doctorScheds.some(s => s.day === d.toLocaleDateString('en-US', { weekday: 'long' }) && s.status === 'Active')
      
      dates.push({ dayName, dayNum, monthYear, fullDate, isAvailable: hasAvailability || !selectedDoctor })
    }
    return dates
  }, [doctorScheds, selectedDoctor])

  const availableSlots = useMemo(() => {
    if (!formData.date || !selectedDoctor) return []
    
    // Robust weekday detection (avoiding timezone shifts of new Date(string))
    const [y, m, d] = formData.date.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
    
    const sched = doctorScheds.find(s => s.day === day && s.status === 'Active')
    if (!sched || !sched.slots) return []
    
    let parsed = []
    try {
      parsed = typeof sched.slots === 'string' ? JSON.parse(sched.slots) : sched.slots
    } catch (e) {
      // Fallback for comma-separated legacy formats
      parsed = typeof sched.slots === 'string' ? sched.slots.split(',').map(s => s.trim()) : []
    }

    if (!Array.isArray(parsed)) return []

    // Convert slot objects {start, end, status} to display strings
    const formatTime = (time) => {
      if (!time) return ''
      const [h, m] = time.split(':').map(Number)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const hours = h % 12 || 12
      return `${hours}:${String(m).padStart(2, '0')} ${ampm}`
    }

    const displaySlots = parsed
      .filter(s => s.status !== 'Inactive')
      .map(s => {
        if (typeof s === 'string') return s
        if (s.start && s.end) {
          return `${formatTime(s.start)} - ${formatTime(s.end)}`
        }
        return null
      })
      .filter(Boolean)

    return displaySlots.map(slot => {
      const isBooked = (appointments || []).some(appt => {
        if (editingAppointment?.id && String(appt.id) === String(editingAppointment.id)) return false
        if (!blocksSchedule(appt)) return false
        if (appt.date !== formData.date) return false
        const docMatch = (selectedDoctor.name && appt.doctorName && appt.doctorName.trim().toLowerCase() === selectedDoctor.name.trim().toLowerCase()) ||
                         (selectedDoctor.id && parseInt(appt.doctor_id) === parseInt(selectedDoctor.id)) ||
                         (selectedDoctor.user_id && parseInt(appt.doctor_id) === parseInt(selectedDoctor.user_id)) ||
                         (selectedDoctor.user_id && parseInt(appt.doctor_user_id || appt.doctorUserId) === parseInt(selectedDoctor.user_id))
        if (!docMatch) return false
        return overlaps(appt.time, slot)
      })
      return {
        slot,
        isBooked
      }
    })
  }, [appointments, doctorScheds, editingAppointment, formData.date, selectedDoctor])

  const doctorOptions = useMemo(() => {
    const safeDoctors = Array.isArray(doctorList) ? doctorList : []
    const groups = {}
    
    safeDoctors.forEach(doc => {
      const spec = doc.specialization || 'General Practice'
      if (!groups[spec]) groups[spec] = []
      groups[spec].push({ value: doc.name, label: `${doc.name} [#DOC-${String(doc.id).slice(0, 8).toUpperCase()}]` })
    })
    
    const formatted = []
    // Sort specialities alphabetically
    Object.keys(groups).sort().forEach(spec => {
      formatted.push({ label: spec, isHeader: true })
      groups[spec].sort((a, b) => a.label.localeCompare(b.label)).forEach(doc => {
        formatted.push(doc)
      })
    })
    
    return formatted
  }, [doctorList])

  const specialtyOptions = (specialities || []).filter(s => s.status === 'Active').map(s => ({ value: s.name, label: s.name }))

  const scrollRef = React.useRef(null)

  const scroll = (dir) => {
    if (scrollRef.current) {
      const amt = dir === 'left' ? -200 : 200
      scrollRef.current.scrollBy({ left: amt, behavior: 'smooth' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} style={{ padding: '0 0 2rem 0' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left Panel: Clinical Details */}
          <div style={{ flex: '1 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ecare-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} weight="duotone" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Consultation Coordinator</h3>
              </div>

              {/* Patient, Doctor, Status in 3 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <InputGroup label="Patient Selection" required>
                  <CustomSelect isSearchable value={formData.patientName} options={patientOptions} onChange={(val) => handleInputChange('patientName', val)} placeholder="Patient..." />
                </InputGroup>
                <InputGroup label="Assign Clinician" required>
                  <CustomSelect isSearchable value={formData.doctorName} options={doctorOptions} onChange={(val) => handleInputChange('doctorName', val)} placeholder="Clinician..." />
                </InputGroup>
                <InputGroup label="Appt Status" required>
                  <CustomSelect 
                    value={formData.status}
                    options={
                      formData.mode === 'Instant Call'
                        ? [
                            { value: 'Pending', label: 'Pending' },
                            { value: 'Query', label: 'Query' },
                            { value: 'Active', label: 'Active' },
                            { value: 'Completed', label: 'Completed' },
                            { value: 'Cancelled', label: 'Cancelled' },
                            { value: 'Expired', label: 'Expired' },
                            { value: 'Under Verify', label: 'Under Verify' },
                            { value: 'Refund Pending', label: 'Refund Pending' },
                            { value: 'Refunded', label: 'Refunded' },
                            { value: 'Closed', label: 'Closed' }
                          ]
                        : [
                            { value: 'Pending', label: 'Pending' },
                            { value: 'Confirmed', label: 'Confirmed' },
                            { value: 'Cancelled', label: 'Cancelled' },
                            { value: 'Completed', label: 'Completed' },
                            { value: 'Expired', label: 'Expired' },
                            { value: 'Refund Pending', label: 'Refund Pending' },
                            { value: 'Refunded', label: 'Refunded' },
                            { value: 'Closed', label: 'Closed' }
                          ]
                    }
                    onChange={(val) => handleInputChange('status', val)}
                  />
                </InputGroup>
              </div>

              {/* Schedule Scroller - Unlock after doctor selection */}
              <div style={{ 
                marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px',
                opacity: selectedDoctor ? 1 : 0.4, pointerEvents: selectedDoctor ? 'auto' : 'none',
                transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Clinical Schedule</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => scroll('left')} style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CaretLeft size={12} weight="bold" /></button>
                    <button type="button" onClick={() => scroll('right')} style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CaretRight size={12} weight="bold" /></button>
                  </div>
                </div>
                
                <div 
                  ref={scrollRef}
                  style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}
                >
                  {availableDates.map((d, i) => (
                    <motion.div
                      key={i}
                      onClick={() => d.isAvailable && handleInputChange('date', d.fullDate)}
                      style={{
                        minWidth: '75px', padding: '0.75rem', borderRadius: '12px',
                        border: formData.date === d.fullDate 
                          ? '2px solid var(--ecare-primary)' 
                          : (d.isAvailable ? '1.5px solid white' : '1.5px dashed #cbd5e1'),
                        background: formData.date === d.fullDate 
                          ? 'var(--ecare-primary-bg)' 
                          : (d.isAvailable ? 'white' : '#f8fafc'),
                        textAlign: 'center', 
                        cursor: d.isAvailable ? 'pointer' : 'not-allowed',
                        opacity: d.isAvailable ? 1 : 0.35,
                        pointerEvents: d.isAvailable ? 'auto' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        color: formData.date === d.fullDate 
                          ? 'var(--ecare-primary)' 
                          : (d.isAvailable ? '#64748b' : '#94a3b8') 
                      }}>{d.dayName}</div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: 900, 
                        color: formData.date === d.fullDate 
                          ? 'var(--ecare-primary)' 
                          : (d.isAvailable ? 'var(--ecare-text-main)' : '#cbd5e1'), 
                        margin: '2px 0' 
                      }}>{d.dayNum}</div>
                      <div style={{ 
                        fontSize: '0.6rem', 
                        fontWeight: 700, 
                        color: formData.date === d.fullDate 
                          ? 'var(--ecare-primary)' 
                          : '#94a3b8' 
                      }}>{d.monthYear}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Time Slots - Unlock after date selection */}
              <div style={{ 
                marginBottom: '1.5rem',
                opacity: formData.date ? 1 : 0.4, pointerEvents: formData.date ? 'auto' : 'none',
                transition: 'all 0.3s'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.75rem' }}>Available Slots</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {availableSlots.length > 0 ? (
                    availableSlots.map((item, i) => {
                      const slotLabel = typeof item === 'string' ? item : item.slot
                      const isBooked = typeof item === 'object' ? !!item.isBooked : false
                      const isSelected = formData.time === slotLabel

                      if (isBooked) {
                        return (
                          <div
                            key={i}
                            title="This slot is already booked for this doctor"
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '10px',
                              border: '1.5px dashed #fca5a5',
                              background: '#fef2f2',
                              color: '#b91c1c',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              userSelect: 'none'
                            }}
                          >
                            <Lock size={12} weight="bold" color="#dc2626" />
                            <span style={{ textDecoration: 'line-through', opacity: 0.75 }}>{slotLabel}</span>
                            <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#b91c1c', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>Booked</span>
                          </div>
                        )
                      }

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleInputChange('time', slotLabel)}
                          style={{
                            padding: '0.5rem 1rem', borderRadius: '10px',
                            border: isSelected ? '2px solid var(--ecare-primary)' : '1.5px solid #f1f5f9',
                            background: isSelected ? 'var(--ecare-primary-bg)' : 'white',
                            color: isSelected ? 'var(--ecare-primary)' : 'var(--ecare-text-main)',
                            fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 0 0 2px var(--ecare-primary-bg)' : 'none'
                          }}
                        >
                          {slotLabel}
                        </button>
                      )
                    })
                  ) : (
                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', border: '1px dashed #e2e8f0' }}>
                      {formData.date ? 'No clinical slots available' : 'Select a date to view available slots'}
                    </div>
                  )}
                </div>
              </div>

              {conflictingAppointment && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700 }}>
                  This doctor is already booked on {conflictingAppointment.date} at {conflictingAppointment.time}. Please choose another slot.
                </div>
              )}

              {/* Specialty, Mode, & Services - Unlock after time selection */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem',
                opacity: formData.time ? 1 : 0.4, pointerEvents: formData.time ? 'auto' : 'none',
                transition: 'all 0.3s'
              }}>
                <InputGroup label="Medical Specialty" required>
                  <CustomSelect isMulti value={formData.specialty} options={specialtyOptions} onChange={(val) => handleInputChange('specialty', val)} placeholder="Specialties..." />
                </InputGroup>
                
                <InputGroup label="Visit Mode" required>
                  <CustomSelect 
                    value={formData.mode}
                    options={consultationModes.length > 0 
                      ? consultationModes.filter(m => m.enabled).map(m => ({ value: m.id, label: m.label }))
                      : [
                        { value: 'In-Person', label: '🏥 In-Person' },
                        { value: 'Video Consult', label: '🎥 Video Consult' },
                        { value: 'Emergency', label: '🚨 Emergency' }
                      ]
                    }
                    onChange={(val) => handleInputChange('mode', val)}
                  />
                </InputGroup>

                <div style={{ 
                  opacity: formData.specialty.length > 0 ? 1 : 0.4, pointerEvents: formData.specialty.length > 0 ? 'auto' : 'none',
                  transition: 'all 0.3s'
                }}>
                  <InputGroup label="Clinical Services" required>
                    <CustomSelect 
                      isMulti 
                      value={formData.service} 
                      options={availableServices} 
                      onChange={(val) => handleInputChange('service', val)} 
                      placeholder={formData.specialty.length > 0 ? "Services..." : "Select specialty"} 
                    />
                  </InputGroup>
                </div>
              </div>

              <InputGroup label="Clinical Notes">
                <textarea 
                  className="ecare-input" 
                  style={{ borderRadius: '12px', minHeight: '80px', padding: '0.75rem', resize: 'none', fontSize: '0.8125rem' }}
                  placeholder="Medical history or instructions..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                ></textarea>
              </InputGroup>
            </div>
          </div>

          {/* Right Panel: Payment & Summary */}
          <div style={{ flex: '0 0 320px', position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ecare-card" style={{ padding: '1.5rem', background: 'var(--ecare-primary-bg)', border: '1px solid var(--ecare-primary-light)' }}>
              {editingAppointment?.rebookCreditFrom && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: isCreditValid ? '#f0fdf4' : '#fef2f2',
                  border: isCreditValid ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isCreditValid ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isCreditValid ? '🎉 Rebooking Credit Active' : '⚠️ Rebooking Credit Inactive'}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: isCreditValid ? '#166534' : '#991b1b', lineHeight: 1.3 }}>
                    {isCreditValid 
                      ? `Your ৳${totalPrice.toLocaleString()} payment from the missed appointment is fully credited! Your booking will be confirmed at no extra charge.` 
                      : 'Rebooking credit is only valid when booking the same specialty and services. A new payment is required.'
                    }
                  </p>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} weight="duotone" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--ecare-primary)' }}>Finances</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <InputGroup label="Payment Status" required>
                  <CustomSelect 
                    value={formData.paymentStatus}
                    options={[
                      { value: 'Pending', label: '🔴 Pending' },
                      { value: 'Paid', label: '🟢 Paid' },
                      { value: 'Partially Paid', label: '🟡 Partial' }
                    ]}
                    onChange={(val) => handleInputChange('paymentStatus', val)}
                  />
                </InputGroup>
                <InputGroup label="Payment Method" required>
                  <CustomSelect value={formData.paymentMethod} options={gatewayOptions} onChange={(val) => handleInputChange('paymentMethod', val)} />
                </InputGroup>

                 {formData.paymentStatus === 'Partially Paid' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <div style={{ padding: '1rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: '4px' }}>Remaining Balance</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>৳{remainingAmount.toLocaleString()}</div>
                    </div>
                    <InputGroup label="Paid Amount" required>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8', fontSize: '0.85rem' }}>৳</span>
                        <input 
                          type="number" 
                          className="ecare-input" 
                          style={{ paddingLeft: '28px', borderRadius: '12px', fontSize: '0.8125rem' }}
                          placeholder="0.00"
                          value={formData.paidAmount}
                          onChange={(e) => handleInputChange('paidAmount', e.target.value)}
                        />
                      </div>
                    </InputGroup>
                  </motion.div>
                )}

                <div style={{ padding: '1.25rem', background: 'white', borderRadius: '16px', marginTop: '0.5rem', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Heartbeat size={18} weight="duotone" color="var(--ecare-primary)" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--ecare-text-muted)', textTransform: 'uppercase' }}>Visit Total</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      {followupStatus && (
                        <div style={{ fontSize: '0.6rem', color: 'var(--ecare-primary)', background: 'var(--ecare-primary-bg)', padding: '1px 6px', borderRadius: '4px', marginBottom: '2px', fontWeight: 700 }}>
                          FOLLOW-UP
                        </div>
                      )}
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--ecare-primary)' }}>৳{totalPrice.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <button 
                    type="submit" 
                    className="ecare-button" 
                    disabled={isSubmitting}
                    style={{ 
                      width: '100%', padding: '0.875rem', borderRadius: '12px', 
                      fontSize: '0.875rem', fontWeight: 700, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? (
                      <div className="ecare-spinner-small"></div>
                    ) : (
                      <>
                        <ShieldCheck size={20} weight="bold" />
                        {editingAppointment ? 'Save Updates' : 'Book Session'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>
    </motion.div>
  )
}

export default AddAppointment
