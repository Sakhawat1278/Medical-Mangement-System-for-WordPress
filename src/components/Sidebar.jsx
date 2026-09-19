import React, { useState, useMemo } from 'react'
import { 
  GridFour, UserPlus, Users, CalendarPlus, Buildings,
  UserCircle, Flask, FirstAid,
  CreditCard, Gear, UserGear, SignOut, CaretDown, CaretLeft, CaretRight,
  IdentificationCard, Truck, Heartbeat, TestTube,
  VideoCamera, Chats, ShoppingCart, Star
} from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import useAuth from '../hooks/useAuth'

// ─── Nav Item ─────────────────────────────────────────────────────────────────
const NavItem = ({ id, icon: Icon, label, index, isCollapsed, hasSubmenu, isOpen, onClick, customStyle, active, hasDot }) => {
  const { activePage, setActivePage } = useStore()
  const isActive = active !== undefined ? active : activePage === id

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.04 }}
      whileHover={{ x: isCollapsed ? 0 : 4 }}
      className={`ecare-nav-item ${isActive ? 'active' : ''}`}
      onClick={onClick || (() => setActivePage(id))}
      style={{ 
        position: 'relative', 
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        padding: isCollapsed ? '0.75rem 0' : '0.5rem 0.75rem',
        ...customStyle
      }}
      title={isCollapsed ? label : ''}
    >
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon 
          size={18} 
          weight={isActive ? 'duotone' : 'regular'} 
          color={customStyle?.color || (isActive ? 'var(--ecare-primary)' : 'var(--ecare-text-muted)')}
        />
        {hasDot && isCollapsed && (
          <motion.span 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              border: '2px solid white',
              boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)'
            }} 
          />
        )}
      </div>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', marginLeft: '0.75rem' }}
          >
            <span style={{ flex: 1, whiteSpace: 'nowrap', fontWeight: customStyle?.color ? 600 : 400 }}>{label}</span>
            {hasDot && !isCollapsed && (
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '1.5px solid white',
                  boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
                  marginRight: '8px',
                  flexShrink: 0
                }} 
              />
            )}
            {hasSubmenu && (
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
                <CaretDown size={14} weight="bold" color="var(--ecare-text-muted)" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Sub Item ─────────────────────────────────────────────────────────────────
const SubItem = ({ label, isActive, onClick, hasDot }) => (
  <div className={`ecare-sub-item ${isActive ? 'active' : ''}`} onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="ecare-sub-dot" />
      <span>{label}</span>
    </div>
    {hasDot && (
      <motion.span 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          flexShrink: 0,
          boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)'
        }} 
      />
    )}
  </div>
)

// ─── Role Badge ───────────────────────────────────────────────────────────────
const roleMeta = {
  admin:        { label: 'Administrator',  color: '#7c3aed', bg: '#f5f3ff' },
  doctor:       { label: 'Doctor',         color: '#0369a1', bg: '#f0f9ff' },
  receptionist: { label: 'Receptionist',   color: 'var(--ecare-primary)', bg: 'var(--ecare-primary-bg)' },
  patient:      { label: 'Patient',        color: '#b45309', bg: '#fffbeb' },
  none:         { label: 'No Role',        color: '#64748b', bg: '#f1f5f9' },
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
const Sidebar = () => {
  const {
    isSidebarCollapsed, setSidebarCollapsed, activePage, setActivePage, 
    isAppointmentModalOpen, setAppointmentModal, 
    isCareProviderBookingModalOpen, setCareProviderBookingModal,
    isLabBookingModalOpen, setLabBookingModal,
    setAmbulanceModal, setEditingAppointment,
    setEditingDoctor, setEditingPatient,
    pendingDoctors = [],
    pendingCareProviders = [],
    pendingAmbulanceDrivers = [],
    manualVerifications = [],
    supportTickets = [],
    supportMessages = [],
    seenSupportMessageIds = [],
    payouts = [],
    cart = []
  } = useStore()
  const { role, isAdmin, isDoctor, isReceptionist, isPatient, can, canAccess, user } = useAuth()

  // Unseen support messages dot calculator
  const hasUnseenSupport = useMemo(() => {
    if (!user?.id) return false;
    const currentUserId = parseInt(user.id);
    const isAdminOrStaff = isAdmin || isReceptionist || canAccess('staff');

    // Filter accessible tickets
    const accessibleTickets = (supportTickets || []).filter(t =>
      isAdminOrStaff || parseInt(t.user_id) === currentUserId
    );

    // Check if there is any message in supportMessages belonging to accessibleTickets
    // that is NOT sent by the current user and NOT in seenSupportMessageIds
    return (supportMessages || []).some(m => {
      const isMsgAccessible = accessibleTickets.some(t => parseInt(t.id) === parseInt(m.ticket_id));
      if (!isMsgAccessible) return false;
      if (parseInt(m.sender_id) === currentUserId) return false;
      return !(seenSupportMessageIds || []).includes(m.id);
    });
  }, [user, isAdmin, isReceptionist, canAccess, supportTickets, supportMessages, seenSupportMessageIds]);

  const [isDoctorsOpen,      setIsDoctorsOpen]      = useState(false)
  const [isPatientsOpen,     setIsPatientsOpen]      = useState(false)
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false)
  const [isCareOpen,         setIsCareOpen]         = useState(false)
  const [isAmbulanceOpen,    setIsAmbulanceOpen]    = useState(false)
  const [isPaymentOpen,      setIsPaymentOpen]      = useState(false)
  const [isLabOpen,          setIsLabOpen]          = useState(false)
  const [isStaffOpen,        setIsStaffOpen]        = useState(false)

  // Dynamic Submenu List Generator with Role & Permission Filtering
  const doctorSubmenuItems = useMemo(() => {
    const items = []
    items.push({ id: 'doctor-list', label: 'Doctor List', action: () => setActivePage('doctor-list') })
    if (canAccess('doctors_approve')) {
      items.push({ id: 'pending-doctors', label: 'Pending List', action: () => setActivePage('pending-doctors'), hasDot: pendingDoctors.length > 0 })
    }
    if (canAccess('doctors_add')) {
      items.push({ id: 'add-doctor', label: 'Add Doctor', action: () => { setEditingDoctor(null); setActivePage('add-doctor'); } })
    }
    return items
  }, [canAccess, setActivePage, setEditingDoctor, pendingDoctors])

  const patientSubmenuItems = useMemo(() => {
    const items = []
    items.push({ id: 'patient-list', label: 'Patient List', action: () => setActivePage('patient-list') })
    if ((isAdmin || canAccess('patients_add')) && !isDoctor) {
      items.push({ id: 'add-patient', label: 'Add Patient', action: () => { setEditingPatient(null); setActivePage('add-patient'); } })
    }
    return items
  }, [isAdmin, canAccess, isDoctor, setActivePage, setEditingPatient])

  const appointmentSubmenuItems = useMemo(() => {
    const items = []
    items.push({ id: 'appointments', label: isPatient ? "View All" : "Appointments", action: () => setActivePage('appointments') })
    if ((isAdmin || isReceptionist || canAccess('appointments_add')) && !isDoctor && !isPatient) {
      items.push({ id: 'add-appointment', label: "Add Appointment", action: () => { setEditingAppointment(null); setActivePage('add-appointment'); } })
    }
    return items
  }, [isAdmin, isReceptionist, isPatient, canAccess, isDoctor, setActivePage, setEditingAppointment])

  const careSubmenuItems = useMemo(() => {
    const items = []
    items.push({ id: 'care-bookings', label: isPatient ? "My Bookings" : "Bookings", action: () => setActivePage('care-bookings') })
    if (!isPatient) {
      items.push({ id: 'care-request-modal', label: "Add Booking", action: () => setCareProviderBookingModal(true), isModal: true, activeCheck: isCareProviderBookingModalOpen })
      items.push({ id: 'care-list', label: "Provider List", action: () => setActivePage('care-list') })
    }
    if (canAccess('care_register') && !isPatient) {
      items.push({ id: 'care-providers', label: "Register", action: () => setActivePage('care-providers') })
    }
    if (canAccess('care_approve') && !isPatient) {
      items.push({ id: 'care-pending', label: "Pending Approvals", action: () => setActivePage('care-pending'), hasDot: pendingCareProviders.length > 0 })
    }
    return items
  }, [isPatient, canAccess, setActivePage, setCareProviderBookingModal, isCareProviderBookingModalOpen, pendingCareProviders])

  const ambulanceSubmenuItems = useMemo(() => {
    const items = []
    items.push({ id: 'ambulance-bookings', label: isPatient ? "My Requests" : "Booking Requests", action: () => setActivePage('ambulance-bookings') })
    
    if (!isPatient) {
      items.push({ id: 'ambulance-list', label: "Fleet List", action: () => setActivePage('ambulance-list') })
      if (canAccess('ambulance_dispatch')) {
        items.push({ id: 'ambulance-dispatch-modal', label: "Create Dispatch", action: () => setAmbulanceModal(true), isModal: true })
      }
      if (canAccess('ambulance_fleet')) {
        items.push({ id: 'ambulance-register', label: "Register", action: () => setActivePage('ambulance-register') })
      }
      if (canAccess('ambulance_approve')) {
        items.push({ id: 'ambulance-pending', label: "Pending Ambulance", action: () => setActivePage('ambulance-pending'), hasDot: pendingAmbulanceDrivers.length > 0 })
      }
    }
    return items
  }, [isPatient, canAccess, setActivePage, setAmbulanceModal, pendingAmbulanceDrivers])

  const labSubmenuItems = useMemo(() => {
    const items = []
    items.push({ id: 'lab-orders', label: isPatient ? 'My Bookings' : 'Orders', action: () => setActivePage('lab-orders') })
    if (!isPatient) {
      items.push({ id: 'lab-book-test-modal', label: "Book Lab Test", action: () => setLabBookingModal(true), isModal: true, activeCheck: isLabBookingModalOpen })
      items.push({ id: 'lab-catalog', label: "Test Catalog", action: () => setActivePage('lab-catalog') })
      items.push({ id: 'lab-locations', label: "Locations", action: () => setActivePage('lab-locations') })
    }
    return items
  }, [isPatient, setActivePage, setLabBookingModal, isLabBookingModalOpen])

  const staffSubmenuItems = useMemo(() => {
    const items = []
    items.push({ id: 'staff', label: "Staff Directory", action: () => setActivePage('staff') })
    items.push({ id: 'staff-attendance', label: "Attendance Manager", action: () => setActivePage('staff-attendance') })
    return items
  }, [setActivePage])

  const paymentSubmenuItems = useMemo(() => {
    const items = []
    if (isAdmin) {
      items.push({ id: 'payment-dashboard', label: "Revenue Dashboard", action: () => setActivePage('payment-dashboard') })
    }
    items.push({ id: 'payment-transactions', label: "Transactions", action: () => setActivePage('payment-transactions') })
    items.push({ id: 'payment-invoices', label: "Invoices", action: () => setActivePage('payment-invoices') })
    if (isAdmin) {
      items.push({ id: 'payment-disbursements', label: "Disbursements", action: () => setActivePage('payment-disbursements'), hasDot: (payouts || []).some(p => p.status === 'Pending') })
    }
    items.push({ id: 'payment-refunds', label: "Refunds", action: () => setActivePage('payment-refunds') })
    if (isAdmin) {
      items.push({ id: 'payment-verification', label: "Manual Verification", action: () => setActivePage('payment-verification'), hasDot: manualVerifications.some(v => v.status === 'Pending') })
    }
    return items
  }, [isAdmin, setActivePage, payouts, manualVerifications])

  // Custom helper to dynamically check if any item in a submenu list is active
  const isSubmenuActive = (items) => {
    return items.some(item => {
      if (item.isModal) return !!item.activeCheck
      
      // Secondary alias mappings for active classes
      if (item.id === 'doctors' && ['doctors', 'doctor-list', 'pending-doctors', 'add-doctor'].includes(activePage)) return true
      if (item.id === 'patients' && ['patients', 'patient-list', 'add-patient'].includes(activePage)) return true
      if (item.id === 'appointments' && ['appointments', 'appointment-list'].includes(activePage)) return true
      if (item.id === 'care-providers' && ['care-providers', 'care-bookings', 'care-list', 'care-pending', 'care-provider-booking-create'].includes(activePage)) return true
      if (item.id === 'ambulance' && ['ambulance', 'ambulance-bookings', 'ambulance-register', 'ambulance-pending', 'ambulance-create', 'ambulance-list'].includes(activePage)) return true
      if (item.id === 'lab-orders' && ['lab-orders', 'lab-catalog', 'lab-booking-create', 'lab-locations'].includes(activePage)) return true
      if (item.id === 'staff' && ['staff', 'staff-attendance'].includes(activePage)) return true
      if (item.id === 'payment' && ['payment', 'payment-dashboard', 'payment-transactions', 'payment-invoices', 'payment-refunds', 'payment-verification', 'payment-disbursements'].includes(activePage)) return true
      
      return activePage === item.id
    })
  }

  // Nested MiniDot for Collapsed Submenus (simplified without hover text)
  const MiniDot = ({ isActive, onClick, hasDot }) => {
    const [hover, setHover] = useState(false)
    return (
      <div 
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: hasDot ? '#ef4444' : (isActive ? 'var(--ecare-primary)' : '#cbd5e1'),
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
          transform: hover ? 'scale(1.5)' : 'scale(1)',
          boxShadow: hasDot ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none'
        }}
      />
    )
  }

  const meta = roleMeta[role] || roleMeta.none

  return (
    <motion.aside 
      animate={{ width: isSidebarCollapsed ? '70px' : '285px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`ecare-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Collapse/Expand Toggle Button */}
      <button 
        onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '-13px',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: 'white',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#475569',
          zIndex: 1000,
          transition: 'all 0.2s',
          outline: 'none',
          padding: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--ecare-primary)'
          e.currentTarget.style.color = 'var(--ecare-primary)'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1'
          e.currentTarget.style.color = '#475569'
          e.currentTarget.style.transform = 'scale(1)'
        }}
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? (
          <CaretRight size={14} weight="bold" />
        ) : (
          <CaretLeft size={14} weight="bold" />
        )}
      </button>

      {/* Fixed Identity Section */}
      <div style={{ flexShrink: 0 }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', padding: isSidebarCollapsed ? '0' : '0 0.5rem', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', minHeight: '40px', flexShrink: 0 }}>
          {window.ecareConfig?.logo ? (
            <img 
              src={window.ecareConfig.logo} 
              alt="Logo" 
              style={{ width: isSidebarCollapsed ? '24px' : '32px', height: 'auto', maxHeight: '32px', objectFit: 'contain' }} 
            />
          ) : (
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: 'var(--ecare-primary)', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffffff', 
              fontWeight: '800', 
              fontSize: '1.1rem',
              flexShrink: 0
            }}>
              E
            </div>
          )}
          {!isSidebarCollapsed && (
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.01em' }}>
              {window.ecareConfig?.siteName || 'E-CARE'}
            </span>
          )}
        </div>

        {/* Role Badge — only shown when expanded */}
        {!isSidebarCollapsed && (
          <div style={{ margin: '0 0.5rem 0.75rem', padding: '6px 10px', borderRadius: '8px', background: meta.bg, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{meta.label}</span>
          </div>
        )}
      </div>

      {/* Navigation - Scrollable Area */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.125rem', 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        paddingRight: '6px',
        paddingTop: '0.5rem',
        paddingBottom: '2rem'
      }}>
        {!isSidebarCollapsed && <div className="ecare-section-title">Menu</div>}

        {/* Dashboard — all roles */}
        <NavItem id="dashboard" icon={GridFour} label="Overview" index={0} isCollapsed={isSidebarCollapsed} />
        <NavItem id="profile"   icon={UserCircle} label="My Profile" index={0.5} isCollapsed={isSidebarCollapsed} />
        {(isDoctor || isPatient) && (
          <NavItem id="telemedicine" icon={VideoCamera} label="Virtual Consult" index={0.7} isCollapsed={isSidebarCollapsed} />
        )}

        {/* Doctor Specific: Availability */}
        {isDoctor && (
          <NavItem id="availability" icon={CalendarPlus} label="My Availability" index={0.8} isCollapsed={isSidebarCollapsed} />
        )}

        {/* Doctors — admin, receptionist, or staff with doctors ability */}
        {(isAdmin || isReceptionist || canAccess('doctors')) && doctorSubmenuItems.length > 0 && (
          <>
            <NavItem
              id="doctors" 
              icon={UserPlus} 
              label="Doctors" 
              index={1}
              isCollapsed={isSidebarCollapsed} 
              hasSubmenu={doctorSubmenuItems.length > 1} 
              isOpen={doctorSubmenuItems.length > 1 && isDoctorsOpen}
              onClick={doctorSubmenuItems.length > 1 ? () => setIsDoctorsOpen(!isDoctorsOpen) : doctorSubmenuItems[0]?.action}
              active={isSubmenuActive(doctorSubmenuItems)}
              hasDot={(isAdmin || isReceptionist || canAccess('doctors')) && pendingDoctors.length > 0}
            />
            <AnimatePresence>
              {doctorSubmenuItems.length > 1 && isDoctorsOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  style={{ 
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: isSidebarCollapsed ? 'row' : 'column',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '6px' : '0',
                    padding: isSidebarCollapsed ? '4px 0 8px' : '0'
                  }}
                >
                  {isSidebarCollapsed ? (
                    doctorSubmenuItems.map((item, idx) => (
                      <MiniDot key={idx} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  ) : (
                    doctorSubmenuItems.map((item, idx) => (
                      <SubItem key={idx} label={item.label} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Patients — admin, receptionist, or staff with patients ability */}
        {(isAdmin || isReceptionist || canAccess('patients')) && patientSubmenuItems.length > 0 && (
          <>
            <NavItem
              id="patients" 
              icon={Users} 
              label="Patient" 
              index={2}
              isCollapsed={isSidebarCollapsed} 
              hasSubmenu={patientSubmenuItems.length > 1} 
              isOpen={patientSubmenuItems.length > 1 && isPatientsOpen}
              onClick={patientSubmenuItems.length > 1 ? () => setIsPatientsOpen(!isPatientsOpen) : patientSubmenuItems[0]?.action}
              active={isSubmenuActive(patientSubmenuItems)}
            />
            <AnimatePresence>
              {patientSubmenuItems.length > 1 && isPatientsOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  style={{ 
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: isSidebarCollapsed ? 'row' : 'column',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '6px' : '0',
                    padding: isSidebarCollapsed ? '4px 0 8px' : '0'
                  }}
                >
                  {isSidebarCollapsed ? (
                    patientSubmenuItems.map((item, idx) => (
                      <MiniDot key={idx} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  ) : (
                    patientSubmenuItems.map((item, idx) => (
                      <SubItem key={idx} label={item.label} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Appointments — admin, doctor, receptionist, staff, or patient (self) */}
        {(isAdmin || isDoctor || isReceptionist || isPatient || canAccess('appointments')) && appointmentSubmenuItems.length > 0 && (
          <>
            <NavItem
              id="appointments" 
              icon={CalendarPlus} 
              label={isPatient ? "My Appointments" : "Appointment"} 
              index={3}
              isCollapsed={isSidebarCollapsed} 
              hasSubmenu={appointmentSubmenuItems.length > 1} 
              isOpen={appointmentSubmenuItems.length > 1 && isAppointmentsOpen}
              onClick={appointmentSubmenuItems.length > 1 ? () => setIsAppointmentsOpen(!isAppointmentsOpen) : appointmentSubmenuItems[0]?.action}
              active={isSubmenuActive(appointmentSubmenuItems) || isAppointmentModalOpen}
            />
            <AnimatePresence>
              {appointmentSubmenuItems.length > 1 && isAppointmentsOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  style={{ 
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: isSidebarCollapsed ? 'row' : 'column',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '6px' : '0',
                    padding: isSidebarCollapsed ? '4px 0 8px' : '0'
                  }}
                >
                  {isSidebarCollapsed ? (
                    appointmentSubmenuItems.map((item, idx) => (
                      <MiniDot key={idx} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  ) : (
                    appointmentSubmenuItems.map((item, idx) => (
                      <SubItem key={idx} label={item.label} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Care Providers — admin, receptionist, staff, or patient (self) */}
        {(isAdmin || isReceptionist || isPatient || canAccess('care_providers')) && careSubmenuItems.length > 0 && (
          <>
            <NavItem
              id="care-providers" 
              icon={IdentificationCard} 
              label={isPatient ? "Home Care" : "Care Provider"} 
              index={4}
              isCollapsed={isSidebarCollapsed} 
              hasSubmenu={careSubmenuItems.length > 1} 
              isOpen={careSubmenuItems.length > 1 && isCareOpen}
              onClick={careSubmenuItems.length > 1 ? () => setIsCareOpen(!isCareOpen) : careSubmenuItems[0]?.action}
              active={isSubmenuActive(careSubmenuItems)}
              hasDot={(isAdmin || canAccess('care_providers')) && pendingCareProviders.length > 0}
            />
            <AnimatePresence>
              {careSubmenuItems.length > 1 && isCareOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  style={{ 
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: isSidebarCollapsed ? 'row' : 'column',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '6px' : '0',
                    padding: isSidebarCollapsed ? '4px 0 8px' : '0'
                  }}
                >
                  {isSidebarCollapsed ? (
                    careSubmenuItems.map((item, idx) => (
                      <MiniDot key={idx} isActive={activePage === item.id || (item.isModal && item.activeCheck)} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  ) : (
                    careSubmenuItems.map((item, idx) => (
                      <SubItem key={idx} label={item.label} isActive={activePage === item.id || (item.isModal && item.activeCheck)} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Ambulance — admin, staff, or patient (emergency) */}
        {(isAdmin || isPatient || canAccess('ambulance')) && ambulanceSubmenuItems.length > 0 && (
          <>
            <NavItem
              id="ambulance" 
              icon={Truck} 
              label={isPatient ? "Ambulance" : "Ambulance Service"} 
              index={5}
              isCollapsed={isSidebarCollapsed} 
              hasSubmenu={ambulanceSubmenuItems.length > 1} 
              isOpen={ambulanceSubmenuItems.length > 1 && isAmbulanceOpen}
              onClick={ambulanceSubmenuItems.length > 1 ? () => setIsAmbulanceOpen(!isAmbulanceOpen) : ambulanceSubmenuItems[0]?.action}
              active={isSubmenuActive(ambulanceSubmenuItems)}
              hasDot={(isAdmin || canAccess('ambulance')) && pendingAmbulanceDrivers.length > 0}
            />
            <AnimatePresence>
              {ambulanceSubmenuItems.length > 1 && isAmbulanceOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  style={{ 
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: isSidebarCollapsed ? 'row' : 'column',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '6px' : '0',
                    padding: isSidebarCollapsed ? '4px 0 8px' : '0'
                  }}
                >
                  {isSidebarCollapsed ? (
                    ambulanceSubmenuItems.map((item, idx) => (
                      <MiniDot key={idx} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  ) : (
                    ambulanceSubmenuItems.map((item, idx) => (
                      <SubItem key={idx} label={item.label} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Clinical Catalog — admin or staff with settings ability */}
        {(isAdmin || canAccess('settings')) && (
          <>
            <NavItem id="departments" icon={Buildings}       label="Specialities" index={6} isCollapsed={isSidebarCollapsed} />
            <NavItem id="services"    icon={Heartbeat}       label="Services"     index={7} isCollapsed={isSidebarCollapsed} />
          </>
        )}

        {/* Lab Tests — Restricted for Doctors */}
        {(isAdmin || isPatient || isReceptionist || canAccess('lab')) && !isDoctor && labSubmenuItems.length > 0 && (
          <>
            <NavItem
              id="lab-orders" 
              icon={TestTube} 
              label="Lab Tests" 
              index={8}
              isCollapsed={isSidebarCollapsed} 
              hasSubmenu={labSubmenuItems.length > 1} 
              isOpen={labSubmenuItems.length > 1 && isLabOpen}
              onClick={labSubmenuItems.length > 1 ? () => setIsLabOpen(!isLabOpen) : labSubmenuItems[0]?.action}
              active={isSubmenuActive(labSubmenuItems)}
            />
            <AnimatePresence>
              {labSubmenuItems.length > 1 && isLabOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  style={{
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: isSidebarCollapsed ? 'row' : 'column',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '6px' : '0',
                    padding: isSidebarCollapsed ? '4px 0 8px' : '0'
                  }}
                >
                  {isSidebarCollapsed ? (
                    labSubmenuItems.map((item, idx) => (
                      <MiniDot key={idx} isActive={activePage === item.id} onClick={item.action} />
                    ))
                  ) : (
                    labSubmenuItems.map((item, idx) => (
                      <SubItem key={idx} label={item.label} isActive={activePage === item.id} onClick={item.action} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}



        <div className="ecare-divider" />
        {!isSidebarCollapsed && <div className="ecare-section-title">Other Menu</div>}

        {/* Staff — admin or staff with staff ability */}
        {(isAdmin || canAccess('staff')) && staffSubmenuItems.length > 0 && (
          <>
            <NavItem
              id="staff" 
              icon={UserCircle} 
              label="Staff" 
              index={10}
              isCollapsed={isSidebarCollapsed} 
              hasSubmenu={staffSubmenuItems.length > 1} 
              isOpen={staffSubmenuItems.length > 1 && isStaffOpen}
              onClick={staffSubmenuItems.length > 1 ? () => setIsStaffOpen(!isStaffOpen) : staffSubmenuItems[0]?.action}
              active={isSubmenuActive(staffSubmenuItems)}
            />
            <AnimatePresence>
              {staffSubmenuItems.length > 1 && isStaffOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  style={{ 
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: isSidebarCollapsed ? 'row' : 'column',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '6px' : '0',
                    padding: isSidebarCollapsed ? '4px 0 8px' : '0'
                  }}
                >
                  {isSidebarCollapsed ? (
                    staffSubmenuItems.map((item, idx) => (
                      <MiniDot key={idx} isActive={activePage === item.id} onClick={item.action} />
                    ))
                  ) : (
                    staffSubmenuItems.map((item, idx) => (
                      <SubItem key={idx} label={item.label} isActive={activePage === item.id} onClick={item.action} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Payment — all roles including patient */}
        {(isPatient || isAdmin || canAccess('billing')) && paymentSubmenuItems.length > 0 && (
          <>
            <NavItem
              id="payment" 
              icon={CreditCard} 
              label="Payment" 
              index={13}
              isCollapsed={isSidebarCollapsed} 
              hasSubmenu={paymentSubmenuItems.length > 1} 
              isOpen={paymentSubmenuItems.length > 1 && isPaymentOpen}
              onClick={paymentSubmenuItems.length > 1 ? () => setIsPaymentOpen(!isPaymentOpen) : paymentSubmenuItems[0]?.action}
              active={isSubmenuActive(paymentSubmenuItems)}
              hasDot={isAdmin && (manualVerifications.some(v => v.status === 'Pending') || (payouts || []).some(p => p.status === 'Pending'))}
            />
            <AnimatePresence>
              {paymentSubmenuItems.length > 1 && isPaymentOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  style={{ 
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: isSidebarCollapsed ? 'row' : 'column',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    alignItems: 'center',
                    gap: isSidebarCollapsed ? '6px' : '0',
                    padding: isSidebarCollapsed ? '4px 0 8px' : '0'
                  }}
                >
                  {isSidebarCollapsed ? (
                    paymentSubmenuItems.map((item, idx) => (
                      <MiniDot key={idx} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  ) : (
                    paymentSubmenuItems.map((item, idx) => (
                      <SubItem key={idx} label={item.label} isActive={activePage === item.id} onClick={item.action} hasDot={item.hasDot} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Doctor Finance — specific for doctors */}
        {isDoctor && (
          <NavItem id="doctor-finance" icon={CreditCard} label="Finance Manager" index={13.5} isCollapsed={isSidebarCollapsed} />
        )}

        {/* Support Messaging */}
        {user?.id && (
          <NavItem 
            id="support" 
            icon={Chats} 
            label="Support Center" 
            index={13.8} 
            isCollapsed={isSidebarCollapsed} 
            hasDot={hasUnseenSupport}
          />
        )}

        {/* Reviews */}
        {(isAdmin || isDoctor) && (
          <NavItem id="reviews" icon={Star} label="Reviews" index={13.9} isCollapsed={isSidebarCollapsed} />
        )}

        {/* Settings & Admin Panel — admin or staff with settings ability */}
        {(isAdmin || canAccess('settings')) && (
          <>
            <NavItem id="settings" icon={Gear}     label="Setting"     index={14} isCollapsed={isSidebarCollapsed} />
          </>
        )}
      </div>

      {/* Logout - Fixed Area */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', flexShrink: 0 }}>
        {isPatient && !isSidebarCollapsed && (
          <div style={{
            padding: '0.875rem 1rem',
            margin: '0.5rem 0.75rem 0.75rem',
            borderRadius: '12px',
            background: 'var(--ecare-primary-bg)',
            border: '1px solid var(--ecare-primary-light, rgba(26, 142, 110, 0.15))',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--ecare-text-muted)'
          }}>
            <div style={{ fontWeight: 800, color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
              <Buildings size={14} weight="bold" /> Support & Contact
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.3 }}>
              {(window.ecareConfig?.sitePhone || window.ecareConfig?.siteEmail) ? (
                <>
                  {window.ecareConfig?.sitePhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>Call:</span> 
                      <span style={{ color: '#475569', fontWeight: 500 }}>{window.ecareConfig.sitePhone}</span>
                    </div>
                  )}
                  {window.ecareConfig?.siteEmail && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>Email:</span> 
                      <span style={{ color: '#475569', wordBreak: 'break-all', fontWeight: 500 }}>{window.ecareConfig.siteEmail}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>Call:</span> 
                    <span style={{ color: '#475569', fontWeight: 500 }}>+1 (800) 555-0199</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>Email:</span> 
                    <span style={{ color: '#475569', wordBreak: 'break-all', fontWeight: 500 }}>support@e-care.com</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <NavItem 
          id="logout" icon={SignOut} label="Log Out" index={16}
          isCollapsed={isSidebarCollapsed}
          onClick={() => {
            useStore.getState().openConfirm({
              title: 'Sign Out',
              message: 'Are you sure you want to log out of your session?',
              confirmText: 'Sign Out',
              variant: 'danger',
              icon: <SignOut size={28} weight="fill" />,
              onConfirm: () => {
                const logoutUrl = window.ecareConfig?.logoutUrl || (window.location.origin + '/wp-login.php?action=logout&redirect_to=' + encodeURIComponent(window.location.origin + '/ecare-login'));
                window.location.href = logoutUrl;
              }
            })
          }}
          customStyle={{ color: '#ef4444' }}
        />
      </div>
    </motion.aside>
  )
}

export default Sidebar
