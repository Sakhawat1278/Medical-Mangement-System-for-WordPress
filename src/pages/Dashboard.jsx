import React, { useEffect, useMemo } from 'react'
import { Users, Calendar, Activity, CreditCard, ArrowUpRight, Clock, UserPlus, FirstAid, Flask, Truck, IdentificationCard } from 'phosphor-react'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import ChartFrame from '../components/ChartFrame'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart,
  Pie,
  Cell
} from 'recharts'
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'white', 
        padding: '0.75rem', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-text-muted)', marginBottom: '4px' }}>{label} Performance</div>
        {payload[0] && (
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ecare-primary)' }}>{payload[0].value} Appointments</div>
        )}
        {payload[1] && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--ecare-primary)', marginTop: '4px' }}>৳{(payload[1].value || 0).toLocaleString()} Revenue</div>
        )}
      </div>
    )
  }
  return null
}

const StatCard = ({ title, value, icon: Icon, trend, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ borderColor: 'var(--ecare-primary)' }}
    className="ecare-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ 
        color: color, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'white', 
        padding: '0.5rem 0.75rem', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--ecare-text-main)',
        pointerEvents: 'none',
        zIndex: 9999
      }}>
        {payload[0].name}: <span style={{ color: payload[0].payload.color }}>{payload[0].value}%</span>
      </div>
    )
  }
  return null
}

const Dashboard = () => {
  const trendData = useStore(state => state.trendData)
  const appointmentTypes = useStore(state => state.appointmentTypes)
  const operationalWidgets = useStore(state => state.operationalWidgets)
  const patients = useStore(state => state.patients)
  const appointments = useStore(state => state.appointments)
  const doctorList = useStore(state => state.doctorList)
  const transactions = useStore(state => state.transactions)
  const currencySymbol = useStore(state => state.currencySymbol)
  const pendingDoctors = useStore(state => state.pendingDoctors)
  const pendingCareProviders = useStore(state => state.pendingCareProviders)
  const pendingAmbulanceDrivers = useStore(state => state.pendingAmbulanceDrivers)
  const staff = useStore(state => state.staff)
  const staffAttendance = useStore(state => state.staffAttendance)
  const services = useStore(state => state.services)
  const ambulanceBookings = useStore(state => state.ambulanceBookings)
  const careProviderBookings = useStore(state => state.careProviderBookings)
  const serviceCommissions = useStore(state => state.serviceCommissions)
  const ambulance = useStore(state => state.ambulance)
  const platformCommission = useStore(state => state.platformCommission)
  const user = useStore(state => state.user)
  const isAdmin = user?.ecareRole === 'admin'
  const [isMounted, setIsMounted] = React.useState(false)

  // Compute live stats from real data
  const getLocalYYYYMMDD = (dateObj) => {
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const today = getLocalYYYYMMDD(new Date())
  const safeAppts = Array.isArray(appointments) ? appointments : []
  const safeTxns = Array.isArray(transactions) ? transactions : []
  const meaningfulAppointments = useMemo(
    () => safeAppts.filter(a => !['Cancelled', 'Expired', 'Closed'].includes(a.status)),
    [safeAppts]
  )

  // ─── DYNAMIC ANALYTICS ───────────────────────────────────────────
  
  // 1. Dynamic Trend Data (Current Week: Monday to Sunday)
  const dynamicTrendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const result = []
    
    // Find the Monday of the current week
    const todayObj = new Date()
    const currentDay = todayObj.getDay() // 0 = Sunday, 1 = Monday, ...
    
    // Number of days to subtract to get to Monday
    // If Sunday (0), subtract 6. If Mon (1), subtract 0. If Tue (2), subtract 1...
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1
    
    const mondayObj = new Date(todayObj)
    mondayObj.setDate(todayObj.getDate() - daysSinceMonday)
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayObj)
      d.setDate(mondayObj.getDate() + i)
      const dateStr = getLocalYYYYMMDD(d)
      const dayName = days[d.getDay()]
      
      const dayAppts = meaningfulAppointments.filter(a => a.date === dateStr).length
      const dayRev = safeTxns
        .filter(t => t.date === dateStr && t.status === 'Paid')
        .reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0)
        
      result.push({ day: dayName, count: dayAppts, revenue: dayRev, fullDate: dateStr })
    }
    return result
  }, [meaningfulAppointments, safeTxns])

  // 2. Dynamic Appointment Types (Pie Chart)
  const dynamicApptTypes = useMemo(() => {
    if (meaningfulAppointments.length === 0) {
      return [
        { name: 'General', value: 100, color: 'var(--ecare-primary)' },
        { name: 'Emergency', value: 0, color: '#ef4444' },
        { name: 'Follow-up', value: 0, color: '#8b5cf6' }
      ]
    }
    const groups = meaningfulAppointments.reduce((acc, a) => {
      const mode = a.mode || 'General'
      acc[mode] = (acc[mode] || 0) + 1
      return acc
    }, {})
    
    const colors = { 
      'Video Consult': 'var(--ecare-primary)', 
      'Physical Visit': 'var(--ecare-primary-v2)', 
      'Home Visit': 'var(--ecare-primary-v3)', 
      'Diagnostic': 'var(--ecare-primary-v4)',
      'General': '#94a3b8'
    }
    return Object.entries(groups).map(([name, count]) => ({
      name,
      value: Math.round((count / meaningfulAppointments.length) * 100),
      color: colors[name] || '#94a3b8'
    }))
  }, [meaningfulAppointments])

  // 3. Dynamic Operational Widgets
  const dynamicWidgets = useMemo(() => {
    const onMission = (ambulanceBookings || []).filter(b => b.status === 'On Mission').length
    const fleetTotal = (ambulance || []).length
    
    return {
      ambulance: { 
        mission: onMission,
        total: Math.max(fleetTotal, (ambulanceBookings || []).length), // Use fleet count primarily
        available: Math.max(0, fleetTotal - onMission)
      },
      careProvider: { 
        active: (careProviderBookings || []).filter(b => b.status === 'Confirmed' || b.status === 'In-Progress').length,
        scheduled: (careProviderBookings || []).filter(b => b.status === 'Pending').length
      },
      staff: { 
        attendance: (() => {
          const safeStaff = Array.isArray(staff) ? staff : []
          const activeStaff = safeStaff.filter(s => s.status === 'Active')
          const todayStr = getLocalYYYYMMDD(new Date())
          const todayLogs = (staffAttendance || []).filter(log => log.date === todayStr)
          
          const totalActive = activeStaff.length
          const onDutyCount = todayLogs.filter(log => log.status === 'Present' || log.status === 'Late').length
          const leaveCount = todayLogs.filter(log => log.status === 'On Leave').length
          
          const divisor = totalActive - leaveCount
          return divisor > 0 ? Math.round((onDutyCount / divisor) * 100) : 0
        })(),
        onDuty: (() => {
          const todayStr = getLocalYYYYMMDD(new Date())
          return (staffAttendance || []).filter(log => log.date === todayStr && (log.status === 'Present' || log.status === 'Late')).length
        })(),
        myStatus: (() => {
          const todayStr = getLocalYYYYMMDD(new Date())
          const myStaffRecord = (staff || []).find(s => String(s.user_id) === String(user?.id))
          if (!myStaffRecord) return 'Absent'
          const myTodayLog = (staffAttendance || []).find(log => String(log.staff_id) === String(myStaffRecord.id) && log.date === todayStr)
          return myTodayLog ? myTodayLog.status : 'Absent'
        })()
      }
    }
  }, [ambulance, staff, staffAttendance, ambulanceBookings, careProviderBookings, user])

  const stats = {
    total_patients: Array.isArray(patients) ? patients.length : 0,
    total_appointments: meaningfulAppointments.length,
    today_appointments: meaningfulAppointments.filter(a => a.date === today).length,
    pending_verifications: (pendingDoctors?.length || 0) + (pendingCareProviders?.length || 0) + (pendingAmbulanceDrivers?.length || 0),
    total_revenue: safeTxns
      .filter(t => ['Paid', 'Partially Paid', 'Under Verify'].includes(t.status))
      .reduce((s, t) => s + (Number(t.paidAmount) || 0), 0)
  }

  
  const platformEarnings = useMemo(() => {
    if (!Array.isArray(safeTxns)) return 0
    return safeTxns
      .filter(t => t.status === 'Paid')
      .reduce((sum, t) => {
        let rate = 0
        const category = (t.category || '').toLowerCase()
        
        let config = { rate: 0, enabled: false }
        if (category === 'appointment') config = serviceCommissions.doctors
        else if (category === 'ambulance') config = serviceCommissions.ambulance
        else if (category === 'care provider') config = serviceCommissions.careProviders
        else if (category === 'lab test') config = serviceCommissions.lab
        
        rate = config?.enabled ? (Number(config.rate) || 0) : 0
        
        return sum + (Number(t.paidAmount) * rate / 100)
      }, 0)
  }, [safeTxns, serviceCommissions])

  const doctors = Array.isArray(doctorList) 
    ? doctorList.slice(0, 4).map(d => ({ 
        name: d.name, 
        dept: d.department || d.specialization || d.spec, 
        status: d.consultationStatus === 'Active' ? 'Available' : 'Offline' 
      })) 
    : []

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="ecare-dashboard-page"
    >
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': isAdmin ? 6 : 4, '--stat-grid-cols-md': isAdmin ? 3 : 2 }}>
        <StatCard title="Total Patients" value={stats.total_patients} icon={Users} trend={stats.total_patients > 0 ? "+12%" : "+0%"} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Total Appointments" value={stats.total_appointments} icon={Calendar} trend="+5%" color="var(--ecare-primary-v2)" delay={0.2} />
        <StatCard title="Today's Appointments" value={stats.today_appointments} icon={Activity} color="var(--ecare-primary-v3)" delay={0.3} />
        <StatCard title="Pending Verifications" value={stats.pending_verifications} icon={Clock} trend={stats.pending_verifications > 0 ? `${stats.pending_verifications} urgent` : "0 pending"} color="var(--ecare-primary-v4)" delay={0.4} />
        {isAdmin && (
          <>
            <StatCard title="Total Revenue" value={`${currencySymbol}${stats.total_revenue.toLocaleString()}`} icon={CreditCard} trend={stats.total_revenue > 0 ? "+18%" : "+0%"} color="var(--ecare-primary-hover)" delay={0.5} />
            <StatCard title="Platform Earnings" value={`${currencySymbol}${platformEarnings.toLocaleString()}`} icon={ArrowUpRight} trend={`${platformCommission}% rate`} color="#059669" delay={0.6} />
          </>
        )}
      </div>

      {/* Performance & Distribution Section */}
      <div className="ecare-dashboard-grid-2col">
        {/* Appointment Trend Graph */}
        <div className="ecare-card" style={{ minHeight: '340px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>Appointment Performance Trend</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '2px 0 0 0' }}>Daily metrics for the current week</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ecare-primary)' }} />
                <span style={{ color: 'var(--ecare-text-main)' }}>Appointments</span>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ecare-primary-v3)' }} />
                  <span style={{ color: 'var(--ecare-text-main)' }}>Revenue</span>
                </div>
              )}
            </div>
          </div>
          
          <ChartFrame
            height={240}
            style={{ marginTop: '1rem' }}
            render={({ width, height }) => isMounted && (
              <AreaChart width={width} height={height} data={dynamicTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ecare-primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--ecare-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ecare-primary-v3)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--ecare-primary-v3)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--ecare-primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    animationDuration={1500}
                  />
                  {isAdmin && (
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="var(--ecare-primary)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                      animationDuration={1500}
                    />
                  )}
              </AreaChart>
            )}
          />
        </div>

        {/* Appointment Type Distribution Pie Chart */}
        <div className="ecare-card" style={{ minHeight: '340px', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0 }}>Appointment Types</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: '2px 0 0 0' }}>Distribution of booking modes</p>
          </div>
          
          <ChartFrame
            height={220}
            render={({ width, height }) => isMounted && (
              <>
                <PieChart width={width} height={height}>
                  <Pie
                    data={dynamicApptTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {dynamicApptTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  zIndex: 1
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{dynamicApptTypes.length} Types</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>Active Modes</div>
                </div>
              </>
            )}
          />

          <div style={{ marginTop: '0.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem 1rem' }}>
            {dynamicApptTypes.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '2px 0' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: '5px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--ecare-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1.2 }}>{item.name}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--ecare-text-main)', fontWeight: 800, lineHeight: 1.1 }}>{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ecare-dashboard-grid-4col">
        {/* Doctor Availability Widget */}
        <div className="ecare-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ecare-text-main)', margin: 0 }}>Doctor Availability</h3>
            <span style={{ fontSize: '0.65rem', color: 'var(--ecare-primary)', fontWeight: 600, cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ flex: 1 }}>
            {doctors.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < doctors.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserPlus size={12} weight="duotone" color="var(--ecare-primary)" />
                  </div>
                  <div style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-text-main)', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--ecare-text-muted)', whiteSpace: 'nowrap' }}>{doc.dept}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.65rem', fontWeight: 500, color: doc.status === 'Available' ? 'var(--ecare-primary)' : doc.status === 'In Session' ? '#f59e0b' : '#94a3b8' }}>
                  <div className="ecare-status-dot" style={{ background: doc.status === 'Available' ? 'var(--ecare-primary)' : doc.status === 'In Session' ? '#f59e0b' : '#94a3b8', width: '6px', height: '6px' }} />
                  {doc.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ambulance Widget */}
        <div className="ecare-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={14} weight="duotone" color="#d97706" />
            </div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ecare-text-main)', margin: 0, lineHeight: 1 }}>Ambulance</h4>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{dynamicWidgets.ambulance.available}/{dynamicWidgets.ambulance.total}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--ecare-primary)', fontWeight: 600 }}>Available Now</div>
              </div>
              <div style={{ fontSize: '0.625rem', color: '#ef4444' }}>{dynamicWidgets.ambulance.mission} On Mission</div>
            </div>
          </div>
        </div>

        {/* Care Provider Widget */}
        <div className="ecare-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IdentificationCard size={14} weight="duotone" color="#0284c7" />
            </div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ecare-text-main)', margin: 0, lineHeight: 1 }}>Care Provider</h4>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{dynamicWidgets.careProvider.active}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--ecare-primary)', fontWeight: 600 }}>Active Visits</div>
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--ecare-text-muted)' }}>{dynamicWidgets.careProvider.scheduled} Scheduled</div>
            </div>
          </div>
        </div>

        {/* Staff Widget */}
        <div className="ecare-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={14} weight="duotone" color="#64748b" />
            </div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ecare-text-main)', margin: 0, lineHeight: 1 }}>{isAdmin ? 'Staff' : 'My Status'}</h4>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{isAdmin ? `${dynamicWidgets.staff.attendance}%` : dynamicWidgets.staff.myStatus}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--ecare-primary)', fontWeight: 600 }}>{isAdmin ? 'Attendance' : 'Duty Status'}</div>
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--ecare-text-muted)' }}>{isAdmin ? `${dynamicWidgets.staff.onDuty} On-duty` : 'Session Active'}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard
