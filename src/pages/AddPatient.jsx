import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, UploadSimple, CaretLeft, Warning } from 'phosphor-react'
import useStore from '../store/useStore'
import CustomDatePicker from '../components/CustomDatePicker'
import CustomSelect from '../components/CustomSelect'
import useDuplicateCheck from '../hooks/useDuplicateCheck'
import { normalizeGender } from '../utils/gender'

const DuplicateAlert = ({ message }) => (
  <motion.div 
    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
    style={{ 
      display: 'flex', alignItems: 'center', gap: '8px', 
      padding: '8px 12px', borderRadius: '10px', background: '#fef2f2', 
      border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.7rem', 
      fontWeight: 600, marginBottom: '8px'
    }}
  >
    <Warning size={14} weight="fill" />
    {message}
  </motion.div>
)

const InputGroup = ({ label, required, children, helper, duplicate }) => (
  <div className="ecare-form-group">
    <label className="ecare-label">
      {required && <span>*</span>}
      {label}
    </label>
    {duplicate && <DuplicateAlert message={duplicate} />}
    {children}
    {helper && <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>{helper}</p>}
  </div>
)

const AddPatient = () => {
  const { setActivePage, addPatient, updatePatient, editingPatient } = useStore()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    gender: 'MALE',
    address: '',
    city: '',
    country: '',
    zip: '',
    status: 'Active',
    bloodGroup: 'Unknown',
    avatar: null
  })

  const { name: nameExists, email: emailExists } = useDuplicateCheck(formData.name, formData.email, 'patients', editingPatient?.id)

  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    if (editingPatient) {
      setFormData({
        name: editingPatient.name || '',
        email: editingPatient.email || '',
        password: '',
        confirmPassword: '',
        phone: editingPatient.phone || '',
        dob: editingPatient.dob || '',
        gender: normalizeGender(editingPatient.gender) || 'MALE',
        address: editingPatient.address || '',
        city: editingPatient.city || '',
        country: editingPatient.country || '',
        zip: editingPatient.zip || '',
        status: editingPatient.status || 'Active',
        bloodGroup: editingPatient.bloodGroup || 'Unknown',
        avatar: editingPatient.avatar || null
      })
      if (editingPatient.avatar) setPreviewImage(editingPatient.avatar)
    }
  }, [editingPatient])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
        handleInputChange('avatar', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      gender: normalizeGender(formData.gender) || 'MALE'
    }
    if (editingPatient) {
      updatePatient(editingPatient.id, payload)
    } else {
      addPatient(payload)
    }
    setActivePage('patient-list')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '0.5rem 0 2rem 0' }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '1.25rem', alignItems: 'start' }}>
          
          {/* Personal Information */}
          <div className="ecare-card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Personal Information</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0'
                }}>
                  {previewImage ? <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={16} color="#94a3b8" />}
                </div>
                <input type="file" id="profilePic" style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
                <label htmlFor="profilePic" className="ecare-btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderRadius: '9999px', cursor: 'pointer' }}>
                  <UploadSimple size={10} weight="bold" /> Upload
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <InputGroup label="Full Name" required duplicate={nameExists ? "A patient with this name already exists!" : null}>
                <input 
                  type="text" className="ecare-input" placeholder="Full name" 
                  value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} 
                  style={{ borderColor: nameExists ? '#f87171' : '' }}
                />
              </InputGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputGroup label="Email" required duplicate={emailExists ? "This email is already in use!" : null}>
                  <input 
                    type="email" className="ecare-input" placeholder="Email" 
                    value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} 
                    style={{ borderColor: emailExists ? '#f87171' : '' }}
                  />
                </InputGroup>
                <InputGroup label="Phone" required>
                  <input type="tel" className="ecare-input" placeholder="Phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                </InputGroup>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputGroup label="Date of Birth" required>
                  <CustomDatePicker value={formData.dob} onChange={(val) => handleInputChange('dob', val)} placeholder="mm/dd/yyyy" />
                </InputGroup>
                <InputGroup label="Blood Group">
                  <CustomSelect 
                    value={formData.bloodGroup}
                    onChange={(val) => handleInputChange('bloodGroup', val)}
                    options={[
                      { value: 'Unknown', label: 'Unknown' },
                      { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                      { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                      { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                      { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }
                    ]}
                  />
                </InputGroup>
              </div>
              <InputGroup label="Gender" required>
                <div className="ecare-radio-group" style={{ width: '100%' }}>
                  {['MALE', 'FEMALE', 'OTHER'].map(g => (
                    <button key={g} type="button" className={`ecare-radio-btn ${formData.gender === g ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => handleInputChange('gender', g)}>{g}</button>
                  ))}
                </div>
              </InputGroup>
            </div>
          </div>

          {/* Portal Security Section */}
          <div className="ecare-card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1.25rem' }}>Portal Security</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <InputGroup label="Portal Password" required helper="Used for patient portal sign-in.">
                <input type="password" className="ecare-input" placeholder="Min. 8 characters" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} />
              </InputGroup>
              <InputGroup label="Confirm Password" required>
                <input type="password" className="ecare-input" placeholder="Repeat password" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} />
              </InputGroup>
              <div style={{ 
                marginTop: '1rem', padding: '1rem', borderRadius: '12px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                fontSize: '0.75rem', lineHeight: '1.4'
              }}>
                <strong>Security Tip:</strong> Use a combination of letters, numbers, and symbols for a stronger clinic account password.
              </div>
            </div>
          </div>

          {/* Address & Status Section */}
          <div className="ecare-card" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1.25rem' }}>Address & Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              <InputGroup label="Street Address">
                <input type="text" className="ecare-input" placeholder="Street address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
              </InputGroup>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputGroup label="City">
                  <input type="text" className="ecare-input" placeholder="City" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} />
                </InputGroup>
                <InputGroup label="Country">
                  <input type="text" className="ecare-input" placeholder="Country" value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)} />
                </InputGroup>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <InputGroup label="Postal Code">
                  <input type="text" className="ecare-input" placeholder="Zip" value={formData.zip} onChange={(e) => handleInputChange('zip', e.target.value)} />
                </InputGroup>
                <InputGroup label="Clinical Status" required>
                  <CustomSelect 
                    value={formData.status}
                    onChange={(val) => handleInputChange('status', val)}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'In Treatment', label: 'In Treatment' },
                      { value: 'Recovered', label: 'Recovered' },
                      { value: 'Inactive', label: 'Inactive' }
                    ]}
                  />
                </InputGroup>
              </div>
              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center', marginTop: 'auto', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="ecare-btn-secondary" 
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}
                  onClick={() => setFormData({
                    name: '', email: '', phone: '', nid: '', dob: '', gender: 'MALE', 
                    address: '', city: '', country: '', zip: '', status: 'Active', 
                    password: '', confirmPassword: ''
                  })}
                >
                  Reset
                </button>
                <button type="submit" className="ecare-button" style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}>
                  {editingPatient ? 'Update Patient' : 'Register Patient'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>
    </motion.div>
  )
}

export default AddPatient
