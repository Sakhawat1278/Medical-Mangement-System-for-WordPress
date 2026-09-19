import React, { useMemo } from 'react'
import { 
  Calendar, Clock, Activity, CreditCard, 
  ArrowUpRight, ClipboardText, UserCircle, 
  Flask, Heartbeat, Prescription, MapPin, 
  FirstAid, Bell, HouseLine, ShieldCheck,
  TrendUp, ArrowRight, IdentificationCard,
  Truck, DownloadSimple, Receipt, Buildings, VideoCamera, ChatCenteredText,
  Drop, Heart, X, Plus
} from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import MedicalVault from '../components/MedicalVault'
import ChartFrame from '../components/ChartFrame'
import { Portal } from '../utils/portal'
import toast from 'react-hot-toast'
import { 
  PieChart, Pie, Cell, Tooltip
} from 'recharts'

// ─── Standard Components ─────────────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, trend, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ borderColor: 'var(--ecare-primary)' }}
    className="ecare-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} weight="duotone" />
      </div>
      {trend && (
        <div style={{ color: 'var(--ecare-primary)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          {trend} <ArrowUpRight size={12} weight="bold" style={{ marginLeft: '2px' }} />
        </div>
      )}
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)

const getTimeValue = (value) => {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isNaN(ts) ? 0 : ts
}

const formatShortDate = (value, fallback = '—') => {
  const ts = getTimeValue(value)
  if (!ts) return fallback
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatShortDateTime = (dateValue, timeValue) => {
  const datePart = formatShortDate(dateValue, '')
  if (!datePart && !timeValue) return '—'
  return [datePart, timeValue].filter(Boolean).join(' • ')
}

const getAppointmentTimestamp = (dateValue, timeValue) => {
  if (!dateValue) return 0

  const timeText = String(timeValue || '').trim()
  let hours = 0
  let minutes = 0

  const twentyFourHour = timeText.match(/^(\d{1,2}):(\d{2})$/)
  const twelveHour = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)

  if (twentyFourHour) {
    hours = parseInt(twentyFourHour[1], 10)
    minutes = parseInt(twentyFourHour[2], 10)
  } else if (twelveHour) {
    hours = parseInt(twelveHour[1], 10) % 12
    minutes = parseInt(twelveHour[2], 10)
    if (twelveHour[3].toUpperCase() === 'PM') hours += 12
  }

  const ts = new Date(`${dateValue}T00:00:00`).getTime()
  if (Number.isNaN(ts)) return 0
  return ts + ((hours * 60 + minutes) * 60 * 1000)
}

const PatientDashboard = () => {
  const { 
    user, appointments, labOrders, careProviderBookings, 
    ambulanceBookings, transactions, currencySymbol, setActivePage,
    supportTickets, supportMessages,
    bloodInventory, bloodDonors, bloodRequests, addBloodRequest
  } = useStore()

  const [activeTab, setActiveTab] = React.useState('Overview')
  const [now] = React.useState(() => Date.now())

  // Blood Request Modal State
  const [isBloodRequestModalOpen, setIsBloodRequestModalOpen] = React.useState(false)
  const [isSubmittingBloodReq, setIsSubmittingBloodReq] = React.useState(false)
  const [bloodRequestForm, setBloodRequestForm] = React.useState({
    blood_group: 'O+',
    units_required: 1,
    urgency: 'Urgent',
    hospital_name: '',
    contact_phone: user?.phone || user?.contact_number || '',
    component: 'Whole Blood',
    notes: ''
  })

  // 1. Filtering Logic - Scope data to the current patient
  const currentUserId = String(user?.id || '')
  const myAppointments = useMemo(() => (appointments || []).filter(a => String(a.patient_user_id) === currentUserId), [appointments, currentUserId])
  const myLabOrders = useMemo(() => (labOrders || []).filter(o => String(o.patient_user_id) === currentUserId), [labOrders, currentUserId])
  const myHomeCare = useMemo(() => (careProviderBookings || []).filter(b => String(b.patient_user_id) === currentUserId), [careProviderBookings, currentUserId])
  const myAmbulanceBookings = useMemo(() => (ambulanceBookings || []).filter(b => String(b.patient_user_id) === currentUserId), [ambulanceBookings, currentUserId])
  const myBilling = useMemo(() => (transactions || []).filter(t => String(t.patient_user_id) === currentUserId), [transactions, currentUserId])
  const mySupportTickets = useMemo(() => (Array.isArray(supportTickets) ? supportTickets : []).filter(t => String(t.user_id) === currentUserId), [supportTickets, currentUserId])
  const mySupportMessages = useMemo(() => {
    const ticketIds = new Set(mySupportTickets.map(t => String(t.id)))
    return (Array.isArray(supportMessages) ? supportMessages : []).filter(m => ticketIds.has(String(m.ticket_id)))
  }, [supportMessages, mySupportTickets])

  const myBloodRequests = useMemo(() => {
    return (bloodRequests || []).filter(r => 
      String(r.patient_user_id) === currentUserId || 
      (user?.name && (r.patient_name === user.name || r.requester_name === user.name)) ||
      (user?.phone && r.contact_phone === user.phone)
    )
  }, [bloodRequests, currentUserId, user?.name, user?.phone])

  const myDonorProfile = useMemo(() => {
    return (bloodDonors || []).find(d => 
      String(d.patient_user_id) === currentUserId ||
      (user?.email && d.email === user.email) ||
      (user?.phone && d.contact_number === user.phone) ||
      (user?.name && d.name === user.name)
    )
  }, [bloodDonors, currentUserId, user?.email, user?.phone, user?.name])

  const bloodSummaryByGroup = useMemo(() => {
    const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    const counts = {}
    groups.forEach(g => counts[g] = 0)
    ;(bloodInventory || []).filter(b => b.status === 'Available').forEach(b => {
      if (counts[b.blood_group] !== undefined) counts[b.blood_group]++
    })
    return counts
  }, [bloodInventory])

  const handleQuickBloodRequest = async (e) => {
    e.preventDefault()
    if (!bloodRequestForm.hospital_name.trim()) {
      toast.error('Please enter the hospital or clinical center name')
      return
    }
    if (!bloodRequestForm.contact_phone.trim()) {
      toast.error('Please enter contact telephone number')
      return
    }

    setIsSubmittingBloodReq(true)
    try {
      await addBloodRequest({
        ...bloodRequestForm,
        patient_user_id: user?.id,
        patient_name: user?.name,
        requester_name: user?.name,
        status: 'Pending',
        request_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      toast.success('Blood requisition submitted! Staff is reviewing available inventory.')
      setIsBloodRequestModalOpen(false)
      setBloodRequestForm({
        blood_group: 'O+',
        units_required: 1,
        urgency: 'Urgent',
        hospital_name: '',
        contact_phone: user?.phone || user?.contact_number || '',
        component: 'Whole Blood',
        notes: ''
      })
    } catch (err) {
      toast.error('Failed to submit blood request')
    } finally {
      setIsSubmittingBloodReq(false)
    }
  }

  // Stats Calculations
  const upcomingAppt = useMemo(() => {
    return [...myAppointments]
      .filter(a => !['Cancelled', 'Completed', 'Expired', 'Closed'].includes(a.status))
      .sort((a, b) => {
        const aTs = getAppointmentTimestamp(a.date || a.appointment_date || a.created_at, a.time || a.appointment_time || a.slot)
        const bTs = getAppointmentTimestamp(b.date || b.appointment_date || b.created_at, b.time || b.appointment_time || b.slot)
        return aTs - bTs
      })
      .find(a => getAppointmentTimestamp(a.date || a.appointment_date || a.created_at, a.time || a.appointment_time || a.slot) >= now) || null
  }, [myAppointments, now])
  const openBillingStatuses = new Set(['Pending', 'Partially Paid', 'Due', 'Under Verify'])
  const pendingBills = myBilling.filter(b => openBillingStatuses.has(b.status))
  const totalOutstanding = pendingBills.reduce((sum, b) => sum + (Number(b.amount) - (Number(b.paidAmount) || 0)), 0)
  const pendingBillTotal = pendingBills.reduce((sum, b) => sum + (Number(b.amount) - (Number(b.paidAmount) || 0)), 0)
  const paymentLabel = pendingBills.length > 0 ? 'Open Invoice Registry' : 'View Invoice History'
  const recentVisits = useMemo(() => {
    return [...myAppointments]
      .filter(a => a.status !== 'Cancelled')
      .sort((a, b) => {
        const aTs = getAppointmentTimestamp(a.date || a.appointment_date || a.created_at, a.time || a.appointment_time || a.slot)
        const bTs = getAppointmentTimestamp(b.date || b.appointment_date || b.created_at, b.time || b.appointment_time || b.slot)
        return bTs - aTs
      })
      .slice(0, 5)
  }, [myAppointments])
  const recentLabOrders = useMemo(() => {
    return [...myLabOrders]
      .sort((a, b) => getTimeValue(b.order_date || b.date || b.created_at) - getTimeValue(a.order_date || a.date || a.created_at))
      .slice(0, 4)
  }, [myLabOrders])
  const recentInvoices = useMemo(() => {
    return [...myBilling]
      .sort((a, b) => getTimeValue(b.created_at || b.date || b.invoice_date) - getTimeValue(a.created_at || a.date || a.invoice_date))
      .slice(0, 4)
  }, [myBilling])
  const recentBookings = useMemo(() => {
    const items = []

    myAppointments.forEach(item => {
      items.push({
        id: `appt-${item.id}`,
        kind: 'Visit',
        title: item.doctorName || item.doctor_name || 'Clinic visit',
        meta: item.specialty || item.department || 'Appointment',
        status: item.status || 'Scheduled',
        dateValue: item.date || item.appointment_date || item.created_at,
        timeValue: item.time || item.appointment_time || item.slot,
        accent: '#2563eb',
        icon: Calendar,
        page: 'appointments'
      })
    })

    myLabOrders.forEach(item => {
      items.push({
        id: `lab-${item.id}`,
        kind: 'Lab',
        title: item.test_name || item.lab_test_name || 'Lab booking',
        meta: item.location || item.lab_location || 'Lab order',
        status: item.status || 'Pending',
        dateValue: item.order_date || item.date || item.created_at,
        timeValue: item.time || item.booking_time,
        accent: '#db2777',
        icon: Flask,
        page: 'lab-orders'
      })
    })

    myHomeCare.forEach(item => {
      items.push({
        id: `care-${item.id}`,
        kind: 'Home Care',
        title: item.provider_name || item.care_provider_name || item.service_name || 'Home care booking',
        meta: item.service_type || item.package_name || 'Nursing support',
        status: item.status || 'Scheduled',
        dateValue: item.booking_date || item.date || item.created_at,
        timeValue: item.time || item.booking_time,
        accent: '#059669',
        icon: HouseLine,
        page: 'care-bookings'
      })
    })

    myAmbulanceBookings.forEach(item => {
      items.push({
        id: `ambulance-${item.id}`,
        kind: 'Ambulance',
        title: item.type || item.vehicleType || 'Ambulance request',
        meta: item.location || item.pickup_location || 'Dispatch request',
        status: item.status || 'Requested',
        dateValue: item.created_at || item.dispatch_time || item.time,
        timeValue: '',
        accent: '#ef4444',
        icon: Truck,
        page: 'ambulance-bookings'
      })
    })

    return items
      .sort((a, b) => getTimeValue(b.dateValue) - getTimeValue(a.dateValue))
      .slice(0, 6)
  }, [myAppointments, myLabOrders, myHomeCare, myAmbulanceBookings])
  const recentSupportThreads = useMemo(() => {
    return mySupportTickets
      .map(ticket => {
        const messages = mySupportMessages
          .filter(message => String(message.ticket_id) === String(ticket.id))
          .sort((a, b) => getTimeValue(a.created_at) - getTimeValue(b.created_at))
        const lastMessage = messages[messages.length - 1]
        return {
          ...ticket,
          lastMessage: lastMessage?.message || ticket.initial_message || 'No message yet',
          updatedAt: lastMessage?.created_at || ticket.updated_at || ticket.created_at,
          messageCount: messages.length
        }
      })
      .sort((a, b) => getTimeValue(b.updatedAt) - getTimeValue(a.updatedAt))
      .slice(0, 4)
  }, [mySupportTickets, mySupportMessages])
  const tabButtonStyle = (tab) => ({
    padding: '0.6rem 1rem',
    borderRadius: '999px',
    border: `1.5px solid ${activeTab === tab ? 'var(--ecare-primary)' : '#e2e8f0'}`,
    background: activeTab === tab ? 'var(--ecare-primary-bg)' : '#fff',
    color: activeTab === tab ? 'var(--ecare-primary)' : '#475569',
    fontSize: '0.75rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  })

  // Distribution Data
  const activityDistribution = [
    { name: 'Appointments', value: myAppointments.length, color: '#2563eb' },
    { name: 'Lab Tests', value: myLabOrders.length, color: '#db2777' },
    { name: 'Home Care', value: myHomeCare.length, color: '#059669' },
    { name: 'Ambulance', value: myAmbulanceBookings.length, color: '#ef4444' },
    { name: 'Blood Requests', value: myBloodRequests.length, color: '#dc2626' },
  ]

  const healthTrend = [] // Obsolete

  return (
    <div className="ecare-patient-dashboard ecare-dashboard-page">
      
      {/* 1. Stat Grid - Standardized to Admin layout but with Patient Data */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 5, '--stat-grid-cols-md': 3 }}>
        <StatCard title="Upcoming Visit" value={upcomingAppt ? formatShortDate(upcomingAppt.date || upcomingAppt.appointment_date || upcomingAppt.created_at) : "None"} icon={Calendar} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Lab Bookings" value={myLabOrders.length} icon={Flask} color="var(--ecare-primary-v2)" delay={0.2} />
        <StatCard title="Home Care" value={myHomeCare.filter(h => h.status === 'Active').length} icon={HouseLine} color="var(--ecare-primary-v3)" delay={0.3} />
        <StatCard title="Total Bills" value={myBilling.length} icon={Receipt} color="var(--ecare-primary-hover)" delay={0.4} />
        <StatCard title="Outstanding" value={`${currencySymbol}${totalOutstanding.toLocaleString()}`} icon={CreditCard} color="var(--ecare-primary-v4)" delay={0.5} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setActiveTab('Overview')} style={tabButtonStyle('Overview')}>
          Overview
        </button>
        <button type="button" onClick={() => setActiveTab('Payments')} style={tabButtonStyle('Payments')}>
          Payments
        </button>
      </div>

      {activeTab === 'Overview' ? (
        <>
          {/* 2. Main Analytics Row */}
          <div className="ecare-dashboard-grid-2col">
            
            {/* Quick Services Grid - Replaced Wellness Chart */}
            <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
               <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1.25rem' }}>Quick Medical Services</h3>
               <div className="ecare-patient-services-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem' }}>
                  {[
                    { title: 'Video Consult', icon: VideoCamera, color: '#2563eb', desc: 'Expert doctors online', link: '/doctor-appointment', page: 'doctor-appointment' },
                    { title: 'Clinic Visit', icon: Buildings, color: '#7c3aed', desc: 'Book physical visit', link: '/doctor-appointment', page: 'doctor-appointment' },
                    { title: 'Lab Tests', icon: Flask, color: '#db2777', desc: 'Accurate clinical results', link: '/lab-test-booking', page: 'lab-orders' },
                    { title: 'Nursing Care', icon: HouseLine, color: '#059669', desc: 'In-home care support', link: '/home-care-booking', page: 'care-bookings' },
                    { title: 'Blood Bank', icon: Drop, color: '#dc2626', desc: 'Find blood & donors', link: '/blood-bank', page: 'blood-bank' }
                  ].map((svc, i) => (
                    <motion.div
                      key={i}
                      onClick={() => svc.page ? setActivePage(svc.page) : window.open(window.location.origin + svc.link, '_blank')}
                      whileHover={{ y: -4, boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)' }}
                      className="ecare-service-card"
                      style={{ cursor: 'pointer', padding: '0.85rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}
                    >
                      <div style={{ 
                        width: '42px', height: '42px', borderRadius: '12px', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem',
                        color: svc.color, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                      }}>
                        <svc.icon size={24} weight="duotone" />
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ecare-text-main)', marginBottom: '4px' }}>{svc.title}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--ecare-text-muted)', fontWeight: 600, lineHeight: 1.3 }}>{svc.desc}</div>
                    </motion.div>
                  ))}
               </div>
            </div>

            {/* Clinical Service Mix */}
            <div className="ecare-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Medical Service Mix</h3>
              <ChartFrame
                height={160}
                render={({ width, height }) => (
                  <>
                    <PieChart width={width} height={height}>
                      <Pie data={activityDistribution} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {activityDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>{activityDistribution.reduce((a, b) => a + b.value, 0)}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>SERVICES</div>
                    </div>
                  </>
                )}
              />
              <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {activityDistribution.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ecare-text-muted)' }}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Actionable Patient Features Grid */}
          <div className="ecare-patient-actions-grid-2col">
        
        {/* Next Visit Module */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="ecare-card" 
          style={{ display: 'flex', flexDirection: 'column', minHeight: '200px', padding: '1.25rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
             <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--ecare-text-main)' }}>Next Scheduled Visit</h4>
             {upcomingAppt && <span className="ecare-badge-success" style={{ fontSize: '0.65rem' }}>CONFIRMED</span>}
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {upcomingAppt ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                <div style={{ 
                  padding: '0.75rem', borderRadius: '14px', 
                  background: 'linear-gradient(135deg, var(--ecare-primary) 0%, var(--ecare-primary-v2) 100%)', 
                  textAlign: 'center', minWidth: '64px', color: 'white',
                  boxShadow: '0 8px 16px var(--ecare-primary-shadow)'
                }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.9, textTransform: 'uppercase' }}>
                    {new Date(upcomingAppt.date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>{new Date(upcomingAppt.date).getDate()}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>Dr. {upcomingAppt.doctorName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={14} weight="bold" /> {upcomingAppt.specialty}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ecare-primary)', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} weight="bold" /> {upcomingAppt.time}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.5 }}>
                <Calendar size={40} weight="duotone" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>No upcoming appointments.</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button 
              onClick={() => setActivePage('add-appointment')}
              style={{ 
                flex: 1, padding: '0.75rem', borderRadius: '10px', 
                background: 'var(--ecare-primary)', color: 'white', border: 'none', 
                fontWeight: 800, cursor: 'pointer', fontSize: '0.8125rem',
                transition: 'all 0.2s', boxShadow: '0 4px 12px var(--ecare-primary-shadow)'
              }}
            >
              Book New Visit
            </button>
            <button 
              onClick={() => setActivePage('appointments')}
              className="ecare-btn-secondary"
              style={{ 
                padding: '0.75rem 1rem', borderRadius: '10px', 
                fontWeight: 700, fontSize: '0.8125rem'
              }}
            >
              My Appointments
            </button>
          </div>
        </motion.div>

        {/* Lab Test Bookings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ecare-card" 
          style={{ display: 'flex', flexDirection: 'column', minHeight: '200px', padding: '1.25rem' }}
        >
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--ecare-text-main)' }}>Lab Test Bookings</h4>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentLabOrders.map((order, i) => {
              const getStatusStyle = (status) => {
                const colors = { Pending:'#f59e0b', 'Sample Collected':'#0891b2', Processing:'#7c3aed', Completed:'var(--ecare-primary)', Cancelled:'#ef4444' }
                const bgs = { Pending:'#fffbeb', 'Sample Collected':'#ecfeff', Processing:'#faf5ff', Completed:'var(--ecare-primary-bg)', Cancelled:'#fef2f2' }
                return {
                  color: colors[status] || '#64748b',
                  background: bgs[status] || '#f1f5f9',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }
              }
              return (
                <div key={i} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '0.75rem', background: 'var(--ecare-bg-soft)', borderRadius: '12px',
                  border: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flask size={18} weight="duotone" color="#8b5cf6" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{order.test_name}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--ecare-text-muted)' }}>{order.order_date || order.date}</div>
                    </div>
                  </div>
                  <span style={getStatusStyle(order.status)}>{order.status}</span>
                </div>
              )
            })}
            {recentLabOrders.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexDirection: 'column' }}>
                <Flask size={32} weight="duotone" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.75rem', margin: 0 }}>No lab bookings available.</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActivePage('lab-orders')} 
            className="ecare-btn-secondary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.75rem' }}
          >
            View All Bookings
          </button>
        </motion.div>

      </div>
        </>
      ) : (
        <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>Payments & Invoices</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '0.35rem 0 0' }}>
                Review pending invoices and open the invoice registry when you need to settle a balance.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Pending</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ecare-text-main)' }}>{pendingBills.length}</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: '#fff1f2', border: '1px solid #ffe4e6' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>Due</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ef4444' }}>{currencySymbol}{pendingBillTotal.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {pendingBills.slice(0, 2).map((bill, i) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '0.9rem', background: '#fff1f2', borderRadius: '12px',
                border: '1px solid #ffe4e6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Receipt size={18} weight="duotone" color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>#{bill.invoiceNo || bill.invoiceNumber || String(bill.id).slice(0, 8).toUpperCase()}</div>
                    <div style={{ fontSize: '0.6rem', color: '#b91c1c' }}>Outstanding balance</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#ef4444' }}>{currencySymbol}{(Number(bill.amount) - (Number(bill.paidAmount) || 0)).toLocaleString()}</div>
              </div>
            ))}
            {pendingBills.length === 0 && (
              <div style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexDirection: 'column', border: '1px dashed #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                <ShieldCheck size={32} weight="duotone" style={{ marginBottom: '0.5rem', color: '#10b981' }} />
                <p style={{ fontSize: '0.75rem', margin: 0 }}>No pending invoices.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActivePage('payment-invoices')} 
            className="ecare-btn" 
            style={{ 
              width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', 
              background: '#1e1b4b', color: 'white', border: 'none', 
              fontWeight: 800, cursor: 'pointer', fontSize: '0.8125rem',
              transition: 'all 0.2s'
            }}
          >
            {paymentLabel}
          </button>
        </div>
      )}

      {activeTab === 'Overview' && (
        <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

          <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>Prescriptions & Lab Reports</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '0.35rem 0 0' }}>View documents shared with you by the clinic.</p>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <MedicalVault
                patientUserId={user?.id}
                canUpload={false}
                canDelete={false}
                readOnly
              />
            </div>
          </div>

          <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>Invoices</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '0.35rem 0 0' }}>Recent billing records and outstanding balances.</p>
              </div>
              <button onClick={() => setActivePage('payment-invoices')} className="ecare-btn" style={{ borderRadius: '10px', padding: '0.55rem 0.9rem', fontSize: '0.75rem', fontWeight: 800 }}>
                Open Registry
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {recentInvoices.map((bill) => {
                const balance = Number(bill.amount) - (Number(bill.paidAmount) || 0)
                const paid = balance <= 0
                return (
                  <div key={bill.id} className="ecare-flex-responsive" style={{ padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: paid ? '#f8fafc' : '#fff1f2', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>#{bill.invoiceNo || bill.invoiceNumber || String(bill.id).slice(0, 8).toUpperCase()}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', marginTop: '2px' }}>{formatShortDate(bill.created_at || bill.date || bill.invoice_date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: paid ? '#059669' : '#ef4444' }}>{currencySymbol}{Math.max(balance, 0).toLocaleString()}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: paid ? '#059669' : '#b91c1c', textTransform: 'uppercase' }}>{paid ? 'Paid' : 'Due'}</div>
                    </div>
                  </div>
                )
              })}
              {recentInvoices.length === 0 && (
                <div style={{ padding: '1rem', borderRadius: '12px', border: '1px dashed #e2e8f0', color: 'var(--ecare-text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                  No invoices found.
                </div>
              )}
            </div>
          </div>

          <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>Bookings</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '0.35rem 0 0' }}>Visits, lab orders, care support, and ambulance requests.</p>
              </div>
              <button onClick={() => setActivePage('appointments')} className="ecare-btn-secondary" style={{ borderRadius: '10px', padding: '0.55rem 0.9rem', fontSize: '0.75rem', fontWeight: 700 }}>
                Appointments
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {recentBookings.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.id} onClick={() => setActivePage(item.page || 'appointments')} className="ecare-flex-responsive" style={{ padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', gap: '0.5rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${item.accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.accent, flexShrink: 0 }}>
                        <Icon size={18} weight="duotone" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ecare-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', marginTop: '2px' }}>{item.kind} • {item.meta}</div>
                        <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px' }}>{formatShortDateTime(item.dateValue, item.timeValue)}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: item.accent }}>{item.status}</span>
                  </div>
                )
              })}
              {recentBookings.length === 0 && (
                <div style={{ padding: '1rem', borderRadius: '12px', border: '1px dashed #e2e8f0', color: 'var(--ecare-text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                  No bookings yet.
                </div>
              )}
            </div>
          </div>

          <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                    <Drop size={18} weight="fill" />
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>Blood Bank & Requisitions</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '0.25rem 0 0' }}>Live inventory reserves, emergency requisitions & donor registry.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setIsBloodRequestModalOpen(true)}
                  style={{
                    padding: '0.5rem 0.85rem', borderRadius: '8px',
                    background: '#dc2626', color: '#ffffff', border: 'none',
                    fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  <FirstAid size={13} weight="bold" /> Request Blood
                </button>
                <button 
                  onClick={() => setActivePage('blood-donors')} 
                  className="ecare-btn-secondary" 
                  style={{ borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  {myDonorProfile ? '❤️ Donor Card' : 'Volunteer'}
                </button>
              </div>
            </div>

            {/* Live 8-group stock availability badges */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.03em' }}>
                Hospital Reserve Stock
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {Object.entries(bloodSummaryByGroup).map(([group, count]) => {
                  const hasStock = count > 0
                  return (
                    <div 
                      key={group}
                      onClick={() => setActivePage('blood-bank')}
                      style={{
                        padding: '0.45rem 0.5rem', borderRadius: '8px',
                        background: hasStock ? '#fef2f2' : '#f8fafc',
                        border: `1px solid ${hasStock ? '#fecaca' : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      title={`${count} units of ${group} blood available`}
                    >
                      <span style={{ fontWeight: 900, fontSize: '0.8rem', color: hasStock ? '#991b1b' : '#94a3b8' }}>{group}</span>
                      <span style={{ 
                        fontSize: '0.62rem', fontWeight: 800, 
                        color: hasStock ? '#dc2626' : '#94a3b8',
                        background: hasStock ? '#ffffff' : 'transparent',
                        padding: '1px 5px', borderRadius: '4px'
                      }}>
                        {hasStock ? `${count}u` : '0u'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* My Active Requisitions (if any) */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>
                  My Blood Requisitions {myBloodRequests.length > 0 ? `(${myBloodRequests.length})` : ''}
                </span>
                <button 
                  onClick={() => setActivePage('blood-requests')} 
                  style={{ border: 'none', background: 'transparent', color: 'var(--ecare-primary)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  View All →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {myBloodRequests.slice(0, 2).map((req, i) => {
                  const s = String(req.status || 'Pending').toLowerCase()
                  const statusColors = {
                    fulfilled: { text: '#16a34a', bg: '#dcfce7' },
                    approved: { text: '#2563eb', bg: '#dbeafe' },
                    pending: { text: '#d97706', bg: '#fef3c7' },
                    rejected: { text: '#dc2626', bg: '#fee2e2' }
                  }
                  const sc = statusColors[s] || statusColors.pending
                  return (
                    <div key={i} className="ecare-flex-responsive" style={{ padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.72rem', flexShrink: 0 }}>
                          {req.blood_group}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ecare-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.units_required || 1} Unit(s) • {req.hospital_name || 'Hospital Request'}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--ecare-text-muted)' }}>
                            Urgency: {req.urgency || 'Urgent'} • {formatShortDate(req.request_date || req.created_at)}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: sc.text, background: sc.bg, padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', flexShrink: 0 }}>
                        {req.status || 'Pending'}
                      </span>
                    </div>
                  )
                })}

                {myBloodRequests.length === 0 && (
                  <div style={{ padding: '0.75rem', borderRadius: '10px', border: '1px dashed #e2e8f0', color: 'var(--ecare-text-muted)', fontSize: '0.72rem', textAlign: 'center', background: '#fafafa' }}>
                    No pending blood requests. Click "Request Blood" if an emergency arises.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>Messages</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '0.35rem 0 0' }}>Support conversations tied to your own account only.</p>
              </div>
              <button onClick={() => setActivePage('support')} className="ecare-btn-secondary" style={{ borderRadius: '10px', padding: '0.55rem 0.9rem', fontSize: '0.75rem', fontWeight: 700 }}>
                Open Support
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {recentSupportThreads.map((ticket) => (
                <div key={ticket.id} className="ecare-flex-responsive" style={{ padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>{ticket.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', marginTop: '2px' }}>{ticket.category || 'General'} • {ticket.messageCount} message{ticket.messageCount === 1 ? '' : 's'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px', lineHeight: 1.35 }}>{ticket.lastMessage}</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', flexShrink: 0 }}>{ticket.status || 'Open'}</span>
                </div>
              ))}
              {recentSupportThreads.length === 0 && (
                <div style={{ padding: '1rem', borderRadius: '12px', border: '1px dashed #e2e8f0', color: 'var(--ecare-text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                  No support messages yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Blood Request Modal */}
      {isBloodRequestModalOpen && (
        <Portal>
          <AnimatePresence>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsBloodRequestModalOpen(false)} 
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }} 
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 15 }} 
                style={{ 
                  background: '#ffffff', width: '100%', maxWidth: '480px', 
                  borderRadius: '20px', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Drop size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#991b1b' }}>Emergency Blood Requisition</h3>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#b91c1c' }}>Instant requisition submitted to blood bank reserves</p>
                    </div>
                  </div>
                  <button onClick={() => setIsBloodRequestModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleQuickBloodRequest} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Blood Group Needed *</label>
                      <select 
                        value={bloodRequestForm.blood_group}
                        onChange={(e) => setBloodRequestForm({ ...bloodRequestForm, blood_group: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8125rem', fontWeight: 700 }}
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Units Needed *</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={bloodRequestForm.units_required}
                        onChange={(e) => setBloodRequestForm({ ...bloodRequestForm, units_required: Number(e.target.value) || 1 })}
                        style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Urgency Level *</label>
                      <select 
                        value={bloodRequestForm.urgency}
                        onChange={(e) => setBloodRequestForm({ ...bloodRequestForm, urgency: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8125rem', fontWeight: 700 }}
                      >
                        <option value="Emergency">🚨 Emergency (Immediate)</option>
                        <option value="Urgent">⚡ Urgent (Within 4 Hours)</option>
                        <option value="Normal">Routine (Scheduled Procedure)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Component Type</label>
                      <select 
                        value={bloodRequestForm.component}
                        onChange={(e) => setBloodRequestForm({ ...bloodRequestForm, component: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8125rem' }}
                      >
                        <option value="Whole Blood">Whole Blood</option>
                        <option value="Packed RBC">Packed RBC</option>
                        <option value="Platelets">Platelets</option>
                        <option value="Fresh Frozen Plasma">Fresh Frozen Plasma</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Hospital / Clinical Center *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dhaka Central Hospital, Ward 4"
                      value={bloodRequestForm.hospital_name}
                      onChange={(e) => setBloodRequestForm({ ...bloodRequestForm, hospital_name: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8125rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Contact Telephone Number *</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +880 1712 345678"
                      value={bloodRequestForm.contact_phone}
                      onChange={(e) => setBloodRequestForm({ ...bloodRequestForm, contact_phone: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8125rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Reason / Clinical Notes</label>
                    <textarea 
                      placeholder="e.g. Emergency surgery scheduled today"
                      value={bloodRequestForm.notes}
                      onChange={(e) => setBloodRequestForm({ ...bloodRequestForm, notes: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.8125rem', minHeight: '60px', resize: 'vertical' }}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingBloodReq}
                    style={{
                      width: '100%', padding: '0.85rem', borderRadius: '12px',
                      background: '#dc2626', color: '#ffffff', border: 'none',
                      fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      opacity: isSubmittingBloodReq ? 0.7 : 1, marginTop: '0.5rem',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                    }}
                  >
                    <FirstAid size={16} weight="bold" />
                    {isSubmittingBloodReq ? 'Submitting Requisition...' : 'Submit Blood Request'}
                  </button>
                </form>
              </motion.div>
            </div>
          </AnimatePresence>
        </Portal>
      )}
    </div>
  )
}

export default PatientDashboard
