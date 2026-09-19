import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, IdentificationCard, X, Plus, Info } from 'phosphor-react'
import { Portal } from '../utils/portal'

const ProviderTypeModal = ({ isOpen, onClose, onAdd }) => {
  const [typeName, setTypeName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (typeName.trim()) {
      onAdd(typeName.trim())
      setTypeName('')
      onClose()
    }
  }

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '420px', 
                padding: 0,
                border: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden' 
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                    <IdentificationCard size={20} weight="duotone" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>New Provider Type</h3>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>Define a clinical staff category</p>
                  </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}>
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                <div className="ecare-form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="ecare-label" style={{ fontSize: '0.8rem', color: '#475569' }}>Provider Designation / Type</label>
                  <input 
                    autoFocus
                    type="text" 
                    className="ecare-input" 
                    placeholder="e.g. Speech Therapist, Dietitian" 
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    style={{ padding: '0.875rem 1.25rem', fontSize: '0.9375rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem', borderRadius: '12px', background: '#f0f9ff', border: '1px solid #e0f2fe', marginBottom: '1.5rem' }}>
                  <Info size={18} color="#0284c7" style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#0369a1', lineHeight: 1.5 }}>
                    This type will be available for selection when creating new service packages and registering clinical staff.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={onClose} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button type="submit" className="ecare-button" style={{ flex: 2, padding: '0.75rem', borderRadius: '12px', fontWeight: 700 }}>
                    Create Type
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export default ProviderTypeModal
