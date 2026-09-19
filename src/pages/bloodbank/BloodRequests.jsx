import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FirstAid, Plus, PencilSimple, Trash, X, CheckCircle, Drop, WarningCircle, ArrowRight } from 'phosphor-react'
import DataTable from '../../components/DataTable'
import CustomSelect from '../../components/CustomSelect'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map(g => ({ value: g, label: g }))

const COMPONENT_OPTIONS = [
  { value: 'Whole Blood', label: 'Whole Blood' },
  { value: 'Packed RBC', label: 'Packed RBC' },
  { value: 'Platelets', label: 'Platelets' },
  { value: 'Fresh Frozen Plasma', label: 'Fresh Frozen Plasma' }
]

const URGENCY_OPTIONS = [
  { value: 'Emergency', label: 'Emergency (STAT)' },
  { value: 'Urgent', label: 'Urgent (Within 4h)' },
  { value: 'Normal', label: 'Routine (Scheduled)' }
]

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Fulfilled', label: 'Fulfilled' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' }
]

const BloodRequests = () => {
  const { 
    user,
    bloodRequests, 
    bloodInventory, 
    addBloodRequest, 
    updateBloodRequest, 
    deleteBloodRequest, 
    updateBloodBag,
    openConfirm 
  } = useStore()

  const isPatient = user?.ecareRole === 'patient'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)
  const [fulfillingRequest, setFulfillingRequest] = useState(null)
  const [selectedBagToDispense, setSelectedBagToDispense] = useState('')

  const [formData, setFormData] = useState({
    requester_name: isPatient ? (user?.name || '') : '',
    patient_name: isPatient ? (user?.name || '') : '',
    hospital_name: '',
    contact_phone: isPatient ? (user?.phone || '') : '',
    blood_group: isPatient ? (user?.blood_group || user?.bloodGroup || 'O+') : 'O+',
    component: 'Whole Blood',
    units_required: 1,
    urgency: 'Urgent',
    status: 'Pending',
    notes: '',
    request_date: new Date().toISOString().split('T')[0]
  })

  const resetForm = () => {
    setFormData({
      requester_name: isPatient ? (user?.name || '') : '',
      patient_name: isPatient ? (user?.name || '') : '',
      hospital_name: '',
      contact_phone: isPatient ? (user?.phone || '') : '',
      blood_group: isPatient ? (user?.blood_group || user?.bloodGroup || 'O+') : 'O+',
      component: 'Whole Blood',
      units_required: 1,
      urgency: 'Urgent',
      status: 'Pending',
      notes: '',
      request_date: new Date().toISOString().split('T')[0]
    })
    setEditingRequest(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (req) => {
    setEditingRequest(req)
    setFormData({
      requester_name: req.requester_name || '',
      patient_name: req.patient_name || '',
      hospital_name: req.hospital_name || '',
      contact_phone: req.contact_phone || req.phone || '',
      blood_group: req.blood_group || 'O+',
      component: req.component || 'Whole Blood',
      units_required: req.units_required || 1,
      urgency: req.urgency || 'Urgent',
      status: req.status || 'Pending',
      notes: req.notes || '',
      request_date: req.request_date || new Date().toISOString().split('T')[0]
    })
    setIsAddModalOpen(true)
  }

  const handleOpenFulfill = (req) => {
    setFulfillingRequest(req)
    // Find matching available bags
    const matching = (bloodInventory || []).filter(b => 
      b.status === 'Available' && 
      b.blood_group === req.blood_group
    )
    if (matching.length > 0) {
      setSelectedBagToDispense(matching[0].id)
    } else {
      setSelectedBagToDispense('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patient_name || !formData.hospital_name || !formData.blood_group) {
      toast.error('Patient name, hospital name, and blood group are required')
      return
    }

    if (editingRequest) {
      await updateBloodRequest(editingRequest.id, {
        ...editingRequest,
        ...formData
      })
      toast.success('Request updated successfully')
    } else {
      await addBloodRequest({
        ...formData,
        patient_user_id: user?.id || null,
        created_at: new Date().toISOString()
      })
      toast.success('Blood requisition created')
    }

    setIsAddModalOpen(false)
    resetForm()
  }

  const handleConfirmFulfill = async () => {
    if (!selectedBagToDispense) {
      toast.error('Please select an available blood bag to dispense')
      return
    }

    const bag = (bloodInventory || []).find(b => b.id === selectedBagToDispense)
    if (!bag) {
      toast.error('Selected bag not found')
      return
    }

    // 1. Update Bag to Dispensed
    await updateBloodBag(bag.id, {
      ...bag,
      status: 'Dispensed',
      dispensed_to: fulfillingRequest.patient_name,
      dispensed_at: new Date().toISOString()
    })

    // 2. Update Request to Fulfilled
    await updateBloodRequest(fulfillingRequest.id, {
      ...fulfillingRequest,
      status: 'Fulfilled',
      fulfilled_bag_id: bag.bag_number,
      fulfilled_at: new Date().toISOString()
    })

    toast.success(`Success! Bag #${bag.bag_number} dispensed to ${fulfillingRequest.patient_name}.`)
    setFulfillingRequest(null)
  }

  // Available matching bags for the fulfilling modal
  const matchingBags = useMemo(() => {
    if (!fulfillingRequest) return []
    return (bloodInventory || []).filter(b => 
      b.status === 'Available' && 
      b.blood_group === fulfillingRequest.blood_group
    )
  }, [fulfillingRequest, bloodInventory])

  const matchingBagOptions = useMemo(() => {
    return matchingBags.map(bag => ({
      value: bag.id,
      label: `Bag #${bag.bag_number} — ${bag.component || 'Whole Blood'} (${bag.volume || 450}ml) • Exp: ${bag.expiry_date || 'N/A'} • ${bag.storage_location || 'Fridge'}`
    }))
  }, [matchingBags])

  const patientRequests = useMemo(() => {
    if (!isPatient) return bloodRequests || []
    return (bloodRequests || []).filter(r => 
      (r.patient_user_id && String(r.patient_user_id) === String(user?.id)) ||
      (r.user_id && String(r.user_id) === String(user?.id)) ||
      (r.patient_name && r.patient_name.toLowerCase() === (user?.name || '').toLowerCase()) ||
      (r.requester_name && r.requester_name.toLowerCase() === (user?.name || '').toLowerCase())
    )
  }, [bloodRequests, isPatient, user])

  const columns = [
    { 
      key: 'patient_name', 
      label: 'Patient & Hospital', 
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--ecare-text-main)' }}>{val || row.requester_name}</div>
          <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
            {row.hospital_name || 'Hospital'} {row.contact_phone ? `• ${row.contact_phone}` : ''}
          </div>
        </div>
      )
    },
    { 
      key: 'blood_group', 
      label: 'Group Needed', 
      sortable: true, 
      render: (val) => (
        <span style={{ 
          display: 'inline-block',
          padding: '4px 10px', 
          borderRadius: '6px', 
          background: '#fee2e2', 
          color: '#dc2626', 
          fontWeight: 900,
          fontSize: '0.85rem'
        }}>
          {val}
        </span>
      )
    },
    { 
      key: 'units_required', 
      label: 'Volume',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>{val || 1} Bag(s)</div>
          <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{row.component || 'Whole Blood'}</div>
        </div>
      )
    },
    { 
      key: 'urgency', 
      label: 'Urgency',
      render: (val) => {
        let color = '#dc2626', bg = '#fee2e2'
        if (val === 'Urgent') { color = '#d97706'; bg = '#fef3c7' }
        else if (val === 'Normal') { color = '#2563eb'; bg = '#dbeafe' }
        return (
          <span style={{ 
            background: bg, 
            color: color, 
            padding: '3px 8px', 
            borderRadius: '4px', 
            fontSize: '0.725rem', 
            fontWeight: 800,
            textTransform: 'uppercase'
          }}>
            {val || 'Routine'}
          </span>
        )
      }
    },
    { 
      key: 'request_date', 
      label: 'Date', 
      type: 'date' 
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (val, row) => {
        let bg = '#fef9c3', color = '#ca8a04'
        if (val === 'Fulfilled') { bg = '#dcfce7'; color = '#16a34a' }
        else if (val === 'Rejected' || val === 'Cancelled') { bg = '#fee2e2'; color = '#dc2626' }
        return (
          <div>
            <span style={{ 
              background: bg, 
              color: color, 
              padding: '3px 8px', 
              borderRadius: '4px', 
              fontSize: '0.725rem', 
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>
              {val || 'Pending'}
            </span>
            {row.fulfilled_bag_id && (
              <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '2px' }}>
                Bag #{row.fulfilled_bag_id}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const isOwn = !isPatient || 
          (row.patient_user_id && String(row.patient_user_id) === String(user?.id)) ||
          (row.patient_name && row.patient_name.toLowerCase() === (user?.name || '').toLowerCase()) ||
          (row.requester_name && row.requester_name.toLowerCase() === (user?.name || '').toLowerCase())

        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {!isPatient && row.status !== 'Fulfilled' && (
              <button
                onClick={() => handleOpenFulfill(row)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--ecare-primary)',
                  color: '#ffffff',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Dispense Blood Bag"
              >
                <CheckCircle size={14} weight="bold" />
                <span>Fulfill</span>
              </button>
            )}
            {(!isPatient || (isOwn && row.status === 'Pending')) && (
              <button
                onClick={() => handleOpenEdit(row)}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer'
                }}
                title="Edit Requisition"
              >
                <PencilSimple size={15} weight="bold" />
              </button>
            )}
            {(!isPatient || (isOwn && row.status === 'Pending')) && (
              <button
                onClick={() => {
                  openConfirm({
                    title: isPatient ? 'Cancel Blood Requisition' : 'Delete Blood Requisition',
                    message: isPatient
                      ? `Are you sure you want to cancel your request for ${row.blood_group} blood?`
                      : `Are you sure you want to remove this request for "${row.patient_name}"?`,
                    onConfirm: () => isPatient ? updateBloodRequest(row.id, { ...row, status: 'Cancelled' }) : deleteBloodRequest(row.id)
                  })
                }}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                  background: '#fff',
                  color: '#ef4444',
                  cursor: 'pointer'
                }}
                title={isPatient ? 'Cancel Requisition' : 'Delete'}
              >
                {isPatient ? <X size={15} weight="bold" /> : <Trash size={15} weight="bold" />}
              </button>
            )}
          </div>
        )
      }
    }
  ]

  const filterOptions = [
    { label: 'Pending Requests', value: 'Pending' },
    { label: 'Fulfilled Requests', value: 'Fulfilled' },
    { label: 'Emergency Urgency', value: 'Emergency' },
    { label: 'Urgent Priority', value: 'Urgent' }
  ]

  return (
    <div className="ecare-page-slide">
      {isPatient && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
            <FirstAid size={22} weight="duotone" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e40af' }}>
              Patient Blood Requisition Center
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
              Submit an emergency or scheduled blood request for yourself or family members. Hospital staff reviews compatibility, tests units, and coordinates delivery directly with your clinic or surgical ward.
            </div>
          </div>
        </div>
      )}

      <DataTable
        title={isPatient ? "My Blood Requisitions" : "Blood Requisitions & Emergency Requests"}
        columns={columns}
        data={isPatient ? patientRequests : (bloodRequests || [])}
        onAdd={handleOpenAdd}
        addLabel={isPatient ? "New Blood Request" : "New Request"}
        filterOptions={filterOptions}
        searchPlaceholder={isPatient ? "Search my requisitions..." : "Search by patient, hospital, doctor, or blood group..."}
      />

      {/* ─── Add / Edit Request Modal ──────────────────────────────── */}
      <Portal>
        <AnimatePresence>
          {isAddModalOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsAddModalOpen(false)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="ecare-card"
                style={{ 
                  width: '100%', maxWidth: '520px', maxHeight: '90vh', position: 'relative', 
                  padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', background: '#fef2f2', borderBottom: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FirstAid size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>
                        {editingRequest ? 'Edit Blood Requisition' : 'Create Blood Requisition'}
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: '#b91c1c', margin: 0 }}>Clinical or emergency blood allocation request</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Patient Name *</label>
                      <input 
                        type="text" 
                        required 
                        className="ecare-input" 
                        placeholder="Patient Full Name"
                        value={formData.patient_name} 
                        onChange={e => setFormData({ ...formData, patient_name: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Contact Phone</label>
                      <input 
                        type="tel" 
                        className="ecare-input" 
                        placeholder="+880..."
                        value={formData.contact_phone} 
                        onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Hospital / Clinic / Ward *</label>
                      <input 
                        type="text" 
                        required 
                        className="ecare-input" 
                        placeholder="e.g. City Hospital ICU 3"
                        value={formData.hospital_name} 
                        onChange={e => setFormData({ ...formData, hospital_name: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Attending Doctor / Requester</label>
                      <input 
                        type="text" 
                        className="ecare-input" 
                        placeholder="Dr. Name or Dept"
                        value={formData.requester_name} 
                        onChange={e => setFormData({ ...formData, requester_name: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Blood Group *</label>
                      <CustomSelect 
                        value={formData.blood_group} 
                        onChange={val => setFormData({ ...formData, blood_group: val })}
                        options={BLOOD_GROUP_OPTIONS}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Units (Bags)</label>
                      <input 
                        type="number" 
                        min="1"
                        max="10"
                        className="ecare-input" 
                        value={formData.units_required} 
                        onChange={e => setFormData({ ...formData, units_required: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Urgency</label>
                      <CustomSelect 
                        value={formData.urgency} 
                        onChange={val => setFormData({ ...formData, urgency: val })}
                        options={URGENCY_OPTIONS}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isPatient ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Component</label>
                      <CustomSelect 
                        value={formData.component} 
                        onChange={val => setFormData({ ...formData, component: val })}
                        options={COMPONENT_OPTIONS}
                      />
                    </div>
                    {!isPatient && (
                      <div className="ecare-form-group">
                        <label className="ecare-label">Request Status</label>
                        <CustomSelect 
                          value={formData.status} 
                          onChange={val => setFormData({ ...formData, status: val })}
                          options={STATUS_OPTIONS}
                        />
                      </div>
                    )}
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Clinical Indication / Diagnosis Notes</label>
                    <textarea 
                      rows={2}
                      className="ecare-input" 
                      placeholder="e.g. Major surgery at 4 PM, Hb 7.2 g/dL"
                      value={formData.notes} 
                      onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem' }}>
                      {editingRequest ? 'Save Changes' : 'Submit Requisition'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* ─── Fulfill Request Modal ──────────────────────────────────── */}
      <Portal>
        <AnimatePresence>
          {fulfillingRequest && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setFulfillingRequest(null)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="ecare-card"
                style={{ 
                  width: '100%', maxWidth: '480px', maxHeight: '90vh', position: 'relative', 
                  padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', background: '#dcfce7', borderBottom: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ffffff', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={22} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#166534' }}>
                        Dispense & Fulfill Requisition
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: '#15803d', margin: 0 }}>
                        Allocate verified {fulfillingRequest.blood_group} unit to {fulfillingRequest.patient_name}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setFulfillingRequest(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <div><strong>Patient:</strong> {fulfillingRequest.patient_name}</div>
                    <div><strong>Hospital / Ward:</strong> {fulfillingRequest.hospital_name}</div>
                    <div><strong>Blood Group Requested:</strong> <span style={{ color: '#dc2626', fontWeight: 900 }}>{fulfillingRequest.blood_group}</span> ({fulfillingRequest.component || 'Whole Blood'})</div>
                  </div>

                  {matchingBags.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: '#fee2e2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                      <WarningCircle size={28} weight="fill" color="#dc2626" style={{ margin: '0 auto 6px', display: 'block' }} />
                      <strong style={{ color: '#991b1b', fontSize: '0.9rem' }}>No Available {fulfillingRequest.blood_group} Bags</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#b91c1c' }}>
                        Current cold chain inventory has 0 units of this blood group. Please collect blood or transfer from another branch.
                      </p>
                    </div>
                  ) : (
                    <div className="ecare-form-group">
                      <label className="ecare-label">Select Blood Bag to Dispense *</label>
                      <CustomSelect
                        value={selectedBagToDispense}
                        onChange={val => setSelectedBagToDispense(val)}
                        options={matchingBagOptions}
                        placeholder="Select available blood bag..."
                      />
                      <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px' }}>
                        {matchingBags.length} compatible units available in inventory.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setFulfillingRequest(null)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={handleConfirmFulfill} 
                      disabled={matchingBags.length === 0}
                      className="ecare-button" 
                      style={{ flex: 2, padding: '0.65rem', background: matchingBags.length === 0 ? '#94a3b8' : 'var(--ecare-primary)' }}
                    >
                      Confirm & Dispense
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  )
}

export default BloodRequests
