import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, Eye, X, Buildings } from 'phosphor-react'
import DataTable from '../../components/DataTable'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import useAuth from '../../hooks/useAuth'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatPaymentMethod } from '../../utils/formatters'

const InvoiceManager = () => {
  const { transactions, patients, currencySymbol } = useStore()
  const { user, isPatient } = useAuth()
  const [previewInvoice, setPreviewInvoice] = useState(null)
  const [selectedGatewayKey, setSelectedGatewayKey] = useState('')
  const [payingBalance, setPayingBalance] = useState(false)

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

  const handlePayRemainingSubmit = async () => {
    if (!previewInvoice || !selectedGatewayKey) return
    setPayingBalance(true)
    try {
      const response = await api.post(`billing/${previewInvoice.id}/pay-remaining`, {
        paymentMethod: selectedGatewayKey
      })
      const result = response.data
      if (result.success && result.completed) {
        toast.success('Payment completed successfully!')
        setPreviewInvoice(null)
        await useStore.getState().initStore(true)
      } else if (result.success && result.checkout_url) {
        toast.success('Redirecting to payment...')
        window.location.href = result.checkout_url
      } else {
        toast.error(result.message || 'Payment failed.')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to process payment.')
      console.error(e)
    } finally {
      setPayingBalance(false)
    }
  }

  const columns = [
    { key: 'invoiceNo', label: 'Invoice #', render: (val, row) => <span style={{ fontWeight: 700, color: 'var(--ecare-primary)', fontSize: '0.8rem' }}>{val || `#INV-${String(row.id).slice(0, 8).toUpperCase()}`}</span> },
    { key: 'patientName', label: 'Patient', render: (val) => <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{val}</span> },
    { key: 'category', label: 'Category', render: (val) => <span style={{ fontSize: '0.8rem', color: '#475569' }}>{val}</span> },
    { key: 'description', label: 'Description', render: (val) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{val}</span> },
    { key: 'amount', label: 'Total', render: (val) => <span style={{ fontWeight: 700 }}>{currencySymbol}{val.toLocaleString()}</span> },
    { key: 'paidAmount', label: 'Paid', render: (val) => <span style={{ fontWeight: 600, color: 'var(--ecare-primary)' }}>{currencySymbol}{val.toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (val) => {
      const fg = { Paid: 'var(--ecare-primary)', Pending: '#d97706', Failed: '#ef4444', Refunded: '#7c3aed', 'Partially Paid': '#0ea5e9', Due: '#ea580c' }
      return <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: `var(--ecare-primary-bg)`, color: fg[val] || '#94a3b8' }}>{val}</span>
    }},
    { key: 'issuedBy', label: 'Issued By', render: (val) => <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{val || 'System'}</span> },
    { key: 'id', label: '', sortable: false, render: (_, row) => (
      <button onClick={() => { setPreviewInvoice(row); setSelectedGatewayKey(''); }} style={{ background: 'var(--ecare-primary-bg)', border: 'none', color: 'var(--ecare-primary)', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Preview Invoice">
        <Eye size={16} weight="bold" />
      </button>
    )}
  ]

  const displayTransactions = useMemo(() => {
    if (isPatient) {
      const pName = (user?.name || user?.display_name || user?.user_login || '').trim().toLowerCase()
      const uId = String(user?.id || '')
      return transactions.filter(t => 
        (t.patient_user_id && String(t.patient_user_id) === uId) ||
        (t.patient_id && String(t.patient_id) === uId) ||
        (t.patientId && String(t.patientId) === uId) ||
        (t.user_id && String(t.user_id) === uId) ||
        (t.patientName && pName && t.patientName.trim().toLowerCase() === pName)
      )
    }
    return transactions
  }, [transactions, user, isPatient])


  const handlePrint = () => { window.print() }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}>
      <DataTable data={displayTransactions} columns={columns} searchPlaceholder="Search invoices..." title="Invoice Registry" />

      <Portal>
        <AnimatePresence>
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
                      {(previewInvoice.doctorName || previewInvoice.providerName) && (
                        <>
                          <span style={{ color: 'var(--ecare-primary)', fontWeight: 700 }}>SERVICE :</span> 
                          <span style={{ fontWeight: 800, color: '#000' }}>
                            {previewInvoice.doctorName ? `Dr. ${previewInvoice.doctorName}` : previewInvoice.providerName}
                            <span style={{ fontWeight: 500, color: '#666', fontSize: '0.65rem', marginLeft: '4px' }}>
                              ({previewInvoice.doctorSpecialty || previewInvoice.providerPackage || previewInvoice.category || 'Clinical Staff'})
                            </span>
                          </span>
                        </>
                      )}
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
                        {previewInvoice.status === 'Paid' ? 'TOTAL PAID :' : 'TOTAL AMOUNT :'}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--ecare-primary)' }}>
                        {currencySymbol}{previewInvoice.amount.toLocaleString()}
                      </span>
                    </div>
                    {previewInvoice.status !== 'Paid' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', fontWeight: 800, fontSize: '0.75rem', color: '#10b981' }}>
                        <span>TOTAL PAID :</span>
                        <span>{currencySymbol}{(previewInvoice.paidAmount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {previewInvoice.status !== 'Paid' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', fontWeight: 800, fontSize: '0.75rem', color: '#ef4444' }}>
                        <span>REMAINING DUE :</span>
                        <span>{currencySymbol}{(previewInvoice.amount - (previewInvoice.paidAmount || 0)).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed #e2e8f0', margin: '0 1.5rem' }} />

                {/* 5. Payment History */}
                {previewInvoice.paymentHistory && (() => {
                  const history = typeof previewInvoice.paymentHistory === 'string' ? JSON.parse(previewInvoice.paymentHistory) : previewInvoice.paymentHistory;
                  const installments = Array.isArray(history) ? history : (history && Array.isArray(history.installments) ? history.installments : null);
                  if (!installments || installments.length === 0) return null;
                  return (
                    <div style={{ padding: '0.5rem 1.5rem' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--ecare-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Installment History</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                        {installments.map((entry, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f8fafc', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>Inst. {idx + 1} ({formatPaymentMethod(entry.method)}) <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.6rem' }}>({new Date(entry.date).toLocaleDateString()})</span></div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--ecare-primary)' }}>+{currencySymbol}{Number(entry.amount).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Pay Remaining Balance Selector */}
                {isPatient && ['Partially Paid', 'Pending', 'Due'].includes(previewInvoice.status) && (
                  <div style={{
                    margin: '1rem 1.5rem',
                    padding: '1.25rem',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }} className="no-print">
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--ecare-text-main)' }}>Pay Remaining Balance</h4>
                    
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Select a payment method to settle the outstanding balance of <strong>{currencySymbol}{(previewInvoice.amount - (previewInvoice.paidAmount || 0)).toLocaleString()}</strong>.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                      {Object.entries(window.ecareConfig?.wcGateways || {}).map(([key, gw]) => {
                        const isActive = selectedGatewayKey === key
                        return (
                          <div
                            key={key}
                            onClick={() => setSelectedGatewayKey(key)}
                            style={{
                              padding: '10px',
                              border: `2px solid ${isActive ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                              borderRadius: '10px',
                              cursor: 'pointer',
                              background: isActive ? 'var(--ecare-primary-bg)' : 'white',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              color: isActive ? 'var(--ecare-primary)' : '#475569',
                              transition: 'all 0.15s',
                              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                            }}
                          >
                            {formatPaymentMethod(gw.title || key)}
                          </div>
                        )
                      })}
                    </div>

                    <button
                      onClick={handlePayRemainingSubmit}
                      disabled={payingBalance || !selectedGatewayKey}
                      className="ecare-button"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.8125rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '0.25rem'
                      }}
                    >
                      {payingBalance ? 'Processing Payment...' : `Pay Outstanding Balance (${currencySymbol}${(previewInvoice.amount - (previewInvoice.paidAmount || 0)).toLocaleString()})`}
                    </button>
                  </div>
                )}

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

export default InvoiceManager
