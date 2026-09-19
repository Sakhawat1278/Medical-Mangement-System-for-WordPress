import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, DownloadSimple, MapPin, ClipboardText, Trash, CalendarCheck, Clock, CheckCircle, Flask } from 'phosphor-react'
import toast from 'react-hot-toast'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import CustomSelect from '../../components/CustomSelect'
import DataTable from '../../components/DataTable'
import { formatPaymentMethod } from '../../utils/formatters'

const STATUS_COLORS = { Pending:'#f59e0b', 'Sample Collected':'#0891b2', Processing:'#7c3aed', Completed:'var(--ecare-primary)', Cancelled:'#ef4444' }
const STATUS_BG = { Pending:'#fffbeb', 'Sample Collected':'#ecfeff', Processing:'#faf5ff', Completed:'var(--ecare-primary-bg)', Cancelled:'#fef2f2' }
const STATUSES = ['Pending','Sample Collected','Processing','Completed','Cancelled']

const inp = {width:'100%',padding:'0.55rem 1rem',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontSize:'0.8rem',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
const Field = ({label,children,span=1}) => <div style={{marginBottom:'0',gridColumn:`span ${span}`}}><label style={{display:'block',fontSize:'0.73rem',fontWeight:600,color:'#374151',marginBottom:'3px'}}>{label}</label>{children}</div>

export default function LabOrders({ orders, tests, locations = [], userRole }) {
  const { updateLabOrder, bulkDelete, addTransaction, openConfirm, paymentGateways, transactions, setLabBookingModal } = useStore()
  
  const gateways = useMemo(() => {
    return Object.entries(paymentGateways || {})
      .filter(([, g]) => g.enabled)
      .map(([k, g]) => ({ value: formatPaymentMethod(g.name || k), label: formatPaymentMethod(g.name || k) }));
  }, [paymentGateways])

  const [resultModal, setResultModal] = useState(null)
  const [detailRow, setDetailRow] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [result, setResult] = useState({ status:'Completed', result_value:'', result_notes:'', reviewed_by:'', report_file:null, report_file_name:'' })

  const isPatient = userRole === 'patient'

  const columns = [
    { 
      key: 'id', 
      label: 'ID', 
      render: (val) => <span style={{fontWeight:700, color:'var(--ecare-primary)', fontSize:'0.75rem'}}>#ORD-{String(val).slice(0, 8).toUpperCase()}</span> 
    },
    {
      key: 'test_id',
      label: 'Lab Facility',
      render: (_, row) => {
        const test = (tests||[]).find(t => String(t.id) === String(row.test_id))
        const provider = (locations||[]).find(l => String(l.id) === String(test?.location_id))
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--ecare-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={16} color="var(--ecare-primary)" weight="duotone" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{provider?.name || 'Central Lab'}</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{provider?.type || 'Diagnostic Center'}</span>
            </div>
          </div>
        )
      }
    },
    { 
      key: 'patient_name', 
      label: 'Patient', 
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {row.patient_id || 'N/A'}</div>
        </div>
      )
    },
    { 
      key: 'test_name', 
      label: 'Service', 
      render: (val, row) => (
        <div>
          <div style={{fontWeight:700, color:'var(--ecare-text-main)', fontSize:'0.8125rem'}}>{val}</div>
          <div style={{fontSize:'0.7rem', color:'#94a3b8'}}>{row.category || 'Clinical'} Diagnostic</div>
        </div>
      )
    },
    { 
      key: 'order_date', 
      label: 'Schedule', 
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</div>
          <div style={{ fontSize: '0.7rem', color: row.priority === 'Normal' ? '#94a3b8' : '#ef4444', fontWeight: 700 }}>
            {row.priority} Priority
          </div>
        </div>
      )
    },
    { 
      key: 'price', 
      label: 'Amount', 
      render: (val) => <div style={{fontWeight:700, fontSize:'0.875rem'}}>৳{Number(val||0).toLocaleString()}</div> 
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val, row) => {
        if (isPatient) {
          return (
            <span style={{ 
              padding: '0.3rem 0.6rem', borderRadius: '20px', 
              background: STATUS_BG[val]||'#f9fafb', color: STATUS_COLORS[val]||'#64748b',
              fontSize: '0.75rem', fontWeight: 700, display: 'inline-block',
              textTransform: 'uppercase'
            }}>
              {val}
            </span>
          )
        }

        return (
          <div style={{ width: '130px' }}>
            <CustomSelect 
              value={val}
              onChange={(newVal) => updateLabOrder(row.id, { status: newVal })}
              options={STATUSES.map(s=>({value:s,label:s}))}
              customTriggerStyle={{ 
                padding: '0.3rem 0.6rem', borderRadius: '20px', 
                background: STATUS_BG[val]||'#f9fafb', color: STATUS_COLORS[val]||'#64748b',
                fontSize: '0.75rem', fontWeight: 700, textAlign: 'center',
                textTransform: 'uppercase', minWidth: 'unset', boxShadow: 'none', border: 'none'
              }}
            />
          </div>
        )
      }
    },
    { 
      key: 'payment_status', 
      label: 'Payment', 
      render: (val, row) => {
        const txn = (transactions || []).find(t => String(t.labOrderId) === String(row.id) || String(t.lab_order_id) === String(row.id))
        const method = formatPaymentMethod(txn?.method) || 'Pending'

        const getStyle = (s) => {
          const status = s?.toLowerCase() || 'unpaid';
          if (status === 'paid') return { bg:'var(--ecare-primary-bg)', color:'var(--ecare-primary)', border:'var(--ecare-primary)40' };
          if (status === 'pending' || status === 'unpaid') return { bg:'#fff7ed', color:'#d97706', border:'#f59e0b40' };
          return { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' };
        }
        const style = getStyle(val);
        
        if (isPatient) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
              <span style={{ 
                padding: '3px 8px', borderRadius: '20px', background: style.bg, color: style.color,
                fontSize: '0.65rem', fontWeight: 800, textAlign: 'center', border: `1px solid ${style.border}`,
                textTransform: 'uppercase', display: 'inline-block'
              }}>
                {val || 'Unpaid'}
              </span>
              <div style={{ 
                padding: '3px 8px', borderRadius: '8px', background: '#f1f5f9', color: '#475569',
                fontSize: '0.65rem', fontWeight: 700, textAlign: 'center'
              }}>
                {method}
              </div>
            </div>
          )
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
            <CustomSelect 
              value={val || 'Unpaid'}
              onChange={(newVal) => updateLabOrder(row.id, { payment_status: newVal })}
              options={[{value:'Paid',label:'Paid'},{value:'Unpaid',label:'Unpaid'},{value:'Pending',label:'Pending'}]}
              customTriggerStyle={{ 
                padding: '3px 8px', borderRadius: '20px', background: style.bg, color: style.color,
                fontSize: '0.65rem', fontWeight: 800, textAlign: 'center', border: `1px solid ${style.border}`,
                textTransform: 'uppercase', minWidth: 'unset', boxShadow: 'none'
              }}
            />
            <CustomSelect 
              value={method || 'Cash'}
              onChange={(newMethod) => {
                const { updateTransaction } = useStore.getState()
                if (txn) {
                  updateTransaction(txn.id, { method: newMethod })
                } else {
                  addTransaction({
                    id: Math.max(0, ...(transactions||[]).map(t=>Number(t.id)||0))+1,
                    labOrderId: row.id,
                    patientName: row.patient_name,
                    amount: row.price,
                    paidAmount: row.payment_status === 'Paid' ? row.price : 0,
                    category: 'Lab Test',
                    method: newMethod,
                    date: row.order_date,
                    status: row.payment_status === 'Paid' ? 'Success' : 'Pending'
                  })
                }
              }}
              options={gateways}
              customTriggerStyle={{ 
                padding: '3px 8px', borderRadius: '8px', background: '#f1f5f9', color: '#475569',
                fontSize: '0.65rem', fontWeight: 700,
                border: 'none', minWidth: 'unset', boxShadow: 'none'
              }}
            />
          </div>
        )
      }
    },
    { 
      key: 'ordered_by_name', 
      label: 'Audit', 
      render: (val) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ecare-primary)' }}>{val || 'System'}</span>
          <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>STAFF ACTION</span>
        </div>
      )
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      sortable: false, 
      render: (_, row) => (
        <div style={{display:'flex', gap:'6px', justifyContent:'flex-end'}}>
          <button onClick={()=>setDetailRow(row)} className="ecare-btn-icon-hover" style={{background:'#eff6ff',border:'none',color:'#3b82f6',width:'30px',height:'30px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} title="View Details"><Eye size={14} weight="bold"/></button>
          {!isPatient && (
            <button onClick={()=>{setResultModal(row);setResult({status:row.status,result_value:row.result_value||'',result_notes:row.result_notes||'',reviewed_by:row.reviewed_by||'',report_file:null,report_file_name:''})}}
              className="ecare-btn-icon-hover" style={{background:'var(--ecare-primary-bg)',border:'none',color:'var(--ecare-primary)',width:'30px',height:'30px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} title="Update Result">
              <ClipboardText size={14} weight="bold"/>
            </button>
          )}
          {row.report_file && (
            <button onClick={()=>{const a=document.createElement('a');a.href=row.report_file;a.download=row.report_file_name||'report';a.click()}}
              className="ecare-btn-icon-hover" style={{background:'#f5f3ff',border:'none',color:'#7c3aed',width:'30px',height:'30px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} title="Download Report"><DownloadSimple size={14} weight="bold"/></button>
          )}
          {!isPatient && (
            <button onClick={() => {
              openConfirm({
                title: 'Cancel Order',
                message: 'Are you sure you want to cancel this lab order? This will not automatically refund the payment.',
                confirmText: 'Cancel Order',
                variant: 'danger',
                onConfirm: () => updateLabOrder(row.id, { status: 'Cancelled' })
              })
            }} className="ecare-btn-icon-hover" style={{background:'#fef2f2',border:'none',color:'#ef4444',width:'30px',height:'30px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} title="Cancel Order">
              <Trash size={14} weight="bold"/>
            </button>
          )}
        </div>
      )
    }
  ]

  const handleBulkDelete = (selectedIds) => bulkDelete('lab-orders', selectedIds)



  const updateResult = async () => {
    setSaving(true)
    try {
      await updateLabOrder(resultModal.id, {
        ...result,
        reviewed_at: new Date().toISOString().split('T')[0]
      })
      toast.success('Result updated')
      setResultModal(null)
    } catch { toast.error('Update failed') }
    setSaving(false)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => setResult({...result, report_file: reader.result, report_file_name: file.name})
    reader.readAsDataURL(file)
  }

  return (
    <>
      {isPatient && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            flexShrink: 0
          }}>
            <CalendarCheck size={24} weight="duotone" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px' }}>Need to change, reschedule, or cancel a booking?</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.4 }}>
              For patient safety and schedule synchronization, booked appointments and services cannot be modified directly online. Please contact {window.ecareConfig?.siteName || 'E-CARE'} clinic administration at <strong>{window.ecareConfig?.sitePhone || '+1 (800) 555-0199'}</strong> or email <strong>{window.ecareConfig?.siteEmail || 'support@e-care.com'}</strong> for assistance.
            </p>
          </div>
        </div>
      )}

      <DataTable 
        data={orders} 
        columns={columns} 
        title="Diagnostic Orders" 
        addLabel={isPatient ? null : "Place New Order"} 
        onAdd={isPatient ? null : () => setLabBookingModal(true)} 
        hideAdd={isPatient}
        searchPlaceholder="Search by ID, Patient or Test..."
        onBulkDelete={isPatient ? null : handleBulkDelete}
      />

      {/* Result Update Modal */}
      <Portal>
        <AnimatePresence>
          {resultModal && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setResultModal(null)} 
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
                    maxWidth: '520px',
                    pointerEvents: 'auto',
                    borderRadius: '16px',
                    padding: 0,
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
                        <Flask size={20} weight="bold" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                          Update Lab Result
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Order #{resultModal.id} · Record diagnostic outcomes
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResultModal(null)}
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
                  
                  <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="ecare-scrollbar">
                    <Field label="Clinical Status">
                      <CustomSelect value={result.status} onChange={v=>setResult({...result, status:v})} options={STATUSES.map(s=>({value:s,label:s}))}/>
                    </Field>
                    <Field label="Result Value (Numeric/Summary)">
                      <input style={inp} value={result.result_value} onChange={e=>setResult({...result, result_value:e.target.value})} placeholder="e.g. 5.6 mmol/L"/>
                    </Field>
                    <Field label="Pathologist/Lab Notes">
                      <textarea style={{...inp,height:'100px',resize:'none'}} value={result.result_notes} onChange={e=>setResult({...result, result_notes:e.target.value})}/>
                    </Field>
                    <Field label="Reviewed By">
                      <input style={inp} value={result.reviewed_by} onChange={e=>setResult({...result, reviewed_by:e.target.value})} placeholder="Doctor/Pathologist name"/>
                    </Field>
                    <Field label="Upload Report (PDF/Image)">
                      <div style={{position:'relative',border:'2px dashed #e2e8f0',borderRadius:'12px',padding:'1.5rem',textAlign:'center',background:'#f8fafc',cursor:'pointer'}} onClick={()=>document.getElementById('rep-up').click()}>
                        <input id="rep-up" type="file" hidden onChange={handleFile} accept=".pdf,image/*"/>
                        <DownloadSimple size={24} color="var(--ecare-primary)" style={{marginBottom:'0.5rem'}}/>
                        <div style={{fontSize:'0.75rem',fontWeight:600}}>{result.report_file_name || 'Click to select report file'}</div>
                      </div>
                    </Field>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <button type="button" onClick={() => setResultModal(null)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px' }}>Discard</button>
                      <button type="button" onClick={updateResult} className="ecare-button" style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={saving}>
                        <CheckCircle size={18} weight="bold" /> Save Result
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>

      {/* Details View Modal */}
      <Portal>
        <AnimatePresence>
          {detailRow && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setDetailRow(null)} 
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
                    maxWidth: '600px',
                    pointerEvents: 'auto',
                    borderRadius: '16px',
                    padding: 0,
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh',
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
                        <ClipboardText size={20} weight="bold" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                          Order Details #{detailRow.id}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          {detailRow.order_date} · {detailRow.test_code}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailRow(null)}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <h4 style={{fontSize:'0.75rem',color:'#94a3b8',textTransform:'uppercase',marginBottom:'0.5rem'}}>Patient Info</h4>
                        <div style={{fontWeight:700}}>{detailRow.patient_name}</div>
                        <div style={{fontSize:'0.75rem',color:'#64748b'}}>User ID: {detailRow.patient_user_id}</div>
                      </div>
                      <div>
                        <h4 style={{fontSize:'0.75rem',color:'#94a3b8',textTransform:'uppercase',marginBottom:'0.5rem'}}>Referring Doctor</h4>
                        <div style={{fontWeight:700}}>{detailRow.doctor_name || 'Self Referred'}</div>
                      </div>
                      <div style={{gridColumn:'span 2'}}>
                        <h4 style={{fontSize:'0.75rem',color:'#94a3b8',textTransform:'uppercase',marginBottom:'0.5rem'}}>Test Being Performed</h4>
                        <div style={{fontWeight:700,fontSize:'1rem'}}>{detailRow.test_name}</div>
                        <div style={{fontSize:'0.75rem',color:'#64748b'}}>{detailRow.category} · {detailRow.priority} Priority</div>
                      </div>
                      <div style={{gridColumn:'span 2',background:'#f8fafc',padding:'1rem',borderRadius:'12px',border:'1px solid #e2e8f0'}}>
                        <h4 style={{fontSize:'0.75rem',color:'#94a3b8',textTransform:'uppercase',marginBottom:'0.5rem'}}>Result & Notes</h4>
                        {detailRow.result_value ? (
                          <>
                            <div style={{fontSize:'1.25rem',fontWeight:800,color:'var(--ecare-primary)',marginBottom:'0.5rem'}}>{detailRow.result_value}</div>
                            <p style={{fontSize:'0.85rem',lineHeight:1.5,margin:0}}>{detailRow.result_notes}</p>
                            <div style={{marginTop:'1rem',fontSize:'0.7rem',color:'#64748b',fontWeight:600}}>Reviewed By: {detailRow.reviewed_by || 'Pending Review'}</div>
                          </>
                        ) : (
                          <div style={{display:'flex',alignItems:'center',gap:'0.5rem',color:'#94a3b8'}}><Clock size={16}/><span>Results are not available yet.</span></div>
                        )}
                      </div>
                    </div>

                    <div style={{ paddingTop: '1.25rem', marginTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => setDetailRow(null)} className="ecare-button" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px' }}>Close Details</button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}
