import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, Users, CalendarCheck, Hourglass, CheckCircle, XCircle, X, Check,
  Phone, EnvelopeSimple, MapPin, IdentificationCard, Clock,
  MagnifyingGlass, Calendar, UploadSimple, Camera, Briefcase, 
  Globe, Buildings, Lightning, FilePdf, Timer, Eye, Package
} from 'phosphor-react'
import CustomSelect from '../components/CustomSelect'
import CustomDatePicker from '../components/CustomDatePicker'
import DataTable from '../components/DataTable'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'
import useAuth from '../hooks/useAuth'
import { formatPaymentMethod } from '../utils/formatters'

const getInitials = (name) => {
  if (!name) return 'CP'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'CP'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Shared Components ─────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ borderColor: 'var(--ecare-primary)' }}
    className="ecare-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ 
        color: color, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={24} weight="duotone" />
      </div>
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)
const InputGroup = ({ label, required, children, style, className }) => (
  <div className={`ecare-form-group ${className || ''}`} style={style}>
    <label className="ecare-label">
      {required && <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>}
      {label}
    </label>
    {children}
  </div>
)

const PillSlider = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: '0.25rem', padding: '4px', background: '#f1f5f9', borderRadius: '9999px', width: 'fit-content' }}>
    {options.map(opt => {
      const isActive = value === opt.value
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '0.4rem 1.25rem',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: isActive ? 700 : 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: isActive ? 'white' : 'transparent',
            color: isActive ? 'var(--ecare-primary)' : '#64748b',
            boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          {opt.label}
        </button>
      )
    })}
  </div>
)

// ─── Add Care Provider Tab ─────────────────────────────────────────────────
const AddProviderTab = () => {
  const { 
    providerTypes, servicePricing, setActivePage, 
    addPendingCareProvider, editingCareProvider, 
    setEditingCareProvider, updateCareProvider 
  } = useStore()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: '',
    dob: '',
    gender: 'MALE',
    nid: '',
    experience: '',
    nationality: '',
    organization: '',
    skills: '',
    address: '',
    packages: [],
    bankName: '',
    branchName: '',
    accountName: '',
    accountNumber: '',
    mobileProvider: '',
    mobileNumber: '',
    status: 'Active',
  })
  const [accountType, setAccountType] = useState('Bank Account')
  const [previewImage, setPreviewImage] = useState(null)
  const [documents, setDocuments] = useState([])
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)

  useEffect(() => {
    if (editingCareProvider) {
      // Backward-compat: old records stored mobile banking data in bankName/accountNumber
      const _isMobileLegacy = editingCareProvider.accountType === 'Mobile Banking' &&
        !editingCareProvider.mobileProvider && !!editingCareProvider.bankName

      setForm({
        name: editingCareProvider.name || '',
        email: editingCareProvider.email || '',
        phone: editingCareProvider.phone || '',
        type: editingCareProvider.type || '',
        dob: editingCareProvider.dob || '',
        gender: editingCareProvider.gender === 'Female' ? 'FEMALE' : 'MALE',
        nid: editingCareProvider.nid || '',
        experience: editingCareProvider.exp ? editingCareProvider.exp.split(' ')[0] : '',
        nationality: editingCareProvider.nationality || '',
        organization: editingCareProvider.organization || '',
        skills: editingCareProvider.skills || '',
        address: editingCareProvider.address || '',
        packages: typeof editingCareProvider.packages === 'string' ? JSON.parse(editingCareProvider.packages) : (editingCareProvider.packages || []),
        bankName: _isMobileLegacy ? '' : (editingCareProvider.bankName || ''),
        branchName: _isMobileLegacy ? '' : (editingCareProvider.branchName || ''),
        accountName: _isMobileLegacy ? '' : (editingCareProvider.accountName || ''),
        accountNumber: _isMobileLegacy ? '' : (editingCareProvider.accountNumber || ''),
        mobileProvider: _isMobileLegacy ? (editingCareProvider.bankName || '') : (editingCareProvider.mobileProvider || ''),
        mobileNumber: _isMobileLegacy ? (editingCareProvider.accountNumber || '') : (editingCareProvider.mobileNumber || ''),
        status: editingCareProvider.status || 'Active',
      })
      setAccountType(editingCareProvider.accountType || 'Bank Account')
      setPreviewImage(editingCareProvider.photo || null)
      if (editingCareProvider.documents) {
        setDocuments(typeof editingCareProvider.documents === 'string' ? JSON.parse(editingCareProvider.documents) : (editingCareProvider.documents || []))
      }
    }
  }, [editingCareProvider])

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreviewImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    setIsUploadingDoc(true)
    const newDocs = []
    let processed = 0

    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newDocs.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result
        })
        processed++
        if (processed === files.length) {
          setDocuments(prev => [...prev, ...newDocs])
          setIsUploadingDoc(false)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      type: form.type,
      exp: form.experience ? `${form.experience} Years` : '',
      phone: form.phone,
      email: form.email,
      dob: form.dob,
      gender: form.gender === 'MALE' ? 'Male' : 'Female',
      nid: form.nid,
      nationality: form.nationality,
      organization: form.organization,
      skills: form.skills,
      address: form.address,
      packages: JSON.stringify(form.packages),
      bio: form.bio,
      photo: previewImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name.replace(/\s/g, '')}`,
      // Both payment methods saved independently; accountType = preferred method
      bankName: form.bankName,
      branchName: form.branchName,
      accountName: form.accountName,
      accountNumber: form.accountNumber,
      mobileProvider: form.mobileProvider,
      mobileNumber: form.mobileNumber,
      accountType: accountType,
      documents: documents,
      status: form.status || 'Active'
    }

    if (editingCareProvider) {
      updateCareProvider(editingCareProvider.id, payload)
      setEditingCareProvider(null)
    } else {
      addPendingCareProvider(payload)
    }
    setActivePage('care-list')
  }

  const safeProviderTypes = Array.isArray(providerTypes) ? providerTypes : []
  const safeAllPackages = Array.isArray(servicePricing) ? servicePricing : []

  const selectedTypeObj = safeProviderTypes.find(t => t.name === form.type)
  const filteredPackages = selectedTypeObj 
    ? safeAllPackages.filter(p => String(p.typeId) === String(selectedTypeObj.id) || String(p.providerTypeId) === String(selectedTypeObj.id))
    : safeAllPackages

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ paddingBottom: '2rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Photo & Primary Info */}
        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Personal Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0' }}>
                {previewImage ? <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} color="#94a3b8" />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profile Photo</span>
                <input type="file" id="providerPic" style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
                <label htmlFor="providerPic" className="ecare-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.75rem', fontSize: '0.7rem', borderRadius: '9999px', cursor: 'pointer' }}>
                  <UploadSimple size={12} weight="bold" /> Upload
                </label>
              </div>
            </div>
          </div>

          <div className="ecare-form-grid">
            <InputGroup label="Full Name" required>
              <input type="text" className="ecare-input" placeholder="e.g. John Doe" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
            </InputGroup>
            <InputGroup label="Mail Address" required>
              <input type="email" className="ecare-input" placeholder="john@example.com" value={form.email} onChange={e => handleChange('email', e.target.value)} required />
            </InputGroup>
            <InputGroup label="Phone Number" required>
              <input type="tel" className="ecare-input" placeholder="+880" value={form.phone} onChange={e => handleChange('phone', e.target.value)} required />
            </InputGroup>
            <InputGroup label="Full Address" className="ecare-span-2">
              <input type="text" className="ecare-input" placeholder="e.g. 123 Health St, Dhaka" value={form.address} onChange={e => handleChange('address', e.target.value)} />
            </InputGroup>
          </div>

          <div className="ecare-form-grid" style={{ marginTop: '0.25rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <InputGroup label="Care Provider Type" required>
              <CustomSelect 
                value={form.type} 
                onChange={val => {
                  handleChange('type', val)
                  handleChange('packages', [])
                }} 
                options={(providerTypes || []).map(t => ({ value: t.name, label: t.name }))} 
                placeholder="Select type" 
              />
            </InputGroup>
            <InputGroup label="Date of Birth" required>
              <CustomDatePicker value={form.dob} onChange={val => handleChange('dob', val)} placeholder="Select DOB" />
            </InputGroup>
            <InputGroup label="Gender Selection" required>
              <PillSlider 
                options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} 
                value={form.gender} 
                onChange={val => handleChange('gender', val)} 
              />
            </InputGroup>
            <InputGroup label="Account Status" required>
              <CustomSelect 
                value={form.status} 
                onChange={val => handleChange('status', val)} 
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' }
                ]} 
              />
            </InputGroup>
          </div>
        </div>

        {/* Identity & Professional Details */}
        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Professional Credentials</h3>
          <div className="ecare-form-grid">
            <InputGroup label="NID Number" required>
              <input type="text" className="ecare-input" placeholder="NID or Passport" value={form.nid} onChange={e => handleChange('nid', e.target.value)} required />
            </InputGroup>
            <InputGroup label="Years of Experience" required>
              <input type="number" className="ecare-input" placeholder="e.g. 5" value={form.experience} onChange={e => handleChange('experience', e.target.value)} required />
            </InputGroup>
            <InputGroup label="Nationality">
              <input type="text" className="ecare-input" placeholder="e.g. Bangladeshi" value={form.nationality} onChange={e => handleChange('nationality', e.target.value)} />
            </InputGroup>
          </div>
          <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
            <InputGroup label="Organization / Clinic">
              <input type="text" className="ecare-input" placeholder="Current or Previous" value={form.organization} onChange={e => handleChange('organization', e.target.value)} />
            </InputGroup>
            <InputGroup label="Skills & Competencies" className="ecare-span-2">
              <input type="text" className="ecare-input" placeholder="e.g. ICU, Wound Care, BLS" value={form.skills} onChange={e => handleChange('skills', e.target.value)} />
            </InputGroup>
          </div>
        </div>

        {/* Service Packages Selection */}
        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Available Service Packages</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select the durations you can provide care for</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filteredPackages.map((pkg) => {
              const isSelected = (form.packages || []).includes(pkg.id)
              return (
                <motion.div 
                  key={pkg.id}
                  whileHover={{ y: -4, boxShadow: '0 12px 20px -8px rgba(0,0,0,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const current = form.packages || []
                    const next = isSelected ? current.filter(id => id !== pkg.id) : [...current, pkg.id]
                    handleChange('packages', next)
                  }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: `2px solid ${isSelected ? 'var(--ecare-primary)' : '#f1f5f9'}`,
                    background: isSelected ? 'var(--ecare-primary-bg)' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: '44px', height: '44px', borderRadius: '12px', 
                      background: isSelected ? 'white' : 'var(--ecare-primary-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--ecare-primary)'
                    }}>
                      <Package size={24} weight="duotone" />
                    </div>
                    <div style={{ 
                      padding: '0.35rem 0.75rem', borderRadius: '9999px', 
                      background: isSelected ? 'var(--ecare-primary)' : '#f1f5f9',
                      color: isSelected ? 'white' : '#64748b',
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em'
                    }}>
                      {pkg.duration}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ecare-text-main)', marginBottom: '0.25rem' }}>{pkg.name || 'Service Package'}</div>
                  </div>

                  <div style={{ 
                    marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Total Price</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--ecare-primary)', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>৳</span>
                      {Number(pkg.price).toLocaleString()}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ 
                      position: 'absolute', top: '-10px', right: '-10px', 
                      background: 'var(--ecare-primary)', color: 'white', 
                      width: '24px', height: '24px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      border: '2px solid white'
                    }}>
                      <Check size={14} weight="bold" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
          {(!safeAllPackages || safeAllPackages.length === 0) && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', background: '#f8fafc', borderRadius: '12px' }}>
              No service packages defined in settings.
            </div>
          )}
        </div>
        {/* Payment Information — Both sections always visible */}
        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Payment Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Preferred method:</span>
              <div className="ecare-radio-group" style={{ margin: 0 }}>
                <button type="button" className={`ecare-radio-btn ${accountType === 'Bank Account' ? 'active' : ''}`} onClick={() => setAccountType('Bank Account')}>Bank Account</button>
                <button type="button" className={`ecare-radio-btn ${accountType === 'Mobile Banking' ? 'active' : ''}`} onClick={() => setAccountType('Mobile Banking')}>Mobile Banking</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Bank Account Section */}
            <div style={{ padding: '1rem', borderRadius: '12px', border: `2px solid ${accountType === 'Bank Account' ? 'var(--ecare-primary)' : '#e2e8f0'}`, background: accountType === 'Bank Account' ? 'var(--ecare-primary-bg)' : '#f8fafc' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: accountType === 'Bank Account' ? 'var(--ecare-primary)' : '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏦 Bank Account</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <InputGroup label="Bank Name">
                    <input type="text" className="ecare-input" placeholder="Bank name" value={form.bankName} onChange={e => handleChange('bankName', e.target.value)} />
                  </InputGroup>
                  <InputGroup label="Branch">
                    <input type="text" className="ecare-input" placeholder="Branch" value={form.branchName} onChange={e => handleChange('branchName', e.target.value)} />
                  </InputGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <InputGroup label="Account Name">
                    <input type="text" className="ecare-input" placeholder="Name" value={form.accountName} onChange={e => handleChange('accountName', e.target.value)} />
                  </InputGroup>
                  <InputGroup label="Account No">
                    <input type="text" className="ecare-input" placeholder="Number" value={form.accountNumber} onChange={e => handleChange('accountNumber', e.target.value)} />
                  </InputGroup>
                </div>
              </div>
            </div>

            {/* Mobile Banking Section */}
            <div style={{ padding: '1rem', borderRadius: '12px', border: `2px solid ${accountType === 'Mobile Banking' ? 'var(--ecare-primary)' : '#e2e8f0'}`, background: accountType === 'Mobile Banking' ? 'var(--ecare-primary-bg)' : '#f8fafc' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: accountType === 'Mobile Banking' ? 'var(--ecare-primary)' : '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📱 Mobile Banking</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <InputGroup label="Provider">
                  <CustomSelect value={form.mobileProvider} onChange={val => handleChange('mobileProvider', val)} options={[{ value: 'Bkash', label: 'Bkash' }, { value: 'Nagad', label: 'Nagad' }, { value: 'Rocket', label: 'Rocket' }, { value: 'Upay', label: 'Upay' }]} placeholder="Select provider" expandDirection="up" />
                </InputGroup>
                <InputGroup label="Mobile Number">
                  <input type="tel" className="ecare-input" placeholder="e.g. 017XXXXXXXX" value={form.mobileNumber} onChange={e => handleChange('mobileNumber', e.target.value)} />
                </InputGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Documents & Credentials */}
        <div className="ecare-card" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Documents & Credentials</h3>
            
            <input type="file" id="docUpload" multiple style={{ display: 'none' }} onChange={handleDocumentChange} />
            <label htmlFor="docUpload" style={{ 
              border: '1px dashed #cbd5e1', 
              borderRadius: '12px', 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#f8fafc', 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              minHeight: '120px',
              padding: '1rem'
            }}>
              <FilePdf size={28} color="var(--ecare-primary)" weight="duotone" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem' }}>
                {isUploadingDoc ? 'Processing...' : 'Click to Upload Credentials'}
              </div>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Upload certificates, NID copies (Max 2MB per file)</p>
            </label>

            {documents.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {documents.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FilePdf size={16} color="#ef4444" weight="fill" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{doc.name}</span>
                    </div>
                    <button type="button" onClick={() => removeDocument(idx)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
          <InputGroup label="Professional Bio">
            <textarea className="ecare-input" rows="2" style={{ resize: 'none', borderRadius: '12px', padding: '0.75rem' }} placeholder="Care philosophy..." value={form.bio} onChange={e => handleChange('bio', e.target.value)} />
          </InputGroup>
        </div>


        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="ecare-btn-secondary" 
            style={{ padding: '0.6rem 1.5rem', borderRadius: '9999px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}
            onClick={() => {
              setForm({
                name: '', email: '', phone: '', type: '', dob: '', gender: 'MALE', nid: '',
                experience: '', nationality: '', organization: '', skills: '', address: '', packages: [],
                bankName: '', branchName: '', accountName: '', accountNumber: '', mobileProvider: '', mobileNumber: '',
                status: 'Active'
              });
              setPreviewImage(null);
              setDocuments([]);
            }}
          >
            Reset
          </button>
          <button type="submit" className="ecare-button" style={{ padding: '0.6rem 2rem', borderRadius: '9999px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}>
            {editingCareProvider ? 'Save Changes' : 'Register Provider'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────
const BookingsTab = () => {
  const { 
    openConfirm, 
    careProviderBookings: bookings, 
    updateCareProviderBooking, 
    deleteCareProviderBooking,
    bulkDelete,
    setCareProviderBookingModal,
    setEditingCareProviderBooking
  } = useStore()
  const { user } = useAuth()
  const isPatient = user?.ecareRole === 'patient'

  const handleStatusChange = (id, newStatus) => {
    updateCareProviderBooking(id, { status: newStatus })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed': return 'badge-success'
      case 'Pending': return 'badge-warning'
      case 'In-Progress': return 'badge-info'
      case 'Cancelled': return 'badge-error'
      default: return ''
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (val) => <span style={{ fontWeight: 700, color: 'var(--ecare-primary)', fontSize: '0.75rem' }}>#BKG-{String(val).slice(0, 8).toUpperCase()}</span>
    },
    {
      key: 'providerName',
      label: 'Care Provider',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {(row.avatar || row.photo || row.driverPhoto || row.driver_photo) ? (
              <img src={row.avatar || row.photo || row.driverPhoto || row.driver_photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : (
              <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                {getInitials(val)}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{row.type || row.provider_type}</div>
          </div>
        </div>
      )
    },
    {
      key: 'patientName',
      label: 'Patient',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {row.patientId || '10293'}</div>
        </div>
      )
    },
    {
      key: 'packageName',
      label: 'Service',
      render: (val) => <div style={{ fontSize: '0.8125rem', color: '#475569' }}>{val} Care</div>
    },
    {
      key: 'date',
      label: 'Schedule',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>at {row.time}</div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Amount',
      render: (val) => <div style={{ fontWeight: 700 }}>${val}</div>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => {
        const getBgColor = (status) => {
          switch (status) {
            case 'Confirmed': return 'var(--ecare-primary-bg)'
            case 'Pending': return '#fffbeb'
            case 'In-Progress': return '#f0f9ff'
            case 'Cancelled': return '#fef2f2'
            default: return 'transparent'
          }
        }
        const getTextColor = (status) => {
          switch (status) {
            case 'Confirmed': return 'var(--ecare-primary)'
            case 'Pending': return '#b45309'
            case 'In-Progress': return '#0ea5e9'
            case 'Cancelled': return '#ef4444'
            default: return 'inherit'
          }
        }
        
        if (isPatient) {
          return (
            <span style={{
              background: getBgColor(val), 
              color: getTextColor(val), 
              padding: '0.3rem 0.6rem', 
              borderRadius: '9999px', 
              fontSize: '0.75rem', 
              fontWeight: 700,
              display: 'inline-block'
            }}>
              {val}
            </span>
          )
        }

        return (
          <div style={{ width: '130px' }}>
            <CustomSelect 
              value={val}
              onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'In-Progress', label: 'In-Progress' },
                { value: 'Cancelled', label: 'Cancelled' }
              ]}
              customTriggerStyle={{ 
                background: getBgColor(val), 
                color: getTextColor(val), 
                border: 'none', 
                padding: '0.3rem 0.6rem', 
                borderRadius: '9999px', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                minWidth: 'unset',
                boxShadow: 'none'
              }}
            />
          </div>
        )
      }
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (val, row) => {
        const state = useStore.getState();
        const gateways = Object.entries(state.paymentGateways || {})
          .filter(([_, g]) => g.enabled)
          .map(([k, g]) => ({ value: formatPaymentMethod(g.name || k), label: formatPaymentMethod(g.name || k) }));

        const getStyle = (status) => {
          const s = status?.toLowerCase() || 'pending';
          if (s.includes('paid')) return { bg: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', border: 'var(--ecare-primary)40' };
          if (s.includes('pending')) return { bg: '#fff7ed', color: '#d97706', border: '#f59e0b40' };
          if (s.includes('verify')) return { bg: '#eff6ff', color: '#2563eb', border: '#3b82f640' };
          return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
        };
        const style = getStyle(val);
        const cleanMethod = formatPaymentMethod(row.paymentMethod) || 'Cash';

        if (isPatient) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
              <span style={{ 
                padding: '3px 8px', borderRadius: '20px', 
                background: style.bg, color: style.color,
                fontSize: '0.65rem', fontWeight: 800, textAlign: 'center',
                border: `1px solid ${style.border}`, textTransform: 'uppercase',
                display: 'inline-block'
              }}>
                {val || 'Pending'}
              </span>
              <span style={{ 
                padding: '3px 8px', borderRadius: '8px', 
                background: '#f1f5f9', color: '#475569',
                fontSize: '0.65rem', fontWeight: 700, textAlign: 'center',
                display: 'inline-block'
              }}>
                {cleanMethod}
              </span>
            </div>
          )
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
            <CustomSelect 
              value={val || 'Pending'}
              onChange={(newStatus) => updateCareProviderBooking(row.id, { paymentStatus: newStatus })}
              options={[
                { value: 'Paid', label: 'Paid' },
                { value: 'Partially Paid', label: 'Partial' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Under Verify', label: 'Verify' }
              ]}
              customTriggerStyle={{ 
                padding: '3px 8px', borderRadius: '20px', 
                background: style.bg, color: style.color,
                fontSize: '0.65rem', fontWeight: 800, textAlign: 'center',
                border: `1px solid ${style.border}`, textTransform: 'uppercase',
                minWidth: 'unset', boxShadow: 'none'
              }}
            />
            <CustomSelect 
              value={cleanMethod}
              onChange={(newMethod) => updateCareProviderBooking(row.id, { paymentMethod: newMethod })}
              options={gateways}
              customTriggerStyle={{ 
                padding: '3px 8px', borderRadius: '8px', 
                background: '#f1f5f9', color: '#475569',
                fontSize: '0.65rem', fontWeight: 700,
                border: 'none', minWidth: 'unset', boxShadow: 'none'
              }}
            />
          </div>
        );
      }
    },
    {
      key: 'issuedBy',
      label: 'Audit',
      render: (val) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ecare-primary)' }}>{val || 'System'}</span>
          <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>ADMIN ACTION</span>
        </div>
      )
    }
  ]

  const handleDelete = (id) => {
    openConfirm({
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel this care provider booking?',
      confirmText: 'Yes, Cancel',
      onConfirm: () => deleteCareProviderBooking(id)
    })
  }

  const handleBulkDelete = (selectedIds) => bulkDelete('care-provider-bookings', selectedIds)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
      
      {isPatient && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            flexShrink: 0
          }}>
            <CalendarCheck size={24} weight="duotone" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px' }}>Need to change, reschedule, or cancel a booking?</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.4 }}>
              For patient safety and schedule synchronization, booked appointments and services cannot be modified directly online. Please contact {window.ecareConfig?.siteName || 'E-CARE'} clinic administration at <strong>{window.ecareConfig?.sitePhone || '+1 (800) 555-0199'}</strong> or email <strong>{window.ecareConfig?.siteEmail || 'support@e-care.com'}</strong> for assistance.
            </p>
          </div>
        </div>
      )}

      {/* Stat Grid */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard 
          title="Total Bookings" 
          value={bookings.length} 
          icon={CalendarCheck} 
          color="var(--ecare-primary)" 
          delay={0.1} 
        />
        <StatCard 
          title="Pending Approvals" 
          value={bookings.filter(b => b.status === 'Pending').length} 
          icon={Hourglass} 
          color="#f59e0b" 
          delay={0.2} 
        />
        <StatCard 
          title="Completed Care" 
          value={bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length} 
          icon={CheckCircle} 
          color="var(--ecare-primary)" 
          delay={0.3} 
        />
        <StatCard 
          title="Cancelled" 
          value={bookings.filter(b => b.status === 'Cancelled').length} 
          icon={XCircle} 
          color="#ef4444" 
          delay={0.4} 
        />
      </div>

      <DataTable 
        title="Bookings Management"
        data={bookings}
        columns={columns}
        searchPlaceholder="Search bookings, patients or providers..."
        addLabel={isPatient ? null : "Add Booking"}
        hideAdd={isPatient}
        onAdd={isPatient ? null : () => {
          setEditingCareProviderBooking(null)
          setCareProviderBookingModal(true)
        }}
        filterOptions={[
          { label: 'Confirmed', value: 'Confirmed' },
          { label: 'Pending', value: 'Pending' },
          { label: 'In-Progress', value: 'In-Progress' },
          { label: 'Cancelled', value: 'Cancelled' }
        ]}
        onDelete={isPatient ? null : handleDelete}
        onBulkDelete={isPatient ? null : handleBulkDelete}
        onEdit={isPatient ? null : (row) => {
          setEditingCareProviderBooking(row)
          setCareProviderBookingModal(true)
        }}
      />
    </motion.div>
  )
}

// ─── Pending Approvals Tab ────────────────────────────────────────────────
const DisplayGroup = ({ label, children, className, style }) => (
  <div className={`ecare-form-group ${className || ''}`} style={style}>
    <label className="ecare-label">{label}</label>
    <div style={{ 
      padding: '0.625rem 0.875rem', borderRadius: '12px', background: '#f8fafc', 
      border: '1px solid #e2e8f0', fontSize: '0.875rem', color: 'var(--ecare-text-main)',
      minHeight: '42px', display: 'flex', alignItems: 'center'
    }}>
      {children || <span style={{ color: '#94a3b8' }}>Not provided</span>}
    </div>
  </div>
)

const PendingApprovalsTab = () => {
  const { openConfirm, servicePricing, pendingCareProviders: pendingProviders, updateCareProvider, removePendingCareProvider } = useStore()
  const [selectedProvider, setSelectedProvider] = useState(null)

  const selectedProviderPackages = useMemo(() => {
    if (!selectedProvider) return []
    let allowed = []
    if (Array.isArray(selectedProvider.packages)) {
      allowed = selectedProvider.packages
    } else if (typeof selectedProvider.packages === 'string') {
      try {
        allowed = JSON.parse(selectedProvider.packages)
      } catch {
        allowed = []
      }
    }
    const pricing = Array.isArray(servicePricing) ? servicePricing : []
    return pricing.filter(p => allowed.includes(p.id) || allowed.includes(Number(p.id)) || allowed.includes(String(p.id)))
  }, [selectedProvider, servicePricing])

  const handleApprove = (provider) => {
    openConfirm({
      title: 'Approve Provider',
      message: `Are you sure you want to approve ${provider.name}? They will be added to the active care provider list.`,
      onConfirm: async () => {
        const { updateCareProvider } = useStore.getState();
        await updateCareProvider(provider.id, {
          status: 'Active'
        });
        setSelectedProvider(null);
      }
    })
  }

  const handleReject = (id) => {
    openConfirm({
      title: 'Reject Application',
      message: 'Are you sure you want to reject this care provider application?',
      confirmText: 'Yes, Reject',
      onConfirm: () => removePendingCareProvider(id)
    })
  }

  const handleBulkDelete = (selectedIds) => {
    selectedIds.forEach(id => removePendingCareProvider(id))
  }

  const columns = [
    {
      key: 'name',
      label: 'Provider Details',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: '150px', maxWidth: '220px' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 
          }}>
            {(row.avatar || row.photo || row.driverPhoto || row.driver_photo) ? (
              <img src={row.avatar || row.photo || row.driverPhoto || row.driver_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                {getInitials(val)}
              </span>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span title={val} style={{ fontWeight: 600, color: 'var(--ecare-text-main)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{val}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, fontFamily: 'monospace' }}>#PRO-{String(row.id).slice(0, 8).toUpperCase()}</span>
              <span>•</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.type} • {row.experience || row.exp || '1 Year'} Exp</span>
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact Information',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-main)', fontSize: '0.75rem' }}>
            <Phone size={12} color="#94a3b8" /> {row.phone}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-muted)', fontSize: '0.75rem' }}>
            <EnvelopeSimple size={12} color="#94a3b8" /> {row.email}
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Request Date',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ecare-text-main)', fontSize: '0.8125rem', fontWeight: 500 }}>
          <Timer size={16} color="#94a3b8" />
          {val ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Decision',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setSelectedProvider(row)}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="View Profile"
          >
            <Eye size={18} weight="bold" />
          </button>
          <button 
            onClick={() => handleApprove(row)}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Approve"
          >
            <CheckCircle size={18} weight="bold" />
          </button>
          <button 
            onClick={() => handleReject(row.id)}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Reject"
          >
            <XCircle size={18} weight="bold" />
          </button>
        </div>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <DataTable 
        data={pendingProviders}
        columns={columns}
        searchPlaceholder="Search by name, type or email..."
        title={`Pending Applications (${pendingProviders.length})`}
      />

      <Portal>
        <AnimatePresence>
          {selectedProvider && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setSelectedProvider(null)} 
                style={{ 
                  position: 'fixed', 
                  inset: 0, 
                  background: 'rgba(15, 23, 42, 0.3)', 
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 2000 
                }} 
              />
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                pointerEvents: 'none'
              }}>
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="ecare-card"
                  style={{ 
                    width: '100%', 
                    maxWidth: '850px', 
                    maxHeight: '90vh', 
                    pointerEvents: 'auto',
                    position: 'relative', 
                    padding: 0, 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflow: 'hidden', 
                    background: 'white',
                    borderRadius: '16px'
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' 
                      }}>
                        {(selectedProvider.avatar || selectedProvider.photo || selectedProvider.driverPhoto || selectedProvider.driver_photo) ? (
                          <img src={selectedProvider.avatar || selectedProvider.photo || selectedProvider.driverPhoto || selectedProvider.driver_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#374151', fontWeight: 800, fontSize: '0.875rem' }}>
                            {getInitials(selectedProvider.name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Review Application: {selectedProvider.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>Submitted on {selectedProvider.date}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedProvider(null)} 
                      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>

                  {/* Form Content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} className="ecare-scrollbar">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      
                      {/* Personal Information */}
                      <div className="ecare-card" style={{ padding: '1rem 1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Personal Information</h3>
                        </div>
                        
                        <div className="ecare-form-grid">
                          <DisplayGroup label="Name">{selectedProvider.name}</DisplayGroup>
                          <DisplayGroup label="Email">{selectedProvider.email}</DisplayGroup>
                          <DisplayGroup label="Mobile">{selectedProvider.phone}</DisplayGroup>
                        </div>

                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                          <DisplayGroup label="Care Provider Type">{selectedProvider.type}</DisplayGroup>
                          <DisplayGroup label="Date of Birth">{selectedProvider.dob}</DisplayGroup>
                          <DisplayGroup label="Gender">{selectedProvider.gender}</DisplayGroup>
                        </div>

                        <div style={{ marginTop: '0.25rem' }}>
                          <DisplayGroup label="Professional Bio">
                            <div style={{ lineHeight: 1.5 }}>{selectedProvider.bio}</div>
                          </DisplayGroup>
                        </div>
                      </div>

                      {/* Professional Credentials */}
                      <div className="ecare-card" style={{ padding: '1rem 1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Professional Credentials</h3>
                        
                        <div className="ecare-form-grid">
                          <DisplayGroup label="NID Number">{selectedProvider.nid}</DisplayGroup>
                          <DisplayGroup label="Years of Experience">{selectedProvider.exp}</DisplayGroup>
                          <DisplayGroup label="Nationality">{selectedProvider.nationality}</DisplayGroup>
                        </div>

                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                          <DisplayGroup label="Organization / Clinic">{selectedProvider.organization}</DisplayGroup>
                          <DisplayGroup label="Skills & Competencies" className="ecare-span-2">{selectedProvider.skills}</DisplayGroup>
                        </div>
                      </div>

                      {/* Universal Service Durations */}
                      <div className="ecare-card" style={{ padding: '1rem 1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Available Service Durations</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          {(selectedProviderPackages || []).map((p) => (
                            <div key={p.id} style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b' }}>
                                <Clock size={14} /> {p.duration}
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>৳{Number(p.price).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bank Info & Documents */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="ecare-card" style={{ padding: '1rem 1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Bank Information</h3>

                          {selectedProvider.accountType === 'Bank Account' ? (
                            <>
                              <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <DisplayGroup label="Bank Name">{selectedProvider.bankName}</DisplayGroup>
                                <DisplayGroup label="Branch">{selectedProvider.branchName}</DisplayGroup>
                              </div>
                              <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '0.25rem' }}>
                                <DisplayGroup label="Account Name">{selectedProvider.accountName}</DisplayGroup>
                                <DisplayGroup label="Account No">{selectedProvider.accountNumber}</DisplayGroup>
                              </div>
                            </>
                          ) : (
                            <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                              <DisplayGroup label="Provider">{selectedProvider.mobileProvider}</DisplayGroup>
                              <DisplayGroup label="Mobile No">{selectedProvider.mobileNumber}</DisplayGroup>
                            </div>
                          )}
                        </div>

                        <div className="ecare-card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Documents</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Array.isArray(selectedProvider.documents) && selectedProvider.documents.length > 0 ? (
                              selectedProvider.documents.map((doc, idx) => (
                                <div key={idx} style={{ 
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                  padding: '10px 15px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                    <FilePdf size={20} color="#ef4444" weight="fill" />
                                    <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                      {doc.name}
                                    </span>
                                  </div>
                                  <a 
                                    href={doc.data} 
                                    download={doc.name}
                                    style={{ 
                                      fontSize: '0.75rem', fontWeight: 700, color: 'var(--ecare-primary)', 
                                      textDecoration: 'none', background: 'var(--ecare-primary-bg)', 
                                      padding: '4px 12px', borderRadius: '89px' 
                                    }}
                                  >
                                    Download
                                  </a>
                                </div>
                              ))
                            ) : (
                              <div style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: '#94a3b8', background: 'white' }}>
                                <FilePdf size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                <p style={{ fontSize: '0.75rem', margin: 0 }}>No documents uploaded</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision Footer */}
                  <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => { handleReject(selectedProvider); setSelectedProvider(null); }} className="ecare-btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', color: '#ef4444', borderColor: '#fca5a5' }}>
                      <X size={18} weight="bold" /> Reject Application
                    </button>
                    <button type="button" onClick={() => { handleApprove(selectedProvider); setSelectedProvider(null); }} className="ecare-button" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={18} weight="bold" /> Approve & Register
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </motion.div>

  )
}

const ProvidersListTab = () => {
  const { 
    careProviders, deleteCareProvider, openConfirm, 
    setActivePage, setEditingCareProvider, careProviderBookings,
    pendingCareProviders, updateCareProvider
  } = useStore()
  const { isAdmin, canAccess } = useAuth()

  const safeProviders = Array.isArray(careProviders) ? careProviders : []
  const safeBookings = Array.isArray(careProviderBookings) ? careProviderBookings : []
  const completedShifts = safeBookings.filter(b => b.status === 'Completed').length

  const handleDelete = (id) => {
    openConfirm({
      title: 'Remove Provider',
      message: 'Are you sure you want to remove this care provider? This action will permanently delete their record.',
      confirmText: 'Remove',
      onConfirm: () => deleteCareProvider(id)
    })
  }

  const handleEdit = (provider) => {
    setEditingCareProvider(provider)
    setActivePage('care-providers')
  }

  const columns = [
    {
      key: 'name',
      label: 'Provider Info',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: '150px', maxWidth: '200px' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)',
            overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0
          }}>
            {(row.avatar || row.photo || row.driverPhoto || row.driver_photo) ? (
              <img src={row.avatar || row.photo || row.driverPhoto || row.driver_photo} alt={val} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                {getInitials(val)}
              </span>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div 
              title={val}
              style={{ 
                fontWeight: 700, 
                color: 'var(--ecare-text-main)', 
                fontSize: '0.8125rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {val}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, fontFamily: 'monospace' }}>#PRO-{String(row.id).slice(0, 8).toUpperCase()}</span>
              <span>•</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.type || 'Provider'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'expertise',
      label: 'Expertise',
      render: (_, row) => {
        const skillsText = row.skills || row.skill || 'General Care'
        const expRaw = row.experience || row.exp || '1 Year'
        const expText = String(expRaw).toLowerCase().includes('year') || String(expRaw).toLowerCase().includes('yr') ? expRaw : `${expRaw} Years`
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', maxWidth: '140px', minWidth: '100px' }}>
            <div 
              title={skillsText}
              style={{ 
                fontSize: '0.78rem', 
                color: 'var(--ecare-text-main)', 
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'default'
              }}
            >
              {skillsText}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)' }}>{expText} exp</div>
          </div>
        )
      }
    },
    {
      key: 'contact',
      label: 'Contact Details',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', maxWidth: '135px', minWidth: '105px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#475569', whiteSpace: 'nowrap' }}>
            <Phone size={12} color="#94a3b8" /> {row.phone}
          </div>
          <div 
            title={row.email}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '0.7rem', 
              color: '#94a3b8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <EnvelopeSimple size={12} style={{ flexShrink: 0 }} /> 
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'professional',
      label: 'Professional',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', maxWidth: '140px', minWidth: '105px' }}>
          <div 
            title={row.organization || 'Independent'}
            style={{ 
              fontSize: '0.78rem', 
              color: 'var(--ecare-text-main)',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'default'
            }}
          >
            {row.organization || 'Independent'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ID: {row.nid || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'address',
      label: 'Location',
      render: (val) => (
        <div 
          title={val || 'Dhaka, Bangladesh'}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '0.78rem', 
            color: '#64748b', 
            maxWidth: '130px', 
            minWidth: '95px',
            overflow: 'hidden',
            cursor: 'default'
          }}
        >
          <MapPin size={12} style={{ flexShrink: 0 }} /> 
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{val || 'Dhaka, Bangladesh'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <div style={{ width: '85px' }}>
          <CustomSelect 
            value={val || 'Active'} 
            onChange={canAccess('care_register') ? (newStatus) => updateCareProvider(row.id, { status: newStatus }) : null}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
            customTriggerStyle={{ 
              background: (val === 'Active' || !val) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: (val === 'Active' || !val) ? 'var(--ecare-primary)' : '#ef4444',
              border: 'none',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.45rem',
              borderRadius: '9999px',
              minWidth: 'unset',
              height: '24px',
              boxShadow: 'none',
              cursor: canAccess('care_register') ? 'pointer' : 'default'
            }}
          />
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Active Providers" value={safeProviders.length} icon={Users} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Total Service Points" value={new Set(safeProviders.filter(p => p.address).map(p => p.address)).size} icon={MapPin} color="#0891b2" delay={0.2} />
        <StatCard title="Pending Review" value={Array.isArray(pendingCareProviders) ? pendingCareProviders.length : 0} icon={Hourglass} color="#f59e0b" delay={0.3} />
        <StatCard title="Completed Shifts" value={completedShifts.toLocaleString()} icon={CalendarCheck} color="var(--ecare-primary)" delay={0.4} />
      </div>

      <DataTable 
        title="Care Provider Registry"
        data={safeProviders}
        columns={columns}
        searchPlaceholder="Search providers by name, type or location..."
        addLabel={canAccess('care_register') ? "Register New" : null}
        onAdd={canAccess('care_register') ? () => {
          setEditingCareProvider(null)
          setActivePage('care-providers')
        } : null}
        onDelete={canAccess('care_register') ? handleDelete : null}
        onEdit={canAccess('care_register') ? handleEdit : null}
      />
    </div>
  )
}

const CareProviders = ({ view = 'add' }) => {
  const { isAdmin, canAccess } = useAuth()
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ paddingBottom: '2rem' }}>
      <AnimatePresence mode="wait">
        {canAccess('care_register') && view === 'add' && <AddProviderTab key="add" />}
        {view === 'bookings' && <BookingsTab key="bookings" />}
        {canAccess('care_approve') && view === 'pending' && <PendingApprovalsTab key="pending" />}
        {view === 'list' && <ProvidersListTab key="list" />}
      </AnimatePresence>
    </motion.div>
  )
}

export default CareProviders
