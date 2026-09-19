import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileArrowUp, Trash, DownloadSimple, Eye, X, FilePdf, FileImage, FileDoc, File, CloudArrowUp, FunnelSimple, CheckCircle } from 'phosphor-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import CustomSelect from './CustomSelect'
import { Portal } from '../utils/portal'

const CATEGORIES = [
  { value: 'all', label: 'All Documents' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'imaging', label: 'Imaging / X-Ray' },
  { value: 'identity', label: 'Identity Document' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'discharge', label: 'Discharge Summary' },
  { value: 'general', label: 'General' },
]

const CAT_COLORS = {
  prescription: '#7c3aed', lab_report: '#0891b2', imaging: '#b45309',
  identity: 'var(--ecare-primary)', insurance: '#db2777', discharge: '#dc2626', general: '#64748b'
}

const getFileIcon = (type = '') => {
  if (type.includes('pdf')) return <FilePdf size={22} weight="duotone" color="#ef4444" />
  if (type.includes('image')) return <FileImage size={22} weight="duotone" color="#3b82f6" />
  if (type.includes('word') || type.includes('doc')) return <FileDoc size={22} weight="duotone" color="#2563eb" />
  return <File size={22} weight="duotone" color="#64748b" />
}

const formatSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const MedicalVault = ({ patientId, patientUserId, canUpload = true, canDelete = true, readOnly = false }) => {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [preview, setPreview] = useState(null)
  const [uploadMeta, setUploadMeta] = useState({ title: '', category: 'general', notes: '' })
  const [pendingFile, setPendingFile] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const query = patientUserId ? `patient_user_id=${patientUserId}` : `patient_id=${patientId}`
      const res = await api.get(`/medical-vault?${query}`)
      setDocs(Array.isArray(res.data) ? res.data : [])
    } catch { setDocs([]) }
    setLoading(false)
  }

  useEffect(() => { if (patientId || patientUserId) fetchDocs() }, [patientId, patientUserId])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { toast.error('File too large. Max 8MB.'); return }
    setPendingFile(file)
    setUploadMeta(prev => ({ ...prev, title: file.name.replace(/\.[^.]+$/, '') }))
    setShowUploadForm(true)
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!pendingFile || !uploadMeta.title.trim()) { toast.error('Please enter a title.'); return }
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result
        await api.post('/medical-vault', {
          patient_id: patientId || 0,
          patient_user_id: patientUserId || 0,
          title: uploadMeta.title,
          category: uploadMeta.category,
          notes: uploadMeta.notes,
          file_name: pendingFile.name,
          file_type: pendingFile.type,
          file_size: pendingFile.size,
          file_data: base64,
        })
        toast.success('Document uploaded successfully')
        setShowUploadForm(false)
        setPendingFile(null)
        setUploadMeta({ title: '', category: 'general', notes: '' })
        fetchDocs()
        setUploading(false)
      }
      reader.readAsDataURL(pendingFile)
    } catch { toast.error('Upload failed'); setUploading(false) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/medical-vault/${id}`)
      setDocs(prev => prev.filter(d => d.id !== id))
      toast.success('Document removed')
    } catch { toast.error('Delete failed') }
  }

  const handleDownload = (doc) => {
    const a = document.createElement('a')
    a.href = doc.file_data
    a.download = doc.file_name || doc.title
    a.click()
  }

  const filtered = filterCat === 'all' ? docs : docs.filter(d => d.category === filterCat)

  return (
    <div>
      {/* Upload Area */}
      {canUpload && !readOnly && (
        <div style={{ marginBottom: '1.5rem' }}>
          <input type="file" id="vault-file-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={handleFileSelect} />
          <label htmlFor="vault-file-input" style={{ border: '2px dashed #e2e8f0', borderRadius: '14px', padding: '2rem', textAlign: 'center', background: '#f8fafc', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ecare-primary)'; e.currentTarget.style.background = 'var(--ecare-primary-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}>
            <CloudArrowUp size={40} weight="duotone" color="var(--ecare-primary)" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem', marginBottom: '4px' }}>Click to Upload Document</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PDF, JPG, PNG, DOC — max 8MB</div>
          </label>
        </div>
      )}

      {/* Upload Form Modal */}
      <Portal>
        <AnimatePresence>
          {showUploadForm && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowUploadForm(false); setPendingFile(null) }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="ecare-card"
                style={{ width: '100%', maxWidth: '480px', position: 'relative', padding: 0, border: 'none', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              >
                {/* Header */}
                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileArrowUp size={20} weight="bold" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Upload Document</h3>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Save to secure medical record vault</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowUploadForm(false); setPendingFile(null) }} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}>
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ background: 'var(--ecare-primary-bg)', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                    📎 {pendingFile?.name} ({formatSize(pendingFile?.size)})
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>* Title</label>
                    <input value={uploadMeta.title} onChange={e => setUploadMeta(p => ({ ...p, title: e.target.value }))}
                      placeholder="Enter document title" style={{ width: '100%', padding: '0.6rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Category</label>
                    <CustomSelect value={uploadMeta.category} onChange={v => setUploadMeta(p => ({ ...p, category: v }))}
                      options={CATEGORIES.filter(c => c.value !== 'all')} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Notes (optional)</label>
                    <textarea value={uploadMeta.notes} onChange={e => setUploadMeta(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Any additional notes..." rows={3}
                      style={{ width: '100%', padding: '0.6rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.8rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => { setShowUploadForm(false); setPendingFile(null) }}
                      className="ecare-btn-secondary"
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontWeight: 600 }}>Cancel</button>
                    <button onClick={handleUpload} disabled={uploading}
                      className="ecare-button"
                      style={{ flex: 1.5, padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: uploading ? 0.7 : 1 }}>
                      <CheckCircle size={18} weight="bold" />
                      {uploading ? 'Uploading…' : 'Upload Document'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* Filter */}
      {docs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <FunnelSimple size={16} color="#64748b" />
          <div style={{ width: '220px' }}>
            <CustomSelect value={filterCat} onChange={setFilterCat} options={CATEGORIES} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem', fontSize: '0.875rem' }}>Loading vault…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '1.5rem' }}>
          {docs.length === 0 ? 'No documents uploaded yet.' : 'No documents in this category.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(doc => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f1f5f9', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', overflow: 'hidden', flex: 1 }}>
                <div style={{ flexShrink: 0 }}>{getFileIcon(doc.file_type)}</div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 8px', borderRadius: '999px', background: CAT_COLORS[doc.category] + '18', color: CAT_COLORS[doc.category] || '#64748b' }}>
                      {CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                    </span>
                    {doc.file_size > 0 && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{formatSize(doc.file_size)}</span>}
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{doc.created_at?.split(' ')[0]}</span>
                  </div>
                  {doc.notes && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>{doc.notes}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {doc.file_data && (
                  <>
                    {doc.file_type?.startsWith('image/') && (
                      <button onClick={() => setPreview(doc)} title="Preview"
                        style={{ background: '#eff6ff', border: 'none', color: '#3b82f6', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Eye size={15} />
                      </button>
                    )}
                    <button onClick={() => handleDownload(doc)} title="Download"
                      style={{ background: 'var(--ecare-primary-bg)', border: 'none', color: 'var(--ecare-primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <DownloadSimple size={15} />
                    </button>
                  </>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(doc.id)} title="Delete"
                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash size={15} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      <Portal>
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreview(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <button onClick={() => setPreview(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              <img src={preview.file_data} alt={preview.title} onClick={e => e.stopPropagation()}
                style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  )
}

export default MedicalVault
