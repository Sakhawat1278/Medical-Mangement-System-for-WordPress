import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star, CheckCircle, XCircle, Trash } from 'phosphor-react'
import useStore from '../store/useStore'
import DataTable from '../components/DataTable'
import toast from 'react-hot-toast'

const Reviews = () => {
  const { user, reviews, updateReview, deleteReview, openConfirm } = useStore()
  
  const isDoctor = user?.ecareRole === 'doctor'
  const isAdmin = user?.ecareRole === 'admin' || user?.role === 'administrator'
  const isPatient = user?.ecareRole === 'patient'

  const filteredReviews = useMemo(() => {
    let arr = Array.isArray(reviews) ? reviews : []
    if (isDoctor) {
      arr = arr.filter(r => String(r.doctor_id) === String(user?.id))
    } else if (isPatient) {
      const uid = String(user?.id || '')
      const uname = String(user?.name || '').toLowerCase()
      arr = arr.filter(r => 
        (r.patient_id && String(r.patient_id) === uid) ||
        (r.patient_user_id && String(r.patient_user_id) === uid) ||
        (r.user_id && String(r.user_id) === uid) ||
        (r.patient_name && String(r.patient_name).toLowerCase() === uname)
      )
    }
    return [...arr].sort((a, b) => new Date(b?.created_at || b?.updated_at || 0) - new Date(a?.created_at || a?.updated_at || 0))
  }, [reviews, isDoctor, isPatient, user])

  const handleStatusChange = async (id, status) => {
    try {
      await updateReview(id, { status })
      toast.success(`Review marked as ${status}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  const handleDelete = (id) => {
    openConfirm({
      title: isPatient ? 'Remove Review' : 'Delete Review',
      message: isPatient 
        ? 'Are you sure you want to remove your submitted review?' 
        : 'Are you sure you want to permanently delete this review?',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteReview(id)
          toast.success(isPatient ? 'Review removed' : 'Review deleted')
        } catch (err) {
          toast.error('Failed to delete review')
        }
      }
    })
  }

  const columns = [
    { 
      key: 'created_at', 
      label: 'Date', 
      sortable: true,
      render: (val, row) => {
        const d = val || row?.created_at || row?.updated_at
        return d ? new Date(d).toLocaleDateString() : '—'
      }
    },
    ...(!isPatient ? [{ 
      key: 'patient_name', 
      label: 'Patient', 
      sortable: true,
      render: (val, row) => val || row?.patient_name || 'Anonymous'
    }] : []),
    ...(!isDoctor ? [{ 
      key: 'doctor_name', 
      label: 'Doctor', 
      sortable: true,
      render: (val, row) => {
        const name = val || row?.doctor_name
        return name ? (name.startsWith('Dr.') ? name : `Dr. ${name}`) : 'Doctor'
      }
    }] : []),
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (val, row) => {
        const rating = Number(val ?? row?.rating) || 5
        return (
          <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} size={14} weight={star <= rating ? 'fill' : 'regular'} />
            ))}
          </div>
        )
      }
    },
    {
      key: 'review_text',
      label: 'Review',
      render: (val, row) => (
        <div style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
          {val || row?.review_text || row?.notes || '—'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val, row) => {
        const status = val || row?.status || 'Pending'
        const colors = {
          Pending: '#d97706',
          Approved: 'var(--ecare-primary)',
          Rejected: '#dc2626'
        }
        return (
          <span style={{ 
            fontSize: '0.75rem', fontWeight: 700, 
            color: colors[status] || '#64748b',
            background: `${colors[status] || '#64748b'}15`,
            padding: '4px 8px', borderRadius: '12px'
          }}>
            {status}
          </span>
        )
      }
    },
    ...(isAdmin ? [{
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        if (!row) return null
        return (
          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            {row.status === 'Pending' && (
              <>
                <button
                  onClick={() => handleStatusChange(row.id, 'Approved')}
                  style={{
                    padding: '4px', borderRadius: '6px',
                    background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                    border: '1px solid var(--ecare-primary-border)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  title="Approve"
                >
                  <CheckCircle size={16} weight="bold" />
                </button>
                <button
                  onClick={() => handleStatusChange(row.id, 'Rejected')}
                  style={{
                    padding: '4px', borderRadius: '6px',
                    background: '#fef2f2', color: '#dc2626',
                    border: '1px solid #fecaca',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  title="Reject"
                >
                  <XCircle size={16} weight="bold" />
                </button>
              </>
            )}
            <button
              onClick={() => handleDelete(row.id)}
              style={{
                padding: '4px', borderRadius: '6px',
                background: '#f1f5f9', color: '#64748b',
                border: '1px solid #e2e8f0',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              title="Delete"
            >
              <Trash size={16} weight="bold" />
            </button>
          </div>
        )
      }
    }] : (isPatient ? [{
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        if (!row) return null
        return (
          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleDelete(row.id)}
              style={{
                padding: '4px', borderRadius: '6px',
                background: '#fef2f2', color: '#dc2626',
                border: '1px solid #fecaca',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              title="Remove My Review"
            >
              <Trash size={16} weight="bold" />
            </button>
          </div>
        )
      }
    }] : []))
  ]

  const averageRating = useMemo(() => {
    if (filteredReviews.length === 0) return 0
    const sum = filteredReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return (sum / filteredReviews.length).toFixed(1)
  }, [filteredReviews])

  const filterOptions = [
    { label: 'Pending Reviews', value: 'Pending' },
    { label: 'Approved Reviews', value: 'Approved' },
    { label: 'Rejected Reviews', value: 'Rejected' }
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      
      {isDoctor && (
        <div className="ecare-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {averageRating} <Star size={28} weight="fill" color="#f59e0b" />
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>Average Rating ({filteredReviews.length} Reviews)</p>
          </div>
          <div style={{ flex: 1 }}>
             <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
               Reviews submitted by patients are displayed here. Pending reviews are currently being moderated by clinic administration and will be visible publicly once approved.
             </p>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="ecare-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Reviews Moderation</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            Approve or reject patient reviews before they appear publicly across doctor profiles and clinics.
          </p>
        </div>
      )}

      {isPatient && (
        <div className="ecare-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>My Doctor Reviews & Feedback</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            Track ratings and feedback you have submitted for your clinical appointments.
          </p>
        </div>
      )}

      <DataTable 
        title={isPatient ? "My Submitted Reviews" : (isDoctor ? "Patient Reviews & Ratings" : "Reviews Directory & Moderation")}
        data={filteredReviews}
        columns={columns}
        filterOptions={filterOptions}
        searchPlaceholder="Search reviews by doctor, patient, notes..."
        hideAdd={true}
      />
    </motion.div>
  )
}

export default Reviews
