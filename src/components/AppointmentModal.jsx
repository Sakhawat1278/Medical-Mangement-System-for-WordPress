import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, User, UserSquare, Heartbeat, NotePencil, CheckCircle } from 'phosphor-react'
import useStore from '../store/useStore'
import CustomDatePicker from '../components/CustomDatePicker'
import CustomSelect from '../components/CustomSelect'
import CustomTimePicker from '../components/CustomTimePicker'
import toast from 'react-hot-toast'
import { Portal } from '../utils/portal'
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
  <div className="ecare-form-group" style={{ marginBottom: '0.45rem', width: '100%' }}>
    <label className="ecare-label" style={{ marginBottom: '5px', fontSize: '0.75rem', fontWeight: 600 }}>
      {required && <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>}
      {label}
    </label>
    <div style={{ width: '100%' }}>
      {children}
    </div>
    {helper && <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>{helper}</p>}
  </div>
)

const AppointmentModal = () => {
  const { 
    isAppointmentModalOpen, 
    setAppointmentModal, 
    addAppointment, 
    updateAppointment, 
    editingAppointment, 
    patients,
    doctorList,
    specialities,
    services: allServices,
    appointments,
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
    } else {
      setFormData({
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
    }
  }, [editingAppointment, isAppointmentModalOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
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
      if (appt.doctorName !== selectedDoctor.name) return false
      return overlaps(appt.time, formData.time)
    }) || null
  }, [appointments, editingAppointment, formData.date, formData.time, selectedDoctor])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (conflictingAppointment) {
      toast.error(`This doctor already has an appointment at ${conflictingAppointment.time} on ${conflictingAppointment.date}.`)
      return
    }
    const { addTransaction, addManualVerification } = useStore.getState()
    
    const appointmentData = {
      ...formData,
      specialty: Array.isArray(formData.specialty) ? formData.specialty.join(', ') : formData.specialty,
      service: Array.isArray(formData.service) ? formData.service.join(', ') : formData.service,
      price: totalPrice,
      issuedBy: user?.name || 'System'
    }

    let success = false
    let res = null

    if (editingAppointment) {
      success = await updateAppointment(editingAppointment.id, appointmentData)
      res = editingAppointment
    } else {
      res = await addAppointment(appointmentData)
      success = !!res
    }

    if (success) {
      const bookingId = res.id || res;
      
      // Handle Transaction
      addTransaction({
        appointmentId: bookingId,
        patientName: formData.patientName,
        category: 'Appointment',
        description: `Booking for ${Array.isArray(formData.service) ? formData.service.join(', ') : formData.service}`,
        amount: totalPrice,
        paidAmount: formData.paymentStatus === 'Paid' ? totalPrice : (Number(formData.paidAmount) || 0),
        status: formData.paymentStatus,
        method: formData.paymentMethod,
        date: formData.date || new Date().toISOString().split('T')[0]
      })

      // Handle Verification if needed
      if (formData.paymentStatus === 'Under Verify') {
        addManualVerification({
          patientName: formData.patientName,
          method: formData.paymentMethod,
          amount: totalPrice,
          trxId: `VER-${Math.floor(100000 + Math.random() * 900000)}`,
          senderNumber: 'Manual entry',
          linkedTxn: bookingId
        })
      }

      setAppointmentModal(false)
      
      if (appointmentData.mode === 'Video Consult') {
        toast.success('Consultation booked! Proceed to Telemed Hub for payment.', {
          icon: '💳',
          duration: 6000
        })
      } else {
        toast.success(editingAppointment ? 'Appointment updated' : 'Appointment finalized')
      }
    }
  }

  const doctorScheds = useMemo(() => {
    if (!selectedDoctor) return []
    return (doctorAvailability || []).filter(a => 
      parseInt(a.doctor_id) === parseInt(selectedDoctor.user_id) || 
      parseInt(a.doctor_id) === parseInt(selectedDoctor.id)
    )
  }, [selectedDoctor, doctorAvailability])

  const checkDateAvailability = (dateStr) => {
    if (!selectedDoctor) return true
    if (doctorScheds.length === 0) return true
    const [y, m, d] = dateStr.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
    return doctorScheds.some(s => s.day === dayName && s.status === 'Active')
  }

  const patientOptions = (patients || []).map(p => ({ value: p.name, label: `${p.name} [#PAT-${String(p.id).slice(0, 8).toUpperCase()}]` }))
  const doctorOptions = (doctorList || []).map(d => ({ value: d.name, label: `${d.name} [#DOC-${String(d.id).slice(0, 8).toUpperCase()}]` }))
  const specialtyOptions = (specialities || [])
    .filter(s => s.status === 'Active')
    .map(s => ({ value: s.name, label: s.name }))

  const pillStyle = { borderRadius: '12px', width: '100%' }

  return (
    <Portal>
      <AnimatePresence>
        {isAppointmentModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAppointmentModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{ width: '100%', maxWidth: '680px', position: 'relative', padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}
            >
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} weight="duotone" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  {editingAppointment ? 'Modify Appointment' : 'Clinical Appointment'}
                </h2>
                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Fill clinical visit details below</p>
              </div>
            </div>
            <button onClick={() => setAppointmentModal(false)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}>
              <X size={18} weight="bold" />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '0.75rem 1.75rem 1.5rem 1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputGroup label="Consultation Mode" required>
                  <CustomSelect
                    options={consultationModes.filter(m => m.enabled).map(m => ({ value: m.id, label: m.label }))}
                    value={formData.mode}
                    onChange={(val) => setFormData(prev => ({ ...prev, mode: val }))}
                    customTriggerStyle={pillStyle}
                  />
                </InputGroup>
                <InputGroup label="Patient Name" required>
                  <CustomSelect 
                    value={formData.patientName}
                    options={patientOptions}
                    onChange={(val) => handleInputChange('patientName', val)}
                    placeholder="Search patient..."
                    customTriggerStyle={pillStyle}
                  />
                </InputGroup>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <InputGroup label="Assign Doctor" required>
                  <CustomSelect 
                    value={formData.doctorName}
                    options={doctorOptions}
                    onChange={(val) => handleInputChange('doctorName', val)}
                    placeholder="Select doctor..."
                    customTriggerStyle={pillStyle}
                  />
                </InputGroup>
                <InputGroup label="Appointment Status" required>
                  <CustomSelect 
                    value={formData.status}
                    options={
                      formData.mode === 'Instant Call'
                        ? [
                            { value: 'Pending', label: '⏳ Pending' },
                            { value: 'Query', label: '🔍 Query' },
                            { value: 'Active', label: '🟢 Active' },
                            { value: 'Completed', label: '🏁 Completed' },
                            { value: 'Cancelled', label: '❌ Cancelled' },
                            { value: 'Expired', label: '⏰ Expired' },
                            { value: 'Under Verify', label: '📝 Under Verify' },
                            { value: 'Refund Pending', label: '💸 Refund Pending' },
                            { value: 'Refunded', label: '🔄 Refunded' },
                            { value: 'Closed', label: '🔒 Closed' }
                          ]
                        : [
                            { value: 'Pending', label: '⏳ Pending' },
                            { value: 'Confirmed', label: '✅ Confirmed' },
                            { value: 'Cancelled', label: '❌ Cancelled' },
                            { value: 'Completed', label: '🏁 Completed' },
                            { value: 'Expired', label: '⏰ Expired' },
                            { value: 'Refund Pending', label: '💸 Refund Pending' },
                            { value: 'Refunded', label: '🔄 Refunded' },
                            { value: 'Closed', label: '🔒 Closed' }
                          ]
                    }
                    onChange={(val) => handleInputChange('status', val)}
                    customTriggerStyle={pillStyle}
                  />
                </InputGroup>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '1rem' }}>
                <InputGroup label="Select Specialty" required>
                  <CustomSelect 
                    isMulti
                    value={formData.specialty}
                    options={specialtyOptions}
                    onChange={(val) => handleInputChange('specialty', val)}
                    placeholder="Specialties..."
                    customTriggerStyle={pillStyle}
                  />
                </InputGroup>
                <InputGroup label="Visit Date" required>
                  <CustomDatePicker 
                    value={formData.date}
                    onChange={(date) => handleInputChange('date', date)}
                    placeholder="Pick date"
                    isDateAvailable={checkDateAvailability}
                  />
                </InputGroup>
                <InputGroup label="Visit Time" required>
                  <CustomTimePicker 
                    value={formData.time}
                    onChange={(time) => handleInputChange('time', time)}
                    placeholder="Set time"
                  />
                </InputGroup>
              </div>

              {conflictingAppointment && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700 }}>
                  This doctor is already booked on {conflictingAppointment.date} at {conflictingAppointment.time}. Please choose another slot.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <InputGroup label="Select Services" required>
                  <CustomSelect 
                    isMulti
                    value={formData.service}
                    options={availableServices}
                    onChange={(val) => handleInputChange('service', val)}
                    placeholder="Clinical services..."
                    disabled={!formData.specialty || formData.specialty.length === 0}
                    customTriggerStyle={pillStyle}
                  />
                </InputGroup>
                <InputGroup label="Payment Status" required>
                  <CustomSelect 
                    value={formData.paymentStatus}
                    options={[
                      { value: 'Pending', label: '🔴 Pending' },
                      { value: 'Paid', label: '🟢 Paid' },
                      { value: 'Partially Paid', label: '🟡 Partial' },
                      { value: 'Under Verify', label: '🔍 Under Verify' }
                    ]}
                    onChange={(val) => handleInputChange('paymentStatus', val)}
                    customTriggerStyle={pillStyle}
                  />
                </InputGroup>
                <InputGroup label="Payment Method" required>
                  <CustomSelect 
                    value={formData.paymentMethod}
                    options={gatewayOptions}
                    onChange={(val) => handleInputChange('paymentMethod', val)}
                    customTriggerStyle={pillStyle}
                  />
                </InputGroup>
              </div>

              <InputGroup label="Clinical Notes">
                <textarea 
                  className="ecare-input" 
                  style={{ borderRadius: '12px', minHeight: '100px', height: 'auto', padding: '0.75rem 1rem', resize: 'none', fontSize: '0.875rem' }}
                  placeholder="Clinical symptoms, medical history or instructions..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                ></textarea>
              </InputGroup>

              <div style={{ 
                marginTop: '0.5rem', 
                padding: '1rem 1.5rem', 
                background: 'var(--ecare-primary-bg)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                border: '1px dashed var(--ecare-primary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)' }}>
                    <Heartbeat size={20} weight="duotone" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-text-muted)', textTransform: 'uppercase' }}>Total Visit Charge</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--ecare-primary)', fontWeight: 600 }}>Includes all selected clinical services</div>
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ecare-primary)', textAlign: 'right' }}>
                  {followupStatus && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--ecare-primary)', background: 'var(--ecare-primary-bg)', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>
                      FOLLOW-UP PRICING APPLIED
                    </div>
                  )}
                  <div>৳{totalPrice.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="ecare-btn-secondary" 
                  style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 600 }}
                  onClick={() => setAppointmentModal(false)}
                >
                  Discard
                </button>
                <button type="submit" className="ecare-button" style={{ padding: '0.75rem 3rem', borderRadius: '12px', fontWeight: 700 }}>
                  {editingAppointment ? 'Save Changes' : 'Finalize Booking'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default AppointmentModal
