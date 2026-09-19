import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, CheckCircle, Spinner } from 'phosphor-react'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'
import CustomSelect from './CustomSelect'
import CustomDatePicker from './CustomDatePicker'

const inp = {
  width: '100%',
  padding: '0.55rem 1rem',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '0.8rem',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
}

const Field = ({ label, children, span = 1 }) => (
  <div style={{ marginBottom: '0', gridColumn: `span ${span}` }}>
    <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>
      {label}
    </label>
    {children}
  </div>
)

export default function LabBookingModal() {
  const {
    isLabBookingModalOpen,
    setLabBookingModal,
    addLabOrder,
    addTransaction,
    patients,
    doctorList,
    labTests,
    labLocations,
    user
  } = useStore()

  const [saving, setSaving] = useState(false)
  
  const [selDiv, setSelDiv] = useState('')
  const [selDist, setSelDist] = useState('')
  const [selArea, setSelArea] = useState('')
  const [selProvider, setSelProvider] = useState('')

  const [form, setForm] = useState({
    patient_id: '',
    test_id: '',
    doctor_id: '',
    priority: 'Normal',
    order_date: '',
    notes: ''
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isLabBookingModalOpen) {
      setForm({ patient_id: '', test_id: '', doctor_id: '', priority: 'Normal', order_date: '', notes: '' })
      setSelDiv('')
      setSelDist('')
      setSelArea('')
      setSelProvider('')
    }
  }, [isLabBookingModalOpen])

  if (!isLabBookingModalOpen) return null

  const tests = Array.isArray(labTests) ? labTests : []
  const locations = Array.isArray(labLocations) ? labLocations : []
  const doctors = Array.isArray(doctorList) ? doctorList : []
  const patientList = Array.isArray(patients) ? patients : []

  const divisions = locations.filter(l => l.type === 'division')
  const districts = locations.filter(l => String(l.parent_id) === String(selDiv) && l.type === 'district')
  const areas = locations.filter(l => String(l.parent_id) === String(selDist) && l.type === 'area')
  const providers = locations.filter(l => String(l.parent_id) === String(selArea) && l.type === 'provider')
  
  const filteredTests = tests.filter(t => t.status === 'Active' && (!selProvider || String(t.location_id) === String(selProvider)))

  const placeOrder = async () => {
    if (!form.patient_id || !form.test_id) {
      toast.error('Patient and test are required')
      return
    }
    setSaving(true)
    try {
      const test = tests.find(t => String(t.id) === String(form.test_id))
      const patient = patientList.find(p => String(p.id) === String(form.patient_id))
      const doctor = doctors.find(d => String(d.id) === String(form.doctor_id))
      
      const payload = {
        ...form,
        patient_name: patient?.name || '',
        patient_user_id: patient?.user_id || 0,
        test_name: test?.name || '',
        test_code: test?.code || '',
        category: test?.category || '',
        price: test?.price || 0,
        doctor_name: doctor?.name || '',
        ordered_by_name: user?.ecareRole === 'admin' ? 'Admin' : 'Clinical Staff',
        order_date: form.order_date || new Date().toISOString().split('T')[0]
      }

      const res = await addLabOrder(payload)
      
      if (res && res.id) {
        await addTransaction({
          patientName: payload.patient_name,
          category: 'Lab Test',
          description: `Lab Test: ${payload.test_name} (${payload.test_code})`,
          amount: payload.price,
          paidAmount: 0,
          status: 'Pending',
          date: payload.order_date,
          labOrderId: res.id,
          issuedBy: payload.ordered_by_name
        })
        toast.success('Order placed and Invoice generated')
      }

      setLabBookingModal(false)
    } catch {
      toast.error('Failed to place order')
    }
    setSaving(false)
  }

  return (
    <Portal>
      <AnimatePresence>
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLabBookingModal(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="ecare-card"
          style={{ width: '100%', maxWidth: '700px', position: 'relative', padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}
        >
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} weight="bold" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Place Diagnostic Order</h3>
                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Select lab, test and assign to patient</p>
              </div>
            </div>
            <button
              onClick={() => setLabBookingModal(false)}
              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          <div style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
            <Field label="Division">
              <CustomSelect
                value={selDiv}
                onChange={v => { setSelDiv(v); setSelDist(''); setSelArea(''); setSelProvider('') }}
                options={divisions.map(l => ({ value: l.id, label: l.name }))}
                customTriggerStyle={{ borderRadius: '10px' }}
              />
            </Field>
            <Field label="District">
              <CustomSelect
                value={selDist}
                onChange={v => { setSelDist(v); setSelArea(''); setSelProvider('') }}
                options={districts.map(l => ({ value: l.id, label: l.name }))}
                customTriggerStyle={{ borderRadius: '10px' }}
                disabled={!selDiv}
              />
            </Field>
            <Field label="Upazila/Area">
              <CustomSelect
                value={selArea}
                onChange={v => { setSelArea(v); setSelProvider('') }}
                options={areas.map(l => ({ value: l.id, label: l.name }))}
                customTriggerStyle={{ borderRadius: '10px' }}
                disabled={!selDist}
              />
            </Field>
            <Field label="Lab Provider">
              <CustomSelect
                value={selProvider}
                onChange={v => { setSelProvider(v); setForm({ ...form, test_id: '' }) }}
                options={providers.map(l => ({ value: l.id, label: l.name }))}
                customTriggerStyle={{ borderRadius: '10px' }}
                disabled={!selArea}
              />
            </Field>

            <Field label="Patient" span={2}>
              <CustomSelect
                value={form.patient_id}
                onChange={v => setForm({ ...form, patient_id: v })}
                options={patientList.map(p => ({ value: p.id, label: `${p.name} [#PAT-${String(p.id).slice(0, 8).toUpperCase()}]` }))}
                isSearchable={true}
                customTriggerStyle={{ borderRadius: '10px' }}
              />
            </Field>
            
            <Field label="Select Lab Test" span={2}>
              <CustomSelect
                value={form.test_id}
                onChange={v => setForm({ ...form, test_id: v })}
                options={filteredTests.map(t => ({ value: t.id, label: `${t.name} (${t.code}) [#LAB-${String(t.id).slice(0, 8).toUpperCase()}] - ৳${t.price}` }))}
                isSearchable={true}
                customTriggerStyle={{ borderRadius: '10px' }}
                disabled={!selProvider && providers.length > 0}
              />
            </Field>

            <Field label="Referring Doctor (Optional)">
              <CustomSelect
                value={form.doctor_id}
                onChange={v => setForm({ ...form, doctor_id: v })}
                options={doctors.map(d => ({ value: d.id, label: `${d.name} [#DOC-${String(d.id).slice(0, 8).toUpperCase()}]` }))}
                isSearchable={true}
                customTriggerStyle={{ borderRadius: '10px' }}
              />
            </Field>
            <Field label="Order Priority">
              <CustomSelect
                value={form.priority}
                onChange={v => setForm({ ...form, priority: v })}
                options={['Normal', 'Urgent', 'STAT'].map(s => ({ value: s, label: s }))}
                customTriggerStyle={{ borderRadius: '10px' }}
              />
            </Field>
            <Field label="Order Date" span={2}>
              <CustomDatePicker
                value={form.order_date}
                onChange={v => setForm({ ...form, order_date: v })}
              />
            </Field>
            <Field label="Clinical Notes" span={2}>
              <textarea
                style={{ ...inp, height: '80px', resize: 'none' }}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Any clinical history or specific instructions..."
              />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: '1rem', padding: '0 1.5rem 1.25rem' }}>
            <button onClick={() => setLabBookingModal(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px' }}>
              Cancel
            </button>
            <button onClick={placeOrder} className="ecare-button" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={saving}>
              {saving ? <Spinner className="ecare-spin" /> : <CheckCircle size={18} weight="bold" />}
              Confirm Order
            </button>
          </div>
        </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  )
}
