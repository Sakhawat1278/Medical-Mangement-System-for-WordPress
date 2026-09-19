import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, ArrowUpRight, Hourglass, ArrowClockwise, WarningCircle } from 'phosphor-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import useStore from '../../store/useStore'
import ChartFrame from '../../components/ChartFrame'
import { formatPaymentMethod } from '../../utils/formatters'
import CustomSelect from '../../components/CustomSelect'

const StatCard = ({ title, value, icon: Icon, color, trend, delay }) => (
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

// Medical-grade high-contrast colors for service categories
const COLORS = [
  '#10b981', // Emerald (Clinical/Primary)
  '#0ea5e9', // Sky Blue (Appointments)
  '#8b5cf6', // Royal Purple (Lab Tests)
  '#f59e0b', // Amber (Products/Pharma)
  '#6366f1', // Indigo (Ambulance)
  '#f43f5e'  // Rose (Emergency)
]

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ecare-primary)' }}>৳{payload[0].value.toLocaleString()}</div>
    </div>
  )
}

const RevenueDashboard = () => {
  const { transactions, currencySymbol, refunds, patientDues, staff } = useStore()
  const [selectedStaff, setSelectedStaff] = React.useState('All')

  const safeTxns = Array.isArray(transactions) ? transactions : []
  const safeRefunds = Array.isArray(refunds) ? refunds : []
  const safeDues = Array.isArray(patientDues) ? patientDues : []

  // Filter by Issued By
  const filteredTxns = useMemo(() => {
    if (selectedStaff === 'All') return safeTxns
    return safeTxns.filter(t => t.issuedBy === selectedStaff)
  }, [safeTxns, selectedStaff])

  const filteredRefunds = useMemo(() => {
    if (selectedStaff === 'All') return safeRefunds
    return safeRefunds.filter(r => r.issuedBy === selectedStaff)
  }, [safeRefunds, selectedStaff])

  const totalRevenue = filteredTxns.filter(t => !['Failed', 'Refunded'].includes(t.status)).reduce((s, t) => s + (Number(t.paidAmount) || (t.status === 'Paid' ? Number(t.amount) : 0)), 0)
  const pendingAmount = filteredTxns.filter(t => ['Pending', 'Due', 'Partially Paid'].includes(t.status)).reduce((s, t) => s + (Number(t.amount) - (Number(t.paidAmount) || (t.status === 'Paid' ? Number(t.amount) : 0))), 0)
  const refundedAmount = filteredRefunds.reduce((s, r) => s + (Number(r.refundAmount) || 0), 0)
  const outstandingDues = safeDues.reduce((s, d) => s + (Number(d.totalDue) || 0), 0) 

  const categories = ['Appointment', 'Care Provider', 'Lab Test', 'Health Product', 'Ambulance']
  const pieData = categories.map(cat => ({
    name: cat, value: filteredTxns.filter(t => t.category === cat && !['Failed', 'Refunded'].includes(t.status)).reduce((s, t) => s + (Number(t.paidAmount) || (t.status === 'Paid' ? Number(t.amount) : 0)), 0)
  })).filter(d => d.value > 0)

  const methodData = {}
  filteredTxns.filter(t => !['Failed', 'Refunded'].includes(t.status)).forEach(t => { 
    const collected = Number(t.paidAmount) || (t.status === 'Paid' ? Number(t.amount) : 0)
    const clean = formatPaymentMethod(t.method)
    methodData[clean] = (methodData[clean] || 0) + collected 
  })
  const methodBars = Object.entries(methodData).sort((a, b) => b[1] - a[1])
  const maxMethod = methodBars[0]?.[1] || 1

  const trendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const result = []
    
    // We'll show the last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      
      // Use local date string YYYY-MM-DD for matching
      const dateStr = d.toLocaleDateString('en-CA') // Format: YYYY-MM-DD
      const dayName = days[d.getDay()]
      
      const dayRev = filteredTxns
        .filter(t => {
          const issuedDate = t.created_at ? t.created_at.split(' ')[0] : t.date;
          return issuedDate === dateStr && !['Failed', 'Refunded'].includes(t.status);
        })
        .reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0)
        
      result.push({ day: dayName, revenue: dayRev, fullDate: dateStr })
    }
    return result
  }, [filteredTxns])

  const recentTxns = [...filteredTxns].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  // Extract all staff from both transactions and the official system registry
  const staffOptions = useMemo(() => {
    const transactionStaff = safeTxns.map(t => t.issuedBy).filter(Boolean)
    const systemStaff = (staff || []).map(s => s.name || s.display_name).filter(Boolean)
    const allStaff = new Set(['All', ...systemStaff, ...transactionStaff])
    return Array.from(allStaff).map(name => ({ label: name, value: name }))
  }, [safeTxns, staff])

  const statusColor = (s) => s === 'Paid' ? 'var(--ecare-primary)' : s === 'Pending' ? 'var(--ecare-primary-v2)' : s === 'Failed' ? '#ef4444' : s === 'Refunded' ? 'var(--ecare-primary-v3)' : s === 'Due' ? 'var(--ecare-primary-v4)' : '#94a3b8'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ecare-dashboard-page">
      
      {/* Header with Filter */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
        <div style={{ width: '100%', maxWidth: '280px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ecare-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Filter by Staff</div>
          <CustomSelect 
            value={selectedStaff} 
            onChange={setSelectedStaff}
            options={staffOptions}
            customTriggerStyle={{ borderRadius: '10px', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', fontWeight: 600 }}
          />
        </div>
      </div>

      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Total Revenue" value={`${currencySymbol}${totalRevenue.toLocaleString()}`} icon={CreditCard} color="var(--ecare-primary)" trend="+12.5%" delay={0.1} />
        <StatCard title="Pending Payments" value={`${currencySymbol}${pendingAmount.toLocaleString()}`} icon={Hourglass} color="var(--ecare-primary-v2)" delay={0.2} />
        <StatCard title="Total Refunded" value={`${currencySymbol}${refundedAmount.toLocaleString()}`} icon={ArrowClockwise} color="var(--ecare-primary-v3)" delay={0.3} />
        <StatCard title="Outstanding Dues" value={`${currencySymbol}${outstandingDues.toLocaleString()}`} icon={WarningCircle} color="var(--ecare-primary-v4)" delay={0.4} />
      </div>

      <div className="ecare-doctor-grid">
        <div className="ecare-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--ecare-text-main)' }}>Revenue Trend</h3>
          <ChartFrame
            height={250}
            render={({ width, height }) => (
              <AreaChart width={width} height={height} data={trendData}>
              <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--ecare-primary)" stopOpacity={0.15} /><stop offset="95%" stopColor="var(--ecare-primary)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="var(--ecare-primary)" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            )}
          />
        </div>

        <div className="ecare-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--ecare-text-main)' }}>Category Breakdown</h3>
          <ChartFrame
            height={180}
            render={({ width, height }) => (
              <PieChart width={width} height={height}><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip formatter={(v) => `${currencySymbol}${v.toLocaleString()}`} /></PieChart>
            )}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />{d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ecare-grid-2col-equal">
        <div className="ecare-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--ecare-text-main)' }}>Payment Methods</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {methodBars.map(([method, amount]) => (
              <div key={method}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  <span style={{ color: '#475569' }}>{method}</span>
                  <span style={{ color: 'var(--ecare-primary)' }}>{currencySymbol}{amount.toLocaleString()}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: '#f1f5f9' }}>
                  <div style={{ height: '100%', borderRadius: '3px', background: 'var(--ecare-primary)', width: `${(amount / maxMethod) * 100}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ecare-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--ecare-text-main)' }}>Recent Transactions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentTxns.map(t => (
              <div key={t.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '10px', gap: '0.5rem' }}>
                <div style={{ minWidth: '150px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{t.patientName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.invoiceNo} · {t.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{currencySymbol}{t.amount.toLocaleString()}</div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor(t.status), background: `${statusColor(t.status)}15`, padding: '2px 6px', borderRadius: '4px' }}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RevenueDashboard
