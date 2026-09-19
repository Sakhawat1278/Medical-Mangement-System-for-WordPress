import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Buildings, Users, Plus, PencilSimple, Trash, MagnifyingGlass, CheckCircle, Briefcase, X
} from 'phosphor-react'
import {
  HeartOrgan, Neurology, Lungs, Liver, Kidneys, Stomach, Skeleton, Tooth, 
  Eye, Ear, SkinCancer, Baby0203m, BloodBag, MentalHealth, Microscope, 
  Stethoscope, Syringe, ThermometerDigital, Xray, Hospital, Ambulance, GeneralSurgery,
  HeartOutline, NeurologyOutline, OrthopaedicsOutline, Baby0203mOutline, 
  EyeOutline, LungsOutline, HeartbeatOutline, MicroscopeOutline
} from 'healthicons-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import DataTable from '../components/DataTable'
import CustomSelect from '../components/CustomSelect'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="ecare-card"
    style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
  >
    <div style={{ 
      width: '48px', 
      height: '48px', 
      borderRadius: '12px', 
      background: `${color}10`, 
      color: color,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Icon size={24} weight="duotone" />
    </div>
    <div>
      <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{title}</div>
      <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
    </div>
  </motion.div>
)

const iconMap = {
  HeartOrgan, Neurology, Lungs, Liver, Kidneys, Stomach, Skeleton, Tooth, 
  Eye, Ear, SkinCancer, Baby0203m, BloodBag, MentalHealth, Microscope, 
  Stethoscope, Syringe, ThermometerDigital, Xray, Hospital, Ambulance, GeneralSurgery,
  HeartOutline, NeurologyOutline, OrthopaedicsOutline, Baby0203mOutline, 
  EyeOutline, LungsOutline, HeartbeatOutline, MicroscopeOutline
}

const getSpecIcon = (name, manualIcon = null) => {
  // Primary: Manual selection
  if (manualIcon && iconMap[manualIcon]) return iconMap[manualIcon]

  // Secondary: Auto-detection
  const n = name.toLowerCase()
  if (n.includes('heart') || n.includes('cardio')) return HeartOutline
  if (n.includes('brain') || n.includes('neuro')) return NeurologyOutline
  if (n.includes('pedia') || n.includes('baby') || n.includes('child')) return Baby0203mOutline
  if (n.includes('eye') || n.includes('opthal')) return EyeOutline
  if (n.includes('ear') || n.includes('ent')) return Ear
  if (n.includes('derma') || n.includes('skin')) return SkinCancer
  if (n.includes('lab') || n.includes('test')) return MicroscopeOutline
  if (n.includes('emergency') || n.includes('ortho')) return Ambulance
  if (n.includes('surgery')) return GeneralSurgery
  if (n.includes('dental') || n.includes('tooth')) return Tooth
  if (n.includes('lung') || n.includes('pulmo')) return LungsOutline
  if (n.includes('stomach') || n.includes('gastro')) return Stomach
  if (n.includes('kidney') || n.includes('nephro')) return Kidneys
  if (n.includes('bone') || n.includes('skeleton')) return OrthopaedicsOutline
  if (n.includes('blood') || n.includes('hema')) return BloodBag
  if (n.includes('psych') || n.includes('mental')) return MentalHealth
  if (n.includes('oncology') || n.includes('cancer')) return HeartbeatOutline
  
  return Buildings 
}

const Specialities = () => {
  const { 
    specialities, 
    addSpeciality, 
    updateSpeciality, 
    deleteSpeciality,
    bulkDelete,
    doctorList,
    services,
    openConfirm,
    primaryColor
  } = useStore()

  const safeDoctors = Array.isArray(doctorList) ? doctorList : []
  const safeServices = Array.isArray(services) ? services : []
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingSpec, setEditingSpec] = useState(null)
  const [newSpec, setNewSpec] = useState({ name: '', status: 'Active', color: primaryColor, icon: 'Hospital' })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Syncing is now handled directly in event handlers to avoid cascading effects

  if (!isMounted) return null

  const columns = [
    {
      key: 'name',
      label: 'Speciality Name',
      render: (val, row) => {
        const isCustomSvg = row.icon && (row.icon.includes('.svg') || row.icon.startsWith('http') || row.icon.startsWith('/'));
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '32px', height: '32px', 
              borderRadius: '8px', 
              background: `${row.color}15`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: row.color
            }}>
              {isCustomSvg ? (
                <img src={row.icon} style={{ width: '20px', height: '20px', objectFit: 'contain' }} alt="" />
              ) : (
                (() => {
                  const IconComponent = getSpecIcon(val, row.icon);
                  return <IconComponent size={20} />;
                })()
              )}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--ecare-text-main)' }}>{val}</span>
          </div>
        )
      }
    },
    {
      key: 'services',
      label: 'Total Services',
      render: (_, row) => {
        const count = safeServices.filter(s => {
          const spec = s.speciality || s.specialization || '';
          return spec.toLowerCase().trim() === row.name.toLowerCase().trim();
        }).length
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={16} color="var(--ecare-text-muted)" />
            <span style={{ color: 'var(--ecare-text-main)', fontWeight: 600 }}>{count} Services</span>
          </div>
        )
      }
    },
    {
      key: 'doctors',
      label: 'Total Doctors',
      render: (_, row) => {
        const count = safeDoctors.filter(d => {
          const spec = d.specialization || d.speciality || '';
          if (Array.isArray(spec)) {
            return spec.some(s => s.toLowerCase().trim() === row.name.toLowerCase().trim());
          }
          return spec.toLowerCase().trim().includes(row.name.toLowerCase().trim());
        }).length
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="var(--ecare-text-muted)" />
            <span style={{ color: 'var(--ecare-text-main)', fontWeight: 600 }}>{count} Doctors</span>
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <div 
          onClick={(e) => {
            e.stopPropagation()
            updateSpeciality(row.id, { ...row, status: val === 'Active' ? 'Inactive' : 'Active' })
          }}
          style={{ 
            width: '42px', 
            height: '22px', 
            borderRadius: '999px', 
            background: val === 'Active' ? 'var(--ecare-primary)' : '#e2e8f0',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <motion.div 
            animate={{ x: val === 'Active' ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ 
              width: '18px', 
              height: '18px', 
              borderRadius: '50%', 
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} 
          />
        </div>
      )
    }
  ]

  const handleSave = () => {
    if (newSpec.name.trim()) {
      if (editingSpec) {
        updateSpeciality(editingSpec.id, newSpec)
        setEditingSpec(null)
      } else {
        addSpeciality(newSpec)
        setIsAdding(false)
      }
      setNewSpec({ name: '', status: 'Active', color: primaryColor, icon: 'Hospital' })
    }
  }

  const handleSvgUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
      toast.error('Only SVG files are allowed.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (res.data?.success && res.data?.files?.[0]) {
        const fileUrl = res.data.files[0].url
        setNewSpec({ ...newSpec, icon: fileUrl })
        toast.success('SVG icon uploaded successfully!')
      } else {
        toast.error('Failed to upload SVG.')
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Error uploading file.')
    }
  }

  const handleBulkDelete = (selectedIds) => bulkDelete('specialities', selectedIds)

  const safeSpecialities = Array.isArray(specialities) ? specialities : []
  const totalDoctorsCount = safeDoctors.length
  const activeSpecialitiesCount = safeSpecialities.filter(s => s.status === 'Active').length

  const clinicalIcons = [
    { name: 'HeartOutline', label: 'Heart (Outline)' },
    { name: 'NeurologyOutline', label: 'Brain (Outline)' },
    { name: 'OrthopaedicsOutline', label: 'Bones (Outline)' },
    { name: 'Baby0203mOutline', label: 'Pediatrics (Outline)' },
    { name: 'EyeOutline', label: 'Eye (Outline)' },
    { name: 'LungsOutline', label: 'Lungs (Outline)' },
    { name: 'HeartbeatOutline', label: 'Oncology (Outline)' },
    { name: 'MicroscopeOutline', label: 'Laboratory (Outline)' },
    { name: 'HeartOrgan', label: 'Heart (Solid)' },
    { name: 'Neurology', label: 'Brain (Solid)' },
    { name: 'Lungs', label: 'Lungs (Solid)' },
    { name: 'Liver', label: 'Liver' },
    { name: 'Kidneys', label: 'Kidneys' },
    { name: 'Stomach', label: 'Stomach' },
    { name: 'Skeleton', label: 'Bones (Solid)' },
    { name: 'Tooth', label: 'Dental' },
    { name: 'Eye', label: 'Eye (Solid)' },
    { name: 'Ear', label: 'Ear' },
    { name: 'SkinCancer', label: 'Dermatology' },
    { name: 'Baby0203m', label: 'Pediatrics (Solid)' },
    { name: 'BloodBag', label: 'Hematology' },
    { name: 'MentalHealth', label: 'Mental' },
    { name: 'Microscope', label: 'Laboratory (Solid)' },
    { name: 'Stethoscope', label: 'Clinical' },
    { name: 'Syringe', label: 'Injection' },
    { name: 'ThermometerDigital', label: 'Fever' },
    { name: 'Xray', label: 'Radiology' },
    { name: 'Hospital', label: 'General' },
    { name: 'Ambulance', label: 'Emergency' }
  ]

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 3, '--stat-grid-cols-md': 3 }}>
        <StatCard title="Total Specialities" value={safeSpecialities.length} icon={Buildings} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Active Specialities" value={activeSpecialitiesCount} icon={CheckCircle} color="var(--ecare-primary)" delay={0.2} />
        <StatCard title="Assigned Doctors" value={totalDoctorsCount} icon={Users} color="#0891b2" delay={0.3} />
      </div>

      <DataTable 
        data={safeSpecialities}
        columns={columns}
        searchPlaceholder="Search specialities..."
        addLabel="Add Speciality"
        onAdd={() => { setIsAdding(true); setNewSpec({ name: '', status: 'Active', color: primaryColor, icon: 'Hospital' }); }}
        onEdit={(row) => { setEditingSpec(row); setNewSpec({ name: row.name, status: row.status, color: row.color || primaryColor, icon: row.icon || 'Hospital' }); }}
        onDelete={(id) => {
          openConfirm({
            title: 'Delete Speciality',
            message: 'Are you sure you want to delete this speciality? This action cannot be undone.',
            confirmText: 'Delete',
            onConfirm: () => deleteSpeciality(id)
          })
        }}
        onBulkDelete={handleBulkDelete}
      />
    </motion.div>

    <Portal>
      <AnimatePresence>
          {(isAdding || editingSpec) && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingSpec(null); setNewSpec({ name: '', status: 'Active', color: primaryColor, icon: 'Hospital' }); }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{ 
                width: '100%', 
                maxWidth: '480px', 
                maxHeight: '90vh',
                position: 'relative', 
                padding: 0,
                border: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Buildings size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                      {editingSpec ? 'Edit Speciality' : 'Add New Speciality'}
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Define medical department specialty</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setEditingSpec(null); setNewSpec({ name: '', status: 'Active', color: primaryColor, icon: 'Hospital' }); }}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="ecare-form-group">
                  <label className="ecare-label">Speciality Name</label>
                  <input 
                    type="text" 
                    className="ecare-input" 
                    placeholder="e.g. Cardiology" 
                    autoFocus
                    value={newSpec.name}
                    onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                  />
                </div>

                <div className="ecare-form-group">
                  <label className="ecare-label">Status</label>
                  <CustomSelect 
                    value={newSpec.status}
                    onChange={(val) => setNewSpec({ ...newSpec, status: val })}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                    style={{ width: '100%' }}
                    customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }}
                  />
                </div>

                <div className="ecare-form-group">
                  <label className="ecare-label">Theme Color</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {[primaryColor, '#ef4444', '#8b5cf6', 'var(--ecare-primary)', '#f59e0b', '#ec4899', '#6366f1'].map(c => (
                      <div 
                        key={c}
                        onClick={() => setNewSpec({ ...newSpec, color: c })}
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          backgroundColor: c,
                          cursor: 'pointer',
                          border: newSpec.color === c ? '2px solid white' : 'none',
                          boxShadow: newSpec.color === c ? '0 0 0 2px var(--ecare-primary)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      />
                    ))}
                    {/* Custom Color Picker Option */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem' }}>
                      <input 
                        type="color" 
                        value={newSpec.color?.startsWith('#') ? newSpec.color : '#1b3b2b'} 
                        onChange={(e) => setNewSpec({ ...newSpec, color: e.target.value })}
                        style={{
                          width: '28px',
                          height: '28px',
                          padding: 0,
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent'
                        }}
                      />
                      <input 
                        type="text"
                        placeholder="#1b3b2b"
                        value={newSpec.color}
                        onChange={(e) => setNewSpec({ ...newSpec, color: e.target.value })}
                        style={{
                          width: '85px',
                          height: '28px',
                          padding: '4px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: 'var(--ecare-text-main)',
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="ecare-form-group">
                  <label className="ecare-label">Representative Icon (Medical Grade)</label>
                  <div className="ecare-keep-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: '0.4rem', 
                    marginTop: '0.25rem',
                    background: '#f8fafc',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    maxHeight: '140px',
                    overflowY: 'auto'
                  }}>
                    {clinicalIcons.map(item => {
                      const IconComp = iconMap[item.name] || Hospital
                      const isSelected = newSpec.icon === item.name
                      return (
                        <div 
                          key={item.name}
                          onClick={() => setNewSpec({ ...newSpec, icon: item.name })}
                          style={{ 
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--ecare-primary)' : 'white',
                            color: isSelected ? 'white' : '#64748b',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s'
                          }}
                          title={item.label}
                        >
                          <IconComp size={20} />
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Custom SVG Icon Uploader Option */}
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-text-main)' }}>Custom SVG Icon</span>
                      <input 
                        type="file" 
                        accept=".svg" 
                        id="specialty-svg-upload"
                        style={{ display: 'none' }}
                        onChange={handleSvgUpload}
                      />
                      <label 
                        htmlFor="specialty-svg-upload"
                        style={{ 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: 'white',
                          border: '1px solid #cbd5e1',
                          color: 'var(--ecare-text-main)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={12} /> Upload SVG
                      </label>
                    </div>
                    {newSpec.icon && (newSpec.icon.includes('.svg') || newSpec.icon.startsWith('http') || newSpec.icon.startsWith('/')) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '4px 8px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <img src={newSpec.icon} style={{ width: '20px', height: '20px', objectFit: 'contain' }} alt="Preview" />
                        <span style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {newSpec.icon.split('/').pop()}
                        </span>
                        <button 
                          onClick={() => setNewSpec({ ...newSpec, icon: 'Hospital' })}
                          style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    onClick={() => { setIsAdding(false); setEditingSpec(null); setNewSpec({ name: '', status: 'Active', color: primaryColor, icon: 'Hospital' }); }}
                    className="ecare-btn-secondary" 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="ecare-button" 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <CheckCircle size={18} weight="bold" />
                    {editingSpec ? 'Save Changes' : 'Create Speciality'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          )}
      </AnimatePresence>
    </Portal>
    </>
  )
}

export default Specialities
