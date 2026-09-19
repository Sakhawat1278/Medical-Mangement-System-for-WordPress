import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, UserPlus, Phone, EnvelopeSimple, Buildings, 
  Trash, PencilSimple, X, CheckCircle, WarningCircle, UserCircle,
  Truck, Package, Bank, Gear, Clock, Warning, Flask,
  CalendarBlank, Check, XCircle, Timer, Article, ArrowLeft
} from 'phosphor-react'
import DataTable from '../components/DataTable'
import CustomSelect from '../components/CustomSelect'
import CustomDatePicker from '../components/CustomDatePicker'
import CustomTimePicker from '../components/CustomTimePicker'
import useStore from '../store/useStore'
import { Portal } from '../utils/portal'
import useDuplicateCheck from '../hooks/useDuplicateCheck'
import toast from 'react-hot-toast'

const STAFF_ABILITY_GROUPS = [
  {
    title: 'Doctors & Specialists',
    icon: UserPlus,
    items: [
      { id: 'doctors_view', label: 'View Doctor Registry' },
      { id: 'doctors_add', label: 'Register New Doctor' },
      { id: 'doctors_edit', label: 'Edit Doctor Details' },
      { id: 'doctors_delete', label: 'Remove Doctors' },
      { id: 'doctors_approve', label: 'Approve Pending Doctors' }
    ]
  },
  {
    title: 'Ambulance Service',
    icon: Truck,
    items: [
      { id: 'ambulance_view', label: 'View Booking Requests' },
      { id: 'ambulance_dispatch', label: 'Create/Manage Dispatch' },
      { id: 'ambulance_fleet', label: 'Manage Fleet Inventory' },
      { id: 'ambulance_approve', label: 'Approve Driver Applications' }
    ]
  },
  {
    title: 'Care Providers',
    icon: Package,
    items: [
      { id: 'care_view', label: 'View Provider List' },
      { id: 'care_bookings', label: 'Manage Care Bookings' },
      { id: 'care_register', label: 'Register New Provider' },
      { id: 'care_approve', label: 'Approve Provider Apps' }
    ]
  },
  {
    title: 'Patient Management',
    icon: UserCircle,
    items: [
      { id: 'patients_view', label: 'View Patient Records' },
      { id: 'patients_add', label: 'Add New Patient' },
      { id: 'patients_edit', label: 'Update Records' },
      { id: 'patients_delete', label: 'Delete Records' }
    ]
  },
  {
    title: 'Appointments',
    icon: Clock,
    items: [
      { id: 'appointments_view', label: 'View Schedule' },
      { id: 'appointments_add', label: 'Book Appointment' },
      { id: 'appointments_manage', label: 'Reschedule/Cancel' }
    ]
  },
  {
    title: 'Finance & System',
    icon: Gear,
    items: [
      { id: 'billing_view', label: 'View Billing Data' },
      { id: 'billing_manage', label: 'Process Payments' },
      { id: 'staff_manage', label: 'Manage Staff Accounts' },
      { id: 'settings_manage', label: 'Change System Settings' }
    ]
  },
  {
    title: 'Lab & Diagnostics',
    icon: Flask,
    items: [
      { id: 'lab_view', label: 'View Lab Orders' },
      { id: 'lab_add', label: 'Create Lab Orders' },
      { id: 'lab_manage', label: 'Process Lab Results' },
      { id: 'lab_requests', label: 'Manage Test Requests' },
      { id: 'lab_catalog', label: 'Manage Lab Catalog' },
      { id: 'lab_locations', label: 'Manage Lab Facilities' }
    ]
  }
]

const ROLE_PRESETS = {
  'Receptionist': ['patients_view', 'patients_add', 'appointments_view', 'appointments_add', 'appointments_manage', 'lab_view'],
  'Nurse': ['patients_view', 'appointments_view', 'care_view', 'care_bookings'],
  'Billing Specialist': ['billing_view', 'billing_manage'],
  'Ambulance Coordinator': ['ambulance_view', 'ambulance_dispatch'],
  'Medical Admin': ['patients_view', 'patients_add', 'patients_edit', 'appointments_view', 'appointments_add', 'doctors_view', 'doctors_add', 'staff_manage'],
  'System Admin': STAFF_ABILITY_GROUPS.flatMap(g => g.items.map(i => i.id))
}

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="ecare-card"
    style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
  >
    <div style={{ 
      width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: color 
    }}>
      <Icon size={24} weight="duotone" />
    </div>
    <div>
      <div style={{ color: 'var(--ecare-text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{title}</div>
      <div style={{ color: 'var(--ecare-text-main)', fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
    </div>
  </motion.div>
)

const PermissionGroup = ({ group, permissions, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false)
  const activeCount = group.items.filter(i => permissions.includes(i.id)).length
  
  return (
    <div style={{ 
      border: '1px solid #e2e8f0', 
      borderRadius: '12px', 
      background: 'white', 
      overflow: 'hidden',
      marginBottom: '0.5rem'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '0.75rem 1rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          cursor: 'pointer',
          background: isOpen ? '#f8fafc' : 'white',
          transition: 'background 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '28px', height: '28px', borderRadius: '6px', 
            background: 'var(--ecare-primary-bg)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-primary)' 
          }}>
            <group.icon size={16} weight="duotone" />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ecare-text-main)' }}>{group.title}</span>
            {activeCount > 0 && (
              <span style={{ marginLeft: '8px', fontSize: '0.65rem', color: '#16a34a', fontWeight: 800 }}>
                {activeCount}/{group.items.length} Active
              </span>
            )}
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <Gear size={14} color="#64748b" weight={isOpen ? "fill" : "regular"} />
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div style={{ padding: '0.75rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
              {group.items.map(item => {
                const isActive = permissions.includes(item.id)
                return (
                  <div 
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(item.id)
                    }}
                    style={{ 
                      padding: '0.4rem 0.8rem', borderRadius: '8px', 
                      border: `1.5px solid ${isActive ? '#bcf0da' : '#f1f5f9'}`,
                      background: isActive ? 'var(--ecare-primary-bg)' : '#f8fafc',
                      color: isActive ? '#16a34a' : '#64748b',
                      fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    {isActive ? <CheckCircle size={12} weight="fill" /> : <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid #cbd5e1' }} />}
                    {item.label}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DuplicateAlert = ({ message }) => (
  <motion.div 
    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
    style={{ 
      display: 'flex', alignItems: 'center', gap: '8px', 
      padding: '8px 12px', borderRadius: '10px', background: '#fef2f2', 
      border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.7rem', 
      fontWeight: 600, marginBottom: '8px'
    }}
  >
    <Warning size={14} weight="fill" />
    {message}
  </motion.div>
)

const StaffManagement = ({ view = 'directory' }) => {
  const { 
    user, staff, addStaff, updateStaff, deleteStaff, bulkDelete, openConfirm,
    staffAttendance, addStaffAttendance, updateStaffAttendance, deleteStaffAttendance
  } = useStore()
  
  const isAdmin = user?.ecareRole === 'admin'
  
  const [activeTab, setActiveTab] = useState(view) // 'directory' or 'attendance'
  const [prevView, setPrevView] = useState(view)
  if (view !== prevView) {
    setPrevView(view)
    setActiveTab(view)
  }
  const [attendanceSubView, setAttendanceSubView] = useState('logger') // 'logger' or 'history'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [viewingHistoryStaff, setViewingHistoryStaff] = useState(null)
  const [editingAttendanceRecordId, setEditingAttendanceRecordId] = useState(null)
  const [attendanceEditForm, setAttendanceEditForm] = useState({ status: '', check_in: '', check_out: '', notes: '' })
  const [historyYearMonth, setHistoryYearMonth] = useState(() => selectedDate.substring(0, 7))
  
  const handleSaveMonthlyLog = async (recordId) => {
    try {
      let updated = false
      if (String(recordId).startsWith('new-')) {
        const dateString = String(recordId).substring(4)
        const res = await addStaffAttendance({
          staff_id: viewingHistoryStaff.id,
          date: dateString,
          status: attendanceEditForm.status,
          check_in: attendanceEditForm.check_in,
          check_out: attendanceEditForm.check_out,
          notes: attendanceEditForm.notes,
          shift_start: '09:00 AM',
          shift_end: '05:00 PM'
        })
        updated = !!res
      } else {
        const existingRecord = (staffAttendance || []).find(r => r.id === recordId)
        if (!existingRecord) return
        
        const res = await updateStaffAttendance(recordId, {
          ...existingRecord,
          status: attendanceEditForm.status,
          check_in: attendanceEditForm.check_in,
          check_out: attendanceEditForm.check_out,
          notes: attendanceEditForm.notes
        })
        updated = !!res
      }
      
      if (updated) {
        toast.success('Attendance record saved successfully')
        setEditingAttendanceRecordId(null)
      } else {
        toast.error('Failed to save attendance record')
      }
    } catch (e) {
      console.error(e)
      toast.error('An error occurred while saving the attendance log')
    }
  }
  
  const initialForm = { name: '', email: '', phone: '', role: '', department: '', status: 'Active', permissions: [], password: '', avatar: '' }
  const [form, setForm] = useState(initialForm)
  const [dailyAttendance, setDailyAttendance] = useState({})
  const [prevAttendanceKey, setPrevAttendanceKey] = useState('')

  const { name: nameExists, email: emailExists } = useDuplicateCheck(form.name, form.email, 'staff', editingStaff?.id)

  const safeStaff = Array.isArray(staff) ? staff : []
  const activeStaff = safeStaff.filter(s => s.status === 'Active')
  const onLeave = safeStaff.filter(s => s.status === 'On Leave').length

  // Synchronize daily attendance at render-time instead of using useEffect
  const currentAttendanceKey = `${selectedDate}_${(staffAttendance || []).length}_${safeStaff.length}`
  if (currentAttendanceKey !== prevAttendanceKey) {
    setPrevAttendanceKey(currentAttendanceKey)
    const nextAttendance = {}
    
    safeStaff.forEach(member => {
      const existing = (staffAttendance || []).find(
        record => String(record.staff_id) === String(member.id) && record.date === selectedDate
      )
      
      if (existing) {
        const status = existing.check_in ? existing.status : (existing.status === 'On Leave' ? 'On Leave' : 'Absent')
        nextAttendance[member.id] = {
          id: existing.id,
          status: status,
          check_in: existing.check_in || '',
          check_out: existing.check_out || '',
          shift_start: existing.shift_start || '09:00 AM',
          shift_end: existing.shift_end || '05:00 PM',
          notes: existing.notes || ''
        }
      } else {
        nextAttendance[member.id] = {
          status: member.status === 'On Leave' ? 'On Leave' : 'Absent',
          check_in: '',
          check_out: '',
          shift_start: '09:00 AM',
          shift_end: '05:00 PM',
          notes: ''
        }
      }
    })
    setDailyAttendance(nextAttendance)
  }

  const handleSaveAttendance = async () => {
    try {
      const promises = Object.entries(dailyAttendance).map(async ([staffId, record]) => {
        const payload = {
          staff_id: parseInt(staffId),
          date: selectedDate,
          status: record.status,
          check_in: record.check_in || '',
          check_out: record.check_out || '',
          shift_start: record.shift_start || '09:00 AM',
          shift_end: record.shift_end || '05:00 PM',
          notes: record.notes
        }
        
        if (record.id) {
          return updateStaffAttendance(record.id, payload)
        } else {
          return addStaffAttendance(payload)
        }
      })
      
      await Promise.all(promises)
      toast.success(`Daily attendance logs successfully saved for ${selectedDate}`, {
        icon: <CheckCircle size={18} color="var(--ecare-primary)" />
      })
    } catch (e) {
      console.error(e)
      toast.error('Failed to save daily attendance logs')
    }
  }

  const updateMemberAttendanceField = (memberId, field, value) => {
    setDailyAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }))
  }

  const dailyStats = React.useMemo(() => {
    const records = Object.values(dailyAttendance)
    return {
      total: records.length,
      present: records.filter(r => r.status === 'Present').length,
      late: records.filter(r => r.status === 'Late').length,
      absent: records.filter(r => r.status === 'Absent').length,
      leave: records.filter(r => r.status === 'On Leave').length
    }
  }, [dailyAttendance])

  // Monthly summary stats
  const monthlySummaryData = React.useMemo(() => {
    const currentMonthPrefix = selectedDate.substring(0, 7) // 'YYYY-MM'
    
    return safeStaff.map(member => {
      const memberLogs = (staffAttendance || []).filter(
        record => String(record.staff_id) === String(member.id) && record.date.startsWith(currentMonthPrefix)
      )
      
      const present = memberLogs.filter(l => l.status === 'Present').length
      const late = memberLogs.filter(l => l.status === 'Late').length
      const absent = memberLogs.filter(l => l.status === 'Absent').length
      const leave = memberLogs.filter(l => l.status === 'On Leave').length
      const total = memberLogs.length
      
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
      
      return {
        member,
        present,
        late,
        absent,
        leave,
        total,
        rate
      }
    })
  }, [selectedDate, staffAttendance, safeStaff])

  const openModal = (staffMember = null) => {
    if (staffMember) {
      const rawPerms = staffMember.permissions || staffMember.Permissions || [];
      let parsedPerms = [];
      
      if (Array.isArray(rawPerms)) {
        parsedPerms = rawPerms;
      } else if (typeof rawPerms === 'string' && rawPerms.trim() !== '') {
        try {
          parsedPerms = JSON.parse(rawPerms);
        } catch (e) {
          parsedPerms = [];
        }
      }

      const cleanPerms = (Array.isArray(parsedPerms) ? parsedPerms : [])
        .map(p => String(p).trim())
        .filter(p => p !== '');

      const nextForm = { 
        ...staffMember,
        department: staffMember.department || staffMember.Department || '',
        permissions: cleanPerms,
        password: '',
        avatar: staffMember.avatar || staffMember.Avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staffMember.name.replace(/\s+/g, '')}`
      };

      setForm(nextForm);
      setEditingStaff(staffMember);
    } else {
      setEditingStaff(null);
      setForm(initialForm);
    }
    setIsModalOpen(true);
  }

  const handleAvatarUpload = () => {
    if (window.wp && window.wp.media) {
      const frame = window.wp.media({
        title: 'Select Staff Photo',
        button: { text: 'Use this photo' },
        multiple: false
      });
      frame.on('select', () => {
        const attachment = frame.state().get('selection').first().toJSON();
        setForm(prev => ({ ...prev, avatar: attachment.url }));
      });
      frame.open();
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            const { uploadFile } = useStore.getState();
            const result = await uploadFile(file, 'public');
            if (result?.url) {
              setForm(prev => ({ ...prev, avatar: result.url }));
              toast.success('Avatar uploaded successfully');
            }
          } catch (err) {
            toast.error('Failed to upload avatar');
          }
        }
      };
      input.click();
    }
  };

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let retVal = ""
    for (let i = 0, n = charset.length; i < 10; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n))
    }
    setForm(prev => ({ ...prev, password: retVal }))
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingStaff(null)
    setForm(initialForm)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.role) return
    
    const staffData = { ...form }
    staffData.permissions = JSON.stringify(form.permissions)
    
    if (editingStaff && !form.password) {
      delete staffData.password
    }

    if (editingStaff) {
      updateStaff(editingStaff.id, staffData)
    } else {
      addStaff({
        ...staffData,
        joinDate: new Date().toISOString().split('T')[0]
      })
    }
    closeModal()
  }

  const togglePermission = (id) => {
    setForm(prev => {
      const currentPerms = Array.isArray(prev.permissions) ? prev.permissions : [];
      return {
        ...prev,
        permissions: currentPerms.includes(id) 
          ? currentPerms.filter(p => p !== id) 
          : [...currentPerms, id]
      };
    });
  }

  const applyPreset = (role) => {
    setForm(prev => ({
      ...prev,
      role: role,
      permissions: Array.isArray(ROLE_PRESETS[role]) ? [...ROLE_PRESETS[role]] : []
    }))
  }

  const handleDelete = (id) => {
    openConfirm({
      title: 'Remove Staff',
      message: 'Are you sure you want to remove this staff member? This action cannot be undone.',
      confirmText: 'Remove Staff',
      onConfirm: () => deleteStaff(id)
    })
  }

  const handleBulkDelete = (selectedIds) => bulkDelete('staff', selectedIds)

  const handleStatusChange = (id, newStatus) => {
    updateStaff(id, { status: newStatus })
  }

  const columns = [
    {
      key: 'name',
      label: 'Staff Member',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={row.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9' }} alt="" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ecare-text-main)' }}>{val}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ecare-text-muted)' }}>{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role & Dept',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1e293b' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Buildings size={12} /> {row.department}
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#475569' }}>
          <Phone size={14} /> {val}
        </div>
      )
    },
    {
      key: 'joinDate',
      label: 'Joined',
      render: (val) => <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{val}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <div style={{ width: '120px' }}>
          <CustomSelect 
            value={val || 'Active'} 
            onChange={(s) => handleStatusChange(row.id, s)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'On Leave', label: 'On Leave' },
              { value: 'Offline', label: 'Offline' }
            ]}
            customTriggerStyle={{ 
              background: val === 'Active' ? 'var(--ecare-primary-bg)' : '#fef2f2',
              color: val === 'Active' ? 'var(--ecare-primary)' : '#ef4444',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              minWidth: 'unset',
              boxShadow: 'none'
            }}
          />
        </div>
      )
    },
    {
      key: 'issuedBy',
      label: 'Issued By',
      render: (val) => <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-primary)' }}>{val || 'System'}</span>
    }
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      <AnimatePresence mode="wait">
        
        {/* DIRECTORY VIEW */}
        {activeTab === 'directory' && (
          <motion.div 
            key="directory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}
          >
            <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 4, '--stat-grid-cols-md': 2 }}>
              <StatCard title="Total Staff" value={safeStaff.length} icon={Users} color="var(--ecare-primary)" delay={0.1} />
              <StatCard title="Active On Duty" value={activeStaff.length} icon={CheckCircle} color="var(--ecare-primary)" delay={0.2} />
              <StatCard title="On Leave" value={onLeave} icon={WarningCircle} color="#f59e0b" delay={0.3} />
              <StatCard 
                title="New Recruits" 
                value={safeStaff.filter(s => {
                  const joinDate = new Date(s.joinDate)
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return joinDate > thirtyDaysAgo
                }).length} 
                icon={UserPlus} 
                color="#0891b2" 
                delay={0.4} 
              />
            </div>

            <DataTable 
              data={safeStaff}
              columns={columns}
              searchPlaceholder="Search staff by name, email or role..."
              title="Staff Directory"
              addLabel="Add Staff"
              onAdd={() => openModal()}
              onEdit={(row) => openModal(row)}
              onDelete={(id) => handleDelete(id)}
              onBulkDelete={handleBulkDelete}
              filterOptions={[
                { value: 'Active', label: 'Active' },
                { value: 'On Leave', label: 'On Leave' },
                { value: 'Offline', label: 'Offline' }
              ]}
            />
          </motion.div>
        )}

        {/* ATTENDANCE MANAGER VIEW */}
        {activeTab === 'attendance' && (
          <motion.div 
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ecare-space-section, 1rem)' }}
          >
            {/* Inner Sub-navigation & Datepicker Controls */}
            <div className="ecare-card ecare-attendance-controls-card">
              <div className="ecare-attendance-controls-left">
                <div className="ecare-attendance-tabs">
                  <button 
                    onClick={() => setAttendanceSubView('logger')}
                    className="ecare-attendance-tab-btn"
                    style={{
                      background: attendanceSubView === 'logger' ? 'white' : 'transparent',
                      color: attendanceSubView === 'logger' ? 'var(--ecare-primary)' : '#64748b',
                      boxShadow: attendanceSubView === 'logger' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    Daily Attendance Logger
                  </button>
                  <button 
                    onClick={() => setAttendanceSubView('history')}
                    className="ecare-attendance-tab-btn"
                    style={{
                      background: attendanceSubView === 'history' ? 'white' : 'transparent',
                      color: attendanceSubView === 'history' ? 'var(--ecare-primary)' : '#64748b',
                      boxShadow: attendanceSubView === 'history' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                    }}
                  >
                    Monthly History Summary
                  </button>
                </div>

                <div className="ecare-attendance-divider" />

                <div className="ecare-attendance-date-group">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ecare-text-muted)', whiteSpace: 'nowrap' }}>Target Date:</span>
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={(d) => setSelectedDate(d)}
                    style={{ width: '150px' }}
                  />
                </div>
              </div>

              {attendanceSubView === 'logger' && (
                <button 
                  onClick={handleSaveAttendance}
                  className="ecare-button ecare-attendance-save-btn"
                >
                  <CheckCircle size={16} weight="bold" />
                  Save Daily Attendance
                </button>
              )}
            </div>

            {/* Logger Sub-view */}
            {attendanceSubView === 'logger' && (
              <>
                {/* Stats Overview */}
                <div className="ecare-stat-grid" style={{ '--stat-grid-cols': 5, '--stat-grid-cols-md': 3 }}>
                  <StatCard title="Total Staff" value={dailyStats.total} icon={Users} color="var(--ecare-primary)" delay={0.05} />
                  <StatCard title="Present" value={dailyStats.present} icon={CheckCircle} color="#16a34a" delay={0.1} />
                  <StatCard title="Late" value={dailyStats.late} icon={Timer} color="#f59e0b" delay={0.15} />
                  <StatCard title="Absent" value={dailyStats.absent} icon={WarningCircle} color="#ef4444" delay={0.2} />
                  <StatCard title="On Leave" value={dailyStats.leave} icon={CalendarBlank} color="#8b5cf6" delay={0.25} />
                </div>

                {/* Attendance grid */}
                <div className="ecare-card ecare-attendance-table-card">
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--ecare-text-main)' }}>
                    Active Personnel Registry Logs ({activeStaff.length})
                  </h3>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', minWidth: '150px' }}>Staff Member</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', minWidth: '160px' }}>Department</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', minWidth: '280px' }}>Log Status</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', minWidth: '310px', whiteSpace: 'nowrap' }}>Duty Timing</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', minWidth: '160px' }}>Attendance Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeStaff.map((member) => {
                          const log = dailyAttendance[member.id] || { status: 'Absent', check_in: '', check_out: '', shift_start: '09:00 AM', shift_end: '05:00 PM', notes: '' }
                          const isTimed = log.status !== 'On Leave'
                          const isSelf = String(member.user_id) === String(user?.id) || member.email === user?.email
                          
                          return (
                            <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <img src={member.avatar} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9' }} alt="" />
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--ecare-text-main)' }}>{member.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)' }}>{member.role}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Buildings size={12} /> {member.department || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                {!isAdmin ? (
                                  (() => {
                                    const opts = {
                                      'Present': { color: '#16a34a', bg: '#dcfce7' },
                                      'Late': { color: '#d97706', bg: '#fef3c7' },
                                      'Absent': { color: '#dc2626', bg: '#fee2e2' },
                                      'On Leave': { color: '#7c3aed', bg: '#f3e8ff' }
                                    }
                                    const opt = opts[log.status] || { color: '#64748b', bg: '#f1f5f9' }
                                    return (
                                      <span style={{ 
                                        color: opt.color, 
                                        background: opt.bg, 
                                        padding: '5px 14px', 
                                        borderRadius: '9999px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.025em',
                                        display: 'inline-block'
                                      }}>
                                        {log.status}
                                      </span>
                                    )
                                  })()
                                ) : (
                                  <div style={{ display: 'flex', background: '#f8fafc', borderRadius: '10px', padding: '3px', width: 'max-content', border: '1px solid #e2e8f0' }}>
                                    {[
                                      { value: 'Present', color: '#16a34a', bg: '#dcfce7' },
                                      { value: 'Late', color: '#d97706', bg: '#fef3c7' },
                                      { value: 'Absent', color: '#dc2626', bg: '#fee2e2' },
                                      { value: 'On Leave', color: '#7c3aed', bg: '#f3e8ff' }
                                    ].map(opt => {
                                      const isSelected = log.status === opt.value
                                      return (
                                        <button
                                          key={opt.value}
                                          onClick={() => updateMemberAttendanceField(member.id, 'status', opt.value)}
                                          style={{
                                            border: 'none',
                                            background: isSelected ? opt.bg : 'transparent',
                                            color: isSelected ? opt.color : '#64748b',
                                            padding: '5px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.025em'
                                          }}
                                        >
                                          {opt.value}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px' }}>
                                {!isAdmin ? (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ecare-text-main)' }}>
                                    {log.shift_start || '09:00 AM'} to {log.shift_end || '05:00 PM'}
                                  </span>
                                ) : (
                                  <div style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: isTimed ? 1 : 0.4, pointerEvents: isTimed ? 'auto' : 'none',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    <CustomTimePicker 
                                      value={log.shift_start || '09:00 AM'}
                                      onChange={(val) => updateMemberAttendanceField(member.id, 'shift_start', val)}
                                      style={{ width: '135px', minWidth: '135px' }}
                                      expandDirection="down"
                                    />
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, padding: '0 2px' }}>to</span>
                                    <CustomTimePicker 
                                      value={log.shift_end || '05:00 PM'}
                                      onChange={(val) => updateMemberAttendanceField(member.id, 'shift_end', val)}
                                      style={{ width: '135px', minWidth: '135px' }}
                                      expandDirection="down"
                                    />
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px' }}>
                                {!isTimed ? (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', fontStyle: 'italic' }}>
                                    Not applicable ({log.status})
                                  </span>
                                ) : (!isAdmin && !isSelf) ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {log.check_in ? (
                                      <span style={{ 
                                        fontSize: '0.7rem', 
                                        fontWeight: 700, 
                                        color: '#16a34a',
                                        background: '#dcfce7',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        <Check size={12} weight="bold" /> In: {log.check_in}
                                      </span>
                                    ) : null}
                                    {log.check_out ? (
                                      <span style={{ 
                                        fontSize: '0.7rem', 
                                        fontWeight: 700, 
                                        color: '#b91c1c',
                                        background: '#fee2e2',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        <Clock size={12} weight="bold" /> Out: {log.check_out}
                                      </span>
                                    ) : (log.check_in ? (
                                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, fontStyle: 'italic' }}>
                                        On Duty
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                        Not checked in
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {/* Not Checked In Yet */}
                                    {!log.check_in && (
                                      <button
                                        onClick={() => {
                                          const now = new Date()
                                          let hours = now.getHours()
                                          const minutes = now.getMinutes().toString().padStart(2, '0')
                                          const period = hours >= 12 ? 'PM' : 'AM'
                                          hours = hours % 12
                                          hours = hours ? hours : 12
                                          const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${period}`
                                          
                                          // Parse scheduled shift start minutes
                                          const timeToMinutes = (tStr) => {
                                            if (!tStr) return 540
                                            const parts = tStr.split(' ')
                                            if (parts.length < 2) return 540
                                            const hm = parts[0].split(':')
                                            let h = parseInt(hm[0]) || 0
                                            const m = parseInt(hm[1]) || 0
                                            const isPM = parts[1].toUpperCase() === 'PM'
                                            if (isPM && h !== 12) h += 12
                                            if (!isPM && h === 12) h = 0
                                            return h * 60 + m
                                          }
                                          
                                          const shiftStartVal = log.shift_start || '09:00 AM'
                                          const shiftEndVal = log.shift_end || '05:00 PM'
                                          const shiftStartMinutes = timeToMinutes(shiftStartVal)
                                          const shiftEndMinutes = timeToMinutes(shiftEndVal)
                                          const currentMinutes = now.getHours() * 60 + now.getMinutes()
                                          
                                          // Auto-status: Absent if checking in after shift ends; Late if >15m late; else Present
                                          let status = 'Present'
                                          if (currentMinutes > shiftEndMinutes) {
                                            status = 'Absent'
                                          } else if (currentMinutes > (shiftStartMinutes + 15)) {
                                            status = 'Late'
                                          }
                                          
                                          updateMemberAttendanceField(member.id, 'check_in', timeStr)
                                          updateMemberAttendanceField(member.id, 'status', status)
                                        }}
                                        style={{
                                          background: 'var(--ecare-primary-bg)',
                                          color: 'var(--ecare-primary)',
                                          border: '1px solid var(--ecare-primary)',
                                          padding: '5px 12px',
                                          borderRadius: '8px',
                                          fontSize: '0.7rem',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          transition: 'all 0.2s'
                                        }}
                                      >
                                        <Timer size={14} weight="bold" />
                                        Log Check In
                                      </button>
                                    )}

                                    {/* Checked In but Not Checked Out */}
                                    {log.check_in && !log.check_out && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ 
                                          fontSize: '0.72rem', 
                                          fontWeight: 700, 
                                          color: 'var(--ecare-primary)',
                                          background: 'var(--ecare-primary-bg)',
                                          padding: '4px 8px',
                                          borderRadius: '6px'
                                        }}>
                                          In: {log.check_in}
                                        </span>
                                        <button
                                          onClick={() => {
                                            const now = new Date()
                                            let hours = now.getHours()
                                            const minutes = now.getMinutes().toString().padStart(2, '0')
                                            const period = hours >= 12 ? 'PM' : 'AM'
                                            hours = hours % 12
                                            hours = hours ? hours : 12
                                            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${period}`
                                            
                                            // Parse minutes
                                            const timeToMinutes = (tStr) => {
                                              if (!tStr) return 540
                                              const parts = tStr.split(' ')
                                              if (parts.length < 2) return 540
                                              const hm = parts[0].split(':')
                                              let h = parseInt(hm[0]) || 0
                                              const m = parseInt(hm[1]) || 0
                                              const isPM = parts[1].toUpperCase() === 'PM'
                                              if (isPM && h !== 12) h += 12
                                              if (!isPM && h === 12) h = 0
                                              return h * 60 + m
                                            }

                                            const shiftStartVal = log.shift_start || '09:00 AM'
                                            const shiftEndVal = log.shift_end || '05:00 PM'
                                            const shiftStartMinutes = timeToMinutes(shiftStartVal)
                                            const shiftEndMinutes = timeToMinutes(shiftEndVal)
                                            const checkInMinutes = timeToMinutes(log.check_in)
                                            const checkOutMinutes = now.getHours() * 60 + now.getMinutes()

                                            // Determine final status
                                            let status = log.status || 'Present'
                                            // Both before start OR both after end => Absent
                                            if ((checkInMinutes < shiftStartMinutes && checkOutMinutes < shiftStartMinutes) || 
                                                (checkInMinutes > shiftEndMinutes && checkOutMinutes > shiftEndMinutes)) {
                                              status = 'Absent'
                                            } else {
                                              status = checkInMinutes > (shiftStartMinutes + 15) ? 'Late' : 'Present'
                                            }

                                            updateMemberAttendanceField(member.id, 'check_out', timeStr)
                                            updateMemberAttendanceField(member.id, 'status', status)
                                          }}
                                          style={{
                                            background: '#fef3c7',
                                            color: '#d97706',
                                            border: '1px solid #d97706',
                                            padding: '5px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                          }}
                                        >
                                          <Clock size={14} weight="bold" />
                                          Check Out
                                        </button>
                                      </div>
                                    )}

                                    {/* Fully Completed */}
                                    {log.check_in && log.check_out && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                          <span style={{ 
                                            fontSize: '0.68rem', 
                                            fontWeight: 700, 
                                            color: '#16a34a',
                                            background: '#dcfce7',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            width: 'max-content'
                                          }}>
                                            <Check size={10} weight="bold" />
                                            In: {log.check_in}
                                          </span>
                                          <span style={{ 
                                            fontSize: '0.68rem', 
                                            fontWeight: 700, 
                                            color: '#b91c1c',
                                            background: '#fee2e2',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            width: 'max-content'
                                          }}>
                                            <Clock size={10} weight="bold" />
                                            Out: {log.check_out}
                                          </span>
                                        </div>
                                        {isAdmin && (
                                          <button
                                            onClick={() => {
                                              updateMemberAttendanceField(member.id, 'check_in', '')
                                              updateMemberAttendanceField(member.id, 'check_out', '')
                                              updateMemberAttendanceField(member.id, 'status', 'Absent')
                                            }}
                                            style={{
                                              background: 'transparent',
                                              color: '#64748b',
                                              border: 'none',
                                              fontSize: '0.65rem',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                              textDecoration: 'underline'
                                            }}
                                          >
                                            Reset
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* History Sub-view */}
            {attendanceSubView === 'history' && (
              viewingHistoryStaff ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="ecare-card"
                  style={{ padding: '2rem', border: 'none', background: 'white', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  {/* Inline Panel Header */}
                  <div className="ecare-attendance-history-header" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0',
                    flexWrap: 'wrap', gap: '1rem'
                  }}>
                    <div className="ecare-attendance-history-header-left" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <button 
                        onClick={() => setViewingHistoryStaff(null)} 
                        className="ecare-btn-secondary"
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '6px', 
                          fontSize: '0.75rem', fontWeight: 800, color: '#475569',
                          padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                          cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'white'
                        }}
                      >
                        <ArrowLeft size={14} weight="bold" />
                        Back to Ledger
                      </button>
                      <div className="ecare-attendance-divider" style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={viewingHistoryStaff.avatar} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9' }} alt="" />
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ecare-text-main)', margin: 0 }}>
                            {viewingHistoryStaff.name}
                          </h3>
                          <p style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)', margin: '2px 0 0', fontWeight: 600 }}>
                            Individual Calendar History Logs
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Month/Year Selection */}
                    <div className="ecare-attendance-history-period" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Period:</span>
                      <div style={{ display: 'flex', gap: '8px', width: '220px' }}>
                        <div style={{ flex: 1 }}>
                          <CustomSelect
                            value={historyYearMonth.split('-')[1]}
                            onChange={(newMonth) => {
                              const yr = historyYearMonth.split('-')[0]
                              setHistoryYearMonth(`${yr}-${newMonth}`)
                              setEditingAttendanceRecordId(null)
                            }}
                            options={[
                              { value: '01', label: 'January' },
                              { value: '02', label: 'February' },
                              { value: '03', label: 'March' },
                              { value: '04', label: 'April' },
                              { value: '05', label: 'May' },
                              { value: '06', label: 'June' },
                              { value: '07', label: 'July' },
                              { value: '08', label: 'August' },
                              { value: '09', label: 'September' },
                              { value: '10', label: 'October' },
                              { value: '11', label: 'November' },
                              { value: '12', label: 'December' }
                            ]}
                            customTriggerStyle={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, minWidth: 'unset', height: '32px' }}
                          />
                        </div>
                        <div style={{ width: '80px' }}>
                          <CustomSelect
                            value={historyYearMonth.split('-')[0]}
                            onChange={(newYear) => {
                              const mn = historyYearMonth.split('-')[1]
                              setHistoryYearMonth(`${newYear}-${mn}`)
                              setEditingAttendanceRecordId(null)
                            }}
                            options={[
                              { value: '2024', label: '2024' },
                              { value: '2025', label: '2025' },
                              { value: '2026', label: '2026' },
                              { value: '2027', label: '2027' },
                              { value: '2028', label: '2028' }
                            ]}
                            customTriggerStyle={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, minWidth: 'unset', height: '32px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inline Layout Content Split */}
                  {(() => {
                    const [year, month] = historyYearMonth.split('-').map(Number)
                    const daysInMonth = new Date(year, month, 0).getDate()
                    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

                    return (
                      <div className="ecare-attendance-history-split" style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem',
                        width: '100%', boxSizing: 'border-box'
                      }}>
                        {/* Left Side: interactive calendar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--ecare-text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Attendance Grid</h4>
                          </div>

                          <div className="ecare-keep-grid" style={{ 
                            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', 
                            background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' 
                          }}>
                            {daysArray.map((dayNum) => {
                              const dayString = `${historyYearMonth}-${String(dayNum).padStart(2, '0')}`
                              const log = (staffAttendance || []).find(
                                record => String(record.staff_id) === String(viewingHistoryStaff.id) && record.date === dayString
                              )
                              
                              const getDotColor = (status) => {
                                if (status === 'Present') return '#16a34a'
                                if (status === 'Late') return '#f59e0b'
                                if (status === 'Absent') return '#ef4444'
                                if (status === 'On Leave') return '#7c3aed'
                                return '#e2e8f0'
                              }

                              const isEditingThisDay = editingAttendanceRecordId === (log ? log.id : `new-${dayString}`)
                              
                              return (
                                <div 
                                  key={dayNum} 
                                  onClick={() => {
                                    if (!isAdmin) return
                                    if (log) {
                                      setEditingAttendanceRecordId(log.id)
                                      setAttendanceEditForm({
                                        status: log.status || 'Absent',
                                        check_in: log.check_in || '',
                                        check_out: log.check_out || '',
                                        notes: log.notes || ''
                                      })
                                    } else {
                                      setEditingAttendanceRecordId(`new-${dayString}`)
                                      setAttendanceEditForm({
                                        status: 'Absent',
                                        check_in: '',
                                        check_out: '',
                                        notes: ''
                                      })
                                    }
                                  }}
                                  style={{ 
                                    aspectRatio: '1', display: 'flex', flexDirection: 'column', 
                                    alignItems: 'center', justifyContent: 'center', background: 'white',
                                    borderRadius: '8px', 
                                    border: isEditingThisDay 
                                      ? '2.5px solid var(--ecare-primary)' 
                                      : (log ? `1.5px solid ${getDotColor(log.status)}` : '1px solid #e2e8f0'),
                                    boxShadow: isEditingThisDay ? '0 0 0 3px var(--ecare-primary-bg)' : 'none',
                                    position: 'relative',
                                    cursor: isAdmin ? 'pointer' : 'default',
                                    transition: 'all 0.15s',
                                    transform: isEditingThisDay ? 'scale(1.05)' : 'none'
                                  }}
                                >
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>{dayNum}</span>
                                  {log && (
                                    <div style={{ 
                                      position: 'absolute', bottom: '4px', width: '5px', height: '5px', 
                                      borderRadius: '50%', background: getDotColor(log.status) 
                                    }} />
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Legend */}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', fontSize: '0.7rem', fontWeight: 800 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} /> PRESENT
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> LATE
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> ABSENT
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7c3aed' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} /> LEAVE
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Timeline & inline Editor */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                            <h4 style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>History Logs</h4>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
                              {(() => {
                                const records = (staffAttendance || [])
                                  .filter(record => String(record.staff_id) === String(viewingHistoryStaff.id) && record.date.startsWith(historyYearMonth))
                                  .sort((a,b) => b.date.localeCompare(a.date))
                                  
                                if (records.length === 0) {
                                  return (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--ecare-text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                                      No records found for this period.
                                    </div>
                                  )
                                }
                                
                                return records.map(record => (
                                  <div 
                                    key={record.id} 
                                    style={{ 
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                      padding: '8px 10px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' 
                                    }}
                                  >
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>{record.date}</span>
                                        {isAdmin && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingAttendanceRecordId(record.id)
                                              setAttendanceEditForm({
                                                status: record.status || 'Absent',
                                                check_in: record.check_in || '',
                                                check_out: record.check_out || '',
                                                notes: record.notes || ''
                                              })
                                            }}
                                            style={{
                                              background: 'none', border: 'none', color: 'var(--ecare-primary)',
                                              fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                                              padding: 0, textDecoration: 'underline'
                                            }}
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </div>
                                      {record.notes && <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '2px 0 0' }}>💡 {record.notes}</p>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {record.check_in && (
                                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                                          🕒 {record.check_in}
                                        </span>
                                      )}
                                      <span style={{ 
                                        fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: '12px',
                                        background: record.status === 'Present' ? '#dcfce7' : record.status === 'Late' ? '#fef3c7' : record.status === 'Absent' ? '#fee2e2' : '#f3e8ff',
                                        color: record.status === 'Present' ? '#16a34a' : record.status === 'Late' ? '#d97706' : record.status === 'Absent' ? '#dc2626' : '#7c3aed'
                                      }}>
                                        {record.status}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              })()}
                            </div>
                          </div>

                          {/* Quick Editor */}
                          {isAdmin && (
                            <div style={{ border: '1px solid var(--ecare-primary-light)', borderRadius: '12px', padding: '1rem', background: 'white' }}>
                              {editingAttendanceRecordId ? (() => {
                                const editingDateStr = String(editingAttendanceRecordId).startsWith('new-') 
                                  ? String(editingAttendanceRecordId).substring(4) 
                                  : ((staffAttendance || []).find(r => r.id === editingAttendanceRecordId)?.date || '')

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ecare-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} weight="bold" />
                                        Log Editor: {editingDateStr}
                                      </span>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button 
                                          type="button"
                                          onClick={() => handleSaveMonthlyLog(editingAttendanceRecordId)}
                                          className="ecare-button"
                                          style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px', height: '26px', fontWeight: 800 }}
                                        >
                                          Save
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => setEditingAttendanceRecordId(null)}
                                          className="ecare-btn-secondary"
                                          style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px', height: '26px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 800 }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                                      <div>
                                        <label style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Status</label>
                                        <CustomSelect 
                                          value={attendanceEditForm.status} 
                                          onChange={(val) => setAttendanceEditForm(prev => ({ ...prev, status: val }))}
                                          options={[
                                            { value: 'Present', label: 'Present' },
                                            { value: 'Late', label: 'Late' },
                                            { value: 'Absent', label: 'Absent' },
                                            { value: 'On Leave', label: 'On Leave' }
                                          ]}
                                          customTriggerStyle={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, minWidth: 'unset', height: '32px' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Check In</label>
                                        <CustomTimePicker 
                                          value={attendanceEditForm.check_in}
                                          onChange={(val) => setAttendanceEditForm(prev => ({ ...prev, check_in: val }))}
                                          placeholder="09:00 AM"
                                          expandDirection="up"
                                          style={{ height: '32px' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Check Out</label>
                                        <CustomTimePicker 
                                          value={attendanceEditForm.check_out}
                                          onChange={(val) => setAttendanceEditForm(prev => ({ ...prev, check_out: val }))}
                                          placeholder="05:00 PM"
                                          expandDirection="up"
                                          style={{ height: '32px' }}
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Notes</label>
                                      <input 
                                        type="text" 
                                        value={attendanceEditForm.notes || ''}
                                        onChange={(e) => setAttendanceEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Add notes..."
                                        style={{ width: '100%', padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 500, height: '32px', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                  </div>
                                )
                              })() : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ecare-text-muted)', padding: '1rem', textAlign: 'center', gap: '4px' }}>
                                  <Clock size={24} style={{ color: 'var(--ecare-primary)', opacity: 0.7 }} />
                                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-main)' }}>No Date Selected</p>
                                  <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--ecare-text-muted)' }}>Click any day on the calendar to update logs</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </motion.div>
              ) : (
                <div className="ecare-card ecare-attendance-table-card">
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--ecare-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Article size={20} weight="duotone" color="var(--ecare-primary)" />
                    Monthly Performance Ledger Breakdown ({selectedDate.substring(0, 7)})
                  </h3>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase' }}>Staff Member</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Present Days</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Late Days</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Absent Days</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Leaves Approved</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Attendance Rate</th>
                          <th style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ecare-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Logs Timeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummaryData.map(({ member, present, late, absent, leave, total, rate }) => (
                          <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={member.avatar} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9' }} alt="" />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--ecare-text-main)' }}>{member.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--ecare-text-muted)' }}>{member.role}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{present}</td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#d97706' }}>{late}</td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>{absent}</td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#7c3aed' }}>{leave}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ 
                                  width: '36px', height: '36px', borderRadius: '50%', background: rate >= 90 ? '#dcfce7' : rate >= 75 ? '#fef3c7' : '#fee2e2',
                                  color: rate >= 90 ? '#16a34a' : rate >= 75 ? '#d97706' : '#dc2626',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
                                }}>
                                  {rate}%
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setHistoryYearMonth(selectedDate.substring(0, 7))
                                  setViewingHistoryStaff(member)
                                  setEditingAttendanceRecordId(null)
                                }}
                                className="ecare-btn-secondary"
                                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              >
                                <CalendarBlank size={12} />
                                View Calendar logs
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Add Modal */}
      <Portal>
        <AnimatePresence>
          {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="ecare-card"
              style={{ 
                width: '100%', maxWidth: '1000px', position: 'relative', 
                padding: 0, border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCircle size={20} weight="bold" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                      {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 400 }}>Configure user credentials and access permissions</p>
                  </div>
                </div>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', borderRadius: '6px' }}>
                  <X size={18} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ padding: '1.5rem', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem' }}>
                {/* Left Column: Personal Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Avatar Section — Re-styled to match inputs */}
                  <div className="ecare-form-group">
                    <label className="ecare-label">Profile Image</label>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', 
                      padding: '0.625rem 1rem', background: 'white', 
                      borderRadius: '12px', border: '1.5px solid #e2e8f0',
                      transition: 'border-color 0.2s'
                    }}>
                      <img 
                        src={form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name || 'Staff'}`} 
                        style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', background: '#f8fafc' }} 
                        alt="Avatar" 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ecare-text-main)' }}>
                          {form.avatar ? 'Custom Photo Uploaded' : 'System Default Avatar'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Click "Change" to upload a custom photo</div>
                      </div>
                      <button 
                        type="button" onClick={handleAvatarUpload}
                        style={{ 
                          background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)', 
                          border: 'none', padding: '6px 12px', borderRadius: '8px', 
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' 
                        }}
                      >
                        Change Image
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Full Name</label>
                      {nameExists && <DuplicateAlert message="A user with this name already exists!" />}
                      <input 
                        type="text" className="ecare-input" placeholder="e.g. Jane Doe" required
                        value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} 
                        style={{ borderColor: nameExists ? '#f87171' : '' }}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Department</label>
                      <input 
                        type="text" className="ecare-input" placeholder="e.g. Reception"
                        value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Email Address</label>
                      {emailExists && <DuplicateAlert message="This email is already in use!" />}
                      <input 
                        type="email" className="ecare-input" placeholder="jane@example.com" required
                        value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} 
                        style={{ borderColor: emailExists ? '#f87171' : '' }}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Phone Number</label>
                      <input 
                        type="text" className="ecare-input" placeholder="+1 234..." required
                        value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="ecare-form-group">
                    <label className="ecare-label">Staff Role & Presets</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {Object.keys(ROLE_PRESETS).map(role => {
                        const isActive = form.role === role;
                        return (
                          <button 
                            key={role} type="button" 
                            onClick={() => applyPreset(role)}
                            style={{ 
                              fontSize: '0.7rem', padding: '0.4rem 1.1rem', borderRadius: '999px', 
                              border: `1.5px solid ${isActive ? '#bcf0da' : '#e2e8f0'}`,
                              background: isActive ? 'var(--ecare-primary-bg)' : 'white',
                              color: isActive ? '#16a34a' : '#475569',
                              fontWeight: 700, transition: 'all 0.2s ease', cursor: 'pointer',
                              boxShadow: isActive ? '0 2px 4px rgba(22, 163, 74, 0.05)' : 'none',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                    <input 
                      type="text" className="ecare-input" placeholder="Enter custom role title..." required
                      value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Work Status</label>
                      <CustomSelect 
                        value={form.status}
                        onChange={(val) => setForm({...form, status: val})}
                        options={[
                          { value: 'Active', label: 'Active' },
                          { value: 'On Leave', label: 'On Leave' },
                          { value: 'Offline', label: 'Offline' }
                        ]}
                        style={{ width: '100%' }}
                        customTriggerStyle={{ borderRadius: '12px', padding: '0.625rem 0.875rem' }}
                      />
                    </div>
                    <div className="ecare-form-group">
                      <label className="ecare-label">Account Password</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                           type="text" className="ecare-input" placeholder="Set login password" required={!editingStaff}
                          value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} 
                          style={{ paddingRight: '4rem' }}
                        />
                        <button 
                          type="button" onClick={generatePassword}
                          style={{ 
                            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                            background: 'var(--ecare-primary-bg)', color: 'var(--ecare-primary)',
                            border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem',
                            fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" onClick={closeModal} className="ecare-btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px' }}>Cancel</button>
                    <button type="submit" className="ecare-button" style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={18} weight="bold" /> {editingStaff ? 'Save Changes' : 'Register Staff'}
                    </button>
                  </div>
                </div>

                {/* Right Column: Permissions */}
                <div style={{ padding: '1rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CheckCircle size={20} color="var(--ecare-primary)" weight="fill" />
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ecare-text-main)', display: 'block' }}>Abilities & Permissions</span>
                    </div>
                  </div>
                  
                  <div style={{ height: 'calc(100% - 40px)', overflowY: 'auto', paddingRight: '4px' }} className="ecare-scrollbar">
                    {STAFF_ABILITY_GROUPS.map((group, gIdx) => (
                      <PermissionGroup 
                        key={gIdx} 
                        group={group} 
                        permissions={form.permissions} 
                        onToggle={togglePermission} 
                      />
                    ))}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>
      </Portal>
    </motion.div>
  )
}

export default StaffManagement
