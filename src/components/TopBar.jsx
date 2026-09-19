import React, { useState, useRef, useEffect } from 'react'
import { List, Bell, MagnifyingGlass, User, Gear, Calendar, Flask, Truck, CreditCard, FirstAid, CheckCircle, Trash, House, ArrowLeft, VideoCamera, Phone, Broadcast, X } from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import useAuth from '../hooks/useAuth'

const NotificationIcon = ({ type }) => {
  switch(type) {
    case 'emergency': return <FirstAid size={16} weight="duotone" color="#ef4444" />;
    case 'appointment': return <Calendar size={16} weight="duotone" color="var(--ecare-primary)" />;
    case 'pharmacy': return <Flask size={16} weight="duotone" color="var(--ecare-primary-v2)" />;
    case 'ambulance': return <Truck size={16} weight="duotone" color="var(--ecare-primary-v3)" />;
    case 'billing': return <CreditCard size={16} weight="duotone" color="var(--ecare-primary-v4)" />;
    default: return <Bell size={16} weight="duotone" color="#64748b" />;
  }
}

const AnimatedText = ({ text, style, delay = 0, isHeader = false }) => {
  const words = text.split(' ')
  
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.015, delayChildren: delay },
    },
  }

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 150,
      },
    },
    hidden: {
      opacity: 0,
      y: 10,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 150,
      },
    },
  }

  const Component = isHeader ? motion.h2 : motion.p

  return (
    <Component
      style={{ display: 'flex', flexWrap: 'wrap', ...style }}
      variants={container}
      initial="hidden"
      animate="visible"
      key={text}
    >
      {words.map((word, wIndex) => (
        <span key={wIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {Array.from(word).map((letter, lIndex) => (
            <motion.span variants={child} key={lIndex} style={{ display: 'inline-block' }}>
              {letter}
            </motion.span>
          ))}
          {wIndex < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </Component>
  )
}

const TopBar = () => {
  const { user, notifications, markNotificationAsRead, markAllAsRead, clearNotifications, activePage, setActivePage, isSidebarCollapsed, setSidebarCollapsed } = useStore()
  const { isAdmin, canAccess } = useAuth()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const notifRef = useRef(null)

  // Smart notification click handler with role-aware and section-aware redirects
  const handleNotifClick = (notif) => {
    // 1. Mark notification as read
    markNotificationAsRead(notif.id);

    // 2. Identify redirect destination
    let targetPage = null;

    if (notif.id.startsWith('sys-doc-pending-')) {
      targetPage = 'pending-doctors';
    } else if (notif.id.startsWith('sys-cp-pending-')) {
      targetPage = 'care-pending';
    } else if (notif.id.startsWith('sys-amb-pending-')) {
      targetPage = 'ambulance-pending';
    } else if (notif.id.startsWith('sys-mv-pending-')) {
      targetPage = 'payment-verification';
    } else if (
      notif.id.startsWith('sys-ticket-open-') || 
      notif.id.startsWith('sys-ticket-msg-') || 
      notif.id.startsWith('sys-ticket-resolved-') || 
      notif.id.startsWith('sys-ticket-patient-reply-')
    ) {
      targetPage = 'support';
    } else if (
      notif.id.startsWith('sys-appt-pending-') || 
      notif.id.startsWith('sys-appt-today-') || 
      notif.id.startsWith('sys-doc-assigned-appt-') || 
      notif.id.startsWith('sys-appt-patient-conf-')
    ) {
      targetPage = 'appointments';
    } else if (notif.id.startsWith('sys-care-pending-booking-')) {
      targetPage = 'care-bookings';
    } else if (
      notif.id.startsWith('sys-amb-pending-booking-') || 
      notif.id.startsWith('sys-amb-patient-disp-')
    ) {
      targetPage = 'ambulance-bookings';
    } else if (
      notif.id.startsWith('sys-txn-unpaid-') || 
      notif.id.startsWith('sys-mv-patient-approved-') || 
      notif.id.startsWith('sys-mv-patient-rejected-')
    ) {
      targetPage = 'payment-invoices';
    } else if (
      notif.id.startsWith('sys-telemed-msg-') || 
      notif.id.startsWith('sys-telemed-msg-pat-')
    ) {
      targetPage = 'dashboard';
    } else {
      // Fallback redirection based on notification type metadata
      if (notif.type === 'billing') targetPage = user?.ecareRole === 'patient' ? 'payment-invoices' : 'payment-transactions';
      else if (notif.type === 'appointment') targetPage = 'appointments';
      else if (notif.type === 'ambulance') targetPage = 'ambulance-bookings';
      else if (notif.type === 'emergency') targetPage = 'support';
    }

    // 3. Set the active page and collapse dropdown
    if (targetPage) {
      setActivePage(targetPage);
    }
    setIsNotifOpen(false);
  };

  const safeNotifs = Array.isArray(notifications) ? notifications : []
  const unreadCount = safeNotifs.filter(n => !n.read).length
  const isDoctor = user?.ecareRole === 'doctor'

  const { doctorConsultationStatus, doctorInstantCallStatus, toggleDoctorConsultation, toggleInstantCall, doctorList, patients } = useStore()

  // Dynamic Avatar Resolution
  const userAvatar = React.useMemo(() => {
    // 1. Check if user already has a custom avatar in the store
    if (user?.avatar && !user.avatar.includes('dicebear.com')) return user.avatar;

    // 2. Resolve from Doctor List
    if (user?.ecareRole === 'doctor') {
      const doc = (doctorList || []).find(d => parseInt(d.user_id) === parseInt(user.id));
      if (doc?.avatar) return doc.avatar;
    } 
    // 3. Resolve from Patient List
    else if (user?.ecareRole === 'patient') {
      const pat = (patients || []).find(p => parseInt(p.user_id) === parseInt(user.id));
      if (pat?.avatar) return pat.avatar;
    }

    // 4. Fallback to placeholder with name seed
    return user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Sullivan'}`;
  }, [user, doctorList, patients]);

  const topBarNotifId = useRef(`ecare-topbar-notif-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const handleClickOutside = (event) => {
      const path = event.composedPath ? event.composedPath() : []
      if (notifRef.current && !path.includes(notifRef.current) && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false)
      }
    }
    const handleCloseOther = (e) => {
      if (e.detail?.sourceId !== topBarNotifId.current) {
        if (notifRef.current && e.detail?.target && notifRef.current.contains(e.detail.target)) {
          return
        }
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    window.addEventListener('ecare:close-dropdowns', handleCloseOther)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('ecare:close-dropdowns', handleCloseOther)
    }
  }, [])

  const getPageHeader = () => {
    const { editingDoctor, editingPatient } = useStore.getState()
    
    switch(activePage) {
      // Dashboard
      case 'dashboard': 
        if (user.ecareRole === 'doctor') return { title: 'Clinical Workspace', desc: 'Manage your patient consultations and daily schedule.' };
        if (user.ecareRole === 'patient') return { title: 'Health Overview', desc: 'Track your medical journey and wellness metrics.' };
        return { title: 'Overview Dashboard', desc: 'Real-time clinic analytics and operations.' };

      // Doctors
      case 'doctor-list': return { title: 'Doctor Directory', desc: 'Manage clinical staff, specialties, and statuses.' };
      case 'pending-doctors': return { title: 'Doctor Approvals', desc: 'Review and verify pending doctor registrations.' };
      case 'add-doctor': return { title: editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor', desc: 'Register specialized medical professionals.' };

      // Patients
      case 'patient-list': return { title: 'Patient Directory', desc: 'View and manage patient health records.' };
      case 'add-patient': return { title: editingPatient ? 'Edit Patient Record' : 'Patient Registration', desc: 'Enroll new patients into the management system.' };

      // Appointments
      case 'appointments': 
      case 'appointment-list':
        return { 
          title: user.ecareRole === 'patient' ? 'My Appointments' : 'Appointment Calendar', 
          desc: user.ecareRole === 'patient' ? 'Track your scheduled visits and medical consultations.' : 'Manage clinical schedules and bookings.' 
        };

      // Care Providers
      case 'care-bookings': return { 
        title: user.ecareRole === 'patient' ? 'My Home Care' : 'Care Bookings', 
        desc: user.ecareRole === 'patient' ? 'Track your ongoing and scheduled home-care sessions.' : 'Monitor and coordinate home-care services.' 
      };
      case 'care-list': return { title: 'Care Providers', desc: 'Management of home care, nursing, and specialized staff.' };
      case 'care-providers': return { title: 'Provider Registration', desc: 'Register new home-care providers to the platform.' };
      case 'care-pending': return { title: 'Provider Approvals', desc: 'Review and verify credentials for new care providers.' };

      // Ambulance
      case 'ambulance-bookings': return { 
        title: user.ecareRole === 'patient' ? 'My Emergency Requests' : 'Ambulance Dispatch', 
        desc: user.ecareRole === 'patient' ? 'Status of your ambulance dispatch and mission tracking.' : 'Emergency dispatch, fleet management, and tracking.' 
      };
      case 'ambulance-list': return { title: 'Fleet Inventory', desc: 'Manage active ambulance units and assigned operators.' };
      case 'ambulance-register': return { title: 'Fleet Registration', desc: 'Register new vehicles and ambulance drivers.' };
      case 'ambulance-pending': return { title: 'Driver Verifications', desc: 'Review and authorize pending driver certifications.' };

      // Catalog
      case 'departments': return { title: 'Medical Specialities', desc: 'Manage clinical departments and specialities.' };
      case 'services': return { title: 'Clinical Services', desc: 'Manage specialized medical services and pricing.' };

      // Staff
      case 'staff': return { title: 'Staff Management', desc: 'Manage clinic administration and support staff.' };

      // Payment
      case 'payment-dashboard': return { title: 'Financial Overview', desc: 'Track revenue, payments, and financial performance.' };
      case 'payment-transactions': return { title: 'Transaction Logs', desc: 'Detailed history of all financial transactions.' };
      case 'payment-invoices': return { title: 'Invoice Management', desc: 'Generate and manage clinical billing invoices.' };
      case 'payment-refunds': return { title: 'Refund Requests', desc: 'Process and monitor transaction refunds.' };
      case 'add-appointment': {
        const { editingAppointment } = useStore.getState();
        return { 
          title: editingAppointment ? 'Modify Clinical Session' : 'New Clinical Booking', 
          desc: 'Create or update medical consultation records' 
        };
      }
      case 'payment-verification': return { title: 'Manual Verification', desc: 'Verify offline and pending payment transfers.' };

      // Lab
      case 'lab-orders':
        return { 
          title: user.ecareRole === 'patient' ? 'My Diagnostic Reports' : 'Lab Orders', 
          desc: user.ecareRole === 'patient' ? 'Access and download your medical lab test results.' : 'Track and manage clinical laboratory orders.' 
        };
      case 'lab-catalog': return { title: 'Lab Catalog', desc: 'Browse available diagnostic tests and services.' };
      case 'lab-locations': return { title: 'Diagnostic Centers', desc: 'Available lab facilities and sample collection points.' };

      // System
      case 'settings': return { title: 'System Settings', desc: 'Configure clinic rules, payments, and global parameters.' };
      case 'admin': return { title: 'Admin Panel', desc: 'Manage system users and access permissions.' };

      default: return { title: 'E-CARE System', desc: 'Clinic Management Portal' };
    }
  }

  const headerInfo = getPageHeader()

  return (
    <header className="ecare-header">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="ecare-mobile-toggle"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#475569',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            marginRight: '0.25rem',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
        >
          <List size={24} weight="bold" />
        </button>
        {!isDoctor && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <AnimatedText 
              text={headerInfo.title} 
              isHeader 
              style={{ 
                fontSize: 'var(--ecare-header-title-size, 1.25rem)', 
                fontWeight: 700, 
                color: 'var(--ecare-text-main)', 
                margin: '0 0 0.125rem 0',
                lineHeight: 1.2
              }} 
            />
            <AnimatedText 
              text={headerInfo.desc} 
              delay={0.2}
              style={{ 
                fontSize: 'var(--ecare-header-desc-size, 0.8125rem)', 
                color: 'var(--ecare-text-muted)', 
                margin: 0, 
                fontWeight: 400 
              }} 
            />
          </div>
        )}
      </div>

      <div className="ecare-header-right">

        <motion.button 
          onClick={() => window.location.href = window.ecareConfig?.siteUrl || '/'}
          whileHover={{ backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }}
          whileTap={{ scale: 0.95 }}
          title="Go to Home"
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s'
          }}
        >
          <House size={20} weight="bold" />
        </motion.button>

        <div style={{ position: 'relative' }} ref={notifRef}>
          <motion.button 
            onClick={(e) => {
              e.stopPropagation()
              if (!isNotifOpen) {
                window.dispatchEvent(new CustomEvent('ecare:close-dropdowns', {
                  detail: { sourceId: topBarNotifId.current, target: notifRef.current }
                }))
                setIsNotifOpen(true)
              } else {
                setIsNotifOpen(false)
              }
            }}
            whileHover={{ backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: isNotifOpen ? '#f1f5f9' : '#f8fafc',
              border: '1px solid',
              borderColor: isNotifOpen ? '#cbd5e1' : '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.2s'
            }}
          >
            <Bell size={20} weight="bold" />
            {unreadCount > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{ 
                  position: 'absolute', 
                  top: '6px', 
                  right: '6px', 
                  width: '8px', 
                  height: '8px', 
                  background: '#ef4444', 
                  borderRadius: '50%', 
                  border: '1.5px solid white',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
                }} 
              />
            )}
          </motion.button>

          <AnimatePresence>
            {isNotifOpen && (
              <>
                {/* Mobile Backdrop */}
                <motion.div
                  key="notif-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="ecare-notif-backdrop"
                  onClick={() => setIsNotifOpen(false)}
                />

                <motion.div
                  key="notif-panel"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="ecare-notif-dropdown"
                >
                  <div className="ecare-notif-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span style={{ background: '#ef4444', color: 'white', fontSize: '0.625rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px' }}>
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} 
                        disabled={unreadCount === 0}
                        title="Mark all as read"
                        style={{ 
                          background: 'none', border: 'none', 
                          color: unreadCount > 0 ? 'var(--ecare-primary)' : '#94a3b8', 
                          fontSize: '0.75rem', fontWeight: 600, 
                          cursor: unreadCount > 0 ? 'pointer' : 'default', 
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          opacity: unreadCount > 0 ? 1 : 0.5,
                          padding: '4px 6px',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}>
                        <CheckCircle size={15} weight={unreadCount > 0 ? "bold" : "regular"} /> 
                        <span className="ecare-notif-btn-text">Mark all read</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); clearNotifications(); }} 
                        disabled={notifications.length === 0}
                        title="Clear all notifications"
                        style={{ 
                          background: 'none', border: 'none', color: '#94a3b8', 
                          cursor: notifications.length > 0 ? 'pointer' : 'default', 
                          display: 'flex', alignItems: 'center',
                          opacity: notifications.length > 0 ? 1 : 0.5,
                          padding: '4px 6px',
                          borderRadius: '6px',
                          transition: 'all 0.2s'
                        }}>
                        <Trash size={16} weight="bold" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsNotifOpen(false); }}
                        className="ecare-notif-close-mobile-btn"
                        title="Close notifications"
                      >
                        <X size={18} weight="bold" />
                      </button>
                    </div>
                  </div>

                  <div className="ecare-notif-body">
                    {safeNotifs.length === 0 ? (
                      <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                        <Bell size={40} weight="duotone" style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <div style={{ fontWeight: 500 }}>All caught up!</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>You have no new notifications.</div>
                      </div>
                    ) : (
                      safeNotifs.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={(e) => { e.stopPropagation(); handleNotifClick(notif); }}
                          className={`ecare-notif-item ${notif.read ? 'read' : 'unread'}`}
                          style={{ 
                            background: notif.read ? 'white' : '#f0f9ff'
                          }}
                        >
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '50%', 
                            background: notif.read ? '#f8fafc' : 'white',
                            border: notif.read ? '1px solid #e2e8f0' : 'none',
                            boxShadow: notif.read ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <NotificationIcon type={notif.type} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: notif.read ? 600 : 700, color: 'var(--ecare-text-main)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                                {notif.title}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>
                                {notif.time}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--ecare-text-muted)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                              {notif.description}
                            </div>
                          </div>
                          {!notif.read && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ecare-primary)', marginTop: '6px', flexShrink: 0 }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div style={{ height: '24px', width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />

        {isDoctor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginRight: '1rem' }}>
            {/* Live Consultation Toggle */}
            <div 
              onClick={() => toggleDoctorConsultation()}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.875rem', 
                borderRadius: '12px', background: doctorConsultationStatus ? 'var(--ecare-primary-bg)' : '#f1f5f9',
                border: `1px solid ${doctorConsultationStatus ? 'var(--ecare-primary-border)' : '#e2e8f0'}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                width: '8px', height: '8px', borderRadius: '50%', 
                background: doctorConsultationStatus ? 'var(--ecare-primary)' : '#94a3b8',
                boxShadow: doctorConsultationStatus ? '0 0 8px var(--ecare-primary)' : 'none'
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <VideoCamera size={16} weight="bold" color={doctorConsultationStatus ? 'var(--ecare-primary)' : '#64748b'} />
                <span className="ecare-toggle-label" style={{ fontSize: '0.8125rem', fontWeight: 700, color: doctorConsultationStatus ? 'var(--ecare-primary)' : '#64748b' }}>
                  Live Consult
                </span>
              </div>
            </div>

            {/* Instant Call Toggle */}
            <div 
              onClick={() => toggleInstantCall()}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.875rem', 
                borderRadius: '12px', background: doctorInstantCallStatus ? '#fff7ed' : '#f1f5f9',
                border: `1px solid ${doctorInstantCallStatus ? '#ffedd5' : '#e2e8f0'}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Phone size={16} weight="bold" color={doctorInstantCallStatus ? '#f97316' : '#64748b'} />
                <span className="ecare-toggle-label" style={{ fontSize: '0.8125rem', fontWeight: 700, color: doctorInstantCallStatus ? '#f97316' : '#64748b' }}>
                  Instant Call
                </span>
              <div style={{ 
                width: '32px', height: '18px', borderRadius: '10px', background: doctorInstantCallStatus ? '#f97316' : '#cbd5e1',
                position: 'relative', transition: 'all 0.2s'
              }}>
                <div style={{ 
                  width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                  position: 'absolute', top: '2px', left: doctorInstantCallStatus ? '16px' : '2px',
                  transition: 'all 0.2s'
                }} />
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="ecare-user-meta" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ecare-text-main)', lineHeight: 1.2 }}>
              {user?.name || 'Guest User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', textTransform: 'capitalize' }}>
              {user?.ecareRole || 'Visitor'}
            </div>
          </div>
          
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            cursor: 'pointer'
          }}>
            <img 
              src={userAvatar} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {(isAdmin || canAccess('settings')) && (
            <motion.button
              onClick={() => setActivePage('settings')}
              whileHover={{ backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s'
              }}
            >
              <Gear size={20} weight="bold" />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar
