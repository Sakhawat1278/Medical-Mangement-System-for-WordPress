import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, PencilSimple, Trash, X, MapPin, Globe, Buildings, CheckCircle } from 'phosphor-react'
import { Hospital } from 'healthicons-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'
import DataTable from '../../components/DataTable'

const TYPES = [
  { value: 'division', label: 'Division', icon: Globe },
  { value: 'district', label: 'District', icon: MapPin },
  { value: 'area', label: 'Area', icon: Buildings },
  { value: 'provider', label: 'Lab Test Provider', icon: Hospital }
]

export default function LabLocations({ locations }) {
  const { addLabLocation, updateLabLocation, deleteLabLocation, bulkDelete, openConfirm } = useStore()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'division', parent_id: '0' })

  const getParentName = (parentId) => {
    if (!parentId || parentId === '0') return '—'
    const parent = (locations||[]).find(l => String(l.id) === String(parentId))
    return parent ? parent.name : 'Unknown'
  }

  const columns = [
    { key: 'id', label: 'ID', render: (val) => <span style={{fontWeight:700, color:'#64748b'}}>#LOC-{String(val).slice(0, 8).toUpperCase()}</span> },
    { key: 'name', label: 'Location Name', render: (val, row) => (
      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
        <div style={{
          width:'28px', height:'28px', borderRadius:'6px', 
          background:'var(--ecare-primary-bg)', color:'var(--ecare-primary)',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          {(() => {
            const IconComponent = TYPES.find(t=>t.value===row.type)?.icon || MapPin;
            return <IconComponent size={16} weight="duotone"/>;
          })()}
        </div>
        <span style={{fontWeight:600}}>{val}</span>
      </div>
    )},
    { key: 'type', label: 'Type', render: (val) => (
      <span style={{
        fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase',
        padding:'2px 8px', borderRadius:'4px', background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0'
      }}>{val}</span>
    )},
    { key: 'parent_id', label: 'Parent Location', render: (val) => (
      <span style={{fontSize:'0.8125rem', color:'#64748b'}}>{getParentName(val)}</span>
    )}
  ]

  const openEdit = (row = null) => {
    if (row) setForm({ name: row.name, type: row.type, parent_id: row.parent_id })
    else setForm({ name: '', type: 'division', parent_id: '0' })
    setEditing(row)
    setModal(true)
  }

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      if (editing) await updateLabLocation(editing.id, form)
      else await addLabLocation(form)
      setModal(false)
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const del = (id) => openConfirm({
    title: 'Delete Location',
    message: 'Remove this location? Children may become unassigned.',
    confirmText: 'Delete',
    onConfirm: async () => deleteLabLocation(id)
  })

  const handleBulkDelete = (ids) => bulkDelete('lab-locations', ids)

  const possibleParents = (locations||[]).filter(l => {
    if (form.type === 'division') return false
    if (form.type === 'district') return l.type === 'division'
    if (form.type === 'area') return l.type === 'district'
    if (form.type === 'provider') return l.type === 'area'
    return false
  })

  return (
    <>
      <DataTable 
        title="Location Hierarchy Management"
        data={locations||[]}
        columns={columns}
        searchPlaceholder="Search locations by name or type..."
        addLabel="Add Root Division"
        onAdd={() => openEdit()}
        onEdit={(row) => openEdit(row)}
        onDelete={(id) => del(id)}
        onBulkDelete={handleBulkDelete}
        filterOptions={TYPES.map(t => ({ value: t.value, label: t.label }))}
      />

      <Portal>
        <AnimatePresence>
          {modal && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setModal(false)}
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
                    maxWidth: '440px', 
                    pointerEvents: 'auto',
                    borderRadius: '16px',
                    padding: 0, 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
                        <MapPin size={20} weight="bold" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                          {editing ? 'Edit Location' : 'Add Location'}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Configure regional diagnostic hierarchy
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModal(false)}
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

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Location Type</label>
                      <CustomSelect value={form.type} onChange={v => {
                        const nextParentId = (v === 'division') ? '0' : form.parent_id
                        setForm(p=>({...p, type: v, parent_id: nextParentId}))
                      }} options={TYPES.map(t=>({value:t.value, label:t.label}))} />
                    </div>
                    {form.type !== 'division' && (
                      <div className="ecare-form-group">
                        <label className="ecare-label">Parent {form.type === 'district' ? 'Division' : (form.type === 'area' ? 'District' : 'Area')}</label>
                        <CustomSelect value={form.parent_id} onChange={v => setForm(p=>({...p, parent_id: v}))} 
                          options={[{value:'0', label:'Select Parent'}, ...possibleParents.map(l=>({value:String(l.id), label:l.name}))]} isSearchable/>
                      </div>
                    )}
                    <div className="ecare-form-group">
                      <label className="ecare-label">Location Name</label>
                      <input value={form.name} onChange={e=>setForm(p=>({...p, name: e.target.value}))} className="ecare-input" placeholder="e.g. Dhaka Division"/>
                    </div>
                    <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem', paddingTop:'1rem', borderTop:'1px solid #f1f5f9' }}>
                      <button onClick={() => setModal(false)} className="ecare-btn-secondary" style={{ flex:1, padding:'0.75rem', borderRadius:'10px' }}>Cancel</button>
                      <button onClick={save} disabled={saving} className="ecare-button" style={{ flex:1, padding:'0.75rem', borderRadius:'10px', opacity:saving?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
                        <CheckCircle size={18} weight="bold" />
                        {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Location'}
                      </button>
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
