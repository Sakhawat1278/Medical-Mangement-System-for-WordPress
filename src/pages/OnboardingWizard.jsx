import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Palette, Cloud, Shield, CheckCircle, Warning, 
  ArrowRight, ArrowLeft, Upload, Image as ImageIcon, Heartbeat, ShieldCheck,
  Sparkle, HouseLine, Database
} from 'phosphor-react'
import toast from 'react-hot-toast'
import { testFirebaseConnection, initFirebase } from '../utils/firebase'
import useStore from '../store/useStore'

const OnboardingWizard = () => {
  const completeOnboarding = useStore(state => state.completeOnboarding)
  const [step, setStep] = useState(1)
  
  // Base Colors from image
  const primaryColor = '#1b3b2b' // Deep forest green
  const sageColor = '#6e8d7c'    // Muted sage green
  const mintBgColor = '#edf2ef'  // Light mint/sage background

  // Step 1: Admin config
  const [adminName, setAdminName] = useState(window.ecareConfig?.user?.name || 'admin')
  const [adminEmail, setAdminEmail] = useState(window.ecareConfig?.user?.email || 'dev-email@wpengine.local')
  const [adminPassword, setAdminPassword] = useState('')
  
  // Step 2: Clinic General Profile
  const [clinicName, setClinicName] = useState(window.ecareConfig?.siteName || 'E-CARE Clinic')
  const [clinicPhone, setClinicPhone] = useState(window.ecareConfig?.sitePhone || '+880 1234 567890')
  const [clinicEmail, setClinicEmail] = useState(window.ecareConfig?.siteEmail || 'clinic@ecare.com')
  const [clinicAddress, setClinicAddress] = useState(window.ecareConfig?.siteAddress || '12 Health Road, Dhaka')
  const [clinicWebsite, setClinicWebsite] = useState(window.ecareConfig?.siteWebsite || 'www.ecare-clinic.com')
  
  // Step 3: Visual Identity
  const [logo, setLogo] = useState(window.ecareConfig?.logo || '')
  const [bgImage, setBgImage] = useState(window.ecareConfig?.bgImage || '')
  const [themeColor, setThemeColor] = useState(primaryColor)
  const [licenseKey, setLicenseKey] = useState('')
  
  // Step 4: Firebase Config
  const savedFb = window.ecareConfig?.firebaseConfig || {}
  const [fbApiKey, setFbApiKey] = useState(savedFb.apiKey || '')
  const [fbAuthDomain, setFbAuthDomain] = useState(savedFb.authDomain || '')
  const [fbProjectId, setFbProjectId] = useState(savedFb.projectId || '')
  const [fbStorageBucket, setFbStorageBucket] = useState(savedFb.storageBucket || '')
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(savedFb.messagingSenderId || '')
  const [fbAppId, setFbAppId] = useState(savedFb.appId || '')
  const [isTesting, setIsTesting] = useState(false)
  const [connError, setConnError] = useState(null)
  const [connSuccess, setConnSuccess] = useState(false)

  // Step 5: Activation
  const [isFinishing, setIsFinishing] = useState(false)

  // Media selector upload
  const handleMediaUpload = (target) => {
    if (window.wp && window.wp.media) {
      const frame = window.wp.media({
        title: 'Select or Upload Branding Asset',
        button: { text: 'Use this asset' },
        multiple: false
      })
      frame.on('select', () => {
        const attachment = frame.state().get('selection').first().toJSON()
        if (target === 'logo') setLogo(attachment.url)
        if (target === 'bg') setBgImage(attachment.url)
      })
      frame.open()
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = e.target.files?.[0]
        if (file) {
          try {
            const result = await useStore.getState().uploadFile(file, 'public')
            if (result?.url) {
              if (target === 'logo') setLogo(result.url)
              if (target === 'bg') setBgImage(result.url)
              toast.success('Asset uploaded successfully')
            }
          } catch (err) {
            toast.error('Failed to upload asset')
          }
        }
      }
      input.click()
    }
  }

  const getFirebaseConfig = () => ({
    apiKey: fbApiKey.trim(),
    authDomain: fbAuthDomain.trim(),
    projectId: fbProjectId.trim(),
    storageBucket: fbStorageBucket.trim(),
    messagingSenderId: fbMessagingSenderId.trim(),
    appId: fbAppId.trim()
  })

  const isFirebaseConfigFilled = () => fbApiKey && fbProjectId && fbAppId
  const hasStartedFirebase = () => !!(fbApiKey.trim() || fbProjectId.trim() || fbAppId.trim() || fbAuthDomain.trim() || fbStorageBucket.trim() || fbMessagingSenderId.trim())

  // Firebase live connection check
  const handleTestConnection = async () => {
    const config = getFirebaseConfig()
    if (!config.apiKey || !config.projectId || !config.appId) {
      toast.error('Please fill in at least API Key, Project ID, and App ID.')
      return
    }
    setIsTesting(true)
    setConnError(null)
    setConnSuccess(false)
    try {
      const result = await testFirebaseConnection(config)
      if (result.success) {
        setConnSuccess(true)
        // Initialize Firebase globally with the confirmed config
        initFirebase(config)
        toast.success('Firebase connection verified successfully!')
      } else {
        setConnError(result.error || 'Connection failed')
        toast.error(`Firebase connection failed: ${result.error}`)
      }
    } catch (err) {
      setConnError(err.message || 'Invalid Firebase config.')
      toast.error('Connection test failed.')
    } finally {
      setIsTesting(false)
    }
  }

  const handleFinish = async () => {
    setIsFinishing(true)
    try {
      const success = await completeOnboarding({
        siteName: clinicName,
        siteAddress: clinicAddress,
        sitePhone: clinicPhone,
        siteEmail: clinicEmail,
        siteWebsite: clinicWebsite,
        logo,
        bgImage,
        primaryColor: themeColor,
        licenseKey,
        firebaseConfig: getFirebaseConfig()
      })
      if (success) {
        toast.success('Portal activated! Welcome to E-CARE.')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast.error('Failed to register configuration variables.')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete setup.')
    } finally {
      setIsFinishing(false)
    }
  }

  const stepVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
  }

  // Sidebar heading helper
  const getSidebarHeading = () => {
    switch(step) {
      case 1: return <>A few steps to <em>your</em> workspace.</>
      case 2: return <>Tell us about <em>your</em> clinic.</>
      case 3: return <>Define <em>your</em> brand look.</>
      case 4: return <>Connect <em>your</em> database.</>
      case 5: return <>Ready to <em>launch</em> portal.</>
      default: return <>A few steps to <em>your</em> workspace.</>
    }
  }

  return (
    <>
      <style>{`
        .ob-root {
          display: grid;
          grid-template-columns: 360px 1fr;
          min-height: 100vh;
          font-family: inherit;
          background: #ffffff;
          color: ${primaryColor};
        }
        
        .ob-sidebar {
          background: ${mintBgColor};
          border-right: 1px solid #e2e8f0;
          padding: 4.5rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100vh;
          box-sizing: border-box;
          position: sticky;
          top: 0;
        }
        
        .ob-logo-area {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .ob-logo-icon {
          width: 28px;
          height: 28px;
          background: ${primaryColor};
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.95rem;
        }
        
        .ob-logo-text {
          font-size: 0.875rem;
          font-weight: 800;
          color: ${primaryColor};
          letter-spacing: 0.05em;
        }
        
        .ob-sidebar-middle {
          margin-top: -3rem;
        }
        
        .ob-sidebar-tag {
          font-size: 0.6875rem;
          font-weight: 800;
          color: ${sageColor};
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.75rem;
        }
        
        .ob-sidebar-heading {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.25;
          color: ${primaryColor};
          margin: 0 0 2rem 0;
          letter-spacing: 0;
        }
        
        .ob-sidebar-heading em {
          font-style: italic;
          font-weight: 400;
        }
        
        .ob-steps-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 0;
          margin: 0;
          list-style: none;
        }
        
        .ob-step-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          box-sizing: border-box;
        }
        
        .ob-step-item.active {
          background: #ffffff;
          color: ${primaryColor};
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          border: 1px solid #cbd5e1;
        }
        
        .ob-step-item.inactive {
          color: ${sageColor};
          background: transparent;
        }
        
        .ob-step-item.completed {
          color: ${primaryColor};
          background: transparent;
        }
        
        .ob-step-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .ob-step-number {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .ob-step-item.active .ob-step-number {
          border-color: ${primaryColor};
          color: ${primaryColor};
        }
        
        .ob-step-item.inactive .ob-step-number {
          border-color: #cbd5e1;
          color: ${sageColor};
        }
        
        .ob-step-item.completed .ob-step-number {
          background: ${primaryColor};
          border-color: ${primaryColor};
          color: #ffffff;
        }
        
        .ob-step-icon {
          display: flex;
          align-items: center;
          color: inherit;
          opacity: 0.9;
        }
        
        .ob-sidebar-footer {
          font-size: 0.75rem;
          color: ${sageColor};
          font-weight: 500;
        }
        
        .ob-sidebar-footer a {
          color: ${primaryColor};
          font-weight: 700;
          text-decoration: underline;
        }
        
        .ob-sidebar-footer a:hover {
          color: #142b1f;
        }
        
        .ob-content-panel {
          padding: 5rem 8rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100vh;
          box-sizing: border-box;
          overflow-y: auto;
          background: #ffffff;
        }
        
        .ob-content-wrapper {
          max-width: 520px;
          width: 100%;
          margin: auto 0;
        }
        
        .ob-section-tag {
          font-size: 0.6875rem;
          font-weight: 800;
          color: ${sageColor};
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.75rem;
        }
        
        .ob-main-heading {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          color: ${primaryColor};
          margin: 0 0 1rem 0;
          letter-spacing: 0;
        }
        
        .ob-main-heading em {
          font-style: italic;
          font-weight: 400;
        }
        
        .ob-description {
          font-size: 0.9375rem;
          color: ${sageColor};
          line-height: 1.5;
          margin: 0 0 2.5rem 0;
        }
        
        .ob-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }
        
        .ob-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .ob-label {
          font-size: 0.6875rem;
          font-weight: 800;
          color: ${primaryColor};
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        
        .ob-input {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.8125rem;
          color: ${primaryColor};
          background: #ffffff;
          box-sizing: border-box;
          transition: all 0.2s ease-in-out;
        }
        
        .ob-input:focus {
          border-color: ${sageColor};
          outline: none;
          box-shadow: 0 0 0 3px rgba(110, 141, 124, 0.08);
        }
        
        .ob-input-note {
          font-size: 0.725rem;
          color: ${sageColor};
          margin-top: 0.25rem;
        }
        
        .ob-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 3rem;
          gap: 1.5rem;
        }
        
        .ob-signin-link {
          font-size: 0.8125rem;
          color: ${sageColor};
        }
        
        .ob-signin-link strong {
          color: ${primaryColor};
          font-weight: 700;
          cursor: pointer;
        }
        
        .ob-signin-link strong:hover {
          text-decoration: underline;
        }
        
        .ob-btn {
          background: ${primaryColor};
          color: #ffffff;
          border: none;
          padding: 0.6rem 1.4rem;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease-in-out;
        }
        
        .ob-btn:hover:not(:disabled) {
          background: #142b1f;
          transform: translateY(-1px);
        }
        
        .ob-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          opacity: 1;
        }
        
        .ob-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f1f5f9;
          padding-top: 1.25rem;
          margin-top: 3rem;
          width: 100%;
        }
        
        .ob-copyright {
          font-size: 0.75rem;
          color: ${sageColor};
        }
        
        .ob-progress-dots {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .ob-dot {
          height: 4px;
          border-radius: 2px;
          background: #cbd5e1;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ob-dot.active {
          width: 14px;
          background: ${primaryColor};
        }
        
        .ob-dot.inactive {
          width: 4px;
          background: #cbd5e1;
        }

        /* Slight Border Radius Override - Subtle Rounded Corners Everywhere */
        .ob-logo-icon,
        .ob-step-item,
        .ob-step-number,
        .ob-input,
        .ob-btn,
        .ob-dot,
        *[style*="border-radius"],
        *[style*="borderRadius"] {
          border-radius: 4px !important;
        }
      `}</style>

      <div className="ob-root">
        {/* Left Sidebar Panel */}
        <div className="ob-sidebar">
          <div className="ob-logo-area">
            <div className="ob-logo-icon">E</div>
            <div className="ob-logo-text">E-CARE</div>
          </div>

          <div className="ob-sidebar-middle">
            <div className="ob-sidebar-tag">Initial Setup</div>
            <h1 className="ob-sidebar-heading">{getSidebarHeading()}</h1>

            <ul className="ob-steps-list">
              <li className={`ob-step-item ${step === 1 ? 'active' : (step > 1 ? 'completed' : 'inactive')}`}>
                <div className="ob-step-left">
                  <div className="ob-step-number">1</div>
                  <span>Welcome</span>
                </div>
                <div className="ob-step-icon">
                  <Sparkle size={16} weight={step === 1 ? "fill" : "regular"} />
                </div>
              </li>
              <li className={`ob-step-item ${step === 2 ? 'active' : (step > 2 ? 'completed' : 'inactive')}`}>
                <div className="ob-step-left">
                  <div className="ob-step-number">2</div>
                  <span>Clinic</span>
                </div>
                <div className="ob-step-icon">
                  <HouseLine size={16} weight={step === 2 ? "fill" : "regular"} />
                </div>
              </li>
              <li className={`ob-step-item ${step === 3 ? 'active' : (step > 3 ? 'completed' : 'inactive')}`}>
                <div className="ob-step-left">
                  <div className="ob-step-number">3</div>
                  <span>Identity</span>
                </div>
                <div className="ob-step-icon">
                  <Palette size={16} weight={step === 3 ? "fill" : "regular"} />
                </div>
              </li>
              <li className={`ob-step-item ${step === 4 ? 'active' : (step > 4 ? 'completed' : 'inactive')}`}>
                <div className="ob-step-left">
                  <div className="ob-step-number">4</div>
                  <span>Database</span>
                </div>
                <div className="ob-step-icon">
                  <Database size={16} weight={step === 4 ? "fill" : "regular"} />
                </div>
              </li>
              <li className={`ob-step-item ${step === 5 ? 'active' : 'inactive'}`}>
                <div className="ob-step-left">
                  <div className="ob-step-number">5</div>
                  <span>Launch</span>
                </div>
                <div className="ob-step-icon">
                  <ShieldCheck size={16} weight={step === 5 ? "fill" : "regular"} />
                </div>
              </li>
            </ul>
          </div>

          <div className="ob-sidebar-footer">
            Need help? <a href="#" onClick={(e) => { e.preventDefault(); toast('Support ticket feature coming soon!'); }}>Contact support</a>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <div className="ob-content-panel">
          <div className="ob-content-wrapper">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="ob-section-tag">Welcome</div>
                  <h2 className="ob-main-heading">Let's set up your <em>clinic</em>.</h2>
                  <p className="ob-description">
                    A short, guided flow to configure your workspace, brand, and database. Takes about three minutes.
                  </p>

                  <div className="ob-form">
                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.75rem', marginBottom: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WordPress Administrator Session</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: primaryColor }}>{adminName || 'WordPress Admin'}</div>
                      <div style={{ fontSize: '0.9rem', color: sageColor }}>{adminEmail}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>E-CARE will automatically configure your WordPress account as the main Clinical Administrator. No additional password setup is required.</div>
                    </div>

                    <div className="ob-actions-row">
                      <button 
                        type="button" 
                        onClick={() => setStep(2)} 
                        className="ob-btn"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Begin Setup <ArrowRight size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="ob-section-tag">Clinic Profile</div>
                  <h2 className="ob-main-heading">General profile <em>details</em>.</h2>
                  <p className="ob-description">
                    Establish the clinic location and contact credentials printed on invoices and receipts.
                  </p>

                  <div className="ob-form">
                    <div className="ob-form-group">
                      <label className="ob-label">Clinic / Hospital Name</label>
                      <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="ob-input" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="ob-form-group">
                        <label className="ob-label">Contact Phone</label>
                        <input type="text" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className="ob-input" />
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">Support Email</label>
                        <input type="email" value={clinicEmail} onChange={(e) => setClinicEmail(e.target.value)} className="ob-input" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="ob-form-group">
                        <label className="ob-label">Website URL</label>
                        <input type="text" value={clinicWebsite} onChange={(e) => setClinicWebsite(e.target.value)} className="ob-input" />
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">Physical Address</label>
                        <input type="text" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className="ob-input" />
                      </div>
                    </div>

                    <div className="ob-actions-row">
                      <button type="button" onClick={() => setStep(1)} className="ob-btn" style={{ background: 'transparent', color: sageColor, border: `1px solid ${sageColor}` }}>
                        <ArrowLeft size={16} weight="bold" /> Back
                      </button>
                      <button 
                        type="button" 
                        disabled={!clinicName || !clinicPhone || !clinicEmail}
                        onClick={() => setStep(3)} 
                        className="ob-btn"
                      >
                        Continue <ArrowRight size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="ob-section-tag">Identity</div>
                  <h2 className="ob-main-heading">Visual identity &amp; <em>branding</em>.</h2>
                  <p className="ob-description">
                    Brand your E-CARE clinical workspace logo, custom background, and core color accent.
                  </p>

                  <div className="ob-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="ob-form-group">
                        <label className="ob-label">Portal Theme Accent</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${sageColor}` }}>
                          <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', background: themeColor }}>
                            <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} style={{ position: 'absolute', top: -10, left: -10, width: 60, height: 60, cursor: 'pointer', opacity: 0 }} />
                          </div>
                          <input type="text" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} style={{ width: '80px', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', border: 'none', background: 'transparent' }} />
                        </div>
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">License Key</label>
                        <input type="password" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="••••••••••••••••" className="ob-input" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="ob-form-group">
                        <label className="ob-label">Clinic Logo</label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${sageColor}` }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '6px', border: `1px solid ${sageColor}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={20} color={sageColor} />}
                          </div>
                          <button type="button" onClick={() => handleMediaUpload('logo')} className="ob-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#f1f5f9', color: primaryColor }}>Browse</button>
                        </div>
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">Auth BG Image</label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '10px', border: `1px solid ${sageColor}` }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '6px', border: `1px solid ${sageColor}`, background: bgImage ? `url(${bgImage}) center/cover` : sageColor }} />
                          <button type="button" onClick={() => handleMediaUpload('bg')} className="ob-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#f1f5f9', color: primaryColor }}>Browse</button>
                        </div>
                      </div>
                    </div>

                    <div className="ob-actions-row">
                      <button type="button" onClick={() => setStep(2)} className="ob-btn" style={{ background: 'transparent', color: sageColor, border: `1px solid ${sageColor}` }}>
                        <ArrowLeft size={16} weight="bold" /> Back
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setStep(4)} 
                        className="ob-btn"
                      >
                        Continue <ArrowRight size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="ob-section-tag">Database (Optional)</div>
                  <h2 className="ob-main-heading">Connect <em>your</em> Firebase.</h2>
                  <p className="ob-description">
                    E-CARE uses Firebase Firestore to store all clinical data and Firebase Storage for files and images. Your credentials are stored securely in WordPress and never exposed publicly.
                  </p>

                  {/* Firebase logo badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🔥</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e' }}>Firebase Project Required</div>
                      <div style={{ fontSize: '0.75rem', color: '#b45309' }}>Create a project at <strong>console.firebase.google.com</strong> → Project Settings → Your Apps → Config</div>
                    </div>
                  </div>

                  <div className="ob-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="ob-form-group">
                        <label className="ob-label">API Key</label>
                        <input type="password" value={fbApiKey} onChange={e => setFbApiKey(e.target.value)} placeholder="AIzaSy..." className="ob-input" />
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">Auth Domain</label>
                        <input type="text" value={fbAuthDomain} onChange={e => setFbAuthDomain(e.target.value)} placeholder="your-app.firebaseapp.com" className="ob-input" />
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">Project ID</label>
                        <input type="text" value={fbProjectId} onChange={e => setFbProjectId(e.target.value)} placeholder="your-firebase-project" className="ob-input" />
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">Storage Bucket</label>
                        <input type="text" value={fbStorageBucket} onChange={e => setFbStorageBucket(e.target.value)} placeholder="your-app.appspot.com" className="ob-input" />
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">Messaging Sender ID</label>
                        <input type="text" value={fbMessagingSenderId} onChange={e => setFbMessagingSenderId(e.target.value)} placeholder="123456789" className="ob-input" />
                      </div>
                      <div className="ob-form-group">
                        <label className="ob-label">App ID</label>
                        <input type="text" value={fbAppId} onChange={e => setFbAppId(e.target.value)} placeholder="1:123456:web:abc123" className="ob-input" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: `1px solid ${sageColor}`, marginTop: '0.5rem' }}>
                      <button type="button" onClick={handleTestConnection} disabled={isTesting || !isFirebaseConfigFilled()} className="ob-btn" style={{ padding: '0.5rem 1rem', background: primaryColor }}>
                        {isTesting ? 'Testing...' : '🔥 Test Connection'}
                      </button>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {connSuccess && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '0.8rem' }}>
                            <CheckCircle size={16} color={primaryColor} weight="fill" /> Firebase Connected!
                          </div>
                        )}
                        {connError && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontWeight: 700, fontSize: '0.8rem' }}>
                            <Warning size={16} color="#ef4444" weight="fill" /> {connError.substring(0, 50)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ob-actions-row">
                      <button type="button" onClick={() => setStep(3)} className="ob-btn" style={{ background: 'transparent', color: sageColor, border: `1px solid ${sageColor}` }}>
                        <ArrowLeft size={16} weight="bold" /> Back
                      </button>
                      <button 
                        type="button" 
                        disabled={hasStartedFirebase() && !connSuccess}
                        onClick={() => setStep(5)} 
                        className="ob-btn"
                      >
                        {!hasStartedFirebase() ? 'Skip & Continue' : 'Continue'} <ArrowRight size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <div className="ob-section-tag">Launch</div>
                  <h2 className="ob-main-heading">Ready to <em>launch</em> portal.</h2>
                  <p className="ob-description">
                    Review your workspace summary before final activation. This will create dashboard records and authorize administrative roles.
                  </p>

                  <div className="ob-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: `1px solid ${sageColor}`, fontSize: '0.8rem' }}>
                      <div>
                        <div style={{ color: sageColor, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Administrator</div>
                        <div style={{ fontWeight: 800, color: primaryColor }}>{adminName}</div>
                      </div>
                      <div>
                        <div style={{ color: sageColor, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Clinic</div>
                        <div style={{ fontWeight: 800, color: primaryColor }}>{clinicName}</div>
                      </div>
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ color: sageColor, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Firebase Project</div>
                        <div style={{ fontWeight: 800, color: primaryColor, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{fbProjectId}</div>
                      </div>
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ color: sageColor, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Theme Color</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: primaryColor }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: themeColor }} />
                          <span style={{ textTransform: 'uppercase' }}>{themeColor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ob-actions-row">
                      <button type="button" onClick={() => setStep(4)} className="ob-btn" style={{ background: 'transparent', color: sageColor, border: `1px solid ${sageColor}` }}>
                        <ArrowLeft size={16} weight="bold" /> Back
                      </button>
                      <button 
                        type="button" 
                        disabled={isFinishing}
                        onClick={handleFinish} 
                        className="ob-btn"
                        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${sageColor} 100%)` }}
                      >
                        {isFinishing ? 'Launching...' : 'Launch Portal'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer containing Copyright & Dots Progress */}
            <div className="ob-footer">
              <div className="ob-copyright">© E-CARE</div>
              <div className="ob-progress-dots">
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} className={`ob-dot ${s === step ? 'active' : 'inactive'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default OnboardingWizard
