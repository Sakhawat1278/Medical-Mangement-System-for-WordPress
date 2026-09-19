import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowClockwise, CheckCircle, Hourglass, X, CreditCard } from 'phosphor-react'
import DataTable from '../../components/DataTable'
import CustomSelect from '../../components/CustomSelect'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import useAuth from '../../hooks/useAuth'

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

const RefundManager = () => {
  const { refunds, transactions, appointments, processRefund, updateRefund, currencySymbol, openConfirm, instantRefundDuration, standardRefundDuration } = useStore()
  const { user, isAdmin, isPatient } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [refundForm, setRefundForm] = useState({ type: 'Full', amount: '', reason: '' })

  const safeRefunds = Array.isArray(refunds) ? refunds : []
  const safeTransactions = Array.isArray(transactions) ? transactions : []
  
  const displayRefunds = useMemo(() => {
    let list = safeRefunds
    if (isPatient) {
      const pName = (user?.name || user?.display_name || user?.user_login || '').trim().toLowerCase()
      const uId = String(user?.id || '')
      list = list.filter(r => 
        (r.patient_user_id && String(r.patient_user_id) === uId) ||
        (r.patient_id && String(r.patient_id) === uId) ||
        (r.patientId && String(r.patientId) === uId) ||
        (r.user_id && String(r.user_id) === uId) ||
        (r.patientName && pName && r.patientName.trim().toLowerCase() === pName)
      )
    }
    return list
  }, [safeRefunds, isPatient, user])

  // Calculate refund policy dynamically based on settings
  const checkRefundEligibility = (t) => {
    if (!['Paid', 'Partially Paid'].includes(t.status)) return false;
    
    let hoursAllowed = Number(standardRefundDuration) * 24; // Convert days to hours
    const relatedAppt = appointments?.find(a => a.id == t.appointmentId);
    
    if (relatedAppt && relatedAppt.mode === 'Instant Call') {
      hoursAllowed = Number(instantRefundDuration);
    }
    
    // Use appointment start time if available, otherwise transaction date
    const referenceDateStr = (relatedAppt && relatedAppt.started_at) ? relatedAppt.started_at : t.date;
    const referenceDate = new Date(referenceDateStr).getTime();
    
    const now = new Date().getTime();
    const hoursElapsed = (now - referenceDate) / (1000 * 60 * 60);
    
    return hoursElapsed <= hoursAllowed;
  }
  
  const eligibleTxns = safeTransactions.filter(checkRefundEligibility)

  const handleProcess = (e) => {
    e.preventDefault()
    if (!selectedTxn) return
    processRefund({
      transactionId: selectedTxn.id, invoiceNo: selectedTxn.invoiceNo, patientName: selectedTxn.patientName,
      originalAmount: selectedTxn.amount, refundAmount: refundForm.type === 'Full' ? selectedTxn.paidAmount : Number(refundForm.amount),
      type: refundForm.type, reason: refundForm.reason, status: 'Processed'
    })
    setIsModalOpen(false)
    setSelectedTxn(null)
    setRefundForm({ type: 'Full', amount: '', reason: '' })
  }

  const handleStatusChange = (id, status) => updateRefund(id, { status })

  const columns = [
    { key: 'invoiceNo', label: 'Invoice', render: (val) => <span style={{ fontWeight: 700, color: 'var(--ecare-primary)', fontSize: '0.8rem' }}>{val}</span> },
    { key: 'patientName', label: 'Patient', render: (val) => <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</span> },
    { key: 'type', label: 'Type', render: (val) => <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: val === 'Full' ? '#f5f3ff' : '#f0f9ff', color: val === 'Full' ? '#7c3aed' : '#0ea5e9' }}>{val} Refund</span> },
    { key: 'originalAmount', label: 'Original', render: (val) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{currencySymbol}{val.toLocaleString()}</span> },
    { key: 'refundAmount', label: 'Refund', render: (val) => <span style={{ fontWeight: 700, color: '#ef4444' }}>{currencySymbol}{val.toLocaleString()}</span> },
    { key: 'reason', label: 'Reason', render: (val) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{val}</span> },
    { key: 'date', label: 'Date', render: (val) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{val}</span> },
    { key: 'status', label: 'Status', render: (val, row) => {
      if (isPatient) {
        return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: val === 'Processed' ? 'var(--ecare-primary-bg)' : '#fffbeb', color: val === 'Processed' ? 'var(--ecare-primary)' : '#d97706' }}>{val}</span>
      }
      return (
        <div style={{ width: '120px' }}>
          <CustomSelect value={val} onChange={(v) => handleStatusChange(row.id, v)}
            options={[{ value: 'Processed', label: 'Processed' }, { value: 'Pending', label: 'Pending' }]}
            customTriggerStyle={{ background: val === 'Processed' ? 'var(--ecare-primary-bg)' : '#fffbeb', color: val === 'Processed' ? 'var(--ecare-primary)' : '#d97706', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, minWidth: 'unset', boxShadow: 'none' }}
          />
        </div>
      )
    }}
  ]

  const totalRefunded = displayRefunds.reduce((s, r) => s + (Number(r.refundAmount) || 0), 0)
  const pendingRefunds = displayRefunds.filter(r => r.status === 'Pending').length
  const processedToday = displayRefunds.filter(r => r.status === 'Processed' && r.date === new Date().toISOString().split('T')[0]).length

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 3, '--stat-grid-cols-md': 3 }}>
        <StatCard title="Total Refunded" value={`${currencySymbol}${totalRefunded.toLocaleString()}`} icon={ArrowClockwise} color="#8b5cf6" delay={0.1} />
        <StatCard title="Pending Refunds" value={pendingRefunds} icon={Hourglass} color="#f59e0b" delay={0.2} />
        <StatCard title="Processed Today" value={processedToday} icon={CheckCircle} color="var(--ecare-primary)" delay={0.3} />
      </div>

      <DataTable 
        data={displayRefunds} 
        columns={columns} 
        searchPlaceholder="Search refunds..." 
        title={isPatient ? "My Refund Requests" : "Refund Records"} 
        addLabel={isAdmin ? "Process Refund" : null} 
        onAdd={isAdmin ? () => setIsModalOpen(true) : null} 
      />

      <Portal>
        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsModalOpen(false)}
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
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
                    maxHeight: '90vh', 
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
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
                        <CreditCard size={20} weight="bold" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                          Process Refund
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Authorize transaction reversal or reimbursement
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
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

                  <form onSubmit={handleProcess} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="ecare-scrollbar">
                    <div className="ecare-form-group">
                      <label className="ecare-label">Select Transaction</label>
                      <CustomSelect value={selectedTxn?.id || ''} onChange={(v) => setSelectedTxn(eligibleTxns.find(t => t.id === Number(v)))}
                        options={eligibleTxns.map(t => ({ value: t.id, label: `${t.invoiceNo} — ${t.patientName} (${currencySymbol}${t.paidAmount})` }))}
                        isSearchable customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }} />
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                        Only transactions within manual refund window are shown (Instant Call: {instantRefundDuration}h, Standard: {standardRefundDuration} days).
                      </div>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Refund Type</label>
                      <CustomSelect value={refundForm.type} onChange={v => setRefundForm({...refundForm, type: v})}
                        options={[{ value: 'Full', label: 'Full Refund' }, { value: 'Partial', label: 'Partial Refund' }]}
                        customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }} />
                    </div>
                    {refundForm.type === 'Partial' && (
                      <div className="ecare-form-group">
                        <label className="ecare-label">Refund Amount ({currencySymbol})</label>
                        <input type="number" className="ecare-input" required value={refundForm.amount} onChange={e => setRefundForm({...refundForm, amount: e.target.value})} max={selectedTxn?.paidAmount} />
                      </div>
                    )}
                    <div className="ecare-form-group">
                      <label className="ecare-label">Reason</label>
                      <textarea className="ecare-input" rows={3} required value={refundForm.reason} onChange={e => setRefundForm({...refundForm, reason: e.target.value})} style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}>Cancel</button>
                      <button type="submit" className="ecare-button" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} weight="bold" /> Process Refund
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </motion.div>
  )
}

export default RefundManager
