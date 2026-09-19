import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  CurrencyDollar, Wallet, ArrowUpRight, CheckCircle, 
  Clock, UserCircle, TrendUp, ChartLineUp, CurrencyCircleDollar
} from 'phosphor-react'
import useStore from '../../store/useStore'
import DataTable from '../../components/DataTable'
import DisbursementModal from '../../components/DisbursementModal'
import toast from 'react-hot-toast'
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

const PayoutManager = () => {
  const { 
    transactions, 
    appointments,
    doctorList, 
    payouts, 
    serviceCommissions,
    currencySymbol,
    addPayout,
    deletePayout,
    openConfirm
  } = useStore()

  const [search, setSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('registry')

  // Calculate doctor metrics
  const doctorMetrics = useMemo(() => {
    const config = serviceCommissions || { 
      doctors: { rate: 20, enabled: true }, 
      ambulance: { rate: 15, enabled: true }, 
      careProviders: { rate: 15, enabled: true }, 
      lab: { rate: 10, enabled: true } 
    }
    
    const safeDoctors = Array.isArray(doctorList) ? doctorList : []
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    const safeAppointments = Array.isArray(appointments) ? appointments : []
    const safePayouts = Array.isArray(payouts) ? payouts : []

    return safeDoctors.map(doctor => {
      // Count only money actually collected for this doctor.
      const docTxns = safeTransactions.filter(t => 
        (t.doctorName === doctor.name || safeAppointments.some(a =>
          String(a.id) === String(t.appointmentId || t.appointment_id) && a.doctorName === doctor.name
        )) &&
        ['Paid', 'Partially Paid'].includes(t.status)
      )

      const totalRevenue = docTxns.reduce((sum, t) => {
        const collected = t.status === 'Paid'
          ? (Number(t.paidAmount) || Number(t.amount) || 0)
          : (Number(t.paidAmount) || 0)
        return sum + collected
      }, 0)
      
      // Determine commission for this provider type
      // Most care providers in doctorList are 'doctors', but we check specialization/category if available
      const commConfig = config.doctors || { rate: 0, enabled: false }
      const currentRate = commConfig.enabled ? (Number(commConfig.rate) || 0) : 0
      
      const platformShare = (totalRevenue * currentRate) / 100
      const doctorNet = totalRevenue - platformShare

      // Calculate already disbursed amount
      const totalDisbursed = safePayouts
        .filter(p => (p.doctorName === doctor.name || p.doctor_name === doctor.name) && ['Paid', 'Completed'].includes(p.status))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

      const pendingPayouts = safePayouts
        .filter(p => (p.doctorName === doctor.name || p.doctor_name === doctor.name) && p.status === 'Pending')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

      const balanceDue = Math.max(0, doctorNet - totalDisbursed - pendingPayouts)

      return {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization || 'N/A',
        photo: doctor.photo || doctor.avatar,
        // Standard bank payout credentials
        bankName: doctor.bankName,
        branchName: doctor.branchName,
        accountName: doctor.accountName,
        accountNumber: doctor.accountNumber,
        accountType: doctor.accountType,
        // Mobile banking payout credentials
        mobileProvider: doctor.mobileProvider,
        mobileNumber: doctor.mobileNumber,
        mobileAccountType: doctor.mobileAccountType,
        mobileReference: doctor.mobileReference,
        totalRevenue,
        platformShare,
        currentRate,
        doctorNet,
        totalDisbursed,
        pendingPayouts,
        balanceDue,
        status: doctor.status
      }
    })
  }, [doctorList, transactions, appointments, payouts, serviceCommissions])

  const pendingRequests = useMemo(() => {
    return (payouts || []).filter(p => p.status === 'Pending')
  }, [payouts])

  const totals = useMemo(() => {
    return doctorMetrics.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.totalRevenue,
      platform: acc.platform + curr.platformShare,
      net: acc.net + curr.doctorNet,
      due: acc.due + curr.balanceDue
    }), { revenue: 0, platform: 0, net: 0, due: 0 })
  }, [doctorMetrics])

  const handleOpenDisbursement = (doctor) => {
    if (doctor.balanceDue <= 0) {
      toast.error('No pending balance for this provider')
      return
    }
    setSelectedDoctor(doctor)
    setIsModalOpen(true)
  }

  const columns = [
    { 
      key: 'name', 
      label: 'Care Provider',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: 'var(--ecare-primary-bg)', 
            color: 'var(--ecare-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 800, 
            fontSize: '0.9rem',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {row.photo ? (
              <img src={row.photo} alt={val} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              val.charAt(0)
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1e293b' }}>{val}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.specialization}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'totalRevenue', 
      label: 'Gross Billing',
      render: (val) => <span style={{ fontWeight: 600 }}>{currencySymbol}{val.toLocaleString()}</span>
    },
    { 
      key: 'platformShare', 
      label: `Comm. Rate`,
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>-{currencySymbol}{val.toLocaleString()}</span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Split @ {row.currentRate}%</span>
        </div>
      )
    },
    { 
      key: 'doctorNet', 
      label: 'Net Earnings',
      render: (val) => <span style={{ color: 'var(--ecare-primary)', fontWeight: 800 }}>{currencySymbol}{val.toLocaleString()}</span>
    },
    { 
      key: 'totalDisbursed', 
      label: 'Disbursed',
      render: (val) => <span style={{ fontWeight: 600 }}>{currencySymbol}{val.toLocaleString()}</span>
    },
    { 
      key: 'balanceDue', 
      label: 'Pending Balance',
      render: (val) => (
        <div style={{ 
          padding: '0.4rem 0.8rem', borderRadius: '8px', 
          background: val > 0 ? '#fff7ed' : 'var(--ecare-primary-bg)',
          color: val > 0 ? '#c2410c' : '#15803d',
          fontWeight: 800, fontSize: '0.85rem', width: 'fit-content'
        }}>
          {currencySymbol}{val.toLocaleString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Disbursement',
      render: (_, row) => (
        <button 
          onClick={() => handleOpenDisbursement(row)}
          disabled={row.balanceDue <= 0}
          style={{ 
            padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
            background: row.balanceDue > 0 ? 'var(--ecare-primary)' : '#f1f5f9',
            color: row.balanceDue > 0 ? 'white' : '#94a3b8',
            fontSize: '0.75rem', fontWeight: 700, cursor: row.balanceDue > 0 ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
          }}
        >
          <CurrencyCircleDollar size={16} weight="bold" />
          {row.balanceDue > 0 ? 'Disburse' : 'Settled'}
        </button>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
      {/* Revenue Split Overview */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Total Gross Revenue" value={`${currencySymbol}${totals.revenue.toLocaleString()}`} icon={ChartLineUp} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Platform Revenue" value={`${currencySymbol}${totals.platform.toLocaleString()}`} icon={TrendUp} color="var(--ecare-primary-v2)" delay={0.2} />
        <StatCard title="Doctor Net Pool" value={`${currencySymbol}${totals.net.toLocaleString()}`} icon={Wallet} color="var(--ecare-primary-v3)" delay={0.3} />
        <StatCard title="Pending Payouts" value={`${currencySymbol}${totals.due.toLocaleString()}`} icon={CurrencyCircleDollar} color="var(--ecare-primary-v4)" delay={0.4} />
      </div>

      {/* Modern Tabs Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        borderBottom: '1px solid #e2e8f0', 
        paddingBottom: '0.25rem'
      }}>
        {[
          { id: 'registry', label: 'Earning History', count: null },
          { id: 'pending', label: 'Pending Payout Requests', count: pendingRequests.length },
          { id: 'history', label: 'Recent Disbursement History', count: null }
        ].map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? 'var(--ecare-primary)' : 'var(--ecare-text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--ecare-primary)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                outline: 'none',
                marginBottom: '-0.35rem'
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '99px',
                  background: tab.count > 0 ? '#ef4444' : '#64748b',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tabs Content */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'registry' && (
          <div style={{ marginBottom: '1rem' }}>
            <DataTable 
              data={doctorMetrics} 
              columns={columns} 
              search={search}
              onSearch={setSearch}
              searchPlaceholder="Search doctors or specialities..."
              title="Earnings Registry"
            />
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="ecare-card" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={22} weight="duotone" color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>
                Pending Payout Requests {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
              </h3>
            </div>
            {pendingRequests.length > 0 ? (
              <DataTable 
                data={pendingRequests}
                columns={[
                  { key: 'created_at', label: 'Requested Date', render: (val, row) => {
                    const dateVal = val || row.created_at || row.date;
                    return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
                  }},
                  { key: 'doctorName', label: 'Doctor', render: (val, row) => row.doctor_name || row.doctorName || val },
                  { 
                    key: 'amount', 
                    label: 'Requested Amount', 
                    render: (val) => <span style={{ fontWeight: 800, color: 'var(--ecare-primary)' }}>{currencySymbol}{Number(val).toLocaleString()}</span> 
                  },
                  { key: 'method', label: 'Preferred Method', render: (val) => formatPaymentMethod(val) },
                  { 
                    key: 'account_info', 
                    label: 'Account Details & Notes', 
                    render: (val, row) => {
                      let parsed = null;
                      if (val && typeof val === 'object') {
                        parsed = val;
                      } else {
                        try {
                          parsed = JSON.parse(val || row.account_info);
                        } catch(e) {}
                      }

                      if (parsed && typeof parsed === 'object') {
                        return (
                          <div style={{ fontSize: '0.8rem', color: 'var(--ecare-text-muted)', lineHeight: '1.4' }}>
                            <div><b>A/C Name:</b> {parsed.accountName || 'N/A'}</div>
                            <div><b>A/C No:</b> {parsed.accountNumber || 'N/A'}</div>
                            <div><b>Bank:</b> {parsed.bankName || 'N/A'} ({parsed.branchName || 'N/A'})</div>
                            {parsed.notes && <div><b>Notes:</b> {parsed.notes}</div>}
                          </div>
                        );
                      }

                      const fallbackText = typeof val === 'string' ? val : (typeof row.notes === 'string' ? row.notes : 'N/A');
                      return <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{fallbackText}</span>;
                    }
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (_, row) => (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            const doc = doctorList.find(d => 
                              parseInt(d.user_id) === parseInt(row.doctor_id) || 
                              parseInt(d.id) === parseInt(row.doctor_id) ||
                              d.name === row.doctor_name ||
                              d.name === row.doctorName
                            );
                            
                            let accountDetails = {};
                            try {
                              if (row.account_info) {
                                accountDetails = JSON.parse(row.account_info);
                              }
                            } catch(e) {}
                            
                            const modalDocData = {
                              ...(doc || { name: row.doctor_name || row.doctorName || 'Doctor', specialization: 'Care Provider' }),
                              balanceDue: Number(row.amount),
                              payoutRequestId: row.id,
                              preferredMethod: row.method || accountDetails.accountType || 'Bank Transfer',
                              requestNotes: accountDetails.notes || row.notes || '',
                              // Standard bank fields
                              accountNumber: accountDetails.accountNumber || doc?.accountNumber,
                              bankName: accountDetails.bankName || doc?.bankName,
                              branchName: accountDetails.branchName || doc?.branchName,
                              accountName: accountDetails.accountName || doc?.accountName,
                              accountType: accountDetails.accountType || doc?.accountType || 'Bank Account',
                              // Mobile banking fields
                              mobileProvider: accountDetails.mobileProvider || doc?.mobileProvider,
                              mobileNumber: accountDetails.mobileNumber || doc?.mobileNumber,
                              mobileAccountType: accountDetails.mobileAccountType || doc?.mobileAccountType,
                              mobileReference: accountDetails.mobileReference || doc?.mobileReference,
                            };
                            
                            handleOpenDisbursement(modalDocData);
                          }}
                          style={{ padding: '0.4rem 0.8rem', background: 'var(--ecare-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Process & Approve
                        </button>
                        <button
                          onClick={() => {
                            openConfirm({
                              title: 'Reject Disbursement Request',
                              message: `Are you sure you want to reject this payout request of ${currencySymbol}${Number(row.amount).toLocaleString()} for ${row.doctor_name || row.doctorName || 'this doctor'}? This request will be permanently deleted.`,
                              confirmText: 'Reject Request',
                              cancelText: 'Cancel',
                              onConfirm: async () => {
                                const success = await deletePayout(row.id);
                                if (success) {
                                  toast.success('Disbursement request rejected successfully.');
                                }
                              }
                            });
                          }}
                          style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </div>
                    )
                  }
                ]}
                hideSearch
                title="Pending Requests"
              />
            ) : (
              <div style={{ padding: '1.25rem', background: 'var(--ecare-primary-bg)', borderRadius: '12px', border: '1px dashed rgba(26, 142, 110, 0.2)', textAlign: 'center', color: 'var(--ecare-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                No pending disbursement requests from care providers at the moment.
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Recent Disbursement History</h3>
            <DataTable 
              data={payouts} 
              columns={[
                { key: 'created_at', label: 'Date', render: (val, row) => {
                  const dateVal = val || row.created_at || row.date;
                  return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
                }},
                { key: 'doctorName', label: 'Care Provider' },
                { key: 'amount', label: 'Amount', render: (val) => <b>{currencySymbol}{Number(val).toLocaleString()}</b> },
                { key: 'method', label: 'Method', render: (val) => formatPaymentMethod(val) },
                { key: 'reference', label: 'Reference', render: (val) => <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{val || 'N/A'}</span> },
                { key: 'status', label: 'Status', render: (val) => (
                  <span className={`ecare-badge ${val === 'Paid' ? 'badge-success' : 'badge-warning'}`}>{val}</span>
                )},
                {
                  key: 'actions',
                  label: 'Action',
                  render: (_, row) => (
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this disbursement log? This action is permanent and cannot be undone.")) {
                          const success = await deletePayout(row.id);
                          if (success) {
                            toast.success('Disbursement log removed successfully!');
                          }
                        }
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
                      Delete Log
                    </button>
                  )
                }
              ]}
              hideSearch
              title="Payout Logs"
            />
          </div>
        )}
      </motion.div>

      <DisbursementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doctor={selectedDoctor}
      />
    </motion.div>
  )
}

export default PayoutManager
