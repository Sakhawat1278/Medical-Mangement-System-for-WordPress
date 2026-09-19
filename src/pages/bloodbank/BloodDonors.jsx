import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Plus, PencilSimple, Trash, X, Drop, ShieldCheck, CheckCircle } from 'phosphor-react'
import DataTable from '../../components/DataTable'
import CustomSelect from '../../components/CustomSelect'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map(g => ({ value: g, label: g }))

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
]

const ELIGIBILITY_OPTIONS = [
  { value: 'Eligible', label: 'Eligible' },
  { value: 'Deferred', label: 'Deferred (Temporary)' },
  { value: 'Ineligible', label: 'Ineligible' }
]

const DONATION_COMPONENT_OPTIONS = [
  { value: 'Whole Blood', label: 'Whole Blood (450ml)' },
  { value: 'Packed RBC', label: 'Packed RBC (250ml)' },
  { value: 'Platelets', label: 'Platelets (50ml)' },
  { value: 'Fresh Frozen Plasma', label: 'Plasma (200ml)' }
]

const BloodDonors = () => {
  const { 
    user,
    bloodDonors, 
    addBloodDonor, 
    updateBloodDonor, 
    deleteBloodDonor, 
    addBloodBag, 
    openConfirm 
  } = useStore()

  const isPatient = user?.ecareRole === 'patient'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLogDonationModalOpen, setIsLogDonationModalOpen] = useState(false)
  const [editingDonor, setEditingDonor] = useState(null)
  const [selectedDonorForDonation, setSelectedDonorForDonation] = useState(null)

  const [formData, setFormData] = useState({
    name: isPatient ? (user?.name || '') : '',
    blood_group: isPatient ? (user?.blood_group || user?.bloodGroup || 'O+') : 'O+',
    contact_number: isPatient ? (user?.phone || '') : '',
    email: isPatient ? (user?.email || '') : '',
    gender: 'Male',
    age: '',
    weight: '',
    city: '',
    health_status: 'Healthy & Cleared',
    status: 'Eligible',
    last_donation_date: new Date().toISOString().split('T')[0],
    total_donations: 1
  })

  // Log donation form state
  const [donationForm, setDonationForm] = useState({
    bag_number: '',
    component: 'Whole Blood',
    volume: 450,
    storage_location: 'Fridge A - Shelf 1',
    collection_date: new Date().toISOString().split('T')[0],
    expiry_date: (() => {
      const d = new Date()
      d.setDate(d.getDate() + 35)
      return d.toISOString().split('T')[0]
    })()
  })

  const resetForm = () => {
    setFormData({
      name: isPatient ? (user?.name || '') : '',
      blood_group: isPatient ? (user?.blood_group || user?.bloodGroup || 'O+') : 'O+',
      contact_number: isPatient ? (user?.phone || '') : '',
      email: isPatient ? (user?.email || '') : '',
      gender: 'Male',
      age: '',
      weight: '',
      city: '',
      health_status: 'Healthy & Cleared',
      status: 'Eligible',
      last_donation_date: new Date().toISOString().split('T')[0],
      total_donations: 1
    })
    setEditingDonor(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (donor) => {
    setEditingDonor(donor)
    setFormData({
      name: donor.name || '',
      blood_group: donor.blood_group || 'O+',
      contact_number: donor.contact_number || donor.phone || '',
      email: donor.email || '',
      gender: donor.gender || 'Male',
      age: donor.age || '',
      weight: donor.weight || '',
      city: donor.city || '',
      health_status: donor.health_status || 'Healthy & Cleared',
      status: donor.status || 'Eligible',
      last_donation_date: donor.last_donation_date || '',
      total_donations: donor.total_donations || 1
    })
    setIsAddModalOpen(true)
  }

  const handleOpenLogDonation = (donor) => {
    setSelectedDonorForDonation(donor)
    const d = new Date()
    d.setDate(d.getDate() + 35)
    setDonationForm({
      bag_number: `BLD-${Math.floor(10000 + Math.random() * 90000)}`,
      component: 'Whole Blood',
      volume: 450,
      storage_location: 'Fridge A - Shelf 1',
      collection_date: new Date().toISOString().split('T')[0],
      expiry_date: d.toISOString().split('T')[0]
    })
    setIsLogDonationModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.contact_number || !formData.blood_group) {
      toast.error('Donor name, phone number, and blood group are required')
      return
    }

    if (Number(formData.weight) > 0 && Number(formData.weight) < 50) {
      toast.error('Donor weight must be at least 50 kg')
      return
    }

    if (editingDonor) {
      await updateBloodDonor(editingDonor.id, {
        ...editingDonor,
        ...formData
      })
      toast.success('Donor profile updated')
    } else {
      await addBloodDonor({
        ...formData,
        patient_user_id: user?.id || null,
        created_at: new Date().toISOString()
      })
      toast.success('New donor registered successfully')
    }

    setIsAddModalOpen(false)
    resetForm()
  }

  const handleSaveDonation = async (e) => {
    e.preventDefault()
    if (!selectedDonorForDonation) return

    // 1. Add Blood Bag
    await addBloodBag({
      bag_number: donationForm.bag_number,
      blood_group: selectedDonorForDonation.blood_group,
      component: donationForm.component,
      volume: donationForm.volume,
      storage_location: donationForm.storage_location,
      collection_date: donationForm.collection_date,
      expiry_date: donationForm.expiry_date,
      donor_id: selectedDonorForDonation.id,
      donor_name: selectedDonorForDonation.name,
      status: 'Available',
      tested_negative: true,
      created_at: new Date().toISOString()
    })

    // 2. Update Donor's last donation date and count
    const updatedCount = (Number(selectedDonorForDonation.total_donations) || 0) + 1
    await updateBloodDonor(selectedDonorForDonation.id, {
      ...selectedDonorForDonation,
      last_donation_date: donationForm.collection_date,
      total_donations: updatedCount
    })

    toast.success(`Donation logged! Bag #${donationForm.bag_number} added to inventory.`)
    setIsLogDonationModalOpen(false)
    setSelectedDonorForDonation(null)
  }

  const columns = [
    { 
      key: 'name', 
      label: 'Donor Name & Tier', 
      sortable: true,
      render: (val, row) => {
        const donations = Number(row.total_donations) || 1
        let tierLabel = 'Bronze Donor'
        let tierColor = '#92400e'
        let tierBg = '#fef3c7'
        if (donations >= 6) {
          tierLabel = 'Gold Hero'
          tierColor = '#b45309'
          tierBg = '#fef08a'
        } else if (donations >= 3) {
          tierLabel = 'Silver Donor'
          tierColor = '#475569'
          tierBg = '#f1f5f9'
        }

        return (
          <div>
            <div style={{ fontWeight: 800, color: 'var(--ecare-text-main)', fontSize: '0.875rem' }}>{val}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: tierBg, color: tierColor }}>
                {tierLabel} ({donations}x)
              </span>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>{row.gender || '—'}, {row.age ? `${row.age} yrs` : ''}</span>
            </div>
          </div>
        )
      }
    },
    { 
      key: 'blood_group', 
      label: 'Blood Group', 
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
      key: 'contact_number', 
      label: 'Contact Details',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{val || row.phone || '—'}</div>
          {row.email && <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{row.email}</div>}
        </div>
      )
    },
    { 
      key: 'last_donation_date', 
      label: 'Last Donated', 
      type: 'date',
      render: (val) => {
        if (!val) return <span style={{ color: '#94a3b8' }}>Never</span>
        const days = Math.floor((new Date().getTime() - new Date(val).getTime()) / (1000 * 60 * 60 * 24))
        const isEligible = days >= 56
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{val}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isEligible ? '#16a34a' : '#d97706' }}>
              {isEligible ? `${days}d ago (Eligible)` : `Wait ${56 - days}d`}
            </div>
          </div>
        )
      }
    },
    { 
      key: 'status', 
      label: 'Eligibility',
      render: (val) => {
        let bg = '#dcfce7', color = '#16a34a'
        if (val === 'Deferred') { bg = '#fef9c3'; color = '#ca8a04' }
        else if (val === 'Ineligible') { bg = '#fee2e2'; color = '#dc2626' }
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
            {val || 'Eligible'}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const isOwn = !isPatient || 
          (row.patient_user_id && String(row.patient_user_id) === String(user?.id)) ||
          (row.name && row.name.toLowerCase() === (user?.name || '').toLowerCase()) ||
          (row.email && row.email.toLowerCase() === (user?.email || '').toLowerCase())

        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {!isPatient && (
              <button
                onClick={() => handleOpenLogDonation(row)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                  background: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Log New Blood Donation"
              >
                <Drop size={13} weight="fill" />
                <span>Collect</span>
              </button>
            )}
            {(!isPatient || isOwn) && (
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
                title={isPatient ? "Edit My Donor Profile" : "Edit Donor Profile"}
              >
                <PencilSimple size={15} weight="bold" />
              </button>
            )}
            {!isPatient && (
              <button
                onClick={() => {
                  openConfirm({
                    title: 'Delete Donor',
                    message: `Are you sure you want to remove donor "${row.name}" from registry?`,
                    onConfirm: () => deleteBloodDonor(row.id)
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
                title="Delete"
              >
                <Trash size={15} weight="bold" />
              </button>
            )}
          </div>
        )
      }
    }
  ]

  const filterOptions = [
    { label: 'O+ Donors', value: 'O+' },
    { label: 'O- Donors', value: 'O-' },
    { label: 'A+ Donors', value: 'A+' },
    { label: 'A- Donors', value: 'A-' },
    { label: 'B+ Donors', value: 'B+' },
    { label: 'B- Donors', value: 'B-' },
    { label: 'AB+ Donors', value: 'AB+' },
    { label: 'AB- Donors', value: 'AB-' }
  ]

  return (
    <div className="ecare-page-slide">
      {isPatient && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
            <Heart size={22} weight="fill" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#991b1b' }}>
              Voluntary Blood Donor Network
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7f1d1d', marginTop: '2px' }}>
              Every donation can save up to 3 lives. Register your profile to join our voluntary emergency donor directory. Hospital clinical teams reach out only when an urgent match is required.
            </div>
          </div>
        </div>
      )}

      <DataTable
        title="Blood Donors Registry"
        columns={columns}
        data={bloodDonors || []}
        onAdd={handleOpenAdd}
        addLabel={isPatient ? "Register as Voluntary Donor" : "Register Donor"}
        filterOptions={filterOptions}
        searchPlaceholder="Search by donor name, phone, blood group, or city..."
      />

      {/* ─── Add / Edit Donor Modal ────────────────────────────────── */}
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
                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Heart size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                        {editingDonor ? `Edit Donor: ${editingDonor.name}` : 'Register Volunteer Blood Donor'}
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>Enroll or update volunteer donor information</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="ecare-form-group">
                    <label className="ecare-label">Donor Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      className="ecare-input" 
                      placeholder="e.g. Shakib Al Hasan"
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Phone Number *</label>
                      <input 
                        type="tel" 
                        required 
                        className="ecare-input" 
                        placeholder="+880..."
                        value={formData.contact_number} 
                        onChange={e => setFormData({ ...formData, contact_number: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Blood Group *</label>
                      <CustomSelect 
                        value={formData.blood_group} 
                        onChange={val => setFormData({ ...formData, blood_group: val })}
                        options={BLOOD_GROUP_OPTIONS}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Gender</label>
                      <CustomSelect 
                        value={formData.gender} 
                        onChange={val => setFormData({ ...formData, gender: val })}
                        options={GENDER_OPTIONS}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Age</label>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        placeholder="18-65"
                        value={formData.age} 
                        onChange={e => setFormData({ ...formData, age: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Weight (kg) *</label>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        placeholder="Min 50kg"
                        value={formData.weight} 
                        onChange={e => setFormData({ ...formData, weight: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isPatient ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">City / Location</label>
                      <input 
                        type="text" 
                        className="ecare-input" 
                        placeholder="e.g. Dhanmondi, Dhaka"
                        value={formData.city} 
                        onChange={e => setFormData({ ...formData, city: e.target.value })} 
                      />
                    </div>
                    {!isPatient && (
                      <div className="ecare-form-group">
                        <label className="ecare-label">Eligibility Status</label>
                        <CustomSelect 
                          value={formData.status} 
                          onChange={val => setFormData({ ...formData, status: val })}
                          options={ELIGIBILITY_OPTIONS}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Last Donation Date</label>
                      <input 
                        type="date" 
                        className="ecare-input" 
                        value={formData.last_donation_date} 
                        onChange={e => setFormData({ ...formData, last_donation_date: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Total Lifetime Donations</label>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        value={formData.total_donations} 
                        onChange={e => setFormData({ ...formData, total_donations: Number(e.target.value) })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem' }}>
                      {editingDonor ? 'Update Profile' : 'Save Donor'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* ─── Log Donation Quick Action Modal ───────────────────────── */}
      <Portal>
        <AnimatePresence>
          {isLogDonationModalOpen && selectedDonorForDonation && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsLogDonationModalOpen(false)}
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
                <div style={{ padding: '1.25rem 1.5rem', background: '#fee2e2', borderBottom: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ffffff', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Drop size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>
                        Log Donation: {selectedDonorForDonation.name}
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: '#b91c1c', margin: 0 }}>
                        Auto-generate inventory bag for {selectedDonorForDonation.blood_group}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsLogDonationModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleSaveDonation} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="ecare-form-group">
                    <label className="ecare-label">Generated Bag ID *</label>
                    <input 
                      type="text" 
                      required 
                      className="ecare-input" 
                      value={donationForm.bag_number} 
                      onChange={e => setDonationForm({ ...donationForm, bag_number: e.target.value })} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Component Type</label>
                      <CustomSelect 
                        value={donationForm.component} 
                        onChange={val => setDonationForm({ ...donationForm, component: val })}
                        options={DONATION_COMPONENT_OPTIONS}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Storage Location</label>
                      <input 
                        type="text" 
                        className="ecare-input" 
                        value={donationForm.storage_location} 
                        onChange={e => setDonationForm({ ...donationForm, storage_location: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Donation Date</label>
                      <input 
                        type="date" 
                        className="ecare-input" 
                        value={donationForm.collection_date} 
                        onChange={e => setDonationForm({ ...donationForm, collection_date: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Expiry Date</label>
                      <input 
                        type="date" 
                        className="ecare-input" 
                        value={donationForm.expiry_date} 
                        onChange={e => setDonationForm({ ...donationForm, expiry_date: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsLogDonationModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem', background: '#dc2626' }}>
                      Collect & Store Bag
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  )
}

export default BloodDonors
