import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, CurrencyCircleDollar } from 'phosphor-react'
import { Microscope } from 'healthicons-react'
import useStore from '../../store/useStore'
import LabCatalog from './LabCatalog'
import LabOrders from './LabOrders'
import LabLocations from './LabLocations'

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }}
    className="ecare-card" style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
    <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:`${color}10`, color, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Icon size={24} weight="duotone"/>
    </div>
    <div>
      <div style={{ color:'var(--ecare-text-muted)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.025em' }}>{title}</div>
      <div style={{ color:'var(--ecare-text-main)', fontSize:'1.25rem', fontWeight:700 }}>{value}</div>
    </div>
  </motion.div>
)

export default function LabManagement({ view = 'orders' }) {
  const { user, labTests, labOrders, labLocations, initStore, transactions } = useStore()
  const isPatient = user?.ecareRole === 'patient'

  useEffect(() => {
    initStore(true) // Silent refresh
  }, [initStore])

  const myOrders = isPatient ? (labOrders||[]).filter(o => String(o.patient_user_id) === String(user?.id)) : (labOrders||[])
  
  const totalRevenue = (transactions || [])
    .filter(t => t.category === 'Lab Test')
    .reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0)

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }} style={{ paddingBottom:'2rem' }}>

      {/* Stat Cards */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': isPatient ? 3 : 4, '--stat-grid-cols-md': isPatient ? 3 : 2 }}>
        <StatCard title={isPatient ? "Tests Taken" : "Total Tests"} value={isPatient ? myOrders.length : (labTests||[]).length} icon={Microscope} color="var(--ecare-primary)" delay={0.1}/>
        {!isPatient && <StatCard title="Total Revenue" value={`৳${totalRevenue.toLocaleString()}`} icon={CurrencyCircleDollar} color="var(--ecare-primary)" delay={0.2}/>}
        <StatCard title="Pending" value={myOrders.filter(o=>o.status==='Pending').length} icon={Clock} color="#f59e0b" delay={0.3}/>
        <StatCard title="Completed" value={myOrders.filter(o=>o.status==='Completed').length} icon={CheckCircle} color="#0891b2" delay={0.4}/>
      </div>

      {/* Animated Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {view === 'locations' && <LabLocations locations={labLocations} />}
          {view === 'catalog'   && <LabCatalog   tests={labTests} locations={labLocations} />}
          {view === 'orders'    && (
            <LabOrders
              orders={myOrders}
              tests={labTests}
              locations={labLocations}
              userRole={user?.ecareRole}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
