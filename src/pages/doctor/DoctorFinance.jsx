import React, { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Wallet, Bank, Receipt, Clock, 
  TrendUp, CheckCircle, Info, CurrencyCircleDollar, X
} from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import DataTable from '../../components/DataTable'
import toast from 'react-hot-toast'

const StatCard = ({ title, value, icon: Icon, color, delay, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="ecare-card"
    style={{ borderRadius: '14px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ 
        width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color 
      }}>
        <Icon size={22} weight="duotone" />
      </div>
      {trend && (
        <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          {trend} <TrendUp size={12} style={{ marginLeft: '2px' }} />
        </div>
      )}
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.8125rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)

const DoctorFinance = () => {
  const { user, transactions, appointments, payouts, currencySymbol, getCurrentDoctor, serviceCommissions, doctorList, addPayout, deletePayout, openConfirm } = useStore()
  
  const [activeTab, setActiveTab] = useState('earnings') // 'earnings' | 'disbursements'
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  
  const currentDoctor = useMemo(() => getCurrentDoctor(), [getCurrentDoctor, doctorList, user])
  const doctorName = currentDoctor?.name || user?.name

  const myAppointments = useMemo(() => {
    return (appointments || []).filter(a => a.doctorName === doctorName)
  }, [appointments, doctorName])

  // Get doctor share rate based on admin commission settings
  const doctorShareRate = useMemo(() => {
    const rateConfig = serviceCommissions?.doctors
    if (rateConfig && rateConfig.enabled) {
      return 100 - (Number(rateConfig.rate) || 0)
    }
    return 100
  }, [serviceCommissions])

  // Get Consultation Earnings transactions
  const myTransactions = useMemo(() => {
    return (transactions || []).filter(t => 
      myAppointments.some(a => String(a.id) === String(t.appointmentId || t.appointment_id)) ||
      (t.category === 'Consultation' && String(t.description || '').includes(doctorName))
    )
  }, [transactions, myAppointments, doctorName])

  // Filter actual payouts/disbursements settled/requested by/for this doctor
  const myDisbursements = useMemo(() => {
    const docId = currentDoctor?.id || user?.id
    return (payouts || []).filter(p => 
      (p.doctor_id && parseInt(p.doctor_id) === parseInt(docId)) ||
      (p.doctorName && p.doctorName === doctorName) ||
      (p.doctor_name && p.doctor_name === doctorName)
    )
  }, [payouts, doctorName, currentDoctor, user])

  const mySettledDisbursements = useMemo(() => {
    return myDisbursements.filter(p => ['Paid', 'Completed'].includes(p.status))
  }, [myDisbursements])

  const myPendingDisbursements = useMemo(() => {
    return myDisbursements.filter(p => p.status === 'Pending')
  }, [myDisbursements])

  // Calculate live financial statistics
  const financialCalculations = useMemo(() => {
    const safeTxns = myTransactions || []
    const settledPayouts = mySettledDisbursements || []
    const pendingPayouts = myPendingDisbursements || []
    const earnedTxns = safeTxns.filter(t => ['Paid', 'Partially Paid'].includes(t.status))
    const collectibleTxns = safeTxns.filter(t => !['Failed', 'Refunded'].includes(t.status))

    const getCollectedAmount = (t) => t.status === 'Paid'
      ? (Number(t.paidAmount) || Number(t.amount) || 0)
      : (Number(t.paidAmount) || 0)
    const grossEarnings = earnedTxns.reduce((sum, t) => sum + getCollectedAmount(t), 0)
    const netEarnings = earnedTxns.reduce((sum, t) => sum + (getCollectedAmount(t) * doctorShareRate / 100), 0)
    const expectedPipeline = collectibleTxns
      .filter(t => t.status !== 'Paid')
      .reduce((sum, t) => sum + Math.max(0, (Number(t.amount) || 0) - (Number(t.paidAmount) || 0)), 0)
    const totalDisbursed = settledPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const pendingRequestsAmount = pendingPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    
    // Balance due from clinic
    const pendingDisbursement = Math.max(0, netEarnings - totalDisbursed)
    // Balance they can request right now
    const withdrawableBalance = Math.max(0, pendingDisbursement - pendingRequestsAmount)

    return {
      grossEarnings,
      netEarnings,
      expectedPipeline,
      totalDisbursed,
      pendingDisbursement,
      pendingRequestsAmount,
      withdrawableBalance
    }
  }, [myTransactions, mySettledDisbursements, myPendingDisbursements, doctorShareRate])

  const earningsColumns = [
    { key: 'invoiceNo', label: 'Invoice' },
    { key: 'patientName', label: 'Patient' },
    { key: 'date', label: 'Date' },
    { 
      key: 'amount', 
      label: 'Total Fee',
      render: (val) => `${currencySymbol}${Number(val).toLocaleString()}`
    },
    { 
      key: 'share', 
      label: `My Net Share (${doctorShareRate}%)`,
      render: (_, row) => {
        const collected = row.status === 'Paid' ? (Number(row.paidAmount) || Number(row.amount) || 0) : (Number(row.paidAmount) || 0)
        return <span style={{ fontWeight: 700, color: 'var(--ecare-primary)' }}>{currencySymbol}{(collected * doctorShareRate / 100).toLocaleString()}</span>
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (val) => (
        <span className={`ecare-badge ${val === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
          {val}
        </span>
      )
    }
  ]

  const disbursementColumns = [
    { key: 'created_at', label: 'Disbursed Date', render: (val, row) => {
      const dateVal = val || row.created_at || row.date;
      return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
    }},
    { 
      key: 'amount', 
      label: 'Amount Settled', 
      render: (val) => <span style={{ fontWeight: 800, color: 'var(--ecare-primary)' }}>{currencySymbol}{Number(val).toLocaleString()}</span> 
    },
    { key: 'method', label: 'Payment Method' },
    { key: 'reference', label: 'Reference / TrxID', render: (val) => <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{val || 'N/A'}</span> },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val) => (
        <span className={`ecare-badge badge-success`}>
          {val}
        </span>
      ) 
    }
  ]

  const requestColumns = [
    { key: 'created_at', label: 'Requested Date', render: (val, row) => {
      const dateVal = val || row.created_at || row.date;
      return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
    }},
    { 
      key: 'amount', 
      label: 'Requested Amount', 
      render: (val) => <span style={{ fontWeight: 800, color: 'var(--ecare-primary)' }}>{currencySymbol}{Number(val).toLocaleString()}</span> 
    },
    { key: 'method', label: 'Payment Method' },
    { key: 'notes', label: 'My Notes', render: (val) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{val || 'N/A'}</span> },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val) => (
        <span className={`ecare-badge badge-warning`}>
          {val}
        </span>
      ) 
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <button
          onClick={() => {
            openConfirm({
              title: 'Cancel Disbursement Request',
              message: `Are you sure you want to cancel this payout request of ${currencySymbol}${Number(row.amount).toLocaleString()}? This request will be permanently removed.`,
              confirmText: 'Cancel Request',
              cancelText: 'Go Back',
              onConfirm: async () => {
                const success = await deletePayout(row.id);
                if (success) {
                  toast.success('Disbursement request cancelled successfully!');
                }
              }
            });
          }}
          style={{
            padding: '0.4rem 0.8rem',
            background: '#fee2e2',
            color: '#ef4444',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Cancel Request
        </button>
      )
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}
      className="ecare-dashboard-page"
    >
      {/* Financial Overview Stat Grid */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Collected Revenue" value={`${currencySymbol}${financialCalculations.grossEarnings.toLocaleString()}`} icon={Receipt} color="#8b5cf6" delay={0.1} />
        <StatCard title="My Net Share" value={`${currencySymbol}${financialCalculations.netEarnings.toLocaleString()}`} icon={Wallet} color="var(--ecare-primary)" delay={0.2} trend="+12%" />
        <StatCard title="Disbursed Balance" value={`${currencySymbol}${financialCalculations.totalDisbursed.toLocaleString()}`} icon={CheckCircle} color="#0ea5e9" delay={0.3} />
        <StatCard title="Withdrawable Balance" value={`${currencySymbol}${financialCalculations.withdrawableBalance.toLocaleString()}`} icon={Clock} color="#f59e0b" delay={0.4} />
      </div>

      <div className="ecare-doctor-grid">
        {/* Transaction registries tab layout */}
        <div className="ecare-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '14px' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>Financial Registry</h3>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              <button 
                onClick={() => setActiveTab('earnings')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'earnings' ? 'white' : 'transparent',
                  color: activeTab === 'earnings' ? 'var(--ecare-primary)' : '#64748b',
                  boxShadow: activeTab === 'earnings' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Consultation Earnings
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'requests' ? 'white' : 'transparent',
                  color: activeTab === 'requests' ? 'var(--ecare-primary)' : '#64748b',
                  boxShadow: activeTab === 'requests' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Disbursement Requests ({myPendingDisbursements.length})
              </button>
              <button 
                onClick={() => setActiveTab('disbursements')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'disbursements' ? 'white' : 'transparent',
                  color: activeTab === 'disbursements' ? 'var(--ecare-primary)' : '#64748b',
                  boxShadow: activeTab === 'disbursements' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Disbursement Logs ({mySettledDisbursements.length})
              </button>
            </div>
          </div>

          {activeTab === 'earnings' && (
            <DataTable 
              data={myTransactions} 
              columns={earningsColumns} 
              searchPlaceholder="Search earnings transactions..."
              hideAdd 
            />
          )}

          {activeTab === 'requests' && (
            <DataTable 
              data={myPendingDisbursements} 
              columns={requestColumns} 
              searchPlaceholder="Search request history..."
              hideAdd 
            />
          )}

          {activeTab === 'disbursements' && (
            <DataTable 
              data={mySettledDisbursements} 
              columns={disbursementColumns} 
              searchPlaceholder="Search disbursement logs..."
              hideAdd 
            />
          )}
        </div>

        {/* Right Info Section: Automated Disbursement Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Automatic Clinic Settlements Card */}
          <div className="ecare-card" style={{ padding: '1.5rem', borderRadius: '14px', background: 'linear-gradient(135deg, var(--ecare-primary) 0%, #15803d 100%)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <CurrencyCircleDollar size={22} weight="duotone" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, opacity: 0.9 }}>Clinic Settlement</h3>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', opacity: 0.8, marginBottom: '0.25rem' }}>Pending Settlement</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{currencySymbol}{financialCalculations.pendingDisbursement.toLocaleString()}</div>
              {financialCalculations.pendingRequestsAmount > 0 && (
                <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '4px', fontWeight: 600 }}>
                  ({currencySymbol}{financialCalculations.pendingRequestsAmount.toLocaleString()} requested / pending)
                </div>
              )}
            </div>

            {financialCalculations.withdrawableBalance > 0 ? (
              <button 
                onClick={() => setIsRequestModalOpen(true)}
                style={{ width: '100%', marginBottom: '1.25rem', padding: '0.75rem', borderRadius: '12px', background: 'white', color: 'var(--ecare-primary)', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              >
                <CurrencyCircleDollar size={18} weight="bold" /> Request Disbursement
              </button>
            ) : (
              <button 
                disabled
                style={{ width: '100%', marginBottom: '1.25rem', padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', border: 'none', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                No Withdrawable Balance
              </button>
            )}

            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.875rem 1rem', borderRadius: '12px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <Info size={18} weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: 1.4, opacity: 0.9 }}>
                Your clinic disburses settled clinical balances directly to your registered bank or mobile banking details. You can request manual disbursements at any time.
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.875rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.75rem' }}>
              <div>
                <span style={{ opacity: 0.7, display: 'block', marginBottom: '2px' }}>Total Net Share</span>
                <span style={{ fontWeight: 700 }}>{currencySymbol}{financialCalculations.netEarnings.toLocaleString()}</span>
              </div>
              <div>
                <span style={{ opacity: 0.7, display: 'block', marginBottom: '2px' }}>Total Settled</span>
                <span style={{ fontWeight: 700 }}>{currencySymbol}{financialCalculations.totalDisbursed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Active Payment Details Card */}
          <div className="ecare-card" style={{ padding: '1.5rem', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)', marginBottom: '0.5rem' }}>Disbursement Details</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Registered bank or mobile wallet where clinic disbursements are transferred directly.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)', border: '1px solid #e2e8f0' }}>
                <Bank size={20} weight="duotone" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1f2937' }}>
                  {currentDoctor?.accountType === 'Mobile Banking'
                    ? (currentDoctor?.mobileProvider || 'No Details Configured')
                    : (currentDoctor?.bankName || 'No Details Configured')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', marginTop: '2px' }}>
                  {currentDoctor?.accountType === 'Mobile Banking'
                    ? (currentDoctor?.mobileNumber ? `•••• ${currentDoctor.mobileNumber.slice(-4)} (Mobile Banking)` : 'Please configure payout account')
                    : (currentDoctor?.accountNumber ? `•••• ${currentDoctor.accountNumber.slice(-4)} (${currentDoctor.accountType || 'Savings'})` : 'Please configure payout account')}
                </div>
              </div>
              {(currentDoctor?.accountNumber || currentDoctor?.mobileNumber) && <CheckCircle size={20} weight="fill" color="var(--ecare-primary)" />}
            </div>

            <button 
              className="ecare-btn-secondary" 
              style={{ width: '100%', marginTop: '1rem', padding: '0.875rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => useStore.getState().setActivePage('profile')}
            >
              <CreditCard size={18} weight="bold" /> Manage Banking Details
            </button>
          </div>
        </div>
      </div>

      <RequestDisbursementModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        withdrawableBalance={financialCalculations.withdrawableBalance}
        currentDoctor={currentDoctor}
        onSubmit={async (data) => {
          const isMobile = currentDoctor?.accountType === 'Mobile Banking'
          const success = await addPayout({
            doctor_id: currentDoctor?.id || user?.id,
            doctor_name: currentDoctor?.name || user?.name,
            amount: Number(data.amount),
            method: isMobile ? (currentDoctor?.mobileProvider || 'Mobile Banking') : 'Bank Transfer',
            account_info: JSON.stringify({
              bankName: isMobile ? '' : (currentDoctor?.bankName || 'N/A'),
              branchName: isMobile ? '' : (currentDoctor?.branchName || 'N/A'),
              accountName: isMobile ? '' : (currentDoctor?.accountName || 'N/A'),
              accountNumber: isMobile ? '' : (currentDoctor?.accountNumber || 'N/A'),
              mobileProvider: isMobile ? (currentDoctor?.mobileProvider || 'N/A') : '',
              mobileNumber: isMobile ? (currentDoctor?.mobileNumber || 'N/A') : '',
              mobileAccountType: isMobile ? (currentDoctor?.mobileAccountType || 'N/A') : '',
              mobileReference: isMobile ? (currentDoctor?.mobileReference || 'N/A') : '',
              accountType: currentDoctor?.accountType || 'N/A',
              notes: data.notes || ''
            }),
            reference_no: 'Request',
            status: 'Pending'
          })
          if (success) {
            toast.success('Disbursement request submitted successfully!')
          }
        }}
      />
    </motion.div>
  )
}

const RequestDisbursementModal = ({ isOpen, onClose, withdrawableBalance, currentDoctor, onSubmit }) => {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currencySymbol = useStore(state => state.currencySymbol)

  useEffect(() => {
    if (isOpen) {
      setAmount(withdrawableBalance.toString())
      setNotes('')
      setIsSubmitting(false)
    }
  }, [isOpen, withdrawableBalance])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Number(amount) <= 0 || Number(amount) > withdrawableBalance) {
      toast.error('Invalid disbursement request amount.')
      return
    }
    setIsSubmitting(true)
    await onSubmit({
      amount: Number(amount),
      notes
    })
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.3)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 9999
              }}
            />
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                pointerEvents: 'none'
              }}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="ecare-card"
                style={{ 
                  width: '100%', 
                  maxWidth: '480px', 
                  pointerEvents: 'auto',
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  padding: 0, 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  background: 'white', 
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
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
                      <Bank size={20} weight="bold" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                        Request Disbursement
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                        Submit payout request to hospital administration
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={onClose} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#94a3b8', 
                      cursor: 'pointer',
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

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="ecare-scrollbar">
                  <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1rem', border: '1.5px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Withdrawable Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ecare-primary)' }}>{currencySymbol}{withdrawableBalance.toLocaleString()}</div>
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Request Amount</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8' }}>{currencySymbol}</span>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        style={{ paddingLeft: '2.25rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ecare-text-main)', borderRadius: '12px' }}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        max={withdrawableBalance}
                        min={1}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1rem', border: '1.5px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Bank size={24} weight="duotone" color="var(--ecare-primary)" />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>
                        {currentDoctor?.accountType === 'Mobile Banking'
                          ? (currentDoctor?.mobileProvider || 'Payout Destination')
                          : (currentDoctor?.bankName || 'Payout Destination')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', marginTop: '2px' }}>
                        {currentDoctor?.accountType === 'Mobile Banking'
                          ? (currentDoctor?.mobileNumber ? `•••• ${currentDoctor.mobileNumber.slice(-4)} (Mobile Banking)` : 'No banking details configured')
                          : (currentDoctor?.accountNumber ? `•••• ${currentDoctor.accountNumber.slice(-4)} (${currentDoctor.accountType || 'Savings'})` : 'No banking details configured')}
                      </div>
                    </div>
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Request Notes (Optional)</label>
                    <textarea 
                      className="ecare-input" 
                      style={{ minHeight: '80px', resize: 'none', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any details or instructions for the finance team..."
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="ecare-btn-secondary" 
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting || Number(amount) <= 0 || Number(amount) > withdrawableBalance || !(currentDoctor?.accountNumber || currentDoctor?.mobileNumber)}
                      className="ecare-button" 
                      style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <CheckCircle size={18} weight="bold" />
                      {isSubmitting ? 'Requesting...' : 'Submit Request'}
                    </button>
                  </div>
                  {!(currentDoctor?.accountNumber || currentDoctor?.mobileNumber) && (
                    <p style={{ margin: 0, color: '#ef4444', fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>
                      * Please configure your banking details in your profile first.
                    </p>
                  )}
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default DoctorFinance
