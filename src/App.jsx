import React, { useEffect } from 'react'
import { Truck, Timer } from 'phosphor-react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorList from './pages/DoctorList'
import AddDoctor from './pages/AddDoctor'
import Specialities from './pages/Specialities'
import Services from './pages/Services'
import PendingDoctors from './pages/PendingDoctors'
import PatientList from './pages/PatientList'
import AddPatient from './pages/AddPatient'
import Appointments from './pages/Appointments'
import AddAppointment from './pages/AddAppointment'
import InstantBooking from './pages/InstantBooking'
import CareProviders from './pages/CareProviders'
import AmbulanceService from './pages/AmbulanceService'
import Settings from './pages/Settings'
import StaffManagement from './pages/StaffManagement'
import PaymentSystem from './pages/PaymentSystem'
import Profile from './pages/Profile'
import LabManagement from './pages/lab/LabManagement'
import LabBookingRequest from './pages/lab/LabBookingRequest'
import CareProviderBookingRequest from './pages/CareProviderBookingRequest'
import PatientDashboard from './pages/PatientDashboard'
import Telemedicine from './pages/Telemedicine'
import Availability from './pages/doctor/Availability'
import DoctorFinance from './pages/doctor/DoctorFinance'
import Support from './pages/Support'
import Reviews from './pages/Reviews'
import Cart from './pages/Cart'
import BloodBankDashboard from './pages/bloodbank/BloodBankDashboard'
import BloodInventory from './pages/bloodbank/BloodInventory'
import BloodDonors from './pages/bloodbank/BloodDonors'
import BloodRequests from './pages/bloodbank/BloodRequests'
import AppointmentModal from './components/AppointmentModal'
import CareProviderBookingModal from './components/CareProviderBookingModal'
import ConfirmModal from './components/ConfirmModal'
import AmbulanceBookingModal from './components/AmbulanceBookingModal'
import LabBookingModal from './components/LabBookingModal'
import IncomingCallOverlay from './components/IncomingCallOverlay'
import TelemedPaymentModal from './components/TelemedPaymentModal'
import toast from 'react-hot-toast'
import EcareToaster from './components/EcareToaster'
import OnboardingWizard from './pages/OnboardingWizard'
import useStore from './store/useStore'
import useAuth from './hooks/useAuth'

function App() {
  const activePage = useStore(state => state.activePage)
  const isSetupCompleted = useStore(state => state.isSetupCompleted)
  const setActivePage = useStore(state => state.setActivePage)
  const setUser = useStore(state => state.setUser)
  const initStore = useStore(state => state.initStore)
  const syncLive = useStore(state => state.syncLive)
  const isLoading = useStore(state => state.isLoading)
  const telemedRooms = useStore(state => state.telemedRooms)
  const patients = useStore(state => state.patients)
  const doctorList = useStore(state => state.doctorList)
  const isSidebarCollapsed = useStore(state => state.isSidebarCollapsed)
  const setSidebarCollapsed = useStore(state => state.setSidebarCollapsed)
  const appointments = useStore(state => state.appointments)
  const doctorInstantCallStatus = useStore(state => state.doctorInstantCallStatus)
  const updateAppointment = useStore(state => state.updateAppointment)
  const createTelemedRoom = useStore(state => state.createTelemedRoom)
  const getCurrentDoctor = useStore(state => state.getCurrentDoctor)
  const { user, canAccess, isAdmin, isDoctor, isPatient } = useAuth()
  const dashboardRef = React.useRef(null)
  const primaryColor = useStore(state => state.primaryColor)
  const [activeCall, setActiveCall] = React.useState(null)

  // Optimized Dynamic Theme Engine
  useEffect(() => {
    const root = dashboardRef.current?.closest('#ecare-shadow-inner') || dashboardRef.current
    if (!root || !primaryColor) return

    const adjust = (hex, amt) => {
      const col = hex.startsWith('#') ? hex.slice(1) : hex
      const num = parseInt(col, 16)
      const r = Math.min(255, Math.max(0, (num >> 16) + amt))
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
      return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, '0')}`
    }

    const styles = {
      '--ecare-primary': primaryColor,
      '--ecare-primary-hover': adjust(primaryColor, -25),
      '--ecare-primary-light': adjust(primaryColor, 45),
      '--ecare-primary-bg': `${primaryColor}12`,
      '--ecare-primary-border': `${primaryColor}25`,
      '--ecare-primary-shadow': `${primaryColor}15`,
      '--ecare-primary-v2': adjust(primaryColor, -40),
      '--ecare-primary-v3': adjust(primaryColor, 30),
      '--ecare-primary-v4': adjust(primaryColor, -15),
    }

    Object.entries(styles).forEach(([key, val]) => root.style.setProperty(key, val))
  }, [primaryColor])

  // Real-time Incoming Call Detection (both Doctor and Patient)
  useEffect(() => {
    if (!user?.id) return
    
    const currentUserId = parseInt(user.id)
    
    // Find rooms where the caller is the other party, and callStatus is 'ringing'
    const incoming = (telemedRooms || []).find(r => {
      const isParticipant = parseInt(r.doctor_id) === currentUserId || parseInt(r.patient_id) === currentUserId
      const isIncoming = r.callStatus === 'ringing' && parseInt(r.callerId) !== currentUserId
      return isParticipant && isIncoming
    })
    
    if (incoming && !activeCall) {
      let partnerName = ''
      if (isDoctor) {
        const pat = (patients || []).find(p => parseInt(p.user_id) === parseInt(incoming.patient_id) || parseInt(p.id) === parseInt(incoming.patient_id))
        partnerName = pat ? pat.name : `Patient #${incoming.patient_id}`
      } else {
        const doc = (doctorList || []).find(d => parseInt(d.user_id) === parseInt(incoming.doctor_id) || parseInt(d.id) === parseInt(incoming.doctor_id))
        partnerName = doc ? doc.name : `Doctor #${incoming.doctor_id}`
      }
      
      setActiveCall({ 
        ...incoming, 
        patientName: partnerName,
        partnerName: partnerName,
        isUrgent: incoming.type === 'Instant'
      })
    } else if (!incoming && activeCall) {
      setActiveCall(null)
    }
  }, [telemedRooms, user.id, isDoctor, patients, doctorList, activeCall])

  useEffect(() => {
    initStore(true)
  }, [initStore])

  // Read ?ecare_page= query param on load (used by standalone pages like Cart to navigate back here)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ecarePage = params.get('ecare_page')
    if (ecarePage) {
      setActivePage(ecarePage)
      // Clean the URL so it doesn't persist on refresh
      try {
        const clean = window.location.href.replace(/[?&]ecare_page=[^&]*/, '').replace(/[?&]$/, '')
        window.history.replaceState({}, '', clean)
      } catch (e) {}
    }
  }, [setActivePage])

  // Full-Live Sync: Background refresh every 3 seconds for real-time instant updates
  useEffect(() => {
    const interval = setInterval(() => {
      syncLive()
    }, 3000)
    return () => clearInterval(interval)
  }, [syncLive])

  useEffect(() => {
    if (window.ecareConfig && window.ecareConfig.user) {
      const u = window.ecareConfig.user
      const currentStoreUser = useStore.getState().user
      if (currentStoreUser && currentStoreUser.id && String(currentStoreUser.id) !== String(u.id)) {
        // User session changed: Reset view back to dashboard to avoid caching leakage
        setActivePage('dashboard')
      }
      setUser({
        id:        u.id       || null,
        name:      u.name     || 'User',
        email:     u.email    || '',
        ecareRole: u.ecareRole || 'none',
        wpRoles:   u.wpRoles  || [],
        caps:      u.caps     || [],
        permissions: u.permissions || [],
        avatar:    u.avatar   || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
      })
    }
  }, [setUser, setActivePage])

  // Security Redirect: If user loses access to current page, kick back to dashboard
  useEffect(() => {
    if (isAdmin || activePage === 'dashboard' || !user.id) return

    if (isPatient) {
      const patientAllowedPages = [
        'dashboard', 
        'profile', 
        'telemedicine', 
        'appointments', 
        'care-bookings', 
        'care-providers',
        'care-list',
        'ambulance-bookings', 
        'ambulance-list',
        'ambulance',
        'lab-orders',
        'lab-catalog',
        'lab-locations',
        'lab-booking-create',
        'care-provider-booking-create',
        'payment-invoices',
        'payment-transactions',
        'payment-refunds',
        'support',
        'cart'
      ]
      if (!patientAllowedPages.includes(activePage)) {
        setActivePage('dashboard')
      }
      return
    }

    const pageModuleMap = {
      'doctor-list': 'doctors',
      'pending-doctors': 'doctors',
      'add-doctor': 'doctors',
      'patient-list': 'patients',
      'add-patient': 'patients',
      'patients': 'patients',
      'appointments': 'appointments',
      'care-providers': 'care_providers',
      'care-bookings': 'care_providers',
      'care-pending': 'care_providers',
      'care-list': 'care_providers',
      'ambulance-bookings': 'ambulance',
      'ambulance-list': 'ambulance',
      'ambulance-register': 'ambulance',
      'ambulance-pending': 'ambulance',
      'ambulance-create': 'ambulance',
      'staff': 'staff',
      'staff-attendance': 'staff',
      'departments': 'settings',
      'services': 'settings',
      'settings': 'settings',
      'payment-dashboard': 'billing',
      'payment-transactions': 'billing',
      'payment-invoices': 'billing',
      'payment-refunds': 'billing',
      'payment-verification': 'billing',
      'lab-orders': 'lab',
      'lab-catalog': 'lab',
      'lab-booking-create': 'lab',
      'care-provider-booking-create': 'care_providers'
    }

    const requiredModule = pageModuleMap[activePage]
    
    // Explicit Financial Data Isolation (Admin Only Pages)
    if (['payment-dashboard', 'payment-disbursements', 'payment-verification'].includes(activePage) && !isAdmin) {
      setActivePage('dashboard')
      return
    }

    if (requiredModule && !canAccess(requiredModule)) {
      setActivePage('dashboard')
    }
    
    // Explicit Doctor Restrictions
    if (activePage === 'availability' && !isDoctor) {
      setActivePage('dashboard')
    }

    if (isDoctor && (activePage === 'add-appointment' || activePage === 'add-patient')) {
      setActivePage('dashboard')
    }
  }, [activePage, user.permissions, isAdmin, isDoctor, canAccess, setActivePage, user.id])

  const pendingInstantCalls = React.useMemo(() => {
    if (!isDoctor || !getCurrentDoctor) return []
    const currentDoctor = getCurrentDoctor()
    const docSpecialty = currentDoctor ? (currentDoctor.specialty || currentDoctor.specialization || currentDoctor.speciality || 'General').toLowerCase() : 'general';

    return (appointments || []).filter(a => {
      if (a.mode !== 'Instant Call' || a.status !== 'Query') return false;
      const apptSpecialty = (a.specialty || 'General').toLowerCase();
      return apptSpecialty === 'general' || apptSpecialty.includes('general') || docSpecialty.includes(apptSpecialty) || apptSpecialty.includes(docSpecialty);
    })
  }, [appointments, getCurrentDoctor, doctorList, user?.id, isDoctor])

  const handleAcceptInstantCall = async (appt) => {
    const currentDoctor = getCurrentDoctor ? getCurrentDoctor() : null;
    const doctorName = currentDoctor?.name || user?.name;

    const res = await updateAppointment(appt.id, {
      doctorName: doctorName,
      status: 'Active',
      started_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
    if (res && res.success) {
      await createTelemedRoom({
        appointment_id: appt.id,
        doctor_id: user.id,
        patient_id: appt.patient_id || appt.patient_user_id || appt.patientId,
        status: 'Active',
        type: 'Instant'
      })
      toast.success('Instant Call Accepted!')
      setActivePage('telemedicine')
    } else {
      toast.error('Call might have been claimed by another doctor.')
    }
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        if (user.ecareRole === 'doctor') return <DoctorDashboard />
        if (user.ecareRole === 'patient') return <PatientDashboard />
        return <Dashboard />
      case 'doctor-list':
        return <DoctorList />
      case 'pending-doctors':
        return <PendingDoctors />
      case 'add-doctor':
        return <AddDoctor />
      case 'patient-list':
        return <PatientList />
      case 'add-patient':
        return <AddPatient />
      case 'departments':
        return <Specialities />
      case 'services':
        return <Services />
      case 'blood-bank':
        return <BloodBankDashboard />
      case 'blood-inventory':
        return <BloodInventory />
      case 'blood-donors':
        return <BloodDonors />
      case 'blood-requests':
        return <BloodRequests />
      case 'care-providers':
      case 'care-bookings':
      case 'care-pending':
      case 'care-list':
        return <CareProviders view={activePage === 'care-bookings' ? 'bookings' : activePage === 'care-pending' ? 'pending' : activePage === 'care-list' ? 'list' : 'add'} />
      case 'ambulance-create':
      case 'ambulance-bookings':
      case 'ambulance-list':
      case 'ambulance-register':
      case 'ambulance-pending':
        return <AmbulanceService view={
          activePage === 'ambulance-bookings' ? 'bookings' : 
          activePage === 'ambulance-list' ? 'list' :
          activePage === 'ambulance-pending' ? 'pending' : 
          activePage === 'ambulance-create' ? 'create' : 'register'
        } />
      case 'patients':
        return (
          <div className="ecare-card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Patients Directory</h2>
            <p style={{ color: '#64748b' }}>The massive patient database interface is coming soon...</p>
          </div>
        )
      case 'appointments':
        return <Appointments />
      case 'reviews':
        return <Reviews />
      case 'add-appointment':
        return <AddAppointment />

      case 'staff':
      case 'staff-attendance':
        return <StaffManagement view={activePage === 'staff-attendance' ? 'attendance' : 'directory'} />
      case 'payment-dashboard':
      case 'payment-transactions':
      case 'payment-invoices':
      case 'payment-refunds':
      case 'payment-verification':
      case 'payment-disbursements':
        return <PaymentSystem view={activePage.replace('payment-', '')} />
      case 'lab-orders':
      case 'lab-catalog':
      case 'lab-locations':
        return <LabManagement view={activePage.replace('lab-', '')} />
      case 'lab-booking-create':
        return <LabBookingRequest />
      case 'care-provider-booking-create':
        return <CareProviderBookingRequest />
      case 'cart':
        return <Cart />
      case 'settings':
        return <Settings />
      case 'profile':
        return <Profile />
      case 'telemedicine':
        return <Telemedicine />
      case 'availability':
        return <Availability />
      case 'doctor-finance':
        return <DoctorFinance />
      case 'support':
        return <Support />
      default:
        if (user.ecareRole === 'doctor') return <DoctorDashboard />
        if (user.ecareRole === 'patient') return <PatientDashboard />
        return <Dashboard />
    }
  }

  if (!isSetupCompleted) {
    if (!isAdmin) {
      const logoutUrl = window.ecareConfig?.logoutUrl || (window.location.origin + '/wp-login.php?action=logout&redirect_to=' + encodeURIComponent(window.location.origin + '/ecare-login'));
      window.location.href = logoutUrl;
      return null;
    }
    return (
      <div className="ecare-dashboard" ref={dashboardRef} style={{ display: 'block', minHeight: '100vh', background: 'var(--ecare-primary-bg, #f0fdf4)' }}>
        <OnboardingWizard />
        <EcareToaster position="bottom-right" />
      </div>
    )
  }

  return (
    <div className={`ecare-dashboard ${isSidebarCollapsed ? 'collapsed' : ''}`} ref={dashboardRef}>
      <Sidebar />
      {!isSidebarCollapsed && (
        <div 
          className="ecare-sidebar-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBar />
        <main className="ecare-main" style={{ 
          flex: 1, 
          overflowY: activePage === 'telemedicine' ? 'hidden' : 'auto',
          display: activePage === 'telemedicine' ? 'flex' : 'block',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {isDoctor && doctorInstantCallStatus && pendingInstantCalls.length > 0 && (
            <div style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>
              <div 
                className="ecare-card ecare-flex-responsive"
                style={{ 
                  background: `linear-gradient(135deg, #f97316 0%, #ea580c 100%)`,
                  color: 'white',
                  padding: '1.25rem 1.5rem',
                  border: 'none',
                  boxShadow: `0 10px 25px -5px rgba(234, 88, 12, 0.4)`,
                  borderRadius: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1.5rem',
                  animation: 'pulseApp 2s infinite'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Timer size={28} weight="fill" color="white" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px', color: 'white' }}>
                      Incoming Instant Call Query!
                    </h2>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                      Patient: <strong>{pendingInstantCalls[0].patientName}</strong> is waiting.
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleAcceptInstantCall(pendingInstantCalls[0])}
                  style={{ background: 'white', color: '#ea580c', fontWeight: 800, padding: '0.625rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
                >
                  Accept Call Now
                </button>
                <style>{`
                  @keyframes pulseApp {
                    0% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.7); }
                    70% { box-shadow: 0 0 0 15px rgba(234, 88, 12, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0); }
                  }
                `}</style>
              </div>
            </div>
          )}
          {renderPage()}
        </main>
      </div>
      {/* <AppointmentModal /> -- Migrated to full panel */}
      <CareProviderBookingModal />
      <AmbulanceBookingModal />
      <LabBookingModal />
      <ConfirmModal />
      <IncomingCallOverlay 
        call={activeCall} 
        onAccept={async () => {
          if (activeCall) {
            const { updateTelemedRoomCall, setSelectedRoomId, setActiveTab } = useStore.getState()
            await updateTelemedRoomCall(activeCall.id, { callStatus: 'connected' })
            setSelectedRoomId(activeCall.id)
            setActiveTab('room')
            setActiveCall(null)
            setActivePage('telemedicine')
          }
        }}
        onReject={async () => {
          if (activeCall) {
            const { updateTelemedRoomCall, handleOp, user } = useStore.getState()
            await updateTelemedRoomCall(activeCall.id, { callStatus: 'rejected' })
            try {
              await handleOp('telemed-messages', 'post', {
                room_id: activeCall.id,
                sender_id: user?.id || 0,
                message: 'Call Declined',
                type: 'call_event',
                event_type: 'rejected'
              }, null, 'telemedMessages')
            } catch (e) {}
            setActiveCall(null)
          }
        }}
      />
      <TelemedPaymentModal />
      <EcareToaster position="bottom-right" />
      
    </div>
  )
}

export default App
