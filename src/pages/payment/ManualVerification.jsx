import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hourglass, CheckCircle, XCircle, Eye, X, ShieldCheck } from 'phosphor-react'
import DataTable from '../../components/DataTable'
import CustomSelect from '../../components/CustomSelect'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import { formatPaymentMethod } from '../../utils/formatters'

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
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
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)

const ManualVerification = () => {
  const { manualVerifications, verifyManualPayment, rejectManualPayment, currencySymbol, openConfirm } = useStore()
  const [selectedItem, setSelectedItem] = useState(null)

  const handleVerify = (id) => {
    openConfirm({ title: 'Verify Payment', message: 'Confirm this send-money transaction as verified? The linked transaction will be marked as Paid.', confirmText: 'Verify', onConfirm: () => { verifyManualPayment(id); setSelectedItem(null) } })
  }

  const handleReject = (id) => {
    openConfirm({ title: 'Reject Payment', message: 'Reject this send-money verification request?', confirmText: 'Reject', onConfirm: () => { rejectManualPayment(id); setSelectedItem(null) } })
  }

  // Helper: parse the combined "Sender: X | TrxID: Y" string stored in transactionId column
  const parseTxField = (raw) => {
    if (!raw) return { sender: '—', trxId: '—' }
    const senderMatch = raw.match(/Sender:\s*([^|]+)/i)
    const trxMatch   = raw.match(/TrxID:\s*(\S+)/i)
    return {
      sender: senderMatch ? senderMatch[1].trim() : raw,
      trxId:  trxMatch   ? trxMatch[1].trim()  : '—'
    }
  }

  const columns = [
    { key: 'method', label: 'Gateway', render: (val) => {
      const clean = formatPaymentMethod(val)
      const colors = { bKash: '#E2136E', Rocket: '#8C3494', Nagad: '#F6921E', Upay: '#6C3AD5', 'Sure Cash': '#0072bc' }
      return <span style={{ fontSize: '0.8rem', fontWeight: 700, color: colors[clean] || '#475569' }}>{clean || '—'}</span>
    }},
    { key: 'transactionId', label: 'Sender', render: (val) => {
      const { sender } = parseTxField(val)
      return <span style={{ fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'monospace' }}>{sender}</span>
    }},
    { key: 'transactionId', label: 'TRX ID', render: (val) => {
      const { trxId } = parseTxField(val)
      return <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--ecare-primary)', fontFamily: 'monospace' }}>{trxId}</span>
    }},
    { key: 'amount', label: 'Amount', render: (val) => {
      const num = parseFloat(val)
      return <span style={{ fontWeight: 700 }}>{currencySymbol}{isNaN(num) ? '0.00' : num.toLocaleString()}</span>
    }},
    { key: 'created_at', label: 'Submitted', render: (val) => {
      if (!val) return <span style={{ fontSize: '0.8rem', color: '#64748b' }}>—</span>
      const d = new Date(val)
      const fmt = isNaN(d) ? val : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      return <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{fmt}</span>
    }},
    { key: 'status', label: 'Status', render: (val) => {
      const bg = { Pending: '#fffbeb', Verified: 'var(--ecare-primary-bg)', Rejected: '#fef2f2' }
      const fg = { Pending: '#d97706', Verified: 'var(--ecare-primary)', Rejected: '#ef4444' }
      return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: bg[val] || '#f1f5f9', color: fg[val] || '#475569' }}>{val || 'Pending'}</span>
    }},
    { key: 'id', label: '', sortable: false, render: (_, row) => (
      <button onClick={() => setSelectedItem(row)} style={{ background: 'var(--ecare-primary-bg)', border: 'none', color: 'var(--ecare-primary)', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="View Details">
        <Eye size={16} weight="bold" />
      </button>
    )}
  ]

  const safeVerifications = Array.isArray(manualVerifications) ? manualVerifications : []
  const pending = safeVerifications.filter(v => v.status === 'Pending').length
  const verified = safeVerifications.filter(v => v.status === 'Verified').length
  const rejected = safeVerifications.filter(v => v.status === 'Rejected').length

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ecare-dashboard-page">
      <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--ecare-accent)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-accent)' }}><ShieldCheck size={20} weight="fill" /></div>
        <div><h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>Send-Money Verification Queue</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: 0 }}>Manually verify bKash, Rocket & Nagad personal send-money payments</p></div>
      </div>

      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 3, '--stat-grid-cols-md': 3 }}>
        <StatCard title="Pending" value={pending} icon={Hourglass} color="#f59e0b" delay={0.1} />
        <StatCard title="Verified" value={verified} icon={CheckCircle} color="var(--ecare-primary)" delay={0.2} />
        <StatCard title="Rejected" value={rejected} icon={XCircle} color="#ef4444" delay={0.3} />
      </div>

      <DataTable data={safeVerifications} columns={columns} searchPlaceholder="Search by TRX ID, sender or method..." title={`Verification Queue (${pending} pending)`} />

      <Portal>
        <AnimatePresence>
          {selectedItem && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setSelectedItem(null)}
                style={{ 
                  position: 'fixed', 
                  inset: 0, 
                  background: 'rgba(15, 23, 42, 0.3)', 
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 2000 
                }} 
              />
              <div style={{ 
                position: 'fixed', 
                inset: 0, 
                zIndex: 2001, 
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
                  onClick={(e) => e.stopPropagation()}
                  className="ecare-card"
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    pointerEvents: 'auto',
                    position: 'relative', 
                    padding: 0, 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    maxHeight: '90vh'
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
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--ecare-primary)',
                        flexShrink: 0
                      }}>
                        <ShieldCheck size={20} weight="bold" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                          Verification Details
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Review manual gateway payment slip
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
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

                  <div style={{ padding: '1.5rem', overflowY: 'auto' }} className="ecare-scrollbar">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {(() => {
                        const { sender, trxId } = parseTxField(selectedItem.transactionId)
                        const amount = parseFloat(selectedItem.amount)
                        const createdAt = selectedItem.created_at
                        const dateDisplay = createdAt ? new Date(createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (selectedItem.date || '—')
                        return [
                          ['Gateway',       formatPaymentMethod(selectedItem.method) || '—'],
                          ['Amount',        `${currencySymbol}${isNaN(amount) ? '0.00' : amount.toLocaleString()}`],
                          ['Sender Number', sender],
                          ['TRX ID',        trxId],
                          ['Patient',       selectedItem.patientName || '—'],
                          ['Invoice No',    selectedItem.invoiceNo || '—'],
                          ['Submitted At',  dateDisplay],
                          ['Status',        selectedItem.status || 'Pending'],
                        ].map(([label, value]) => (
                          <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{value}</div>
                          </div>
                        ))
                      })()}
                    </div>

                    {selectedItem.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                        <button type="button" onClick={() => handleReject(selectedItem.id)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', color: '#ef4444', borderColor: '#fca5a5' }}>Reject</button>
                        <button type="button" onClick={() => handleVerify(selectedItem.id)} className="ecare-button" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={18} weight="bold" /> Verify Payment
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </motion.div>
  )
}

export default ManualVerification
