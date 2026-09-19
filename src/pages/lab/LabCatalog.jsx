import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, PencilSimple, Trash, X, MapPin, ShoppingCart, Check, MagnifyingGlass, Flask, CheckCircle } from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'
import DataTable from '../../components/DataTable'

const CATEGORIES = ['General','Hematology','Biochemistry','Microbiology','Immunology','Pathology','Radiology','Cardiology','Hormones','Urine Analysis']
const SAMPLES = ['Blood','Urine','Stool','Swab','Saliva','Tissue','CSF','Other']

export default function LabCatalog({ tests, locations }) {
  const { 
    addLabTest, updateLabTest, deleteLabTest, bulkDelete, openConfirm,
    user, cart = [], addToCart, removeFromCart, setActivePage
  } = useStore()
  const isPatient = user?.ecareRole === 'patient'
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [hoveredCardId, setHoveredCardId] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // Selection state for modal
  const [selDiv, setSelDiv] = useState('')
  const [selDist, setSelDist] = useState('')
  const [selArea, setSelArea] = useState('')

  const [form, setForm] = useState({ 
    name:'', 
    code:'', 
    category:'General', 
    sample_type:'Blood', 
    price:'', 
    turnaround_days:'1', 
    description:'', 
    status:'Active', 
    location_id:'' 
  })

  const divisions = (locations||[]).filter(l => l.type === 'division')
  const districts = (locations||[]).filter(l => String(l.parent_id) === String(selDiv) && l.type === 'district')
  const areas = (locations||[]).filter(l => String(l.parent_id) === String(selDist) && l.type === 'area')
  const providers = (locations||[]).filter(l => String(l.parent_id) === String(selArea) && l.type === 'provider')

  const getLocationInfo = (locId) => {
    if (!locId || locId === '0') return { providerName: 'Unassigned', breadcrumb: 'No location assigned', fullPath: 'Unassigned' }
    const provider = (locations||[]).find(l => String(l.id) === String(locId))
    if (!provider) return { providerName: 'Unknown', breadcrumb: '', fullPath: 'Unknown' }
    const area = (locations||[]).find(l => String(l.id) === String(provider.parent_id))
    const district = area ? (locations||[]).find(l => String(l.id) === String(area.parent_id)) : null
    const division = district ? (locations||[]).find(l => String(l.id) === String(district.parent_id)) : null

    const divName = division ? division.name.replace(/ Division$/i, '') : ''
    const distName = district ? district.name.replace(/ District$/i, '') : ''
    const areaName = area ? area.name : ''
    
    const breadcrumbParts = [divName, distName, areaName].filter(Boolean)
    const breadcrumb = breadcrumbParts.join(' › ')
    const fullPath = [division?.name, district?.name, area?.name, provider.name].filter(Boolean).join(' > ')

    return {
      providerName: provider.name,
      breadcrumb: breadcrumb || 'General',
      fullPath
    }
  }

  const getLocationPath = (locId) => getLocationInfo(locId).fullPath

  const columns = [
    {
      key: 'id',
      label: 'Test ID',
      render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ecare-primary)' }}>#LAB-{String(val).slice(0, 8).toUpperCase()}</span>
    },
    { key: 'code', label: 'Test Code', render: (val) => <code style={{background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px', fontSize:'0.75rem'}}>{val || 'N/A'}</code> },
    { key: 'name', label: 'Test Name', render: (val, row) => (
      <div style={{ maxWidth: '200px' }}>
        <div style={{fontWeight:700, color:'var(--ecare-text-main)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={val}>{val}</div>
        <div style={{fontSize:'0.7rem', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{row.category} · {row.sample_type} Sample</div>
      </div>
    )},
    { key: 'location_id', label: 'Location Hierarchy', render: (val) => {
      const loc = getLocationInfo(val)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '240px' }} title={loc.fullPath}>
          <div style={{ 
            fontSize: '0.8125rem', 
            fontWeight: 700, 
            color: 'var(--ecare-text-main)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <MapPin size={13} weight="fill" color="var(--ecare-primary)" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {loc.providerName}
            </span>
          </div>
          <div style={{ 
            fontSize: '0.7rem', 
            color: '#64748b', 
            paddingLeft: '19px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {loc.breadcrumb}
          </div>
        </div>
      )
    }},
    { key: 'price', label: 'Price', render: (val) => <span style={{fontWeight:700, color:'var(--ecare-primary)'}}>৳{Number(val||0).toLocaleString()}</span> },
    { key: 'turnaround_days', label: 'Turnaround', render: (val) => <span>{val} Days</span> },
    { key: 'status', label: 'Status', render: (val) => (
      <span style={{ 
        padding:'4px 10px', borderRadius:'20px', 
        background: val==='Active' ? 'var(--ecare-primary-bg)' : '#f1f5f9', 
        color: val==='Active' ? 'var(--ecare-primary)' : '#64748b', 
        fontSize:'0.65rem', fontWeight:700, display:'flex', alignItems:'center', gap:'6px', width:'fit-content'
      }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: val==='Active' ? 'var(--ecare-primary)' : '#64748b' }}/>
        {val?.toUpperCase()}
      </span>
    )}
  ]

  const openEdit = (row = null) => {
    if (row) {
      setForm({ 
        name: row.name || '', 
        code: row.code || '', 
        category: row.category || 'General', 
        sample_type: row.sample_type || 'Blood', 
        price: row.price || '', 
        turnaround_days: row.turnaround_days || '1', 
        description: row.description || '', 
        status: row.status || 'Active', 
        location_id: String(row.location_id || '') 
      })
      const provider = (locations||[]).find(l => String(l.id) === String(row.location_id))
      if (provider) {
        const area = (locations||[]).find(l => String(l.id) === String(provider.parent_id))
        if (area) {
          setSelArea(String(area.id))
          const district = (locations||[]).find(l => String(l.id) === String(area.parent_id))
          if (district) {
            setSelDist(String(district.id))
            setSelDiv(String(district.parent_id))
          }
        }
      }
    } else {
      setForm({ name:'', code:'', category:'General', sample_type:'Blood', price:'', turnaround_days:'1', description:'', status:'Active', location_id:'' })
      setSelDiv(''); setSelDist(''); setSelArea('')
    }
    setEditing(row)
    setModal(true)
  }

  const save = async () => {
    if (!form.name.trim()) { toast.error('Test name required'); return }
    setSaving(true)
    try {
      if (editing) await updateLabTest(editing.id, form)
      else await addLabTest(form)
      setModal(false)
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const del = (id) => openConfirm({ 
    title:'Delete Test', 
    message:'Remove this lab test from the catalog?', 
    confirmText:'Delete', 
    onConfirm: async () => deleteLabTest(id)
  })

  const handleBulkDelete = (ids) => bulkDelete('lab-tests', ids)

  const [patientSearch, setPatientSearch] = useState('')
  const [patientCategory, setPatientCategory] = useState('All')

  if (isPatient) {
    const activeTests = (tests || []).filter(t => t.status === 'Active')
    
    // Filter tests by category and search
    const filteredTests = activeTests.filter(t => {
      const matchesCategory = patientCategory === 'All' || t.category === patientCategory
      const matchesSearch = t.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                            (t.code || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
                            (t.description || '').toLowerCase().includes(patientSearch.toLowerCase())
      return matchesCategory && matchesSearch
    })

    const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)', paddingBottom: '4rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>Available Lab Diagnostics</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--ecare-text-muted)' }}>
            Select the medical diagnostic tests you require. Add multiple tests to your booking cart to pay and schedule them in a single visit.
          </p>
        </div>

        {/* Search & Category Filter Section */}
        <div className="ecare-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <MagnifyingGlass size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search tests by name, category, or code (e.g. CBC)..." 
              className="ecare-input"
              style={{ paddingLeft: '2.75rem', borderRadius: '12px' }}
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
            />
          </div>

          {/* Horizontal scrollable category pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {['All', ...CATEGORIES].map(cat => {
              const isActive = patientCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setPatientCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: isActive ? 'none' : '1px solid #cbd5e1',
                    background: isActive ? 'var(--ecare-primary)' : 'white',
                    color: isActive ? 'white' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 4px 6px rgba(0, 0, 0, 0.05)' : 'none'
                  }}
                >
                  {cat === 'All' ? 'All Diagnostics' : cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Test Cards Grid */}
        {filteredTests.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredTests.map(test => {
              const inCart = cart.some(c => String(c.test_id) === String(test.id))
              const hoverRemove = hoveredCardId === test.id
              
              const handleCartClick = () => {
                if (inCart) {
                  const cartItem = cart.find(c => String(c.test_id) === String(test.id))
                  if (cartItem) removeFromCart(cartItem.id)
                } else {
                  addToCart({
                    id: `lab_test_${test.id}`,
                    type: 'lab_test',
                    name: test.name,
                    price: test.price,
                    test_id: test.id,
                    code: test.code,
                    category: test.category
                  })
                }
              }

              return (
                <motion.div
                  key={test.id}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(0,0,0,0.08)' }}
                  style={{
                    background: 'white',
                    border: '1px solid #f1f5f9',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {test.category}
                      </span>
                      {test.code && <code style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{test.code}</code>}
                    </div>

                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ecare-text-main)', margin: 0, lineHeight: 1.3 }}>
                      {test.name}
                    </h4>

                    {test.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '32px' }}>
                        {test.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                    {/* Diagnostic specifications */}
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sample Type:</span>
                        <strong style={{ color: 'var(--ecare-text-main)' }}>{test.sample_type || 'Blood'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Turnaround:</span>
                        <strong style={{ color: 'var(--ecare-text-main)' }}>{test.turnaround_days} Days</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingTop: '2px', borderTop: '1px dashed #e2e8f0' }}>
                        <span>Facility:</span>
                        <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={getLocationPath(test.location_id)}>
                          {getLocationPath(test.location_id).split('>').pop().trim()}
                        </span>
                      </div>
                    </div>

                    {/* Price and Cart Toggle Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>Total Fee</span>
                        <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>৳{Number(test.price).toLocaleString()}</span>
                      </div>

                      <button
                        onClick={handleCartClick}
                        onMouseEnter={() => setHoveredCardId(test.id)}
                        onMouseLeave={() => setHoveredCardId(null)}
                        style={{
                          height: '34px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: inCart ? '1px solid #fee2e2' : 'none',
                          background: inCart ? (hoverRemove ? '#fee2e2' : '#ecfdf5') : 'var(--ecare-primary)',
                          color: inCart ? (hoverRemove ? '#ef4444' : '#10b981') : 'white',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                      >
                        {inCart ? (
                          hoverRemove ? (
                            <>
                              <X size={14} weight="bold" />
                              Remove
                            </>
                          ) : (
                            <>
                              <Check size={14} weight="bold" />
                              Added
                            </>
                          )
                        ) : (
                          <>
                            <Plus size={14} weight="bold" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', background: 'white', border: '1px solid #f1f5f9', borderRadius: '16px', color: 'var(--ecare-text-muted)' }}>
            <ShoppingCart size={48} weight="duotone" style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No diagnostics found matching your filters.</p>
          </div>
        )}

        {/* Sticky Cart Banner */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ y: 100, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: 100, x: '-50%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                width: '90%',
                maxWidth: '550px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '20px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 2000
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={20} weight="fill" />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>
                    {cart.length} {cart.length === 1 ? 'Test' : 'Tests'} Selected
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', fontWeight: 600 }}>
                    Subtotal: <span style={{ color: 'var(--ecare-primary)', fontWeight: 800 }}>৳{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActivePage('cart')
                  if (!window.location.href.includes('wp-admin') && !window.location.href.includes('admin.php')) {
                    window.location.href = (window.ecareConfig?.siteUrl || '') + '/ecare-cart'
                  }
                }}
                className="ecare-button"
                style={{
                  padding: '8px 18px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Go to Cart
                <ShoppingCart size={14} weight="bold" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      <DataTable 
        title="Lab Test Catalog"
        data={tests||[]}
        columns={columns}
        searchPlaceholder="Search tests by name, code or category..."
        addLabel="Add New Test"
        onAdd={() => openEdit()}
        onEdit={(row) => openEdit(row)}
        onDelete={(id) => del(id)}
        onBulkDelete={handleBulkDelete}
        filterOptions={CATEGORIES.map(c => ({ value: c, label: c }))}
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
                    maxWidth: '600px', 
                    pointerEvents: 'auto',
                    borderRadius: '16px',
                    padding: 0, 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
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
                        <Flask size={20} weight="bold" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                          {editing ? 'Edit Lab Test' : 'Add Lab Test'}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                          Configure diagnostic investigation and pricing
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

                  <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="ecare-scrollbar">
                    <div className="ecare-form-group">
                      <label className="ecare-label">* Test Name</label>
                      <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="ecare-input" placeholder="e.g. Complete Blood Count"/>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <label className="ecare-label" style={{ marginBottom: 0, fontWeight: 700 }}>Select Diagnostic Facility</label>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: '0.75rem' }}>
                        <div className="ecare-form-group">
                          <label style={{ fontSize:'0.7rem', color:'#64748b', marginBottom:'4px', display:'block' }}>Division</label>
                          <CustomSelect value={selDiv} onChange={v => { setSelDiv(v); setSelDist(''); setSelArea(''); setForm(p=>({...p, location_id: ''})) }} 
                            options={[{value:'', label:'Select Division'}, ...divisions.map(d=>({value:String(d.id), label:d.name}))]} />
                        </div>
                        <div className="ecare-form-group">
                          <label style={{ fontSize:'0.7rem', color:'#64748b', marginBottom:'4px', display:'block' }}>District</label>
                          <CustomSelect value={selDist} onChange={v => { setSelDist(v); setSelArea(''); setForm(p=>({...p, location_id: ''})) }} 
                            options={[{value:'', label:'Select District'}, ...districts.map(d=>({value:String(d.id), label:d.name}))]} />
                        </div>
                        <div className="ecare-form-group">
                          <label style={{ fontSize:'0.7rem', color:'#64748b', marginBottom:'4px', display:'block' }}>Area</label>
                          <CustomSelect value={selArea} onChange={v => { setSelArea(v); setForm(p=>({...p, location_id: ''})) }} 
                            options={[{value:'', label:'Select Area'}, ...areas.map(a=>({value:String(a.id), label:a.name}))]} />
                        </div>
                        <div className="ecare-form-group">
                          <label style={{ fontSize:'0.7rem', color:'#64748b', marginBottom:'4px', display:'block' }}>Lab Provider</label>
                          <CustomSelect value={form.location_id} onChange={v => setForm(p=>({...p, location_id: v}))} 
                            options={[{value:'', label:'Select Provider'}, ...providers.map(p=>({value:String(p.id), label:p.name}))]} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                      <div className="ecare-form-group"><label className="ecare-label">Test Code</label><input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} className="ecare-input" placeholder="CBC-001"/></div>
                      <div className="ecare-form-group"><label className="ecare-label">Price (৳)</label><input type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} className="ecare-input" placeholder="0.00"/></div>
                      <div className="ecare-form-group"><label className="ecare-label">Category</label><CustomSelect value={form.category} onChange={v=>setForm(p=>({...p,category:v}))} options={CATEGORIES.map(c=>({value:c,label:c}))} /></div>
                      <div className="ecare-form-group"><label className="ecare-label">Sample Type</label><CustomSelect value={form.sample_type} onChange={v=>setForm(p=>({...p,sample_type:v}))} options={SAMPLES.map(s=>({value:s,label:s}))} /></div>
                      <div className="ecare-form-group"><label className="ecare-label">Turnaround (days)</label><input type="number" min="1" value={form.turnaround_days} onChange={e=>setForm(p=>({...p,turnaround_days:e.target.value}))} className="ecare-input"/></div>
                      <div className="ecare-form-group"><label className="ecare-label">Status</label><CustomSelect value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]} /></div>
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Description</label>
                      <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="ecare-input" rows="3" placeholder="Optional description..."/>
                    </div>
                    <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem', paddingTop:'1rem', borderTop:'1px solid #f1f5f9' }}>
                      <button onClick={() => setModal(false)} className="ecare-btn-secondary" style={{ flex:1, padding:'0.75rem', borderRadius:'10px' }}>Cancel</button>
                      <button onClick={save} disabled={saving} className="ecare-button" style={{ flex:1, padding:'0.75rem', borderRadius:'10px', opacity:saving?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
                        <CheckCircle size={18} weight="bold" />
                        {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Test'}
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
