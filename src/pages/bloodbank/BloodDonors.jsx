import React, { useMemo } from 'react'
import DataTable from '../../components/DataTable'
import useStore from '../../store/useStore'

const BloodDonors = () => {
  const { bloodDonors, addBloodDonor, updateBloodDonor, deleteBloodDonor } = useStore()

  const data = useMemo(() => {
    return (bloodDonors || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [bloodDonors])

  const columns = [
    { key: 'name', label: 'Donor Name', sortable: true },
    { key: 'blood_group', label: 'Blood Group', sortable: true, render: (val) => <strong style={{ color: '#ef4444' }}>{val}</strong> },
    { key: 'contact_number', label: 'Contact Number' },
    { key: 'last_donation_date', label: 'Last Donation', type: 'date' },
    { key: 'health_status', label: 'Health Status' },
    { 
      key: 'status', 
      label: 'Eligibility',
      render: (val) => {
        let bg = '#f3f4f6', color = '#4b5563'
        if (val === 'Eligible') { bg = '#dcfce7'; color = '#16a34a' }
        if (val === 'Deferred') { bg = '#fef9c3'; color = '#ca8a04' }
        if (val === 'Ineligible') { bg = '#fee2e2'; color = '#dc2626' }
        return (
          <span style={{ background: bg, color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            {val || 'Unknown'}
          </span>
        )
      }
    }
  ]

  const handleAdd = (formData) => {
    addBloodDonor({
      name: formData.name,
      blood_group: formData.blood_group,
      contact_number: formData.contact_number,
      last_donation_date: formData.last_donation_date,
      health_status: formData.health_status,
      status: formData.status || 'Eligible'
    })
  }

  const handleEdit = (id, formData) => {
    updateBloodDonor(id, formData)
  }

  return (
    <div className="ecare-page-slide">
      <DataTable
        title="Blood Donors Directory"
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={deleteBloodDonor}
        addLabel="Register Donor"
        searchPlaceholder="Search donors by name or group..."
      />
    </div>
  )
}

export default BloodDonors
