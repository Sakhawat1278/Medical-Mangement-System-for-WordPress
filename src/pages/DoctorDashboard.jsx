import React, { useMemo } from 'react'
import { 
  Users, Calendar, Clock, Activity, 
  ArrowUpRight, ClipboardText, UserCircle, 
  ChatTeardropText, Prescription, Flask, Timer, CreditCard
} from 'phosphor-react'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import ChartFrame from '../components/ChartFrame'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Cell
} from 'recharts'

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

const StatCard = ({ title, value, icon: Icon, trend, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ borderColor: 'var(--ecare-primary)', y: -4 }}
    className="ecare-card"
    style={{ transition: 'all 0.3s ease', borderRadius: '14px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ 
        width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color 
      }}>
        <Icon size={24} weight="duotone" />
      </div>
      {trend && (
        <div style={{ color: 'var(--ecare-primary)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', background: 'var(--ecare-primary-bg)', padding: '4px 8px', borderRadius: '14px' }}>
          {trend} <ArrowUpRight size={12} weight="bold" style={{ marginLeft: '2px' }} />
        </div>
      )}
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)

const DoctorDashboard = () => {
  const { user, appointments, patients, transactions, labOrders, notifications, currencySymbol, getCurrentDoctor, doctorInstantCallStatus, updateAppointment, setActivePage, createTelemedRoom, doctorList } = useStore()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // ─── DATA ORCHESTRATION ─────────────────────────────────────────
  
  const currentDoctor = useMemo(() => getCurrentDoctor(), [getCurrentDoctor, doctorList, user?.id])
  const doctorName = currentDoctor?.name || user?.name

  const doctorAppointments = useMemo(() => {
    return (appointments || []).filter(a => a.doctorName === doctorName)
  }, [appointments, doctorName])

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
  }, [])
  
  const todayAppts = useMemo(() => {
    return doctorAppointments
      .filter(a => a.date === today)
      .sort((a, b) => getAppointmentTimestamp(a.date, a.time) - getAppointmentTimestamp(b.date, b.time))
  }, [doctorAppointments, today])

  const nextAppt = useMemo(() => {
    const nowTs = Date.now()
    return todayAppts.find(a => getAppointmentTimestamp(a.date, a.time) >= nowTs)
  }, [todayAppts])

  // Instant Call logic moved globally to App.jsx

  const uniquePatientsCount = new Set(doctorAppointments.map(a => a.patientName)).size

  // Calculate Doctor Earnings: (Assuming 80% of paid consultations as per platform default)
  const estimatedEarnings = useMemo(() => {
    const doctorPaidTxns = (transactions || []).filter(t => 
      t.status === 'Paid' && 
      doctorAppointments.some(a => a.id === t.appointmentId || a.patientName === t.patientName)
    )
    const total = doctorPaidTxns.reduce((sum, t) => sum + (Number(t.paidAmount) || Number(t.amount) || 0), 0)
    return total * 0.8 // 80% to doctor
  }, [transactions, doctorAppointments])

  
  const stats = useStore(state => state.stats || {})
  const reviews = useStore(state => state.reviews || [])

  // Reviews for this doctor
  const myReviews = useMemo(() => {
    return (reviews || []).filter(r => 
      r.status === 'Approved' && (
        String(r.doctor_id) === String(user?.id) ||
        (currentDoctor && String(r.doctor_id) === String(currentDoctor.id)) ||
        (currentDoctor && currentDoctor.name && r.doctor_name === currentDoctor.name) ||
        (user?.name && r.doctor_name === user.name)
      )
    )
  }, [reviews, user?.id, user?.name, currentDoctor])

  const myAvgRating = useMemo(() => {
    if (myReviews.length === 0) return null
    const sum = myReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return (sum / myReviews.length).toFixed(1)
  }, [myReviews])
  
  const dashboardStats = [
    { title: "Today's Patients", value: stats.today_appointments || 0, icon: Users, trend: (stats.today_appointments || 0) > 0 ? `+${stats.today_appointments}` : "0", color: "var(--ecare-primary)", delay: 0.1 },
    { title: "Total Consultations", value: stats.total_consultations || 0, icon: Calendar, trend: "Growth", color: "#8b5cf6", delay: 0.2 },
    { title: "Estimated Earnings", value: `${currencySymbol}${(stats.total_revenue || 0).toLocaleString()}`, icon: CreditCard, trend: "Live", color: "#10b981", delay: 0.3 }
  ]

  const performanceData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days.map((day, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      return {
        day,
        patients: doctorAppointments.filter(a => a.date === dateStr).length
      }
    })
  }, [doctorAppointments])

  return (
    <div className="ecare-dashboard-page">
      {/* Header Section */}
      


      {/* Hero: Next Appointment Alert */}
      {nextAppt && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ecare-card ecare-flex-responsive"
          style={{ 
            background: `linear-gradient(135deg, var(--ecare-primary) 0%, var(--ecare-primary-hover) 100%)`,
            color: 'white',
            padding: '1.25rem 1.5rem',
            border: 'none',
            boxShadow: `0 10px 25px -5px var(--ecare-primary-shadow)`,
            borderRadius: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Timer size={32} weight="bold" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 }}>NEXT APPOINTMENT</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{nextAppt.patientName}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, opacity: 0.9, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} weight="bold" /> Starts at {nextAppt.time} • {nextAppt.mode}
              </div>
            </div>
          </div>
          <button style={{ 
            padding: '0.875rem 2rem', borderRadius: '14px', background: 'white', color: 'var(--ecare-primary)', 
            border: 'none', fontWeight: 800, fontSize: '0.9375rem', cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={() => setActivePage('telemedicine')}
          >
            Enter Consultation
          </button>
        </motion.div>
      )}

      {/* Statistics Grid */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 3, '--stat-grid-cols-md': 3 }}>
        {dashboardStats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Rating Summary */}
      {myAvgRating !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="ecare-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#fde68a', marginBottom: '0' }}
        >
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#92400e', lineHeight: 1 }}>{myAvgRating}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', color: '#f59e0b', marginTop: '4px' }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: '14px' }}>{s <= Math.round(Number(myAvgRating)) ? '★' : '☆'}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#78350f' }}>Your Patient Rating</h4>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#92400e' }}>
              Based on {myReviews.length} approved {myReviews.length === 1 ? 'review' : 'reviews'} from verified patients.
            </p>
          </div>
          <button
            onClick={() => useStore.getState().setActivePage('reviews')}
            style={{ 
              padding: '8px 16px', borderRadius: '10px',
              background: '#f59e0b', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            View All Reviews
          </button>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="ecare-doctor-grid">
        
        {/* Appointments Section */}
        <div className="ecare-card" style={{ padding: '1.5rem', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>Today's Schedule</h3>
            <span 
              onClick={() => setActivePage('appointments')}
              style={{ fontSize: '0.8125rem', color: 'var(--ecare-primary)', fontWeight: 700, cursor: 'pointer' }}
            >
              View Full Calendar
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todayAppts.length > 0 ? todayAppts.map((appt, i) => (
              <div key={i} className="ecare-flex-responsive" style={{ 
                padding: '1rem', borderRadius: '14px', background: '#f8fafc', border: '1px solid #f1f5f9',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '44px', height: '44px', borderRadius: '12px', background: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--ecare-primary)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    {appt.patientName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{appt.patientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} weight="bold" /> {appt.time} • {appt.mode}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setActivePage('telemedicine')}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'white', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                  >
                    <Prescription size={18} weight="bold" />
                  </button>
                  <button 
                    onClick={() => setActivePage('telemedicine')}
                    style={{ padding: '0 1rem', height: '36px', borderRadius: '10px', border: 'none', background: appt === nextAppt ? 'var(--ecare-primary)' : '#e2e8f0', color: appt === nextAppt ? 'white' : '#64748b', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {appt === nextAppt ? 'Start Now' : 'Check-In'}
                  </button>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--ecare-text-muted)' }}>
                <Calendar size={48} weight="duotone" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ margin: 0 }}>No appointments scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Analytics & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
          <div className="ecare-card" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '240px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ecare-text-main)', marginBottom: '1.25rem' }}>Weekly Patient Inflow</h3>
            <ChartFrame
              height={160}
              render={({ width, height }) => isMounted && performanceData && performanceData.length > 0 ? (
                <BarChart width={width} height={height} data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{ background: 'white', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {payload[0].value} Patients
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Bar dataKey="patients" fill="var(--ecare-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                  No inflow data available
                </div>
              )}
            />
          </div>

          <div className="ecare-card" style={{ padding: '1.5rem', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)', marginBottom: '1rem' }}>Clinical Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 5).map((alert, i) => {
                  const getAlertStyle = (type) => {
                    switch(type?.toLowerCase()) {
                      case 'message': return { icon: ChatTeardropText, color: '#0ea5e9' }
                      case 'appointment': return { icon: Calendar, color: 'var(--ecare-primary)' }
                      case 'lab': return { icon: Flask, color: '#8b5cf6' }
                      case 'payment': return { icon: CreditCard, color: '#f59e0b' }
                      default: return { icon: Timer, color: '#64748b' }
                    }
                  }
                  const config = getAlertStyle(alert.type)
                  const Icon = config.icon
                  
                  return (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${config.color}15`, color: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} weight="bold" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--ecare-text-main)', fontWeight: 600, lineHeight: 1.3 }}>{alert.title || alert.description}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', marginTop: '2px' }}>
                          {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
                  No recent alerts
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DoctorDashboard
