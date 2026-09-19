import React, { useState } from 'react'
import { Phone, EnvelopeSimple, UserPlus, Timer, Check, X, Eye, Camera, FilePdf, CheckCircle, XCircle, Hourglass, Users, MagnifyingGlass } from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import DataTable from '../components/DataTable'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'

const InputGroup = ({ label, children }) => (
  <div className="ecare-form-group">
    <label className="ecare-label">{label}</label>
    <div style={{ 
      padding: '0.625rem 0.875rem', 
      borderRadius: '12px', 
      background: '#f8fafc', 
      border: '1px solid #e2e8f0',
      fontSize: '0.875rem',
      color: 'var(--ecare-text-main)',
      minHeight: '42px',
      display: 'flex',
      alignItems: 'center'
    }}>
      {children || <span style={{ color: '#94a3b8' }}>Not provided</span>}
    </div>
  </div>
)

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ borderColor: 'var(--ecare-primary)' }}
    className="ecare-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} weight="duotone" />
      </div>
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)

const getInitials = (name) => {
  if (!name) return 'DR'
  const cleanName = name.replace(/^(dr\.?\s+)+/i, '').trim()
  if (!cleanName) return 'DR'
  const parts = cleanName.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'DR'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const PendingDoctors = () => {
  const { openConfirm, pendingDoctors, updateDoctor, removePendingDoctor, bulkDelete } = useStore()
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  const handleApprove = (doctor) => {
    openConfirm({
      title: 'Approve Application',
      message: `Are you sure you want to approve ${doctor.name} and register them as an active specialist?`,
      onConfirm: async () => {
        const { updateDoctor } = useStore.getState();
        await updateDoctor(doctor.id, {
          status: 'Available',
          consultationStatus: 'Active'
        });
        setSelectedDoctor(null);
      }
    })
  }

  const handleReject = (doctor) => {
    openConfirm({
      title: 'Reject Application',
      message: `Are you sure you want to reject the application for ${doctor.name}? This action will remove them from the queue.`,
      onConfirm: () => {
        removePendingDoctor(doctor.id)
        setSelectedDoctor(null)
      }
    })
  }

  const handleBulkDelete = (selectedIds) => bulkDelete('doctors', selectedIds)

  const columns = [
    {
      key: 'name',
      label: 'Doctor Details',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            borderRadius: '50%', 
            background: 'var(--ecare-primary-bg)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {(row.avatar || row.photo) ? (
              <img src={row.avatar || row.photo} alt={val} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.875rem' }}>
                {getInitials(val)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--ecare-text-main)' }}>{val}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)' }}>{(row.specialization || row.specialty || row.spec || 'General Practice')} • {row.experience} Yrs Exp</span>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact Info',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-main)', fontSize: '0.75rem' }}>
            <Phone size={12} color="#94a3b8" /> {row.phone}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ecare-text-muted)', fontSize: '0.75rem' }}>
            <EnvelopeSimple size={12} color="#94a3b8" /> {row.email}
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Request Date',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ecare-text-main)', fontSize: '0.8125rem', fontWeight: 500 }}>
          <Timer size={16} color="#94a3b8" />
          {val ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Decision',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setSelectedDoctor(row)}
            style={{ 
              width: '32px', height: '32px', 
              borderRadius: '8px', border: 'none',
              background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            title="View Details"
          >
            <Eye size={18} weight="bold" />
          </button>
          <button 
            onClick={() => handleApprove(row)}
            style={{ 
              width: '32px', height: '32px', 
              borderRadius: '8px', border: 'none',
              background: '#dcfce7', color: '#166534',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            title="Approve"
          >
            <CheckCircle size={18} weight="bold" />
          </button>
          <button 
            onClick={() => handleReject(row)}
            style={{ 
              width: '32px', height: '32px', 
              borderRadius: '8px', border: 'none',
              background: '#fee2e2', color: '#991b1b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            title="Reject"
          >
            <XCircle size={18} weight="bold" />
          </button>
        </div>
      )
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)', paddingBottom: '2rem' }}
    >
      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title="Total Applications" value={pendingDoctors.length} icon={Users} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Pending Review" value={pendingDoctors.length} icon={Hourglass} color="#f59e0b" delay={0.2} />
        <StatCard title="Verified Today" value="0" icon={CheckCircle} color="var(--ecare-primary)" delay={0.3} />
        <StatCard title="Rejections" value="0" icon={XCircle} color="#ef4444" delay={0.4} />
      </div>
      <div className="ecare-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--ecare-accent)' }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-accent)' 
        }}>
          <UserPlus size={20} weight="fill" />
        </div>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>Verification Queue</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)', margin: 0 }}>Review and approve new medical staff applications</p>
        </div>
      </div>

      <DataTable 
        data={pendingDoctors}
        columns={columns}
        searchPlaceholder="Search applications..."
        showAddButton={false}
        onBulkDelete={handleBulkDelete}
      />

      <Portal>
        <AnimatePresence>
          {selectedDoctor && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoctor(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{ 
                width: '100%', 
                maxWidth: '900px', 
                maxHeight: '90vh',
                position: 'relative', 
                padding: 0,
                border: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: '#EBF4F6'
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', fontWeight: 800, color: 'var(--ecare-primary)',
                    overflow: 'hidden'
                  }}>
                    {(selectedDoctor.avatar || selectedDoctor.photo) ? (
                      <img src={selectedDoctor.avatar || selectedDoctor.photo} alt={selectedDoctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(selectedDoctor.name)
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Review Application: {selectedDoctor.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>Submitted on {selectedDoctor.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Form Content - Mirroring AddDoctor layout */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {/* Personal Information */}
                  <div className="ecare-card" style={{ padding: '1rem 1.5rem', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', margin: 0 }}>Personal Information</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '42px', height: '42px', borderRadius: '50%', background: '#f1f5f9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0'
                        }}>
                          {(selectedDoctor.avatar || selectedDoctor.photo) ? (
                            <img src={selectedDoctor.avatar || selectedDoctor.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Camera size={20} color="#94a3b8" />
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Profile Photo</span>
                      </div>
                    </div>
                    
                    <div className="ecare-form-grid">
                      <InputGroup label="Name">{selectedDoctor.name}</InputGroup>
                      <InputGroup label="Email">{selectedDoctor.email}</InputGroup>
                      <InputGroup label="Mobile">{selectedDoctor.phone}</InputGroup>
                    </div>

                    <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                      <InputGroup label="NID">{selectedDoctor.nid}</InputGroup>
                      <InputGroup label="Fee">{selectedDoctor.fee}</InputGroup>
                      <InputGroup label="Biography">{selectedDoctor.bio}</InputGroup>
                    </div>

                    <div style={{ marginTop: '0.25rem' }}>
                      <InputGroup label="Detailed Biography">
                        <div style={{ lineHeight: 1.5 }}>{selectedDoctor.detailedBio}</div>
                      </InputGroup>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="ecare-card" style={{ padding: '1rem 1.5rem', background: 'white' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Professional Information</h3>
                    
                    <div className="ecare-form-grid">
                      <InputGroup label="BMDC Code">{selectedDoctor.bmdcCode}</InputGroup>
                      <InputGroup label="BMDC Expiry Date">2028-12-31</InputGroup>
                      <InputGroup label="Degrees">{selectedDoctor.degrees}</InputGroup>
                    </div>

                    <div className="ecare-form-grid" style={{ marginTop: '0.25rem' }}>
                      <InputGroup label="Specialty">{selectedDoctor.specialization || selectedDoctor.specialty || selectedDoctor.spec}</InputGroup>
                      <InputGroup label="Years of Experience">{selectedDoctor.experience}</InputGroup>
                      <InputGroup label="Follow up days">7</InputGroup>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <InputGroup label="Clinical Services">
                        {Array.isArray(selectedDoctor.services) 
                          ? selectedDoctor.services.join(', ') 
                          : selectedDoctor.services}
                      </InputGroup>
                    </div>
                  </div>

                  {/* Bank Info & Documents */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="ecare-card" style={{ padding: '1rem 1.5rem', background: 'white' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Bank Information</h3>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <div className="ecare-radio-group">
                          <button type="button" className={`ecare-radio-btn ${selectedDoctor.accountType === 'Bank Account' ? 'active' : ''}`} style={{ pointerEvents: 'none' }}>Bank Account</button>
                          <button type="button" className={`ecare-radio-btn ${selectedDoctor.accountType === 'Mobile Banking' ? 'active' : ''}`} style={{ pointerEvents: 'none' }}>Mobile Banking</button>
                        </div>
                      </div>

                      {selectedDoctor.accountType === 'Bank Account' ? (
                        <>
                          <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <InputGroup label="Bank Name">{selectedDoctor.bankName}</InputGroup>
                            <InputGroup label="Branch Name">{selectedDoctor.branchName}</InputGroup>
                          </div>
                          <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '0.25rem' }}>
                            <InputGroup label="Account Name">{selectedDoctor.accountName}</InputGroup>
                            <InputGroup label="Account Number">{selectedDoctor.accountNumber}</InputGroup>
                          </div>
                        </>
                      ) : (
                        <div className="ecare-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                          <InputGroup label="Provider">{selectedDoctor.mobileProvider}</InputGroup>
                          <InputGroup label="Mobile Number">{selectedDoctor.mobileNumber}</InputGroup>
                        </div>
                      )}
                    </div>

                    <div className="ecare-card" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', background: 'white' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ecare-primary)', marginBottom: '1rem' }}>Documents</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {Array.isArray(selectedDoctor.documents) && selectedDoctor.documents.length > 0 ? (
                          selectedDoctor.documents.map((doc, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                              padding: '10px 15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' 
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                <FilePdf size={20} color="#ef4444" weight="fill" />
                                <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                  {doc.name}
                                </span>
                              </div>
                              <a 
                                href={doc.data} 
                                download={doc.name}
                                style={{ 
                                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--ecare-primary)', 
                                  textDecoration: 'none', background: 'var(--ecare-primary-bg)', 
                                  padding: '4px 12px', borderRadius: '89px' 
                                }}
                              >
                                Download
                              </a>
                            </div>
                          ))
                        ) : (
                          <div style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                            <FilePdf size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p style={{ fontSize: '0.75rem', margin: 0 }}>No documents uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision Footer */}
              <div style={{ padding: '1.25rem 2rem', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleReject(selectedDoctor)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <X size={18} weight="bold" /> Reject Application
                </button>
                <button 
                  onClick={() => handleApprove(selectedDoctor)}
                  style={{ padding: '0.75rem 2rem', borderRadius: '12px', background: 'var(--ecare-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Check size={18} weight="bold" /> Approve & Register
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

export default PendingDoctors
