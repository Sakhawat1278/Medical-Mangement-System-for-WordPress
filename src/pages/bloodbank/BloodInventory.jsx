import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Drop, Plus, PencilSimple, Trash, X, WarningCircle, CheckCircle, Clock } from 'phosphor-react'
import DataTable from '../../components/DataTable'
import CustomSelect from '../../components/CustomSelect'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map(g => ({ value: g, label: g }))

const COMPONENT_OPTIONS = [
  { value: 'Whole Blood', label: 'Whole Blood (35 Days)' },
  { value: 'Packed RBC', label: 'Packed RBC (42 Days)' },
  { value: 'Platelets', label: 'Platelets (5 Days)' },
  { value: 'Fresh Frozen Plasma', label: 'Fresh Frozen Plasma (365 Days)' }
]

const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Dispensed', label: 'Dispensed' },
  { value: 'Discarded', label: 'Discarded' }
]

const BloodInventory = () => {
  const { user, bloodInventory, addBloodBag, updateBloodBag, deleteBloodBag, openConfirm } = useStore()
  const isPatient = user?.ecareRole === 'patient'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBag, setEditingBag] = useState(null)

  const [formData, setFormData] = useState({
    bag_number: '',
    blood_group: 'O+',
    component: 'Whole Blood',
    volume: 450,
    storage_location: 'Fridge A - Shelf 1',
    collection_date: new Date().toISOString().split('T')[0],
    expiry_date: (() => {
      const d = new Date()
      d.setDate(d.getDate() + 35)
      return d.toISOString().split('T')[0]
    })(),
    status: 'Available',
    donor_name: '',
    tested_negative: true,
    notes: ''
  })

  const resetForm = () => {
    const d = new Date()
    d.setDate(d.getDate() + 35)
    setFormData({
      bag_number: `BLD-${Math.floor(10000 + Math.random() * 90000)}`,
      blood_group: 'O+',
      component: 'Whole Blood',
      volume: 450,
      storage_location: 'Fridge A - Shelf 1',
      collection_date: new Date().toISOString().split('T')[0],
      expiry_date: d.toISOString().split('T')[0],
      status: 'Available',
      donor_name: '',
      tested_negative: true,
      notes: ''
    })
    setEditingBag(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleOpenEdit = (bag) => {
    setEditingBag(bag)
    setFormData({
      bag_number: bag.bag_number || '',
      blood_group: bag.blood_group || 'O+',
      component: bag.component || 'Whole Blood',
      volume: bag.volume || 450,
      storage_location: bag.storage_location || 'Fridge A - Shelf 1',
      collection_date: bag.collection_date || '',
      expiry_date: bag.expiry_date || '',
      status: bag.status || 'Available',
      donor_name: bag.donor_name || '',
      tested_negative: bag.tested_negative !== false,
      notes: bag.notes || ''
    })
    setIsAddModalOpen(true)
  }

  const handleComponentChange = (comp) => {
    const d = new Date(formData.collection_date || new Date())
    let days = 35
    let vol = 450
    if (comp === 'Platelets') { days = 5; vol = 50 }
    else if (comp === 'Packed RBC') { days = 42; vol = 250 }
    else if (comp === 'Fresh Frozen Plasma') { days = 365; vol = 200 }
    else if (comp === 'Whole Blood') { days = 35; vol = 450 }
    
    d.setDate(d.getDate() + days)
    setFormData(prev => ({
      ...prev,
      component: comp,
      volume: vol,
      expiry_date: d.toISOString().split('T')[0]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bag_number || !formData.blood_group) {
      toast.error('Bag number and blood group are required')
      return
    }

    if (editingBag) {
      await updateBloodBag(editingBag.id, {
        ...editingBag,
        ...formData
      })
      toast.success('Blood bag updated successfully')
    } else {
      await addBloodBag({
        ...formData,
        created_at: new Date().toISOString()
      })
      toast.success('Blood bag added to inventory')
    }

    setIsAddModalOpen(false)
    resetForm()
  }

  const columns = [
    { 
      key: 'bag_number', 
      label: 'Bag ID / Barcode', 
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--ecare-text-main)' }}>#{val}</div>
          <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{row.storage_location || 'Storage Unit'}</div>
        </div>
      )
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
      key: 'component', 
      label: 'Component',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{val || 'Whole Blood'}</div>
          <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{row.volume || 450} mL</div>
        </div>
      )
    },
    { 
      key: 'donor_name', 
      label: 'Donor',
      render: (val) => val ? (
        <span style={{ fontWeight: 600, color: '#334155' }}>{val}</span>
      ) : (
        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>Anonymous / External</span>
      )
    },
    { 
      key: 'collection_date', 
      label: 'Collection', 
      type: 'date' 
    },
    { 
      key: 'expiry_date', 
      label: 'Expiry Status',
      render: (val) => {
        if (!val) return '—'
        const daysLeft = Math.ceil((new Date(val).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        const isPast = daysLeft < 0
        const isNear = daysLeft >= 0 && daysLeft <= 7
        return (
          <div>
            <div style={{ fontWeight: 600, color: isPast ? '#dc2626' : (isNear ? '#d97706' : '#1e293b') }}>
              {val}
            </div>
            <div style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              color: isPast ? '#dc2626' : (isNear ? '#d97706' : '#16a34a') 
            }}>
              {isPast ? 'EXPIRED' : (isNear ? `Expires in ${daysLeft}d` : `${daysLeft} days safe`)}
            </div>
          </div>
        )
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (val) => {
        let bg = '#f3f4f6', color = '#4b5563'
        if (val === 'Available') { bg = '#dcfce7'; color = '#16a34a' }
        else if (val === 'Reserved') { bg = '#fef9c3'; color = '#ca8a04' }
        else if (val === 'Dispensed') { bg = '#dbeafe'; color = '#2563eb' }
        else if (val === 'Discarded') { bg = '#fee2e2'; color = '#dc2626' }
        return (
          <span style={{ 
            background: bg, 
            color: color, 
            padding: '3px 8px', 
            borderRadius: '4px', 
            fontSize: '0.75rem', 
            fontWeight: 800,
            textTransform: 'uppercase'
          }}>
            {val}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
            title="Edit Bag"
          >
            <PencilSimple size={15} weight="bold" />
          </button>
          <button
            onClick={() => {
              openConfirm({
                title: 'Delete Blood Bag',
                message: `Are you sure you want to remove bag #${row.bag_number} from inventory?`,
                onConfirm: () => deleteBloodBag(row.id)
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
        </div>
      )
    }
  ]

  const filterOptions = [
    { label: 'O+ Blood', value: 'O+' },
    { label: 'O- Blood', value: 'O-' },
    { label: 'A+ Blood', value: 'A+' },
    { label: 'A- Blood', value: 'A-' },
    { label: 'B+ Blood', value: 'B+' },
    { label: 'B- Blood', value: 'B-' },
    { label: 'AB+ Blood', value: 'AB+' },
    { label: 'AB- Blood', value: 'AB-' }
  ]

  const displayColumns = useMemo(() => {
    if (isPatient) {
      return columns.filter(c => c.key !== 'actions')
    }
    return columns
  }, [isPatient, columns])

  return (
    <div className="ecare-page-slide">
      {isPatient && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #fef2f2 0%, #eff6ff 100%)',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
            <Drop size={22} weight="fill" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#991b1b' }}>
              Hospital Blood Reserve Transparency
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
              Live inventory of screened and certified blood units in clinical refrigeration. If you or a loved one requires immediate transfusion, use the <strong>Request Blood</strong> option.
            </div>
          </div>
        </div>
      )}

      <DataTable
        title="Blood Bag Inventory"
        columns={displayColumns}
        data={bloodInventory || []}
        onAdd={isPatient ? undefined : handleOpenAdd}
        addLabel="Add Blood Bag"
        filterOptions={filterOptions}
        searchPlaceholder="Search by bag barcode, blood group, donor, or location..."
      />

      {/* ─── Add / Edit Modal ──────────────────────────────────────── */}
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
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Drop size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                        {editingBag ? `Edit Blood Bag #${editingBag.bag_number}` : 'Log New Blood Bag'}
                      </h3>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
                        {editingBag ? 'Modify storage, expiry, or status attributes' : 'Register collected unit into cold chain inventory'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Bag Barcode / ID *</label>
                      <input 
                        type="text" 
                        required 
                        className="ecare-input" 
                        value={formData.bag_number} 
                        onChange={e => setFormData({ ...formData, bag_number: e.target.value })} 
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Component Type</label>
                      <CustomSelect 
                        value={formData.component} 
                        onChange={val => handleComponentChange(val)}
                        options={COMPONENT_OPTIONS}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Volume (mL)</label>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        value={formData.volume} 
                        onChange={e => setFormData({ ...formData, volume: Number(e.target.value) })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Collection Date</label>
                      <input 
                        type="date" 
                        className="ecare-input" 
                        value={formData.collection_date} 
                        onChange={e => setFormData({ ...formData, collection_date: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Expiry Date</label>
                      <input 
                        type="date" 
                        className="ecare-input" 
                        value={formData.expiry_date} 
                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Storage Location / Shelf</label>
                      <input 
                        type="text" 
                        className="ecare-input" 
                        placeholder="e.g. Fridge A - Shelf 2"
                        value={formData.storage_location} 
                        onChange={e => setFormData({ ...formData, storage_location: e.target.value })} 
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Current Status</label>
                      <CustomSelect 
                        value={formData.status} 
                        onChange={val => setFormData({ ...formData, status: val })}
                        options={STATUS_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Donor Name (Optional)</label>
                    <input 
                      type="text" 
                      className="ecare-input" 
                      placeholder="Associated donor name"
                      value={formData.donor_name} 
                      onChange={e => setFormData({ ...formData, donor_name: e.target.value })} 
                    />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.tested_negative} 
                        onChange={e => setFormData({ ...formData, tested_negative: e.target.checked })} 
                      />
                      Screened & Certified Negative for HIV 1/2, Hepatitis B/C, and Syphilis
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.65rem' }}>
                      {editingBag ? 'Update Blood Bag' : 'Save Blood Bag'}
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

export default BloodInventory
