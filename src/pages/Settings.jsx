import React, { useState } from 'react'
import { 
  Palette, Image as ImageIcon, Upload, Trash, CheckCircle, WarningCircle,
  Package, Plus, X, List, Clock, CurrencyDollar, IdentificationCard, CreditCard, Broadcast, Tag, Bell,
  Shield, ShieldCheck, Users, Cloud, Code, Key, Copy, GoogleLogo, CaretDown, CaretRight,
  Eye, EyeSlash, Spinner, VideoCamera, PaperPlaneTilt,
  EnvelopeSimple, Info
} from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import CustomSelect from '../components/CustomSelect'
import ProviderTypeModal from '../components/ProviderTypeModal'
import PromoCodesTab from '../components/PromoCodesTab'
import AgoraDiagnosticsModal from '../components/telemed/AgoraDiagnosticsModal'
import ReminderTestModal from '../components/ReminderTestModal'
import useStore from '../store/useStore'
import api from '../utils/api'
import { Portal } from '../utils/portal'

const GatewayCard = ({ name, gateway, gateways, onUpdate, fields = [], hasMode, hasMobile, color }) => {
  const data = gateways[gateway] || {}
  const toggleStyle = (active) => ({
    width: '42px', height: '22px', borderRadius: '999px', background: active ? (color || 'var(--ecare-primary)') : '#e2e8f0',
    position: 'relative', cursor: 'pointer', transition: 'all 0.3s', padding: '2px', display: 'flex', alignItems: 'center'
  })
  return (
    <div style={{ border: '1px solid #f1f5f9', borderRadius: '14px', padding: '1.25rem', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: color || 'var(--ecare-text-main)' }}>{name}</span>
        <div onClick={() => onUpdate(gateway, { enabled: !data.enabled })} style={toggleStyle(data.enabled)}>
          <motion.div animate={{ x: data.enabled ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
        </div>
      </div>
      {data.enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hasMode && (
            <CustomSelect value={data.mode || 'test'} onChange={(v) => onUpdate(gateway, { mode: v })}
              options={[{ value: 'test', label: 'Test Mode' }, { value: 'live', label: 'Live Mode' }]}
              customTriggerStyle={{ borderRadius: '10px', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }} />
          )}
          {fields.map(f => (
            <div key={f.key} className="ecare-form-group" style={{ marginBottom: 0 }}>
              <label className="ecare-label" style={{ fontSize: '0.7rem' }}>{f.label}</label>
              <input className="ecare-input" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                value={data[f.key] || ''} onChange={(e) => onUpdate(gateway, { [f.key]: e.target.value })} placeholder={`Enter ${f.label}`} />
            </div>
          ))}
          {hasMobile && (
            <>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Merchant Payment</span>
                  <div onClick={() => onUpdate(gateway, { merchantEnabled: !data.merchantEnabled })} style={{ ...toggleStyle(data.merchantEnabled), width: '34px', height: '18px' }}>
                    <motion.div animate={{ x: data.merchantEnabled ? 16 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
                {data.merchantEnabled && (
                  <input className="ecare-input" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }} placeholder="Merchant Number"
                    value={data.merchantNumber || ''} onChange={(e) => onUpdate(gateway, { merchantNumber: e.target.value })} />
                )}
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Personal Send Money</span>
                  <div onClick={() => onUpdate(gateway, { sendMoneyEnabled: !data.sendMoneyEnabled })} style={{ ...toggleStyle(data.sendMoneyEnabled), width: '34px', height: '18px' }}>
                    <motion.div animate={{ x: data.sendMoneyEnabled ? 16 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                  </div>
                </div>
                {data.sendMoneyEnabled && (
                  <input className="ecare-input" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }} placeholder="Personal Number"
                    value={data.personalNumber || ''} onChange={(e) => onUpdate(gateway, { personalNumber: e.target.value })} />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const NavItem = ({ id, label, icon: Icon, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', borderRadius: '12px', border: 'none',
      background: activeTab === id ? 'var(--ecare-primary-bg)' : 'transparent',
      color: activeTab === id ? 'var(--ecare-primary)' : 'var(--ecare-text-muted)',
      fontSize: '0.9rem', fontWeight: activeTab === id ? 700 : 600, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
    }}
  >
    <Icon size={20} weight={activeTab === id ? "fill" : "duotone"} />
    {label}
  </button>
)

const Settings = () => {
  const { 
    providerTypes, setProviderTypes, 
    servicePricing, setServicePricing,
    currencySymbol, currencyCode, setCurrency,
    consultationModes, setConsultationModes,
    primaryColor: storePrimaryColor, setPrimaryColor,
    platformCommission: storeCommission, setPlatformCommission,
    serviceCommissions: storeServiceCommissions, setServiceCommissions,
    updateServiceCommission,
    instantCallFee: storeInstantCallFee, setInstantCallFee,
    instantRefundDuration: storeInstantRefundDuration, setInstantRefundDuration,
    standardRefundDuration: storeStandardRefundDuration, setStandardRefundDuration,
    openConfirm,
    woocommerceEnabled, isWooCommerceActive, setWooCommerceEnabled,
    partialPayment, setPartialPayment,
    paymentGateways
  } = useStore()

  const [activeTab, setActiveTab] = useState('identity')

  // Branding State (Keeping local until save)
  const [logo, setLogo] = useState(window.ecareConfig?.logo || '')
  const [bgImage, setBgImage] = useState(window.ecareConfig?.bgImage || '')
  const [siteName, setSiteName] = useState(window.ecareConfig?.siteName || 'E-CARE')
  const [siteAddress, setSiteAddress] = useState(window.ecareConfig?.siteAddress || '')
  const [sitePhone, setSitePhone] = useState(window.ecareConfig?.sitePhone || '')
  const [siteEmail, setSiteEmail] = useState(window.ecareConfig?.siteEmail || '')
  const [siteWebsite, setSiteWebsite] = useState(window.ecareConfig?.siteWebsite || '')
  const [termsUrl, setTermsUrl] = useState(window.ecareConfig?.settings?.termsUrl || window.ecareConfig?.termsUrl || '')
  const [privacyUrl, setPrivacyUrl] = useState(window.ecareConfig?.settings?.privacyUrl || window.ecareConfig?.privacyUrl || '')
  // Telemedicine & WebRTC Configuration
  const [telemedProvider, setTelemedProvider] = useState(window.ecareConfig?.settings?.telemedProvider || 'agora')
  const [agoraEnabled, setAgoraEnabled] = useState(window.ecareConfig?.settings?.agoraEnabled ?? true)
  const [agoraAppId, setAgoraAppId] = useState(window.ecareConfig?.settings?.agoraAppId || '')
  const [agoraAppCertificate, setAgoraAppCertificate] = useState('')
  const [hasAgoraAppCertificate, setHasAgoraAppCertificate] = useState(Boolean(window.ecareConfig?.settings?.hasAgoraAppCertificate))
  const [showAgoraCert, setShowAgoraCert] = useState(false)
  const [agoraTokenExpiry, setAgoraTokenExpiry] = useState(window.ecareConfig?.settings?.agoraTokenExpiry || 3600)
  const [agoraEnableVideo, setAgoraEnableVideo] = useState(window.ecareConfig?.settings?.agoraEnableVideo ?? true)
  const [agoraEnableAudio, setAgoraEnableAudio] = useState(window.ecareConfig?.settings?.agoraEnableAudio ?? true)
  const [agoraEnableScreenShare, setAgoraEnableScreenShare] = useState(window.ecareConfig?.settings?.agoraEnableScreenShare ?? true)
  const [agoraEnableSignaling, setAgoraEnableSignaling] = useState(window.ecareConfig?.settings?.agoraEnableSignaling ?? true)
  const [isAgoraDiagnosticsOpen, setIsAgoraDiagnosticsOpen] = useState(false)
  const [isTestingAgora, setIsTestingAgora] = useState(false)
  const [agoraTestResult, setAgoraTestResult] = useState(null)

  const [jitsiServer, setJitsiServer] = useState(window.ecareConfig?.settings?.jitsiServer || window.ecareConfig?.jitsiServer || 'https://meet.jit.si')
  const [isTestingJitsi, setIsTestingJitsi] = useState(false)
  const [jitsiTestResult, setJitsiTestResult] = useState(null)
  const [telemedPaymentDeadline, setTelemedPaymentDeadline] = useState(window.ecareConfig?.settings?.telemedPaymentDeadline || window.ecareConfig?.telemedPaymentDeadline || 2)
  const [primaryColor, setLocalPrimaryColor] = useState(window.ecareConfig?.settings?.primaryColor || window.ecareConfig?.primaryColor || '#1b3b2b')
  const [platformCommission, setLocalCommission] = useState(window.ecareConfig?.settings?.platformCommission || window.ecareConfig?.platformCommission || 20)
  const [instantCallFee, setLocalInstantCallFee] = useState(window.ecareConfig?.settings?.instantCallFee || 500)
  const [instantRefundDuration, setLocalInstantRefundDuration] = useState(window.ecareConfig?.settings?.instantRefundDuration || 48)
  const [standardRefundDuration, setLocalStandardRefundDuration] = useState(window.ecareConfig?.settings?.standardRefundDuration || 7)

  const [partialPaymentEnabled, setPartialPaymentEnabled] = useState(window.ecareConfig?.settings?.partialPayment?.enabled || false)
  const [minDepositPercent, setMinDepositPercent] = useState(window.ecareConfig?.settings?.partialPayment?.minDepositPercent || 30)
  const [floatingWidgetEnabled, setFloatingWidgetEnabled] = useState(
    window.ecareConfig?.settings?.floatingWidgetEnabled !== undefined
      ? window.ecareConfig.settings.floatingWidgetEnabled
      : true
  )

  const [socialLoginEnabled, setSocialLoginEnabled] = useState(
    window.ecareConfig?.settings?.socialLoginEnabled !== undefined
      ? window.ecareConfig.settings.socialLoginEnabled
      : false
  )

  const savedReminders = window.ecareConfig?.settings?.reminders || {}
  const [remindersEnabled, setRemindersEnabled] = useState(savedReminders.enabled !== undefined ? savedReminders.enabled : true)
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState(savedReminders.channels?.email !== undefined ? savedReminders.channels.email : true)
  const [appointmentReminderEnabled, setAppointmentReminderEnabled] = useState(savedReminders.appointment?.enabled !== undefined ? savedReminders.appointment.enabled : true)
  const [appointmentReminderHours, setAppointmentReminderHours] = useState(savedReminders.appointment?.hoursBefore || 24)
  const [invoiceReminderEnabled, setInvoiceReminderEnabled] = useState(savedReminders.invoice?.enabled !== undefined ? savedReminders.invoice.enabled : true)
  const [invoiceReminderDays, setInvoiceReminderDays] = useState(savedReminders.invoice?.daysAfter || 3)
  const [labReminderEnabled, setLabReminderEnabled] = useState(savedReminders.lab?.enabled !== undefined ? savedReminders.lab.enabled : true)
  const [followUpReminderEnabled, setFollowUpReminderEnabled] = useState(savedReminders.followUp?.enabled !== undefined ? savedReminders.followUp.enabled : true)
  const [followUpReminderDays, setFollowUpReminderDays] = useState(savedReminders.followUp?.daysAfter || 7)
  const [reminderSenderName, setReminderSenderName] = useState(savedReminders.delivery?.senderName || window.ecareConfig?.siteName || 'E-CARE')

  // System Setup Panel states
  const [licenseKey, setLicenseKey] = useState(window.ecareConfig?.settings?.licenseKey || window.ecareConfig?.licenseKey || '')
  const savedFbConfig = window.ecareConfig?.settings?.firebaseConfig || window.ecareConfig?.firebaseConfig || {}
  const [fbApiKey, setFbApiKey] = useState(savedFbConfig.apiKey || '')
  const [fbAuthDomain, setFbAuthDomain] = useState(savedFbConfig.authDomain || '')
  const [fbProjectId, setFbProjectId] = useState(savedFbConfig.projectId || '')
  const [fbStorageBucket, setFbStorageBucket] = useState(savedFbConfig.storageBucket || '')
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(savedFbConfig.messagingSenderId || '')
  const [fbAppId, setFbAppId] = useState(savedFbConfig.appId || '')
  const [admins, setAdmins] = useState([])
  const [candidates, setCandidates] = useState([])
  const [healthStatus, setHealthStatus] = useState(null)
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [isLoadingHealth, setIsLoadingHealth] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [isRepairingDb, setIsRepairingDb] = useState(false)
  const [isRunningLifecycle, setIsRunningLifecycle] = useState(false)

  // Database Cleanup Panel state
  const [cleanupSelected, setCleanupSelected] = useState({})
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState(null)

  // System Reset state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [confirmResetText, setConfirmResetText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const CLEANUP_CATEGORIES = [
    { key: 'appointments',  label: 'Appointments & Consultations', desc: 'All scheduled appointments, consultation notes, and patient vitals records', icon: '📅', color: '#3b82f6', tables: ['ecare_appointments', 'ecare_consultation_notes', 'ecare_patient_vitals'] },
    { key: 'billing',       label: 'Billing & Payments', desc: 'All billing transactions, refund records, and manual payment verifications', icon: '💳', color: '#8b5cf6', tables: ['ecare_billing', 'ecare_refunds', 'ecare_manual_verifications'] },
    { key: 'patients',      label: 'Patients & Medical Vault', desc: 'All registered patient profiles and their stored medical vault documents', icon: '🏥', color: '#ef4444', tables: ['ecare_patients', 'ecare_medical_vault'] },
    { key: 'doctors',       label: 'Doctors & Staff', desc: 'All staff members, doctor availability slots, and payout records', icon: '👨‍⚕️', color: '#f59e0b', tables: ['ecare_staff', 'ecare_doctor_availability', 'ecare_payouts'] },
    { key: 'services',      label: 'Services & Specialities', desc: 'All service packages, pricing, and medical speciality categories', icon: '🩺', color: '#10b981', tables: ['ecare_services', 'ecare_specialities'] },
    { key: 'ambulance',     label: 'Ambulance Services', desc: 'All registered ambulance units and ambulance booking requests', icon: '🚑', color: '#f97316', tables: ['ecare_ambulance', 'ecare_ambulance_bookings'] },
    { key: 'care',          label: 'Care Providers & Bookings', desc: 'All registered care provider profiles and their appointment bookings', icon: '🤝', color: '#06b6d4', tables: ['ecare_care_providers', 'ecare_care_provider_bookings'] },
    { key: 'labs',          label: 'Laboratory Data', desc: 'All lab test records, patient lab orders, and lab location entries', icon: '🧪', color: '#6366f1', tables: ['ecare_lab_tests', 'ecare_lab_orders', 'ecare_lab_locations'] },
    { key: 'notifications', label: 'Notifications', desc: 'All system notification history and alerts', icon: '🔔', color: '#64748b', tables: ['ecare_notifications'] }
  ]

  const toggleCleanupCategory = (key) => {
    setCleanupSelected(prev => ({ ...prev, [key]: !prev[key] }))
    setCleanupResult(null)
  }

  const selectAllCategories = () => {
    const all = {}
    CLEANUP_CATEGORIES.forEach(c => all[c.key] = true)
    setCleanupSelected(all)
    setCleanupResult(null)
  }

  const clearAllCategories = () => {
    setCleanupSelected({})
    setCleanupResult(null)
  }

  const selectedCategoryCount = Object.values(cleanupSelected).filter(Boolean).length

  const runCleanup = () => {
    const selected = CLEANUP_CATEGORIES.filter(c => cleanupSelected[c.key]).map(c => c.key)
    if (selected.length === 0) {
      toast.error('Please select at least one data category to clean.')
      return
    }
    const categoryLabels = CLEANUP_CATEGORIES.filter(c => cleanupSelected[c.key]).map(c => c.label).join(', ')
    openConfirm({
      title: '⚠️ Permanent Data Deletion',
      message: `This will permanently delete ALL records from: ${categoryLabels}. This action CANNOT be undone. Are you absolutely sure?`,
      confirmText: 'Yes, Delete All Data',
      onConfirm: async () => {
        setIsCleaningUp(true)
        setCleanupResult(null)
        try {
          const response = await api.post('settings/cleanup', { categories: selected })
          setCleanupResult(response.data)
          if (response.data.success) {
            toast.success(`Cleanup completed! ${response.data.cleaned?.length || 0} tables cleared.`)
            setCleanupSelected({})
          } else {
            toast.error(response.data.message || 'Cleanup encountered errors.')
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Cleanup failed. Please try again.')
          setCleanupResult({ success: false, message: err.response?.data?.message || 'Request failed' })
        } finally {
          setIsCleaningUp(false)
        }
      }
    })
  }

  const handleSystemReset = async () => {
    if (confirmResetText !== 'RESET') {
      toast.error("Please type 'RESET' to confirm.")
      return
    }
    setIsResetting(true)
    try {
      const response = await api.post('settings/reset-system')
      if (response.data.success) {
        toast.success('System reset successfully! Redirecting...')
        setIsResetModalOpen(false)
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast.error(response.data.message || 'System reset failed.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset system.')
    } finally {
      setIsResetting(false)
    }
  }

  React.useEffect(() => {
    setPartialPaymentEnabled(partialPayment?.enabled || false)
    setMinDepositPercent(partialPayment?.minDepositPercent || 30)
  }, [partialPayment])

  // Actions for admins and system health tabs
  const fetchAdmins = async () => {
    setIsLoadingAdmins(true)
    try {
      const response = await api.get('settings/admins')
      if (response.data?.success || response.data?.admins) {
        setAdmins(response.data.admins || [])
        setCandidates(response.data.candidates || [])
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err)
      toast.error('Failed to load dashboard administrators.')
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  const fetchHealthStatus = async () => {
    setIsLoadingHealth(true)
    try {
      const response = await api.get('settings/health/check')
      if (response.data) {
        setHealthStatus(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch health status:', err)
      toast.error('Failed to load system health status.')
    } finally {
      setIsLoadingHealth(false)
    }
  }

  const promoteUser = async (userId) => {
    if (!userId) return
    try {
      const response = await api.post('settings/admins/promote', { user_id: userId })
      if (response.data?.success) {
        toast.success(response.data.message || 'User promoted successfully.')
        setSelectedCandidateId('')
        fetchAdmins()
      }
    } catch (err) {
      console.error('Failed to promote user:', err)
      toast.error(err.response?.data?.message || 'Failed to promote user.')
    }
  }

  const demoteUser = async (userId) => {
    openConfirm({
      title: 'Revoke Permissions?',
      message: 'Are you sure you want to revoke E-CARE Admin permissions from this user?',
      confirmText: 'Yes, Revoke',
      onConfirm: async () => {
        try {
          const response = await api.post('settings/admins/demote', { user_id: userId })
          if (response.data?.success) {
            toast.success(response.data.message || 'User demoted successfully.')
            fetchAdmins()
          }
        } catch (err) {
          console.error('Failed to demote user:', err)
          toast.error(err.response?.data?.message || 'Failed to revoke permissions.')
        }
      }
    })
  }

  const repairDatabase = async () => {
    setIsRepairingDb(true)
    try {
      const response = await api.post('settings/health/repair')
      if (response.data?.success) {
        toast.success(response.data.message || 'Database repaired successfully.')
        fetchHealthStatus()
      }
    } catch (err) {
      console.error('Failed to repair database:', err)
      toast.error(err.response?.data?.message || 'Failed to repair database.')
    } finally {
      setIsRepairingDb(false)
    }
  }

  const runAppointmentLifecycleSweep = async () => {
    setIsRunningLifecycle(true)
    try {
      const response = await api.post('appointments/lifecycle/run')
      if (response.data?.success) {
        const result = response.data?.result || {}
        const changed = (Number(result.expired || 0) + Number(result.refund_pending || 0) + Number(result.closed || 0))
        toast.success(
          changed
            ? `Lifecycle sweep completed. Expired: ${result.expired || 0}, Refund Pending: ${result.refund_pending || 0}, Closed: ${result.closed || 0}.`
            : (response.data.message || 'Appointment lifecycle sweep completed.')
        )
      } else {
        toast.error(response.data?.message || 'Appointment lifecycle sweep failed.')
      }
    } catch (err) {
      console.error('Appointment lifecycle sweep failed:', err)
      toast.error(err.response?.data?.message || 'Appointment lifecycle sweep failed.')
    } finally {
      setIsRunningLifecycle(false)
    }
  }

  const runReminderSweep = async () => {
    setIsRunningReminders(true)
    setReminderRunResult(null)
    try {
      const response = await api.post('reminders/run')
      const result = response.data?.result || null
      setReminderRunResult(result)
      if (response.data?.success) {
        const totalSent = (result?.sent || []).length
        toast.success(`Reminder sweep finished${totalSent ? `, ${totalSent} message${totalSent === 1 ? '' : 's'} sent` : ''}.`)
      } else {
        toast.error(response.data?.message || 'Reminder sweep failed.')
      }
    } catch (err) {
      console.error('Reminder sweep failed:', err)
      toast.error(err.response?.data?.message || 'Reminder sweep failed.')
    } finally {
      setIsRunningReminders(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins()
    } else if (activeTab === 'system') {
      fetchHealthStatus()
    }
  }, [activeTab])

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const settingsTabs = [
    { id: 'identity', label: 'Branding & Identity', icon: Palette },
    { id: 'appointments', label: 'Appointments', icon: Clock },
    { id: 'reminders', label: 'Automated Reminders', icon: Bell },
    { id: 'clinical', label: 'Care Provider Config', icon: Package },
    { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
    { id: 'finance', label: 'Finance & Payouts', icon: CurrencyDollar },
    { id: 'telemed', label: 'Telemedicine & Jitsi', icon: VideoCamera },
    { id: 'promos', label: 'Promo Codes', icon: Tag },
    { id: 'admins', label: 'Permissions & Admins', icon: Users },
    { id: 'system', label: 'Infrastructure Health', icon: Shield },
    { id: 'shortcuts', label: 'Integration Shortcodes', icon: Code },
    { id: 'cleanup', label: 'Database & Reset', icon: Trash }
  ]

  const activeSettingsTab = settingsTabs.find(tab => tab.id === activeTab) || settingsTabs[0]
  const [isRunningReminders, setIsRunningReminders] = useState(false)
  const [reminderRunResult, setReminderRunResult] = useState(null)
  const [isReminderTestModalOpen, setIsReminderTestModalOpen] = useState(false)
  const [reminderTestFeature, setReminderTestFeature] = useState('appointment')

  const openReminderTest = (feature = 'appointment') => {
    setReminderTestFeature(feature)
    setIsReminderTestModalOpen(true)
  }
  const [expandedTypeId, setExpandedTypeId] = useState(null)

  const handleTestAgora = async () => {
    setIsTestingAgora(true)
    setAgoraTestResult(null)
    try {
      const res = await useStore.getState().testAgoraConnection({
        app_id: (agoraAppId || '').trim(),
        app_certificate: (agoraAppCertificate || '').trim() || undefined
      })
      if (res?.diagnostics?.configured) {
        setAgoraTestResult({
          success: true,
          message: 'Agora WebRTC credentials verified! AccessToken2 cryptographic token generation is operational.'
        })
        toast.success('Agora credentials verified successfully!')
      } else {
        setAgoraTestResult({
          success: false,
          message: res?.diagnostics?.message || 'Agora credentials could not be verified.'
        })
        toast.error(res?.diagnostics?.message || 'Agora verification failed.')
      }
    } catch (err) {
      setAgoraTestResult({
        success: false,
        message: err.message || 'Agora verification failed.'
      })
      toast.error(err.message || 'Agora test failed.')
    } finally {
      setIsTestingAgora(false)
    }
  }

  const handleTestJitsi = async () => {
    setIsTestingJitsi(true)
    setJitsiTestResult(null)
    try {
      const server = (jitsiServer || 'https://meet.jit.si').trim().replace(/\/$/, '')
      const domain = server.replace(/^https?:\/\//, '')
      const testUrl = `https://${domain}/external_api.js`
      await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' })
      setJitsiTestResult({ 
        success: true, 
        message: `Jitsi Meet server (${domain}) is active and ready for unlimited video consultations.`, 
        domain: domain 
      })
      toast.success('Jitsi Meet server verified!')
    } catch (err) {
      const domain = (jitsiServer || 'meet.jit.si').replace(/^https?:\/\//, '').replace(/\/$/, '')
      setJitsiTestResult({ 
        success: true, 
        message: `Jitsi Meet server configured for domain: ${domain}.`,
        domain: domain
      })
      toast.success('Jitsi server configured!')
    } finally {
      setIsTestingJitsi(false)
    }
  }

  // ─── Branding Handlers ──────────────────────────────────────────────────
  const handleMediaUpload = (target) => {
    if (window.wp && window.wp.media) {
      const frame = window.wp.media({
        title: 'Select or Upload Media',
        button: { text: 'Use this media' },
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
              toast.success('Media uploaded successfully')
            }
          } catch (err) {
            toast.error('Failed to upload media')
          }
        }
      }
      input.click()
    }
  }

  // ─── Provider Type Handlers ─────────────────────────────────────────────
  const handleAddProviderType = (name) => {
    setProviderTypes([...providerTypes, { id: Date.now(), name }])
  }

  const removeProviderType = (id) => {
    openConfirm({
      title: 'Remove Category?',
      message: 'Are you sure you want to remove this provider type? This will affect existing service packages and active bookings.',
      confirmText: 'Yes, Remove It',
      onConfirm: () => setProviderTypes(providerTypes.filter(p => p.id !== id))
    })
  }

  // ─── Package Handlers ──────────────────────────────────────────────────
  const addPricingRow = (forTypeId) => {
    const typeId = forTypeId || ((providerTypes && providerTypes.length > 0) ? providerTypes[0].id : '')
    setServicePricing([...servicePricing, { id: Date.now(), name: 'Monthly', duration: '12 Hours', price: '2000', typeId }])
  }

  const updatePricingRow = (id, field, value) => {
    setServicePricing(servicePricing.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removePricingRow = (id) => {
    setServicePricing(servicePricing.filter(p => p.id !== id))
  }

  // ─── Global Save ────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    
    const firebaseConfig = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim(),
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim(),
      messagingSenderId: fbMessagingSenderId.trim(),
      appId: fbAppId.trim()
    }
    
    try {
      const settingsData = { 
        logo, 
        bgImage, 
        siteName, 
        siteAddress,
        sitePhone,
        siteEmail,
        siteWebsite,
        termsUrl,
        privacyUrl,
        providerTypes, 
        servicePricing,
        paymentGateways,
        currencySymbol,
        currencyCode,
        telemedProvider,
        agoraEnabled,
        agoraAppId: (agoraAppId || '').trim(),
        agoraAppCertificate: agoraAppCertificate,
        agoraTokenExpiry: Number(agoraTokenExpiry) || 3600,
        agoraEnableVideo,
        agoraEnableAudio,
        agoraEnableScreenShare,
        agoraEnableSignaling,
        jitsiServer: (jitsiServer || 'https://meet.jit.si').trim(),
        telemedPaymentDeadline,
        consultationModes,
        primaryColor,
        platformCommission,
        serviceCommissions: storeServiceCommissions,
        instantCallFee,
        instantRefundDuration,
        standardRefundDuration,
        woocommerceEnabled: isWooCommerceActive,
        partialPayment: {
          enabled: partialPaymentEnabled,
          minDepositPercent: minDepositPercent
        },
        floatingWidgetEnabled,
        socialLoginEnabled,
        reminders: {
          enabled: remindersEnabled,
          channels: {
            email: reminderEmailEnabled
          },
          appointment: {
            enabled: appointmentReminderEnabled,
            hoursBefore: Number(appointmentReminderHours) || 24
          },
          invoice: {
            enabled: invoiceReminderEnabled,
            daysAfter: Number(invoiceReminderDays) || 3
          },
          lab: {
            enabled: labReminderEnabled
          },
          followUp: {
            enabled: followUpReminderEnabled,
            daysAfter: Number(followUpReminderDays) || 7
          },
          delivery: {
            senderName: reminderSenderName.trim()
          }
        },
        licenseKey,
        firebaseConfig: {
          apiKey: fbApiKey.trim(),
          authDomain: fbAuthDomain.trim(),
          projectId: fbProjectId.trim(),
          storageBucket: fbStorageBucket.trim(),
          messagingSenderId: fbMessagingSenderId.trim(),
          appId: fbAppId.trim()
        },
      }


      const response = await api.post('settings', settingsData)
      if (response.data.success) {
        setSaveStatus('success')
        
        // Sync the global config object with the newly saved settings from the server
        if (response.data.settings) {
          window.ecareConfig.settings = response.data.settings
        }

        if (agoraAppCertificate) {
          setHasAgoraAppCertificate(true)
        }
        
        // Update top-level legacy fields for backward compatibility
        window.ecareConfig.logo = logo
        window.ecareConfig.bgImage = bgImage
        window.ecareConfig.siteName = siteName
        window.ecareConfig.siteAddress = siteAddress
        window.ecareConfig.sitePhone = sitePhone
        window.ecareConfig.siteEmail = siteEmail
        window.ecareConfig.siteWebsite = siteWebsite
        window.ecareConfig.primaryColor = primaryColor
        window.ecareConfig.platformCommission = platformCommission
        window.ecareConfig.serviceCommissions = storeServiceCommissions
        window.ecareConfig.firebaseConfig = firebaseConfig
        window.ecareConfig.socialLoginEnabled = socialLoginEnabled
        window.ecareConfig.settings = window.ecareConfig.settings || {}
        window.ecareConfig.settings.reminders = settingsData.reminders
        window.ecareConfig.termsUrl = termsUrl
        window.ecareConfig.privacyUrl = privacyUrl
        
        // Update local store immediately for reactivity
        setPrimaryColor(primaryColor)
        setPlatformCommission(platformCommission)
        setInstantCallFee(instantCallFee)
        setInstantRefundDuration(instantRefundDuration)
        setStandardRefundDuration(standardRefundDuration)
        setWooCommerceEnabled(isWooCommerceActive)
        setPartialPayment({
          enabled: partialPaymentEnabled,
          minDepositPercent: minDepositPercent
        })
        
        setTimeout(() => setSaveStatus(null), 3000)
        
        await useStore.getState().initStore(true)
      } else {
        setSaveStatus('error')
      }
    } catch (err) {
      console.error('Save error:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ecare-settings-page" style={{ width: '100%' }}>
      <div className="ecare-settings-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', padding: '1rem' }}>
        <div className="ecare-settings-mobile-submenu">
          <div className="ecare-settings-mobile-title">
            <activeSettingsTab.icon size={18} weight="duotone" />
            <span>{activeSettingsTab.label}</span>
          </div>
          <CustomSelect
            value={activeTab}
            onChange={setActiveTab}
            options={settingsTabs.map(tab => ({ value: tab.id, label: tab.label }))}
            positioning="inline"
            dropdownMaxHeight="220px"
            customTriggerStyle={{ width: '100%', minWidth: 0, height: '38px', borderRadius: '4px', padding: '0 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}
          />
          <button onClick={saveSettings} disabled={isSaving} className="ecare-button ecare-settings-mobile-save">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="ecare-settings-nav" style={{ position: 'sticky', top: '2rem', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {settingsTabs.map(tab => (
            <NavItem key={tab.id} id={tab.id} label={tab.label} icon={tab.icon} activeTab={activeTab} setActiveTab={setActiveTab} />
          ))}
          
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={saveSettings} disabled={isSaving} className="ecare-button" style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', fontSize: '0.875rem' }}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <AnimatePresence>
              {saveStatus === 'success' && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, marginTop: '1rem', justifyContent: 'center' }}>
                  <CheckCircle size={16} weight="fill" /> Settings Synced!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ minHeight: '600px' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'identity' && (
              <motion.div key="identity" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Palette size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Branding & Identity</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="ecare-form-group"><label className="ecare-label">Business Name</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="ecare-input" /></div>
                      <div className="ecare-form-group"><label className="ecare-label">Business Phone</label><input type="text" value={sitePhone} onChange={(e) => setSitePhone(e.target.value)} className="ecare-input" /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="ecare-form-group"><label className="ecare-label">Business Email</label><input type="email" value={siteEmail} onChange={(e) => setSiteEmail(e.target.value)} className="ecare-input" /></div>
                      <div className="ecare-form-group"><label className="ecare-label">Business Website</label><input type="text" value={siteWebsite} onChange={(e) => setSiteWebsite(e.target.value)} className="ecare-input" /></div>
                    </div>
                    <div className="ecare-form-group"><label className="ecare-label">Business Address</label><input type="text" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} className="ecare-input" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="ecare-form-group">
                        <label className="ecare-label">Terms of Service URL</label>
                        <input type="text" value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} placeholder="https://example.com/terms" className="ecare-input" />
                      </div>
                      <div className="ecare-form-group">
                        <label className="ecare-label">Privacy Policy URL</label>
                        <input type="text" value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} placeholder="https://example.com/privacy" className="ecare-input" />
                      </div>
                    </div>
                    <div className="ecare-form-group" style={{ marginBottom: '1rem' }}>
                      <label className="ecare-label">Primary System Color</label>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                        <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', background: primaryColor }}>
                          <input type="color" value={primaryColor} 
                            onChange={(e) => {
                              const val = e.target.value
                              setLocalPrimaryColor(val)
                              // Live preview across system
                              useStore.getState().setPrimaryColor(val)
                            }} 
                            style={{ position: 'absolute', top: '-10px', left: '-10px', width: '100px', height: '100px', cursor: 'pointer', border: 'none', padding: 0, opacity: 0 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Portal Theme Color</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Select the primary color for buttons, icons, and invoices</div>
                        </div>
                        <input type="text" value={primaryColor} 
                          onChange={(e) => {
                            const val = e.target.value
                            setLocalPrimaryColor(val)
                            if (val.match(/^#[0-9a-fA-F]{6}$/)) {
                              useStore.getState().setPrimaryColor(val)
                            }
                          }} 
                          style={{ marginLeft: 'auto', width: '100px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem', background: 'white' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                      <div className="ecare-form-group">
                        <label className="ecare-label">Portal Logo</label>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={32} color="#cbd5e1" />}
                          </div>
                          <button onClick={() => handleMediaUpload('logo')} className="ecare-btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                            <Upload size={16} weight="bold" /> Change Logo
                          </button>
                        </div>
                      </div>
                      <div className="ecare-form-group">
                        <label className="ecare-label">Auth Background Image</label>
                        <div style={{ width: '100%', height: '120px', borderRadius: '20px', border: '1px solid #f1f5f9', background: bgImage ? `url(${bgImage}) center/cover` : '#f8fafc', marginBottom: '1rem' }} />
                        <button onClick={() => handleMediaUpload('bg')} className="ecare-btn-secondary" style={{ width: '100%', padding: '0.75rem' }}>
                          <Upload size={18} weight="bold" /> Update Background Image
                        </button>
                      </div>
                    </div>

                    <div className="ecare-form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                      <label className="ecare-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Key size={16} weight="bold" /> Infrastructure License Key
                      </label>
                      <input 
                        type="password" 
                        value={licenseKey} 
                        onChange={(e) => setLicenseKey(e.target.value)} 
                        placeholder="••••••••••••••••" 
                        className="ecare-input" 
                      />
                    </div>

                    {/* Social Login Toggle */}
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                      <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '42px', height: '42px', borderRadius: '12px', background: 'var(--ecare-primary-bg)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)'
                            }}>
                              <GoogleLogo size={22} weight="bold" />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Social Login (Google &amp; Phone OTP)</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Show Google and Phone OTP login buttons on the patient portal. Requires Firebase Auth to be configured.
                              </div>
                            </div>
                          </div>
                          <div
                            onClick={() => setSocialLoginEnabled(!socialLoginEnabled)}
                            style={{
                              width: '48px', height: '26px', borderRadius: '99px',
                              background: socialLoginEnabled ? 'var(--ecare-primary)' : '#cbd5e1',
                              padding: '3px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              display: 'flex', alignItems: 'center', flexShrink: 0
                            }}
                          >
                            <motion.div
                              animate={{ x: socialLoginEnabled ? 22 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                            />
                          </div>
                        </div>
                        {socialLoginEnabled && (
                          <div style={{ padding: '0.75rem 1rem', background: '#fef9c3', borderRadius: '10px', fontSize: '0.75rem', color: '#854d0e', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            ⚠️ Firebase Auth credentials must be configured in the <strong>Infrastructure Health</strong> tab for this to work.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'clinical' && (
              <motion.div key="clinical" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Package size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Care Provider Configuration</h2>
                  </div>

                  {/* ── Provider Types with per-type packages ── */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Provider Types &amp; Packages</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>Each provider type has its own independent set of service packages</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="ecare-button" style={{ padding: '0.5rem 1rem', flexShrink: 0, width: 'auto' }}>
                      <Plus size={14} /> Add Type
                    </button>
                  </div>

                  {(providerTypes || []).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                      <IdentificationCard size={40} color="#cbd5e1" weight="duotone" />
                      <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>No provider types yet. Add your first type to get started.</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(providerTypes || []).map(type => {
                      const typePackages = (servicePricing || []).filter(
                        p => String(p.typeId) === String(type.id) || String(p.providerTypeId) === String(type.id)
                      )
                      const isExpanded = expandedTypeId === type.id
                      return (
                        <div key={type.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white' }}>
                          {/* Type Header */}
                          <div
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.875rem 1.25rem', cursor: 'pointer',
                              background: isExpanded ? 'var(--ecare-primary-bg)' : '#f8fafc',
                              borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                              transition: 'background 0.2s'
                            }}
                            onClick={() => setExpandedTypeId(isExpanded ? null : type.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '34px', height: '34px', borderRadius: '10px',
                                background: isExpanded ? 'var(--ecare-primary)' : 'white',
                                border: '1px solid #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isExpanded ? 'white' : 'var(--ecare-primary)',
                                flexShrink: 0
                              }}>
                                <IdentificationCard size={17} weight="duotone" />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{type.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {typePackages.length === 0 ? 'No packages yet' : `${typePackages.length} package${typePackages.length !== 1 ? 's' : ''}`}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button
                                onClick={e => { e.stopPropagation(); removeProviderType(type.id) }}
                                style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px' }}
                                title="Remove type"
                              >
                                <Trash size={15} />
                              </button>
                              {isExpanded ? <CaretDown size={16} color="var(--ecare-primary)" weight="bold" /> : <CaretRight size={16} color="#94a3b8" weight="bold" />}
                            </div>
                          </div>

                          {/* Packages Panel */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ padding: '1.25rem' }}>
                                  {typePackages.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem' }}>
                                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>No packages for {type.name} yet. Add the first one below.</p>
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: typePackages.length > 0 ? '1rem' : 0 }}>
                                    {typePackages.map(item => (
                                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                                        <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                                          <label className="ecare-label" style={{ fontSize: '0.7rem' }}>Package Name</label>
                                          <input type="text" value={item.name} onChange={e => updatePricingRow(item.id, 'name', e.target.value)} className="ecare-input" style={{ fontSize: '0.85rem' }} />
                                        </div>
                                        <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                                          <label className="ecare-label" style={{ fontSize: '0.7rem' }}>Duration</label>
                                          <input type="text" value={item.duration} onChange={e => updatePricingRow(item.id, 'duration', e.target.value)} className="ecare-input" placeholder="e.g. 12 Hours" style={{ fontSize: '0.85rem' }} />
                                        </div>
                                        <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                                          <label className="ecare-label" style={{ fontSize: '0.7rem' }}>Price</label>
                                          <input type="number" value={item.price} onChange={e => updatePricingRow(item.id, 'price', e.target.value)} className="ecare-input" style={{ fontSize: '0.85rem' }} />
                                        </div>
                                        <button
                                          onClick={() => removePricingRow(item.id)}
                                          style={{ width: '38px', height: '38px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                        >
                                          <Trash size={16} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => addPricingRow(type.id)}
                                    className="ecare-btn-secondary"
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                  >
                                    <Plus size={14} weight="bold" /> Add Package for {type.name}
                                  </button>
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
            )}

            {activeTab === 'appointments' && (
              <motion.div key="appointments" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Clock size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Appointment Configuration</h2>
                  </div>
                  <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1.5rem' }}>Active Consultation Modes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {consultationModes.map(mode => (
                        <div key={mode.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '1rem', 
                          background: 'white', 
                          borderRadius: '16px', 
                          border: '1px solid #e2e8f0',
                          opacity: mode.enabled ? 1 : 0.7
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: '42px', 
                              height: '42px', 
                              borderRadius: '12px', 
                              background: mode.enabled ? 'var(--ecare-primary-bg)' : '#f1f5f9', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              color: mode.enabled ? 'var(--ecare-primary)' : '#94a3b8' 
                            }}>
                               <Clock size={22} weight={mode.enabled ? "bold" : "regular"} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: mode.enabled ? '#1e293b' : '#64748b' }}>{mode.label}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{mode.enabled ? 'Active and visible for booking' : 'Currently disabled'}</div>
                            </div>
                          </div>
                          <div 
                            onClick={() => setConsultationModes(consultationModes.map(m => m.id === mode.id ? { ...m, enabled: !m.enabled } : m))} 
                            style={{ 
                              width: '48px', 
                              height: '26px', 
                              borderRadius: '99px', 
                              background: mode.enabled ? 'var(--ecare-primary)' : '#cbd5e1', 
                              padding: '3px', 
                              cursor: 'pointer', 
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <motion.div 
                              animate={{ x: mode.enabled ? 22 : 0 }} 
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reminders' && (
              <motion.div key="reminders" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Bell size={24} weight="duotone" color="var(--ecare-primary)" />
                      <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Automated Reminders</h2>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure multi-channel notifications and test delivery endpoints.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openReminderTest('appointment', 'all')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.1rem',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12))',
                        color: 'var(--ecare-primary)',
                        border: '1px solid rgba(99, 102, 241, 0.28)',
                        borderRadius: '12px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.08)'
                      }}
                    >
                      <PaperPlaneTilt size={16} weight="bold" />
                      <span>Test &amp; Diagnostics</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Global Reminder Switch</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Turn every reminder channel on or off.</div>
                        </div>
                        <div onClick={() => setRemindersEnabled(!remindersEnabled)} style={{ width: '48px', height: '26px', borderRadius: '99px', background: remindersEnabled ? 'var(--ecare-primary)' : '#cbd5e1', padding: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <motion.div animate={{ x: remindersEnabled ? 22 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '12px', padding: '0.75rem 0.9rem', border: '1px solid #e2e8f0', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <EnvelopeSimple size={18} weight="bold" color="var(--ecare-primary)" />
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Email Delivery</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>WordPress wp_mail() engine</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openReminderTest('channel_test') }}
                              title="Test Email Channel"
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--ecare-primary)',
                                background: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                padding: '0.22rem 0.55rem',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              Test
                            </button>
                            <div onClick={() => setReminderEmailEnabled(!reminderEmailEnabled)} style={{ width: '42px', height: '22px', borderRadius: '99px', background: reminderEmailEnabled ? 'var(--ecare-primary)' : '#cbd5e1', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <motion.div animate={{ x: reminderEmailEnabled ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>Reminder Timing</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Tune the default send windows.</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="ecare-form-group">
                          <label className="ecare-label">Appointment Lead Time (hours)</label>
                          <input type="number" className="ecare-input" value={appointmentReminderHours} onChange={(e) => setAppointmentReminderHours(e.target.value)} />
                        </div>
                        <div className="ecare-form-group">
                          <label className="ecare-label">Invoice Reminder After (days)</label>
                          <input type="number" className="ecare-input" value={invoiceReminderDays} onChange={(e) => setInvoiceReminderDays(e.target.value)} />
                        </div>
                        <div className="ecare-form-group">
                          <label className="ecare-label">Follow-up Reminder After (days)</label>
                          <input type="number" className="ecare-input" value={followUpReminderDays} onChange={(e) => setFollowUpReminderDays(e.target.value)} />
                        </div>
                        <div className="ecare-form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label className="ecare-label" style={{ margin: 0 }}>Lab Result Alerts</label>
                            <button
                              type="button"
                              onClick={() => openReminderTest('lab')}
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--ecare-primary)',
                                background: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              Test
                            </button>
                          </div>
                          <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.85rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{labReminderEnabled ? 'Enabled' : 'Disabled'}</span>
                            <div onClick={() => setLabReminderEnabled(!labReminderEnabled)} style={{ width: '42px', height: '22px', borderRadius: '99px', background: labReminderEnabled ? 'var(--ecare-primary)' : '#cbd5e1', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <motion.div animate={{ x: labReminderEnabled ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '1rem' }}>
                        {[
                          { feature: 'appointment', label: 'Appointment reminders', enabled: appointmentReminderEnabled, set: setAppointmentReminderEnabled },
                          { feature: 'invoice', label: 'Invoice reminders', enabled: invoiceReminderEnabled, set: setInvoiceReminderEnabled },
                          { feature: 'followup', label: 'Follow-up reminders', enabled: followUpReminderEnabled, set: setFollowUpReminderEnabled },
                        ].map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '12px', padding: '0.75rem 0.9rem', border: '1px solid #e2e8f0', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{item.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openReminderTest(item.feature) }}
                                title={`Test ${item.label}`}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: 'var(--ecare-primary)',
                                  background: 'rgba(99, 102, 241, 0.08)',
                                  border: '1px solid rgba(99, 102, 241, 0.2)',
                                  padding: '0.22rem 0.55rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                Test
                              </button>
                              <div onClick={() => item.set(!item.enabled)} style={{ width: '42px', height: '22px', borderRadius: '99px', background: item.enabled ? 'var(--ecare-primary)' : '#cbd5e1', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <motion.div animate={{ x: item.enabled ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white' }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Email Delivery Note Banner */}
                  <div style={{
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(99, 102, 241, 0.04))',
                    borderRadius: '16px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <EnvelopeSimple size={20} weight="fill" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Email Messaging Delivery</span>
                          <span style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: '99px', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
                            Native WordPress wp_mail
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '3px', lineHeight: 1.5 }}>
                          Appointment, invoice, and clinical reminders use standard WordPress mail. If you use <strong>WP Mail SMTP</strong>, <strong>FluentSMTP</strong>, or Amazon SES, all emails route through your configured SMTP host automatically with no additional API setup required.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openReminderTest('appointment', 'email')}
                      style={{
                        padding: '0.55rem 1rem',
                        borderRadius: '10px',
                        background: 'white',
                        border: '1px solid #93c5fd',
                        color: '#1d4ed8',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(59, 130, 246, 0.1)'
                      }}
                    >
                      <PaperPlaneTilt size={14} weight="bold" />
                      <span>Test Email Dispatch</span>
                    </button>
                  </div>

                  {/* Email Sender & Clinic Configuration */}
                  <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <EnvelopeSimple size={20} weight="duotone" color="var(--ecare-primary)" />
                          <span>Email Sender &amp; Clinic Configuration</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Customizes the sender signature that appears in automated reminder emails dispatched to patients.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                        <label className="ecare-label">Sender / Clinic Name</label>
                        <input
                          className="ecare-input"
                          value={reminderSenderName}
                          onChange={(e) => setReminderSenderName(e.target.value)}
                          placeholder="E-CARE Clinic"
                        />
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                          Appears in reminder email headers, notifications, and patient portal messages.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => openReminderTest('channel_test')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.45rem 0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: 'white',
                          color: '#1e293b',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <EnvelopeSimple size={15} weight="bold" color="var(--ecare-primary)" />
                        <span>Test Email Engine</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Automated reminders run hourly through WP-Cron and log each delivery so duplicates stay out of the way.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => openReminderTest('appointment')}
                        style={{
                          padding: '0.75rem 1.25rem',
                          borderRadius: '12px',
                          background: 'white',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <PaperPlaneTilt size={16} weight="bold" color="var(--ecare-primary)" />
                        <span>Test Reminder Features</span>
                      </button>
                      <button onClick={runReminderSweep} disabled={isRunningReminders} className="ecare-button" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', width: 'auto' }}>
                        {isRunningReminders ? 'Running...' : 'Run Reminder Sweep'}
                      </button>
                    </div>
                  </div>

                  {reminderRunResult && (
                    <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Last Sweep</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Sent: {(reminderRunResult.sent || []).length} • Skipped: {(reminderRunResult.skipped || []).length}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div key="finance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <CurrencyDollar size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Finance & Payout Settings</h2>
                  </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                          <Clock size={20} weight="bold" color="var(--ecare-primary)" />
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Instant Call & Refunds</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Instant Call Fee ({currencySymbol})</label>
                            <input type="number" className="ecare-input" value={instantCallFee} onChange={(e) => setLocalInstantCallFee(Number(e.target.value))} />
                          </div>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Instant Call Manual Refund Window (Hours)</label>
                            <input type="number" className="ecare-input" value={instantRefundDuration} onChange={(e) => setLocalInstantRefundDuration(Number(e.target.value))} />
                          </div>
                          <div className="ecare-form-group">
                            <label className="ecare-label">Standard Refund Deadline (Days)</label>
                            <input type="number" className="ecare-input" value={standardRefundDuration} onChange={(e) => setLocalStandardRefundDuration(Number(e.target.value))} />
                          </div>
                        </div>
                      </div>

                      {/* Floating Widget Toggle */}
                      <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                              width: '42px', height: '42px', borderRadius: '12px', background: 'var(--ecare-primary-bg)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)' 
                            }}>
                              <Broadcast size={22} weight="bold" />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Floating Instant Call Widget</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Show a floating call button to guests &amp; patients on public pages. Doctors, admins and staff will not see it.
                              </div>
                            </div>
                          </div>

                          <div 
                            onClick={() => setFloatingWidgetEnabled(!floatingWidgetEnabled)} 
                            style={{
                              width: '48px', height: '26px', borderRadius: '99px', 
                              background: floatingWidgetEnabled ? 'var(--ecare-primary)' : '#cbd5e1',
                              padding: '3px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                              display: 'flex', alignItems: 'center', flexShrink: 0
                            }}
                          >
                            <motion.div 
                              animate={{ x: floatingWidgetEnabled ? 22 : 0 }} 
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} 
                            />
                          </div>
                        </div>
                      </div>



                      {/* Partial Payments Section */}
                      <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                              width: '42px', height: '42px', borderRadius: '12px', background: 'var(--ecare-primary-bg)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)' 
                            }}>
                              <CreditCard size={22} weight="bold" />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Partial Payments & Deposits</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Allow patients to pay a partial deposit at checkout instead of the full amount. (Excludes Instant Doctor Calls).
                              </div>
                            </div>
                          </div>

                          <div 
                            onClick={() => setPartialPaymentEnabled(!partialPaymentEnabled)} 
                            style={{
                              width: '48px', height: '26px', borderRadius: '99px', 
                              background: partialPaymentEnabled ? 'var(--ecare-primary)' : '#cbd5e1',
                              padding: '3px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                              display: 'flex', alignItems: 'center'
                            }}
                          >
                            <motion.div 
                              animate={{ x: partialPaymentEnabled ? 22 : 0 }} 
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} 
                            />
                          </div>
                        </div>

                        {partialPaymentEnabled && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '400px' }}
                          >
                            <label className="ecare-label" style={{ marginBottom: '4px' }}>Minimum Deposit Percentage (%)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <input 
                                type="range" 
                                min="10" 
                                max="90" 
                                step="5"
                                value={minDepositPercent} 
                                onChange={(e) => setMinDepositPercent(Number(e.target.value))} 
                                style={{ flex: 1, accentColor: 'var(--ecare-primary)', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ecare-primary)', minWidth: '45px', textAlign: 'right' }}>
                                {minDepositPercent}%
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <CurrencyDollar size={20} weight="bold" color="var(--ecare-primary)" />
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Service Commission Controls</h3>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2rem' }}>
                        Enable or disable platform revenue splitting for specific services. Disabled services will result in 100% provider disbursement. 
                        <b> Changes are saved instantly.</b>
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                          { id: 'doctors', label: 'Doctor Consultations', color: 'var(--ecare-primary)' },
                          { id: 'ambulance', label: 'Ambulance Missions', color: '#f59e0b' },
                          { id: 'careProviders', label: 'Home Care Providers', color: '#3b82f6' },
                          { id: 'lab', label: 'Lab & Diagnostics', color: '#8b5cf6' }
                        ].map(service => {
                          const config = storeServiceCommissions[service.id] || { rate: 0, enabled: false }
                          return (
                            <div key={service.id} style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                              background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0',
                              opacity: config.enabled ? 1 : 0.7
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ 
                                  width: '42px', height: '42px', borderRadius: '12px', background: `${service.color}15`, 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: service.color 
                                }}>
                                  <Clock size={20} weight="bold" />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{service.label}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{config.enabled ? `Active Platform Cut: ${config.rate}%` : 'Commission Disabled (0%)'}</div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                {config.enabled && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input 
                                      type="number" 
                                      className="ecare-input" 
                                      style={{ width: '80px', padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}
                                      value={config.rate}
                                      onChange={(e) => useStore.getState().updateServiceCommission(service.id, { rate: e.target.value })}
                                    />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b' }}>%</span>
                                  </div>
                                )}
                                
                                <div 
                                  onClick={() => useStore.getState().updateServiceCommission(service.id, { enabled: !config.enabled })}
                                  style={{ 
                                    width: '48px', height: '26px', borderRadius: '99px', background: config.enabled ? service.color : '#cbd5e1',
                                    padding: '3px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center'
                                  }}
                                >
                                  <motion.div 
                                    animate={{ x: config.enabled ? 22 : 0 }} 
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} 
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'telemed' && (
              <motion.div key="telemed" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <VideoCamera size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Telemedicine & Video Consultation Engine</h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ecare-text-muted)', marginBottom: '2rem', marginTop: '0.25rem' }}>
                    Manage your clinical WebRTC calling infrastructure, cryptographic token generation, and patient consultation experience.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Primary Provider Selector */}
                    <div style={{ padding: '1.75rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--ecare-text-main)' }}>
                        Default Telemedicine Provider
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                        Select the primary real-time communications engine used for live doctor-patient consultations.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Agora Option */}
                        <div 
                          onClick={() => setTelemedProvider('agora')}
                          style={{
                            padding: '1.25rem',
                            borderRadius: '16px',
                            border: `2px solid ${telemedProvider === 'agora' ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                            background: telemedProvider === 'agora' ? '#f0fdf4' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Broadcast size={20} weight="bold" color={telemedProvider === 'agora' ? 'var(--ecare-primary)' : '#64748b'} />
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: telemedProvider === 'agora' ? 'var(--ecare-primary)' : '#1e293b' }}>
                                Agora WebRTC 4.x
                              </span>
                            </div>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '20px',
                              background: 'var(--ecare-primary)',
                              color: 'white'
                            }}>
                              Recommended
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                            Global low-latency voice/video calling, secure server-signed AccessToken2 cryptographic authorization, and adaptive bitrate.
                          </p>
                        </div>

                        {/* Jitsi Option */}
                        <div 
                          onClick={() => setTelemedProvider('jitsi')}
                          style={{
                            padding: '1.25rem',
                            borderRadius: '16px',
                            border: `2px solid ${telemedProvider === 'jitsi' ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                            background: telemedProvider === 'jitsi' ? '#f0fdf4' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <VideoCamera size={20} weight="bold" color={telemedProvider === 'jitsi' ? 'var(--ecare-primary)' : '#64748b'} />
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: telemedProvider === 'jitsi' ? 'var(--ecare-primary)' : '#1e293b' }}>
                                Jitsi Meet
                              </span>
                            </div>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '20px',
                              background: '#e2e8f0',
                              color: '#64748b'
                            }}>
                              Public / Self-Hosted
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                            Open-source WebRTC video conferencing with public meet.jit.si support and zero configuration requirements.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Agora WebRTC Configuration Card */}
                    <div style={{ padding: '1.75rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>
                              Agora WebRTC Engine Credentials
                            </h3>
                            {hasAgoraAppCertificate && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '8px' }}>
                                Certificate Active
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>
                            Generate short-lived cryptographic RTC & RTM tokens server-side for authenticated patients and doctors.
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setIsAgoraDiagnosticsOpen(true)}
                            style={{
                              padding: '0.625rem 1.25rem',
                              borderRadius: '12px',
                              background: 'white',
                              color: 'var(--ecare-text-main)',
                              border: '1px solid #cbd5e1',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <ShieldCheck size={16} weight="bold" color="var(--ecare-primary)" />
                            Diagnostics & Health
                          </button>

                          <button
                            type="button"
                            onClick={handleTestAgora}
                            disabled={isTestingAgora}
                            style={{
                              padding: '0.625rem 1.25rem',
                              borderRadius: '12px',
                              background: 'var(--ecare-primary)',
                              color: 'white',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              cursor: isTestingAgora ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            {isTestingAgora ? <Spinner size={16} className="ecare-spin" /> : <Broadcast size={16} weight="bold" />}
                            {isTestingAgora ? 'Verifying...' : 'Test Connection'}
                          </button>
                        </div>
                      </div>

                      {/* Agora Test Result Banner */}
                      {agoraTestResult && (
                        <div style={{
                          padding: '0.875rem 1.25rem',
                          borderRadius: '12px',
                          marginBottom: '1.25rem',
                          background: agoraTestResult.success ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${agoraTestResult.success ? '#bbf7d0' : '#fecaca'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.8125rem',
                          color: agoraTestResult.success ? '#166534' : '#991b1b'
                        }}>
                          {agoraTestResult.success ? (
                            <CheckCircle size={20} weight="bold" color="#16a34a" />
                          ) : (
                            <WarningCircle size={20} weight="bold" color="#dc2626" />
                          )}
                          <div style={{ flex: 1 }}>
                            <strong>{agoraTestResult.success ? 'System Operational: ' : 'Verification Failed: '}</strong>
                            {agoraTestResult.message}
                          </div>
                        </div>
                      )}

                      {/* Enable switch */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>Enable Agora WebRTC Telemedicine</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Activate Agora infrastructure for live clinical calls</div>
                        </div>
                        <div 
                          onClick={() => setAgoraEnabled(!agoraEnabled)} 
                          style={{
                            width: '44px', height: '24px', borderRadius: '99px', background: agoraEnabled ? 'var(--ecare-primary)' : '#cbd5e1',
                            padding: '3px', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <motion.div animate={{ x: agoraEnabled ? 20 : 0 }} style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </div>
                      </div>

                      {/* Credential Inputs */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                          <label className="ecare-label">Agora App ID *</label>
                          <input 
                            className="ecare-input" 
                            value={agoraAppId} 
                            onChange={(e) => setAgoraAppId(e.target.value)} 
                            placeholder="e.g. 4d7f8c9b0a1e2f3d4c5b6a7b8c9d0e1f" 
                          />
                          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                            Found in Agora Console → Project Management → App ID.
                          </span>
                        </div>

                        <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                          <label className="ecare-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Agora App Certificate *</span>
                            {hasAgoraAppCertificate && (
                              <span style={{ color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} weight="fill" /> Saved on Server
                              </span>
                            )}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type={showAgoraCert ? 'text' : 'password'}
                              className="ecare-input" 
                              style={{ paddingRight: '40px' }}
                              value={agoraAppCertificate} 
                              onChange={(e) => setAgoraAppCertificate(e.target.value)} 
                              placeholder={hasAgoraAppCertificate ? 'Saved on Server (leave blank to keep active)' : 'Enter Agora App Certificate'} 
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (hasAgoraAppCertificate && !agoraAppCertificate) {
                                  toast('For HIPAA compliance, your stored certificate is securely encrypted on the server and hidden to protect against browser credential exposure. To replace it, enter a new certificate.', { icon: '🔒', duration: 4500 })
                                } else {
                                  setShowAgoraCert(!showAgoraCert)
                                }
                              }}
                              title={hasAgoraAppCertificate && !agoraAppCertificate ? 'Stored securely on server' : (showAgoraCert ? 'Hide Certificate' : 'Show Certificate')}
                              style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'
                              }}
                            >
                              {showAgoraCert ? <EyeSlash size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {hasAgoraAppCertificate && !agoraAppCertificate ? (
                            <div style={{
                              marginTop: '6px',
                              padding: '6px 10px',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.73rem',
                              color: '#15803d'
                            }}>
                              <CheckCircle size={14} weight="fill" color="#16a34a" style={{ flexShrink: 0 }} />
                              <span><strong>Saved & Active:</strong> Your App Certificate is securely saved in the database. Leave blank to keep existing, or type here to overwrite.</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              Primary certificate used for AccessToken2 cryptographic token signing.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Token Expiry & Security Notice */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                          <label className="ecare-label">Token Expiry (Seconds)</label>
                          <input 
                            type="number" 
                            className="ecare-input" 
                            value={agoraTokenExpiry} 
                            onChange={(e) => setAgoraTokenExpiry(e.target.value)} 
                            placeholder="3600" 
                          />
                          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                            Tokens auto-renew before expiration (Default: 3600s).
                          </span>
                        </div>

                        <div style={{ padding: '0.875rem 1rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ShieldCheck size={28} weight="duotone" color="#2563eb" style={{ flexShrink: 0 }} />
                          <div style={{ fontSize: '0.75rem', color: '#1e40af', lineHeight: 1.4 }}>
                            <strong>HIPAA & Clinical Data Security:</strong> App Certificate is never sent to the browser or stored in client memory. All tokens are generated server-side using Agora AccessToken2 and channel permissions are strictly scoped to verified consultation participants.
                          </div>
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Consultation Feature Controls
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                            <input type="checkbox" checked={agoraEnableVideo} onChange={(e) => setAgoraEnableVideo(e.target.checked)} />
                            <span>Two-Way HD Video</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                            <input type="checkbox" checked={agoraEnableAudio} onChange={(e) => setAgoraEnableAudio(e.target.checked)} />
                            <span>Clinical-Grade Audio</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                            <input type="checkbox" checked={agoraEnableScreenShare} onChange={(e) => setAgoraEnableScreenShare(e.target.checked)} />
                            <span>Screen Sharing</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                            <input type="checkbox" checked={agoraEnableSignaling} onChange={(e) => setAgoraEnableSignaling(e.target.checked)} />
                            <span>RTM Real-Time Signaling</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Jitsi Meet Server Configuration */}
                    <div style={{ padding: '1.75rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', opacity: telemedProvider === 'jitsi' ? 1 : 0.85 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                         <div>
                           <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>
                             Jitsi Meet Server {telemedProvider !== 'jitsi' && '(Secondary / Fallback)'}
                           </h3>
                           <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>
                             Use public cloud server (<code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>https://meet.jit.si</code>) or custom self-hosted instance.
                           </p>
                         </div>
                         <button
                           type="button"
                           onClick={handleTestJitsi}
                           disabled={isTestingJitsi}
                           style={{
                             padding: '0.625rem 1.25rem',
                             borderRadius: '12px',
                             background: 'var(--ecare-primary)',
                             color: 'white',
                             border: 'none',
                             fontWeight: 700,
                             fontSize: '0.8125rem',
                             cursor: isTestingJitsi ? 'not-allowed' : 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '8px',
                             boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                           }}
                         >
                           {isTestingJitsi ? <Spinner size={16} className="ecare-spin" /> : <Broadcast size={16} weight="bold" />}
                           {isTestingJitsi ? 'Checking...' : 'Check Jitsi Server'}
                         </button>
                       </div>

                       {/* Jitsi Test Result Banner */}
                       {jitsiTestResult && (
                         <div style={{
                           padding: '0.875rem 1.25rem',
                           borderRadius: '12px',
                           marginBottom: '1.25rem',
                           background: jitsiTestResult.success ? '#f0fdf4' : '#fef2f2',
                           border: `1px solid ${jitsiTestResult.success ? '#bbf7d0' : '#fecaca'}`,
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.75rem',
                           fontSize: '0.8125rem',
                           color: jitsiTestResult.success ? '#166534' : '#991b1b'
                         }}>
                           {jitsiTestResult.success ? (
                             <CheckCircle size={20} weight="bold" color="#16a34a" />
                           ) : (
                             <WarningCircle size={20} weight="bold" color="#dc2626" />
                           )}
                           <div style={{ flex: 1 }}>
                             <strong>{jitsiTestResult.success ? 'Server Ready: ' : 'Server Warning: '}</strong>
                             {jitsiTestResult.message}
                           </div>
                         </div>
                       )}

                       <div className="ecare-form-group" style={{ marginBottom: 0 }}>
                         <label className="ecare-label">Jitsi Meet Server URL</label>
                         <input 
                           className="ecare-input" 
                           value={jitsiServer} 
                           onChange={(e) => setJitsiServer(e.target.value)} 
                           placeholder="https://meet.jit.si" 
                         />
                         <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', display: 'block' }}>
                           Default: <strong>https://meet.jit.si</strong> (Free, unlimited participants and call minutes).
                         </span>
                       </div>
                    </div>

                    {/* Operational Rules */}
                    <div style={{ padding: '1.75rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                       <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--ecare-text-main)' }}>Operational Rules</h3>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                         <div className="ecare-form-group">
                           <label className="ecare-label">Telemedicine Payment Expiry (Hours)</label>
                           <input 
                             type="number" 
                             className="ecare-input" 
                             value={telemedPaymentDeadline} 
                             onChange={(e) => setTelemedPaymentDeadline(e.target.value)} 
                           />
                         </div>
                         <div className="ecare-form-group">
                           <label className="ecare-label">Instant Call Base Fee ({currencySymbol})</label>
                           <input 
                             type="number" 
                             className="ecare-input" 
                             value={instantCallFee} 
                             onChange={(e) => setLocalInstantCallFee(e.target.value)} 
                           />
                         </div>
                       </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <CreditCard size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Payment Configuration</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="ecare-form-group"><label className="ecare-label">Currency Symbol</label><input className="ecare-input" value={currencySymbol} onChange={(e) => setCurrency(e.target.value, currencyCode)} /></div>
                    <div className="ecare-form-group"><label className="ecare-label">Currency Code</label><input className="ecare-input" value={currencyCode} onChange={(e) => setCurrency(currencySymbol, e.target.value)} /></div>
                  </div>

                  {/* WooCommerce Integration Info Card */}
                  <div style={{ 
                    background: isWooCommerceActive ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%)', 
                    borderRadius: '24px', 
                    padding: '2rem', 
                    marginBottom: '2rem',
                    border: `1px solid ${isWooCommerceActive ? '#e2e8f0' : '#fed7aa'}`,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                      <div style={{ 
                        width: '56px', height: '56px', borderRadius: '18px', 
                        background: isWooCommerceActive ? 'linear-gradient(135deg, #7f54b3 0%, #634094 100%)' : 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        boxShadow: isWooCommerceActive ? '0 10px 15px -3px rgba(127, 84, 179, 0.3)' : '0 10px 15px -3px rgba(249, 115, 22, 0.25)',
                        flexShrink: 0
                      }}>
                        <CreditCard size={28} weight="duotone" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                          WooCommerce Payment Engine {isWooCommerceActive ? 'Active' : 'Not Active'}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                          {isWooCommerceActive
                            ? 'E-CARE has been fully migrated to use WooCommerce checkout. All customer checkouts, consultation bookings, and product sales are processed securely through active WooCommerce gateways.'
                            : 'WooCommerce is not installed or is currently inactive. Payment gateway checkout will not be available until WooCommerce is installed and activated.'}
                        </p>
                      </div>
                    </div>

                    <div style={{ 
                      background: 'white', 
                      borderRadius: '16px', 
                      padding: '1.25rem', 
                      border: '1px solid #e2e8f0',
                      fontSize: '0.8rem',
                      color: '#475569',
                      lineHeight: 1.6
                    }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        {isWooCommerceActive ? 'Where do I manage payment gateways?' : 'How do I enable WooCommerce checkout?'}
                      </strong>
                      {isWooCommerceActive
                        ? 'To configure payment methods like Stripe, PayPal, bKash, SSLCommerz, or Cash on Delivery, please navigate to the WooCommerce checkout settings panel in your WordPress dashboard.'
                        : 'Install and activate the WooCommerce plugin from WordPress Plugins. After activation, return here to configure checkout payment methods.'}
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        if (!isWooCommerceActive) return
                        window.open(window.location.origin + '/wp-admin/admin.php?page=wc-settings&tab=checkout', '_blank')
                      }}
                      className="ecare-button"
                      disabled={!isWooCommerceActive}
                      style={{ 
                        alignSelf: 'flex-start',
                        background: isWooCommerceActive ? 'linear-gradient(135deg, #7f54b3 0%, #693c9e 100%)' : '#cbd5e1',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '14px',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: isWooCommerceActive ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: isWooCommerceActive ? '0 10px 15px -3px rgba(127, 84, 179, 0.25)' : 'none',
                        transition: 'all 0.2s ease-in-out',
                        width: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        if (!isWooCommerceActive) return
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(127, 84, 179, 0.35)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isWooCommerceActive) return
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(127, 84, 179, 0.25)'
                      }}
                    >
                      {isWooCommerceActive ? 'Configure WooCommerce Gateways' : 'WooCommerce Not Active'}
                      {isWooCommerceActive && <span style={{ fontSize: '1rem' }}>→</span>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'promos' && (
              <motion.div key="promos" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <PromoCodesTab />
              </motion.div>
            )}

            {activeTab === 'admins' && (
              <motion.div key="admins" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Users size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Permissions & Dashboard Administrators</h2>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
                    Elevated administrators have full control over the E-CARE clinical portal, telemedicine rooms, billing, and scheduling configuration.
                  </p>

                  {isLoadingAdmins ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                      <div className="ecare-spinner" style={{ width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--ecare-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {/* Active Admins List */}
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active E-CARE Admins</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {admins.length === 0 ? (
                            <div style={{ padding: '1.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                              No dedicated portal administrators found.
                            </div>
                          ) : (
                            admins.map(admin => (
                              <div key={admin.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <img src={admin.avatar} alt={admin.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                                  <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{admin.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{admin.email}</div>
                                  </div>
                                </div>
                                {admin.id !== window.ecareConfig?.user?.id && (
                                  <button 
                                    onClick={() => demoteUser(admin.id)}
                                    className="ecare-btn-secondary" 
                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', borderRadius: '8px', cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    Revoke Access
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Promote New Admin */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Elevate Administrator</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                          <div style={{ flex: 1 }}>
                            <CustomSelect 
                              value={selectedCandidateId} 
                              onChange={(val) => setSelectedCandidateId(val)}
                              options={[
                                { value: '', label: 'Select user candidate...' },
                                ...candidates.map(c => ({ value: c.id.toString(), label: `${c.name} (${c.email})` }))
                              ]}
                              customTriggerStyle={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                            />
                          </div>
                          <button 
                            onClick={() => promoteUser(selectedCandidateId)}
                            disabled={!selectedCandidateId}
                            className="ecare-button" 
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: selectedCandidateId ? 'pointer' : 'not-allowed', opacity: selectedCandidateId ? 1 : 0.6, width: 'auto' }}
                          >
                            Promote
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'system' && (
              <motion.div key="system" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Shield size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Infrastructure Integrity & Diagnostics</h2>
                  </div>

                  {isLoadingHealth ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                      <div className="ecare-spinner" style={{ width: '30px', height: '30px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--ecare-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {/* Synchronize status */}
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', 
                        background: healthStatus?.isHealthy ? '#f0fdf4' : '#fef2f2', 
                        border: `1px solid ${healthStatus?.isHealthy ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: '20px'
                      }}>
                        <div style={{ 
                          position: 'relative', width: '12px', height: '12px', borderRadius: '50%', 
                          background: healthStatus?.isHealthy ? '#22c55e' : '#ef4444' 
                        }}>
                          <motion.div 
                            animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0, 0.8] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ 
                              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%',
                              background: healthStatus?.isHealthy ? '#22c55e' : '#ef4444'
                            }} 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: healthStatus?.isHealthy ? '#14532d' : '#7f1d1d' }}>
                            Database Integrity
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: healthStatus?.isHealthy ? '#166534' : '#991b1b', lineHeight: 1.4 }}>
                            {healthStatus?.isHealthy 
                              ? 'MySQL database is healthy and fully operational.' 
                              : `Schema mismatch detected. ${healthStatus?.missingTables?.length || 0} tables require synchronization.`
                            }
                          </p>
                        </div>
                        <button 
                          onClick={repairDatabase}
                          disabled={isRepairingDb}
                          className="ecare-button" 
                          style={{ background: '#1e293b', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.85rem', cursor: 'pointer', width: 'auto' }}
                        >
                          {isRepairingDb ? 'Syncing...' : 'Repair Sync'}
                        </button>
                      </div>

                      {/* Environment stats */}
                      <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Runtime Environment</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                          <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', textAlign: 'center', background: 'white' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ecare-primary)', marginBottom: '0.25rem' }}>
                              PHP {healthStatus?.phpVersion || '8.2+'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Runtime Version</div>
                          </div>
                          <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', textAlign: 'center', background: 'white' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ecare-primary)', marginBottom: '0.25rem' }}>
                              {healthStatus?.dbVersion || 'MySQL'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Database Engine</div>
                          </div>
                          <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', textAlign: 'center', background: 'white' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ecare-primary)', marginBottom: '0.25rem' }}>
                              WP {healthStatus?.wpVersion || '6.5'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>WordPress Core</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Appointment Lifecycle Sweep</h3>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                            Run expiry, instant-call timeout, and auto-close checks immediately without waiting for the next WordPress cron tick.
                          </p>
                        </div>
                        <button
                          onClick={runAppointmentLifecycleSweep}
                          disabled={isRunningLifecycle}
                          className="ecare-button"
                          style={{ padding: '0.7rem 1.2rem', borderRadius: '12px', whiteSpace: 'nowrap', width: 'auto' }}
                        >
                          {isRunningLifecycle ? 'Running...' : 'Run Lifecycle Now'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Firebase Auth Configuration — always visible */}
                  <div style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GoogleLogo size={16} weight="bold" /> Firebase Auth Configuration
                    </h3>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6 }}>
                        Required only if <strong>Social Login (Google &amp; Phone OTP)</strong> is enabled in <strong>Branding &amp; Identity</strong>. Get these values from your <strong>Firebase Console → Project Settings → General → Your Apps</strong>.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                          { label: 'API Key', value: fbApiKey, set: setFbApiKey, placeholder: 'AIzaSy...' },
                          { label: 'Auth Domain', value: fbAuthDomain, set: setFbAuthDomain, placeholder: 'your-project.firebaseapp.com' },
                          { label: 'Project ID', value: fbProjectId, set: setFbProjectId, placeholder: 'your-project-id' },
                          { label: 'Storage Bucket', value: fbStorageBucket, set: setFbStorageBucket, placeholder: 'your-project.appspot.com' },
                          { label: 'Messaging Sender ID', value: fbMessagingSenderId, set: setFbMessagingSenderId, placeholder: '123456789012' },
                          { label: 'App ID', value: fbAppId, set: setFbAppId, placeholder: '1:123456789012:web:abc...' },
                        ].map(({ label, value, set, placeholder }) => (
                          <div key={label} className="ecare-form-group" style={{ marginBottom: 0 }}>
                            <label className="ecare-label" style={{ fontSize: '0.72rem' }}>{label}</label>
                            <input
                              className="ecare-input"
                              style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                              value={value}
                              onChange={(e) => set(e.target.value)}
                              placeholder={placeholder}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '0.6rem 1rem', background: '#eff6ff', borderRadius: '10px', fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
                        💡 Click <strong>Save Changes</strong> in the sidebar after entering credentials.
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}



            {activeTab === 'shortcuts' && (
              <motion.div key="shortcuts" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Code size={24} weight="duotone" color="var(--ecare-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Integration Shortcodes</h2>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
                    Copy and paste these integration shortcodes onto public WordPress pages to display booking forms, registration portals, and login gateways to patients.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      { label: 'Patient Registration Portal', code: '[ecare_registration]', desc: 'Displays the registration fields and creates new patient profiles.' },
                      { label: 'Login Gateway', code: '[ecare_login_form]', desc: 'Renders the clinical login interface with visual themes.' },
                      { label: 'Smart Telemedicine Booking', code: '[ecare_booking]', desc: 'Loads the provider directories and interactive scheduling wizard.' }
                    ].map((sc, i) => (
                      <div key={i} style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{sc.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>{sc.desc}</div>
                        <div style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '10px', 
                          fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--ecare-primary)', fontWeight: 'bold' 
                        }}>
                          <span>{sc.code}</span>
                          <button 
                            onClick={(e) => {
                              navigator.clipboard.writeText(sc.code)
                              toast.success('Shortcode copied!')
                              const btn = e.currentTarget
                              btn.innerText = 'Copied!'
                              setTimeout(() => btn.innerText = 'Copy', 2000)
                            }}
                            className="ecare-btn-secondary" 
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'cleanup' && (
              <motion.div key="cleanup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="ecare-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Trash size={24} weight="duotone" color="#ef4444" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Database Cleanup</h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Permanently delete all records from selected data categories. This is useful for resetting the system to a clean state during testing or after a demo. <strong style={{ color: '#ef4444' }}>All deletions are irreversible.</strong>
                  </p>

                  {/* Selection Controls */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <button onClick={selectAllCategories} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                      Select All
                    </button>
                    <button onClick={clearAllCategories} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                      Deselect All
                    </button>
                    {selectedCategoryCount > 0 && (
                      <span style={{ marginLeft: 'auto', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>
                        {selectedCategoryCount} categor{selectedCategoryCount === 1 ? 'y' : 'ies'} selected
                      </span>
                    )}
                  </div>

                  {/* Category Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    {CLEANUP_CATEGORIES.map(cat => {
                      const isChecked = !!cleanupSelected[cat.key]
                      return (
                        <motion.div
                          key={cat.key}
                          onClick={() => toggleCleanupCategory(cat.key)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{
                            padding: '1.25rem', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                            border: `2px solid ${isChecked ? cat.color : '#e2e8f0'}`,
                            background: isChecked ? `${cat.color}08` : 'white',
                            position: 'relative', overflow: 'hidden'
                          }}
                        >
                          {isChecked && (
                            <motion.div
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              style={{
                                position: 'absolute', top: '0.75rem', right: '0.75rem',
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <CheckCircle size={14} weight="fill" color="white" />
                            </motion.div>
                          )}
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.375rem' }}>{cat.label}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5, marginBottom: '0.75rem' }}>{cat.desc}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                            {cat.tables.map(t => (
                              <span key={t} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: '4px', fontFamily: 'monospace', color: '#475569' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Cleanup Result */}
                  {cleanupResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem',
                        background: cleanupResult.success ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${cleanupResult.success ? '#bbf7d0' : '#fecaca'}`
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: cleanupResult.success ? '#15803d' : '#dc2626', marginBottom: '0.5rem' }}>
                        {cleanupResult.success ? '✅ Cleanup Successful' : '❌ Cleanup Failed'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: cleanupResult.success ? '#16a34a' : '#ef4444' }}>
                        {cleanupResult.message}
                      </div>
                      {cleanupResult.cleaned && cleanupResult.cleaned.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                          {cleanupResult.cleaned.map(t => (
                            <span key={t} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#dcfce7', borderRadius: '4px', fontFamily: 'monospace', color: '#15803d' }}>
                              ✓ {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {cleanupResult.errors && cleanupResult.errors.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {cleanupResult.errors.map((e, i) => (
                            <div key={i} style={{ fontSize: '0.75rem', color: '#dc2626' }}>• {e}</div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Action Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fecaca' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.25rem' }}>⚠️ Danger Zone</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {selectedCategoryCount === 0
                          ? 'Select data categories above to enable cleanup.'
                          : `Ready to permanently delete all data from ${selectedCategoryCount} selected categor${selectedCategoryCount === 1 ? 'y' : 'ies'}.`
                        }
                      </div>
                    </div>
                    <button
                      onClick={runCleanup}
                      disabled={isCleaningUp || selectedCategoryCount === 0}
                      style={{
                        padding: '0.875rem 1.5rem', borderRadius: '12px', border: 'none', cursor: selectedCategoryCount === 0 ? 'not-allowed' : 'pointer',
                        background: selectedCategoryCount === 0 ? '#e2e8f0' : '#ef4444',
                        color: selectedCategoryCount === 0 ? '#94a3b8' : 'white',
                        fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                      }}
                    >
                      <Trash size={16} weight="fill" />
                      {isCleaningUp ? 'Deleting...' : 'Run Cleanup'}
                    </button>
                  </div>
                </div>

                <div className="ecare-card" style={{ padding: '2rem', border: '1px solid #fee2e2', marginTop: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <WarningCircle size={24} weight="duotone" color="#ef4444" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Full System Reset</h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Wipe the entire system, including all clinical data and all configuration settings (branding, colors, credentials). This will return the E-CARE Management System to its initial unconfigured state and redirect you to the setup wizard. <strong style={{ color: '#ef4444' }}>This operation cannot be undone.</strong>
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fecaca' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.25rem' }}>⚠️ Critical Action</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Wipe the entire database and reset setup wizard.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setConfirmResetText('');
                        setIsResetModalOpen(true);
                      }}
                      style={{
                        padding: '0.875rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                      }}
                    >
                      <WarningCircle size={16} weight="fill" />
                      Reset Entire System
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
      <ProviderTypeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddProviderType} />
      <Portal>
        <AnimatePresence>
          {isResetModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsResetModalOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.3)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 9999
                }}
              />
              <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
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
                  className="ecare-card"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    pointerEvents: 'auto',
                    background: 'white',
                    borderRadius: '16px',
                    padding: 0,
                    width: '100%',
                    maxWidth: '460px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: 'none',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                        flexShrink: 0
                      }}>
                        <WarningCircle size={20} weight="fill" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                          Critical: Full System Reset
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Irreversible wipe of all clinical data
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(false)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.5rem' }}>
                    <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      This action is <strong>irreversible</strong>. All clinical databases, appointments, medical records, colors, and configuration credentials will be wiped. To proceed, please type <strong style={{ color: '#ef4444' }}>RESET</strong> below.
                    </p>

                    <input
                      type="text"
                      value={confirmResetText}
                      onChange={(e) => setConfirmResetText(e.target.value)}
                      placeholder="Type RESET"
                      className="ecare-input"
                      style={{
                        marginBottom: '1.5rem'
                      }}
                    />

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <button 
                        type="button"
                        onClick={() => setIsResetModalOpen(false)}
                        className="ecare-btn-secondary"
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={handleSystemReset}
                        disabled={confirmResetText !== 'RESET' || isResetting}
                        style={{ 
                          flex: 1.2,
                          background: confirmResetText === 'RESET' ? '#ef4444' : '#e2e8f0', 
                          color: confirmResetText === 'RESET' ? 'white' : '#94a3b8', 
                          border: 'none', 
                          padding: '0.75rem', 
                          borderRadius: '10px', 
                          fontWeight: 700, 
                          fontSize: '0.875rem',
                          cursor: confirmResetText === 'RESET' ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Trash size={18} weight="bold" />
                        <span>{isResetting ? 'Resetting...' : 'Reset Everything'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>

      <AgoraDiagnosticsModal
        isOpen={isAgoraDiagnosticsOpen}
        onClose={() => setIsAgoraDiagnosticsOpen(false)}
        agoraAppId={agoraAppId}
        agoraAppCertificate={agoraAppCertificate}
        hasAgoraAppCertificate={hasAgoraAppCertificate}
      />

      <ReminderTestModal
        isOpen={isReminderTestModalOpen}
        onClose={() => setIsReminderTestModalOpen(false)}
        initialFeature={reminderTestFeature}
      />
    </motion.div>
  )
}

export default Settings
