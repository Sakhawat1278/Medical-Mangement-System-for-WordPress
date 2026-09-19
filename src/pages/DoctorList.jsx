import React, { useState } from 'react'
import { Phone, EnvelopeSimple, Users, Buildings, Heartbeat, FirstAid } from 'phosphor-react'
import { motion } from 'framer-motion'
import DataTable from '../components/DataTable'
import useStore from '../store/useStore'
import useAuth from '../hooks/useAuth'

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



const getStatusBadge = (status) => {
  switch(status) {
    case 'Available': return 'badge-success';
    case 'In Session': return 'badge-warning';
    case 'Offline': return 'badge-error';
    case 'On Leave': return 'badge-info';
    default: return '';
  }
}

const filterOptions = [
  { label: 'Available Only', value: 'Available' },
  { label: 'In Session Only', value: 'In Session' },
  { label: 'Offline Only', value: 'Offline' },
  { label: 'On Leave Only', value: 'On Leave' }
]

const columns = [
  {
    key: 'id',
    label: 'Doctor ID',
    render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--ecare-primary)' }}>#DOC-{String(val).slice(0, 8).toUpperCase()}</span>
  },
  {
    key: 'name',
    label: 'Doctor Name',
    render: (val, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          width: '40px', height: '40px', 
          borderRadius: '50%', 
          background: 'var(--ecare-primary-bg)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.875rem',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          {row.avatar ? (
            <img src={row.avatar} alt={val} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            val ? val.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'
          )}
        </div>
        <span style={{ fontWeight: 600, color: 'var(--ecare-text-main)' }}>{val}</span>
      </div>
    )
  },
  {
    key: 'specialization',
    label: 'Specialization',
    render: (val) => <span style={{ color: 'var(--ecare-text-muted)', fontWeight: 500 }}>{val || 'General Practice'}</span>
  },
  {
    key: 'contact',
    label: 'Contact Info',
    sortable: false,
    render: (_, row) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-main)', fontSize: '0.8125rem' }}>
          <Phone size={14} color="#94a3b8" weight="fill" /> {row.phone}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-muted)', fontSize: '0.8125rem' }}>
          <EnvelopeSimple size={14} color="#94a3b8" weight="fill" /> {row.email}
        </div>
      </div>
    )
  },
  {
    key: 'consultationStatus',
    label: 'Consultation',
    render: (val) => (
      <span className={`ecare-badge ${val === 'Active' ? 'badge-success' : 'badge-error'}`}>
        {val || 'Active'}
      </span>
    )
  },
  {
    key: 'issuedBy',
    label: 'Issued By',
    render: (val) => <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-primary)' }}>{val || 'System'}</span>
  },
  {
    key: 'instantCallStatus',
    label: 'Instant Call',
    render: (val) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span className={`ecare-badge ${val === 'Active' ? 'badge-success' : ''}`} style={{ background: val === 'Active' ? '' : '#f1f5f9', color: val === 'Active' ? '' : '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: val === 'Active' ? 'var(--ecare-primary)' : '#cbd5e1' }}></div>
            {val === 'Active' ? 'Instant Mode' : 'Inactive'}
          </div>
        </span>
      </div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => (
      <span className={`ecare-badge ${getStatusBadge(val)}`}>
        {val}
      </span>
    )
  }
]

const DoctorList = () => {
  const { setActivePage, setEditingDoctor, doctorList: doctors, deleteDoctorFromList, bulkDelete, openConfirm } = useStore()
  const { canAccess } = useAuth()

  const handleDelete = (id) => {
    openConfirm({
      title: 'Remove Doctor',
      message: 'Are you sure you want to remove this doctor from the registry? This action cannot be undone.',
      confirmText: 'Remove Doctor',
      onConfirm: () => deleteDoctorFromList(id)
    })
  }

  const handleBulkDelete = (ids) => bulkDelete('doctors', ids)

  const safeDoctors = Array.isArray(doctors) ? doctors : [];
  const totalDoctors = safeDoctors.length;
  const uniqueSpecialities = new Set(safeDoctors.map(d => d.specialization)).size;
  const patientsToday = (useStore.getState().appointments || []).filter(a => a.date === new Date().toISOString().split('T')[0]).length;
  const onCallDoctors = safeDoctors.filter(d => d.status === 'Available').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Total Specialists" value={totalDoctors} icon={Users} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Active Specialities" value={uniqueSpecialities} icon={Buildings} color="#0891b2" delay={0.2} />
        <StatCard title="Patients Today" value={patientsToday} icon={Heartbeat} color="var(--ecare-primary)" delay={0.3} />
        <StatCard title="On-Call Shift" value={onCallDoctors} icon={FirstAid} color="#ef4444" delay={0.4} />
      </div>

      <DataTable 
        data={safeDoctors}
        columns={columns}
        searchPlaceholder="Search doctors..."
        filterOptions={filterOptions}
        addLabel={canAccess('doctors_add') ? "Add Doctor" : null}
        onAdd={canAccess('doctors_add') ? () => {
          setEditingDoctor(null)
          setActivePage('add-doctor')
        } : null}
        onEdit={canAccess('doctors_edit') ? (row) => {
          setEditingDoctor(row)
          setActivePage('add-doctor')
        } : null}
        onDelete={canAccess('doctors_delete') ? handleDelete : null}
        onBulkDelete={canAccess('doctors_delete') ? handleBulkDelete : null}
      />
    </motion.div>
  )
}

export default DoctorList
