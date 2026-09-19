import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import useStore from '../../store/useStore'
import { Drop, Thermometer, FirstAidKit, CheckCircle } from 'phosphor-react'

const BloodBankDashboard = () => {
  const { bloodInventory, bloodRequests, bloodDonors, setActivePage } = useStore()

  const stats = useMemo(() => {
    const availableBags = (bloodInventory || []).filter(b => b.status === 'Available')
    const pendingRequests = (bloodRequests || []).filter(r => r.status === 'Pending')
    
    // Group by blood type
    const byType = availableBags.reduce((acc, bag) => {
      const type = bag.blood_group || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    return {
      totalAvailable: availableBags.length,
      totalDonors: (bloodDonors || []).length,
      pendingRequests: pendingRequests.length,
      byType
    }
  }, [bloodInventory, bloodDonors, bloodRequests])

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  const getStockColor = (count) => {
    if (count > 10) return '#10b981' // Green
    if (count > 3) return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  return (
    <div className="ecare-page-slide ecare-dashboard">
      <div className="ecare-table-toolbar-title" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Blood Bank Dashboard</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setActivePage('blood-requests')} className="ecare-button ecare-btn-secondary">
            View Requests
          </button>
          <button onClick={() => setActivePage('blood-inventory')} className="ecare-button">
            Manage Inventory
          </button>
        </div>
      </div>

      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 3 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ecare-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <Drop size={24} weight="fill" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Total Blood Bags</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.totalAvailable} <span style={{fontSize:'0.875rem', color:'#10b981', fontWeight:500}}>Available</span></h3>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ecare-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <FirstAidKit size={24} weight="fill" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Pending Requests</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.pendingRequests} <span style={{fontSize:'0.875rem', color:'#f59e0b', fontWeight:500}}>Action Required</span></h3>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="ecare-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle size={24} weight="fill" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Registered Donors</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{stats.totalDonors}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="ecare-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Live Blood Stock Levels</h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
          {bloodGroups.map((group, index) => {
            const count = stats.byType[group] || 0
            const color = getStockColor(count)
            return (
              <motion.div 
                key={group}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + (index * 0.05) }}
                style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  textAlign: 'center' 
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginBottom: '8px' }}>
                  {group}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                  {count} <span style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 600}}>Bags</span>
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: color,
                  background: color + '15',
                  padding: '4px 8px',
                  borderRadius: '99px',
                  display: 'inline-block'
                }}>
                  {count > 10 ? 'Safe' : count > 3 ? 'Low Stock' : 'Critical'}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BloodBankDashboard
