import React, { useMemo } from 'react'
import DataTable from '../../components/DataTable'
import useStore from '../../store/useStore'

const BloodInventory = () => {
  const { bloodInventory, addBloodBag, updateBloodBag, deleteBloodBag } = useStore()

  const data = useMemo(() => {
    return (bloodInventory || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [bloodInventory])

  const columns = [
    { key: 'bag_number', label: 'Bag Number', sortable: true },
    { key: 'blood_group', label: 'Blood Group', sortable: true, render: (val) => <strong style={{ color: '#ef4444' }}>{val}</strong> },
    { key: 'component', label: 'Component' },
    { key: 'volume', label: 'Volume (ml)' },
    { key: 'collection_date', label: 'Collection Date', type: 'date' },
    { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
    { 
      key: 'status', 
      label: 'Status',
      render: (val) => {
        let bg = '#f3f4f6', color = '#4b5563'
        if (val === 'Available') { bg = '#dcfce7'; color = '#16a34a' }
        if (val === 'Reserved') { bg = '#fef9c3'; color = '#ca8a04' }
        if (val === 'Dispensed') { bg = '#dbeafe'; color = '#2563eb' }
        if (val === 'Discarded') { bg = '#fee2e2'; color = '#dc2626' }
        return (
          <span style={{ background: bg, color, padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            {val}
          </span>
        )
      }
    }
  ]

  const handleAdd = (formData) => {
    addBloodBag({
      bag_number: formData.bag_number,
      blood_group: formData.blood_group,
      component: formData.component,
      volume: formData.volume,
      collection_date: formData.collection_date,
      expiry_date: formData.expiry_date,
      status: formData.status || 'Available'
    })
  }

  const handleEdit = (id, formData) => {
    updateBloodBag(id, formData)
  }

  return (
    <div className="ecare-page-slide">
      <DataTable
        title="Blood Inventory"
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={deleteBloodBag}
        addLabel="Add Blood Bag"
        searchPlaceholder="Search bags by number or group..."
      />
    </div>
  )
}

export default BloodInventory
