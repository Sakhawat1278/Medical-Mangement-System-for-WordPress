import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, CalendarCheck, Heartbeat, Phone, EnvelopeSimple, Vault, X } from 'phosphor-react'
import DataTable from '../components/DataTable'
import useStore from '../store/useStore'
import MedicalVault from '../components/MedicalVault'
import { normalizeGender } from '../utils/gender'

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

const PatientList = () => {
  const { user, patients, appointments, deletePatient, bulkDelete, openConfirm, setActivePage, setEditingPatient, getCurrentDoctor } = useStore()
  const [vaultPatient, setVaultPatient] = useState(null)
  const isDoctor = user?.ecareRole === 'doctor'

  const displayedPatients = React.useMemo(() => {
    if (!isDoctor) return patients
    const currentDoctor = getCurrentDoctor()
    const doctorName = currentDoctor?.name || user?.name

    const myPatientNames = new Set(
      (appointments || [])
        .filter(a => a.doctorName === doctorName)
        .map(a => a.patientName)
    )
    return (patients || []).filter(p => myPatientNames.has(p.name))
  }, [patients, appointments, isDoctor, user.name, getCurrentDoctor])

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active': return 'badge-success';
      case 'In Treatment': return 'badge-warning';
      case 'Recovered': return 'badge-info';
      case 'Inactive': return 'badge-error';
      default: return '';
    }
  }

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  const columns = [
    {
      key: 'id',
      label: 'Patient ID',
      render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ecare-primary)' }}>#PAT-{String(val).slice(0, 8).toUpperCase()}</span>
    },
    {
      key: 'name',
      label: 'Patient Name',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden' }}>
            {row.avatar ? <img src={row.avatar} alt={val} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : val.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--ecare-text-main)' }}>{val}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)' }}>{normalizeGender(row.gender) || row.gender || '—'}, {row.age || calculateAge(row.dob) || '...'} yrs</span>
          </div>
        </div>
      )
    },
    {
      key: 'contact', label: 'Contact Details',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-main)', fontSize: '0.8125rem' }}><Phone size={14} color="#94a3b8" weight="fill" /> {row.phone}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-muted)', fontSize: '0.8125rem' }}><EnvelopeSimple size={14} color="#94a3b8" weight="fill" /> {row.email}</div>
        </div>
      )
    },
    {
      key: 'lastVisit', label: 'Last Visit',
      render: (val, row) => {
        const regDate = row.created_at ? row.created_at.split(' ')[0] : null;
        const hasRealVisit = val && val !== regDate;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck size={16} color={hasRealVisit ? "var(--ecare-primary)" : "#cbd5e1"} />
            <span style={{ color: hasRealVisit ? 'var(--ecare-text-main)' : 'var(--ecare-text-muted)', fontWeight: hasRealVisit ? 600 : 400, fontSize: hasRealVisit ? '0.875rem' : '0.8125rem', fontStyle: hasRealVisit ? 'normal' : 'italic' }}>
              {hasRealVisit ? val : 'No visits recorded'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'status', label: 'Status',
      render: (val) => <span className={`ecare-badge ${getStatusBadge(val)}`}>{val}</span>
    },
    {
      key: 'vault', label: 'Medical Vault',
      render: (_, row) => (
        <button
          onClick={() => setVaultPatient(row)}
          title="View Medical Vault"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1.5px solid var(--ecare-primary)', background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
          <Vault size={15} weight="duotone" /> Vault
        </button>
      )
    }
  ]

  const handleDelete = (id) => {
    openConfirm({
      title: 'Delete Patient',
      message: 'Are you sure you want to remove this patient record? All history will be permanently deleted.',
      confirmText: 'Delete Record',
      onConfirm: () => deletePatient(id)
    })
  }

  const safePatients = Array.isArray(displayedPatients) ? displayedPatients : []
  const activePatients = safePatients.filter(p => p.status === 'Active').length
  const recoveringPatients = safePatients.filter(p => p.status === 'In Treatment').length

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title={isDoctor ? "My Patients" : "Total Registered"} value={safePatients.length} icon={Users} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Active Status" value={activePatients} icon={UserPlus} color="#0891b2" delay={0.2} />
        <StatCard title="In Treatment" value={recoveringPatients} icon={Heartbeat} color="#f59e0b" delay={0.3} />
        <StatCard title="New Records" value={safePatients.filter(p => p.created_at && p.created_at.includes(new Date().toISOString().split('T')[0])).length} icon={CalendarCheck} color="var(--ecare-primary)" delay={0.4} />
      </div>

      <DataTable 
        data={safePatients}
        columns={columns}
        searchPlaceholder="Search patients..."
        hideAdd={isDoctor}
        addLabel="Add Patient"
        onAdd={isDoctor ? null : () => { setEditingPatient(null); setActivePage('add-patient'); }}
        onEdit={isDoctor ? null : (row) => { setEditingPatient(row); setActivePage('add-patient'); }}
        onDelete={isDoctor ? null : handleDelete}
        onBulkDelete={isDoctor ? null : (ids) => bulkDelete('patients', ids)}
      />

      {/* Medical Vault Side Drawer */}
      <AnimatePresence>
        {vaultPatient && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              onClick={() => setVaultPatient(null)}
              style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1200 }} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '520px', maxWidth: '95vw', background: 'white', zIndex: 1201, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>
              {/* Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)', fontWeight: 700, overflow: 'hidden' }}>
                    {vaultPatient.avatar ? <img src={vaultPatient.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : vaultPatient.name?.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9375rem' }}>{vaultPatient.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Medical Records & Identity Vault</div>
                  </div>
                </div>
                <button onClick={() => setVaultPatient(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} color="#64748b" />
                </button>
              </div>
              {/* Vault Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <MedicalVault
                  patientId={vaultPatient.id}
                  patientUserId={vaultPatient.user_id}
                  canUpload={true}
                  canDelete={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default PatientList
