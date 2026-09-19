import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Stethoscope, 
  HandHeart, 
  Truck, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  MapPin, 
  FileText, 
  Lock, 
  UploadCloud, 
  CheckCircle,
  X,
  CreditCard,
  Briefcase,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'
import { UploadSimple, Camera, FilePdf, Package, Check, UserGear } from 'phosphor-react'
import CustomSelect from './components/CustomSelect'
import CustomDatePicker from './components/CustomDatePicker'

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

// ─── Design Tokens & Theme Handler ──────────────────────────────────────────
const config = window.ecareAuthConfig || {}
const primaryHex = config.primaryColor || '#1b3b2b'

// Convert HEX brand color to HSL to dynamically generate hover, light, bg, and border variants
const hexToHsl = (hex) => {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255
  let g = parseInt(hex.substring(2, 4), 16) / 255
  let b = parseInt(hex.substring(4, 6), 16) / 255

  let max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    let d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { 
    h: Math.round(h * 360), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  }
}

const hsl = hexToHsl(primaryHex)
const themeStyles = `
  #ecare-shadow-inner {
    --ecare-primary: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%);
    --ecare-primary-hover: hsl(${hsl.h}, ${hsl.s}%, ${Math.max(0, hsl.l - 10)}%);
    --ecare-primary-light: hsl(${hsl.h}, ${hsl.s}%, ${Math.min(100, hsl.l + 15)}%);
    --ecare-primary-bg: hsl(${hsl.h}, ${hsl.s}%, 97%);
    --ecare-primary-border: hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.2);
    --ecare-primary-shadow: hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.08);
  }
`

export default function RegistrationApp() {
  const [selectedRole, setSelectedRole] = useState(null) // null, 'doctor', 'care-provider', 'ambulance'
  const [activeTab, setActiveTab] = useState('doctor') // 'doctor', 'care-provider', 'ambulance'
  
  // Data lists fetched from API
  const [specialties, setSpecialties] = useState([])
  const [services, setServices] = useState([])
  const [pricingPackages, setPricingPackages] = useState([])
  const [providerTypes, setProviderTypes] = useState([])
  const [loadingMetadata, setLoadingMetadata] = useState(true)

  // Registration statuses
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState(null) // holds result on success

  // ─── Load Specialties, Services, & Settings ──────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const headers = {
          'X-WP-Nonce': config.nonce,
          'Content-Type': 'application/json'
        }

        // 1. Fetch Specialties
        const specRes = await fetch(`${config.apiUrl}/specialities`, { headers })
        let specData = []
        if (specRes.ok) {
          specData = await specRes.json()
        }
        
        // 2. Fetch Services
        const servRes = await fetch(`${config.apiUrl}/services`, { headers })
        let servData = []
        if (servRes.ok) {
          servData = await servRes.json()
        }

        // 3. Fetch Settings (for care provider types & pricing)
        const setRes = await fetch(`${config.apiUrl}/settings`, { headers })
        let settingsData = {}
        if (setRes.ok) {
          settingsData = await setRes.json()
        }

        setSpecialties(specData.length ? specData : [
          { id: 'Cardiology', name: 'Cardiology' },
          { id: 'Dermatology', name: 'Dermatology' },
          { id: 'Pediatrics', name: 'Pediatrics' },
          { id: 'Gynecology', name: 'Gynecology' },
          { id: 'Orthopedics', name: 'Orthopedics' },
          { id: 'Neurology', name: 'Neurology' },
          { id: 'General Medicine', name: 'General Medicine' }
        ])

        setServices(servData.length ? servData : [
          { id: 'consultation', name: 'General Consultation', specialty: 'General Medicine' },
          { id: 'dermatology-consult', name: 'Dermatological Treatment', specialty: 'Dermatology' },
          { id: 'cardio-check', name: 'ECG & Heart Checkup', specialty: 'Cardiology' },
          { id: 'child-wellness', name: 'Pediatric Care', specialty: 'Pediatrics' }
        ])

        const rawTypes = settingsData.providerTypes || ['Home Nurse', 'Physiotherapist', 'Caregiver', 'Nanny']
        const normalizedTypes = rawTypes.map((t, idx) => {
          if (typeof t === 'string') {
            return { id: idx, name: t }
          }
          return t
        })
        setProviderTypes(normalizedTypes)
        setPricingPackages(Array.isArray(settingsData.servicePricing) ? settingsData.servicePricing : [
          { id: 'hourly', name: 'Hourly Care', price: 500 },
          { id: 'halfday', name: '12 Hours Care', price: 3000 },
          { id: 'fullday', name: '24 Hours Care', price: 5000 },
          { id: 'weekly', name: 'Weekly Care Package', price: 25000 },
          { id: 'monthly', name: 'Monthly Care Package', price: 85000 }
        ])

      } catch (err) {
        console.error('Failed loading template meta', err)
      } finally {
        setLoadingMetadata(false)
      }
    }

    loadData()
  }, [])

  // ─── Forms State ──────────────────────────────────────────────────────────
  
  // 1. Doctor Form State
  const [doctorForm, setDoctorForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    dob: '', gender: 'Male', nid: '', address: '', bio: '', detailedBio: '',
    bmdcCode: '', experience: '', patientsCount: '', fee: '', followUpDays: '7', followUpCost: '0',
    bankName: '', branchName: '', accountName: '', accountNumber: '',
    mobileProvider: '', mobileNumber: '',
    consultationStatus: 'Active', instantCallStatus: 'Inactive',
    middlename: ''
  })
  const [docAccountType, setDocAccountType] = useState('Bank Account')
  const [docSpecialty, setDocSpecialty] = useState([])
  const [docSelectedServices, setDocSelectedServices] = useState([])
  const [docExpiryDate, setDocExpiryDate] = useState('')
  const [docPreviewImage, setDocPreviewImage] = useState(null)
  const [docDegreeInput, setDocDegreeInput] = useState('')
  const [docDegrees, setDocDegrees] = useState([])
  const [docDocuments, setDocDocuments] = useState([])
  const [ambDocuments, setAmbDocuments] = useState([])
  const handleAmbDocumentUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) { alert('File exceeds 2MB limit.'); return }
      const reader = new FileReader()
      reader.onloadend = () => setAmbDocuments(prev => [...prev, { name: file.name, data: reader.result, type: file.type }])
      reader.readAsDataURL(file)
    })
  }

  const handleDocImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert('File exceeds 2MB limit.'); return }
      const reader = new FileReader()
      reader.onloadend = () => setDocPreviewImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleDocDegreeKeyDown = (e) => {
    if (e.key === 'Enter' && docDegreeInput.trim()) {
      e.preventDefault()
      if (!docDegrees.includes(docDegreeInput.trim())) setDocDegrees([...docDegrees, docDegreeInput.trim()])
      setDocDegreeInput('')
    }
  }

  const handleDocDocumentUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) { alert('File exceeds 2MB limit.'); return }
      const reader = new FileReader()
      reader.onloadend = () => setDocDocuments(prev => [...prev, { name: file.name, data: reader.result, type: file.type }])
      reader.readAsDataURL(file)
    })
  }

  // Dynamic services based on selected specialities
  const availableServices = docSpecialty.flatMap(specName => {
    const specServices = services.filter(s => s.speciality === specName || s.specialty === specName)
      .map(s => ({ value: s.name, label: s.name }))
    if (specServices.length > 0) return [{ isHeader: true, label: specName, value: `header-${specName}` }, ...specServices]
    return []
  })

  // Auto-disable instant call if no telemed service
  const hasTelemed = docSelectedServices.some(sName => {
    const service = services.find(s => s.name === sName);
    return service && (service.telemedicine === true || service.telemedicine === 1 || service.telemedicine === '1');
  });
  useEffect(() => {
    if (!hasTelemed && doctorForm.instantCallStatus === 'Active') {
      setDoctorForm(prev => ({ ...prev, instantCallStatus: 'Inactive' }))
    }
  }, [hasTelemed]);


  // 2. Care Provider Form State
  const [providerForm, setProviderForm] = useState({
    name: '', email: '', phone: '', type: '', dob: '', gender: 'MALE',
    nid: '', experience: '', nationality: '', organization: '', skills: '',
    address: '', bio: '', bankName: '', branchName: '', accountName: '',
    accountNumber: '', mobileProvider: '', mobileNumber: '',
    status: 'Active', password: '', confirmPassword: '',
    middlename: ''
  })
  const [provPackages, setProvPackages] = useState([])
  const [provAccountType, setProvAccountType] = useState('Bank Account')
  const [provPreviewImage, setProvPreviewImage] = useState(null)
  const [provDocuments, setProvDocuments] = useState([])

  const handleProvImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert('File exceeds 2MB limit.'); return }
      const reader = new FileReader()
      reader.onloadend = () => setProvPreviewImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleProvDocumentUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) { alert('File exceeds 2MB limit.'); return }
      const reader = new FileReader()
      reader.onloadend = () => setProvDocuments(prev => [...prev, { name: file.name, data: reader.result, type: file.type }])
      reader.readAsDataURL(file)
    })
  }

  // Filter packages based on selected provider type
  const selectedTypeObj = providerTypes.find(t => t.name === providerForm.type)
  const filteredPackages = selectedTypeObj 
    ? pricingPackages.filter(p => String(p.typeId) === String(selectedTypeObj.id) || String(p.providerTypeId) === String(selectedTypeObj.id))
    : []

  // 3. Ambulance Form State
  const [ambulanceForm, setAmbulanceForm] = useState({
    driverName: '', driverEmail: '', driverPhone: '', driverLicense: '',
    driverNid: '', driverExperience: '', driverBloodGroup: 'O+',
    driverAddress: '', vehicleType: 'AC', vehicleModel: '', plate: '',
    engineNumber: '', chassisNumber: '', insuranceExpiry: '', fitnessExpiry: '',
    password: '', confirmPassword: '',
    middlename: ''
  })
  const [ambPreviewImage, setAmbPreviewImage] = useState(null)

  const handleAmbImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert('File exceeds 2MB limit.'); return }
      const reader = new FileReader()
      reader.onloadend = () => setAmbPreviewImage(reader.result)
      reader.readAsDataURL(file)
    }
  }

  // ─── File Upload Helpers (Base64) ──────────────────────────────────────────
  const handleFileUpload = (e, formType, fieldKey, isMultiple = false) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    files.forEach(file => {
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 5MB size limit.`)
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64Data = reader.result
        
        if (isMultiple) {
          const newDoc = { name: file.name, type: file.type, data: base64Data }
          if (formType === 'doctor') {
            setDoctorForm(prev => ({ ...prev, [fieldKey]: [...prev[fieldKey], newDoc] }))
          } else if (formType === 'provider') {
            setProviderForm(prev => ({ ...prev, [fieldKey]: [...prev[fieldKey], newDoc] }))
          }
        } else {
          if (formType === 'doctor') {
            setDoctorForm(prev => ({ ...prev, [fieldKey]: base64Data }))
          } else if (formType === 'provider') {
            setProviderForm(prev => ({ ...prev, [fieldKey]: base64Data }))
          } else if (formType === 'ambulance') {
            setAmbulanceForm(prev => ({ ...prev, [fieldKey]: base64Data }))
          }
        }
      }
      reader.onerror = error => console.error('Error parsing file:', error)
    })
  }

  const removeDocument = (formType, fieldKey, index) => {
    if (formType === 'doctor') {
      setDoctorForm(prev => ({
        ...prev,
        [fieldKey]: prev[fieldKey].filter((_, i) => i !== index)
      }))
    } else if (formType === 'provider') {
      setProviderForm(prev => ({
        ...prev,
        [fieldKey]: prev[fieldKey].filter((_, i) => i !== index)
      }))
    }
  }

  // ─── Form Submissions ──────────────────────────────────────────────────────
  const handleRegister = async (e, type) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)

    try {
      let payload = {}
      let endpoint = ''

      if (type === 'doctor') {
        endpoint = 'doctors'
        if (doctorForm.password !== doctorForm.confirmPassword) {
          throw new Error("Passwords do not match!")
        }
        
        // Both bank and mobile banking are saved independently.
        // accountType records the preferred payout method.
        payload = {
          ...doctorForm,
          accountType: docAccountType,
          specialty: JSON.stringify(docSpecialty),
          services: docSelectedServices.join(','),
          gender: doctorForm.gender,
          bankName: doctorForm.bankName,
          branchName: doctorForm.branchName,
          accountName: doctorForm.accountName,
          accountNumber: doctorForm.accountNumber,
          mobileProvider: doctorForm.mobileProvider,
          mobileNumber: doctorForm.mobileNumber,
          expiryDate: docExpiryDate,
          avatar: docPreviewImage || '',
          degrees: JSON.stringify(docDegrees),
          documents: JSON.stringify(docDocuments),
          status: 'Pending'
        }
        delete payload.confirmPassword
      } 
      
      else if (type === 'provider') {
        endpoint = 'care-providers'
        if (providerForm.password !== providerForm.confirmPassword) {
          throw new Error("Passwords do not match!")
        }

        // Both bank and mobile banking saved independently.
        payload = {
          ...providerForm,
          gender: providerForm.gender === 'MALE' ? 'Male' : 'Female',
          exp: providerForm.experience ? `${providerForm.experience} Years` : '',
          photo: provPreviewImage || '',
          accountType: provAccountType,
          bankName: providerForm.bankName,
          branchName: providerForm.branchName,
          accountName: providerForm.accountName,
          accountNumber: providerForm.accountNumber,
          mobileProvider: providerForm.mobileProvider,
          mobileNumber: providerForm.mobileNumber,
          status: 'Pending',
          packages: JSON.stringify(provPackages),
          documents: JSON.stringify(provDocuments)
        }
        delete payload.confirmPassword
      } 
      
      else if (type === 'ambulance') {
        endpoint = 'ambulance'
        if (ambulanceForm.password !== ambulanceForm.confirmPassword) {
          throw new Error("Passwords do not match!")
        }
        payload = {
          ...ambulanceForm,
          driverPhoto: ambPreviewImage || '',
          documents: JSON.stringify(ambDocuments),
          status: 'Pending'
        }
        delete payload.confirmPassword
      }

      // Check for email duplicates first if email is provided
      const emailToCheck = payload.email || payload.driverEmail
      if (emailToCheck) {
        const checkRes = await fetch(`${config.apiUrl}check-duplicates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': config.nonce
          },
          body: JSON.stringify({ email: emailToCheck, module: endpoint })
        })
        if (checkRes.ok) {
          const dupResult = await checkRes.json()
          if (dupResult.email_exists) {
            throw new Error("This email is already registered in the system.")
          }
        }
      }

      // Submit registration
      const res = await fetch(`${config.apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': config.nonce
        },
        body: JSON.stringify(payload)
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message || "Failed to submit registration. Please try again.")
      }

      // Set success screen
      setSuccessData({
        type,
        name: payload.name || payload.driverName,
        email: emailToCheck
      })

    } catch (err) {
      setErrorMsg(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Rendering Helper Style Container ──────────────────────────────────────
  return (
    <div className="ecare-registration-content-wrapper">
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />

      <div style={{ width: '100%', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Dynamic Success View */}
        <AnimatePresence mode="wait">
          {successData ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="ecare-card"
              style={{ padding: '48px', textAlign: 'center', border: '2px solid var(--ecare-primary)' }}
            >
              <div style={{ display: 'inline-flex', color: 'var(--ecare-primary)', marginBottom: '24px' }}>
                <CheckCircle size={80} strokeWidth={1.5} />
              </div>
              
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                Registration Submitted!
              </h2>
              
              <p style={{ color: '#475569', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                Thank you, <strong>{successData.name}</strong>. Your request to join as a{' '}
                <strong>{successData.type === 'doctor' ? 'Clinical Doctor' : successData.type === 'care-provider' ? 'Care Provider' : 'Ambulance Partner'}</strong>{' '}
                has been received and is currently marked as <strong>Pending Verification</strong>.
              </p>

              <div style={{
                background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0',
                padding: '20px', maxWidth: '500px', margin: '0 auto 32px', textAlign: 'left'
              }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginBottom: '12px' }}>What happens next?</h4>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Our administrative panel reviews your uploaded credentials and license copies.</li>
                  <li>Once approved, your account will be activated under <strong>{successData.email}</strong>.</li>
                  <li>You will receive an activation email with configuration credentials.</li>
                </ol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <a href={config.loginUrl} className="ecare-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  Go to Login Portal
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form-container"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
              {selectedRole === null ? (
                /* ── Cards Selector Grid ── */
                <motion.div
                  key="cards"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                  gap: '16px', 
                  margin: 0,
                  alignItems: 'stretch'
                }}>
                  {/* Card 1: Specialist Doctor */}
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: '0 8px 20px rgba(0,0,0,0.06)', borderColor: '#059669' }}
                    onClick={() => { setSelectedRole('doctor'); setActiveTab('doctor'); }}
                    style={{
                      background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                      padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      justifyContent: 'space-between', gap: '12px', transition: 'border-color 0.2s', height: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        background: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5'
                      }}>
                        <Stethoscope size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>
                          Verified Physicians
                        </span>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          Specialist Doctor
                        </h3>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                      Licensed medical professionals for clinical diagnosis and treatment.
                    </p>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Enroll Now</span><span>→</span>
                    </div>
                  </motion.div>

                  {/* Card 2: Nursing & Home Care */}
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: '0 8px 20px rgba(0,0,0,0.06)', borderColor: '#2563eb' }}
                    onClick={() => { setSelectedRole('care-provider'); setActiveTab('care-provider'); }}
                    style={{
                      background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                      padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      justifyContent: 'space-between', gap: '12px', transition: 'border-color 0.2s', height: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe'
                      }}>
                        <HandHeart size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>
                          Care Agencies
                        </span>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          Nursing & Home Care
                        </h3>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                      Certified nurses and caregivers for in-home medical support.
                    </p>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Enroll Now</span><span>→</span>
                    </div>
                  </motion.div>

                  {/* Card 3: Ambulance Fleet */}
                  <motion.div 
                    whileHover={{ y: -4, boxShadow: '0 8px 20px rgba(0,0,0,0.06)', borderColor: '#ef4444' }}
                    onClick={() => { setSelectedRole('ambulance'); setActiveTab('ambulance'); }}
                    style={{
                      background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                      padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      justifyContent: 'space-between', gap: '12px', transition: 'border-color 0.2s', height: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2'
                      }}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>
                          Transport Services
                        </span>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                          Ambulance Fleet
                        </h3>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                      Emergency medical response and patient transport services.
                    </p>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Enroll Now</span><span>→</span>
                    </div>
                  </motion.div>
                </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                  {/* Back button container */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <button 
                      onClick={() => { setSelectedRole(null); setErrorMsg(''); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '30px',
                        padding: '8px 18px', color: '#475569', fontWeight: 600, fontSize: '0.85rem',
                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--ecare-primary)'
                        e.currentTarget.style.borderColor = 'var(--ecare-primary-border)'
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.04)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#475569'
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Options</span>
                    </button>
                  </div>

              {/* Error Callout */}
              {errorMsg && (
                <div style={{
                  display: 'flex', gap: '12px', background: '#fef2f2', border: '1px solid #fee2e2',
                  borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#991b1b'
                }}>
                  <AlertTriangle style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{errorMsg}</span>
                </div>
              )}

              {/* Loader overlay during submit */}
              {submitting && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  zIndex: 9999, backdropFilter: 'blur(4px)'
                }}>
                  <div className="ecare-loader" style={{ marginBottom: '16px' }} />
                  <span style={{ fontWeight: 600, color: '#334155' }}>Submitting Registration...</span>
                </div>
              )}

              {/* Loading metadata spinner */}
              {loadingMetadata ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div className="ecare-loader" style={{ margin: '0 auto 16px' }} />
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading registration configuration...</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: DOCTOR REGISTRATION */}
                  {activeTab === 'doctor' && (
                    <form onSubmit={(e) => handleRegister(e, 'doctor')} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input 
                        type="text" 
                        name="middlename" 
                        value={doctorForm.middlename || ''} 
                        onChange={e => setDoctorForm({...doctorForm, middlename: e.target.value})} 
                        style={{ display: 'none' }} 
                        tabIndex="-1" 
                        autoComplete="off" 
                      />
                      
                      {/* Personal Information */}
                      <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Personal Information</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '42px', height: '42px', borderRadius: '50%', background: '#f1f5f9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                              border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0'
                            }}>
                              {docPreviewImage ? (
                                <img src={docPreviewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Camera size={20} color="#94a3b8" />
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profile Photo</span>
                              <input type="file" id="doctorPic" style={{ display: 'none' }} accept="image/*" onChange={handleDocImageChange} />
                              <label htmlFor="doctorPic" className="ecare-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.75rem', fontSize: '0.7rem', borderRadius: '9999px', cursor: 'pointer' }}>
                                <UploadSimple size={12} weight="bold" /> Upload
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ecare-form-grid">
                          <InputGroup label="Name" required>
                            <input type="text" className="ecare-input" placeholder="Enter your name" value={doctorForm.name} onChange={e => setDoctorForm({...doctorForm, name: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Email" required>
                            <input type="email" className="ecare-input" placeholder="Enter your email" value={doctorForm.email} onChange={e => setDoctorForm({...doctorForm, email: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Mobile" required>
                            <input type="tel" className="ecare-input" placeholder="Enter your number" value={doctorForm.phone} onChange={e => setDoctorForm({...doctorForm, phone: e.target.value})} required />
                          </InputGroup>
                        </div>

                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                          <InputGroup label="Password" required>
                            <input type="password" className="ecare-input" placeholder="••••••••" value={doctorForm.password} onChange={e => setDoctorForm({...doctorForm, password: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Confirm Password" required>
                            <input type="password" className="ecare-input" placeholder="••••••••" value={doctorForm.confirmPassword} onChange={e => setDoctorForm({...doctorForm, confirmPassword: e.target.value})} required />
                          </InputGroup>
                        </div>

                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                          <InputGroup label="NID" required>
                            <input type="text" className="ecare-input" placeholder="Enter your NID" value={doctorForm.nid} onChange={e => setDoctorForm({...doctorForm, nid: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Date of Birth" required>
                            <CustomDatePicker value={doctorForm.dob} onChange={v => setDoctorForm({...doctorForm, dob: v})} placeholder="Select date of birth" />
                          </InputGroup>
                          <InputGroup label="Gender" required>
                            <div style={{ display: 'flex', gap: '0.25rem', padding: '4px', background: '#f1f5f9', borderRadius: '9999px', width: 'fit-content' }}>
                              {['Male', 'Female', 'Other'].map(g => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => setDoctorForm({...doctorForm, gender: g})}
                                  style={{
                                    padding: '0.4rem 1rem',
                                    borderRadius: '9999px',
                                    border: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: doctorForm.gender === g ? 700 : 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: doctorForm.gender === g ? 'white' : 'transparent',
                                    color: doctorForm.gender === g ? 'var(--ecare-primary)' : '#64748b',
                                    boxShadow: doctorForm.gender === g ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                  }}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                          </InputGroup>
                          <InputGroup label="Consultation Fee" required>
                            <input type="number" className="ecare-input" placeholder="Enter your Fee" value={doctorForm.fee} onChange={e => setDoctorForm({...doctorForm, fee: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Biography">
                            <input type="text" className="ecare-input" placeholder="Short biography summary" value={doctorForm.bio} onChange={e => setDoctorForm({...doctorForm, bio: e.target.value})} />
                          </InputGroup>
                        </div>

                        <div style={{ marginTop: '0.25rem' }}>
                          <InputGroup label="Residential Address">
                            <input type="text" className="ecare-input" placeholder="Enter full residential address" value={doctorForm.address} onChange={e => setDoctorForm({...doctorForm, address: e.target.value})} />
                          </InputGroup>
                        </div>

                        <div style={{ marginTop: '0.25rem' }}>
                          <InputGroup label="Detailed Biography">
                            <textarea className="ecare-input" placeholder="Enter full professional biography" value={doctorForm.detailedBio} onChange={e => setDoctorForm({...doctorForm, detailedBio: e.target.value})}></textarea>
                          </InputGroup>
                        </div>
                      </div>

                      {/* Professional Information */}
                      <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Professional Information</h3>
                        
                        <div className="ecare-form-grid">
                          <InputGroup label="BMDC Code" required>
                            <input type="text" className="ecare-input" placeholder="Enter BMDC code" value={doctorForm.bmdcCode} onChange={e => setDoctorForm({...doctorForm, bmdcCode: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="BMDC Expiry Date" required>
                            <CustomDatePicker value={docExpiryDate} onChange={setDocExpiryDate} placeholder="Select expiry date" />
                          </InputGroup>
                          <InputGroup label="Degrees (Press Enter to add)" required>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <input 
                                type="text" className="ecare-input" placeholder="Type degree and press Enter" 
                                value={docDegreeInput} onChange={(e) => setDocDegreeInput(e.target.value)} onKeyDown={handleDocDegreeKeyDown}
                              />
                              {docDegrees.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                                  {docDegrees.map((deg, i) => (
                                    <span key={i} style={{ background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      {deg}
                                      <span onClick={() => setDocDegrees(docDegrees.filter(d => d !== deg))} style={{ cursor: 'pointer', fontSize: '14px' }}>&times;</span>
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
                              value={docSpecialty} onChange={setDocSpecialty} placeholder="Select Specialties" isMulti={true} isSearchable={true} 
                              options={specialties.map(s => ({ value: s.name, label: s.name }))} style={{ width: '100%' }}
                            />
                          </InputGroup>
                          <InputGroup label="Clinical Services" required>
                            <CustomSelect 
                              value={docSelectedServices} onChange={setDocSelectedServices} placeholder={docSpecialty.length > 0 ? "Select Services" : "Select Specialty first"} 
                              isMulti={true} isSearchable={true} 
                              options={(() => {
                                if (!docSpecialty || docSpecialty.length === 0) return [];
                                const groupedOptions = [];
                                docSpecialty.forEach(spec => {
                                  const matchingServices = services.filter(s => {
                                    const specStr = s.speciality || s.specialty || s.specialities || s.department || '';
                                    const specArray = Array.isArray(specStr) ? specStr : specStr.split(',').map(str => str.trim());
                                    return specArray.some(item => item.toLowerCase() === spec.toLowerCase());
                                  });
                                  
                                  if (matchingServices.length > 0) {
                                    groupedOptions.push({
                                      label: spec.toUpperCase(),
                                      isHeader: true,
                                      value: `header-${spec}`
                                    });
                                    matchingServices.forEach(s => {
                                      groupedOptions.push({
                                        label: s.name,
                                        value: s.name
                                      });
                                    });
                                  }
                                });
                                return groupedOptions;
                              })()} 
                              style={{ width: '100%' }}
                              disabled={!docSpecialty || docSpecialty.length === 0}
                            />
                          </InputGroup>
                          <InputGroup label="Years of Experience" required>
                            <input type="number" className="ecare-input" placeholder="Enter experience" value={doctorForm.experience} onChange={e => setDoctorForm({...doctorForm, experience: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Number of Patients" required>
                            <input type="number" className="ecare-input" placeholder="Enter number of patients" value={doctorForm.patientsCount} onChange={e => setDoctorForm({...doctorForm, patientsCount: e.target.value})} required />
                          </InputGroup>
                        </div>

                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                          <InputGroup label="Follow up days" required>
                            <input type="number" className="ecare-input" placeholder="Follow up days" value={doctorForm.followUpDays} onChange={e => setDoctorForm({...doctorForm, followUpDays: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Follow up cost" required>
                            <input type="number" className="ecare-input" placeholder="Follow up cost" value={doctorForm.followUpCost} onChange={e => setDoctorForm({...doctorForm, followUpCost: e.target.value})} required />
                          </InputGroup>
                        </div>
                      </div>

                      {/* Bank Information & Documents */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Bank Information</h3>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <div className="ecare-radio-group">
                              <button type="button" className={`ecare-radio-btn ${docAccountType === 'Bank Account' ? 'active' : ''}`} onClick={() => setDocAccountType('Bank Account')}>Bank Account</button>
                              <button type="button" className={`ecare-radio-btn ${docAccountType === 'Mobile Banking' ? 'active' : ''}`} onClick={() => setDocAccountType('Mobile Banking')}>Mobile Banking</button>
                            </div>
                          </div>

                          {docAccountType === 'Bank Account' ? (
                            <>
                              <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <InputGroup label="Bank Name" required>
                                  <input type="text" className="ecare-input" placeholder="Enter bank name" value={doctorForm.bankName} onChange={(e) => setDoctorForm({...doctorForm, bankName: e.target.value})} required />
                                </InputGroup>
                                <InputGroup label="Branch Name" required>
                                  <input type="text" className="ecare-input" placeholder="Branch name" value={doctorForm.branchName} onChange={(e) => setDoctorForm({...doctorForm, branchName: e.target.value})} required />
                                </InputGroup>
                              </div>
                              <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '0.25rem' }}>
                                <InputGroup label="Account Name" required>
                                  <input type="text" className="ecare-input" placeholder="Account name" value={doctorForm.accountName} onChange={(e) => setDoctorForm({...doctorForm, accountName: e.target.value})} required />
                                </InputGroup>
                                <InputGroup label="Account Number" required>
                                  <input type="text" className="ecare-input" placeholder="Account number" value={doctorForm.accountNumber} onChange={(e) => setDoctorForm({...doctorForm, accountNumber: e.target.value})} required />
                                </InputGroup>
                              </div>
                            </>
                          ) : (
                            <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                              <InputGroup label="Mobile Banking Provider" required>
                                <CustomSelect 
                                  value={doctorForm.mobileProvider} onChange={val => setDoctorForm({...doctorForm, mobileProvider: val})} placeholder="Select provider" expandDirection="up"
                                  options={[{ value: 'Bkash', label: 'Bkash' }, { value: 'Nagad', label: 'Nagad' }, { value: 'Rocket', label: 'Rocket' }]}
                                  style={{ width: '100%' }}
                                />
                              </InputGroup>
                              <InputGroup label="Mobile Number" required>
                                <input type="tel" className="ecare-input" placeholder="Enter mobile number" value={doctorForm.mobileNumber} onChange={(e) => setDoctorForm({...doctorForm, mobileNumber: e.target.value})} required />
                              </InputGroup>
                            </div>
                          )}
                        </div>

                        <div className="ecare-card" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Documents</h3>
                          
                          <input type="file" id="doc-upload" multiple style={{ display: 'none' }} onChange={handleDocDocumentUpload} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <label htmlFor="doc-upload" style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                              <FilePdf size={28} color="#94a3b8" weight="duotone" style={{ marginBottom: '0.25rem' }} />
                              <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.8125rem' }}>Upload Attachment</div>
                              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Max file size: 2 MB</p>
                            </label>
                            
                            {docDocuments.length > 0 && (
                              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '100px', overflowY: 'auto' }}>
                                {docDocuments.map((doc, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{doc.name}</span>
                                    <span onClick={() => setDocDocuments(docDocuments.filter((_, i) => i !== idx))} style={{ cursor: 'pointer', color: '#ef4444', fontSize: '14px', fontWeight: 'bold', marginLeft: '8px' }}>&times;</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="submit" className="ecare-button" style={{ padding: '0.6rem 2.5rem', fontSize: '0.9rem' }}>
                          Register Doctor
                        </button>
                      </div>
                    </form>
                  )}

                  {activeTab === 'care-provider' && (
                    <form onSubmit={(e) => handleRegister(e, 'provider')} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input 
                        type="text" 
                        name="middlename" 
                        value={providerForm.middlename || ''} 
                        onChange={e => setProviderForm({...providerForm, middlename: e.target.value})} 
                        style={{ display: 'none' }} 
                        tabIndex="-1" 
                        autoComplete="off" 
                      />
              
                      {/* Photo & Primary Info */}
                      <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Personal Information</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0' }}>
                              {provPreviewImage ? <img src={provPreviewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} color="#94a3b8" />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profile Photo</span>
                              <input type="file" id="providerPic" style={{ display: 'none' }} accept="image/*" onChange={handleProvImageChange} />
                              <label htmlFor="providerPic" className="ecare-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.75rem', fontSize: '0.7rem', borderRadius: '9999px', cursor: 'pointer' }}>
                                <UploadSimple size={12} weight="bold" /> Upload
                              </label>
                            </div>
                          </div>
                        </div>
              
                        <div className="ecare-form-grid">
                          <InputGroup label="Full Name" required>
                            <input type="text" className="ecare-input" placeholder="e.g. John Doe" value={providerForm.name} onChange={e => setProviderForm({...providerForm, name: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Mail Address" required>
                            <input type="email" className="ecare-input" placeholder="john@example.com" value={providerForm.email} onChange={e => setProviderForm({...providerForm, email: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Phone Number" required>
                            <input type="tel" className="ecare-input" placeholder="+880" value={providerForm.phone} onChange={e => setProviderForm({...providerForm, phone: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Full Address" className="ecare-span-full">
                            <input type="text" className="ecare-input" placeholder="e.g. 123 Health St, Dhaka" value={providerForm.address} onChange={e => setProviderForm({...providerForm, address: e.target.value})} />
                          </InputGroup>
                        </div>

                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                          <InputGroup label="Password" required>
                            <input type="password" className="ecare-input" placeholder="••••••••" value={providerForm.password} onChange={e => setProviderForm({...providerForm, password: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Confirm Password" required>
                            <input type="password" className="ecare-input" placeholder="••••••••" value={providerForm.confirmPassword} onChange={e => setProviderForm({...providerForm, confirmPassword: e.target.value})} required />
                          </InputGroup>
                        </div>
              
                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                          <InputGroup label="Care Provider Type" required>
                            <CustomSelect 
                              value={providerForm.type} 
                              onChange={val => {
                                setProviderForm({...providerForm, type: val})
                                setProvPackages([])
                              }} 
                              options={(providerTypes || []).map(t => ({ value: t.name, label: t.name }))} 
                              placeholder="Select type" 
                            />
                          </InputGroup>
                          <InputGroup label="Date of Birth" required>
                            <CustomDatePicker value={providerForm.dob} onChange={val => setProviderForm({...providerForm, dob: val})} placeholder="Select DOB" />
                          </InputGroup>
                          <InputGroup label="Gender Selection" required>
                            <PillSlider 
                              options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} 
                              value={providerForm.gender} 
                              onChange={val => setProviderForm({...providerForm, gender: val})} 
                            />
                          </InputGroup>
                          <InputGroup label="Account Status" required>
                            <CustomSelect 
                              value={providerForm.status} 
                              onChange={val => setProviderForm({...providerForm, status: val})} 
                              options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} 
                            />
                          </InputGroup>
                        </div>
                      </div>
              
                      {/* Identity & Professional Details */}
                      <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Professional Credentials</h3>
                        <div className="ecare-form-grid">
                          <InputGroup label="NID Number" required>
                            <input type="text" className="ecare-input" placeholder="NID or Passport" value={providerForm.nid} onChange={e => setProviderForm({...providerForm, nid: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Years of Experience" required>
                            <input type="number" className="ecare-input" placeholder="e.g. 5" value={providerForm.experience} onChange={e => setProviderForm({...providerForm, experience: e.target.value})} required />
                          </InputGroup>
                          <InputGroup label="Nationality">
                            <input type="text" className="ecare-input" placeholder="e.g. Bangladeshi" value={providerForm.nationality} onChange={e => setProviderForm({...providerForm, nationality: e.target.value})} />
                          </InputGroup>
                        </div>
                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                          <InputGroup label="Organization / Clinic">
                            <input type="text" className="ecare-input" placeholder="Current or Previous" value={providerForm.organization} onChange={e => setProviderForm({...providerForm, organization: e.target.value})} />
                          </InputGroup>
                          <InputGroup label="Skills & Competencies" className="ecare-span-2">
                            <input type="text" className="ecare-input" placeholder="e.g. ICU, Wound Care, BLS" value={providerForm.skills} onChange={e => setProviderForm({...providerForm, skills: e.target.value})} />
                          </InputGroup>
                        </div>
                      </div>
              
                      {/* Service Packages Selection */}
                      <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Available Service Packages</h3>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select the durations you can provide care for</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                          {filteredPackages.map((pkg) => {
                            const isSelected = provPackages.includes(pkg.id)
                            return (
                              <motion.div 
                                key={pkg.id}
                                whileHover={{ y: -2, boxShadow: '0 8px 15px -5px rgba(0,0,0,0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setProvPackages(prev => isSelected ? prev.filter(id => id !== pkg.id) : [...prev, pkg.id])
                                }}
                                style={{
                                  padding: '0.75rem', borderRadius: '12px',
                                  border: `2px solid ${isSelected ? 'var(--ecare-primary)' : '#f1f5f9'}`,
                                  background: isSelected ? 'var(--ecare-primary-bg)' : 'white',
                                  cursor: 'pointer', transition: 'all 0.2s',
                                  display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ 
                                    width: '32px', height: '32px', borderRadius: '8px', 
                                    background: isSelected ? 'white' : 'var(--ecare-primary-bg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)'
                                  }}>
                                    <Package size={16} weight="duotone" />
                                  </div>
                                  <div style={{ 
                                    padding: '0.25rem 0.5rem', borderRadius: '9999px', 
                                    background: isSelected ? 'var(--ecare-primary)' : '#f1f5f9',
                                    color: isSelected ? 'white' : '#64748b',
                                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em'
                                  }}>
                                    {pkg.duration}
                                  </div>
                                </div>
              
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ecare-text-main)', marginBottom: '0.15rem' }}>{pkg.name || 'Service Package'}</div>
                                </div>
              
                                <div style={{ 
                                  marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Total Price</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ecare-primary)', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>৳</span>
                                    {Number(pkg.price).toLocaleString()}
                                  </div>
                                </div>
              
                                {isSelected && (
                                  <div style={{ 
                                    position: 'absolute', top: '-10px', right: '-10px', 
                                    background: 'var(--ecare-primary)', color: 'white', 
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '2px solid white'
                                  }}>
                                    <Check size={14} weight="bold" />
                                  </div>
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                        {(!filteredPackages || filteredPackages.length === 0) && (
                          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', background: '#f8fafc', borderRadius: '12px' }}>
                            {providerForm.type ? "No service packages available for this provider type." : "Please select a Care Provider Type first to view available packages."}
                          </div>
                        )}
                      </div>
              
                      {/* Bank Information & Documents */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="ecare-card" style={{ padding: '1rem 1.5rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Bank Information</h3>
                          <div style={{ marginBottom: '1rem' }}>
                            <div className="ecare-radio-group">
                              <button type="button" className={`ecare-radio-btn ${provAccountType === 'Bank Account' ? 'active' : ''}`} onClick={() => setProvAccountType('Bank Account')}>Bank Account</button>
                              <button type="button" className={`ecare-radio-btn ${provAccountType === 'Mobile Banking' ? 'active' : ''}`} onClick={() => setProvAccountType('Mobile Banking')}>Mobile Banking</button>
                            </div>
                          </div>
              
                          {provAccountType === 'Bank Account' ? (
                            <>
                              <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <InputGroup label="Bank Name" required>
                                  <input type="text" className="ecare-input" placeholder="Bank name" value={providerForm.bankName} onChange={e => setProviderForm({...providerForm, bankName: e.target.value})} />
                                </InputGroup>
                                <InputGroup label="Branch" required>
                                  <input type="text" className="ecare-input" placeholder="Branch" value={providerForm.branchName} onChange={e => setProviderForm({...providerForm, branchName: e.target.value})} />
                                </InputGroup>
                              </div>
                              <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '0.25rem' }}>
                                <InputGroup label="Account Name" required>
                                  <input type="text" className="ecare-input" placeholder="Name" value={providerForm.accountName} onChange={e => setProviderForm({...providerForm, accountName: e.target.value})} />
                                </InputGroup>
                                <InputGroup label="Account No" required>
                                  <input type="text" className="ecare-input" placeholder="Number" value={providerForm.accountNumber} onChange={e => setProviderForm({...providerForm, accountNumber: e.target.value})} />
                                </InputGroup>
                              </div>
                            </>
                          ) : (
                            <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                              <InputGroup label="Provider" required>
                                <CustomSelect value={providerForm.mobileProvider} onChange={val => setProviderForm({...providerForm, mobileProvider: val})} options={[{ value: 'Bkash', label: 'Bkash' }, { value: 'Nagad', label: 'Nagad' }]} placeholder="Select" expandDirection="up" style={{ width: '100%' }} />
                              </InputGroup>
                              <InputGroup label="Mobile No" required>
                                <input type="tel" className="ecare-input" placeholder="Number" value={providerForm.mobileNumber} onChange={e => setProviderForm({...providerForm, mobileNumber: e.target.value})} />
                              </InputGroup>
                            </div>
                          )}
                        </div>
              
                        <div className="ecare-card" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Documents & Credentials</h3>
                          
                          <input type="file" id="docUpload-prov" multiple style={{ display: 'none' }} onChange={handleProvDocumentUpload} />
                          <label htmlFor="docUpload-prov" style={{ 
                            border: '1px dashed #cbd5e1', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', 
                            alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s',
                            minHeight: '120px', padding: '1rem'
                          }}>
                            <FilePdf size={28} color="var(--ecare-primary)" weight="duotone" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem' }}>
                              Click to Upload Credentials
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Upload certificates, NID copies (Max 2MB per file)</p>
                          </label>
              
                          {provDocuments.length > 0 && (
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {provDocuments.map((doc, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    <FilePdf size={16} color="#ef4444" weight="fill" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{doc.name}</span>
                                  </div>
                                  <button type="button" onClick={() => setProvDocuments(provDocuments.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <X size={14} weight="bold" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <InputGroup label="Professional Bio">
                            <textarea className="ecare-input" rows="2" style={{ resize: 'none', borderRadius: '12px', padding: '0.75rem' }} placeholder="Care philosophy..." value={providerForm.bio} onChange={e => setProviderForm({...providerForm, bio: e.target.value})} />
                          </InputGroup>
                        </div>
                      </div>
              
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="submit" className="ecare-button" style={{ padding: '0.6rem 2.5rem', fontSize: '0.9rem' }}>
                            Register Care Provider
                          </button>
                        </div>
                      </form>
                    )}

                  {/* TAB 3: AMBULANCE SERVICE REGISTRATION */}
                  {activeTab === 'ambulance' && (
                    <form onSubmit={(e) => handleRegister(e, 'ambulance')} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <input 
                        type="text" 
                        name="middlename" 
                        value={ambulanceForm.middlename || ''} 
                        onChange={e => setAmbulanceForm({...ambulanceForm, middlename: e.target.value})} 
                        style={{ display: 'none' }} 
                        tabIndex="-1" 
                        autoComplete="off" 
                      />
              
                      {/* Vehicle Info */}
                      <div className="ecare-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ecare-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Truck size={20} /> Vehicle Specifications
                        </h3>
                        <div className="ecare-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                          <InputGroup label="Ambulance Type" required>
                            <CustomSelect 
                              value={ambulanceForm.vehicleType} 
                              onChange={v => setAmbulanceForm({...ambulanceForm, vehicleType: v})}
                              options={[
                                { value: 'ICU', label: 'ICU (AC)' },
                                { value: 'Non-AC', label: 'Non-AC Standard' },
                                { value: 'Freezer', label: 'Freezer Van' }
                              ]}
                            />
                          </InputGroup>
                          <InputGroup label="Vehicle Plate Number" required>
                            <input 
                              type="text" className="ecare-input" placeholder="e.g. Dhaka-Metro-1234"
                              value={ambulanceForm.plate} onChange={e => setAmbulanceForm({...ambulanceForm, plate: e.target.value})} required
                            />
                          </InputGroup>
                          <InputGroup label="Vehicle Model">
                            <input 
                              type="text" className="ecare-input" placeholder="e.g. Toyota Hiace 2022"
                              value={ambulanceForm.vehicleModel} onChange={e => setAmbulanceForm({...ambulanceForm, vehicleModel: e.target.value})}
                            />
                          </InputGroup>
                          <InputGroup label="Engine Number">
                            <input 
                              type="text" className="ecare-input" placeholder="Engine serial"
                              value={ambulanceForm.engineNumber} onChange={e => setAmbulanceForm({...ambulanceForm, engineNumber: e.target.value})}
                            />
                          </InputGroup>
                          <InputGroup label="Chassis Number">
                            <input 
                              type="text" className="ecare-input" placeholder="Chassis serial"
                              value={ambulanceForm.chassisNumber} onChange={e => setAmbulanceForm({...ambulanceForm, chassisNumber: e.target.value})}
                            />
                          </InputGroup>
                        </div>
              
                        <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '1.25rem' }}>
                          <InputGroup label="Insurance Expiry Date">
                            <CustomDatePicker value={ambulanceForm.insuranceExpiry} onChange={v => setAmbulanceForm({...ambulanceForm, insuranceExpiry: v})} placeholder="Select date" />
                          </InputGroup>
                          <InputGroup label="Fitness Certificate Expiry">
                            <CustomDatePicker value={ambulanceForm.fitnessExpiry} onChange={v => setAmbulanceForm({...ambulanceForm, fitnessExpiry: v})} placeholder="Select date" />
                          </InputGroup>
                        </div>
                      </div>
              
                      {/* Driver Info */}
                      <div className="ecare-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserGear size={20} weight="fill" /> Driver Credentials
                          </h3>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                                width: '42px', height: '42px', borderRadius: '50%', background: '#f1f5f9', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0'
                              }}
                            >
                              {ambPreviewImage ? (
                                <img src={ambPreviewImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Camera size={20} color="#94a3b8" />
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profile Photo</span>
                              <input type="file" id="ambulanceDriverPic" style={{ display: 'none' }} accept="image/*" onChange={handleAmbImageChange} />
                              <label htmlFor="ambulanceDriverPic" className="ecare-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.75rem', fontSize: '0.7rem', borderRadius: '9999px', cursor: 'pointer' }}>
                                <UploadSimple size={12} weight="bold" /> Upload
                              </label>
                            </div>
                          </div>
                        </div>
              
                        <div className="ecare-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                          <InputGroup label="Full Name" required>
                            <input 
                              type="text" className="ecare-input" placeholder="Driver name"
                              value={ambulanceForm.driverName} onChange={e => setAmbulanceForm({...ambulanceForm, driverName: e.target.value})} required
                            />
                          </InputGroup>
                          <InputGroup label="Contact Phone" required>
                            <input 
                              type="tel" className="ecare-input" placeholder="+880..."
                              value={ambulanceForm.driverPhone} onChange={e => setAmbulanceForm({...ambulanceForm, driverPhone: e.target.value})} required
                            />
                          </InputGroup>
                          <InputGroup label="Email Address" required>
                            <input 
                              type="email" className="ecare-input" placeholder="driver@example.com"
                              value={ambulanceForm.driverEmail} onChange={e => setAmbulanceForm({...ambulanceForm, driverEmail: e.target.value})} required
                            />
                          </InputGroup>
                          <InputGroup label="Driving License No" required>
                            <input 
                              type="text" className="ecare-input" placeholder="License Number"
                              value={ambulanceForm.driverLicense} onChange={e => setAmbulanceForm({...ambulanceForm, driverLicense: e.target.value})} required
                            />
                          </InputGroup>
                          <InputGroup label="NID Number" required>
                            <input 
                              type="text" className="ecare-input" placeholder="NID Number"
                              value={ambulanceForm.driverNid} onChange={e => setAmbulanceForm({...ambulanceForm, driverNid: e.target.value})} required
                            />
                          </InputGroup>
                          <InputGroup label="Years of Experience">
                            <input 
                              type="number" className="ecare-input" placeholder="e.g. 5"
                              value={ambulanceForm.driverExperience} onChange={e => setAmbulanceForm({...ambulanceForm, driverExperience: e.target.value})}
                            />
                          </InputGroup>
                          <InputGroup label="Blood Group">
                            <CustomSelect 
                              value={ambulanceForm.driverBloodGroup} 
                              onChange={v => setAmbulanceForm({...ambulanceForm, driverBloodGroup: v})}
                              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => ({ value: g, label: g }))}
                              placeholder="Select group"
                            />
                          </InputGroup>
                          <InputGroup label="Present Address" className="ecare-span-2">
                            <input 
                              type="text" className="ecare-input" placeholder="Street address, city"
                              value={ambulanceForm.driverAddress} onChange={e => setAmbulanceForm({...ambulanceForm, driverAddress: e.target.value})}
                            />
                          </InputGroup>
                        </div>

                        <div className="ecare-form-grid" style={{ marginTop: '0.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                          <InputGroup label="Password" required>
                            <input 
                              type="password" className="ecare-input" placeholder="••••••••"
                              value={ambulanceForm.password} onChange={e => setAmbulanceForm({...ambulanceForm, password: e.target.value})} required
                            />
                          </InputGroup>
                          <InputGroup label="Confirm Password" required>
                            <input 
                              type="password" className="ecare-input" placeholder="••••••••"
                              value={ambulanceForm.confirmPassword} onChange={e => setAmbulanceForm({...ambulanceForm, confirmPassword: e.target.value})} required
                            />
                          </InputGroup>
                        </div>
                      </div>

                      {/* Documents Upload */}
                      <div className="ecare-card" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FilePdf size={18} weight="fill" /> Documents
                        </h3>
                        
                        <input type="file" id="amb-doc-upload" multiple style={{ display: 'none' }} onChange={handleAmbDocumentUpload} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                          <label htmlFor="amb-doc-upload" style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                            <FilePdf size={28} color="#94a3b8" weight="duotone" style={{ marginBottom: '0.25rem' }} />
                            <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.8125rem' }}>Upload Verification Documents</div>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Driving License, NID copy, etc. — Max 2 MB each</p>
                          </label>
                          
                          {ambDocuments.length > 0 && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {ambDocuments.map((doc, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{doc.name}</span>
                                  <span onClick={() => setAmbDocuments(ambDocuments.filter((_, i) => i !== idx))} style={{ cursor: 'pointer', color: '#ef4444', fontSize: '14px', fontWeight: 'bold', marginLeft: '8px' }}>&times;</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
              
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="submit" className="ecare-button" style={{ padding: '0.6rem 2.5rem', fontSize: '0.9rem' }}>
                          Register Ambulance
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
