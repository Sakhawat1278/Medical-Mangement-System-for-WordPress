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

  const filteredReviews = useMemo(() => {
    let arr = Array.isArray(reviews) ? reviews : []
    if (isDoctor) {
      arr = arr.filter(r => String(r.doctor_id) === String(user.id))
    }
    return arr.sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
  }, [reviews, isDoctor, user?.id])

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
      title: 'Delete Review',
      message: 'Are you sure you want to permanently delete this review?',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteReview(id)
          toast.success('Review deleted')
        } catch (err) {
          toast.error('Failed to delete review')
        }
      }
    })
  }

  const columns = [
    { 
      key: 'date', 
      label: 'Date', 
      render: (row) => new Date(row.created_at || row.updated_at).toLocaleDateString()
    },
    { 
      key: 'patient', 
      label: 'Patient', 
      render: (row) => row.patient_name || 'Anonymous'
    },
    ...(!isDoctor ? [{ 
      key: 'doctor', 
      label: 'Doctor', 
      render: (row) => `Dr. ${row.doctor_name || 'Unknown'}`
    }] : []),
    {
      key: 'rating',
      label: 'Rating',
      render: (row) => (
        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} size={14} weight={star <= row.rating ? 'fill' : 'regular'} />
          ))}
        </div>
      )
    },
    {
      key: 'review',
      label: 'Review',
      render: (row) => (
        <div style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
          {row.review_text}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const colors = {
          Pending: '#d97706',
          Approved: 'var(--ecare-primary)',
          Rejected: '#dc2626'
        }
        return (
          <span style={{ 
            fontSize: '0.75rem', fontWeight: 700, 
            color: colors[row.status] || '#64748b',
            background: `${colors[row.status] || '#64748b'}15`,
            padding: '4px 8px', borderRadius: '12px'
          }}>
            {row.status || 'Pending'}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          {isAdmin && row.status === 'Pending' && (
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
          {isAdmin && (
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
          )}
        </div>
      )
    }
  ]

  const averageRating = useMemo(() => {
    if (filteredReviews.length === 0) return 0
    const sum = filteredReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return (sum / filteredReviews.length).toFixed(1)
  }, [filteredReviews])

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
            Approve or reject patient reviews before they appear publicly.
          </p>
        </div>
      )}

      <DataTable 
        data={filteredReviews}
        columns={columns}
        searchPlaceholder="Search reviews..."
        hideAdd={true}
      />
    </motion.div>
  )
}

export default Reviews
