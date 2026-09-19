import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, UserSquare, CalendarCheck, DotsThreeVertical, CheckCircle, XCircle, ClockAfternoon, Activity, Star } from 'phosphor-react'
import DataTable from '../components/DataTable'
import CustomSelect from '../components/CustomSelect'
import useStore, { isTimeslotEnded } from '../store/useStore'
import toast from 'react-hot-toast'
import { formatPaymentMethod } from '../utils/formatters'
import ReviewModal from '../components/ReviewModal'

const isVideoConsultMode = (mode) => {
  const normalized = String(mode || '').trim().toLowerCase()
  return normalized === 'video consult' || normalized === 'telemedicine'
}

const getAppointmentStatusLabel = (appointment) => {
  const status = appointment?.status || 'Pending'
  if (status === 'Pending') {
    if (appointment?.missedBy === 'doctor') return 'Missed by Doctor'
    if (appointment?.missedBy === 'patient') return 'Missed by Patient'
    if (isTimeslotEnded(appointment?.date, appointment?.time)) return 'Overdue'
  }
  return status
}

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="ecare-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ color: color }}><Icon size={24} weight="duotone" /></div>
    </div>
    <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</div>
    <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</div>
  </motion.div>
)

const Appointments = () => {
  const { 
    user, appointments, patients, doctorList, updateAppointment, 
    deleteAppointment, bulkDelete, openConfirm, setActivePage, 
    setEditingAppointment, getCurrentDoctor, completeAppointment, missAppointment,
    addRefund, refunds, transactions, reviews
  } = useStore()
  const isDoctor = user?.ecareRole === 'doctor'
  const isPatient = user?.ecareRole === 'patient'

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);

  const requestMissedDoctorRefund = React.useCallback(async (appt) => {
    const existingRefund = (refunds || []).find(refund =>
      String(refund.appointmentId || '') === String(appt.id) &&
      String(refund.reason || '').toLowerCase().includes('doctor missed booked slot')
    )

    if (!existingRefund) {
      const linkedTxn = (transactions || []).find(t => String(t.appointmentId || t.appointment_id) === String(appt.id))
      const refundDate = new Date()
      refundDate.setDate(refundDate.getDate() + 7)

      await addRefund({
        transactionId: linkedTxn?.id || appt.transactionId || appt.transaction_id || `TXN-MISS-${appt.id}`,
        appointmentId: appt.id,
        invoiceNo: linkedTxn?.invoiceNo || '',
        originalAmount: Number(linkedTxn?.paidAmount || linkedTxn?.amount || appt.paidAmount || appt.price || appt.amount || 0),
        refundAmount: Number(linkedTxn?.paidAmount || linkedTxn?.amount || appt.paidAmount || appt.price || appt.amount || 0),
        patientName: appt.patientName,
        patientId: appt.patient_user_id || appt.patientId || appt.userId || 0,
        type: 'Full',
        reason: `Doctor missed booked slot on ${appt.date} (${appt.time})`,
        status: 'Pending',
        date: refundDate.toISOString().split('T')[0]
      })
    }

    await updateAppointment(appt.id, { refundStatus: 'pending_7_days' })
    toast.success(existingRefund ? 'Refund request was already recorded.' : '7-day refund request registered successfully!')
  }, [refunds, transactions, addRefund, updateAppointment])

  const displayedAppointments = React.useMemo(() => {
    if (!isDoctor) return appointments || []
    const currentDoctor = getCurrentDoctor()
    const doctorName = currentDoctor?.name || user?.name
    return (appointments || []).filter(a => a.doctorName === doctorName)
  }, [appointments, isDoctor, user.name, getCurrentDoctor])

  const safeAppointments = Array.isArray(displayedAppointments) ? displayedAppointments : []

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], [])
  const liveBookingCount = React.useMemo(
    () => safeAppointments.filter(a => ['Confirmed', 'Active', 'Query'].includes(a.status)).length,
    [safeAppointments]
  )
  const todayVisitCount = React.useMemo(
    () => safeAppointments.filter(a => a.date === todayStr && !['Cancelled', 'Expired', 'Closed'].includes(a.status)).length,
    [safeAppointments, todayStr]
  )

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Confirmed': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Cancelled': return 'badge-error';
      case 'Completed': return 'badge-info';
      default: return '';
    }
  }

  const columns = [
    {
      key: 'patientName',
      label: 'Patient',
      render: (val) => {
        const p = patients.find(p => p.name === val)
        const avatar = p?.avatar
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {avatar ? (
              <img 
                src={avatar} 
                alt={val} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #f1f5f9' }} 
              />
            ) : (
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', background: 'var(--ecare-primary-bg)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)', fontWeight: 700, fontSize: '0.85rem'
              }}>
                {val ? val[0] : 'P'}
              </div>
            )}
            <span style={{ fontWeight: 600, color: 'var(--ecare-text-main)', fontSize: '0.875rem' }}>{val}</span>
          </div>
        )
      }
    },
    {
      key: 'doctorName',
      label: 'Doctor',
      render: (val) => {
        const doc = doctorList.find(d => d.name === val)
        const avatar = doc?.avatar
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {avatar ? (
              <img 
                src={avatar} 
                alt={val} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #f1f5f9' }} 
              />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserSquare size={20} weight="duotone" color="var(--ecare-primary)" />
              </div>
            )}
            <span style={{ fontWeight: 600, color: 'var(--ecare-text-main)', fontSize: '0.875rem' }}>{val}</span>
          </div>
        )
      }
    },
    {
      key: 'dateTime',
      label: 'Schedule',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ecare-text-main)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <Calendar size={14} color="var(--ecare-primary)" /> {row.date}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ecare-text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
            <Clock size={14} /> {row.time}
          </div>
        </div>
      )
    },
    {
      key: 'service',
      label: 'Clinical Service',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{val || row.type}</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--ecare-primary)', textTransform: 'uppercase' }}>{row.specialty || 'General'}</span>
        </div>
      )
    },
    {
      key: 'mode',
      label: 'Mode',
      render: (val) => (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '4px', 
          color: isVideoConsultMode(val) ? '#0ea5e9' : '#64748b',
          fontSize: '0.75rem', fontWeight: 700
        }}>
          {isVideoConsultMode(val) ? <Activity size={14} /> : <User size={14} />}
          {(isVideoConsultMode(val) ? 'VIDEO CONSULT' : (val?.toUpperCase() || 'IN-PERSON'))}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => {
        const getStyle = (status) => {
          const s = status?.toLowerCase() || 'pending';
          if (s === 'confirmed') return { bg: '#ecfdf5', color: '#10b981', border: '#10b98140' };
          if (s === 'completed') return { bg: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', border: 'var(--ecare-primary)40' };
          if (s === 'cancelled') return { bg: '#fef2f2', color: '#dc2626', border: '#ef444440' };
          if (s === 'expired') return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' };
          if (s === 'query') return { bg: '#eff6ff', color: '#2563eb', border: '#3b82f640' };
          if (s === 'active') return { bg: '#f0fdf4', color: '#16a34a', border: '#16a34a40' };
          if (s === 'under verification' || s === 'under verify') return { bg: '#fffbeb', color: '#d97706', border: '#f59e0b40' };
          if (s === 'refund pending') return { bg: '#eff6ff', color: '#2563eb', border: '#3b82f640' };
          if (s === 'refunded') return { bg: '#f5f3ff', color: '#7c3aed', border: '#7c3aed40' };
          if (s === 'closed') return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
          return { bg: '#fff7ed', color: '#d97706', border: '#f59e0b40' }; // pending
        };
        const style = getStyle(val);
        const statusLabel = getAppointmentStatusLabel(row);
        const { updateAppointment } = useStore.getState();
        if (isDoctor || isPatient) {
          return (
            <div style={{ 
              padding: '4px 10px', borderRadius: '20px', 
              background: style.bg, color: style.color,
              fontSize: '0.65rem', fontWeight: 800, textAlign: 'center',
              border: `1px solid ${style.border}`, textTransform: 'uppercase',
              display: 'inline-block'
            }}>
              {statusLabel}
            </div>
          );
        }
        
        const isInstantCall = row.mode === 'Instant Call';
        const selectOptions = isInstantCall
          ? [
              { value: 'Pending', label: 'Pending' },
              { value: 'Query', label: 'Query' },
              { value: 'Active', label: 'Active' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Cancelled', label: 'Cancelled' },
              { value: 'Expired', label: 'Expired' },
              { value: 'Under Verify', label: 'Under Verify' },
              { value: 'Refund Pending', label: 'Refund Pending' },
              { value: 'Refunded', label: 'Refunded' },
              { value: 'Closed', label: 'Closed' }
            ]
          : [
              { value: 'Pending', label: 'Pending' },
              { value: 'Confirmed', label: 'Confirmed' },
              { value: 'Cancelled', label: 'Cancelled' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Expired', label: 'Expired' },
              { value: 'Refund Pending', label: 'Refund Pending' },
              { value: 'Refunded', label: 'Refunded' },
              { value: 'Closed', label: 'Closed' }
            ];

        return (
          <div style={{ width: '110px' }}>
            <CustomSelect 
              value={val || 'Pending'}
              onChange={(newStatus) => updateAppointment(row.id, { status: newStatus })}
              options={selectOptions}
              customTriggerStyle={{ 
                padding: '4px 10px', borderRadius: '20px', 
                background: style.bg,
                color: style.color,
                fontSize: '0.65rem', fontWeight: 800, textAlign: 'center',
                border: `1px solid ${style.border}`,
                textTransform: 'uppercase',
                minWidth: 'unset', boxShadow: 'none'
              }}
            />
          </div>
        );
      }
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (val, row) => {
        const getStyle = (status) => {
          const s = status?.toLowerCase() || 'pending';
          if (s === 'paid') return { bg: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', border: 'var(--ecare-primary)40' };
          if (s.includes('partial')) return { bg: '#fffbeb', color: '#b45309', border: '#fcd34d60' };
          if (s.includes('pending')) return { bg: '#fff7ed', color: '#d97706', border: '#f59e0b40' };
          if (s.includes('verify') || s.includes('verification')) return { bg: '#eff6ff', color: '#2563eb', border: '#3b82f640' };
          if (s.includes('fail')) return { bg: '#fef2f2', color: '#dc2626', border: '#ef444440' };
          if (s.includes('refund')) return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
          return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
        };
        const style = getStyle(val);
        const { updateAppointment } = useStore.getState();
        if (isDoctor || isPatient) {
          return (
            <div style={{ 
              padding: '4px 10px', borderRadius: '20px', 
              background: style.bg, color: style.color,
              fontSize: '0.65rem', fontWeight: 800, textAlign: 'center',
              border: `1px solid ${style.border}`, textTransform: 'uppercase',
              display: 'inline-block'
            }}>
              {val || 'Pending'}
            </div>
          );
        }
        return (
          <div style={{ width: '100px' }}>
            <CustomSelect 
              value={val || 'Pending'}
              onChange={(newStatus) => updateAppointment(row.id, { paymentStatus: newStatus })}
              options={[
                { value: 'Paid', label: 'Paid' },
                { value: 'Partially Paid', label: 'Partial' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Under Verify', label: 'Verify' }
              ]}
              customTriggerStyle={{ 
                padding: '4px 10px', borderRadius: '20px', 
                background: style.bg,
                color: style.color,
                fontSize: '0.65rem', fontWeight: 800, textAlign: 'center',
                border: `1px solid ${style.border}`,
                textTransform: 'uppercase',
                minWidth: 'unset', boxShadow: 'none'
              }}
            />
          </div>
        );
      }
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (val, row) => {
        const state = useStore.getState();
        const gateways = Object.entries(state.paymentGateways || {})
          .filter(([_, g]) => g.enabled)
          .map(([k, g]) => ({ value: formatPaymentMethod(g.name || k), label: formatPaymentMethod(g.name || k) }));
        
        const cleanVal = formatPaymentMethod(val) || 'Cash';
        if (isDoctor || isPatient) {
          return (
            <div style={{ 
              padding: '4px 8px', borderRadius: '8px', 
              background: '#f8fafc', color: '#64748b',
              fontSize: '0.7rem', fontWeight: 600,
              display: 'inline-block'
            }}>
              {cleanVal}
            </div>
          );
        }
        return (
          <div style={{ width: '90px' }}>
            <CustomSelect 
              value={cleanVal}
              onChange={(newMethod) => updateAppointment(row.id, { paymentMethod: newMethod })}
              options={gateways}
              customTriggerStyle={{ 
                padding: '4px 8px', borderRadius: '8px', 
                background: '#f1f5f9', color: '#475569',
                fontSize: '0.7rem', fontWeight: 600,
                border: 'none', minWidth: 'unset', boxShadow: 'none'
              }}
            />
          </div>
        );
      }
    },
    {
      key: 'issuedBy',
      label: 'Issued By',
      render: (val) => <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-primary)' }}>{val || 'System'}</span>
    },
    {
      key: 'operationalAction',
      label: 'Operational Action',
      render: (_, row) => {
        const rawStatus = String(row.status || '').trim();
        const st = rawStatus.toLowerCase();

        // 1. Finished/Concluded consultations (Completed, Closed)
        if (st === 'completed' || st === 'closed') {
          const apptReview = (reviews || []).find(r => 
            (r.appointment_id && String(r.appointment_id) === String(row.id)) ||
            (r.appointmentId && String(r.appointmentId) === String(row.id))
          );
          const hasReviewed = Boolean(apptReview);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} weight="bold" /> {st === 'closed' ? 'Concluded' : 'Completed'}
              </span>
              {isPatient && !hasReviewed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReviewAppointment(row);
                    setIsReviewModalOpen(true);
                  }}
                  style={{
                    padding: '5px 12px', borderRadius: '8px',
                    background: '#fef3c7', color: '#b45309',
                    border: '1px solid #fde68a',
                    fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    justifyContent: 'center', transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fef3c7'}
                >
                  <Star size={13} weight="fill" color="#f59e0b" /> Rate Doctor
                </button>
              )}
              {isPatient && hasReviewed && (
                <div 
                  title={apptReview?.review_text ? `"${apptReview.review_text}"` : 'Your review has been recorded'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    width: 'fit-content',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#d97706', fontWeight: 700, fontSize: '0.75rem' }}>
                    <Star size={13} weight="fill" color="#f59e0b" />
                    <span>{apptReview.rating || 5}★ Rated</span>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    background: apptReview.status === 'Approved' ? '#ecfdf5' : '#fffbeb',
                    color: apptReview.status === 'Approved' ? '#059669' : '#b45309',
                    border: apptReview.status === 'Approved' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                  }}>
                    {apptReview.status === 'Approved' ? 'Verified' : 'Under Review'}
                  </span>
                </div>
              )}
              {!isPatient && hasReviewed && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  color: '#d97706',
                  fontWeight: 600,
                  width: 'fit-content'
                }}>
                  <Star size={12} weight="fill" color="#f59e0b" />
                  <span>{apptReview.rating || 5}★ Patient Review</span>
                </div>
              )}
            </div>
          );
        }

        // 2. Admin / Staff Interface (can Rebook anytime)
        if (!isDoctor && !isPatient) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleRequestFollowup(row)}
                style={{
                  padding: '5px 10px', borderRadius: '8px',
                  background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                  border: '1px solid var(--ecare-primary-border)',
                  fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Activity size={12} weight="bold" /> Rebook
              </button>
            </div>
          );
        }

        // 3. Doctor Interface for active/pending
        if (isDoctor) {
          if (st === 'pending' || st === 'confirmed' || st === 'active') {
            if (row.missedBy === 'patient') {
              return <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>⚠️ Missed by Patient</span>;
            }
            if (row.missedBy === 'doctor') {
              return <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>⚠️ Missed by Doctor</span>;
            }
            return (
              <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { completeAppointment(row.id); }}
                  style={{
                    padding: '4px 8px', borderRadius: '6px',
                    background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                    border: '1px solid var(--ecare-primary-border)',
                    fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Complete
                </button>
                <button
                  onClick={() => { missAppointment(row.id, 'patient'); }}
                  style={{
                    padding: '4px 8px', borderRadius: '6px',
                    background: '#fef2f2', color: '#dc2626',
                    border: '1px solid #fecaca',
                    fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Missed (Patient)
                </button>
                <button
                  onClick={() => { missAppointment(row.id, 'doctor'); }}
                  style={{
                    padding: '4px 8px', borderRadius: '6px',
                    background: '#fff7ed', color: '#d97706',
                    border: '1px solid #fed7aa',
                    fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Missed (Clinician)
                </button>
              </div>
            );
          }
          return null;
        }

        // 4. Patient Interface for other statuses
        if (isPatient) {
          if (st === 'expired') {
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Expired</span>
                <button
                  onClick={() => handleRequestFollowup(row)}
                  style={{
                    padding: '3px 8px', borderRadius: '6px',
                    background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                    border: '1px solid var(--ecare-primary-border)',
                    fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '3px'
                  }}
                >
                  <Activity size={10} weight="bold" /> Rebook
                </button>
              </div>
            );
          }

          if (st.includes('refund')) {
            return (
              <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>
                💸 Refund Pending
              </span>
            );
          }

          if (st === 'cancelled') {
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>Cancelled</span>
                <button
                  onClick={() => handleRequestFollowup(row)}
                  style={{
                    padding: '3px 8px', borderRadius: '6px',
                    background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                    border: '1px solid var(--ecare-primary-border)',
                    fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Rebook
                </button>
              </div>
            );
          }

          if (row.missedBy === 'doctor') {
            if (row.refundStatus === 'credit_used') {
              return <span style={{ fontSize: '0.75rem', color: 'var(--ecare-primary)', fontWeight: 700 }}>🔄 Credit Used</span>;
            }
            if (row.refundStatus === 'pending_7_days') {
              return <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>💸 Refund Pending (7 Days)</span>;
            }
            return (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleRebookFree(row)}
                  style={{
                    padding: '5px 10px', borderRadius: '8px',
                    background: '#eff6ff', color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  🔄 Free Rebook
                </button>
                <button
                  onClick={() => requestMissedDoctorRefund(row)}
                  style={{
                    padding: '5px 10px', borderRadius: '8px',
                    background: '#f1f5f9', color: '#475569',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  💸 Request Refund
                </button>
              </div>
            );
          }

          if (row.missedBy === 'patient') {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>⚠️ Missed (No-Show)</span>
                <button
                  onClick={() => handleRequestFollowup(row)}
                  style={{
                    padding: '5px 10px', borderRadius: '8px',
                    background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                    border: '1px solid var(--ecare-primary-border)',
                    fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🔄 Rebook Session
                </button>
              </div>
            );
          }

          const ended = isTimeslotEnded(row.date, row.time);
          if (!ended) {
            return (
              <span style={{ fontSize: '0.75rem', color: 'var(--ecare-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--ecare-primary)' }}></span>
                Scheduled
              </span>
            );
          }

          return (
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
              ⏳ Overdue
            </span>
          );
        }

        return null;
      }
    }
  ]

  const handleDelete = (id) => {
    openConfirm({
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment? This action will notify both patient and doctor.',
      confirmText: 'Cancel Appointment',
      onConfirm: () => deleteAppointment(id)
    })
  }

  const handleBulkDelete = (selectedIds) => bulkDelete('appointments', selectedIds)

  const getNextAvailableDate = (originalDate) => {
    const today = new Date().toISOString().split('T')[0]
    if (originalDate && originalDate >= today) {
      const d = new Date(originalDate)
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0]
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    }
  }

  const handleRequestFollowup = (appt) => {
    const targetDate = isTimeslotEnded(appt.date, appt.time) ? getNextAvailableDate(appt.date) : appt.date;
    setEditingAppointment({
      ...appt,
      id: null, // Ensure it's a new booking
      status: 'Pending',
      paymentStatus: 'Pending',
      date: targetDate,
      time: '',
      notes: `Rebooking missed session on ${appt.date}`
    })
    setActivePage('add-appointment')
  }

  const handleRebookFree = (appt) => {
    const targetDate = isTimeslotEnded(appt.date, appt.time) ? getNextAvailableDate(appt.date) : appt.date;
    setEditingAppointment({
      ...appt,
      id: null, // Force a new appointment to be created
      rebookCreditFrom: appt.id, // Track that we are using this credit
      paymentStatus: 'Paid', // Pre-fill as Paid
      status: 'Pending',
      date: targetDate,
      time: '',
      notes: `Rebooking credit from missed appointment #${appt.id}`
    })
    setActivePage('add-appointment')
  }


  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {isPatient && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            flexShrink: 0
          }}>
            <CalendarCheck size={24} weight="duotone" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px' }}>Need to change, reschedule, or cancel a booking?</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.4 }}>
              For patient safety and schedule synchronization, booked appointments and services cannot be modified directly online. Please contact {window.ecareConfig?.siteName || 'E-CARE'} clinic administration at <strong>{window.ecareConfig?.sitePhone || '+1 (800) 555-0199'}</strong> or email <strong>{window.ecareConfig?.siteEmail || 'support@e-care.com'}</strong> for assistance.
            </p>
          </div>
        </div>
      )}

      <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
        <StatCard title={isDoctor ? "My Bookings" : "Total Bookings"} value={safeAppointments.length} icon={CalendarCheck} color="var(--ecare-primary)" delay={0.1} />
        <StatCard title="Today's Visits" value={todayVisitCount} icon={ClockAfternoon} color="#0891b2" delay={0.2} />
        <StatCard title="Live / Confirmed" value={liveBookingCount} icon={CheckCircle} color="var(--ecare-primary)" delay={0.3} />
        <StatCard title="Expired" value={safeAppointments.filter(a => a.status === 'Expired').length} icon={Clock} color="#ef4444" delay={0.4} />
      </div>

      <DataTable 
        data={safeAppointments}
        columns={isDoctor ? columns.filter(c => c.key !== 'followup') : columns}
        searchPlaceholder="Search appointments..."
        hideAdd={isDoctor}
        addLabel="New Appointment"
        onAdd={isDoctor ? null : () => { setEditingAppointment(null); setActivePage('add-appointment'); }}
        onEdit={isDoctor || isPatient ? null : (row) => { setEditingAppointment(row); setActivePage('add-appointment'); }}
        onDelete={isDoctor || isPatient ? null : handleDelete}
        onBulkDelete={isDoctor || isPatient ? null : handleBulkDelete}
      />

      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewAppointment(null);
        }}
        appointment={reviewAppointment}
      />
    </motion.div>
  )
}

export default Appointments
