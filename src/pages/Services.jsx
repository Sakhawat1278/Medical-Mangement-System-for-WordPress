import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, Plus, PencilSimple, Trash, MagnifyingGlass, CheckCircle, 
  TrendUp, CurrencyCircleDollar, Users, CaretDown, CaretUp, VideoCamera, X
} from 'phosphor-react'
import {
  HeartOrgan, Neurology, Baby0203m, Skeleton, Microscope, Stethoscope, 
  GeneralSurgery, Hospital, Telemedicine
} from 'healthicons-react'
import DataTable from '../components/DataTable'
import CustomSelect from '../components/CustomSelect'
import toast from 'react-hot-toast'
import api from '../utils/api'
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

const specIcons = {
  Cardiology: HeartOrgan,
  Neurology: Neurology,
  Pediatrics: Baby0203m,
  Orthopedics: Skeleton,
  Laboratory: Microscope,
  Clinical: Stethoscope,
  Surgery: GeneralSurgery,
  General: Hospital
}


const Services = () => {
  const { 
    services, 
    specialities, 
    doctorList,
    addService, 
    updateService, 
    deleteService, 
    toggleServiceTelemed,
    openConfirm 
  } = useStore()
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSpec, setExpandedSpec] = useState(null)
  const [formData, setFormData] = useState({ name: '', speciality: 'Pediatrics', price: '', description: '', telemedicine: false, status: 'Active', image: '' })

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        speciality: editingService.speciality,
        price: editingService.price,
        description: editingService.description,
        telemedicine: editingService.telemedicine,
        status: editingService.status,
        image: editingService.image || ''
      })
    } else {
      const firstSpec = specialities[0]?.name || 'Pediatrics'
      setFormData({ name: '', speciality: firstSpec, price: '', description: '', telemedicine: false, status: 'Active', image: '' })
    }
  }, [editingService, isAdding, specialities])

  if (!isMounted) return null

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.')
      return
    }

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
      const res = await api.post('upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (res.data?.success && res.data?.files?.[0]) {
        const fileUrl = res.data.files[0].url
        setFormData({ ...formData, image: fileUrl })
        toast.success('Service image uploaded successfully!')
      } else {
        toast.error('Failed to upload image.')
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Error uploading file.')
    }
  }

  const handleDelete = (id) => {
    openConfirm({
      title: 'Delete Service',
      message: 'Are you sure you want to remove this medical service? This action cannot be undone.',
      confirmText: 'Delete Service',
      onConfirm: () => {
        deleteService(id)
      }
    })
  }

  const handleToggleTelemed = (id, parentDisabled) => {
    if (parentDisabled) return
    toggleServiceTelemed(id)
  }

  const handleSave = (e) => {
    e.preventDefault()
    const data = { ...formData, price: Number(formData.price) }

    if (editingService) {
      updateService(editingService.id, data)
      setEditingService(null)
    } else {
      addService(data)
      setIsAdding(false)
    }
  }

  // Group services by speciality
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.speciality]) acc[service.speciality] = []
    acc[service.speciality].push(service)
    return acc
  }, {})

  const filteredGroups = Object.keys(groupedServices).reduce((acc, spec) => {
    const filtered = groupedServices[spec].filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filtered.length > 0) acc[spec] = filtered
    return acc
  }, {})

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ paddingBottom: '2rem' }}
      >
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 3, '--stat-grid-cols-md': 3 }}>
        <StatCard title="Total Services" value={services.length} icon={Briefcase} color="var(--ecare-primary)" delay={0.1} />
        <StatCard 
          title="Avg. Price" 
          value={`৳${services.length > 0 ? Math.round(services.reduce((a, b) => a + (Number(b.price) || 0), 0) / services.length).toLocaleString() : '0'}`} 
          icon={CurrencyCircleDollar} 
          color="#0891b2" 
          delay={0.2} 
        />
        <StatCard title="Market Trend" value={services.length > 5 ? '+8%' : '+0%'} icon={TrendUp} color="var(--ecare-primary)" delay={0.3} />
      </div>

      <div className="ecare-card" style={{ padding: '1.25rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '0.625rem',
          flexWrap: 'nowrap',
          marginBottom: '1.5rem',
          width: '100%'
        }}>
          <div style={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            flex: 1, 
            minWidth: 0, 
            maxWidth: '360px' 
          }}>
            <MagnifyingGlass 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                color: '#94a3b8', 
                pointerEvents: 'none',
                flexShrink: 0
              }} 
            />
            <input 
              type="text" 
              placeholder="Search services..." 
              className="ecare-input"
              style={{ 
                height: '38px',
                minHeight: '38px',
                maxHeight: '38px',
                padding: '0 0.75rem 0 2.25rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem',
                width: '100%',
                outline: 'none',
                background: '#f8fafc',
                boxSizing: 'border-box'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={() => setIsAdding(true)}
            className="ecare-button" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.375rem', 
              height: '38px',
              minHeight: '38px',
              maxHeight: '38px',
              padding: '0 0.875rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              width: 'auto',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}
          >
            <Plus size={16} weight="bold" />
            <span style={{ whiteSpace: 'nowrap' }}>Add Service</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.keys(filteredGroups).map((spec, index) => {
            const Icon = specIcons[spec] || Hospital
            const isExpanded = expandedSpec === spec
            const specServices = filteredGroups[spec]
            const specInfo = specialities.find(s => s.name === spec) || { status: 'Active' }
            const isSpecDisabled = specInfo.status === 'Inactive'

            return (
              <div key={spec} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', opacity: isSpecDisabled ? 0.75 : 1 }}>
                <div 
                  onClick={() => setExpandedSpec(isExpanded ? null : spec)}
                  style={{ 
                    padding: '1rem 1.25rem', 
                    background: isSpecDisabled ? '#f1f5f9' : (isExpanded ? 'var(--ecare-primary-bg)' : '#fcfdfe'),
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '10px', 
                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSpecDisabled ? '#64748b' : 'var(--ecare-primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      <Icon size={22} weight="duotone" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ecare-text-main)', textTransform: 'uppercase' }}>{spec}</h3>
                        {isSpecDisabled && (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#ef4444', fontSize: '0.6rem', fontWeight: 700 }}>SPECIALITY DISABLED</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>{specServices.length} SERVICES REGISTERED</span>
                    </div>
                  </div>
                  {isExpanded ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ 
                        padding: '1.25rem', 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', 
                        gap: '1.25rem',
                        background: isSpecDisabled ? '#f8fafc' : 'white'
                      }}>
                        {specServices.map(service => {
                          const assigned = (doctorList || []).filter(d => (d.services || '').includes(service.name))
                          const isTelemed = Boolean(service.telemedicine)
                          const isActive = service.status === 'Active'

                          return (
                            <motion.div 
                              key={service.id}
                              whileHover={isSpecDisabled ? {} : { y: -4, boxShadow: '0 16px 32px -8px rgba(27, 59, 43, 0.12), 0 4px 12px -2px rgba(0,0,0,0.03)' }}
                              style={{ 
                                padding: '1.35rem', 
                                borderRadius: '18px', 
                                border: isSpecDisabled 
                                  ? '1px solid #e2e8f0' 
                                  : (isTelemed ? '1px solid rgba(14, 165, 233, 0.25)' : '1px solid rgba(27, 59, 43, 0.14)'),
                                background: '#ffffff',
                                boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 3px -1px rgba(0, 0, 0, 0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.1rem',
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                filter: isSpecDisabled ? 'grayscale(0.5)' : 'none',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Top Status Gradient Accent */}
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '3.5px',
                                background: isSpecDisabled 
                                  ? '#cbd5e1' 
                                  : (isTelemed ? 'linear-gradient(90deg, #0ea5e9, #10b981)' : 'var(--ecare-primary)')
                              }} />

                              {/* Card Header: Speciality Emblem + Live Status + Micro Actions */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{ 
                                    width: '44px', 
                                    height: '44px', 
                                    borderRadius: '13px', 
                                    background: isSpecDisabled 
                                      ? '#f1f5f9' 
                                      : (isTelemed 
                                        ? 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(14,165,233,0.02) 100%)' 
                                        : 'linear-gradient(135deg, rgba(27,59,43,0.1) 0%, rgba(27,59,43,0.02) 100%)'),
                                    border: isSpecDisabled 
                                      ? '1px solid #e2e8f0' 
                                      : (isTelemed ? '1px solid rgba(14,165,233,0.2)' : '1px solid rgba(27,59,43,0.12)'),
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: isSpecDisabled ? '#94a3b8' : (isTelemed ? '#0284c7' : 'var(--ecare-primary)'),
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                    flexShrink: 0
                                  }}>
                                    <Icon size={24} weight="duotone" />
                                  </div>

                                  <div>
                                    <span style={{ 
                                      fontSize: '0.67rem', 
                                      fontWeight: 800, 
                                      color: isSpecDisabled ? '#94a3b8' : 'var(--ecare-primary)', 
                                      textTransform: 'uppercase', 
                                      letterSpacing: '0.06em',
                                      display: 'block',
                                      lineHeight: 1.2
                                    }}>
                                      {spec} Speciality
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                                      <span style={{ 
                                        width: '6px', 
                                        height: '6px', 
                                        borderRadius: '50%', 
                                        background: isActive && !isSpecDisabled ? '#10b981' : '#94a3b8',
                                        boxShadow: isActive && !isSpecDisabled ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none'
                                      }} />
                                      <span style={{ 
                                        fontSize: '0.7rem', 
                                        fontWeight: 700, 
                                        color: isActive && !isSpecDisabled ? '#059669' : '#64748b' 
                                      }}>
                                        {isActive ? 'Active Service' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Micro Action Capsule */}
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '2px', 
                                  background: '#f8fafc', 
                                  border: '1px solid #e2e8f0', 
                                  borderRadius: '10px', 
                                  padding: '3px' 
                                }}>
                                  <button 
                                    disabled={isSpecDisabled}
                                    onClick={() => setEditingService(service)}
                                    title="Edit Service"
                                    style={{ 
                                      width: '30px', 
                                      height: '30px', 
                                      borderRadius: '7px', 
                                      border: 'none', 
                                      background: 'transparent', 
                                      color: '#64748b', 
                                      cursor: isSpecDisabled ? 'not-allowed' : 'pointer', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      opacity: isSpecDisabled ? 0.5 : 1,
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => !isSpecDisabled && (e.currentTarget.style.background = 'white', e.currentTarget.style.color = 'var(--ecare-primary)', e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#64748b', e.currentTarget.style.boxShadow = 'none')}
                                  >
                                    <PencilSimple size={15} weight="bold" />
                                  </button>
                                  <button 
                                    disabled={isSpecDisabled}
                                    onClick={() => handleDelete(service.id)}
                                    title="Delete Service"
                                    style={{ 
                                      width: '30px', 
                                      height: '30px', 
                                      borderRadius: '7px', 
                                      border: 'none', 
                                      background: 'transparent', 
                                      color: '#ef4444', 
                                      cursor: isSpecDisabled ? 'not-allowed' : 'pointer', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      opacity: isSpecDisabled ? 0.5 : 1,
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => !isSpecDisabled && (e.currentTarget.style.background = '#fee2e2', e.currentTarget.style.color = '#dc2626')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#ef4444')}
                                  >
                                    <Trash size={15} weight="bold" />
                                  </button>
                                </div>
                              </div>

                              {/* Service Name & Description / Image */}
                              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                                {service.image && (
                                  <img 
                                    src={service.image} 
                                    alt={service.name}
                                    style={{ 
                                      width: '46px', 
                                      height: '46px', 
                                      borderRadius: '10px', 
                                      objectFit: 'cover', 
                                      border: '1px solid #e2e8f0', 
                                      flexShrink: 0 
                                    }} 
                                  />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4 style={{ 
                                    fontSize: '1.05rem', 
                                    fontWeight: 700, 
                                    color: isSpecDisabled ? '#64748b' : 'var(--ecare-text-main)', 
                                    lineHeight: 1.35, 
                                    margin: 0,
                                    wordBreak: 'break-word'
                                  }}>
                                    {service.name}
                                  </h4>
                                  {service.description ? (
                                    <p style={{ 
                                      fontSize: '0.78rem', 
                                      color: '#64748b', 
                                      lineHeight: 1.45, 
                                      marginTop: '4px', 
                                      marginBottom: 0,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden'
                                    }}>
                                      {service.description}
                                    </p>
                                  ) : (
                                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', marginBottom: 0 }}>
                                      Clinical consult & service delivery
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Executive Dual Metric Showcase (Fee & Session Mode) */}
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                                borderRadius: '13px',
                                border: '1px solid #e2e8f0',
                                padding: '0.85rem 1rem',
                                gap: '0.75rem'
                              }}>
                                {/* Fee Column */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ 
                                    fontSize: '0.625rem', 
                                    fontWeight: 800, 
                                    color: '#64748b', 
                                    display: 'block', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em',
                                    marginBottom: '3px' 
                                  }}>
                                    Consultation Fee
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                                    <span style={{ 
                                      fontSize: '1.25rem', 
                                      fontWeight: 800, 
                                      color: isSpecDisabled ? '#94a3b8' : 'var(--ecare-text-main)',
                                      letterSpacing: '-0.02em'
                                    }}>
                                      ৳{Number(service.price || 0).toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>/ visit</span>
                                  </div>
                                </div>

                                {/* Divider */}
                                <div style={{ width: '1px', height: '32px', background: '#cbd5e1', flexShrink: 0 }} />

                                {/* Session Mode Column */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <span style={{ 
                                    fontSize: '0.625rem', 
                                    fontWeight: 800, 
                                    color: '#64748b', 
                                    display: 'block', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em',
                                    marginBottom: '3px' 
                                  }}>
                                    Delivery Mode
                                  </span>
                                  {isTelemed ? (
                                    <div style={{ 
                                      padding: '3px 8px', 
                                      borderRadius: '8px', 
                                      background: isSpecDisabled ? '#f1f5f9' : '#e0f2fe', 
                                      border: isSpecDisabled ? '1px solid #e2e8f0' : '1px solid #bae6fd',
                                      color: isSpecDisabled ? '#94a3b8' : '#0284c7', 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '5px', 
                                      fontSize: '0.68rem', 
                                      fontWeight: 800,
                                      whiteSpace: 'nowrap'
                                    }}>
                                      <VideoCamera size={13} weight="fill" />
                                      <span>HYBRID (BOTH)</span>
                                    </div>
                                  ) : (
                                    <div style={{ 
                                      padding: '3px 8px', 
                                      borderRadius: '8px', 
                                      background: '#f1f5f9', 
                                      border: '1px solid #e2e8f0',
                                      color: '#475569', 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '5px', 
                                      fontSize: '0.68rem', 
                                      fontWeight: 800,
                                      whiteSpace: 'nowrap'
                                    }}>
                                      <Hospital size={13} weight="duotone" />
                                      <span>IN-CLINIC</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Clinicians Linked Row */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {assigned.length > 0 ? (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {assigned.slice(0, 3).map((doc, idx) => (
                                          <div 
                                            key={doc.id || idx}
                                            title={doc.name}
                                            style={{ 
                                              width: '24px', 
                                              height: '24px', 
                                              borderRadius: '50%', 
                                              border: '2px solid white', 
                                              background: 'var(--ecare-primary-bg)', 
                                              color: 'var(--ecare-primary)',
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              justifyContent: 'center', 
                                              fontSize: '0.625rem', 
                                              fontWeight: 800,
                                              marginLeft: idx > 0 ? '-7px' : 0,
                                              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                              overflow: 'hidden'
                                            }}
                                          >
                                            {doc.image ? (
                                              <img src={doc.image} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                              (doc.name || 'D').charAt(0).toUpperCase()
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ecare-text-muted)' }}>
                                        {assigned.length} Clinician{assigned.length > 1 ? 's' : ''} Linked
                                      </span>
                                    </>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>
                                      <Users size={14} />
                                      <span>No clinicians linked</span>
                                    </div>
                                  )}
                                </div>

                                <span style={{ 
                                  fontSize: '0.66rem', 
                                  fontWeight: 700, 
                                  color: '#94a3b8', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.04em' 
                                }}>
                                  ID #{String(service.id).slice(-4)}
                                </span>
                              </div>

                              {/* Interactive Telemedicine Activation Strip */}
                              <div style={{ 
                                padding: '0.75rem 0.875rem', 
                                borderRadius: '13px',
                                background: isSpecDisabled 
                                  ? '#f8fafc' 
                                  : (isTelemed 
                                    ? 'linear-gradient(135deg, rgba(14,165,233,0.07) 0%, rgba(16,185,129,0.04) 100%)' 
                                    : '#f8fafc'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: isSpecDisabled 
                                  ? '1px solid #e2e8f0' 
                                  : (isTelemed ? '1px solid rgba(14,165,233,0.24)' : '1px solid #e2e8f0'),
                                transition: 'all 0.25s ease'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                  <div style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '8px', 
                                    background: isSpecDisabled ? '#e2e8f0' : (isTelemed ? '#e0f2fe' : '#e2e8f0'), 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: isSpecDisabled ? '#94a3b8' : (isTelemed ? '#0284c7' : '#64748b'),
                                    flexShrink: 0
                                  }}>
                                    <VideoCamera size={15} weight={isTelemed ? "fill" : "regular"} />
                                  </div>
                                  <div>
                                    <div style={{ 
                                      fontSize: '0.75rem', 
                                      fontWeight: 700, 
                                      color: isSpecDisabled ? '#94a3b8' : (isTelemed ? 'var(--ecare-text-main)' : '#64748b'),
                                      lineHeight: 1.2
                                    }}>
                                      Telemedicine
                                    </div>
                                    <div style={{ 
                                      fontSize: '0.65rem', 
                                      fontWeight: 600, 
                                      color: isSpecDisabled ? '#cbd5e1' : (isTelemed ? '#0284c7' : '#94a3b8') 
                                    }}>
                                      {isTelemed ? 'Live video consults enabled' : 'In-person consults only'}
                                    </div>
                                  </div>
                                </div>

                                <label 
                                  className="ecare-switch-premium" 
                                  style={{ 
                                    position: 'relative', 
                                    display: 'inline-block', 
                                    width: '40px', 
                                    height: '22px', 
                                    cursor: isSpecDisabled ? 'not-allowed' : 'pointer',
                                    margin: 0,
                                    flexShrink: 0
                                  }}
                                >
                                  <input 
                                    type="checkbox" 
                                    disabled={isSpecDisabled}
                                    checked={isTelemed}
                                    onChange={() => handleToggleTelemed(service.id, isSpecDisabled)}
                                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                  />
                                  <span style={{
                                    position: 'absolute', 
                                    cursor: isSpecDisabled ? 'not-allowed' : 'pointer', 
                                    inset: 0,
                                    backgroundColor: isSpecDisabled ? '#e2e8f0' : (isTelemed ? '#0ea5e9' : '#cbd5e1'),
                                    borderRadius: '22px', 
                                    transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: (isTelemed && !isSpecDisabled) ? '0 0 10px rgba(14, 165, 233, 0.35)' : 'none'
                                  }}>
                                    <span style={{
                                      position: 'absolute', 
                                      height: '16px', 
                                      width: '16px', 
                                      left: isTelemed ? '21px' : '3px', 
                                      top: '3px',
                                      backgroundColor: 'white', 
                                      borderRadius: '50%', 
                                      transition: 'left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.18)'
                                    }} />
                                  </span>
                                </label>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>

    <Portal>
      <AnimatePresence>
          {(isAdding || editingService) && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingService(null); }}
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
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                      {editingService ? 'Edit Clinical Service' : 'Add New Service'}
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Define medical treatment or service offering</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setEditingService(null); }}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
              
              <form onSubmit={handleSave} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="ecare-form-group">
                  <label className="ecare-label">Service Name</label>
                  <input 
                    type="text" 
                    className="ecare-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="ecare-form-group">
                    <label className="ecare-label">Speciality</label>
                    <CustomSelect 
                      value={formData.speciality}
                      onChange={(val) => setFormData({ ...formData, speciality: val })}
                      options={specialities.map(s => ({ value: s.name, label: s.name }))}
                      style={{ width: '100%' }}
                      isSearchable={true}
                      customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }}
                    />
                  </div>
                  <div className="ecare-form-group">
                    <label className="ecare-label">Price (৳)</label>
                    <input 
                      type="number" 
                      className="ecare-input" 
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div className="ecare-form-group">
                  <label className="ecare-label">Description</label>
                  <textarea 
                    className="ecare-input" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3" 
                  />
                </div>

                <div className="ecare-form-group">
                  <label className="ecare-label">Service Image</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Image URL or upload"
                      className="ecare-input" 
                      style={{ flex: 1 }}
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="service-image-upload"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <label 
                      htmlFor="service-image-upload"
                      style={{ 
                        padding: '0.625rem 1rem', 
                        borderRadius: '12px', 
                        cursor: 'pointer', 
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: 'var(--ecare-primary-bg)',
                        color: 'var(--ecare-primary)',
                        border: '1px solid var(--ecare-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Upload Image
                    </label>
                  </div>

                  {formData.image && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '0.5rem', 
                      background: '#f8fafc', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0' 
                    }}>
                      <img src={formData.image} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} alt="Preview" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {formData.image.split('/').pop()}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="ecare-form-group">
                  <label className="ecare-label">Status</label>
                  <CustomSelect 
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                    style={{ width: '100%' }}
                    customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="telemed-check" 
                      checked={formData.telemedicine}
                      onChange={(e) => setFormData({ ...formData, telemedicine: e.target.checked })}
                    />
                    <label htmlFor="telemed-check" className="ecare-label" style={{ marginBottom: 0 }}>Enable Telemedicine</label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => { setIsAdding(false); setEditingService(null); }} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px' }}>Cancel</button>
                  <button type="submit" className="ecare-button" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} weight="bold" />
                    {editingService ? 'Save Changes' : 'Create Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
          )}
      </AnimatePresence>
    </Portal>
    </>
  )
}

export default Services
