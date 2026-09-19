import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  Buildings, 
  UserPlus, 
  FirstAid, 
  IdentificationCard,
  CheckCircle,
  GoogleLogo,
  Phone,
  ShieldCheck,
  Users,
  Heartbeat,
  Eye,
  EyeSlash
} from 'phosphor-react'
import CustomSelect from './components/CustomSelect'
import CustomDatePicker from './components/CustomDatePicker'

// ─── Design tokens ────────────────────────────────────────────────────────────
const config = window.ecareAuthConfig || {}
const termsLink = config.termsUrl || '#'
const privacyLink = config.privacyUrl || '#'
const primary = config.primaryColor || '#1b3b2b'

const hexToRgb = (hex) => {
  const clean = (hex || '#1b3b2b').replace(/^#/, '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const primaryRgb = hexToRgb(primary);
const bgImage = config.bgImage || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop';

const AUTH_CSS = `
  .auth-grid-root {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    min-height: 100vh;
    font-family: inherit;
    background: #ffffff;
    color: #1e293b;
  }

  .auth-form-panel {
    padding: 2.5rem 3.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
    box-sizing: border-box;
    background: #ffffff;
    position: relative;
  }

  .auth-header-logo-container {
    position: absolute;
    top: 2.5rem;
    left: 3.5rem;
  }

  .auth-header-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .auth-logo-icon {
    width: 32px;
    height: 32px;
    background: var(--ecare-primary);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 800;
    font-size: 1.1rem;
    box-shadow: 0 4px 10px var(--ecare-primary-shadow);
  }

  .auth-logo-text {
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--ecare-primary);
    letter-spacing: 0.05em;
    font-family: inherit;
  }

  .auth-logo-img {
    height: 36px;
    width: auto;
    object-fit: contain;
  }

  .auth-form-center {
    margin: auto 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 4rem 0;
  }

  .auth-form-wrapper {
    max-width: 420px;
    width: 100%;
    text-align: left;
    transition: all 0.3s ease;
  }

  .auth-form-wrapper.signup-wide {
    max-width: 540px;
  }

  .auth-welcome-heading {
    font-size: 2.25rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 0.5rem;
    letter-spacing: -0.03em;
  }

  .auth-welcome-desc {
    font-size: 0.95rem;
    color: #64748b;
    margin-bottom: 2rem;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
  }

  .auth-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;
  }

  .auth-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #334155;
  }

  .auth-input-container {
    position: relative;
    width: 100%;
  }

  .auth-input {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #1e293b;
    background: #ffffff;
    box-sizing: border-box;
    transition: all 0.2s ease-in-out;
    font-family: inherit !important;
    outline: none;
  }

  .auth-input:focus {
    border-color: var(--ecare-primary);
    box-shadow: 0 0 0 3px var(--ecare-primary-bg);
  }

  .auth-checkbox-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #475569;
    margin: 0.25rem 0;
  }

  .auth-checkbox-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .auth-checkbox-label {
    cursor: pointer;
    user-select: none;
    font-weight: 500;
  }

  .auth-forgot-link {
    color: var(--ecare-primary);
    font-weight: 600;
    text-decoration: none;
  }

  .auth-forgot-link:hover {
    text-decoration: underline;
  }

  .auth-btn-brand {
    width: 100%;
    background: var(--ecare-primary);
    color: #ffffff;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 4px 12px var(--ecare-primary-shadow);
    font-family: inherit !important;
  }

  .auth-btn-brand:hover:not(:disabled) {
    background: var(--ecare-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px var(--ecare-primary-shadow);
  }

  .auth-btn-brand:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .auth-form-divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    gap: 0.75rem;
  }

  .auth-form-divider-line {
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  .auth-form-divider-text {
    font-size: 0.8rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .auth-social-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    width: 100%;
  }

  .auth-btn-social {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0.65rem 1rem;
    border-radius: 8px;
    border: 1.5px solid #cbd5e1;
    background: #ffffff;
    font-size: 0.9rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    font-family: inherit !important;
  }

  .auth-btn-social:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .auth-btn-social:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-register-text {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 1.5rem;
    text-align: center;
  }

  .auth-register-link {
    color: var(--ecare-primary);
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit !important;
  }

  .auth-register-link:hover {
    text-decoration: underline;
  }

  .auth-error-box {
    padding: 0.75rem 1rem;
    background: #fef2f2;
    color: #ef4444;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
    text-align: center;
    border: 1px solid #fee2e2;
  }

  .auth-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 0.8rem;
    color: var(--ecare-sage);
    font-weight: 500;
    margin-top: 2rem;
  }

  .auth-footer-link {
    color: var(--ecare-sage);
    text-decoration: none;
    font-weight: 500;
  }

  .auth-footer-link:hover {
    color: var(--ecare-primary);
    text-decoration: underline;
  }

  /* Right Panel */
  .auth-promo-panel {
    padding: 1rem 1rem 1rem 0;
    display: flex;
    box-sizing: border-box;
  }

  .auth-promo-card {
    flex: 1;
    border-radius: 24px;
    padding: 3.5rem 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #ffffff;
    overflow: hidden;
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .auth-promo-text-group {
    z-index: 10;
    text-align: left;
  }

  .auth-promo-heading {
    font-size: 2.15rem;
    font-weight: 700;
    line-height: 1.25;
    color: #ffffff;
    margin-bottom: 0.75rem;
    letter-spacing: -0.02em;
    max-width: 440px;
  }

  .auth-promo-subtitle {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    margin-bottom: 2rem;
    max-width: 400px;
  }

  /* Mockup Dashboard Preview */
  .auth-mockup-container {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 1.25rem;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    box-sizing: border-box;
    z-index: 10;
    transform: translateY(10px);
  }

  .auth-mockup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .auth-mockup-card {
    background: #ffffff;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    color: #1e293b;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
    text-align: left;
  }

  .auth-mockup-label {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 4px;
  }

  .auth-mockup-val {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1;
  }

  .auth-mockup-trend {
    font-size: 0.65rem;
    font-weight: 700;
    color: #10b981;
    background: #f0fdf4;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .auth-mockup-chart-placeholder {
    height: 35px;
    display: flex;
    align-items: flex-end;
    gap: 4px;
    margin-top: 8px;
  }

  .auth-mockup-bar {
    flex: 1;
    background: var(--ecare-primary-bg);
    border-radius: 3px;
    transition: height 0.3s;
  }

  .auth-mockup-bar:nth-child(1) { height: 40%; }
  .auth-mockup-bar:nth-child(2) { height: 65%; }
  .auth-mockup-bar:nth-child(3) { height: 35%; }
  .auth-mockup-bar:nth-child(4) { height: 85%; background: var(--ecare-primary); }
  .auth-mockup-bar:nth-child(5) { height: 55%; }
  .auth-mockup-bar:nth-child(6) { height: 75%; }

  .auth-mockup-list {
    background: #ffffff;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    color: #1e293b;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
    text-align: left;
  }

  .auth-mockup-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.75rem;
  }

  .auth-mockup-row:last-child {
    border-bottom: none;
  }

  .auth-mockup-row-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .auth-mockup-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .auth-mockup-dot.green { background: #10b981; }
  .auth-mockup-dot.yellow { background: #f59e0b; }

  .auth-mockup-patient {
    font-weight: 600;
    color: #1e293b;
  }

  .auth-mockup-time {
    color: #64748b;
    font-size: 0.7rem;
  }

  .auth-mockup-status {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 9999px;
  }

  .auth-mockup-status.green { background: #dcfce7; color: #166534; }
  .auth-mockup-status.yellow { background: #fef9c3; color: #854d0e; }

  /* Progress steps for signup */
  .auth-progress-dots {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    margin-top: 1.25rem;
  }

  .auth-dot {
    height: 4px;
    border-radius: 2px;
    background: #cbd5e1;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .auth-dot.active {
    width: 14px;
    background: var(--ecare-primary);
  }

  .auth-dot.inactive {
    width: 4px;
    background: #cbd5e1;
  }

  @media (max-width: 1024px) {
    .auth-grid-root {
      grid-template-columns: 1fr;
    }
    .auth-promo-panel {
      display: none;
    }
    .auth-form-panel {
      padding: 2rem 1.5rem;
    }
  }

  /* Element border radius */
  .auth-input {
    border-radius: 8px;
  }
  .auth-btn-brand {
    border-radius: 8px;
  }
  .auth-btn-social {
    border-radius: 8px;
  }
  .auth-error-box {
    border-radius: 8px;
  }

  /* ── Popup / Modal Mode Refinements ── */
  .auth-popup-container {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
    padding: 2.25rem 2rem 1.75rem;
    box-sizing: border-box;
    text-align: left;
    font-family: inherit;
    color: #1e293b;
    background: #ffffff;
  }

  .auth-popup-container.signup-wide {
    max-width: 480px;
  }

  .auth-popup-container .auth-welcome-heading {
    font-size: 1.45rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.35rem;
    letter-spacing: -0.02em;
    text-align: center;
  }

  .auth-popup-container .auth-welcome-desc {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .auth-popup-container .auth-form {
    gap: 1rem;
  }

  .auth-popup-container .auth-form-group {
    gap: 0.35rem;
  }

  .auth-popup-container .auth-label {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .auth-popup-container .auth-input {
    padding: 0.6rem 0.8rem;
    font-size: 0.875rem;
  }

  .auth-popup-container .auth-btn-brand {
    padding: 0.7rem 1.25rem;
    font-size: 0.9rem;
  }

  .auth-popup-container .auth-form-divider {
    margin: 1.15rem 0;
  }

  .auth-popup-container .auth-btn-social {
    padding: 0.55rem 0.85rem;
    font-size: 0.85rem;
  }

  .auth-popup-container .auth-register-text {
    margin-top: 1.25rem;
    font-size: 0.825rem;
  }
`

// ─── Branding Component ───────────────────────────────────────────────────────
const Logo = () => {
  const customLogo = config.logo;
  const siteName   = config.siteName || 'E-CARE';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {customLogo ? (
        <img 
          src={customLogo} 
          alt={siteName} 
          style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
        />
      ) : (
        <>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'var(--ecare-primary)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '1.1rem',
            boxShadow: `0 4px 10px var(--ecare-primary-shadow)`
          }}>
            E
          </div>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '800', 
            color: 'var(--ecare-primary)',
            letterSpacing: '0.05em',
            fontFamily: 'inherit'
          }}>
            {siteName}
          </span>
        </>
      )}
    </div>
  );
};

const cleanErrorMsg = (msg) => {
  if (!msg) return ''
  if (typeof msg !== 'string') return String(msg)
  return msg.replace(/<[^>]*>?/gm, '').replace(/^Error:\s*/i, '').trim()
}

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage = ({ onSwitch, onSuccess }) => {
  const [loginMode, setLoginMode] = useState('email') // 'email' | 'phone'
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Phone auth states
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [otpSent, setOtpSent] = useState(false)

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear() } catch (e) {}
        window.recaptchaVerifier = null
      }
    }
  }, [])

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${config.apiUrl}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-WP-Nonce': config.nonce 
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          remember: true
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        if (onSuccess) {
          onSuccess(data);
        } else if (data.redirect) {
          window.location.href = data.redirect
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.')
        setLoading(false)
      }
    } catch (err) {
      setError('A system error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const { getFirebaseAuth, GoogleAuthProvider, signInWithPopup } = await import('./utils/firebase')
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase integration is not fully configured or connected yet.')

      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      const res = await fetch(`${config.apiUrl}/firebase-login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-WP-Nonce': config.nonce 
        },
        body: JSON.stringify({ idToken, name: result.user.displayName, email: result.user.email })
      })

      const data = await res.json()
      if (data.success) {
        if (onSuccess) {
          onSuccess(data)
        } else if (data.redirect) {
          window.location.href = data.redirect
        }
      } else {
        setError(data.message || 'Social authentication failed.')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Google Sign-In failed. Please try again.')
      setLoading(false)
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { getFirebaseAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('./utils/firebase')
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Phone authentication is not configured yet.')

      let appVerifier = window.recaptchaVerifier
      if (!appVerifier) {
        appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        })
        window.recaptchaVerifier = appVerifier
      }

      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier)
      setConfirmationResult(confirmation)
      setOtpSent(true)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to send OTP code. Ensure valid phone number with country code.')
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!confirmationResult) return
    setError('')
    setLoading(true)

    try {
      const result = await confirmationResult.confirm(verificationCode)
      const idToken = await result.user.getIdToken()

      const res = await fetch(`${config.apiUrl}/firebase-login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-WP-Nonce': config.nonce 
        },
        body: JSON.stringify({ 
          idToken, 
          phone: result.user.phoneNumber,
          name: result.user.displayName || 'Phone User'
        })
      })

      const data = await res.json()
      if (data.success) {
        if (onSuccess) {
          onSuccess(data)
        } else if (data.redirect) {
          window.location.href = data.redirect
        }
      } else {
        setError(data.message || 'Phone authentication failed.')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Invalid verification code. Please check and try again.')
      setLoading(false)
    }
  }

  return (
    <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="auth-welcome-heading">Welcome Back</h2>
        <p className="auth-welcome-desc">
          {loginMode === 'email' 
            ? 'Enter your email and password to access your account.'
            : 'Enter your phone number to sign in with OTP.'}
        </p>
      </div>

      {error && (
        <div className="auth-error-box">
          {cleanErrorMsg(error)}
        </div>
      )}

      {/* Invisible ReCAPTCHA Target */}
      <div id="recaptcha-container"></div>

      {loginMode === 'email' ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <div className="auth-input-container">
              <input type="text" required className="auth-input no-icon" value={form.username} onChange={set('username')} placeholder="sellostore@company.com" />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-container">
              <input type={showPassword ? "text" : "password"} required className="auth-input no-icon" value={form.password} onChange={set('password')} placeholder="••••••••" style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center'
              }}>
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-checkbox-row">
            <div className="auth-checkbox-container">
              <input type="checkbox" id="remember-me" name="remember" />
              <label htmlFor="remember-me" className="auth-checkbox-label">Remember Me</label>
            </div>
            <button type="button" onClick={() => onSwitch('forgot')} className="auth-register-link" style={{ fontSize: '0.85rem' }}>Forgot Your Password?</button>
          </div>

          <button type="submit" disabled={loading} className="auth-btn-brand" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      ) : (
        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="auth-form">
          {!otpSent ? (
            <div className="auth-form-group">
              <label className="auth-label">Phone Number (with country code)</label>
              <div className="auth-input-container">
                <input type="tel" required className="auth-input no-icon" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+88017XXXXXXXX" />
              </div>
            </div>
          ) : (
            <div className="auth-form-group">
              <label className="auth-label">6-Digit Verification Code</label>
              <div className="auth-input-container">
                <input type="text" required className="auth-input no-icon" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="123456" maxLength={6} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn-brand" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Processing...' : (otpSent ? 'Verify & Log In' : 'Send Code')}
          </button>

          {otpSent && (
            <button type="button" onClick={() => { setOtpSent(false); setConfirmationResult(null); }} style={{ background: 'none', border: 'none', color: 'var(--ecare-sage)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', marginTop: '0.5rem' }}>
              Change Phone Number
            </button>
          )}

          <button type="button" onClick={() => { setLoginMode('email'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--ecare-primary)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center', marginTop: '0.5rem', fontFamily: 'inherit' }}>
            Back to Email Log In
          </button>
        </form>
      )}

      {/* Social Logins — only shown when admin has enabled them */}
      {config.socialLoginEnabled && (
        <>
          <div className="auth-form-divider">
            <div className="auth-form-divider-line" />
            <span className="auth-form-divider-text">Or Login With</span>
            <div className="auth-form-divider-line" />
          </div>

          <div className="auth-social-row">
            <button type="button" onClick={handleGoogleLogin} disabled={loading} className="auth-btn-social">
              <GoogleLogo size={18} weight="bold" color="#ea4335" /> Google
            </button>

            <button type="button" onClick={() => { setLoginMode(loginMode === 'email' ? 'phone' : 'email'); setError(''); }} disabled={loading} className="auth-btn-social">
              {loginMode === 'email' ? (
                <>
                  <Phone size={18} weight="bold" color="var(--ecare-primary)" /> Phone OTP
                </>
              ) : (
                <>
                  <User size={18} weight="bold" color="var(--ecare-primary)" /> Email Login
                </>
              )}
            </button>
          </div>
        </>
      )}

      <p className="auth-register-text">
        Don't Have An Account?{' '}
        <button onClick={() => onSwitch('signup')} className="auth-register-link">
          Register Now.
        </button>
      </p>
    </motion.div>
  )
}

// ─── Signup Page (Patient Only) ──────────────────────────────────────────────
const SignupPage = ({ onSwitch, onSuccess }) => {
  const [signupMode, setSignupMode] = useState('email') // 'email' | 'phone'
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'patient', 
    phone: '', 
    dob: '',
    gender: '',
    bloodGroup: '',
    address: '',
    city: '',
    zip: '',
    middlename: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Phone registration verification states
  const [otpSent, setOtpSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifierSignup) {
        try { window.recaptchaVerifierSignup.clear() } catch (e) {}
        window.recaptchaVerifierSignup = null
      }
    }
  }, [])

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${config.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        if (onSuccess) {
           setTimeout(() => onSuccess(data), 2000)
        }
      } else {
        setError(data.message || 'Registration failed.')
      }
    } catch (err) {
      setError('A system error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)
    try {
      const { getFirebaseAuth, GoogleAuthProvider, signInWithPopup } = await import('./utils/firebase')
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase integration is not fully configured or connected yet.')

      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      const res = await fetch(`${config.apiUrl}/firebase-login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-WP-Nonce': config.nonce 
        },
        body: JSON.stringify({ 
          idToken, 
          name: result.user.displayName, 
          email: result.user.email
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => onSuccess(data), 2000)
        } else if (data.redirect) {
          window.location.href = data.redirect
        }
      } else {
        setError(data.message || 'Google registration failed.')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Google sign-up failed. Please try again.')
      setLoading(false)
    }
  }

  const handlePhoneSignupSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!form.phone) {
      setError('Phone number is required.')
      setLoading(false)
      return
    }

    try {
      const { getFirebaseAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('./utils/firebase')
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('Firebase integration is not fully configured or connected yet.')

      if (window.recaptchaVerifierSignup) {
        try { window.recaptchaVerifierSignup.clear() } catch (err) {}
      }

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-signup', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.')
        }
      })
      window.recaptchaVerifierSignup = verifier

      const result = await signInWithPhoneNumber(auth, form.phone, verifier)
      setConfirmationResult(result)
      setOtpSent(true)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to send SMS code. Make sure the number has country code (e.g. +88017...).')
      setLoading(false)
    }
  }

  const handlePhoneSignupVerifyConfirm = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!confirmationResult) throw new Error('No active verification session.')
      const result = await confirmationResult.confirm(verificationCode)
      const idToken = await result.user.getIdToken()

      // Submit whole profile payload to firebase-login (which auto-registers and saves profile extra meta)
      const res = await fetch(`${config.apiUrl}/firebase-login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-WP-Nonce': config.nonce 
        },
        body: JSON.stringify({ 
          idToken,
          name: form.name,
          email: form.email,
          gender: form.gender,
          bloodGroup: form.bloodGroup,
          dob: form.dob,
          address: form.address,
          city: form.city,
          zip: form.zip
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        if (onSuccess) {
          setTimeout(() => onSuccess(data), 2000)
        } else if (data.redirect) {
          window.location.href = data.redirect
        }
      } else {
        setError(data.message || 'Phone registration failed on the server.')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Invalid verification code. Please check and try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', background: '#f0fdf4', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle size={40} weight="fill" />
        </div>
        <h2 className="auth-welcome-heading">Account Created</h2>
        <p className="auth-welcome-desc">
          Thank you for joining. Your patient account has been created successfully.
        </p>
        <button onClick={onSwitch} className="auth-btn-brand" style={{ marginTop: '1rem' }}>
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="auth-welcome-heading">Create Account</h2>
        <p className="auth-welcome-desc">Complete your details to set up your clinical profile.</p>
      </div>

      {/* Invisible ReCAPTCHA Target */}
      <div id="recaptcha-container-signup"></div>

      <form onSubmit={signupMode === 'email' ? handleRegister : (otpSent ? handlePhoneSignupVerifyConfirm : handlePhoneSignupSendOtp)} className="auth-form">
        {/* Invisible honeypot field to block automated spam bots */}
        <input 
          type="text" 
          name="middlename" 
          value={form.middlename || ''} 
          onChange={set('middlename')} 
          style={{ display: 'none' }} 
          tabIndex="-1" 
          autoComplete="off" 
        />
        {step === 1 ? (
          <>
            <div className="auth-form-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-container">
                <input type="text" required className="auth-input no-icon" value={form.name} onChange={set('name')} placeholder="John Doe" />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Email Address {signupMode === 'phone' && '(Optional)'}</label>
              <div className="auth-input-container">
                <input type="email" required={signupMode === 'email'} className="auth-input no-icon" value={form.email} onChange={set('email')} placeholder="john@example.com" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="auth-form-group">
                <label className="auth-label">Gender</label>
                <CustomSelect value={form.gender} onChange={v => setForm(p => ({ ...p, gender: v }))} 
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other' }
                  ]}
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Blood Group</label>
                <CustomSelect value={form.bloodGroup} onChange={v => setForm(p => ({ ...p, bloodGroup: v }))} 
                  options={[
                    { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                    { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                    { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }
                  ]}
                />
              </div>
            </div>
            
            <button type="button" onClick={() => setStep(2)} className="auth-btn-brand" style={{ marginTop: '0.5rem' }}>
              Continue <ArrowRight size={18} weight="bold" />
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="auth-form-group">
                <label className="auth-label">Date of Birth</label>
                <CustomDatePicker value={form.dob} onChange={v => setForm(p => ({ ...p, dob: v }))} />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Phone Number {signupMode === 'phone' && '(with country code)'}</label>
                <input type="text" required={signupMode === 'phone'} className="auth-input no-icon" value={form.phone} onChange={set('phone')} placeholder={signupMode === 'phone' ? "+88017XXXXXXXX" : "+880..."} />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Residential Address</label>
              <input type="text" className="auth-input no-icon" value={form.address} onChange={set('address')} placeholder="123 Street, City" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="auth-form-group">
                <label className="auth-label">City</label>
                <input type="text" className="auth-input no-icon" value={form.city} onChange={set('city')} placeholder="Dhaka" />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Zip Code</label>
                <input type="text" className="auth-input no-icon" value={form.zip} onChange={set('zip')} placeholder="1200" />
              </div>
            </div>

            {signupMode === 'email' ? (
              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <input type="password" required className="auth-input no-icon" value={form.password} onChange={set('password')} placeholder="Min 8 characters" />
              </div>
            ) : (
              otpSent && (
                <div className="auth-form-group">
                  <label className="auth-label">6-Digit Verification Code</label>
                  <input type="text" required className="auth-input no-icon" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="123456" maxLength={6} />
                </div>
              )
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setStep(1)} className="auth-btn-social">Back</button>
              <button type="submit" disabled={loading} className="auth-btn-brand">
                {loading ? 'Processing...' : (signupMode === 'email' ? 'Register' : (otpSent ? 'Verify & Complete' : 'Send Code'))}
              </button>
            </div>

            {signupMode === 'phone' && otpSent && (
              <button type="button" onClick={() => { setOtpSent(false); setConfirmationResult(null); }} style={{ background: 'none', border: 'none', color: 'var(--ecare-sage)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', marginTop: '0.5rem' }}>
                Change Phone Number
              </button>
            )}
          </>
        )}
      </form>

      {error && <p className="auth-error-box" style={{ marginTop: '1.25rem' }}>{error}</p>}

      <div className="auth-progress-dots">
        <div className={`auth-dot ${step === 1 ? 'active' : 'inactive'}`} />
        <div className={`auth-dot ${step === 2 ? 'active' : 'inactive'}`} />
      </div>

      {/* Social Registration — only shown when admin has enabled social login */}
      {config.socialLoginEnabled && (
        <>
          <div className="auth-form-divider">
            <div className="auth-form-divider-line" />
            <span className="auth-form-divider-text">Or Sign Up With</span>
            <div className="auth-form-divider-line" />
          </div>

          <div className="auth-social-row">
            <button type="button" onClick={handleGoogleSignup} disabled={loading} className="auth-btn-social">
              <GoogleLogo size={18} weight="bold" color="#ea4335" /> Google
            </button>

            <button type="button" onClick={() => { setSignupMode(signupMode === 'email' ? 'phone' : 'email'); setStep(1); setOtpSent(false); setConfirmationResult(null); setError(''); }} disabled={loading} className="auth-btn-social">
              {signupMode === 'email' ? (
                <>
                  <Phone size={18} weight="bold" color="var(--ecare-primary)" /> Phone OTP
                </>
              ) : (
                <>
                  <User size={18} weight="bold" color="var(--ecare-primary)" /> Email Register
                </>
              )}
            </button>
          </div>
        </>
      )}

      <p className="auth-register-text">
        Already have an account?{' '}
        <button onClick={onSwitch} className="auth-register-link">
          Sign In.
        </button>
      </p>
    </motion.div>
  )
}

// ─── Forgot Password Page ────────────────────────────────────────────────────
const ForgotPasswordPage = ({ onSwitch }) => {
  const [login, setLogin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch(`${config.apiUrl}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
        body: JSON.stringify({ login })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message || 'Password reset email sent.')
      } else {
        setError(data.message || 'Failed to send reset email.')
      }
    } catch (err) {
      setError('A system error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="auth-welcome-heading">Reset Password</h2>
        <p className="auth-welcome-desc">Enter your email or username to receive a reset link.</p>
      </div>

      {error && <div className="auth-error-box">{error}</div>}
      {success && (
        <div style={{ padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem', textAlign: 'center', border: '1px solid #bbf7d0' }}>
          {success}
        </div>
      )}

      {!success ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email or Username</label>
            <div className="auth-input-container">
              <input type="text" required className="auth-input no-icon" value={login} onChange={e => setLogin(e.target.value)} placeholder="john@example.com" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="auth-btn-brand" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <button onClick={() => onSwitch('login')} className="auth-btn-brand" style={{ width: '100%', marginTop: '0.5rem' }}>
          Back to Login
        </button>
      )}

      <p className="auth-register-text" style={{ marginTop: '1.5rem' }}>
        Remember your password?{' '}
        <button onClick={() => onSwitch('login')} className="auth-register-link">
          Sign In.
        </button>
      </p>
    </motion.div>
  )
}

// ─── Reset Password Page ─────────────────────────────────────────────────────
const ResetPasswordPage = ({ onSwitch }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const params = new URLSearchParams(window.location.search)
  const key = params.get('key') || ''
  const login = params.get('login') || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${config.apiUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config.nonce },
        body: JSON.stringify({ key, login, password })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(data.message || 'Password reset successful.')
      } else {
        setError(data.message || 'Failed to reset password.')
      }
    } catch (err) {
      setError('A system error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="auth-welcome-heading">New Password</h2>
        <p className="auth-welcome-desc">Create a new, strong password for your account.</p>
      </div>

      {error && <div className="auth-error-box">{error}</div>}
      {success && (
        <div style={{ padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem', textAlign: 'center', border: '1px solid #bbf7d0' }}>
          {success}
        </div>
      )}

      {!success ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">New Password</label>
            <div className="auth-input-container">
              <input type="password" required className="auth-input no-icon" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
          </div>
          <div className="auth-form-group">
            <label className="auth-label">Confirm Password</label>
            <div className="auth-input-container">
              <input type="password" required className="auth-input no-icon" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="auth-btn-brand" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Resetting...' : 'Save Password'}
          </button>
        </form>
      ) : (
        <button onClick={() => {
          // Remove query params to clean URL
          window.history.replaceState({}, document.title, window.location.pathname)
          onSwitch('login')
        }} className="auth-btn-brand" style={{ width: '100%', marginTop: '0.5rem' }}>
          Proceed to Login
        </button>
      )}
    </motion.div>
  )
}

const AuthApp = ({ onSuccess, popupMode = false }) => {
  const [view, setView] = useState(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'rp') {
      return 'reset'
    }
    if (hash === '#/signup' || hash === '#signup' || params.get('view') === 'signup' || params.get('action') === 'signup') {
      return 'signup'
    }
    if (params.get('view') === 'forgot') {
      return 'forgot'
    }
    return 'login'
  })

  const rootRef = React.useRef(null)

  // Listen to hash change and update view dynamically
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      const params = new URLSearchParams(window.location.search)
      if (params.get('action') === 'rp') {
        setView('reset')
      } else if (hash === '#/signup' || hash === '#signup' || params.get('view') === 'signup' || params.get('action') === 'signup') {
        setView('signup')
      } else if (params.get('view') === 'forgot') {
        setView('forgot')
      } else {
        setView('login')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Optimized Theme Injection for Auth App (Targeting Local Root)
  useEffect(() => {
    if (!rootRef.current) return

    const adjust = (hex, amt) => {
      const col = hex.startsWith('#') ? hex.slice(1) : hex
      const num = parseInt(col, 16)
      const r = Math.min(255, Math.max(0, (num >> 16) + amt))
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
      return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, '0')}`
    }

    const container = rootRef.current
    container.style.setProperty('--ecare-primary', primary)
    container.style.setProperty('--ecare-primary-hover', adjust(primary, -25))
    container.style.setProperty('--ecare-primary-bg', `${primary}12`)
    container.style.setProperty('--ecare-primary-border', `${primary}25`)
    container.style.setProperty('--ecare-primary-shadow', `${primary}33`)
    container.style.setProperty('--ecare-sage', '#6e8d7c')
    container.style.setProperty('--ecare-mint-bg', '#edf2ef')
  }, [])

  const styleBlock = <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />

  // ── Popup Mode: render only the form card, no full-page background ──────────
  if (popupMode) {
    const siteName = config.siteName || 'E-CARE'
    const customLogo = config.logo

    return (
      <div ref={rootRef} className={`auth-popup-container ${view === 'signup' ? 'signup-wide' : ''}`}>
        {styleBlock}

        {/* Brand Header */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.25rem' }}>
          {customLogo ? (
            <img src={customLogo} alt={siteName} style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '8px', 
                background: 'var(--ecare-primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#ffffff', 
                fontWeight: 800, 
                fontSize: '0.95rem' 
              }}>
                E
              </div>
              <span style={{ 
                fontSize: '1.05rem', 
                fontWeight: 800, 
                color: 'var(--ecare-primary)', 
                letterSpacing: '0.04em' 
              }}>
                {siteName}
              </span>
            </div>
          )}
        </div>

        <div style={{ width: '100%' }}>
          <AnimatePresence mode="wait">
            {view === 'login' && <LoginPage  key="login"  onSwitch={setView} onSuccess={onSuccess} />}
            {view === 'signup' && <SignupPage key="signup" onSwitch={() => setView('login')}  onSuccess={onSuccess} />}
            {view === 'forgot' && <ForgotPasswordPage key="forgot" onSwitch={setView} />}
            {view === 'reset' && <ResetPasswordPage key="reset" onSwitch={setView} />}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // ── Standalone split-pane layout ───────────────────────────────────────────
  const siteName = config.siteName || 'E-CARE'
  const customLogo = config.logo

  return (
    <div id="ecare-auth-root" ref={rootRef} className="auth-grid-root">
      {styleBlock}
      
      {/* Left Panel: Form & Brand Headers */}
      <div className="auth-form-panel">
        {/* Top Left Logo Area */}
        <div className="auth-header-logo-container">
          <a href={config.siteUrl || '/'} className="auth-header-logo">
            {customLogo ? (
              <img src={customLogo} alt={siteName} className="auth-logo-img" />
            ) : (
              <>
                <div className="auth-logo-icon">E</div>
                <span className="auth-logo-text">{siteName}</span>
              </>
            )}
          </a>
        </div>

        {/* Center Form Wrapper */}
        <div className="auth-form-center">
          <div className={`auth-form-wrapper ${view === 'signup' ? 'signup-wide' : ''}`}>
            <AnimatePresence mode="wait">
              {view === 'login' && <LoginPage  key="login"  onSwitch={setView} onSuccess={onSuccess} />}
              {view === 'signup' && <SignupPage key="signup" onSwitch={() => setView('login')} onSuccess={onSuccess} />}
              {view === 'forgot' && <ForgotPasswordPage key="forgot" onSwitch={setView} />}
              {view === 'reset' && <ResetPasswordPage key="reset" onSwitch={setView} />}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Footer Row */}
        <div className="auth-footer-row">
          <span>Copyright © 2026 {siteName} Enterprises LTD.</span>
          {termsLink !== '#' && (
            <a href={termsLink} target="_blank" rel="noopener noreferrer" className="auth-footer-link">Terms of Service</a>
          )}
          {termsLink !== '#' && (
            <span style={{ opacity: 0.35 }}>|</span>
          )}
          <a 
            href={privacyLink} 
            target={privacyLink !== '#' ? "_blank" : undefined} 
            rel={privacyLink !== '#' ? "noopener noreferrer" : undefined} 
            className="auth-footer-link"
            onClick={privacyLink === '#' ? (e) => { e.preventDefault(); alert('Privacy Policy is currently under review by legal.'); } : undefined}
          >
            Privacy Policy
          </a>
        </div>
      </div>

      {/* Right Panel: Marketing Copy & Dashboard Mockup Preview */}
      <div className="auth-promo-panel">
        <div className="auth-promo-card" style={{
          backgroundImage: `linear-gradient(135deg, rgba(${primaryRgb}, 0.5) 0%, rgba(${primaryRgb}, 0.7) 100%), url('${bgImage}')`
        }}>
          <div className="auth-promo-text-group">
            <h2 className="auth-promo-heading">Effortlessly coordinate care and operations.</h2>
            <p className="auth-promo-subtitle">Log in to access your clinical dashboard and manage your team.</p>
          </div>

          {/* High fidelity simulated CSS mockup dashboard */}
          <div className="auth-mockup-container">
            <div className="auth-mockup-grid">
              <div className="auth-mockup-card">
                <div className="auth-mockup-label">Total Appointments</div>
                <div className="auth-mockup-val">
                  1,482
                  <span className="auth-mockup-trend">+12%</span>
                </div>
                <div className="auth-mockup-chart-placeholder">
                  <div className="auth-mockup-bar" />
                  <div className="auth-mockup-bar" />
                  <div className="auth-mockup-bar" />
                  <div className="auth-mockup-bar" />
                  <div className="auth-mockup-bar" />
                  <div className="auth-mockup-bar" />
                </div>
              </div>

              <div className="auth-mockup-card">
                <div className="auth-mockup-label">Consultations</div>
                <div className="auth-mockup-val">
                  98.4%
                  <span className="auth-mockup-trend" style={{ background: '#eff6ff', color: '#3b82f6' }}>Active</span>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <svg viewBox="0 0 100 30" style={{ width: '100%', height: '30px', stroke: 'var(--ecare-primary)', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <path d="M0,25 Q15,5 30,20 T60,8 T90,22 T100,5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="auth-mockup-list">
              <div className="auth-mockup-label" style={{ marginBottom: '6px' }}>Upcoming Schedule</div>
              <div className="auth-mockup-row">
                <div className="auth-mockup-row-left">
                  <div className="auth-mockup-dot green" />
                  <span className="auth-mockup-patient">Sarah Connor</span>
                </div>
                <span className="auth-mockup-time">09:30 AM</span>
                <span className="auth-mockup-status green">Confirmed</span>
              </div>
              <div className="auth-mockup-row">
                <div className="auth-mockup-row-left">
                  <div className="auth-mockup-dot yellow" />
                  <span className="auth-mockup-patient">James Smith</span>
                </div>
                <span className="auth-mockup-time">10:15 AM</span>
                <span className="auth-mockup-status yellow">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthApp
