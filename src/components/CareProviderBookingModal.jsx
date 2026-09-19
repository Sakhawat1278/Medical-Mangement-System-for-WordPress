import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, NotePencil, CheckCircle, Package } from 'phosphor-react'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'
import CustomDatePicker from '../components/CustomDatePicker'
import CustomSelect from '../components/CustomSelect'
import CustomTimePicker from '../components/CustomTimePicker'
import { formatPaymentMethod } from '../utils/formatters'

const CareProviderBookingModal = () => {
  const { 
    isCareProviderBookingModalOpen, 
    setCareProviderBookingModal, 
    addCareProviderBooking, 
    updateCareProviderBooking, 
    editingCareProviderBooking, 
    patients,
    careProviders,
    servicePricing,
    user,
    paymentGateways
  } = useStore()

  const [formData, setFormData] = useState({
    patientName: '',
    providerName: '',
    duration: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM',
    location: '',
    notes: '',
    paymentStatus: 'Pending',
    paymentMethod: 'Cash',
    status: 'Pending',
    paidAmount: ''
  })

  useEffect(() => {
    if (editingCareProviderBooking) {
      setFormData({
        patientName: editingCareProviderBooking.patientName || '',
        providerName: editingCareProviderBooking.providerName || '',
        duration: editingCareProviderBooking.duration || '',
        price: editingCareProviderBooking.price || '',
        date: editingCareProviderBooking.date || '',
        time: editingCareProviderBooking.time || '',
        location: editingCareProviderBooking.location || '',
        notes: editingCareProviderBooking.notes || '',
        paymentStatus: editingCareProviderBooking.paymentStatus || 'Pending',
        paymentMethod: editingCareProviderBooking.paymentMethod || 'Cash',
        status: editingCareProviderBooking.status || 'Pending',
        paidAmount: editingCareProviderBooking.paidAmount || ''
      })
    } else {
      setFormData({
        patientName: '',
        providerName: '',
        duration: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00 AM',
        location: '',
        notes: '',
        paymentStatus: 'Pending',
        paymentMethod: 'Cash',
        status: 'Pending',
        paidAmount: ''
      })
    }
  }, [editingCareProviderBooking, isCareProviderBookingModalOpen])

  const patientOptions = (patients || []).map(p => ({ value: p.name, label: `${p.name} [#PAT-${String(p.id).slice(0, 8).toUpperCase()}]` }))
  const providerOptions = (careProviders || []).map(cp => ({ value: cp.name, label: `${cp.name} [#PRO-${String(cp.id).slice(0, 8).toUpperCase()}]` }))

  const durationOptions = (servicePricing || []).map(p => ({ 
    value: p.duration, 
    label: `${p.duration} — ৳${Number(p.price).toLocaleString()}` 
  }))

  const gatewayOptions = Object.entries(paymentGateways || {})
    .filter(([, gateway]) => gateway.enabled)
    .map(([key, gateway]) => ({ value: formatPaymentMethod(gateway.name || key), label: formatPaymentMethod(gateway.name || key) }))

  const handleInputChange = (field, value) => {
    if (field === 'duration') {
      const selected = (servicePricing || []).find(p => p.duration === value)
      setFormData(prev => ({ 
        ...prev, 
        duration: value, 
        price: selected ? selected.price : prev.price 
      }))
    } else if (field === 'patientName') {
      const patient = (patients || []).find(p => (p.name || p.patientName) === value)
      setFormData(prev => ({ 
        ...prev, 
        patientName: value,
        location: patient?.address || prev.location
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { addTransaction } = useStore.getState()

    if (editingCareProviderBooking) {
      updateCareProviderBooking(editingCareProviderBooking.id, { ...formData, issuedBy: user?.name || 'System' })
    } else {
      const res = await addCareProviderBooking({ ...formData, issuedBy: user?.name || 'System' })
      const bookingId = res.id || res;
      if (res) {
        addTransaction({
          careProviderBookingId: bookingId,
          patientName: formData.patientName,
          category: 'Care Provider',
          description: `Home Care for ${formData.duration}`,
          amount: Number(formData.price),
          paidAmount: formData.paymentStatus === 'Paid' ? Number(formData.price) : (Number(formData.paidAmount) || 0),
          status: formData.paymentStatus,
          method: formData.paymentMethod,
          date: formData.date || new Date().toISOString().split('T')[0]
        })
      }
    }
    setCareProviderBookingModal(false)
  }

  if (!isCareProviderBookingModalOpen) return null

  return (
    <Portal>
      <AnimatePresence>
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCareProviderBookingModal(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="ecare-card"
            style={{ 
              width: '100%', maxWidth: '820px', position: 'relative',
              padding: 0, border: 'none', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
          {/* Header */}
          <div style={{ 
            padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            background: '#f8fafc' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '38px', height: '38px', borderRadius: '10px', 
                background: 'white', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151'
              }}>
                <Package size={20} weight="duotone" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  {editingCareProviderBooking ? 'Coordinate Care Service' : 'New Provider Booking'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>
                  {editingCareProviderBooking ? 'Update care assignment details' : 'Coordinate home care or clinical assistance request'}
                </p>
              </div>
            </div>
            <button onClick={() => setCareProviderBookingModal(false)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}>
              <X size={18} weight="bold" />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem' }}>
              <div className="ecare-form-group">
                <label className="ecare-label">Select Patient</label>
                <CustomSelect 
                  value={formData.patientName}
                  onChange={(val) => handleInputChange('patientName', val)}
                  options={patientOptions}
                  placeholder="Search patients..."
                  isSearchable={true}
                  onAdd={(val) => handleInputChange('patientName', val)}
                  addLabel="Use"
                />
              </div>
              <div className="ecare-form-group">
                <label className="ecare-label">Assign Provider</label>
                <CustomSelect 
                  value={formData.providerName}
                  onChange={(val) => handleInputChange('providerName', val)}
                  options={providerOptions}
                  placeholder="Choose provider..."
                  isSearchable={true}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem 1.25rem' }}>
              <div className="ecare-form-group">
                <label className="ecare-label">Service Plan & Duration</label>
                <CustomSelect 
                  value={formData.duration}
                  onChange={(val) => handleInputChange('duration', val)}
                  options={durationOptions}
                  placeholder="Choose service plan..."
                />
              </div>
              <div className="ecare-form-group">
                <label className="ecare-label">Payment Information</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <CustomSelect 
                      value={formData.paymentMethod}
                      onChange={(val) => handleInputChange('paymentMethod', val)}
                      options={gatewayOptions}
                      placeholder="Method"
                    />
                    <CustomSelect 
                      value={formData.paymentStatus}
                      onChange={(val) => handleInputChange('paymentStatus', val)}
                      options={[
                        { value: 'Paid', label: 'Paid' },
                        { value: 'Partially Paid', label: 'Partial' },
                        { value: 'Pending', label: 'Pending' },
                        { value: 'Under Verify', label: 'Verify' }
                      ]}
                      placeholder="Status"
                    />
                  </div>

                  {formData.paymentStatus === 'Partially Paid' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f0f9ff', padding: '0.75rem', borderRadius: '12px', border: '1px solid #bae6fd' }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', minWidth: '100px' }}>Amount Paid (৳)</div>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        style={{ height: '36px', borderRadius: '8px', border: '1px solid #7dd3fc', padding: '0 0.75rem' }}
                        placeholder="Enter paid amount..."
                        value={formData.paidAmount}
                        onChange={(e) => handleInputChange('paidAmount', e.target.value)}
                      />
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0369a1' }}>
                        Due: ৳{(Number(formData.price) - (Number(formData.paidAmount) || 0)).toLocaleString()}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem' }}>
              <div className="ecare-form-group">
                <label className="ecare-label">Scheduled Date</label>
                <CustomDatePicker 
                  value={formData.date}
                  onChange={(val) => handleInputChange('date', val)}
                  placeholder="Select date"
                />
              </div>
              <div className="ecare-form-group">
                <label className="ecare-label">Start Time</label>
                <CustomTimePicker 
                  value={formData.time}
                  onChange={(val) => handleInputChange('time', val)}
                  placeholder="Set time"
                />
              </div>
            </div>

            <div className="ecare-form-group">
              <label className="ecare-label">Service Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--ecare-primary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                <input 
                  type="text" className="ecare-input" style={{ paddingLeft: '2.75rem' }} placeholder="Enter visit address..."
                  value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} required
                />
              </div>
            </div>

            <div className="ecare-form-group">
              <label className="ecare-label">Clinical Notes & Special Requirements</label>
              <div style={{ position: 'relative' }}>
                <NotePencil size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px', zIndex: 2 }} />
                <textarea 
                  className="ecare-input" style={{ paddingLeft: '2.75rem', minHeight: '80px', paddingTop: '10px' }} 
                  placeholder="Specific requirements or medical history..."
                  value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>

            <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.75rem 1.15rem', 
                background: '#f0f9ff', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                border: '1px dashed #0ea5e9',
                marginBottom: '0.5rem'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                  <Package size={20} weight="duotone" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Service Charge</div>
                  <div style={{ fontSize: '0.65rem', color: '#0ea5e9', fontWeight: 600 }}>Based on selected duration</div>
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0ea5e9' }}>
                ৳{Number(formData.price || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" className="ecare-btn-secondary" onClick={() => setCareProviderBookingModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600 }}>Discard</button>
              <button 
                type="submit" 
                className="ecare-button" 
                style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <CheckCircle size={18} weight="bold" />
                {editingCareProviderBooking ? 'Save Changes' : 'Confirm & Schedule'}
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  )
}

export default CareProviderBookingModal
