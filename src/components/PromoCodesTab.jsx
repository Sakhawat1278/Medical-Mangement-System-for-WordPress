import React, { useState, useEffect } from 'react'
import { Plus, Trash, Tag, X, CheckCircle } from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../utils/api'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'
import CustomSelect from './CustomSelect'
import CustomDatePicker from './CustomDatePicker'
import { Portal } from '../utils/portal'

const PromoCodesTab = () => {
  const [promoCodes, setPromoCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [newCode, setNewCode] = useState({
    code: '',
    discount_type: 'fixed',
    discount_amount: '',
    expiry_date: '',
    status: 'active'
  })

  const { openConfirm } = useStore()

  const fetchPromoCodes = async () => {
    setLoading(true)
    try {
      const res = await api.get('promo-codes')
      setPromoCodes(res.data || [])
    } catch (e) {
      toast.error('Failed to load promo codes')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const handleAddPromoCode = async (e) => {
    e.preventDefault()
    if (!newCode.code || !newCode.discount_amount) {
      toast.error('Code and discount amount are required')
      return
    }

    try {
      await api.post('promo-codes', newCode)
      toast.success('Promo code added successfully')
      setIsModalOpen(false)
      setNewCode({ code: '', discount_type: 'fixed', discount_amount: '', expiry_date: '', status: 'active' })
      fetchPromoCodes()
    } catch (e) {
      toast.error('Failed to add promo code')
    }
  }

  const handleDelete = (id) => {
    openConfirm({
      title: 'Delete Promo Code?',
      message: 'Are you sure you want to delete this promo code? This action cannot be undone.',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          await api.delete(`promo-codes/${id}`)
          toast.success('Promo code deleted')
          fetchPromoCodes()
        } catch (e) {
          toast.error('Failed to delete promo code')
        }
      }
    })
  }

  const handleToggleStatus = async (promo) => {
    const newStatus = promo.status === 'active' ? 'inactive' : 'active'
    try {
      await api.put(`promo-codes/${promo.id}`, { status: newStatus })
      toast.success('Status updated')
      fetchPromoCodes()
    } catch (e) {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="ecare-card" style={{ padding: '2rem', border: 'none', boxShadow: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--ecare-primary-bg)', borderRadius: '12px', color: 'var(--ecare-primary)' }}>
            <Tag size={24} weight="duotone" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ecare-text-dark)', fontWeight: 700 }}>Promo Codes</h2>
            <p style={{ margin: 0, color: 'var(--ecare-text-muted)', fontSize: '0.85rem' }}>Manage discount codes for patient bookings.</p>
          </div>
        </div>
        <button 
          className="ecare-button" 
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
        >
          <Plus size={16} weight="bold" />
          Add Promo Code
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ecare-text-muted)', fontSize: '0.875rem' }}>
          Loading promo codes...
        </div>
      ) : (
        <div className="ecare-table-container">
          <table className="ecare-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                    No promo codes found
                  </td>
                </tr>
              ) : (
                promoCodes.map((promo) => (
                  <tr key={promo.id}>
                    <td style={{ fontWeight: 700, color: 'var(--ecare-text-main)', fontSize: '0.9rem' }}>
                      <span style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px', letterSpacing: '0.05em' }}>
                        {promo.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--ecare-text-main)' }}>
                      {promo.discount_type === 'percentage' ? `${promo.discount_amount}%` : `৳${Number(promo.discount_amount).toLocaleString()}`}
                    </td>
                    <td style={{ color: 'var(--ecare-text-muted)', fontSize: '0.85rem' }}>
                      {promo.expiry_date ? new Date(promo.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never'}
                    </td>
                    <td>
                      <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer', verticalAlign: 'middle' }}>
                        <input 
                          type="checkbox" 
                          checked={promo.status === 'active'} 
                          onChange={() => handleToggleStatus(promo)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute', cursor: 'pointer', inset: 0,
                          backgroundColor: promo.status === 'active' ? 'var(--ecare-primary)' : '#e2e8f0',
                          borderRadius: '34px', transition: '.4s ease',
                          boxShadow: (promo.status === 'active') ? '0 0 10px var(--ecare-primary-shadow)' : 'none'
                        }}>
                          <span style={{
                            position: 'absolute', height: '16px', width: '16px', left: promo.status === 'active' ? '19px' : '3px', bottom: '3px',
                            backgroundColor: 'white', borderRadius: '50%', transition: '.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }} />
                        </span>
                      </label>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(promo.id)} 
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.375rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Promo Modal */}
      <Portal>
        <AnimatePresence>
          {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{ width: '100%', maxWidth: '440px', position: 'relative', padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Add New Promo Code</h3>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Configure discount coupon code</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
              
              <form onSubmit={handleAddPromoCode} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="ecare-form-group">
                  <label className="ecare-label">Promo Code</label>
                  <input 
                    type="text" 
                    className="ecare-input" 
                    placeholder="e.g. SUMMER20"
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase().trim() })}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="ecare-form-group">
                    <label className="ecare-label">Discount Type</label>
                    <CustomSelect 
                      value={newCode.discount_type}
                      onChange={(val) => setNewCode({ ...newCode, discount_type: val })}
                      options={[
                        { value: 'fixed', label: 'Fixed Amount' },
                        { value: 'percentage', label: 'Percentage' }
                      ]}
                      style={{ width: '100%' }}
                      customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }}
                    />
                  </div>
                  <div className="ecare-form-group">
                    <label className="ecare-label">Amount</label>
                    <input 
                      type="number" 
                      className="ecare-input" 
                      placeholder="e.g. 50"
                      value={newCode.discount_amount}
                      onChange={(e) => setNewCode({ ...newCode, discount_amount: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div className="ecare-form-group">
                  <label className="ecare-label">Expiry Date (Optional)</label>
                  <CustomDatePicker 
                    value={newCode.expiry_date}
                    onChange={(dateStr) => setNewCode({ ...newCode, expiry_date: dateStr })}
                    placeholder="Select expiry date"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px' }}>Cancel</button>
                  <button type="submit" className="ecare-button" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} weight="bold" />
                    Save Code
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </Portal>
    </div>
  )
}

export default PromoCodesTab
