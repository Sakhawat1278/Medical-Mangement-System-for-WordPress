import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UploadSimple, FilePdf, CaretLeft, Camera } from 'phosphor-react'
import useStore from '../store/useStore'
import CustomSelect from '../components/CustomSelect'
import CustomDatePicker from '../components/CustomDatePicker'

const InputGroup = ({ label, required, children }) => (
  <div className="ecare-form-group">
    <label className="ecare-label">
      {required && <span>*</span>}
      {label}
    </label>
    {children}
  </div>
)

const AddDoctor = () => {
  const { user, setActivePage, editingDoctor, specialities, services: allServices, addDoctor, updateDoctor } = useStore()
  
  // Filter active specialities for the dropdown
  const activeSpecialities = specialities
    .filter(s => s.status === 'Active')
    .map(s => ({ value: s.name, label: s.name }))

  // Backward-compat migration: old records stored mobile banking data in bankName/accountNumber.
  // Detect and remap to the new dedicated columns so the correct tab is pre-filled.
  const _isMobileLegacy = editingDoctor?.accountType === 'Mobile Banking' &&
    !editingDoctor?.mobileProvider && !!editingDoctor?.bankName

  const [formData, setFormData] = useState({
    name: editingDoctor?.name || '',
    email: editingDoctor?.email || '',
    mobile: editingDoctor?.phone || '',
    gender: editingDoctor?.gender || 'Male',
    dob: editingDoctor?.dob || '',
    nid: editingDoctor?.nid || '',
    fee: editingDoctor?.fee || '',
    bio: editingDoctor?.bio || '',
    address: editingDoctor?.address || '',
    detailedBio: editingDoctor?.detailedBio || '',
    bmdcCode: editingDoctor?.bmdcCode || '',
    degrees: editingDoctor?.degrees || '',
    experience: editingDoctor?.experience || '',
    patientsCount: editingDoctor?.patientsCount || '',
    followUpDays: editingDoctor?.followUpDays || '',
    followUpCost: editingDoctor?.followUpCost || '',
    branchName: _isMobileLegacy ? '' : (editingDoctor?.branchName || ''),
    accountName: _isMobileLegacy ? '' : (editingDoctor?.accountName || ''),
    accountNumber: _isMobileLegacy ? '' : (editingDoctor?.accountNumber || ''),
    password: '',
    confirmPassword: '',
    consultationStatus: editingDoctor?.consultationStatus || 'Active',
    instantCallStatus: editingDoctor?.instantCallStatus || 'Inactive'
  })

  const [accountType, setAccountType] = useState(editingDoctor?.accountType || 'Bank Account')
  const [specialty, setSpecialty] = useState(editingDoctor?.specialization ? (typeof editingDoctor.specialization === 'string' ? editingDoctor.specialization : String(editingDoctor.specialization)).split(', ') : [])
  const [selectedServices, setSelectedServices] = useState(editingDoctor?.services ? (Array.isArray(editingDoctor.services) ? editingDoctor.services : (typeof editingDoctor.services === 'string' ? editingDoctor.services : String(editingDoctor.services)).split(', ')) : [])
  const [bankName, setBankName] = useState(_isMobileLegacy ? '' : (editingDoctor?.bankName || ''))
  const [mobileProvider, setMobileProvider] = useState(_isMobileLegacy ? (editingDoctor?.bankName || '') : (editingDoctor?.mobileProvider || ''))
  const [mobileNumber, setMobileNumber] = useState(_isMobileLegacy ? (editingDoctor?.accountNumber || '') : (editingDoctor?.mobileNumber || ''))
  const [expiryDate, setExpiryDate] = useState(editingDoctor?.expiryDate || '')
  const [previewImage, setPreviewImage] = useState(editingDoctor?.avatar || null)
  const [degreeInput, setDegreeInput] = useState('')
  const [degrees, setDegrees] = useState(editingDoctor?.degrees ? (typeof editingDoctor.degrees === 'string' ? editingDoctor.degrees : String(editingDoctor.degrees)).split(', ') : [])
  const [documents, setDocuments] = useState(editingDoctor?.documents ? (Array.isArray(editingDoctor.documents) ? editingDoctor.documents : JSON.parse(editingDoctor.documents)) : [])

  // Dynamic services based on selected specialities - Grouped by Specialty
  const availableServices = specialty.flatMap(specName => {
    const specServices = allServices
      .filter(s => s.speciality === specName && s.status === 'Active')
      .map(s => ({ value: s.name, label: s.name }))
    
    if (specServices.length > 0) {
      return [
        { isHeader: true, label: specName, value: `header-${specName}` },
        ...specServices
      ]
    }
    return []
  })

  // Sync services when speciality changes (remove services that no longer belong to selected specialities)
  useEffect(() => {
    const validServiceNames = allServices
      .filter(s => specialty.includes(s.speciality) && s.status === 'Active')
      .map(s => s.name)
    setSelectedServices(prev => prev.filter(s => validServiceNames.includes(s)))
  }, [specialty, allServices])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreviewImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleDegreeKeyDown = (e) => {
    if (e.key === 'Enter' && degreeInput.trim()) {
      e.preventDefault()
      if (!degrees.includes(degreeInput.trim())) {
        setDegrees([...degrees, degreeInput.trim()])
      }
      setDegreeInput('')
    }
  }

  const removeDegree = (deg) => {
    setDegrees(degrees.filter(d => d !== deg))
  }

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocuments(prev => [...prev, { name: file.name, data: reader.result, type: file.type }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index))
  }

  // Check if doctor has at least one telemedicine enabled service
  const hasTelemed = selectedServices.some(sName => {
    const service = allServices.find(s => s.name === sName);
    return service && (service.telemedicine === true || service.telemedicine === 1 || service.telemedicine === '1');
  });

  // Auto-disable instant call if no telemed service
  useEffect(() => {
    if (!hasTelemed && formData.instantCallStatus === 'Active') {
      handleInputChange('instantCallStatus', 'Inactive');
    }
  }, [hasTelemed]);

  const handleSubmit = (e) => {
    e.preventDefault()

    // When editing, preserve the current status; only set it for new registrations
    const resolvedStatus = editingDoctor
      ? (editingDoctor.status || 'Available')
      : (user?.ecareRole === 'admin' ? 'Available' : 'Pending')

    // Both bank account and mobile banking saved independently.
    // accountType = preferred payout method.
    const bankNameVal = bankName
    const branchNameVal = formData.branchName
    const accountNameVal = formData.accountName
    const accountNumberVal = formData.accountNumber
    const mobileProviderVal = mobileProvider
    const mobileNumberVal = mobileNumber

    const doctorData = {
      name: formData.name,
      specialization: specialty.join(', '),
      phone: formData.mobile,
      email: formData.email,
      gender: formData.gender,
      dob: formData.dob,
      address: formData.address,
      status: resolvedStatus,
      nid: formData.nid,
      fee: formData.fee,
      bio: formData.bio,
      detailedBio: formData.detailedBio,
      bmdcCode: formData.bmdcCode,
      expiryDate,
      degrees: degrees.join(', '),
      experience: formData.experience,
      patientsCount: formData.patientsCount,
      followUpDays: formData.followUpDays,
      followUpCost: formData.followUpCost,
      bankName: bankNameVal,
      branchName: branchNameVal,
      accountName: accountNameVal,
      accountNumber: accountNumberVal,
      mobileProvider: mobileProviderVal,
      mobileNumber: mobileNumberVal,
      accountType,
      services: Array.isArray(selectedServices) ? selectedServices.join(', ') : selectedServices,
      // Only update avatar if a new image was selected; otherwise keep existing
      avatar: previewImage || (editingDoctor?.avatar || ''),
      documents: JSON.stringify(documents),
      consultationStatus: formData.consultationStatus,
      instantCallStatus: formData.instantCallStatus
    }

    // Only include password in payload when it has been explicitly entered
    if (formData.password && formData.password.trim()) {
      doctorData.password = formData.password
    }

    if (editingDoctor) {
      updateDoctor(editingDoctor.id, doctorData)
    } else {
      addDoctor(doctorData)
    }
    setActivePage('doctor-list')
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '0.5rem 0 2rem 0' }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        {/* Profile Picture & Personal Information */}
        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Personal Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', 
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px #e2e8f0'
              }}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={20} color="#94a3b8" />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profile Photo</span>
                <input 
                  type="file" 
                  id="profilePic"
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <label 
                  htmlFor="profilePic" 
                  className="ecare-btn-secondary" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.2rem 0.75rem', 
                    fontSize: '0.7rem',
                    borderRadius: '9999px',
                    cursor: 'pointer'
                  }}
                >
                  <UploadSimple size={12} weight="bold" />
                  Upload
                </label>
              </div>
            </div>
          </div>
          
          <div className="ecare-form-grid">
            <InputGroup label="Name" required>
              <input 
                type="text" 
                className="ecare-input" 
                placeholder="Enter your name" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </InputGroup>
            <InputGroup label="Email" required>
              <input 
                type="email" 
                className="ecare-input" 
                placeholder="Enter your email" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </InputGroup>
            <InputGroup label="Mobile" required>
              <input 
                type="tel" 
                className="ecare-input" 
                placeholder="Enter your number" 
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
            <InputGroup label="NID" required>
              <input 
                type="text" 
                className="ecare-input" 
                placeholder="Enter your NID" 
                value={formData.nid}
                onChange={(e) => handleInputChange('nid', e.target.value)}
              />
            </InputGroup>
            <InputGroup label="Date of Birth">
              <CustomDatePicker 
                value={formData.dob}
                onChange={(v) => handleInputChange('dob', v)}
                placeholder="Select date of birth"
              />
            </InputGroup>
            <InputGroup label="Gender" required>
              <div style={{ display: 'flex', gap: '0.25rem', padding: '4px', background: '#f1f5f9', borderRadius: '9999px', width: 'fit-content' }}>
                {['Male', 'Female', 'Other'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleInputChange('gender', g)}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '9999px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: formData.gender === g ? 700 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: formData.gender === g ? 'white' : 'transparent',
                      color: formData.gender === g ? 'var(--ecare-primary)' : '#64748b',
                      boxShadow: formData.gender === g ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </InputGroup>
            <InputGroup label="Fee" required>
              <input 
                type="number" 
                className="ecare-input" 
                placeholder="Enter your Fee" 
                value={formData.fee}
                onChange={(e) => handleInputChange('fee', e.target.value)}
              />
            </InputGroup>
            <InputGroup label="Biography">
              <input 
                type="text" 
                className="ecare-input" 
                placeholder="Short biography summary" 
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              />
            </InputGroup>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <InputGroup label="Residential Address">
              <input 
                type="text" 
                className="ecare-input" 
                placeholder="Enter full residential address" 
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </InputGroup>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <InputGroup label="Detailed Biography">
              <textarea 
                className="ecare-input" 
                placeholder="Enter full professional biography"
                value={formData.detailedBio}
                onChange={(e) => handleInputChange('detailedBio', e.target.value)}
              ></textarea>
            </InputGroup>
          </div>
        </div>

        {/* Professional Information */}
        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Professional Information</h3>
          
          <div className="ecare-form-grid">
            <InputGroup label="BMDC Code" required>
              <input 
                type="text" 
                className="ecare-input" 
                placeholder="Enter BMDC code" 
                value={formData.bmdcCode}
                onChange={(e) => handleInputChange('bmdcCode', e.target.value)}
              />
            </InputGroup>
            <InputGroup label="BMDC Expiry Date" required>
              <CustomDatePicker 
                value={expiryDate}
                onChange={setExpiryDate}
                placeholder="Select expiry date"
              />
            </InputGroup>
            <InputGroup label="Degrees (Press Enter to add)" required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="ecare-input" 
                  placeholder="Type degree and press Enter" 
                  value={degreeInput}
                  onChange={(e) => setDegreeInput(e.target.value)}
                  onKeyDown={handleDegreeKeyDown}
                />
                {degrees.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                    {degrees.map((deg, i) => (
                      <span key={i} style={{ 
                        background: 'var(--ecare-primary-bg)', 
                        color: 'var(--ecare-primary)', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {deg}
                        <span onClick={() => removeDegree(deg)} style={{ cursor: 'pointer', fontSize: '14px' }}>&times;</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </InputGroup>
          </div>

          <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
            <InputGroup label="Specialty" required>
              <CustomSelect 
                value={specialty}
                onChange={setSpecialty}
                placeholder="Select Specialties"
                isMulti={true}
                isSearchable={true}
                options={activeSpecialities}
                style={{ width: '100%' }}
              />
            </InputGroup>
            <InputGroup label="Clinical Services" required>
              <CustomSelect 
                value={selectedServices}
                onChange={setSelectedServices}
                placeholder={specialty.length > 0 ? "Select Services" : "Select Specialty first"}
                isMulti={true}
                isSearchable={true}
                options={availableServices}
                style={{ width: '100%' }}
                disabled={specialty.length === 0}
              />
            </InputGroup>
            <InputGroup label="Years of Experience" required>
              <input 
                type="number" 
                className="ecare-input" 
                placeholder="Enter experience" 
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
              />
            </InputGroup>
            <InputGroup label="Number of Patients" required>
              <input 
                type="number" 
                className="ecare-input" 
                placeholder="Enter number of patients" 
                value={formData.patientsCount}
                onChange={(e) => handleInputChange('patientsCount', e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
            <InputGroup label="Follow up days" required>
              <input 
                type="number" 
                className="ecare-input" 
                placeholder="Follow up days" 
                value={formData.followUpDays}
                onChange={(e) => handleInputChange('followUpDays', e.target.value)}
              />
            </InputGroup>
            <InputGroup label="Follow up cost" required>
              <input 
                type="number" 
                className="ecare-input" 
                placeholder="Follow up cost" 
                value={formData.followUpCost}
                onChange={(e) => handleInputChange('followUpCost', e.target.value)}
              />
            </InputGroup>
            <InputGroup label="Consultation Status" required>
              <div className="ecare-radio-group" style={{ width: '100%' }}>
                <button type="button" className={`ecare-radio-btn ${formData.consultationStatus === 'Active' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => handleInputChange('consultationStatus', 'Active')}>Active</button>
                <button type="button" className={`ecare-radio-btn ${formData.consultationStatus === 'Inactive' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => handleInputChange('consultationStatus', 'Inactive')}>Inactive</button>
              </div>
            </InputGroup>
            <InputGroup label="Instant Call Mode" required>
              <div className="ecare-radio-group" style={{ width: '100%', opacity: hasTelemed ? 1 : 0.6 }}>
                <button 
                  type="button" 
                  disabled={!hasTelemed}
                  className={`ecare-radio-btn ${formData.instantCallStatus === 'Active' ? 'active' : ''}`} 
                  style={{ flex: 1, cursor: hasTelemed ? 'pointer' : 'not-allowed' }} 
                  onClick={() => handleInputChange('instantCallStatus', 'Active')}
                >
                  Active
                </button>
                <button 
                  type="button" 
                  className={`ecare-radio-btn ${formData.instantCallStatus === 'Inactive' ? 'active' : ''}`} 
                  style={{ flex: 1 }} 
                  onClick={() => handleInputChange('instantCallStatus', 'Inactive')}
                >
                  Inactive
                </button>
              </div>
              {!hasTelemed && <p style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '4px', marginHeight: 0 }}>Requires telemed service</p>}
            </InputGroup>
          </div>
        </div>

        {/* Bank Information, Documents & Portal Security – one row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', alignItems: 'start' }}>
          {/* Bank Information */}
          <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Bank Information</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <div className="ecare-radio-group">
                <button type="button" className={`ecare-radio-btn ${accountType === 'Bank Account' ? 'active' : ''}`} onClick={() => setAccountType('Bank Account')}>Bank Account</button>
                <button type="button" className={`ecare-radio-btn ${accountType === 'Mobile Banking' ? 'active' : ''}`} onClick={() => setAccountType('Mobile Banking')}>Mobile Banking</button>
              </div>
            </div>

            {accountType === 'Bank Account' ? (
              <>
                <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <InputGroup label="Bank Name" required>
                    <input 
                      type="text" 
                      className="ecare-input" 
                      placeholder="Enter bank name" 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </InputGroup>
                  <InputGroup label="Branch Name" required>
                    <input 
                      type="text" 
                      className="ecare-input" 
                      placeholder="Branch name" 
                      value={formData.branchName}
                      onChange={(e) => handleInputChange('branchName', e.target.value)}
                    />
                  </InputGroup>
                </div>
                
                <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '0.25rem' }}>
                  <InputGroup label="Account Name" required>
                    <input 
                      type="text" 
                      className="ecare-input" 
                      placeholder="Account name" 
                      value={formData.accountName}
                      onChange={(e) => handleInputChange('accountName', e.target.value)}
                    />
                  </InputGroup>
                  <InputGroup label="Account Number" required>
                    <input 
                      type="text" 
                      className="ecare-input" 
                      placeholder="Account number" 
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    />
                  </InputGroup>
                </div>
              </>
            ) : (
              <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <InputGroup label="Mobile Banking Provider" required>
                  <CustomSelect 
                    value={mobileProvider}
                    onChange={setMobileProvider}
                    placeholder="Select provider"
                    expandDirection="up"
                    options={[
                      { value: 'Bkash', label: 'Bkash' },
                      { value: 'Nagad', label: 'Nagad' },
                      { value: 'Rocket', label: 'Rocket' }
                    ]}
                    style={{ width: '100%' }}
                  />
                </InputGroup>
                <InputGroup label="Mobile Number" required>
                  <input 
                    type="tel" 
                    className="ecare-input" 
                    placeholder="Enter mobile number" 
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </InputGroup>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="ecare-card" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Documents</h3>
            
            <input 
              type="file" 
              id="doc-upload" 
              multiple 
              style={{ display: 'none' }} 
              onChange={handleDocumentUpload} 
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label 
                htmlFor="doc-upload"
                style={{ 
                  border: '1px dashed #cbd5e1', 
                  borderRadius: '12px', 
                  padding: '1.5rem',
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ecare-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <FilePdf size={28} color="#94a3b8" weight="duotone" style={{ marginBottom: '0.25rem' }} />
                <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.8125rem' }}>Upload Attachment</div>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Max file size: 2 MB</p>
              </label>

              {documents.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {documents.map((doc, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '8px 12px', 
                      background: '#f1f5f9', 
                      borderRadius: '8px',
                      fontSize: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FilePdf size={16} weight="fill" color="#ef4444" />
                        <span style={{ fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                      </div>
                      <button type="button" onClick={() => removeDocument(idx)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Portal Security */}
          {!editingDoctor && (
            <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Portal Security</h3>
              <InputGroup label="Portal Password" required>
                <input 
                  type="password" 
                  className="ecare-input" 
                  placeholder="Create clinical portal password" 
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
              </InputGroup>
              <InputGroup label="Confirm Password" required>
                <input 
                  type="password" 
                  className="ecare-input" 
                  placeholder="Confirm clinical portal password" 
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
              </InputGroup>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginHeight: 0 }}>
                * Password is required for the doctor to login to their clinical portal.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="ecare-btn-secondary" 
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}
            onClick={() => setFormData({
              name: '', email: '', mobile: '', nid: '', fee: '', bio: '', detailedBio: '', 
              bmdcCode: '', experience: '', patientsCount: '', followUpDays: '', followUpCost: '', 
              branchName: '', accountName: '', accountNumber: '', password: '', confirmPassword: ''
            })}
          >
            Reset
          </button>
          <button type="submit" className="ecare-button" style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0, width: 'auto' }}>
            {editingDoctor ? 'Update Doctor' : 'Register Doctor'}
          </button>
        </div>

      </form>
    </motion.div>
  )
}

export default AddDoctor
