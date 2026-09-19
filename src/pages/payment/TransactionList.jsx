import React, { useState, useMemo } from 'react'
import { 
  CreditCard, MagnifyingGlass, Funnel, 
  Download, Printer, X, Eye, 
  CheckCircle, XCircle, Hourglass, 
  Buildings, FilePdf, CalendarCheck, 
  Trash, PencilSimple, ArrowsDownUp,
  CaretLeft, CaretRight
} from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import useAuth from '../../hooks/useAuth'
import CustomSelect from '../../components/CustomSelect'
import DataTable from '../../components/DataTable'
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

const TransactionList = () => {
  const { 
    transactions, addTransaction, updateTransaction, 
    deleteTransaction, bulkDelete, addPaymentToTransaction, 
    currencySymbol, paymentGateways, patients
  } = useStore()
  
  const [search, setSearch] = useState('')
  const { user, isAdmin, isPatient } = useAuth()
  const [activeTab, setActiveTab] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [collectingPayment, setCollectingPayment] = useState(null)
  const [newPayment, setNewPayment] = useState('')
  const [newMethod, setNewMethod] = useState('Cash')
  const [paymentError, setPaymentError] = useState('')
  const [previewInvoice, setPreviewInvoice] = useState(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const bookings = useMemo(() => {
    if (!previewInvoice) return [];
    try {
      const history = typeof previewInvoice.paymentHistory === 'string'
        ? JSON.parse(previewInvoice.paymentHistory)
        : (previewInvoice.paymentHistory || {});
      return history.bookings || [];
    } catch (e) {
      return [];
    }
  }, [previewInvoice]);

  const invoiceDiscount = useMemo(() => {
    if (!previewInvoice) return 0;
    try {
      const history = typeof previewInvoice.paymentHistory === 'string'
        ? JSON.parse(previewInvoice.paymentHistory)
        : (previewInvoice.paymentHistory || {});
      return Number(history.discountAmount || 0);
    } catch (e) {
      return 0;
    }
  }, [previewInvoice]);
  
  const [form, setForm] = useState({
    patientName: '',
    category: 'Appointment',
    description: '',
    amount: '',
    paidAmount: '',
    method: 'Cash',
    status: 'Paid',
    date: new Date().toISOString().split('T')[0]
  })

  const [customMethods, setCustomMethods] = useState([])

  const categories = ['All', 'Appointment', 'Care Provider', 'Lab Test', 'Health Product']
  
  const enabledMethods = useMemo(() => {
    const base = Object.entries(paymentGateways || {})
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => ({ value: formatPaymentMethod(config.name || key), label: formatPaymentMethod(config.name || key) }))
    
    return [...base, ...customMethods.map(m => ({ value: formatPaymentMethod(m), label: formatPaymentMethod(m) }))]
  }, [paymentGateways, customMethods])

  const filteredTransactions = useMemo(() => {
    let list = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
    if (isPatient) {
      const pName = (user?.name || user?.display_name || user?.user_login || '').trim().toLowerCase()
      const uId = String(user?.id || '')
      list = list.filter(t => 
        (t.patient_user_id && String(t.patient_user_id) === uId) ||
        (t.patient_id && String(t.patient_id) === uId) ||
        (t.patientId && String(t.patientId) === uId) ||
        (t.user_id && String(t.user_id) === uId) ||
        (t.patientName && pName && t.patientName.trim().toLowerCase() === pName)
      )
    }
    if (activeTab !== 'All') list = list.filter(t => t.category === activeTab)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => 
        t.patientName?.toLowerCase().includes(q) || 
        t.invoiceNo?.toLowerCase().includes(q) ||
        t.method?.toLowerCase().includes(q) ||
        formatPaymentMethod(t.method)?.toLowerCase().includes(q)
      )
    }
    return list
  }, [transactions, activeTab, search, isPatient, user])

  const handleAdd = (e) => {
    e.preventDefault()
    addTransaction(form)
    setIsModalOpen(false)
    setForm({ patientName: '', category: 'Appointment', description: '', amount: '', paidAmount: '', method: 'Cash', status: 'Paid', date: new Date().toISOString().split('T')[0] })
  }

  const handleCollect = (e) => {
    e.preventDefault()
    if (Number(newPayment) <= 0) {
      setPaymentError('Enter valid amount')
      return
    }
    const due = collectingPayment.amount - (Number(collectingPayment.paidAmount) || 0)
    if (Number(newPayment) > due) {
      setPaymentError('Exceeds remaining balance')
      return
    }
    
    addPaymentToTransaction(collectingPayment.id, newPayment, newMethod)
    setCollectingPayment(null)
    setNewPayment('')
    setPaymentError('')
  }

  const handleAmountChange = (val) => {
    setNewPayment(val)
    if (paymentError) setPaymentError('')
  }

  const handleAddMethod = (val) => {
    if (!customMethods.includes(val)) {
      setCustomMethods([...customMethods, val])
    }
    if (collectingPayment) {
      setNewMethod(val)
    } else {
      setForm({...form, method: val})
    }
  }

  const handleDelete = (id) => {
    useStore.getState().openConfirm({
      title: 'Delete Transaction',
      message: 'Are you sure you want to remove this financial record? This cannot be undone.',
      confirmText: 'Delete Record',
      variant: 'danger',
      onConfirm: () => deleteTransaction(id)
    })
  }

  const handleBulkDelete = (ids) => bulkDelete('billing', ids)

  const handleStatusChange = (id, status) => {
    updateTransaction(id, { status })
  }

  const handleCombineInvoices = (ids) => {
    const selectedObjects = transactions.filter(t => ids.includes(t.id));
    const firstPatient = selectedObjects[0]?.patientName;
    const allSamePatient = selectedObjects.every(t => t.patientName === firstPatient);

    if (!allSamePatient) {
      toast.error('Combined invoices must belong to the same patient');
      return;
    }

    // Create a virtual combined transaction
    const totalAmount = selectedObjects.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalPaid = selectedObjects.reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0);
    
    const combinedInvoice = {
      ...selectedObjects[0], // Keep patient info
      id: 'combined-' + Date.now(),
      invoiceNo: 'CMB-' + Math.floor(1000 + Math.random() * 9000),
      description: 'Combined Medical Services',
      amount: totalAmount,
      paidAmount: totalPaid,
      status: totalPaid >= totalAmount ? 'Paid' : (totalPaid > 0 ? 'Partially Paid' : 'Due'),
      isCombined: true,
      items: selectedObjects.map(t => ({
        description: t.description,
        category: t.category,
        amount: t.amount
      }))
    };

    setPreviewInvoice(combinedInvoice);
    setIsInvoiceModalOpen(true);
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice', render: (val, row) => <span style={{ fontWeight: 700, color: 'var(--ecare-primary)', fontSize: '0.75rem' }}>{val || `#INV-${String(row.id).slice(0, 8).toUpperCase()}`}</span> },
    { key: 'patientName', label: 'Patient', render: (val) => <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</span> },
    { key: 'category', label: 'Category', render: (val) => {
      const colors = { Appointment: '#0ea5e9', 'Care Provider': 'var(--ecare-primary)', 'Lab Test': '#8b5cf6', 'Health Product': '#f59e0b' }
      return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: `${colors[val] || '#94a3b8'}15`, color: colors[val] || '#94a3b8' }}>{val}</span>
    }},
    { key: 'amount', label: 'Financial Detail', render: (val, row) => {
      const due = val - (Number(row.paidAmount) || 0);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ecare-text-main)' }}>{currencySymbol}{val.toLocaleString()}</div>
          {row.status === 'Partially Paid' && (
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--ecare-primary)' }}>
              Paid: {currencySymbol}{(Number(row.paidAmount) || 0).toLocaleString()}
            </div>
          )}
          {due > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444' }}>
                Due: {currencySymbol}{due.toLocaleString()}
              </div>
              <button 
                onClick={() => setCollectingPayment(row)}
                style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Collect
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={10} weight="bold" /> Fully Settled
            </div>
          )}
        </div>
      )
    }},
    { key: 'date', label: 'Schedule & Booking', render: (val, row) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '0.8125rem', color: '#1e293b', fontWeight: 600 }}>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Service:</span> {val}
        </div>
        {row.created_at && (
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>
            <span style={{ color: '#94a3b8', textTransform: 'uppercase' }}>Booked:</span> {new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        )}
      </div>
    )},
    { key: 'status', label: 'Status', render: (val, row) => {
      const bg = { Paid: 'var(--ecare-primary-bg)', Pending: '#fffbeb', Failed: '#fef2f2', Refunded: '#f5f3ff', 'Partially Paid': '#f0f9ff', Due: '#fff7ed', 'Under Verify': '#fdf2f7' }
      const fg = { Paid: 'var(--ecare-primary)', Pending: '#d97706', Failed: '#ef4444', Refunded: '#7c3aed', 'Partially Paid': '#0ea5e9', Due: '#ea580c', 'Under Verify': '#db2777' }
      if (isPatient) {
        return (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: bg[val] || '#f1f5f9', color: fg[val] || '#64748b' }}>
            {val}
          </span>
        )
      }
      return (
        <div style={{ width: '130px' }}>
          <CustomSelect value={val} onChange={(v) => handleStatusChange(row.id, v)}
            options={[
              { value: 'Paid', label: 'Paid' }, 
              { value: 'Pending', label: 'Pending' }, 
              { value: 'Failed', label: 'Failed' }, 
              { value: 'Refunded', label: 'Refunded' }, 
              { value: 'Partially Paid', label: 'Partially Paid' }, 
              { value: 'Due', label: 'Due' },
              { value: 'Under Verify', label: 'Under Verify' }
            ]}
            customTriggerStyle={{ background: bg[val], color: fg[val], border: 'none', padding: '0.3rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, minWidth: 'unset', boxShadow: 'none' }}
          />
        </div>
      )
    }},
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <button 
        onClick={() => setPreviewInvoice(row)}
        title="View Invoice"
        style={{ 
          background: 'var(--ecare-primary-bg)', 
          border: 'none', 
          color: 'var(--ecare-primary)', 
          padding: '6px', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center'
        }}
      >
        <Eye size={18} weight="bold" />
      </button>
    )}
  ]

  const totalTxns = filteredTransactions.length
  const paidCount = filteredTransactions.filter(t => t.status === 'Paid').length
  const pendingCount = filteredTransactions.filter(t => ['Pending', 'Due', 'Partially Paid'].includes(t.status)).length
  const failedCount = filteredTransactions.filter(t => t.status === 'Failed').length

  const handlePrint = () => { window.print() }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Total Transactions" value={totalTxns} icon={CalendarCheck} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Successful" value={paidCount} icon={CheckCircle} color="var(--ecare-primary)" delay={0.2} />
        <StatCard title="Pending / Due" value={pendingCount} icon={Hourglass} color="#f59e0b" delay={0.3} />
        <StatCard title="Failed" value={failedCount} icon={XCircle} color="#ef4444" delay={0.4} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            style={{ padding: '0.4rem 1rem', borderRadius: '9999px', border: activeTab === cat ? '2px solid var(--ecare-primary)' : '1px solid #e2e8f0', background: activeTab === cat ? 'var(--ecare-primary-bg)' : 'white', color: activeTab === cat ? 'var(--ecare-primary)' : '#64748b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >{cat}</button>
        ))}
      </div>

      <DataTable 
        data={filteredTransactions} 
        columns={columns} 
        searchPlaceholder="Search by invoice, patient or method..." 
        title={isPatient ? "My Payment History" : "Transaction Ledger"}
        onBulkDelete={isAdmin ? handleBulkDelete : null}
        bulkActions={isAdmin ? [
          { 
            label: 'Combine Invoices', 
            icon: <FilePdf size={16} />, 
            onClick: handleCombineInvoices,
            variant: 'primary'
          }
        ] : []}
        onAdd={isAdmin ? () => setIsModalOpen(true) : null} 
        addLabel={isAdmin ? "Add Transaction" : null}
        onDelete={isAdmin ? (id) => handleDelete(id) : null} 
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
                          Record Transaction
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Manual clinical and billing transaction entry
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

                  <form onSubmit={handleAdd} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="ecare-scrollbar">
                    <div className="ecare-form-group">
                      <label className="ecare-label">Patient Name</label>
                      <input className="ecare-input" required value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="ecare-form-group"><label className="ecare-label">Category</label>
                        <CustomSelect value={form.category} onChange={v => setForm({...form, category: v})} options={categories.slice(1).map(c => ({ value: c, label: c }))} customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }} />
                      </div>
                      <div className="ecare-form-group"><label className="ecare-label">Method</label>
                        <CustomSelect 
                          value={form.method} 
                          onChange={v => setForm({...form, method: v})} 
                          options={enabledMethods} 
                          isSearchable={true}
                          onAdd={handleAddMethod}
                          addLabel="Add"
                          customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }} 
                        />
                      </div>
                    </div>
                    <div className="ecare-form-group"><label className="ecare-label">Description</label><input className="ecare-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="ecare-form-group"><label className="ecare-label">Total Amount ({currencySymbol})</label><input type="number" className="ecare-input" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
                      <div className="ecare-form-group"><label className="ecare-label">Initial Payment ({currencySymbol})</label><input type="number" className="ecare-input" value={form.paidAmount} onChange={e => setForm({...form, paidAmount: e.target.value})} placeholder={form.amount || "0"} /></div>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Status</label>
                      <CustomSelect value={form.status} onChange={v => setForm({...form, status: v})} options={[
                        { value: 'Paid', label: 'Paid' }, 
                        { value: 'Partially Paid', label: 'Partially Paid' },
                        { value: 'Pending', label: 'Pending' }, 
                        { value: 'Due', label: 'Due' }
                      ]} customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}>Cancel</button>
                      <button type="submit" className="ecare-button" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} weight="bold" /> Record Transaction
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}

          {collectingPayment && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setCollectingPayment(null)}
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
                    maxWidth: '420px', 
                    pointerEvents: 'auto',
                    position: 'relative', 
                    padding: 0, 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
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
                          Collect Balance
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Invoice: {collectingPayment.invoiceNo}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCollectingPayment(null)}
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

                  <form onSubmit={handleCollect} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Total Billed:</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{currencySymbol}{collectingPayment.amount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#ef4444', fontWeight: 700 }}>Remaining Due:</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#ef4444' }}>{currencySymbol}{(collectingPayment.amount - (Number(collectingPayment.paidAmount) || 0)).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="ecare-form-group" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label className="ecare-label" style={{ marginBottom: 0 }}>Payment Amount ({currencySymbol})</label>
                        {paymentError && (
                          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} 
                            style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px' }}>
                            {paymentError}
                          </motion.div>
                        )}
                      </div>
                      <input 
                        type="number" 
                        className="ecare-input" 
                        style={{ borderColor: paymentError ? '#ef4444' : '#e2e8f0', boxShadow: paymentError ? '0 0 0 1px #ef4444' : 'none' }}
                        required 
                        autoFocus 
                        value={newPayment} 
                        onChange={e => handleAmountChange(e.target.value)} 
                        placeholder="0.00" 
                      />
                    </div>

                    <div className="ecare-form-group">
                      <label className="ecare-label">Payment Method</label>
                      <CustomSelect 
                        value={newMethod} 
                        onChange={v => setNewMethod(v)} 
                        options={enabledMethods}
                        isSearchable={true}
                        onAdd={handleAddMethod}
                        addLabel="Add"
                        customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <button type="button" onClick={() => setCollectingPayment(null)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}>Cancel</button>
                      <button type="submit" className="ecare-button" style={{ flex: 1.5, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} weight="bold" /> Confirm Payment
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}

          {previewInvoice && (
            <div id="invoice-modal-wrapper" style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewInvoice(null)}
                className="no-print"
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="ecare-card" id="printable-invoice"
              style={{ 
                width: '100%', maxWidth: '800px', position: 'relative', padding: '0', border: 'none', 
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '95vh', overflow: 'hidden', 
                background: 'white', display: 'flex', flexDirection: 'column'
              }}>
              
              {/* Scrollable Content */}
              <div className="invoice-body-wrapper" style={{ padding: '0', overflowY: 'auto', flex: 1, color: '#333' }}>
                {/* 1. Header: Logo & Site Info */}
                <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {window.ecareConfig?.logo ? (
                      <img src={window.ecareConfig.logo} alt="Logo" style={{ height: '35px', width: 'auto' }} />
                    ) : (
                      <div style={{ width: '35px', height: '35px', borderRadius: '8px', background: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Buildings size={18} weight="bold" />
                      </div>
                    )}
                    <div>
                      <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#000', letterSpacing: '-0.02em' }}>{window.ecareConfig?.siteName || 'E-CARE'}</h1>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--ecare-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Health Management System</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#666', lineHeight: 1.4 }}>
                    <div>Address: {window.ecareConfig?.siteAddress || '32 Doctors Road, City Center'}</div>
                    <div>Phone: {window.ecareConfig?.sitePhone || '+880 1234 567890'}</div>
                    <div style={{ fontWeight: 700, color: 'var(--ecare-primary)' }}>{window.ecareConfig?.siteWebsite || 'www.ecare-management.com'}</div>
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed #e2e8f0', margin: '0 1.5rem' }} />

                {/* 2. Biller & Invoice Details */}
                <div style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ecare-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Invoice To :</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#000', marginBottom: '0.15rem' }}>{previewInvoice.patientName}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '1px', fontSize: '0.75rem' }}>
                      {(() => {
                        const targetName = previewInvoice.patientName?.trim().toLowerCase();
                        const p = (patients || []).find(pt => pt.name?.trim().toLowerCase() === targetName);
                        const phone = previewInvoice.patientPhone || p?.phone || 'N/A';
                        const email = previewInvoice.patientEmail || p?.email || 'patient@example.com';
                        return (
                          <>
                            <span style={{ color: 'var(--ecare-primary)', fontWeight: 700 }}>PHONE :</span> <span style={{ fontWeight: 600 }}>{phone}</span>
                            <span style={{ color: 'var(--ecare-primary)', fontWeight: 700 }}>EMAIL :</span> <span style={{ fontWeight: 600 }}>{email}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '2px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ecare-primary)', marginBottom: '2px' }}>INVOICE</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      <span style={{ color: '#64748b' }}>INV # :</span> {previewInvoice.invoiceNo || `#${previewInvoice.id}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      <span style={{ color: '#64748b' }}>SERVICE :</span> {new Date(previewInvoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    {previewInvoice.created_at && (
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', fontStyle: 'italic' }}>
                        Booked: {new Date(previewInvoice.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed #e2e8f0', margin: '0 1.5rem' }} />

                {/* 3. Line Items Table */}
                <div style={{ padding: '0.5rem 1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--ecare-primary)' }}>
                        <th style={{ textAlign: 'left', padding: '0.35rem 0.2rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ecare-primary)' }}>Description</th>
                        <th style={{ textAlign: 'center', padding: '0.35rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ecare-primary)', width: '60px' }}>Unit</th>
                        <th style={{ textAlign: 'center', padding: '0.35rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ecare-primary)', width: '40px' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '0.35rem 0.2rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ecare-primary)', width: '90px' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length > 0 ? (
                        <>
                          {bookings.map((b, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.35rem 0.2rem', fontSize: '0.7rem', fontWeight: 700, color: '#1e293b' }}>
                                {b.name || `${b.type} Booking #${b.id}`}
                                <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 500, marginTop: '1px' }}>Type: {b.type}</div>
                              </td>
                              <td style={{ padding: '0.35rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600 }}>{currencySymbol}{Number(b.price || 0).toLocaleString()}</td>
                              <td style={{ padding: '0.35rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600 }}>1</td>
                              <td style={{ padding: '0.35rem 0.2rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 800, color: '#000' }}>{currencySymbol}{Number(b.price || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                          {invoiceDiscount > 0 && (
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.35rem 0.2rem', fontSize: '0.7rem', fontWeight: 700, color: '#ef4444' }}>
                                Promo Code Discount
                              </td>
                              <td style={{ padding: '0.35rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#ef4444' }}>-{currencySymbol}{invoiceDiscount.toLocaleString()}</td>
                              <td style={{ padding: '0.35rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#ef4444' }}>1</td>
                              <td style={{ padding: '0.35rem 0.2rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 800, color: '#ef4444' }}>-{currencySymbol}{invoiceDiscount.toLocaleString()}</td>
                            </tr>
                          )}
                        </>
                      ) : previewInvoice.isCombined ? (
                        previewInvoice.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.35rem 0.2rem', fontSize: '0.7rem', fontWeight: 700, color: '#1e293b' }}>
                              {item.description}
                              <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 500, marginTop: '1px' }}>Category: {item.category}</div>
                            </td>
                            <td style={{ padding: '0.35rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600 }}>{currencySymbol}{Number(item.amount).toLocaleString()}</td>
                            <td style={{ padding: '0.35rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600 }}>1</td>
                            <td style={{ padding: '0.35rem 0.2rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 800, color: 'var(--ecare-primary)' }}>{currencySymbol}{Number(item.amount).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr style={{ background: '#ffffff' }}>
                          <td style={{ padding: '0.35rem 0.2rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#333', fontSize: '0.75rem' }}>
                            {previewInvoice.description}
                            <div style={{ fontSize: '0.6rem', color: '#999', fontWeight: 600 }}>Category: {previewInvoice.category}</div>
                          </td>
                          <td style={{ padding: '0.35rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>{currencySymbol}{previewInvoice.amount.toLocaleString()}</td>
                          <td style={{ padding: '0.35rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>1</td>
                          <td style={{ padding: '0.35rem 0.2rem', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, color: '#000', fontSize: '0.75rem' }}>{currencySymbol}{previewInvoice.amount.toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. Totals & Payment Info */}
                <div style={{ padding: '0.5rem 1.5rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ecare-primary)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Payment Info:</div>
                    <div style={{ fontSize: '0.65rem', lineHeight: 1.4, color: '#555' }}>
                      <div style={{ fontWeight: 700 }}>Method : <span style={{ color: '#000' }}>{formatPaymentMethod(previewInvoice.method)}</span></div>
                      <div style={{ fontWeight: 700 }}>Account : <span style={{ color: '#000' }}>E-CARE Central Revenue</span></div>
                      <div style={{ marginTop: '0.25rem', color: 'var(--ecare-primary)', fontWeight: 800, fontSize: '0.6rem' }}>THANKS FOR BUSINESS WITH US !</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', fontWeight: 800, fontSize: '0.75rem' }}>
                      <span style={{ color: '#64748b' }}>SUB TOTAL :</span>
                      <span>{currencySymbol}{previewInvoice.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', fontWeight: 800, fontSize: '0.75rem' }}>
                      <span style={{ color: '#64748b' }}>TAX (0%) :</span>
                      <span>{currencySymbol}0.00</span>
                    </div>
                    <div style={{ borderTop: '2px solid var(--ecare-primary)', padding: '0.35rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--ecare-primary)' }}>
                        {previewInvoice.status === 'Paid' ? 'TOTAL PAID :' : 'TOTAL DUE :'}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--ecare-primary)' }}>
                        {currencySymbol}{previewInvoice.amount.toLocaleString()}
                      </span>
                    </div>
                    {previewInvoice.status === 'Partially Paid' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', fontWeight: 800, fontSize: '0.75rem', color: '#ef4444' }}>
                        <span>REMAINING DUE :</span>
                        <span>{currencySymbol}{(previewInvoice.amount - (previewInvoice.paidAmount || 0)).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed #e2e8f0', margin: '0 1.5rem' }} />

                {/* 6. Footer: Terms & Signature */}
                <div className="invoice-footer-section">
                  <div style={{ padding: '0.75rem 1.5rem 1rem 1.5rem', pageBreakInside: 'avoid' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ecare-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Conditions:</div>
                        <ol style={{ paddingLeft: '0.85rem', margin: 0, fontSize: '0.6rem', color: '#777', lineHeight: 1.3 }}>
                          <li>This is a computer-generated invoice and does not require a physical signature.</li>
                          <li>Payments should be made via approved E-CARE gateways only.</li>
                        </ol>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#000', marginBottom: '1px' }}>{previewInvoice.issuedBy || 'System Administrator'}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--ecare-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AUTHORIZED SIGNATURE</div>
                        <div style={{ width: '120px', height: '1.2px', background: 'var(--ecare-primary)', marginTop: '3px' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#999' }}>Accepted : <span style={{ color: '#333' }}>Visa, MasterCard, Bkash, Nagad</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 900 }}>{window.ecareConfig?.siteName || 'E-CARE'}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--ecare-primary)', fontWeight: 700 }}>Official Medical Receipt</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="no-print" style={{ padding: '1rem 2rem', background: 'white', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={() => setPreviewInvoice(null)} className="ecare-btn-secondary" style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Close Preview</button>
                <button onClick={handlePrint} className="ecare-button" style={{ padding: '0.6rem 2rem', borderRadius: '10px', background: 'var(--ecare-primary)', borderColor: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                  <Printer size={18} weight="bold" /> Print Official Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </Portal>
    </motion.div>
  )
}

export default TransactionList
