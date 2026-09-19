import React, { useMemo } from 'react'
import DataTable from '../../components/DataTable'
import useStore from '../../store/useStore'

const BloodRequests = () => {
  const { bloodRequests, addBloodRequest, updateBloodRequest, deleteBloodRequest } = useStore()

  const data = useMemo(() => {
    return (bloodRequests || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [bloodRequests])

  const columns = [
    { key: 'requester_name', label: 'Requester / Patient', sortable: true },
    { key: 'blood_group', label: 'Blood Group Needed', sortable: true, render: (val) => <strong style={{ color: '#ef4444' }}>{val}</strong> },
    { key: 'units_required', label: 'Units Needed' },
    { 
      key: 'urgency', 
      label: 'Urgency',
      render: (val) => {
        let color = '#4b5563'
        if (val === 'High' || val === 'Emergency') color = '#dc2626'
        if (val === 'Medium') color = '#ca8a04'
        return <strong style={{ color }}>{val || 'Normal'}</strong>
      }
    },
    { key: 'request_date', label: 'Request Date', type: 'date' },
    { 
      key: 'status', 
      label: 'Status',
      render: (val) => {
        let bg = '#f3f4f6', color = '#4b5563'
        if (val === 'Pending') { bg = '#fef9c3'; color = '#ca8a04' }
        if (val === 'Fulfilled') { bg = '#dcfce7'; color = '#16a34a' }
        if (val === 'Rejected') { bg = '#fee2e2'; color = '#dc2626' }
        return (
          <span style={{ background: bg, color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            {val || 'Pending'}
          </span>
        )
      }
    }
  ]

  const handleAdd = (formData) => {
    addBloodRequest({
      requester_name: formData.requester_name,
      blood_group: formData.blood_group,
      units_required: formData.units_required,
      urgency: formData.urgency || 'Normal',
      request_date: formData.request_date || new Date().toISOString().split('T')[0],
      status: formData.status || 'Pending',
      notes: formData.notes || ''
    })
  }

  const handleEdit = (id, formData) => {
    updateBloodRequest(id, formData)
  }

  return (
    <div className="ecare-page-slide">
      <DataTable
        title="Blood Requests"
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={deleteBloodRequest}
        addLabel="New Request"
        searchPlaceholder="Search requests..."
      />
    </div>
  )
}

export default BloodRequests
