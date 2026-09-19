import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, EnvelopeSimple, Phone, MapPin, Calendar, 
  IdentificationCard, Camera, PencilSimple, 
  Check, X, Briefcase, Heartbeat, ShieldCheck,
  CreditCard, Bank, FileArrowUp, Trash, CloudArrowUp,
  Circle, Globe, Buildings, GraduationCap, Clock
} from 'phosphor-react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import api from '../utils/api'
import CustomSelect from '../components/CustomSelect'
import CustomDatePicker from '../components/CustomDatePicker'
import MedicalVault from '../components/MedicalVault'
import useFileUpload from '../hooks/useFileUpload'
import { normalizeGender } from '../utils/gender'

const SectionHeader = ({ title }) => (
  <h3 className="ecare-profile-section-title" style={{ 
    fontSize: '0.9375rem', 
    fontWeight: 700, 
    color: 'var(--ecare-primary)', 
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    {title}
  </h3>
)

const InputGroup = ({ label, required, value, onChange, disabled, type = "text", placeholder, gridColumn }) => (
  <div className="ecare-profile-field" style={{ marginBottom: '1.25rem', gridColumn: gridColumn || 'auto' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '0.75rem', 
      fontWeight: 600, 
      color: '#374151', 
      marginBottom: '0.5rem' 
    }}>
      {required && <span style={{ color: '#ef4444', marginRight: '2px' }}>*</span>}
      {label}
    </label>
    <input 
      type={type}
      className="ecare-input" 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      style={{ 
        background: disabled ? '#f9fafb' : 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '0.625rem 0.875rem',
        fontSize: '0.8125rem',
        width: '100%',
        color: '#111827'
      }}
    />
  </div>
)

const Toggle = ({ label, active, onChange, required, activeLabel = "Active", inactiveLabel = "Inactive" }) => (
  <div className="ecare-profile-field ecare-profile-toggle" style={{ marginBottom: '1.25rem' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '0.75rem', 
      fontWeight: 600, 
      color: '#374151', 
      marginBottom: '0.5rem' 
    }}>
      {required && <span style={{ color: '#ef4444', marginRight: '2px' }}>*</span>}
      {label}
    </label>
    <div style={{ 
      display: 'flex', 
      background: '#f3f4f6', 
      padding: '4px', 
      borderRadius: '99px',
      width: 'fit-content',
      minWidth: '240px'
    }}>
      <button 
        type="button"
        onClick={() => onChange(true)}
        style={{ 
          flex: 1,
          padding: '6px 16px',
          borderRadius: '99px',
          border: 'none',
          fontSize: '0.75rem',
          fontWeight: 700,
          background: active ? 'white' : 'transparent',
          color: active ? 'var(--ecare-primary)' : '#6b7280',
          cursor: 'pointer',
          boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        {activeLabel}
      </button>
      <button 
        type="button"
        onClick={() => onChange(false)}
        style={{ 
          flex: 1,
          padding: '6px 16px',
          borderRadius: '99px',
          border: 'none',
          fontSize: '0.75rem',
          fontWeight: 700,
          background: !active ? 'white' : 'transparent',
          color: !active ? '#ef4444' : '#6b7280',
          cursor: 'pointer',
          boxShadow: !active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        {inactiveLabel}
      </button>
    </div>
  </div>
)

const Card = ({ children, style }) => (
  <div className="ecare-profile-card" style={{ 
    background: 'white', 
    border: '1px solid #f1f5f9', 
    borderRadius: '12px', 
    padding: '1.75rem',
    marginBottom: '1.5rem',
    ...style
  }}>
    {children}
  </div>
)

const Profile = () => {
  const { user, setUser, specialities, services: allServices } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState(user)
  const [activeBankTab, setActiveBankTab] = useState('Bank Account')
  // The actual DB row primary key — separate from user.id (WP user ID)
  const [dbRecordId, setDbRecordId] = useState(null)

  // Doctor specialty & services state (mirrors AddDoctor logic)
  const [specialty, setSpecialty] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [degrees, setDegrees] = useState([])
  const [degreeInput, setDegreeInput] = useState('')
  const [profileDocuments, setProfileDocuments] = useState([])
  const [newVitals, setNewVitals] = useState({ weight: '', wellness: '', bp: '', pulse: '' })

  const { readAsBase64, readManyAsBase64 } = useFileUpload()

  const handleLogVitals = async () => {
    if (!newVitals.weight && !newVitals.wellness) {
      toast.error('Please enter at least Weight or Wellness score')
      return
    }
    try {
      await api.post('/patient-vitals', {
        ...newVitals,
        patient_user_id: user.id,
        date: new Date().toISOString().split('T')[0]
      })
      toast.success('Health metrics logged successfully')
      setNewVitals({ weight: '', wellness: '', bp: '', pulse: '' })
      useStore.getState().initStore(true) // Refresh stats
    } catch (e) {
      toast.error('Failed to log metrics')
    }
  }

  // Build options from store
  const activeSpecialities = (specialities || [])
    .filter(s => s.status === 'Active')
    .map(s => ({ value: s.name, label: s.name }))

  const availableServices = specialty.flatMap(specName => {
    const specServices = (allServices || [])
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

  // Sync services when specialty changes (remove services no longer valid)
  useEffect(() => {
    if (!isEditing) return
    const validServiceNames = (allServices || [])
      .filter(s => specialty.includes(s.speciality) && s.status === 'Active')
      .map(s => s.name)
    setSelectedServices(prev => prev.filter(s => validServiceNames.includes(s)))
  }, [specialty])


  useEffect(() => {
    if (formData.accountType) {
      setActiveBankTab(formData.accountType)
    }
  }, [formData.accountType])

  const fetchProfile = async () => {
    if (!user.id) return
    setIsLoading(true)
    try {
      let module = 'staff'
      if (user.ecareRole === 'patient') module = 'patients'
      if (user.ecareRole === 'doctor') module = 'doctors'
      
      const response = await api.get(`/${module}?user_id=${user.id}`)
      if (response.data && (response.data.id || response.data.user_id)) {
        const data = response.data
        setDbRecordId(data.id || null) // Store the DB row pk separately

        // Backward-compat migration: old records stored mobile banking in bankName/accountNumber
        const _isMobileLegacy = data.accountType === 'Mobile Banking' &&
          !data.mobileProvider && !!data.bankName
        const migratedData = _isMobileLegacy ? {
          ...data,
          mobileProvider: data.bankName || '',
          mobileNumber: data.accountNumber || '',
          bankName: '',
          branchName: '',
          accountName: '',
          accountNumber: ''
        } : data

        setFormData({
          ...user,
          ...migratedData,
          gender: normalizeGender(migratedData.gender || user.gender || user.ecareGender)
        })
        // Set the bank tab to match loaded accountType
        if (migratedData.accountType) {
          setActiveBankTab(migratedData.accountType)
        }
        // Initialise specialty and services from saved strings
        if (data.specialization) {
          const specVal = typeof data.specialization === 'string' ? data.specialization : String(data.specialization)
          setSpecialty(specVal.split(', ').filter(Boolean))
        }
        if (data.services) {
          const svcArray = Array.isArray(data.services)
            ? data.services
            : (typeof data.services === 'string' ? data.services : String(data.services)).split(', ').filter(Boolean)
          setSelectedServices(svcArray)
        }
        if (data.documents) {
          const parsed = typeof data.documents === 'string' ? JSON.parse(data.documents) : data.documents
          setProfileDocuments(Array.isArray(parsed) ? parsed : [])
        }
        if (data.degrees) {
          const degVal = typeof data.degrees === 'string' ? data.degrees : String(data.degrees)
          setDegrees(degVal.split(', ').filter(Boolean))
        }
      } else {
        setFormData({
          ...user,
          gender: normalizeGender(user.gender || user.ecareGender)
        })
      }
    } catch (error) {
      console.error('Profile fetch failed:', error)
      setFormData({
        ...user,
        gender: normalizeGender(user.gender || user.ecareGender)
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user.id])

  const handleSave = async () => {
    try {
      let module = 'staff'
      if (user.ecareRole === 'patient') module = 'patients'
      if (user.ecareRole === 'doctor') module = 'doctors'

      const saveData = {
        ...formData,
        gender: normalizeGender(formData.gender) || formData.gender || '',
        specialization: specialty.join(', '),
        services: selectedServices.join(', '),
        degrees: degrees.join(', '),
        documents: JSON.stringify(profileDocuments),
        // Both payment methods saved independently; activeBankTab = preferred method
        accountType: activeBankTab
      }

      if (dbRecordId) {
        // We have a confirmed DB row — update it
        await api.put(`/${module}/${dbRecordId}`, saveData)
        toast.success('Profile updated successfully')
        setIsEditing(false)
        setUser({
          ...user,
          name: saveData.name || user.name,
          avatar: saveData.avatar || saveData.photo || user.avatar,
          gender: saveData.gender || user.gender || user.ecareGender
        })
      } else {
        // No DB record yet — create one linked to this WP user
        const res = await api.post(`/${module}`, { ...saveData, user_id: user.id })
        if (res?.data?.id) setDbRecordId(res.data.id)
        toast.success('Profile created successfully')
        setIsEditing(false)
        await fetchProfile()
        setUser({
          ...user,
          name: saveData.name || user.name,
          avatar: saveData.avatar || saveData.photo || user.avatar,
          gender: saveData.gender || user.gender || user.ecareGender
        })
      }
    } catch (error) {
      console.error('Profile save failed:', error)
      toast.error('Update failed: ' + (error?.response?.data?.message || error?.message || 'Unknown error'))
    }
  }

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="ecare-loader" /></div>

  const role = user.ecareRole;
  const isDoctor = role === 'doctor'
  const isPatient = role === 'patient'
  const isAdmin = role === 'admin'
  const isStaff = ['receptionist', 'staff'].includes(role)

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="ecare-profile-page"
      style={{ width: '100%', padding: '1rem 0' }}
    >
      {/* Personal Information */}
      <Card style={{ margin: '0 1rem 1.5rem' }}>
        <div className="ecare-profile-identity-layout" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <SectionHeader title="Personal Information" />
            <div className="ecare-profile-grid ecare-profile-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <InputGroup label="Full Name" required value={formData.name} onChange={v => setFormData({...formData, name: v})} disabled={!isEditing} placeholder="Enter your name" />
              <InputGroup label="Email Address" required value={formData.email} onChange={v => setFormData({...formData, email: v})} disabled={true} placeholder="Enter your email" />
              <InputGroup label="Mobile Number" required value={formData.phone} onChange={v => setFormData({...formData, phone: v})} disabled={!isEditing} placeholder="Enter your number" />
              
              {/* NID only for non-patient roles */}
              {!isPatient && (
                <InputGroup label="National ID (NID)" required value={formData.nid} onChange={v => setFormData({...formData, nid: v})} disabled={!isEditing} placeholder="Enter your NID" />
              )}

              {/* Date of Birth — CustomDatePicker for all roles */}
              <div className="ecare-profile-field" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Date of Birth</label>
                <CustomDatePicker
                  value={formData.dob}
                  onChange={v => setFormData({...formData, dob: v})}
                  disabled={!isEditing}
                  placeholder="Select date of birth"
                />
              </div>

              {isPatient && (
                <>
                  {/* Blood Group — CustomSelect */}
                  <div className="ecare-profile-field" style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Blood Group</label>
                    <CustomSelect
                      value={formData.bloodGroup}
                      onChange={v => setFormData({...formData, bloodGroup: v})}
                      disabled={!isEditing}
                      placeholder="Select blood group"
                      options={[
                        { value: 'Unknown', label: 'Unknown' },
                        { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                        { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                        { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }
                      ]}
                    />
                  </div>
                </>
              )}

              {isDoctor && (
                <>
                  <InputGroup label="Professional Fee" value={formData.fee} onChange={v => setFormData({...formData, fee: v})} disabled={!isEditing} placeholder="Enter Fee" type="number" />
                  <InputGroup label="Biography" value={formData.bio} onChange={v => setFormData({...formData, bio: v})} disabled={!isEditing} placeholder="Short professional summary" />
                </>
              )}

              {(isAdmin || isStaff) && (
                <InputGroup label="Designation" value={formData.role || role} onChange={v => setFormData({...formData, role: v})} disabled={true} />
              )}

              {/* Gender toggle — patients only */}
              {isPatient && (
                <div className="ecare-profile-field ecare-profile-span-full" style={{ marginBottom: '1.25rem', gridColumn: 'span 3' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>Gender
                  </label>
                  <div style={{
                    display: 'flex',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '9999px',
                    padding: '4px',
                    width: '100%'
                  }}>
                    {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        disabled={!isEditing}
                        onClick={() => isEditing && setFormData({...formData, gender: g})}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          border: 'none',
                          borderRadius: '9999px',
                          background: normalizeGender(formData.gender) === g ? 'white' : 'transparent',
                          color: normalizeGender(formData.gender) === g ? '#1e293b' : '#64748b',
                          fontWeight: normalizeGender(formData.gender) === g ? 700 : 600,
                          fontSize: '0.8rem',
                          cursor: isEditing ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          boxShadow: normalizeGender(formData.gender) === g ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                          fontFamily: 'inherit'
                        }}
                      >{g}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Address — full fields for patients, single line for others */}
              {isPatient ? (
                <>
                  <InputGroup label="Street Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} disabled={!isEditing} placeholder="Street address" gridColumn="span 3" />
                  <InputGroup label="City" value={formData.city} onChange={v => setFormData({...formData, city: v})} disabled={!isEditing} placeholder="City" />
                  <InputGroup label="Country" value={formData.country} onChange={v => setFormData({...formData, country: v})} disabled={!isEditing} placeholder="Country" />
                  <InputGroup label="Postal Code" value={formData.zip} onChange={v => setFormData({...formData, zip: v})} disabled={!isEditing} placeholder="Postal / ZIP" />
                </>
              ) : (
                <InputGroup label="Resident Address" value={formData.address} onChange={v => setFormData({...formData, address: v})} disabled={!isEditing} placeholder="Enter your address" gridColumn="span 2" />
              )}

              {isDoctor && (
                <InputGroup label="Detailed Professional Biography" value={formData.detailedBio} onChange={v => setFormData({...formData, detailedBio: v})} disabled={!isEditing} placeholder="Enter full professional biography" gridColumn="span 3" />
              )}
            </div>
          </div>
          <div className="ecare-profile-photo-panel" style={{ width: '200px', textAlign: 'center', marginLeft: '3rem', borderLeft: '1px solid #f1f5f9', paddingLeft: '2rem' }}>
            <div className="ecare-profile-avatar" style={{ 
              width: '120px', height: '120px', 
              borderRadius: '50%', background: '#f8fafc', 
              border: '2px solid #f1f5f9', margin: '0 auto 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', position: 'relative', overflow: 'hidden'
            }}>
              {formData.avatar || formData.photo ? (
                <img src={formData.avatar || formData.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={48} weight="duotone" />
              )}
            </div>
            <div className="ecare-profile-photo-title" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Profile Photo</div>
            <div className="ecare-profile-photo-help" style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '1rem' }}>JPG or PNG, max 2MB</div>
            <input
              type="file"
              id="profile-avatar-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                const base64 = await readAsBase64(file)
                setFormData(prev => ({ ...prev, avatar: base64 }))
              }}
            />
            <label
              htmlFor="profile-avatar-upload"
              className="ecare-btn-secondary"
              style={{ padding: '6px 16px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', borderRadius: '8px', cursor: 'pointer' }}
            >
              <CloudArrowUp size={16} /> Upload New
            </label>
          </div>
        </div>
      </Card>

      {/* Role-Specific Information Cards */}
      <AnimatePresence>
        {isDoctor && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ margin: '0 1rem 1.5rem' }}>
              <SectionHeader title="Clinical & Professional Credentials" />
              <div className="ecare-profile-grid ecare-profile-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <InputGroup label="BMDC Registration Code" required value={formData.bmdcCode} onChange={v => setFormData({...formData, bmdcCode: v})} disabled={!isEditing} placeholder="Enter BMDC code" />
                <InputGroup label="Registration Expiry" required value={formData.expiryDate} onChange={v => setFormData({...formData, expiryDate: v})} disabled={!isEditing} type="date" />
                <div className="ecare-profile-field" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#ef4444', marginRight: '2px' }}>*</span>Degrees &amp; Qualifications
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="ecare-input"
                      placeholder={isEditing ? 'Type degree and press Enter' : ''}
                      value={degreeInput}
                      onChange={e => setDegreeInput(e.target.value)}
                      disabled={!isEditing}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && degreeInput.trim()) {
                          e.preventDefault()
                          if (!degrees.includes(degreeInput.trim())) {
                            setDegrees([...degrees, degreeInput.trim()])
                          }
                          setDegreeInput('')
                        }
                      }}
                      style={{ background: !isEditing ? '#f9fafb' : 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', width: '100%', color: '#111827' }}
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
                            {isEditing && (
                              <span onClick={() => setDegrees(degrees.filter(d => d !== deg))} style={{ cursor: 'pointer', fontSize: '14px' }}>&times;</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ecare-profile-field" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#ef4444', marginRight: '2px' }}>*</span>Primary Specialty
                  </label>
                  <CustomSelect
                    value={specialty}
                    onChange={setSpecialty}
                    placeholder="Select Specialties"
                    isMulti={true}
                    isSearchable={true}
                    options={activeSpecialities}
                    disabled={!isEditing}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="ecare-profile-field" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#ef4444', marginRight: '2px' }}>*</span>Assigned Services
                  </label>
                  <CustomSelect
                    value={selectedServices}
                    onChange={setSelectedServices}
                    placeholder={specialty.length > 0 ? 'Select Services' : 'Select Specialty first'}
                    isMulti={true}
                    isSearchable={true}
                    options={availableServices}
                    disabled={!isEditing || specialty.length === 0}
                    style={{ width: '100%' }}
                  />
                </div>
                <InputGroup label="Years of Experience" required value={formData.experience} onChange={v => setFormData({...formData, experience: v})} disabled={!isEditing} placeholder="Enter experience" type="number" />
                <InputGroup label="Number of Patients" required value={formData.patientsCount} onChange={v => setFormData({...formData, patientsCount: v})} disabled={!isEditing} placeholder="Enter number of patients" type="number" />

                <InputGroup label="Follow-up Validity (Days)" required value={formData.followUpDays} onChange={v => setFormData({...formData, followUpDays: v})} disabled={!isEditing} placeholder="Follow up days" type="number" />
                <InputGroup label="Follow-up Consultation Cost" required value={formData.followUpCost} onChange={v => setFormData({...formData, followUpCost: v})} disabled={!isEditing} placeholder="Follow up cost" type="number" />
                
                <Toggle label="Availability Status" required active={formData.consultationStatus !== 'Inactive'} onChange={v => setFormData({...formData, consultationStatus: v ? 'Active' : 'Inactive'})} />
                <Toggle label="Telemedicine / Instant Call" required active={formData.instantCallStatus !== 'Inactive'} onChange={v => setFormData({...formData, instantCallStatus: v ? 'Active' : 'Inactive'})} />
              </div>
            </Card>
          </motion.div>
        )}

        {(isAdmin || isStaff) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{ margin: '0 1rem 1.5rem' }}>
              <SectionHeader title="Organization & Assignment" />
              <div className="ecare-profile-grid ecare-profile-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <InputGroup label="Department" value={formData.department} onChange={v => setFormData({...formData, department: v})} disabled={true} />
                <InputGroup label="Joining Date" value={formData.joinDate} onChange={v => setFormData({...formData, joinDate: v})} disabled={true} type="date" />
                <InputGroup label="Experience (Years)" value={formData.experience} onChange={v => setFormData({...formData, experience: v})} disabled={!isEditing} placeholder="Total experience" type="number" />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Financial & Document Management - For Staff/Doctors */}
      {!isPatient && (
        <div className="ecare-profile-finance-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* Bank Information */}
          <Card style={{ marginBottom: 0 }}>
            <SectionHeader title="Financial & Payout Information" />
            <div className="ecare-profile-payout-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Preferred payout method:</div>
              <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                {['Bank Account', 'Mobile Banking'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveBankTab(tab)
                      setFormData({...formData, accountType: tab})
                    }}
                    disabled={!isEditing}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '9px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: activeBankTab === tab ? 800 : 700,
                      background: activeBankTab === tab ? 'white' : 'transparent',
                      color: activeBankTab === tab ? 'var(--ecare-primary)' : '#6b7280',
                      boxShadow: activeBankTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                      cursor: isEditing ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="ecare-profile-payout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Bank Account Panel */}
              <div className="ecare-profile-payout-option" style={{ padding: '1.25rem', borderRadius: '14px', border: `2px solid ${activeBankTab === 'Bank Account' ? 'var(--ecare-primary)' : '#e2e8f0'}`, background: activeBankTab === 'Bank Account' ? 'var(--ecare-primary-bg)' : '#f8fafc' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: activeBankTab === 'Bank Account' ? 'var(--ecare-primary)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>🏦 Bank Account</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <InputGroup label="Account Holder Name" value={formData.accountName} onChange={v => setFormData({...formData, accountName: v})} disabled={!isEditing} placeholder="Full name on account" />
                  <InputGroup label="Financial Institution" value={formData.bankName} onChange={v => setFormData({...formData, bankName: v})} disabled={!isEditing} placeholder="Bank Name" />
                  <InputGroup label="Account Number" value={formData.accountNumber} onChange={v => setFormData({...formData, accountNumber: v})} disabled={!isEditing} placeholder="Enter account number" />
                  <InputGroup label="Branch / Routing No" value={formData.branchName} onChange={v => setFormData({...formData, branchName: v})} disabled={!isEditing} placeholder="Branch name or Routing No" />
                </div>
              </div>

              {/* Mobile Banking Panel */}
              <div className="ecare-profile-payout-option" style={{ padding: '1.25rem', borderRadius: '14px', border: `2px solid ${activeBankTab === 'Mobile Banking' ? 'var(--ecare-primary)' : '#e2e8f0'}`, background: activeBankTab === 'Mobile Banking' ? 'var(--ecare-primary-bg)' : '#f8fafc' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: activeBankTab === 'Mobile Banking' ? 'var(--ecare-primary)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>📱 Mobile Banking</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <InputGroup label="Provider Name" value={formData.mobileProvider} onChange={v => setFormData({...formData, mobileProvider: v})} disabled={!isEditing} placeholder="bKash, Nagad, Rocket, etc." />
                  <InputGroup label="Mobile Account Number" value={formData.mobileNumber} onChange={v => setFormData({...formData, mobileNumber: v})} disabled={!isEditing} placeholder="e.g. 017XXXXXXXX" />
                  <InputGroup label="Account Type" value={formData.mobileAccountType} onChange={v => setFormData({...formData, mobileAccountType: v})} disabled={!isEditing} placeholder="Personal or Merchant" />
                  <InputGroup label="Reference Name" value={formData.mobileReference} onChange={v => setFormData({...formData, mobileReference: v})} disabled={!isEditing} placeholder="Optional" />
                </div>
              </div>
            </div>
          </Card>

          {/* Documents Section */}
          <Card style={{ marginBottom: 0 }}>
            <SectionHeader title="Verified Credentials" />
            <input
              type="file"
              id="profile-docs-upload"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const newDocs = await readManyAsBase64(e.target.files)
                setProfileDocuments(prev => [...prev, ...newDocs])
                e.target.value = ''
              }}
            />
            <label
              htmlFor="profile-docs-upload"
              className="ecare-profile-upload-zone"
              style={{
                border: '2px dashed #e2e8f0',
                borderRadius: '16px',
                padding: '2.5rem',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'block'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ecare-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <CloudArrowUp size={44} weight="duotone" color="var(--ecare-primary)" style={{ marginBottom: '1rem' }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Credential Vault</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Click to upload NID, License or Certifications</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>PDF, JPG, PNG, DOC — max 5MB each</div>
            </label>

            <div className="ecare-profile-doc-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {profileDocuments.length > 0 ? (
                profileDocuments.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <FileArrowUp size={20} weight="duotone" color="var(--ecare-primary)" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileDocuments(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ background: '#fee2e2', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', padding: '1rem' }}>No documents uploaded yet.</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Health Metrics Logging - For Patients */}
      {isPatient && (
        <Card style={{ margin: '1.5rem 1rem' }}>
          <SectionHeader title="Log Personal Health Metrics" />
          <div className="ecare-profile-grid ecare-profile-vitals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', alignItems: 'end' }}>
            <InputGroup label="Weight (kg)" value={newVitals.weight} onChange={v => setNewVitals({...newVitals, weight: v})} placeholder="e.g. 75" type="number" />
            <InputGroup label="Wellness Index (0-100)" value={newVitals.wellness} onChange={v => setNewVitals({...newVitals, wellness: v})} placeholder="e.g. 85" type="number" />
            <InputGroup label="Blood Pressure" value={newVitals.bp} onChange={v => setNewVitals({...newVitals, bp: v})} placeholder="120/80" />
            <div style={{ marginBottom: '1.25rem' }}>
              <button 
                type="button"
                onClick={handleLogVitals}
                className="ecare-btn-primary"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px' }}
              >
                Log Metrics
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '-0.5rem' }}>
            These metrics will update your "Health Wellness Journey" chart in real-time.
          </p>
        </Card>
      )}

      {/* Patient Documents / Medical Vault — Live DB */}
      {isPatient && (
        <Card style={{ margin: '0 1rem' }}>
          <SectionHeader title="Medical Records & Identity Vault" />
          <MedicalVault
            patientUserId={user.id}
            canUpload={true}
            canDelete={true}
          />
        </Card>
      )}

      {/* Floating Action Buttons for Profile Editing */}
      {!isEditing ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsEditing(true)}
          className="ecare-profile-fab"
          title="Edit Details"
        >
          <PencilSimple size={22} weight="bold" />
        </motion.button>
      ) : (
        <div className="ecare-profile-fab-container">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(false)}
            className="ecare-profile-fab-secondary"
            title="Discard Changes"
          >
            <X size={18} weight="bold" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="ecare-profile-fab-primary"
            title="Save Changes"
          >
            <Check size={18} weight="bold" />
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

export default Profile
