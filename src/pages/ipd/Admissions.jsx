import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  IdentificationCard, User, FirstAid, FileText, CheckCircle, 
  MagnifyingGlass, Printer, X, Calendar, Clock, ArrowsClockwise,
  ArrowRight, ShieldCheck, Heartbeat, CaretDown, CurrencyCircleDollar
} from 'phosphor-react'
import useStore from '../../store/useStore'
import { Portal } from '../../utils/portal'
import toast from 'react-hot-toast'
import CustomSelect from '../../components/CustomSelect'

export default function Admissions() {
  const {
    ipdAdmissions = [],
    ipdWards = [],
    ipdBeds = [],
    user,
    setActivePage
  } = useStore()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [wardFilter, setWardFilter] = useState('ALL')

  // Selected admission for full view / discharge summary modal
  const [selectedAdmission, setSelectedAdmission] = useState(null)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)

  // Filtered Admissions List
  const filteredAdmissions = useMemo(() => {
    return ipdAdmissions.filter(item => {
      const matchSearch = 
        (item.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.doctor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.bed_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.id || '').includes(searchQuery)

      const matchStatus = statusFilter === 'ALL' || (item.status || 'Admitted').toLowerCase() === statusFilter.toLowerCase()
      const matchWard = wardFilter === 'ALL' || String(item.ward_id) === String(wardFilter)

      return matchSearch && matchStatus && matchWard
    })
  }, [ipdAdmissions, searchQuery, statusFilter, wardFilter])

  // Stats
  const stats = useMemo(() => {
    const total = ipdAdmissions.length
    const admitted = ipdAdmissions.filter(a => (a.status || 'Admitted') === 'Admitted').length
    const discharged = ipdAdmissions.filter(a => a.status === 'Discharged').length
    return { total, admitted, discharged }
  }, [ipdAdmissions])

  // Handle open discharge summary
  const handleOpenSummary = (admission) => {
    setSelectedAdmission(admission)
    setIsSummaryModalOpen(true)
  }

  // Handle Print
  const handlePrint = () => {
    window.print()
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ paddingBottom: '3rem' }}
    >
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Admissions Registry & Discharge Archive
            </h1>
            <span style={{ 
              background: '#f1f5f9', 
              color: '#475569', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              padding: '2px 8px', 
              borderRadius: '999px',
              border: '1px solid #e2e8f0'
            }}>
              IPD ARCHIVE
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Historical record of all patient admissions, bed stays, clinical rounds, and certified discharge certificates.
          </p>
        </div>

        <button
          onClick={() => setActivePage('ipd-beds')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: 'var(--ecare-primary, #0284c7)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
          }}
        >
          View Live Floor Plan
          <ArrowRight size={15} weight="bold" />
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 3, '--stat-grid-cols-md': 3, marginBottom: '1.25rem' }}>
        <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IdentificationCard size={22} weight="duotone" />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>All-Time Registrations</div>
            <div style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>{stats.total} Admissions</div>
          </div>
        </div>

        <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heartbeat size={22} weight="duotone" />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Currently Inpatient</div>
            <div style={{ color: '#ef4444', fontSize: '1.25rem', fontWeight: 800 }}>{stats.admitted} Patients</div>
          </div>
        </div>

        <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} weight="duotone" />
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Discharged & Settled</div>
            <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 800 }}>{stats.discharged} Completed</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 12px', width: '320px' }}>
          <MagnifyingGlass size={16} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search by patient, doctor, diagnosis, ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.82rem' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            {['ALL', 'Admitted', 'Discharged'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? '#0f172a' : 'transparent',
                  color: statusFilter === st ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {st === 'ALL' ? 'All Records' : st}
              </button>
            ))}
          </div>

          {/* Ward Dropdown Filter */}
          <div style={{ width: '200px' }}>
            <CustomSelect
              value={wardFilter}
              onChange={val => setWardFilter(val)}
              options={[
                { value: 'ALL', label: 'All Wards' },
                ...ipdWards.map(w => ({ value: String(w.id), label: w.name }))
              ]}
              placeholder="Filter Ward"
            />
          </div>
        </div>
      </div>

      {/* Admissions Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Admission ID</th>
                <th style={{ padding: '12px 16px' }}>Patient Details</th>
                <th style={{ padding: '12px 16px' }}>Ward & Bed</th>
                <th style={{ padding: '12px 16px' }}>Attending Physician</th>
                <th style={{ padding: '12px 16px' }}>Admit Date</th>
                <th style={{ padding: '12px 16px' }}>Diagnosis</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmissions.map((adm, idx) => {
                const isDischarged = adm.status === 'Discharged'
                return (
                  <tr 
                    key={adm.id || idx}
                    style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* ID */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      #{adm.id}
                      <span style={{ 
                        display: 'block', 
                        fontSize: '0.68rem', 
                        color: '#64748b',
                        fontWeight: 500 
                      }}>
                        {adm.admission_type || 'Elective'}
                      </span>
                    </td>

                    {/* Patient */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {adm.patient_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        ID: {adm.patient_id ? `#${adm.patient_id}` : 'General Patient'}
                      </div>
                    </td>

                    {/* Ward & Bed */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0369a1' }}>
                        {adm.bed_number}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {adm.ward_name || 'Ward 4 East'} (RM {adm.room_number || '401'})
                      </div>
                    </td>

                    {/* Doctor */}
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      <strong>{adm.doctor_name || 'Dr. On-Duty'}</strong>
                    </td>

                    {/* Admit Date */}
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {adm.admit_date || 'N/A'}
                      {isDischarged && adm.discharge_date && (
                        <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                          Out: {adm.discharge_date}
                        </div>
                      )}
                    </td>

                    {/* Diagnosis */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-block',
                        maxWidth: '180px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        🩺 {adm.diagnosis || 'Observation'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '999px',
                        background: isDischarged ? '#ecfdf5' : '#fee2e2',
                        color: isDischarged ? '#065f46' : '#991b1b',
                        border: `1px solid ${isDischarged ? '#a7f3d0' : '#fecaca'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDischarged ? '#10b981' : '#ef4444' }} />
                        {adm.status || 'Admitted'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenSummary(adm)}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <FileText size={14} weight="bold" />
                        {isDischarged ? 'Discharge Summary' : 'View Chart'}
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filteredAdmissions.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No admission records match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: MEDICAL DISCHARGE SUMMARY / CHART CERTIFICATE */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isSummaryModalOpen && selectedAdmission && (
          <Portal>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={() => setIsSummaryModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '680px',
                  maxHeight: '92vh',
                  overflowY: 'auto',
                  boxShadow: '0 25px 35px -5px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Action Bar */}
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc'
                }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                    Official Medical Document • Admission #{selectedAdmission.id}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handlePrint}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#0f172a'
                      }}
                    >
                      <Printer size={15} weight="bold" />
                      Print Summary
                    </button>
                    <button onClick={() => setIsSummaryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Printable Document Sheet */}
                <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '20px', color: '#0f172a' }}>
                  
                  {/* Hospital Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        {window.ecareConfig?.siteName || 'E-CARE HOSPITAL & MEDICAL CENTRE'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Department of Inpatient Services (IPD) • 24/7 Clinical Care
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                        Emergency: 10678 • Web: medical-saas-platform.local
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        background: selectedAdmission.status === 'Discharged' ? '#d1fae5' : '#fee2e2', 
                        color: selectedAdmission.status === 'Discharged' ? '#065f46' : '#991b1b',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        display: 'inline-block'
                      }}>
                        {selectedAdmission.status === 'Discharged' ? 'DISCHARGE CERTIFICATE' : 'INPATIENT CLINICAL RECORD'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                        Date: {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Patient & Stay Particulars Grid */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    fontSize: '0.8rem'
                  }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Patient Name</span>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                        {selectedAdmission.patient_name}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Attending Physician</span>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                        {selectedAdmission.doctor_name || 'Dr. Assigned'}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Admission Date</span>
                      <div style={{ fontWeight: 600 }}>{selectedAdmission.admit_date || 'N/A'}</div>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Discharge Date</span>
                      <div style={{ fontWeight: 600 }}>{selectedAdmission.discharge_date || 'Ongoing Inpatient Stay'}</div>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Ward & Bed Assigned</span>
                      <div style={{ fontWeight: 600 }}>{selectedAdmission.bed_number} ({selectedAdmission.ward_name || 'Ward 4 East'})</div>
                    </div>

                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Admission Category</span>
                      <div style={{ fontWeight: 600 }}>{selectedAdmission.admission_type || 'Elective'}</div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Primary Diagnosis / Indication
                    </div>
                    <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {selectedAdmission.diagnosis || 'Post-Operative Recovery and Clinical Observation'}
                    </div>
                  </div>

                  {/* Clinical Course & Notes */}
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Clinical Course & Observations
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(selectedAdmission.clinical_notes || []).map((cn, idx) => (
                        <div key={idx} style={{ borderLeft: '3px solid #0284c7', paddingLeft: '10px', fontSize: '0.78rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {cn.recorded_by} — <span style={{ fontWeight: 500, color: '#64748b' }}>{cn.timestamp ? new Date(cn.timestamp).toLocaleDateString() : ''}</span>
                          </div>
                          <div style={{ color: '#334155', marginTop: '2px' }}>{cn.note}</div>
                        </div>
                      ))}
                      {(!selectedAdmission.clinical_notes || selectedAdmission.clinical_notes.length === 0) && (
                        <div style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
                          Patient admitted under standard clinical observation protocol. Vitals continuously monitored.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Discharge Condition & Advice */}
                  {selectedAdmission.status === 'Discharged' && (
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                          Condition at Discharge
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                          ✓ {selectedAdmission.discharge_condition || 'Recovered & Clinically Stable'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                          Discharge Advice & Post-Discharge Regimen
                        </div>
                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#334155' }}>
                          {selectedAdmission.discharge_advice || 'Continue prescribed oral medications. Rest for 7 days. Return to emergency if fever or severe pain occurs.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financial Settlement Block */}
                  {selectedAdmission.status === 'Discharged' && selectedAdmission.total_charges && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>Total Inpatient Charges Billed:</div>
                        <div style={{ fontSize: '0.72rem', color: '#15803d' }}>Duration: {selectedAdmission.days_stayed || 1} Days • Payment via {selectedAdmission.payment_method || 'Cash'}</div>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                        ৳{Number(selectedAdmission.total_charges).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Doctor Signature Block */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Hospital Reg ID: MED-IPD-{selectedAdmission.id}
                      <br />Computer Generated Certified Record
                    </div>

                    <div style={{ textAlign: 'center', width: '200px' }}>
                      <div style={{ borderBottom: '1.5px solid #0f172a', paddingBottom: '35px', fontStyle: 'italic', color: '#64748b', fontSize: '0.8rem' }}>
                        (Authorized Signatory)
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                        {selectedAdmission.doctor_name || 'Chief Medical Officer'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Attending Physician
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
